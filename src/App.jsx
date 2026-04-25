import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { TourButton, homepageTourSteps } from './common/DemoTour'
import DemoTour from './common/DemoTour'
import Header from './layout/Header'
import Footer from './layout/Footer'
import Hero from './components/home/Hero'
import ReferralSignup from './pages/ReferralSignup'
import ServicesGrid from './components/home/ServicesGrid'
import WhyChoose from './components/home/WhyChoose'
import About from './components/home/About'
import ContactForm from './components/home/ContactForm'
import TestimonialsCarousel from './components/home/TestimonialsCarousel'
import CommentSection from './components/home/CommentSection'
import PaymentFlier from './common/PaymentFlier'
import CustomerDashboard from './dashboard/CustomerDashboard'
import ProviderDashboard from './dashboard/ProviderDashboard'
import AdminDashboard from './dashboard/AdminDashboard'
import ProfileSettings from './pages/ProfileSettings'
import Messages from './pages/Messages'
import ResetPassword from './pages/ResetPassword'
import ForgotPasswordModal from './common/ForgotPasswordModal'
import { keepAlive } from './api/client'
import LoadingOverlay from './common/LoadingOverlay'
import UserReferralDashboard from './pages/UserReferralDashboard'
import AdminReferralDashboard from './pages/AdminReferralDashboard'
import './App.css'

// Force mobile breakpoints in theme
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  palette: {
    primary: { main: '#10b981', light: '#34d399', dark: '#059669' },
    secondary: { main: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' },
    success: { main: '#10b981', light: '#34d399', dark: '#059669' },
    warning: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    error: { main: '#ef4444', light: '#f87171', dark: '#dc2626' },
    info: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
    h4: { fontSize: '1.25rem', fontWeight: 600 },
    h5: { fontSize: '1.125rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem', lineHeight: 1.5 },
    body2: { fontSize: '0.75rem', lineHeight: 1.5 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8, fontWeight: 600, padding: '8px 16px' },
        containedPrimary: { backgroundColor: '#10b981', '&:hover': { backgroundColor: '#059669' } },
      },
    },
    MuiCard: {
      styleOverrides: { 
        root: { 
          borderRadius: 16, 
          boxShadow: '0px 1px 3px rgba(0,0,0,0.05)', 
          transition: 'all 0.2s ease', 
          '&:hover': { 
            boxShadow: '0px 10px 25px -5px rgba(0,0,0,0.08)', 
            transform: 'translateY(-2px)' 
          } 
        } 
      },
    },
    MuiUseMediaQuery: {
      defaultProps: {
        noSsr: true,
      },
    },
  },
})

// Component that uses routing hooks
const AppRoutes = () => {
  const { user, authLoading, hideAuthLoading } = useAuth()
  const location = useLocation()
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [showHomepageTour, setShowHomepageTour] = useState(false)

  // FIX: Auto-hide loading overlay after max 2 seconds
  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => {
        hideAuthLoading()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [authLoading, hideAuthLoading])

  // FORCE MOBILE LAYOUT
  useEffect(() => {
    const setViewport = () => {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport && window.innerWidth <= 768) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes, viewport-fit=cover')
      }
    }
    setViewport()
    window.addEventListener('resize', setViewport)
    
    const forceMobileLayout = () => {
      if (window.innerWidth <= 768) {
        document.body.classList.add('mobile-device')
        document.body.classList.remove('desktop-device')
        const allGrids = document.querySelectorAll('.MuiGrid-container')
        allGrids.forEach(grid => {
          grid.style.flexDirection = 'column'
        })
      } else {
        document.body.classList.add('desktop-device')
        document.body.classList.remove('mobile-device')
      }
    }
    
    forceMobileLayout()
    window.addEventListener('resize', forceMobileLayout)
    
    const timer = setTimeout(forceMobileLayout, 100)
    
    return () => {
      window.removeEventListener('resize', setViewport)
      window.removeEventListener('resize', forceMobileLayout)
      clearTimeout(timer)
    }
  }, [])

  // Listen for forgot password event
  useEffect(() => {
    const handleOpenForgotPassword = () => {
      console.log('Opening forgot password modal from event')
      setShowForgotPasswordModal(true)
    }
    
    window.addEventListener('open_forgot_password', handleOpenForgotPassword)
    
    return () => {
      window.removeEventListener('open_forgot_password', handleOpenForgotPassword)
    }
  }, [])


    // Check URL for referral code and auto-open signup modal
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    
    if (refCode) {
      // Store referral code in sessionStorage
      sessionStorage.setItem('zivre_referral_code', refCode);
      
      // Auto-open the signup modal after a short delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('open_get_started_modal'));
      }, 500);
    }
  }, []);
  
  // SESSION KEEP ALIVE
  useEffect(() => {
    if (!user) return
    
    const interval = setInterval(() => {
      keepAlive().catch((err) => {
        console.log('Session ping failed:', err.response?.status)
      })
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [user])

  // Homepage tour auto-show on first visit
  useEffect(() => {
    const tourCompleted = localStorage.getItem('zivre_tour_homepage_completed')
    const isHomepage = location.pathname === '/'
    if (!tourCompleted && isHomepage && !user) {
      const timer = setTimeout(() => setShowHomepageTour(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [location, user])

  const handleHomepageTourComplete = () => {
    localStorage.setItem('zivre_tour_homepage_completed', 'true')
    setShowHomepageTour(false)
  }

  // KEEP BACKEND AWAKE
  useEffect(() => {
    fetch('https://zivre-backend.onrender.com/api/services')
      .catch(() => console.log('Backend waking up...'))
    
    const keepAliveInterval = setInterval(() => {
      fetch('https://zivre-backend.onrender.com/api/services')
        .catch(() => {})
    }, 2 * 60 * 1000)
    
    return () => clearInterval(keepAliveInterval)
  }, [])

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <LoadingOverlay open={authLoading} message={authLoading ? "Logging out..." : ""} />
      
      <Routes>
        <Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/profile" element={
          user ? <ProfileSettings /> : <Navigate to="/" />
        } />
        <Route path="/messages" element={
          user ? <Messages /> : <Navigate to="/" />
        } />
        <Route path="/customer/dashboard" element={
          user ? <CustomerDashboard /> : <Navigate to="/" />
        } />
        <Route path="/provider/dashboard" element={
          user ? <ProviderDashboard /> : <Navigate to="/" />
        } />
        <Route path="/admin/dashboard" element={
          user && user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />
        } />
        
        <Route path="/referrals" element={
          user ? <UserReferralDashboard /> : <Navigate to="/" />
        } />
        <Route path="/admin/referrals" element={
          user && user.role === 'admin' ? <AdminReferralDashboard /> : <Navigate to="/" />
        } />
        
        <Route path="/my-requests" element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        
        <Route path="/" element={
          <>
            <Header onGetQuote={scrollToContact} />
            <main>
              <Hero onGetQuote={scrollToContact} />
              <ServicesGrid />
              <WhyChoose />
              <About />
              <TestimonialsCarousel />
              <ContactForm />
              <CommentSection />
            </main>
            <Footer />
            
            {/* Homepage Tour - Auto shows for visitors */}
            {!user && (
              <DemoTour 
                open={showHomepageTour}
                onClose={() => setShowHomepageTour(false)}
                onComplete={handleHomepageTourComplete}
                steps={homepageTourSteps}
                title="Welcome to Zivre!"
              />
            )}
            
            {/* Manual Start Tour button for homepage */}
            {!user && <TourButton tourSteps={homepageTourSteps} title="Welcome to Zivre!" />}
          </>
        } />
      </Routes>
      
      {showForgotPasswordModal && (
        <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />
      )}
    </>
  )
}

// Wrapper component for WebSocket
const AppWithWebSocket = () => {
  const { user } = useAuth()
  return (
    <WebSocketProvider userId={user?.id}>
      <AppRoutes />
    </WebSocketProvider>
  )
}

// Main App component
function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <AppWithWebSocket />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
