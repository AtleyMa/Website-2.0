import React, { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Layout, 
  Menu, 
  Button, 
  Dropdown, 
  Space, 
  Drawer,
  Typography,
  Divider,
  Avatar
} from 'antd'
import { 
  MenuOutlined, 
  UserOutlined, 
  LogoutOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  ShoppingCartOutlined,
  MailOutlined,
  ArrowRightOutlined,
  GoogleOutlined
} from '@ant-design/icons'
import { useAuth } from '../../context/AuthContext'
import { colors } from '../../theme'

const { Header, Content, Footer } = Layout
const { Text } = Typography

const MainLayout = () => {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navItems = [
    { key: '/', label: 'Home', icon: <HomeOutlined /> },
    { key: '/about', label: 'About', icon: <InfoCircleOutlined /> },
    { key: '/place-order', label: 'Place Order', icon: <ShoppingCartOutlined /> },
    { key: '/contact', label: 'Contact', icon: <MailOutlined /> },
  ]

  const userMenuItems = [
    {
      key: 'account',
      label: 'Account Info',
      icon: <UserOutlined />,
      onClick: () => navigate('/account')
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: 'Log Out',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      danger: true
    }
  ]

  const MobileMenu = () => (
    <Drawer
      title={
        <Link to="/" onClick={() => setMobileMenuOpen(false)}>
          <img 
            src="/logo.png" 
            alt="SodaKid" 
            style={{ height: 40 }}
          />
        </Link>
      }
      placement="right"
      onClose={() => setMobileMenuOpen(false)}
      open={mobileMenuOpen}
      width={300}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ padding: '16px 0' }}>
        {isAuthenticated && (
          <div style={{ 
            padding: '16px 24px', 
            background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}15 100%)`,
            marginBottom: 8
          }}>
            <Space>
              <Avatar 
                size={48} 
                style={{ 
                  backgroundColor: colors.primary,
                  fontSize: 20,
                  fontWeight: 600
                }}
              >
                {user?.firstName?.[0]?.toUpperCase()}
              </Avatar>
              <div>
                <Text strong style={{ fontSize: 16, display: 'block' }}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Welcome back!
                </Text>
              </div>
            </Space>
          </div>
        )}

        <Menu
          mode="vertical"
          selectedKeys={[location.pathname]}
          style={{ border: 'none', fontSize: 15 }}
          items={navItems.map(item => ({
            ...item,
            style: { margin: '4px 12px', borderRadius: 8 },
            onClick: () => {
              navigate(item.key)
              setMobileMenuOpen(false)
            }
          }))}
        />
        
        <Divider style={{ margin: '16px 0' }} />
        
        {isAuthenticated ? (
          <div style={{ padding: '0 16px' }}>
            <Button
              block
              icon={<UserOutlined />}
              style={{ 
                marginBottom: 8, 
                height: 44,
                borderRadius: 10,
                fontWeight: 500
              }}
              onClick={() => {
                navigate('/account')
                setMobileMenuOpen(false)
              }}
            >
              Account Info
            </Button>
            <Button
              block
              danger
              icon={<LogoutOutlined />}
              style={{ 
                height: 44,
                borderRadius: 10,
                fontWeight: 500
              }}
              onClick={() => {
                handleLogout()
                setMobileMenuOpen(false)
              }}
            >
              Log Out
            </Button>
          </div>
        ) : (
          <div style={{ padding: '0 16px' }}>
            <Button 
              block
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              style={{ 
                marginBottom: 12,
                height: 48,
                borderRadius: 10,
                fontWeight: 600
              }}
              onClick={() => {
                navigate('/sign-up')
                setMobileMenuOpen(false)
              }}
            >
              Sign Up
            </Button>
            <Button 
              block
              size="large"
              style={{ 
                height: 48,
                borderRadius: 10,
                fontWeight: 500,
                borderColor: colors.primary,
                color: colors.primary
              }}
              onClick={() => {
                navigate('/login')
                setMobileMenuOpen(false)
              }}
            >
              Log In
            </Button>
            <Divider style={{ margin: '16px 0' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>or continue with</Text>
            </Divider>
            <Button
              block
              size="large"
              icon={<GoogleOutlined />}
              style={{
                height: 48,
                borderRadius: 10,
                fontWeight: 500,
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
          </div>
        )}
      </div>
    </Drawer>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header 
        style={{ 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000, 
          width: '100%',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          height: 70
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src="/logo.png" 
            alt="SodaKid" 
            style={{ height: 45, marginRight: 16 }}
          />
        </Link>

        {/* Desktop Navigation */}
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          style={{ 
            flex: 1, 
            justifyContent: 'center',
            border: 'none',
            display: 'flex',
            background: 'transparent'
          }}
          className="desktop-menu"
          items={navItems.map(item => ({
            key: item.key,
            label: (
              <Link to={item.key} style={{ fontWeight: 500, fontSize: 15 }}>
                {item.label}
              </Link>
            )
          }))}
        />

        {/* Desktop Auth Section - Clean Design */}
        <Space size={12} className="desktop-auth">
          {isAuthenticated ? (
            <Dropdown 
              menu={{ items: userMenuItems }} 
              placement="bottomRight"
              trigger={['click']}
            >
              <Button 
                type="text" 
                style={{ 
                  height: 44, 
                  padding: '4px 16px',
                  borderRadius: 22,
                  border: `1px solid ${colors.primary}30`,
                  background: `${colors.primary}08`
                }}
              >
                <Space size={10}>
                  <Avatar 
                    size={32} 
                    style={{ 
                      backgroundColor: colors.primary,
                      fontWeight: 600
                    }}
                  >
                    {user?.firstName?.[0]?.toUpperCase()}
                  </Avatar>
                  <Text strong style={{ fontSize: 14 }}>
                    {user?.firstName}
                  </Text>
                </Space>
              </Button>
            </Dropdown>
          ) : (
            <>
              <Link to="/login">
                <Button 
                  type="text"
                  style={{ 
                    fontWeight: 500,
                    fontSize: 15,
                    height: 40,
                    color: colors.textPrimary
                  }}
                >
                  Log In
                </Button>
              </Link>
              <Link to="/sign-up">
                <Button 
                  type="primary"
                  style={{ 
                    fontWeight: 600,
                    fontSize: 15,
                    height: 40,
                    borderRadius: 20,
                    paddingLeft: 20,
                    paddingRight: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  Sign Up <ArrowRightOutlined style={{ fontSize: 12 }} />
                </Button>
              </Link>
            </>
          )}
        </Space>

        {/* Mobile Menu Button */}
        <Button
          type="text"
          icon={<MenuOutlined style={{ fontSize: 22 }} />}
          onClick={() => setMobileMenuOpen(true)}
          className="mobile-menu-btn"
          style={{ 
            display: 'none',
            height: 44,
            width: 44,
            borderRadius: 10
          }}
        />
      </Header>

      <MobileMenu />

      <Content style={{ padding: '0', background: colors.background }}>
        <div style={{ minHeight: 'calc(100vh - 134px)' }}>
          <Outlet />
        </div>
      </Content>

      <Footer 
        style={{ 
          textAlign: 'center', 
          background: '#fff',
          padding: '32px 24px',
          borderTop: '1px solid #e8e8e8'
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Link to="/">
            <img 
              src="/logo.png" 
              alt="SodaKid" 
              style={{ height: 36, marginBottom: 20, opacity: 0.9 }}
            />
          </Link>
          <div style={{ marginBottom: 20 }}>
            <Space size={24} wrap style={{ justifyContent: 'center' }}>
              <Link to="/" style={{ color: colors.textSecondary, fontWeight: 500 }}>Home</Link>
              <Link to="/about" style={{ color: colors.textSecondary, fontWeight: 500 }}>About</Link>
              <Link to="/place-order" style={{ color: colors.textSecondary, fontWeight: 500 }}>Place Order</Link>
              <Link to="/contact" style={{ color: colors.textSecondary, fontWeight: 500 }}>Contact</Link>
            </Space>
          </div>
          <Text type="secondary" style={{ fontSize: 13 }}>
            © {new Date().getFullYear()} SodaKid. All rights reserved. Supporting the Calgary Food Bank since 2018.
          </Text>
        </div>
      </Footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu, .desktop-auth {
            display: none !important;
          }
          .mobile-menu-btn {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
        
        /* Clean modern nav - no underlines */
        .ant-menu-horizontal {
          border-bottom: none !important;
        }
        
        .ant-menu-horizontal > .ant-menu-item::after {
          display: none !important;
        }
        
        .ant-menu-horizontal > .ant-menu-item {
          color: ${colors.textSecondary} !important;
          transition: all 0.2s ease !important;
        }
        
        .ant-menu-horizontal > .ant-menu-item:hover {
          color: ${colors.primary} !important;
          background: ${colors.primary}10 !important;
          border-radius: 8px;
        }
        
        .ant-menu-horizontal > .ant-menu-item-selected {
          color: ${colors.primary} !important;
          background: ${colors.primary}15 !important;
          border-radius: 8px;
          font-weight: 600;
        }
        
        .ant-menu-horizontal > .ant-menu-item-selected::after {
          display: none !important;
        }
      `}</style>
    </Layout>
  )
}

export default MainLayout
