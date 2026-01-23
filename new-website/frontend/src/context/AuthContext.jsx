import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import api from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingVerification, setPendingVerification] = useState(null)

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const response = await api.get('/auth/me')
        setUser(response.data.user)
      }
    } catch (error) {
      localStorage.removeItem('token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { token, user: userData } = response.data
      localStorage.setItem('token', token)
      setUser(userData)
      message.success('Welcome back!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid email or password'
      message.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Login with existing token (for OAuth callback)
  const loginWithToken = async (token) => {
    try {
      localStorage.setItem('token', token)
      const response = await api.get('/auth/me')
      setUser(response.data.user)
      return { success: true }
    } catch (error) {
      localStorage.removeItem('token')
      return { success: false }
    }
  }

  const signUp = async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData)
      setPendingVerification({
        phone: userData.phone,
        type: 'signup',
        ...response.data
      })
      message.info('Verification code sent to your phone')
      return { success: true, needsVerification: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Sign up failed'
      message.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const verifyAccount = async (code) => {
    try {
      const response = await api.post('/auth/verify-account', {
        code,
        ...pendingVerification
      })
      const { token, user: userData } = response.data
      localStorage.setItem('token', token)
      setUser(userData)
      setPendingVerification(null)
      message.success('Account verified successfully!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Verification failed'
      message.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const forgotPassword = async (phone) => {
    try {
      const response = await api.post('/auth/forgot-password', { phone })
      setPendingVerification({
        phone,
        type: 'password-reset',
        ...response.data
      })
      message.info('Verification code sent to your phone')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Phone number not found'
      message.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const verifyPhone = async (code) => {
    try {
      const response = await api.post('/auth/verify-phone', {
        code,
        phone: pendingVerification?.phone
      })
      setPendingVerification({
        ...pendingVerification,
        verified: true,
        resetToken: response.data.resetToken
      })
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid verification code'
      message.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const resetPassword = async (newPassword) => {
    try {
      await api.post('/auth/reset-password', {
        password: newPassword,
        phone: pendingVerification?.phone,
        resetToken: pendingVerification?.resetToken
      })
      setPendingVerification(null)
      message.success('Password reset successfully!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed'
      message.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const resendCode = async () => {
    try {
      const endpoint = pendingVerification?.type === 'signup' 
        ? '/auth/resend-signup-code'
        : '/auth/resend-reset-code'
      await api.post(endpoint, { phone: pendingVerification?.phone })
      message.success('Verification code resent!')
      return { success: true }
    } catch (error) {
      message.error('Failed to resend code')
      return { success: false }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    message.success('Logged out successfully')
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    pendingVerification,
    login,
    loginWithToken,
    signUp,
    verifyAccount,
    forgotPassword,
    verifyPhone,
    resetPassword,
    resendCode,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
