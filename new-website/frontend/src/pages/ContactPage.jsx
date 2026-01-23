import React, { useState } from 'react'
import { 
  Typography, 
  Form, 
  Input, 
  Button, 
  Card, 
  message, 
  Row, 
  Col,
  Space
} from 'antd'
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined,
  SendOutlined,
  EnvironmentOutlined,
  FacebookOutlined
} from '@ant-design/icons'
import { contactAPI } from '../services/api'
import { colors } from '../theme'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

const ContactPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      await contactAPI.sendMessage({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        message: values.message
      })
      message.success('Message sent successfully! We\'ll get back to you soon.')
      form.resetFields()
    } catch (error) {
      message.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in" style={{ padding: '48px 24px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Title level={1}>Contact SodaKid</Title>
          <Paragraph style={{ fontSize: 18, color: colors.textSecondary }}>
            Have questions or need help? Send us a message and we'll get back to you!
          </Paragraph>
        </div>

        <Row gutter={[48, 48]}>
          {/* Contact Form */}
          <Col xs={24} lg={14}>
            <Card 
              style={{ 
                borderRadius: 16, 
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                border: 'none'
              }}
              bodyStyle={{ padding: 40 }}
            >
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
                        { required: true, message: 'Please enter your first name' },
                        { pattern: /^[A-Za-z]+$/, message: 'Please enter a valid name' }
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
                        { required: true, message: 'Please enter your last name' },
                        { pattern: /^[A-Za-z]+$/, message: 'Please enter a valid name' }
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
                  name="phone"
                  label="Mobile Number"
                  rules={[
                    { required: true, message: 'Please enter your phone number' },
                    { pattern: /^\d{10}$/, message: 'Please enter a valid 10-digit phone number' }
                  ]}
                >
                  <Input 
                    prefix={<PhoneOutlined style={{ color: colors.textMuted }} />} 
                    placeholder="4031234567" 
                    maxLength={10}
                  />
                </Form.Item>

                <Form.Item
                  name="message"
                  label="Message"
                  rules={[{ required: true, message: 'Please enter your message' }]}
                >
                  <TextArea 
                    rows={5} 
                    placeholder="How can we help you?"
                    style={{ resize: 'none' }}
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<SendOutlined />}
                    style={{ 
                      width: '100%',
                      height: 48,
                      fontSize: 16,
                      fontWeight: 500,
                      background: colors.secondary,
                      borderColor: colors.secondary
                    }}
                  >
                    Send Message
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* Contact Info */}
          <Col xs={24} lg={10}>
            <Card 
              style={{ 
                borderRadius: 16,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
                border: 'none',
                height: '100%'
              }}
              bodyStyle={{ padding: 40 }}
            >
              <Title level={3} style={{ color: 'white', marginBottom: 32 }}>
                Get in Touch
              </Title>

              <Space direction="vertical" size={32} style={{ width: '100%' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <EnvironmentOutlined style={{ fontSize: 24, color: 'white', marginTop: 4 }} />
                    <div>
                      <Text strong style={{ color: 'white', fontSize: 16, display: 'block' }}>
                        Pickup Location
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                        Marda Loop<br />
                        Calgary, Alberta
                      </Text>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <MailOutlined style={{ fontSize: 24, color: 'white', marginTop: 4 }} />
                    <div>
                      <Text strong style={{ color: 'white', fontSize: 16, display: 'block' }}>
                        Response Time
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                        We typically respond within 24 hours
                      </Text>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                    <FacebookOutlined style={{ fontSize: 24, color: 'white', marginTop: 4 }} />
                    <div>
                      <Text strong style={{ color: 'white', fontSize: 16, display: 'block' }}>
                        Follow Us
                      </Text>
                      <a 
                        href="https://www.facebook.com/SodaKidGobal" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ color: 'rgba(255,255,255,0.9)' }}
                      >
                        @SodaKidGobal on Facebook
                      </a>
                    </div>
                  </div>
                </div>
              </Space>

              <div 
                style={{ 
                  marginTop: 48, 
                  padding: 24, 
                  background: 'rgba(255,255,255,0.15)', 
                  borderRadius: 12 
                }}
              >
                <Title level={5} style={{ color: 'white', marginBottom: 8 }}>
                  Business Hours
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>
                  Dropbox Available 24/7<br />
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                    During your selected time slot
                  </Text>
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default ContactPage
