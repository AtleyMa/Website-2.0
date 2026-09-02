import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect for admin routes or login attempts
      const isAdminRoute = error.config?.url?.includes('/admin/')
      const isLoginRoute = error.config?.url?.includes('/login')
      
      if (!isAdminRoute && !isLoginRoute) {
        localStorage.removeItem('token')
        // Optionally redirect to login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/dev') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  verifyAccount: (data) => api.post('/auth/verify-account', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyPhone: (data) => api.post('/auth/verify-phone', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  resendCode: (data) => api.post('/auth/resend-code', data),
  getMe: () => api.get('/auth/me'),
}

// Orders API
export const ordersAPI = {
  getAvailability: (month, year) => api.get(`/orders/availability?month=${month}&year=${year}`),
  setCanisterType: (canType) => api.post('/orders/canister-type', { canType }),
  setQuantity: (quantity) => api.post('/orders/quantity', { quantity }),
  createCheckoutSession: (data) => api.post('/orders/create-checkout-session', data),
  getOrderHistory: () => api.get('/orders/history'),
  cancelOrder: (exchangeId) => api.post(`/orders/${exchangeId}/cancel`),
  rescheduleOrder: (exchangeId, date) => api.post(`/orders/${exchangeId}/reschedule`, { date }),
  getRecentOrder: (sessionId) => api.get(`/orders/recent?session_id=${sessionId}`),
}

// Contact API
export const contactAPI = {
  sendMessage: (data) => api.post('/contact', data),
}

// Account API
export const accountAPI = {
  getProfile: () => api.get('/account/profile'),
  updateProfile: (data) => api.put('/account/profile', data),
  getExchangeHistory: () => api.get('/account/exchanges'),
}

export default api
