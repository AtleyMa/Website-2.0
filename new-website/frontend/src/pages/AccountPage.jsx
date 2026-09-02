import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Table, 
  Button, 
  Spin,
  Space,
  Avatar,
  Divider,
  Tag,
  Empty,
  Modal,
  DatePicker,
  message,
  Popconfirm
} from 'antd'
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  CalendarOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { accountAPI, ordersAPI } from '../services/api'
import dayjs from 'dayjs'
import { colors } from '../theme'

const { Title, Text, Paragraph } = Typography

const AccountPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [exchanges, setExchanges] = useState([])
  const [rescheduleTarget, setRescheduleTarget] = useState(null)
  const [rescheduleDate, setRescheduleDate] = useState(null)
  const [rescheduling, setRescheduling] = useState(false)

  useEffect(() => {
    fetchAccountData()
  }, [])

  const fetchAccountData = async () => {
    try {
      const response = await accountAPI.getExchangeHistory()
      setExchanges(response.data.exchanges || [])
    } catch (error) {
      console.error('Error fetching account data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const canModify = (status) => status === 'scheduled' || status === 'ready'

  const handleCancel = async (exchangeId) => {
    try {
      await ordersAPI.cancelOrder(exchangeId)
      message.success('Order cancelled')
      fetchAccountData()
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to cancel order')
    }
  }

  const openReschedule = (record) => {
    setRescheduleTarget(record)
    setRescheduleDate(null)
  }

  const handleReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate) {
      message.error('Please select a new date')
      return
    }
    setRescheduling(true)
    try {
      await ordersAPI.rescheduleOrder(
        rescheduleTarget.exchange_id,
        rescheduleDate.format('M_D_YYYY')
      )
      message.success('Order rescheduled')
      setRescheduleTarget(null)
      fetchAccountData()
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reschedule order')
    } finally {
      setRescheduling(false)
    }
  }

  const formatDate = (dateString) => {
    // Convert from M_D_YYYY format
    const parts = dateString.split('_')
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`
    }
    return dateString
  }

  const formatTime = (timeCode) => {
    if (timeCode === 'day') return 'All Day'
    if (timeCode === 'a') return 'Morning'
    if (timeCode === 'p') return 'Evening'
    return '-'
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => formatDate(text)
    },
    {
      title: 'Time Slot',
      dataIndex: 'time',
      key: 'time',
      render: (text) => formatTime(text)
    },
    {
      title: 'Quantity',
      dataIndex: 'num_cans',
      key: 'num_cans',
      align: 'center'
    },
    {
      title: 'Type',
      dataIndex: 'can_type',
      key: 'can_type',
      render: (text) => (
        <Tag 
          color={text === 'Quick-Connect (Terra)' ? 'magenta' : 'blue'}
          style={{ fontWeight: 500 }}
        >
          {text}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const map = {
          scheduled: ['blue', 'Scheduled'],
          ready: ['gold', 'Ready'],
          picked_up: ['green', 'Picked Up'],
          cancelled: ['red', 'Cancelled']
        }
        const [color, label] = map[status] || ['default', status || 'Scheduled']
        return <Tag color={color}>{label}</Tag>
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        if (!canModify(record.status)) return null
        return (
          <Space size={4}>
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => openReschedule(record)}
            >
              Reschedule
            </Button>
            <Popconfirm
              title="Cancel this order?"
              description="Must be at least 24 hours before pickup."
              okText="Cancel Order"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleCancel(record.exchange_id)}
            >
              <Button size="small" icon={<CloseCircleOutlined />} danger>
                Cancel
              </Button>
            </Popconfirm>
          </Space>
        )
      }
    }
  ]

  const formatPhone = (phone) => {
    if (!phone || phone.length !== 10) return phone
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
  }

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
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
          My Account
        </Title>

        <Row gutter={[32, 32]}>
          {/* Account Information */}
          <Col xs={24} lg={10}>
            <Card 
              style={{ 
                borderRadius: 20,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                border: 'none',
                height: '100%'
              }}
              bodyStyle={{ padding: 32 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <Avatar 
                  size={80} 
                  style={{ 
                    backgroundColor: colors.primary,
                    fontSize: 32,
                    marginBottom: 16
                  }}
                >
                  {user?.firstName?.[0]?.toUpperCase()}
                </Avatar>
                <Title level={3} style={{ marginBottom: 0 }}>
                  {user?.firstName} {user?.lastName}
                </Title>
                <Text type="secondary">SodaKid Customer</Text>
              </div>

              <Divider />

              <Space direction="vertical" size={20} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8,
                    background: `rgba(135, 204, 217, 0.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UserOutlined style={{ color: colors.primary, fontSize: 18 }} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Name</Text>
                    <Text strong>{user?.firstName} {user?.lastName}</Text>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8,
                    background: `rgba(135, 204, 217, 0.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MailOutlined style={{ color: colors.primary, fontSize: 18 }} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Email</Text>
                    <Text strong>{user?.email}</Text>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 8,
                    background: `rgba(135, 204, 217, 0.15)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PhoneOutlined style={{ color: colors.primary, fontSize: 18 }} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Phone</Text>
                    <Text strong>{formatPhone(user?.phone)}</Text>
                  </div>
                </div>
              </Space>

              <Divider />

              <Button 
                type="primary"
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                block
                size="large"
                style={{ fontWeight: 500 }}
              >
                Log Out
              </Button>
            </Card>
          </Col>

          {/* Order History */}
          <Col xs={24} lg={14}>
            <Card 
              title={
                <Space>
                  <ShoppingCartOutlined />
                  <span>Recent Orders</span>
                </Space>
              }
              style={{ 
                borderRadius: 20,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                border: 'none',
                height: '100%'
              }}
              bodyStyle={{ padding: 24 }}
            >
              {exchanges.length > 0 ? (
                <Table 
                  dataSource={exchanges}
                  columns={columns}
                  rowKey={(record, index) => index}
                  pagination={{ 
                    pageSize: 5,
                    showSizeChanger: false
                  }}
                  style={{ 
                    borderRadius: 8,
                    overflow: 'hidden'
                  }}
                />
              ) : (
                <Empty 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <Paragraph style={{ marginBottom: 16 }}>
                        No recent exchanges to show.
                      </Paragraph>
                      <Text type="secondary">
                        Looks like you&apos;re a brand new customer!
                      </Text>
                    </div>
                  }
                >
                  <Button 
                    type="primary" 
                    icon={<ShoppingCartOutlined />}
                    onClick={() => navigate('/place-order')}
                    style={{ marginTop: 16 }}
                  >
                    Place Your First Order
                  </Button>
                </Empty>
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* Reschedule Modal */}
      <Modal
        title="Reschedule Order"
        open={!!rescheduleTarget}
        onOk={handleReschedule}
        onCancel={() => setRescheduleTarget(null)}
        okText="Reschedule"
        confirmLoading={rescheduling}
        okButtonProps={{ disabled: !rescheduleDate }}
      >
        {rescheduleTarget && (
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              Current date: <Text strong>{formatDate(rescheduleTarget.date)}</Text>
            </Text>
            <br />
            <Text type="secondary">
              {rescheduleTarget.num_cans} × {rescheduleTarget.can_type}
            </Text>
          </div>
        )}
        <DatePicker
          disabledDate={(current) => current && current < dayjs().startOf('day')}
          onChange={setRescheduleDate}
          style={{ width: '100%' }}
          placeholder="Select new date"
        />
        <Paragraph type="secondary" style={{ marginTop: 12, fontSize: 12 }}>
          You can reschedule scheduled or ready orders to any future date,
          subject to availability.
        </Paragraph>
      </Modal>
    </div>
  )
}

export default AccountPage
