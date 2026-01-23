import React, { useState, useEffect } from 'react'
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
  Empty
} from 'antd'
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined,
  LockOutlined,
  LogoutOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons'
import { useAuth } from '../context/AuthContext'
import { accountAPI } from '../services/api'
import { colors } from '../theme'

const { Title, Text, Paragraph } = Typography

const AccountPage = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [exchanges, setExchanges] = useState([])

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
    navigate('/', { state: { message: 'Logged out successfully', type: 'success' } })
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
    return timeCode === 'a' ? 'Morning (7AM-5PM)' : 'Evening (5PM-9PM)'
  }

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text) => formatDate(text)
    },
    {
      title: 'Time',
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
          color={text === 'Blue (Original)' ? 'blue' : 'magenta'}
          style={{ fontWeight: 500 }}
        >
          {text}
        </Tag>
      )
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
                    <LockOutlined style={{ color: colors.primary, fontSize: 18 }} />
                  </div>
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>Password</Text>
                    <Text strong>••••••••</Text>
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
                        Looks like you're a brand new customer!
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
    </div>
  )
}

export default AccountPage
