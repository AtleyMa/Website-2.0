import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Typography, 
  Form, 
  Input, 
  Button, 
  Card, 
  Divider,
  Alert,
  Row,
  Col
} from 'antd'
import { 
  UserOutlined,
  MailOutlined, 
  PhoneOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  GoogleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme'

const { Title, Text, Paragraph } = Typography

const SignUpPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values) => {
    setLoading(true)
    setError(null)

    const result = await signUp({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      password: values.password
    })

    if (result.success && result.needsVerification) {
      navigate('/verify-account')
    } else if (!result.success) {
      setError(result.error)
    }
    setLoading(false)
  }

  const validateConfirmEmail = (_, value) => {
    const email = form.getFieldValue('email')
    if (value && value !== email) {
      return Promise.reject('Emails do not match')
    }
    return Promise.resolve()
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
          maxWidth: 500, 
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
          <Title level={2} style={{ marginBottom: 8 }}>Create Account</Title>
          <Paragraph style={{ color: colors.textSecondary }}>
            Join SodaKid and start saving today
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
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="firstName"
                label="First Name"
                rules={[
                  { required: true, message: 'Required' },
                  { pattern: /^[A-Za-z\s'-]+$/, message: 'Invalid name' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: colors.textMuted }} />} 
                  placeholder="John" 
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="lastName"
                label="Last Name"
                rules={[
                  { required: true, message: 'Required' },
                  { pattern: /^[A-Za-z\s'-]+$/, message: 'Invalid name' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined style={{ color: colors.textMuted }} />} 
                  placeholder="Doe" 
                />
              </Form.Item>
            </Col>
          </Row>

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
            name="confirmEmail"
            label="Confirm Email"
            dependencies={['email']}
            rules={[
              { required: true, message: 'Please confirm your email' },
              { validator: validateConfirmEmail }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: colors.textMuted }} />} 
              placeholder="Confirm your email" 
            />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Mobile Number"
            extra="We'll send a verification code to this number"
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

          <Form.Item
            name="password"
            label="Create Password"
            extra="At least 8 characters with letters and numbers"
            rules={[
              { required: true, message: 'Please create a password' },
              { 
                pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/, 
                message: 'Must be 8+ characters with letters and numbers' 
              }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: colors.textMuted }} />} 
              placeholder="Create a strong password"
              iconRender={(visible) => 
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              { validator: validateConfirmPassword }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: colors.textMuted }} />} 
              placeholder="Confirm your password"
              iconRender={(visible) => 
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 24, marginTop: 32 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              icon={<ArrowRightOutlined />}
              style={{ 
                width: '100%',
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 10
              }}
            >
              Create Account
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
          onClick={() => {
            window.location.href = '/api/auth/google'
          }}
        >
          Continue with Google
        </Button>

        <Divider plain>
          <Text type="secondary" style={{ fontSize: 13 }}>Already have an account?</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Link to="/login">
            <Button 
              size="large"
              style={{ 
                width: '100%',
                height: 48,
                fontWeight: 500,
                borderRadius: 10,
                borderColor: colors.primary,
                color: colors.primary
              }}
            >
              Log In
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default SignUpPage
