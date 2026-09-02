import { useState, useEffect } from 'react'
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
  Empty,
  Select,
  Tooltip,
  Popconfirm
} from 'antd'
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  MessageOutlined, 
  SendOutlined,
  ReloadOutlined,
  LogoutOutlined,
  DollarOutlined,
  CalendarOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { colors } from '../theme'
import api from '../services/api'

const { Title, Text } = Typography

const STATUS_COLORS = {
  scheduled: 'blue',
  ready: 'gold',
  picked_up: 'green',
  cancelled: 'red'
}

const STATUS_LABELS = {
  scheduled: 'Scheduled',
  ready: 'Ready',
  picked_up: 'Picked Up',
  cancelled: 'Cancelled'
}

const timeLabel = (t) => t === 'day' ? 'All Day' : t === 'a' ? 'Morning' : t === 'p' ? 'Evening' : '-'
const fmtDate = (d) => d ? d.replace(/_/g, '/') : '-'

const AdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  
  const [customers, setCustomers] = useState([])
  const [exchanges, setExchanges] = useState([])
  const [messages, setMessages] = useState([])
  const [sentMessages, setSentMessages] = useState([])
  const [today, setToday] = useState({ date: null, exchanges: [] })
  const [revenue, setRevenue] = useState({ byMonth: [], byType: [] })
  const [searchText, setSearchText] = useState('')
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalExchanges: 0,
    totalRevenue: 0,
    pendingExchanges: 0,
    pickedUpToday: 0
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

  const adminConfig = () => ({
    headers: { 'X-Admin-Token': sessionStorage.getItem('adminToken') }
  })

  const fetchAllData = async () => {
    setDataLoading(true)
    try {
      const config = adminConfig()

      const [customersRes, exchangesRes, messagesRes, sentRes, statsRes, todayRes, revenueRes] = await Promise.all([
        api.get('/admin/customers', config),
        api.get('/admin/exchanges', config),
        api.get('/admin/messages', config),
        api.get('/admin/sent-messages', config),
        api.get('/admin/stats', config),
        api.get('/admin/today', config),
        api.get('/admin/revenue', config)
      ])

      setCustomers(customersRes.data.customers || [])
      setExchanges(exchangesRes.data.exchanges || [])
      setMessages(messagesRes.data.messages || [])
      setSentMessages(sentRes.data.sentMessages || [])
      setToday({
        date: todayRes.data.date,
        exchanges: todayRes.data.exchanges || []
      })
      setRevenue({
        byMonth: revenueRes.data.byMonth || [],
        byType: revenueRes.data.byType || []
      })

      setStats({
        totalCustomers: statsRes.data.totalCustomers ?? 0,
        totalExchanges: statsRes.data.totalExchanges ?? 0,
        totalRevenue: statsRes.data.totalRevenue ?? 0,
        pendingExchanges: statsRes.data.pendingExchanges ?? 0,
        pickedUpToday: statsRes.data.pickedUpToday ?? 0
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

  const updateExchangeStatus = async (exchangeId, status, notify = false) => {
    try {
      await api.put(`/admin/exchanges/${exchangeId}/status`, { status, notify }, adminConfig())
      message.success(`Status updated to ${STATUS_LABELS[status] || status}`)
      fetchAllData()
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update status')
    }
  }

  const refundExchange = async (exchangeId) => {
    try {
      await api.post(`/admin/exchanges/${exchangeId}/refund`, {}, adminConfig())
      message.success('Refund processed')
      fetchAllData()
    } catch (error) {
      message.error(error.response?.data?.message || 'Refund failed')
    }
  }

  const exportCSV = async (table) => {
    try {
      const response = await api.get(`/admin/export/${table}`, { ...adminConfig(), responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${table}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (error) {
      message.error('Export failed')
    }
  }

  const statusColumnFor = (exchangesData, showNotify) => ({
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 200,
    render: (status, record) => {
      const val = status || 'scheduled'
      const terminal = val === 'picked_up' || val === 'cancelled'
      return (
        <Space size={4}>
          <Tag color={STATUS_COLORS[val] || 'default'} style={{ minWidth: 90, textAlign: 'center', margin: 0 }}>
            {STATUS_LABELS[val] || val}
          </Tag>
          {!terminal && (
            <Select
              size="small"
              value={val}
              style={{ width: 88 }}
              options={[
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'ready', label: 'Ready' },
                { value: 'picked_up', label: 'Picked Up' }
              ]}
              onChange={(next) => updateExchangeStatus(record.exchange_id, next, showNotify)}
            />
          )}
        </Space>
      )
    }
  })

  // Table columns - matching actual database column names
  const customerColumns = [
    { title: 'ID', dataIndex: 'customer_id', key: 'customer_id', width: 80 },
    { 
      title: 'Name', 
      key: 'name',
      render: (_, record) => `${record.f_name || ''} ${record.l_name || ''}`
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Registered', 
      dataIndex: 'created_at', 
      key: 'created_at',
      render: (d) => d ? String(d).slice(0, 10) : '-'
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
    { 
      title: 'Customer', 
      key: 'customer',
      render: (_, record) => `${record.f_name || ''} ${record.l_name || ''}`
    },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { 
      title: 'Date', 
      dataIndex: 'date', 
      key: 'date',
      render: fmtDate
    },
    { 
      title: 'Time Slot', 
      dataIndex: 'time', 
      key: 'time',
      render: timeLabel
    },
    { 
      title: 'Qty', 
      dataIndex: 'num_cans', 
      key: 'num_cans',
      render: (qty) => <Tag color="blue">{qty || 0}</Tag>
    },
    { 
      title: 'Type', 
      dataIndex: 'can_type', 
      key: 'can_type',
      render: (type) => (
        <Tag color={type?.includes('Quick-Connect') ? 'pink' : 'blue'}>{type || '-'}</Tag>
      )
    },
    { 
      title: 'Revenue', 
      key: 'revenue',
      render: (_, record) => {
        const paid = record.amount_paid != null
        return (
          <Text strong>
            {paid ? `$${(record.amount_paid / 100).toFixed(2)}` : `$${(record.num_cans || 0) * 10}.00`}
          </Text>
        )
      }
    },
    { 
      title: 'Payment', 
      key: 'payment',
      width: 140,
      render: (_, record) => {
        const s = record.payment_status
        if (s === 'refunded') {
          return (
            <Space size={4}>
              <Tag color="red">Refunded</Tag>
            </Space>
          )
        }
        if (s === 'paid') {
          return (
            <Space size={4}>
              <Tag color="green">Paid</Tag>
              <Popconfirm
                title="Refund this order?"
                okText="Refund"
                onConfirm={() => refundExchange(record.exchange_id)}
              >
                <Button type="link" size="small" danger style={{ padding: 0 }}>Refund</Button>
              </Popconfirm>
            </Space>
          )
        }
        return <Tag>Unpaid</Tag>
      }
    },
    statusColumnFor(exchanges, true)
  ]

  const messageColumns = [
    { title: 'ID', dataIndex: 'message_id', key: 'message_id', width: 80 },
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
    { title: 'ID', dataIndex: 'message_sent_id', key: 'message_sent_id', width: 80 },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { 
      title: 'Content', 
      dataIndex: 'message_content', 
      key: 'message_content',
      ellipsis: true
    }
  ]

  const todayColumns = [
    { title: 'Customer', key: 'customer', render: (_, r) => `${r.f_name || ''} ${r.l_name || ''}` },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Time', dataIndex: 'time', key: 'time', render: timeLabel },
    { title: 'Qty', dataIndex: 'num_cans', key: 'num_cans', render: (q) => <Tag color="blue">{q}</Tag> },
    { title: 'Type', dataIndex: 'can_type', key: 'can_type', render: (t) => <Tag>{t}</Tag> },
    statusColumnFor(today.exchanges, true)
  ]

  const revenueMonthColumns = [
    { title: 'Month', dataIndex: 'ym', key: 'ym' },
    { title: 'Exchanges', dataIndex: 'exchange_count', key: 'exchange_count' },
    { 
      title: 'Revenue', 
      dataIndex: 'revenue', 
      key: 'revenue',
      render: (r) => <Text strong>${Number(r || 0).toFixed(2)}</Text>
    }
  ]

  const revenueTypeColumns = [
    { title: 'Cylinder Type', dataIndex: 'can_type', key: 'can_type' },
    { title: 'Exchanges', dataIndex: 'exchange_count', key: 'exchange_count' },
    { 
      title: 'Revenue', 
      dataIndex: 'revenue', 
      key: 'revenue',
      render: (r) => <Text strong>${Number(r || 0).toFixed(2)}</Text>
    }
  ]

  const filterRows = (rows) =>
    rows.filter(r => 
      !searchText || 
      JSON.stringify(r).toLowerCase().includes(searchText.toLowerCase())
    )

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
            <Tooltip title="Export customers.csv">
              <Button icon={<DownloadOutlined />} onClick={() => exportCSV('customers')}>
                Customers CSV
              </Button>
            </Tooltip>
            <Tooltip title="Export exchanges.csv">
              <Button icon={<DownloadOutlined />} onClick={() => exportCSV('exchanges')}>
                Exchanges CSV
              </Button>
            </Tooltip>
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
                precision={2}
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
          <Input.Search
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: 16, maxWidth: 300 }}
            allowClear
          />
          <Spin spinning={dataLoading}>
            <Tabs
              defaultActiveKey="today"
              items={[
                {
                  key: 'today',
                  label: (
                    <span>
                      <CalendarOutlined />
                      Today ({today.exchanges.length})
                    </span>
                  ),
                  children: today.exchanges.length > 0 ? (
                    <>
                      <Row style={{ marginBottom: 12 }}>
                        <Text strong>Pickup date: {today.date ? fmtDate(today.date) : '-'}</Text>
                        <Text type="secondary" style={{ marginLeft: 12 }}>
                          {today.exchanges.reduce((s, e) => s + (e.num_cans || 0), 0)} cylinders total
                        </Text>
                      </Row>
                      <Table
                        columns={todayColumns}
                        dataSource={today.exchanges}
                        rowKey="exchange_id"
                        pagination={false}
                        scroll={{ x: 800 }}
                        locale={{ emptyText: <Empty description="No exchanges today" /> }}
                      />
                    </>
                  ) : (
                    <Empty description="No exchanges scheduled today" />
                  )
                },
                {
                  key: 'exchanges',
                  label: (
                    <span>
                      <ShoppingCartOutlined />
                      Exchanges ({exchanges.length})
                    </span>
                  ),
                  children: (
                    <Table
                      columns={exchangeColumns}
                      dataSource={filterRows(exchanges)}
                      rowKey="exchange_id"
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 1100 }}
                      locale={{ emptyText: <Empty description="No exchanges yet" /> }}
                    />
                  )
                },
                {
                  key: 'customers',
                  label: (
                    <span>
                      <UserOutlined />
                      Customers ({customers.length})
                    </span>
                  ),
                  children: (
                    <Table
                      columns={customerColumns}
                      dataSource={filterRows(customers)}
                      rowKey="customer_id"
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 800 }}
                      locale={{ emptyText: <Empty description="No customers yet" /> }}
                    />
                  )
                },
                {
                  key: 'revenue',
                  label: (
                    <span>
                      <DollarOutlined />
                      Revenue
                    </span>
                  ),
                  children: (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={14}>
                        <Title level={5}>By Month</Title>
                        <Table
                          columns={revenueMonthColumns}
                          dataSource={revenue.byMonth}
                          rowKey="ym"
                          pagination={{ pageSize: 12 }}
                          size="small"
                        />
                      </Col>
                      <Col xs={24} lg={10}>
                        <Title level={5}>By Cylinder Type</Title>
                        <Table
                          columns={revenueTypeColumns}
                          dataSource={revenue.byType}
                          rowKey="can_type"
                          pagination={false}
                          size="small"
                        />
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'messages',
                  label: (
                    <span>
                      <MessageOutlined />
                      Messages ({messages.length})
                    </span>
                  ),
                  children: (
                    <Table
                      columns={messageColumns}
                      dataSource={filterRows(messages)}
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
                      Sent SMS ({sentMessages.length})
                    </span>
                  ),
                  children: (
                    <Table
                      columns={sentMessageColumns}
                      dataSource={filterRows(sentMessages)}
                      rowKey="message_sent_id"
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