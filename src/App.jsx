import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { TourButton, homepageTourSteps } from './common/DemoTour'
import VerificationSent from './pages/VerificationSent'
import DemoTour from './common/DemoTour'
import Header from './layout/Header'
import Footer from './layout/Footer'
import Hero from './components/home/Hero'
import ServicesGrid from './components/home/ServicesGrid'
import WhyChoose from './components/home/WhyChoose'
import About from './components/home/About'
import ContactForm from './components/home/ContactForm'
import TestimonialsCarousel from './components/home/TestimonialsCarousel'
import CommentSection from './components/home/CommentSection'
import CustomerDashboard from './dashboard/CustomerDashboard'
import ProviderDashboard from './dashboard/ProviderDashboard'
import AdminDashboard from './dashboard/AdminDashboard'
import ProfileSettings from './pages/ProfileSettings'
import Messages from './pages/Messages'
import ResetPassword from './pages/ResetPassword'
import ForgotPasswordModal from './common/ForgotPasswordModal'
import AuthModal from './common/AuthModal'
import { keepAlive } from './api/client'
import LoadingOverlay from './common/LoadingOverlay'
import UserReferralDashboard from './pages/UserReferralDashboard'
import AdminReferralDashboard from './pages/AdminReferralDashboard'
import VerifyEmail from './pages/VerifyEmail'
import './App.css'

const theme = createTheme({
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  palette: {
    primary: { main: '#10b981', light: '#34d399', dark: '#059669' },
    secondary: { main: '#8b5cf6', light: '#a78bfa', dark: '#7c3aed' },
    success: { main: '#10b981' }, warning: { main: '#f59e0b' }, error: { main: '#ef4444' }, info: { main: '#3b82f6' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 }, h2: { fontSize: '2rem', fontWeight: 700 },
    h3: { fontSize: '1.5rem', fontWeight: 600 }, h4: { fontSize: '1.25rem', fontWeight: 600 },
    body1: { fontSize: '0.875rem' }, body2: { fontSize: '0.75rem' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 8, fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 16, boxShadow: '0px 1px 3px rgba(0,0,0,0.05)' } } },
  },
})

const AppRoutes = () => {
  const { user, authLoading, hideAuthLoading } = useAuth()
  const location = useLocation()
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [showHomepageTour, setShowHomepageTour] = useState(false)
  const [showReferralModal, setShowReferralModal] = useState(false)

  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => hideAuthLoading(), 2000)
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
        const allGrids = document.querySelectorAll('.MuiGrid-container')
        allGrids.forEach(grid => { grid.style.flexDirection = 'column' })
      } else {
        document.body.classList.remove('mobile-device')
      }
    }
    forceMobileLayout()
    window.addEventListener('resize', forceMobileLayout)
    return () => {
      window.removeEventListener('resize', setViewport)
      window.removeEventListener('resize', forceMobileLayout)
    }
  }, [])

  useEffect(() => {
    const handleOpenForgotPassword = () => setShowForgotPasswordModal(true)
    window.addEventListener('open_forgot_password', handleOpenForgotPassword)
    return () => window.removeEventListener('open_forgot_password', handleOpenForgotPassword)
  }, [])

  // ========== REFERRAL MODAL - HIGHEST PRIORITY ==========
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    
    console.log('🔍 Checking URL for referral code:', refCode)
    
    if (refCode && !user) {
      // Save to sessionStorage for AuthModal
      sessionStorage.setItem('zivre_referral_code', refCode)
      console.log('✅ Referral code saved, opening modal NOW')
      // Open modal immediately - NO DELAY
      setShowReferralModal(true)
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [user])

  // Tour modal - only show if NO referral modal and user not logged in
  useEffect(() => {
    const tourCompleted = localStorage.getItem('zivre_tour_homepage_completed')
    const hasReferralCode = sessionStorage.getItem('zivre_referral_code')
    
    // Only show tour if:
    // 1. Tour not completed
    // 2. On homepage
    // 3. No user logged in
    // 4. NO referral code active (so it doesn't conflict)
    if (!tourCompleted && location.pathname === '/' && !user && !hasReferralCode) {
      const timer = setTimeout(() => setShowHomepageTour(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [location, user])

  const handleHomepageTourComplete = () => {
    localStorage.setItem('zivre_tour_homepage_completed', 'true')
    setShowHomepageTour(false)
  }

  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      keepAlive().catch(() => {})
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user])

  // Keep backend awake
  useEffect(() => {
    fetch('https://zivre-backend.onrender.com/api/services').catch(() => {})
    const interval = setInterval(() => {
      fetch('https://zivre-backend.onrender.com/api/services').catch(() => {})
    }, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleCloseReferralModal = () => {
    console.log('Closing referral modal')
    setShowReferralModal(false)
    // Clear the stored code
    sessionStorage.removeItem('zivre_referral_code')
  }

  const handleReferralSuccess = (loggedInUser) => {
    console.log('Referral signup success:', loggedInUser)
    handleCloseReferralModal()
    if (loggedInUser.role === 'customer') {
      window.location.href = '/customer/dashboard'
    } else if (loggedInUser.role === 'provider') {
      window.location.href = '/provider/dashboard'
    } else if (loggedInUser.role === 'admin') {
      window.location.href = '/admin/dashboard'
    }
  }

  const handleSwitchToSignIn = () => {
    handleCloseReferralModal()
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open_signin_modal'))
    }, 100)
  }

  return (
    <>
      <LoadingOverlay open={authLoading} message={authLoading ? "Logging out..." : ""} />
      
      {/* REFERRAL MODAL - Shows IMMEDIATELY when URL has ?ref= */}
      {showReferralModal && !user && (
        <AuthModal 
          isSignUp={true} 
          role="customer" 
          onClose={handleCloseReferralModal}
          onSuccess={handleReferralSuccess}
          onSwitchToSignIn={handleSwitchToSignIn}
        />
      )}
      
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verification-sent" element={<VerificationSent />} />
        <Route path="/profile" element={user ? <ProfileSettings /> : <Navigate to="/" />} />
        <Route path="/messages" element={user ? <Messages /> : <Navigate to="/" />} />
        <Route path="/customer/dashboard" element={user ? <CustomerDashboard /> : <Navigate to="/" />} />
        <Route path="/provider/dashboard" element={user ? <ProviderDashboard /> : <Navigate to="/" />} />
        <Route path="/admin/dashboard" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/referrals" element={user ? <UserReferralDashboard /> : <Navigate to="/" />} />
        <Route path="/admin/referrals" element={user?.role === 'admin' ? <AdminReferralDashboard /> : <Navigate to="/" />} />
        <Route path="/my-requests" element={<Navigate to="/customer/dashboard" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
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
            
            {/* TOUR MODAL - Only shows if NO referral modal is active */}
            {!user && !showReferralModal && (
              <DemoTour 
                open={showHomepageTour}
                onClose={() => setShowHomepageTour(false)}
                onComplete={handleHomepageTourComplete}
                steps={homepageTourSteps}
                title="Welcome to Zivre!"
              />
            )}
            
            {/* Tour button - only show if no referral modal */}
            {!user && !showReferralModal && <TourButton tourSteps={homepageTourSteps} title="Welcome to Zivre!" />}
          </>
        } />
      </Routes>
      
      {showForgotPasswordModal && (
        <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />
      )}
    </>
  )
}

const AppWithWebSocket = () => {
  const { user } = useAuth()
  return (
    <WebSocketProvider userId={user?.id}>
      <AppRoutes />
    </WebSocketProvider>
  )
}

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
