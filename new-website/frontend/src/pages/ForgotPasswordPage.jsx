import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Typography, 
  Form, 
  Input, 
  Button, 
  Card,
  Alert
} from 'antd'
import { PhoneOutlined } from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

const { Title, Paragraph } = Typography

const ForgotPasswordPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    setError(null)

    const result = await forgotPassword(values.phone)

    if (result.success) {
      navigate('/verify-phone')
    } else {
      setError(result.error)
    }
    setLoading(false)
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
          <Title level={2} style={{ marginBottom: 8 }}>Forgot Password</Title>
          <Paragraph style={{ color: colors.textSecondary }}>
            Enter your phone number and we'll send you a verification code to reset your password.
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

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          requiredMark={false}
          size="large"
        >
          <Form.Item
            name="phone"
            label="Mobile Number"
            extra="Enter the phone number associated with your account"
            rules={[
              { required: true, message: 'Please enter your phone number' },
              { pattern: /^\d{10}$/, message: 'Please enter a valid 10-digit number' }
            ]}
          >
            <Input 
              prefix={<PhoneOutlined style={{ color: colors.textMuted }} />} 
              placeholder="4031234567" 
              maxLength={10}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 24, marginTop: 32 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ 
                width: '100%',
                height: 48,
                fontSize: 16,
                fontWeight: 500
              }}
            >
              Send Verification Code
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login" style={{ color: colors.primary }}>
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default ForgotPasswordPage
