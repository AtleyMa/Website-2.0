import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Typography, 
  Button, 
  Card,
  Alert,
  Input,
  Space
} from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

const { Title, Paragraph, Text } = Typography

const VerifyPhonePage = () => {
  const [code, setCode] = useState(['', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resending, setResending] = useState(false)
  const inputRefs = [useRef(), useRef(), useRef(), useRef()]
  const { verifyPhone, resendCode, pendingVerification } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    inputRefs[0].current?.focus()
    
    if (!pendingVerification || pendingVerification.type !== 'password-reset') {
      navigate('/forgot-password')
    }
  }, [pendingVerification, navigate])

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus()
    }

    if (value && index === 3 && newCode.every(d => d)) {
      handleSubmit(newCode.join(''))
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pastedData.length === 4) {
      setCode(pastedData.split(''))
      handleSubmit(pastedData)
    }
  }

  const handleSubmit = async (verificationCode) => {
    setLoading(true)
    setError(null)

    const result = await verifyPhone(verificationCode)

    if (result.success) {
      navigate('/reset-password')
    } else {
      setError(result.error)
      setCode(['', '', '', ''])
      inputRefs[0].current?.focus()
    }
    setLoading(false)
  }

  const handleResend = async () => {
    setResending(true)
    await resendCode()
    setResending(false)
  }

  return (
    <div 
      className="fade-in"
      style={{ 
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px'
      }}
    >
      <Card 
        style={{ 
          maxWidth: 450, 
          width: '100%',
          borderRadius: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          border: 'none'
        }}
        bodyStyle={{ padding: '48px 40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img 
            src="/logo.png" 
            alt="SodaKid" 
            style={{ height: 60, marginBottom: 24 }}
          />
          <Title level={2} style={{ marginBottom: 8 }}>Verify Phone Number</Title>
          <Paragraph style={{ color: colors.textSecondary }}>
            Enter the 4-digit code we sent to your phone to reset your password.
          </Paragraph>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        <div style={{ marginBottom: 32 }}>
          <Space size={12} style={{ display: 'flex', justifyContent: 'center' }}>
            {code.map((digit, index) => (
              <Input
                key={index}
                ref={inputRefs[index]}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                maxLength={1}
                style={{
                  width: 64,
                  height: 64,
                  fontSize: 28,
                  textAlign: 'center',
                  fontWeight: 600,
                  borderRadius: 12
                }}
              />
            ))}
          </Space>
        </div>

        <Button 
          type="primary" 
          loading={loading}
          disabled={code.some(d => !d)}
          onClick={() => handleSubmit(code.join(''))}
          style={{ 
            width: '100%',
            height: 48,
            fontSize: 16,
            fontWeight: 500,
            marginBottom: 24
          }}
        >
          Verify Code
        </Button>

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">Didn't receive the code? </Text>
          <Button 
            type="link" 
            onClick={handleResend}
            loading={resending}
            icon={<ReloadOutlined />}
            style={{ padding: 0, color: colors.primary }}
          >
            Resend Code
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default VerifyPhonePage
