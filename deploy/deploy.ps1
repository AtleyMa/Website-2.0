<#
.SYNOPSIS
  One-command deploy for SodaKid prod (Windows Server / IIS + ARR / waitress).

.DESCRIPTION
  - git pull latest code
  - apply idempotent DB migrations (credential read from api\config.env)
  - build the frontend with VITE_API_URL=/api (prevents the localhost leak)
  - robocopy /E dist -> IIS site folder (NEVER /MIR, so web.config survives)
  - ensure the correct web.config is in place
  - verify the bundle has no localhost API URL baked in
  - restart waitress (backend)
  - health-check /api/health == 2.0.0 and / serves the app; fail loudly
  - confirm the background scheduler (daily summary + reorder nudges) is live

Run with:
  .\deploy\deploy.ps1   (from repo root)
.PARAMETER SkipPull
  Skip the git pull (useful if you already pulled).
.PARAMETER SkipMigrations
  Skip the DB migration step.
#>

param(
  [switch]$SkipPull,
  [switch]$SkipMigrations
)

# Native commands (git, npm, mysql, robocopy) write benign chatter to stderr
# (e.g. "Already up to date", "npm warn deprecated"). With ErrorActionPreference
# set to Stop, some PowerShell builds promote that stderr into a FATAL
# NativeCommandError. So we use 'Continue' and instead explicitly check
# $LASTEXITCODE after every step - which correctly catches real failures.
$ErrorActionPreference = 'Continue'

# --- Paths ---------------------------------------------------------------
# This script lives at <repo>\deploy\deploy.ps1
$repoRoot   = Split-Path -Parent $PSScriptRoot
$branch     = 'clean-dev'
$frontend   = Join-Path $repoRoot 'new-website\frontend'
$api        = Join-Path $repoRoot 'new-website\api'
$configEnv  = Join-Path $api 'config.env'
$siteDir    = 'C:\sodakid.ca\site'
$webConfig  = Join-Path $siteDir 'web.config'
$webConfigSrc = Join-Path $PSScriptRoot 'web.config.prod'

function Say($msg) { Write-Host "[deploy] $msg" -ForegroundColor Cyan }
function Fail($msg) { Write-Host "[deploy] FAILED: $msg" -ForegroundColor Red; exit 1 }

# Read a KEY=VALUE pair out of api\config.env (industry-standard: never hardcode secrets here)
function Get-ConfigEnv([string]$file, [string]$key) {
  if (-not (Test-Path $file)) { return $null }
  foreach ($line in Get-Content $file) {
    $trimmed = $line.Trim()
    if ($trimmed -eq '' -or $trimmed.StartsWith('#')) { continue }
    $parts = $trimmed -split '=', 2
    if ($parts[0].Trim() -eq $key) { return $parts[1].Trim() }
  }
  return $null
}

# Locate the mysql/mariadb CLI. Not always on PATH on Windows; check the
# standard install locations before giving up.
function Get-MysqlPath {
  $cmd = Get-Command mysql -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $candidates = @(
    'C:\Program Files\MariaDB*\bin\mysql.exe',
    'C:\Program Files\MySQL\MySQL Server*\bin\mysql.exe',
    'C:\mariadb\bin\mysql.exe',
    'C:\xampp\mysql\bin\mysql.exe',
    'C:\wamp64\bin\mariadb*\bin\mysql.exe',
    'C:\wamp64\bin\mysql\*\bin\mysql.exe'
  )
  foreach ($pattern in $candidates) {
    $found = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }
  }
  return $null
}

# --- 1. Pull latest -------------------------------------------------------
if (-not $SkipPull) {
  Say "Pulling latest code on branch $branch"
  Push-Location $repoRoot
  git checkout --quiet $branch
  if ($LASTEXITCODE -ne 0) { Pop-Location; Fail "git checkout $branch failed" }
  git pull 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) { Pop-Location; Fail 'git pull failed' }
  Pop-Location
}

# --- 2. DB migrations (idempotent) ----------------------------------------
if (-not $SkipMigrations) {
  $dbUser = Get-ConfigEnv $configEnv 'DB_USER'
  $dbPass = Get-ConfigEnv $configEnv 'DB_PASSWORD'
  $dbName = Get-ConfigEnv $configEnv 'DB_NAME'
  if (-not $dbUser -or -not $dbName) { Fail 'DB_USER/DB_NAME missing from api\config.env' }

  Say "Applying DB migrations (idempotent) to $dbName"
  $mysql = Get-MysqlPath
  if (-not $mysql) { Fail "mysql CLI not found on PATH or standard install locations. Edit deploy.ps1 Get-MysqlPath." }
  Say "Using mysql at: $mysql"
  $env:MYSQL_PWD = $dbPass
  try {
    $alterSql = @"
ALTER TABLE exchanges ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled' AFTER can_type;
ALTER TABLE exchanges ADD COLUMN IF NOT EXISTS nudge_sent_at DATETIME DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(100) DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_paid INT DEFAULT NULL;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'paid';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP NULL DEFAULT NULL;
"@
    $alterSql | & $mysql -u $dbUser $dbName
    if ($LASTEXITCODE -ne 0) { Fail 'DB migration failed (mysql exited non-zero)' }
  } finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
  }
} else {
  Say "Skipping DB migrations"
}

# --- 3. Build frontend with the PROD base URL ------------------------------
Say "Building frontend with VITE_API_URL=/api"
Push-Location $frontend
$env:VITE_API_URL = '/api'
npm ci 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail 'npm ci failed' }
npm run build 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { Pop-Location; Fail 'npm run build failed' }
Pop-Location

# --- 4. Ship dist -> IIS site (preserve web.config; NO /MIR) ---------------
Say "Copying dist -> $siteDir (robocopy /E, web.config preserved)"
$dist = Join-Path $frontend 'dist'
if (-not (Test-Path $dist)) { Fail "dist not found at $dist" }
robocopy $dist $siteDir /E /NFL /NDL /NJH /NJS /NP
if (($LASTEXITCODE -ge 8)) { Fail "robocopy failed (code $LASTEXITCODE)" }

# --- 5. Ensure web.config is in place --------------------------------------
if (-not (Test-Path $webConfig)) {
  Say 'web.config missing - installing from deploy\web.config.prod'
  Copy-Item $webConfigSrc $webConfig -Force
} else {
  Say 'web.config present - leaving as-is'
}

# --- 6. Guard: no localhost API URL may exist in the bundle ----------------
Say 'Checking bundle for localhost API leakage...'
$leak = Select-String -Path (Join-Path $siteDir 'assets\*.js') -Pattern 'http://localhost' -SimpleMatch -ErrorAction SilentlyContinue
if ($leak) { Fail "Bundle still contains 'http://localhost' - redeploy would break API. Stop." }

# --- 7. Restart waitress (backend) ------------------------------------------
Say 'Restarting waitress backend'
Stop-Process -Name python -Force -ErrorAction SilentlyContinue
Start-Sleep 2
Push-Location $api
Start-Process -NoNewWindow -FilePath 'waitress-serve' -ArgumentList '--listen=127.0.0.1:5000','app:app' -WorkingDirectory $api
Pop-Location

# --- 8. Verification: fail loudly if not actually up ------------------------
Start-Sleep 5
try {
  $health = Invoke-WebRequest -Uri 'http://127.0.0.1:5000/api/health' -UseBasicParsing -TimeoutSec 15
  if ($health.StatusCode -ne 200 -or $health.Content -notmatch '"version"\s*:\s*"2\.0\.0"') {
    Fail "Health check did not return 2.0.0. Got: $($health.Content)"
  }
  Say 'OK: /api/health returns 2.0.0'
} catch {
  Fail "Backend health check failed: $($_.Exception.Message)"
}

try {
  $front = Invoke-WebRequest -Uri 'http://localhost/' -UseBasicParsing -TimeoutSec 15
  if ($front.StatusCode -ne 200) { Fail "Site root returned HTTP $($front.StatusCode)" }
  Say 'OK: site root serves the app'
} catch {
  Fail "Frontend check failed (is IIS up?): $($_.Exception.Message)"
}

# --- 9. Scheduler check: confirm the background jobs are live ---------------
# Logs in as admin and reads /api/admin/scheduler (same process as waitress,
# so this reflects the actual running scheduler, not a second instance).
$adminPw = Get-ConfigEnv $configEnv 'ADMIN_PASSWORD'
if ($adminPw) {
  try {
    $login = Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/admin/login' -Method Post -Body ('{"password":"' + $adminPw + '"}') -ContentType 'application/json'
    $sched = Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/admin/scheduler' -Headers @{ 'X-Admin-Token' = $login.token }
    if ($sched.scheduler -ne 'running' -or $sched.jobs.Count -lt 2) {
      Fail "Scheduler not running correctly. Got: $($sched | ConvertTo-Json -Compress)"
    }
    Say "OK: scheduler running. Jobs: $(($sched.jobs | ForEach-Object { $_.id + ' -> ' + $_.nextRun }) -join ', ')"
  } catch {
    Fail "Scheduler check failed: $($_.Exception.Message)"
  }
} else {
  Write-Host '[deploy] WARNING: ADMIN_PASSWORD not found in config.env - skipped scheduler check' -ForegroundColor Yellow
}

Say 'Deploy complete.'