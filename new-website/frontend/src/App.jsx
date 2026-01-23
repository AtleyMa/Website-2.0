import React from 'react'
import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import VerifyAccountPage from './pages/VerifyAccountPage'
import VerifyPhonePage from './pages/VerifyPhonePage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PlaceOrderPage from './pages/PlaceOrderPage'
import AccountPage from './pages/AccountPage'
import SuccessPage from './pages/SuccessPage'
import CancelPage from './pages/CancelPage'
import AdminDashboard from './pages/AdminDashboard'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="sign-up" element={<SignUpPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="verify-account" element={<VerifyAccountPage />} />
        <Route path="verify-phone" element={<VerifyPhonePage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected Routes */}
        <Route path="place-order" element={
          <ProtectedRoute>
            <PlaceOrderPage />
          </ProtectedRoute>
        } />
        <Route path="account" element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        } />
        <Route path="success" element={
          <ProtectedRoute>
            <SuccessPage />
          </ProtectedRoute>
        } />
        <Route path="cancel" element={<CancelPage />} />
        
        {/* Admin Route */}
        <Route path="dev" element={<AdminDashboard />} />
      </Route>
    </Routes>
  )
}

export default App
