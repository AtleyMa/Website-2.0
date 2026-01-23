import React, { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Typography, 
  Button, 
  Row, 
  Col, 
  Card, 
  Space,
  Divider,
  Alert
} from 'antd'
import { 
  ShoppingCartOutlined, 
  HeartOutlined, 
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  ArrowRightOutlined
} from '@ant-design/icons'
import { colors } from '../theme'

const { Title, Paragraph, Text } = Typography

const HomePage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [showAlert, setShowAlert] = React.useState(null)

  useEffect(() => {
    // Check for flash messages from navigation state
    if (location.state?.message) {
      setShowAlert({
        type: location.state.type || 'success',
        message: location.state.message
      })
      // Clear after 5 seconds
      setTimeout(() => setShowAlert(null), 5000)
    }
  }, [location])

  const features = [
    {
      icon: <ShoppingCartOutlined style={{ fontSize: 48, color: colors.primary }} />,
      title: 'Easy Exchange',
      description: 'Simply order online and exchange your empty canisters for full ones at our convenient dropbox location.'
    },
    {
      icon: <HeartOutlined style={{ fontSize: 48, color: colors.secondary }} />,
      title: 'Support Charity',
      description: 'For every canister exchanged, $1 goes directly to the Calgary Food Bank.'
    },
    {
      icon: <SafetyCertificateOutlined style={{ fontSize: 48, color: colors.primary }} />,
      title: 'Save 50%',
      description: 'Get your CO₂ cylinders refilled at over 50% off retail prices.'
    },
    {
      icon: <EnvironmentOutlined style={{ fontSize: 48, color: colors.secondary }} />,
      title: 'Eco-Friendly',
      description: 'Carbon neutral operations - your purchase helps create a sustainable future.'
    }
  ]

  return (
    <div className="fade-in">
      {/* Alert Messages */}
      {showAlert && (
        <div style={{ padding: '16px 24px', paddingBottom: 0 }}>
          <Alert 
            message={showAlert.message} 
            type={showAlert.type} 
            showIcon 
            closable 
            onClose={() => setShowAlert(null)}
          />
        </div>
      )}

      {/* Hero Section */}
      <div style={{ 
        position: 'relative',
        minHeight: '50vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${colors.primary}15 0%, ${colors.secondary}15 50%, ${colors.primary}10 100%)`,
        overflow: 'hidden'
      }}>
        {/* Decorative blurred shapes */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: colors.primary,
          opacity: 0.15,
          filter: 'blur(80px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30%',
          left: '-10%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: colors.secondary,
          opacity: 0.12,
          filter: 'blur(100px)'
        }} />
        
        {/* Content */}
        <div style={{ 
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          padding: '40px 24px',
          maxWidth: 800
        }}>
          <Title style={{ 
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 700,
            marginBottom: 16,
            color: colors.text
          }}>
            Affordable <span style={{ color: colors.primary }}>CO₂ Cylinder</span> Refills
          </Title>
          
          <Paragraph style={{ 
            fontSize: 'clamp(16px, 2vw, 20px)',
            color: colors.textSecondary,
            marginBottom: 32,
            maxWidth: 600,
            margin: '0 auto 32px'
          }}>
            Save over 50% on every canister exchange. Plus, $1 from each refill goes directly to the Calgary Food Bank.
          </Paragraph>
          
          <Space size="large" wrap style={{ justifyContent: 'center' }}>
            <Button 
              type="primary" 
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={() => navigate('/place-order')}
              style={{ 
                height: 52,
                paddingInline: 32,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 8
              }}
            >
              Order Now
            </Button>
            <Button 
              size="large"
              onClick={() => navigate('/about')}
              style={{ 
                height: 52,
                paddingInline: 32,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 8,
                borderColor: colors.primary,
                color: colors.primary
              }}
            >
              Learn More
            </Button>
          </Space>
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <Title level={2} style={{ marginBottom: 16 }}>How it Works</Title>
          <Paragraph 
            style={{ 
              fontSize: 18, 
              maxWidth: 800, 
              margin: '0 auto 32px',
              color: colors.textSecondary
            }}
          >
            Once you have placed your online order, your full canister(s) will be ready for 
            dropbox pickup. Bring your empty canister(s) and exchange them for full ones 
            during your selected time slot. The cost is <Text strong>$10</Text>. For every 
            canister exchanged, SodaKid donates <Text strong>$1 to charity</Text>.
          </Paragraph>
          <Link to="/place-order">
            <Button 
              type="primary" 
              size="large"
              icon={<ShoppingCartOutlined />}
              style={{ 
                height: 50, 
                paddingInline: 40,
                fontSize: 16,
                fontWeight: 500
              }}
            >
              Place Order
            </Button>
          </Link>
        </div>
      </div>

      <Divider style={{ margin: 0 }} />

      {/* Features Section */}
      <div style={{ padding: '80px 24px', background: colors.background }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
            Why Choose SodaKid?
          </Title>
          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <Card 
                  className="hover-card"
                  style={{ 
                    height: '100%', 
                    textAlign: 'center',
                    borderRadius: 16,
                    border: 'none',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.06)'
                  }}
                  bodyStyle={{ padding: 32 }}
                >
                  <div style={{ marginBottom: 24 }}>{feature.icon}</div>
                  <Title level={4} style={{ marginBottom: 12 }}>{feature.title}</Title>
                  <Paragraph style={{ color: colors.textSecondary, marginBottom: 0 }}>
                    {feature.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* Impact Section */}
      <div 
        style={{ 
          padding: '80px 24px', 
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryHover} 100%)`,
          color: 'white'
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
          <Title level={2} style={{ color: 'white', marginBottom: 48 }}>
            Our Impact
          </Title>
          <Row gutter={[48, 48]} justify="center">
            <Col xs={24} sm={8}>
              <div>
                <Title level={1} style={{ color: 'white', marginBottom: 8 }}>$11,300+</Title>
                <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}>
                  Donated to Calgary Food Bank
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div>
                <Title level={1} style={{ color: 'white', marginBottom: 8 }}>$56,500</Title>
                <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}>
                  Worth of Food Provided
                </Text>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div>
                <Title level={1} style={{ color: 'white', marginBottom: 8 }}>4 Tons</Title>
                <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)' }}>
                  of CO₂ Offset
                </Text>
              </div>
            </Col>
          </Row>
          <div style={{ marginTop: 48 }}>
            <Link to="/about">
              <Button 
                size="large" 
                ghost 
                style={{ 
                  borderColor: 'white', 
                  color: 'white',
                  height: 50,
                  paddingInline: 40,
                  fontSize: 16
                }}
              >
                Learn More About Us
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ padding: '80px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Title level={2}>Ready to Save & Support?</Title>
          <Paragraph style={{ fontSize: 18, color: colors.textSecondary, marginBottom: 32 }}>
            Join hundreds of families who save money on CO₂ cylinder refills 
            while supporting their community.
          </Paragraph>
          <Space size="large" wrap style={{ justifyContent: 'center' }}>
            <Link to="/place-order">
              <Button 
                type="primary" 
                size="large"
                style={{ 
                  height: 50, 
                  paddingInline: 40,
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                Place Order Now
              </Button>
            </Link>
            <Link to="/contact">
              <Button 
                size="large"
                style={{ 
                  height: 50, 
                  paddingInline: 40,
                  fontSize: 16
                }}
              >
                Contact Us
              </Button>
            </Link>
          </Space>
        </div>
      </div>
    </div>
  )
}

export default HomePage
