import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Typography, 
  Result, 
  Button, 
  Card,
  Space,
  Divider,
  Spin
} from 'antd'
import { 
  CheckCircleFilled, 
  HomeOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { colors } from '../theme'

const { Title, Paragraph, Text } = Typography

const SuccessPage = () => {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [orderDetails, setOrderDetails] = useState(null)

  useEffect(() => {
    // In a real app, you'd fetch order details from the session
    // For now, we'll just show a generic success message
    const sessionId = searchParams.get('session_id')
    
    // Simulate loading order details
    setTimeout(() => {
      setOrderDetails({
        date: 'Your selected date',
        time: 'Your selected time slot'
      })
      setLoading(false)
    }, 1000)
  }, [searchParams])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: 'calc(100vh - 200px)' 
      }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="fade-in" style={{ padding: '48px 24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <Card 
          style={{ 
            borderRadius: 24,
            boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            border: 'none',
            textAlign: 'center'
          }}
          bodyStyle={{ padding: 48 }}
        >
          <div style={{ marginBottom: 32 }}>
            <CheckCircleFilled 
              style={{ 
                fontSize: 80, 
                color: colors.success,
                marginBottom: 24
              }} 
            />
            <Title level={2} style={{ marginBottom: 8 }}>
              Order Confirmed!
            </Title>
            <Paragraph style={{ fontSize: 16, color: colors.textSecondary }}>
              Thank you for your order. A confirmation has been sent to your phone.
            </Paragraph>
          </div>

          <Card 
            style={{ 
              background: colors.background,
              borderRadius: 16,
              marginBottom: 32
            }}
            bodyStyle={{ padding: 24 }}
          >
            <Title level={5} style={{ marginBottom: 16 }}>
              📍 Pickup Instructions
            </Title>
            <Paragraph style={{ marginBottom: 0 }}>
              Please arrive at <Text strong>2005 29 Ave SW, Calgary</Text> during 
              your selected time slot. Your full cylinders will be ready for exchange.
            </Paragraph>
            
            <Divider />
            
            <Space direction="vertical" size={8}>
              <Text>
                <Text strong>Screw-in (Original):</Text> Brown box to the right of the door
              </Text>
              <Text>
                <Text strong>Quick-Connect (Terra):</Text> Mailbox to the right of the door
              </Text>
            </Space>
          </Card>

          <div 
            style={{ 
              background: `linear-gradient(135deg, ${colors.secondary}20 0%, ${colors.secondary}10 100%)`,
              padding: 16,
              borderRadius: 12,
              marginBottom: 32
            }}
          >
            <Text style={{ color: colors.textPrimary }}>
              🌱 Thank you! <Text strong>$1</Text> from your purchase is going 
              to the Calgary Food Bank.
            </Text>
          </div>

          <Space size="large" wrap style={{ justifyContent: 'center' }}>
            <Link to="/">
              <Button 
                type="primary"
                icon={<HomeOutlined />}
                size="large"
                style={{ 
                  height: 48,
                  paddingInline: 32,
                  fontWeight: 500
                }}
              >
                Back to Home
              </Button>
            </Link>
            <Link to="/account">
              <Button 
                icon={<HistoryOutlined />}
                size="large"
                style={{ 
                  height: 48,
                  paddingInline: 32
                }}
              >
                View Orders
              </Button>
            </Link>
          </Space>
        </Card>
      </div>
    </div>
  )
}

export default SuccessPage
