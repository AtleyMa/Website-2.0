import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Typography, 
  Steps, 
  Card, 
  Button, 
  Row, 
  Col, 
  InputNumber,
  Modal,
  Space,
  Spin,
  Badge,
  Divider,
  message
} from 'antd'
import { 
  LeftOutlined, 
  RightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { ordersAPI } from '../services/api'
import { colors } from '../theme'

const { Title, Paragraph, Text } = Typography

const PlaceOrderPage = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  
  // Order state
  const [canisterType, setCanisterType] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [timeModalVisible, setTimeModalVisible] = useState(false)
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [availability, setAvailability] = useState({})

  const blueMax = 24
  const pinkMax = 8

  useEffect(() => {
    // Fetch availability when month changes
    fetchAvailability()
  }, [currentMonth])

  const fetchAvailability = async () => {
    setLoading(true)
    try {
      const response = await ordersAPI.getAvailability(
        currentMonth.month() + 1, 
        currentMonth.year()
      )
      setAvailability(response.data)
    } catch (error) {
      // Use empty availability on error
      setAvailability({})
    }
    setLoading(false)
  }

  const maxQuantity = canisterType === 'Blue (Original)' ? blueMax : pinkMax

  const handleCanisterSelect = async (type) => {
    setCanisterType(type)
    try {
      await ordersAPI.setCanisterType(type)
    } catch (error) {
      console.error('Error setting canister type:', error)
    }
    setCurrentStep(1)
  }

  const handleQuantitySubmit = async () => {
    try {
      await ordersAPI.setQuantity(quantity)
      setCurrentStep(2)
    } catch (error) {
      message.error('Error setting quantity')
    }
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setTimeModalVisible(true)
  }

  const handleTimeSelect = async (time) => {
    setSelectedTime(time)
    setTimeModalVisible(false)
    setCheckoutLoading(true)
    
    try {
      const response = await ordersAPI.createCheckoutSession({
        time,
        date: selectedDate.format('M_D_YYYY'),
        canisterType,
        quantity
      })
      
      // Redirect to Stripe Checkout
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl
      }
    } catch (error) {
      message.error('Error creating checkout session')
      setCheckoutLoading(false)
    }
  }

  const renderCalendar = () => {
    const today = dayjs()
    const startOfMonth = currentMonth.startOf('month')
    const endOfMonth = currentMonth.endOf('month')
    const startDay = startOfMonth.day() // 0 = Sunday
    const daysInMonth = endOfMonth.date()
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const weeks = []
    let currentWeek = []

    // Add empty cells for days before the month starts
    for (let i = 0; i < startDay; i++) {
      currentWeek.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = currentMonth.date(day)
      const isPast = date.isBefore(today, 'day')
      const isToday = date.isSame(today, 'day')
      const isTooLate = isToday && dayjs().hour() >= 22
      
      currentWeek.push({
        day,
        date,
        isPast,
        isToday,
        isDisabled: isPast || isTooLate
      })

      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }

    // Add empty cells for remaining days
    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(null)
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    return (
      <div>
        {/* Calendar Header */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col>
            <Title level={3} style={{ marginBottom: 0 }}>
              {currentMonth.format('MMMM YYYY')}
            </Title>
          </Col>
          <Col>
            <Space>
              <Button 
                icon={<LeftOutlined />} 
                onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
                disabled={currentMonth.isSame(dayjs(), 'month')}
              />
              <Button 
                icon={<RightOutlined />} 
                onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
                disabled={currentMonth.diff(dayjs(), 'month') >= 1}
              />
            </Space>
          </Col>
        </Row>

        <Paragraph style={{ marginBottom: 16, color: colors.textSecondary }}>
          Click on a date to schedule your canister exchange
        </Paragraph>

        {/* Legend */}
        <Space style={{ marginBottom: 16 }}>
          <Badge color={colors.secondary} text="Available" />
          <Badge color="#ccc" text="Unavailable" />
        </Space>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        ) : (
          <div style={{ 
            border: `1px solid ${colors.border}`, 
            borderRadius: 12,
            overflow: 'hidden'
          }}>
            {/* Days header */}
            <Row style={{ background: colors.primary }}>
              {days.map(day => (
                <Col key={day} span={24/7} style={{ 
                  textAlign: 'center', 
                  padding: '12px 0',
                  fontWeight: 600,
                  color: 'white'
                }}>
                  {day}
                </Col>
              ))}
            </Row>

            {/* Calendar weeks */}
            {weeks.map((week, weekIndex) => (
              <Row key={weekIndex}>
                {week.map((dayData, dayIndex) => (
                  <Col 
                    key={dayIndex} 
                    span={24/7}
                    style={{ 
                      borderTop: `1px solid ${colors.border}`,
                      borderRight: dayIndex < 6 ? `1px solid ${colors.border}` : 'none',
                      minHeight: 80,
                      background: dayData?.isDisabled ? '#f5f5f5' : 
                                 dayData?.isToday ? `rgba(184, 207, 55, 0.2)` : 'white'
                    }}
                  >
                    {dayData && (
                      <div 
                        className={`calendar-day ${dayData.isDisabled ? 'disabled' : ''} ${dayData.isToday ? 'today' : ''}`}
                        onClick={() => !dayData.isDisabled && handleDateSelect(dayData.date)}
                        style={{
                          padding: 8,
                          height: '100%',
                          cursor: dayData.isDisabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Text 
                          strong={dayData.isToday}
                          style={{ 
                            color: dayData.isDisabled ? colors.textMuted : colors.textPrimary 
                          }}
                        >
                          {dayData.day}
                        </Text>
                        {dayData.isToday && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>Today</Text>
                          </div>
                        )}
                      </div>
                    )}
                  </Col>
                ))}
              </Row>
            ))}
          </div>
        )}
      </div>
    )
  }

  const steps = [
    {
      title: 'Select Canister',
      content: (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Title level={3}>Which type of canister would you like to exchange?</Title>
          <Paragraph style={{ color: colors.textSecondary, marginBottom: 48 }}>
            Canisters must be exchanged like for like (blue for blue or pink for pink)
          </Paragraph>

          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} sm={12} md={10}>
              <Card 
                hoverable
                onClick={() => handleCanisterSelect('Blue (Original)')}
                className={`hover-card ${canisterType === 'Blue (Original)' ? 'selected' : ''}`}
                style={{ 
                  borderRadius: 20,
                  border: canisterType === 'Blue (Original)' ? `3px solid ${colors.blue}` : '1px solid #e8e8e8',
                  overflow: 'hidden'
                }}
                bodyStyle={{ padding: 32 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <img 
                    src="/images/blue-canister.png" 
                    alt="Blue Canister"
                    className="canister-image"
                    style={{ 
                      height: 200, 
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <Button 
                  type="primary"
                  size="large"
                  block
                  style={{ 
                    background: colors.blue,
                    borderColor: colors.blue,
                    height: 48,
                    fontWeight: 600
                  }}
                >
                  Blue (Original)
                </Button>
                <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                  Max {blueMax} canisters per order
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} md={10}>
              <Card 
                hoverable
                onClick={() => handleCanisterSelect('Pink (Terra)')}
                className={`hover-card ${canisterType === 'Pink (Terra)' ? 'selected' : ''}`}
                style={{ 
                  borderRadius: 20,
                  border: canisterType === 'Pink (Terra)' ? `3px solid ${colors.pink}` : '1px solid #e8e8e8',
                  overflow: 'hidden'
                }}
                bodyStyle={{ padding: 32 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <img 
                    src="/images/pink-canister.png" 
                    alt="Pink Canister"
                    className="canister-image"
                    style={{ 
                      height: 200, 
                      objectFit: 'contain'
                    }}
                  />
                </div>
                <Button 
                  type="primary"
                  size="large"
                  block
                  style={{ 
                    background: colors.pink,
                    borderColor: colors.pink,
                    height: 48,
                    fontWeight: 600
                  }}
                >
                  Pink (Terra)
                </Button>
                <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                  Max {pinkMax} canisters per order
                </Text>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      title: 'Select Quantity',
      content: (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <Title level={3}>How many canisters would you like to exchange?</Title>
          <Paragraph style={{ color: colors.textSecondary, marginBottom: 48 }}>
            Please select a value between 1 and {maxQuantity}
          </Paragraph>

          <Card 
            style={{ 
              maxWidth: 400, 
              margin: '0 auto', 
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
            }}
            bodyStyle={{ padding: 40 }}
          >
            <div style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 18, marginBottom: 16, display: 'block' }}>
                Number of Canisters
              </Text>
              <InputNumber
                size="large"
                min={1}
                max={maxQuantity}
                value={quantity}
                onChange={setQuantity}
                style={{ 
                  width: '100%', 
                  height: 56,
                  fontSize: 24
                }}
              />
            </div>

            <div style={{ 
              background: colors.background, 
              padding: 16, 
              borderRadius: 8,
              marginBottom: 24
            }}>
              <Row justify="space-between">
                <Text>Price per canister:</Text>
                <Text strong>$10.00</Text>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Row justify="space-between">
                <Text strong style={{ fontSize: 16 }}>Total:</Text>
                <Text strong style={{ fontSize: 18, color: colors.primary }}>
                  ${(quantity * 10).toFixed(2)}
                </Text>
              </Row>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                Includes ${quantity}.00 donation to Calgary Food Bank
              </Text>
            </div>

            <Space style={{ width: '100%' }}>
              <Button 
                size="large"
                onClick={() => setCurrentStep(0)}
                style={{ flex: 1 }}
              >
                Back
              </Button>
              <Button 
                type="primary"
                size="large"
                onClick={handleQuantitySubmit}
                style={{ 
                  flex: 2,
                  background: colors.secondary,
                  borderColor: colors.secondary,
                  fontWeight: 500
                }}
              >
                Next
              </Button>
            </Space>
          </Card>
        </div>
      )
    },
    {
      title: 'Select Date & Time',
      content: (
        <div style={{ padding: '32px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={3}>Choose your exchange date and time</Title>
            <Paragraph style={{ color: colors.textSecondary }}>
              Select a date when you'd like to exchange your canisters
            </Paragraph>
          </div>

          <Card 
            style={{ 
              maxWidth: 800, 
              margin: '0 auto', 
              borderRadius: 16,
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
            }}
            bodyStyle={{ padding: 32 }}
          >
            {renderCalendar()}
            
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Button 
                size="large"
                onClick={() => setCurrentStep(1)}
              >
                Back to Quantity
              </Button>
            </div>
          </Card>
        </div>
      )
    }
  ]

  return (
    <div className="fade-in" style={{ padding: '48px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 48 }}>
          Place Your Order
        </Title>

        <Steps
          current={currentStep}
          items={steps.map(s => ({ title: s.title }))}
          style={{ maxWidth: 600, margin: '0 auto 48px' }}
        />

        {steps[currentStep].content}
      </div>

      {/* Time Selection Modal */}
      <Modal
        title={
          <div>
            <Title level={4} style={{ marginBottom: 0 }}>
              Select Pickup Time
            </Title>
            <Text type="secondary">
              {selectedDate?.format('dddd, MMMM D, YYYY')}
            </Text>
          </div>
        }
        open={timeModalVisible}
        onCancel={() => setTimeModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <Paragraph style={{ marginBottom: 24 }}>
          Click on a time block to schedule your canister exchange:
        </Paragraph>

        <Space style={{ marginBottom: 24 }}>
          <Badge color={colors.secondary} text="Available" />
          <Badge color="#ccc" text="Booked" />
        </Space>

        <div style={{ marginBottom: 24 }}>
          <Card 
            hoverable
            onClick={() => handleTimeSelect('a')}
            style={{ 
              marginBottom: 16, 
              borderRadius: 12,
              border: `2px solid ${colors.secondary}`,
              background: `linear-gradient(135deg, rgba(184, 207, 55, 0.1) 0%, rgba(184, 207, 55, 0.05) 100%)`
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <ClockCircleOutlined style={{ fontSize: 20, color: colors.secondary }} />
                  <div>
                    <Text strong style={{ fontSize: 16 }}>Morning / Afternoon</Text>
                    <Text type="secondary" style={{ display: 'block' }}>7:00 AM - 5:00 PM</Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <CheckCircleFilled style={{ fontSize: 24, color: colors.secondary }} />
              </Col>
            </Row>
          </Card>

          <Card 
            hoverable
            onClick={() => handleTimeSelect('p')}
            style={{ 
              borderRadius: 12,
              border: `2px solid ${colors.primary}`,
              background: `linear-gradient(135deg, rgba(135, 204, 217, 0.1) 0%, rgba(135, 204, 217, 0.05) 100%)`
            }}
            bodyStyle={{ padding: 20 }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Space>
                  <ClockCircleOutlined style={{ fontSize: 20, color: colors.primary }} />
                  <div>
                    <Text strong style={{ fontSize: 16 }}>Evening</Text>
                    <Text type="secondary" style={{ display: 'block' }}>5:00 PM - 9:00 PM</Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <CheckCircleFilled style={{ fontSize: 24, color: colors.primary }} />
              </Col>
            </Row>
          </Card>
        </div>

        <div style={{ 
          background: colors.background, 
          padding: 16, 
          borderRadius: 8,
          textAlign: 'center'
        }}>
          <Text type="secondary">
            📍 Pickup Location: 2005 29 Ave SW, Calgary
          </Text>
        </div>
      </Modal>

      {/* Checkout Loading Overlay */}
      {checkoutLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16, fontSize: 16 }}>
              Redirecting to secure checkout...
            </Paragraph>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaceOrderPage
