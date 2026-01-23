import React from 'react'
import { Link } from 'react-router-dom'
import { Typography, Result, Button, Card, Space } from 'antd'
import { CloseCircleFilled, ShoppingCartOutlined, HomeOutlined } from '@ant-design/icons'
import { colors } from '../theme'

const { Title, Paragraph } = Typography

const CancelPage = () => {
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
            <CloseCircleFilled 
              style={{ 
                fontSize: 80, 
                color: colors.warning,
                marginBottom: 24
              }} 
            />
            <Title level={2} style={{ marginBottom: 8 }}>
              Order Cancelled
            </Title>
            <Paragraph style={{ fontSize: 16, color: colors.textSecondary }}>
              Your order was cancelled. No charges have been made to your account.
            </Paragraph>
          </div>

          <Card 
            style={{ 
              background: colors.background,
              borderRadius: 16,
              marginBottom: 32
            }}
            bodyStyle={{ padding: 24, textAlign: 'left' }}
          >
            <Title level={5} style={{ marginBottom: 12 }}>
              Need Help?
            </Title>
            <Paragraph style={{ marginBottom: 0 }}>
              If you experienced any issues during checkout or have questions, 
              please don't hesitate to <Link to="/contact">contact us</Link>.
            </Paragraph>
          </Card>

          <Space size="large" wrap style={{ justifyContent: 'center' }}>
            <Link to="/place-order">
              <Button 
                type="primary"
                icon={<ShoppingCartOutlined />}
                size="large"
                style={{ 
                  height: 48,
                  paddingInline: 32,
                  fontWeight: 500
                }}
              >
                Try Again
              </Button>
            </Link>
            <Link to="/">
              <Button 
                icon={<HomeOutlined />}
                size="large"
                style={{ 
                  height: 48,
                  paddingInline: 32
                }}
              >
                Back to Home
              </Button>
            </Link>
          </Space>
        </Card>
      </div>
    </div>
  )
}

export default CancelPage
