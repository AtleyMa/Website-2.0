# Local Testing Guide

## Prerequisites
- Node.js 18+ 
- Python 3.10+
- MariaDB (or MySQL)

## Option 1: Connect to Your AWS MariaDB (Easiest)

If your AWS MariaDB allows external connections:

1. **Update your config.env:**
   ```env
   DB_HOST=your-aws-rds-endpoint.amazonaws.com
   DB_NAME=sodakid
   DB_USER=your-aws-db-user
   DB_PASSWORD=your-aws-db-password
   ```

2. **Make sure your AWS security group allows your IP**
   - Go to AWS Console → RDS → Your database → Security Group
   - Add inbound rule: MySQL/Aurora (3306) from your IP

## Option 2: Install MariaDB Locally

### Windows:
1. Download from https://mariadb.org/download/
2. Run installer, set root password
3. Open HeidiSQL or MySQL Workbench
4. Create database: `CREATE DATABASE sodakid;`
5. Import your schema (export from AWS first)

### Quick Install via Chocolatey:
```powershell
choco install mariadb
mysql -u root -p -e "CREATE DATABASE sodakid;"
```

## Option 3: Use Docker (Recommended for Dev)

```powershell
# Run MariaDB in Docker
docker run -d --name sodakid-db -p 3306:3306 -e MYSQL_ROOT_PASSWORD=dev123 -e MYSQL_DATABASE=sodakid mariadb:10.11

# Your config.env:
DB_HOST=localhost
DB_NAME=sodakid  
DB_USER=root
DB_PASSWORD=dev123
```

## Starting the Development Servers

### 1. Start the API (Backend)
```powershell
cd new-website/api
.\venv\Scripts\Activate.ps1
python app.py
```
→ Runs on http://localhost:5000

### 2. Start the Frontend
```powershell
cd new-website/frontend
npm run dev
```
→ Runs on http://localhost:3002

## Google OAuth Setup (Optional)

1. Go to https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
4. Add credentials to config.env:
   ```env
   GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxx
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   FRONTEND_URL=http://localhost:3002
   ```

## Folder Structure

```
new-website/
├── api/              # Flask backend
│   ├── app.py        # Main entry
│   ├── config.env    # Your secrets (gitignored)
│   ├── routes/       # API endpoints
│   └── services/     # Business logic
└── frontend/         # React frontend  
    ├── src/pages/    # Page components
    └── public/       # Static assets
```

## Common Issues

**"Google OAuth not configured"**  
→ You haven't added GOOGLE_CLIENT_ID to config.env. This is optional - regular login still works.

**"Cannot connect to database"**
→ Check DB_HOST, DB_USER, DB_PASSWORD in config.env match your MariaDB setup.

**CORS errors**
→ The API already has CORS enabled for localhost:3002. If using different port, update app.py.
