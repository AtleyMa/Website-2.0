import React from 'react'
import { Link } from 'react-router-dom'
import { Typography, Button, Card } from 'antd'
import { ShoppingCartOutlined } from '@ant-design/icons'
import { colors } from '../theme'

const { Title, Paragraph } = Typography

const AboutSection = ({ title, text, image, bgColor, reverse, showButton }) => (
  <Card
    style={{
      marginBottom: 32,
      borderRadius: 20,
      border: 'none',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
    }}
    bodyStyle={{ padding: 0 }}
  >
    <div style={{
      display: 'flex',
      flexDirection: reverse ? 'row-reverse' : 'row',
      flexWrap: 'wrap'
    }}>
      {/* Image Side */}
      <div style={{
        flex: '1 1 400px',
        minHeight: 320
      }}>
        <img
          src={image}
          alt={title}
          style={{
            width: '100%',
            height: '100%',
            minHeight: 320,
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>

      {/* Content Side */}
      <div style={{
        flex: '1 1 400px',
        background: bgColor,
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <Title level={2} style={{ marginTop: 0, marginBottom: 20, fontSize: 28 }}>
          {title}
        </Title>
        <Paragraph style={{ 
          fontSize: 16, 
          lineHeight: 1.8, 
          marginBottom: showButton ? 28 : 0,
          color: 'rgba(0,0,0,0.75)'
        }}>
          {text}
        </Paragraph>
        {showButton && (
          <div>
            <Link to="/place-order">
              <Button
                type="default"
                size="large"
                icon={<ShoppingCartOutlined />}
                style={{
                  background: '#fff',
                  borderColor: '#fff',
                  color: colors.text,
                  fontWeight: 600,
                  height: 48,
                  paddingInline: 32,
                  borderRadius: 10,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                Place Order
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  </Card>
)

const AboutPage = () => {
  return (
    <div className="fade-in" style={{ 
      padding: '48px 24px', 
      maxWidth: 1100, 
      margin: '0 auto' 
    }}>
      <AboutSection
        title="About Me"
        text="Hello, I am the SodaKid. I offer a CO₂ cylinder exchange service at over 50% off retail prices, with $1.00 from every sale going to support the Calgary Food Bank. I started this business at the age of 9 to learn about money and running my own business. Thank you to all of my customers for your support and encouragement. It means a lot to me."
        image="/images/chewie-and-i.jpg"
        bgColor={colors.secondary}
        reverse={false}
      />

      <AboutSection
        title="How it Works"
        text="Once you have placed your order, your full cylinder(s) will be in the mailbox, available for exchange of your empty cylinder(s) during your selected timeslot. The cost is $10 and $1 is donated to charity for every cylinder exchanged."
        image="/images/canister-swap.png"
        bgColor={colors.primary}
        reverse={true}
        showButton={true}
      />

      <AboutSection
        title="Donations"
        text="SodaKid has made many sizeable donations to the Calgary Food Bank through the CBC's Food Bank Drive since its inception. SodaKid has donated over $11,300 in 6 years of business. For every $1 donated to the food bank, $5 worth of food goes to those in need. That is $56,500 worth of food! Together we are making a positive impact in our shared community."
        image="/images/donation-cbc.jpg"
        bgColor={colors.secondary}
        reverse={false}
      />

      <AboutSection
        title="Carbon Neutral"
        text="SodaKid has offset its carbon emissions from the inception of its business with a carbon credit project. That's 4 tons of CO₂ to date! When you exchange your cylinders with SodaKid, your purchase is carbon neutral. We are one step closer to a net-zero future!"
        image="/images/carbon-neutral-about.jpg"
        bgColor={colors.primary}
        reverse={true}
      />
    </div>
  )
}

export default AboutPage
