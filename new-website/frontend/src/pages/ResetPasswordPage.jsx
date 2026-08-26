import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Typography, 
  Form, 
  Input, 
  Button, 
  Card,
  Alert
} from 'antd'
import { 
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

const { Title, Paragraph } = Typography

const ResetPasswordPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { resetPassword, pendingVerification } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!pendingVerification?.verified) {
      navigate('/forgot-password')
    }
  }, [pendingVerification, navigate])

  const onFinish = async (values) => {
    setLoading(true)
    setError(null)

    const result = await resetPassword(values.password)

    if (result.success) {
      navigate('/login')
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const validateConfirmPassword = (_, value) => {
    const password = form.getFieldValue('password')
    if (value && value !== password) {
      return Promise.reject('Passwords do not match')
    }
    return Promise.resolve()
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
          <Title level={2} style={{ marginBottom: 8 }}>Reset Password</Title>
          <Paragraph style={{ color: colors.textSecondary }}>
            Create a new password for your account
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
            name="password"
            label="New Password"
            extra="At least 8 characters with letters and numbers"
            rules={[
              { required: true, message: 'Please enter a new password' },
              { 
                pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/, 
                message: 'Must be 8+ characters with letters and numbers' 
              }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: colors.textMuted }} />} 
              placeholder="Enter new password"
              iconRender={(visible) => 
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              { validator: validateConfirmPassword }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: colors.textMuted }} />} 
              placeholder="Confirm new password"
              iconRender={(visible) => 
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
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
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default ResetPasswordPage
