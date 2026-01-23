import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Typography, 
  Card, 
  Table, 
  Tabs, 
  Statistic, 
  Row, 
  Col, 
  Tag, 
  Button,
  Space,
  Input,
  message,
  Spin,
  Badge,
  Empty
} from 'antd'
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  MessageOutlined, 
  SendOutlined,
  ReloadOutlined,
  LogoutOutlined,
  DollarOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { colors } from '../theme'
import api from '../services/api'

const { Title, Text } = Typography

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  
  const [customers, setCustomers] = useState([])
  const [exchanges, setExchanges] = useState([])
  const [messages, setMessages] = useState([])
  const [sentMessages, setSentMessages] = useState([])
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalExchanges: 0,
    totalRevenue: 0,
    pendingExchanges: 0
  })

  // Check if admin is already authenticated
  useEffect(() => {
    const adminToken = sessionStorage.getItem('adminToken')
    if (adminToken) {
      setIsAuthenticated(true)
      fetchAllData()
    } else {
      setDataLoading(false)
    }
  }, [])

  const handleLogin = async () => {
    if (!password) {
      message.error('Please enter the admin password')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/admin/login', { password })
      if (response.data.success) {
        sessionStorage.setItem('adminToken', response.data.token)
        setIsAuthenticated(true)
        message.success('Logged in successfully')
        fetchAllData()
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Invalid password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken')
    setIsAuthenticated(false)
    setPassword('')
  }

  const fetchAllData = async () => {
    setDataLoading(true)
    try {
      const token = sessionStorage.getItem('adminToken')
      const config = { headers: { 'X-Admin-Token': token } }

      const [customersRes, exchangesRes, messagesRes, sentRes] = await Promise.all([
        api.get('/admin/customers', config),
        api.get('/admin/exchanges', config),
        api.get('/admin/messages', config),
        api.get('/admin/sent-messages', config)
      ])

      setCustomers(customersRes.data.customers || [])
      setExchanges(exchangesRes.data.exchanges || [])
      setMessages(messagesRes.data.messages || [])
      setSentMessages(sentRes.data.sentMessages || [])

      // Calculate stats
      const totalRevenue = (exchangesRes.data.exchanges || []).reduce(
        (sum, e) => sum + (e.quantity * 10), 0
      )
      
      setStats({
        totalCustomers: customersRes.data.customers?.length || 0,
        totalExchanges: exchangesRes.data.exchanges?.length || 0,
        totalRevenue,
        pendingExchanges: (exchangesRes.data.exchanges || []).filter(
          e => new Date(e.exchange_date) >= new Date()
        ).length
      })
    } catch (error) {
      message.error('Failed to fetch data')
      if (error.response?.status === 401) {
        handleLogout()
      }
    } finally {
      setDataLoading(false)
    }
  }

  // Table columns
  const customerColumns = [
    { title: 'ID', dataIndex: 'customer_id', key: 'customer_id', width: 80 },
    { 
      title: 'Name', 
      key: 'name',
      render: (_, record) => `${record.f_name} ${record.l_name}`
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Created', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    { 
      title: 'Stripe ID', 
      dataIndex: 'stripe_id', 
      key: 'stripe_id',
      render: (id) => id ? <Text code style={{ fontSize: 12 }}>{id.slice(0, 20)}...</Text> : '-'
    }
  ]

  const exchangeColumns = [
    { title: 'ID', dataIndex: 'exchange_id', key: 'exchange_id', width: 80 },
    { title: 'Customer ID', dataIndex: 'customer_id', key: 'customer_id', width: 100 },
    { 
      title: 'Order Date', 
      dataIndex: 'datetime', 
      key: 'datetime',
      render: (date) => date ? new Date(date).toLocaleString() : '-'
    },
    { 
      title: 'Exchange Date', 
      dataIndex: 'exchange_date', 
      key: 'exchange_date',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-'
    },
    { title: 'Time Slot', dataIndex: 'exchange_time', key: 'exchange_time' },
    { 
      title: 'Qty', 
      dataIndex: 'quantity', 
      key: 'quantity',
      render: (qty) => <Tag color="blue">{qty}</Tag>
    },
    { 
      title: 'Type', 
      dataIndex: 'canister_type', 
      key: 'canister_type',
      render: (type) => (
        <Tag color={type === 'blue' ? 'blue' : 'pink'}>{type || 'Standard'}</Tag>
      )
    }
  ]

  const messageColumns = [
    { title: 'ID', dataIndex: 'message_id', key: 'message_id', width: 80 },
    { 
      title: 'Date', 
      dataIndex: 'datetime', 
      key: 'datetime',
      render: (date) => date ? new Date(date).toLocaleString() : '-'
    },
    { 
      title: 'Name', 
      key: 'name',
      render: (_, record) => `${record.f_name || ''} ${record.l_name || ''}`
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { 
      title: 'Message', 
      dataIndex: 'message', 
      key: 'message',
      ellipsis: true
    }
  ]

  const sentMessageColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { 
      title: 'Date', 
      dataIndex: 'datetime', 
      key: 'datetime',
      render: (date) => date ? new Date(date).toLocaleString() : '-'
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { 
      title: 'Content', 
      dataIndex: 'content', 
      key: 'content',
      ellipsis: true
    }
  ]

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="fade-in" style={{ 
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}>
        <Card style={{ 
          maxWidth: 400, 
          width: '100%',
          borderRadius: 16,
          boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img 
              src="/images/logo-trans.png" 
              alt="SodaKid" 
              style={{ height: 60, marginBottom: 16 }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <Title level={3} style={{ margin: 0 }}>Admin Dashboard</Title>
            <Text type="secondary">Enter password to access</Text>
          </div>

          <Input.Password
            size="large"
            placeholder="Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPressEnter={handleLogin}
            style={{ marginBottom: 16 }}
          />

          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            onClick={handleLogin}
          >
            Login
          </Button>
        </Card>
      </div>
    )
  }

  // Dashboard
  return (
    <div className="fade-in" style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 24
        }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>Admin Dashboard</Title>
            <Text type="secondary">Manage customers, orders, and messages</Text>
          </div>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchAllData}
              loading={dataLoading}
            >
              Refresh
            </Button>
            <Button 
              icon={<LogoutOutlined />} 
              danger
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Space>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total Customers"
                value={stats.totalCustomers}
                prefix={<UserOutlined />}
                valueStyle={{ color: colors.primary }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total Exchanges"
                value={stats.totalExchanges}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: colors.secondary }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={stats.totalRevenue}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Pending Exchanges"
                value={stats.pendingExchanges}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Data Tables */}
        <Card style={{ borderRadius: 12 }}>
          <Spin spinning={dataLoading}>
            <Tabs
              defaultActiveKey="customers"
              items={[
                {
                  key: 'customers',
                  label: (
                    <span>
                      <UserOutlined />
                      Customers
                      <Badge count={customers.length} style={{ marginLeft: 8 }} />
                    </span>
                  ),
                  children: (
                    <Table
                      columns={customerColumns}
                      dataSource={customers}
                      rowKey="customer_id"
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 800 }}
                      locale={{ emptyText: <Empty description="No customers yet" /> }}
                    />
                  )
                },
                {
                  key: 'exchanges',
                  label: (
                    <span>
                      <ShoppingCartOutlined />
                      Exchanges
                      <Badge count={exchanges.length} style={{ marginLeft: 8 }} />
                    </span>
                  ),
                  children: (
                    <Table
                      columns={exchangeColumns}
                      dataSource={exchanges}
                      rowKey="exchange_id"
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 800 }}
                      locale={{ emptyText: <Empty description="No exchanges yet" /> }}
                    />
                  )
                },
                {
                  key: 'messages',
                  label: (
                    <span>
                      <MessageOutlined />
                      Messages
                      <Badge count={messages.length} style={{ marginLeft: 8 }} />
                    </span>
                  ),
                  children: (
                    <Table
                      columns={messageColumns}
                      dataSource={messages}
                      rowKey="message_id"
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 600 }}
                      locale={{ emptyText: <Empty description="No messages" /> }}
                    />
                  )
                },
                {
                  key: 'sent',
                  label: (
                    <span>
                      <SendOutlined />
                      Sent SMS
                      <Badge count={sentMessages.length} style={{ marginLeft: 8 }} />
                    </span>
                  ),
                  children: (
                    <Table
                      columns={sentMessageColumns}
                      dataSource={sentMessages}
                      rowKey="id"
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 600 }}
                      locale={{ emptyText: <Empty description="No sent messages" /> }}
                    />
                  )
                }
              ]}
            />
          </Spin>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard
