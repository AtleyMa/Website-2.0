import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { 
  Typography, 
  Button, 
  Card,
  Space,
  Divider,
  Spin,
  Alert,
  Table
} from 'antd'
import { 
  CheckCircleFilled, 
  HomeOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import { ordersAPI } from '../services/api'
import { colors } from '../theme'

const { Title, Paragraph, Text } = Typography

const fmtDate = (d) => d ? d.replace(/_/g, '/') : '-'

const SuccessPage = () => {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setError('No order session found.')
      setLoading(false)
      return
    }

    ordersAPI.getRecentOrder(sessionId)
      .then((res) => {
        setOrder(res.data)
        setLoading(false)
      })
      .catch(() => {
        // Order may not be recorded yet (webhook latency); try again shortly
        setTimeout(() => {
          ordersAPI.getRecentOrder(sessionId)
            .then((res) => { setOrder(res.data); setLoading(false) })
            .catch(() => { setError('We couldn\'t load your order details yet.'); setLoading(false) })
        }, 3000)
      })
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

  const orderDetailColumns = order ? [
    { title: 'Exchange Day', dataIndex: 'date', key: 'date', render: (d) => fmtDate(d) },
    { title: 'Time', dataIndex: 'time', key: 'time' },
    { title: 'Quantity', dataIndex: 'numCans', key: 'numCans' },
    { title: 'Cylinder Type', dataIndex: 'canType', key: 'canType' },
    { title: 'Amount Paid', key: 'amount', render: () => <Text strong>${((order.amountPaid || 0) / 100).toFixed(2)}</Text> }
  ] : []

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

          {error && (
            <Alert
              type="warning"
              showIcon
              message={error}
              description="Your order is confirmed on our side, but the details may still be syncing. Check your order history shortly."
              style={{ marginBottom: 24, textAlign: 'left' }}
            />
          )}

          {order && (
            <Card 
              style={{ 
                background: colors.background,
                borderRadius: 16,
                marginBottom: 32,
                textAlign: 'left'
              }}
              bodyStyle={{ padding: 24 }}
            >
              <Title level={5} style={{ marginBottom: 16 }}>
                📋 Order Details
              </Title>
              <Table
                columns={orderDetailColumns}
                dataSource={[order]}
                rowKey="exchangeId"
                pagination={false}
                size="small"
              />
            </Card>
          )}

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
