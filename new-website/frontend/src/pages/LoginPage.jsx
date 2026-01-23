import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Typography, 
  Form, 
  Input, 
  Button, 
  Card, 
  Divider,
  Alert,
  Space
} from 'antd'
import { 
  MailOutlined, 
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  GoogleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

const { Title, Text, Paragraph } = Typography

const LoginPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { login, loginWithToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/'
  const showLoginPrompt = location.state?.from === '/place-order'

  // Handle Google OAuth callback
  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    const userName = params.get('user')
    const isNew = params.get('new')
    const oauthError = params.get('error')

    if (oauthError) {
      setError('Google login failed. Please try again.')
    } else if (token && userName) {
      // Store the token and redirect
      localStorage.setItem('token', token)
      if (loginWithToken) {
        loginWithToken(token)
      }
      navigate('/', { 
        replace: true,
        state: { 
          message: isNew ? `Welcome to SodaKid, ${userName}!` : `Welcome back, ${userName}!`, 
          type: 'success' 
        }
      })
    }
  }, [location.search, navigate, loginWithToken])

  const onFinish = async (values) => {
    setLoading(true)
    setError(null)
    
    const result = await login(values.email, values.password)
    
    if (result.success) {
      navigate(from, { 
        replace: true,
        state: { message: 'Welcome back!', type: 'success' }
      })
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google'
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
          <Title level={2} style={{ marginBottom: 8 }}>Welcome Back</Title>
          <Paragraph style={{ color: colors.textSecondary }}>
            Log in to your SodaKid account
          </Paragraph>
        </div>

        {showLoginPrompt && (
          <Alert
            message="Please log in to place an order"
            type="warning"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

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
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: colors.textMuted }} />} 
              placeholder="name@example.com" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: colors.textMuted }} />} 
              placeholder="Enter your password"
              iconRender={(visible) => 
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <Link to="/forgot-password" style={{ color: colors.primary }}>
              Forgot password?
            </Link>
          </div>

          <Form.Item style={{ marginBottom: 24 }}>
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
              Log In
            </Button>
          </Form.Item>
        </Form>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 13 }}>or continue with</Text>
        </Divider>

        <Button
          size="large"
          icon={<GoogleOutlined />}
          style={{
            width: '100%',
            height: 48,
            borderRadius: 10,
            fontWeight: 500,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </Button>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 13 }}>New to SodaKid?</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Link to="/sign-up">
            <Button 
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              style={{ 
                width: '100%',
                height: 48,
                borderRadius: 10,
                fontWeight: 600
              }}
            >
              Create an Account
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage
