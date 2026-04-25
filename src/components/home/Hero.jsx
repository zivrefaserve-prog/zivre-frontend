import React, { useState } from 'react'

const Hero = ({ onGetQuote }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Helper to get user from sessionStorage
  const getUser = () => {
    const userData = sessionStorage.getItem('zivre_user')
    if (userData) {
      try {
        return JSON.parse(userData)
      } catch (e) {
        return null
      }
    }
    return null
  }

  // Handle logout with loading overlay
  const handleLogout = async () => {
    setIsLoggingOut(true)
    
    // Simulate logout delay for better UX
    setTimeout(() => {
      sessionStorage.removeItem('zivre_token')
      sessionStorage.removeItem('zivre_user')
      window.location.href = '/'
    }, 500)
  }

  // Handle Get Started / Go to Dashboard
  const handleGetStarted = () => {
    const user = getUser()
    
    if (user) {
      if (user.role === 'customer') {
        window.location.href = '/customer/dashboard'
      } else if (user.role === 'provider') {
        window.location.href = '/provider/dashboard'
      } else if (user.role === 'admin') {
        window.location.href = '/admin/dashboard'
      }
      return
    }
    
    window.dispatchEvent(new CustomEvent('open_get_started_modal'))
  }

  // Handle Sign In / Go to Dashboard
  const handleSignIn = () => {
    const user = getUser()
    
    if (user) {
      if (user.role === 'customer') {
        window.location.href = '/customer/dashboard'
      } else if (user.role === 'provider') {
        window.location.href = '/provider/dashboard'
      } else if (user.role === 'admin') {
        window.location.href = '/admin/dashboard'
      }
      return
    }
    
    window.dispatchEvent(new CustomEvent('open_signin_modal'))
  }

  const user = getUser()

  return (
    <section className="hero">
      {/* Logout Loading Overlay */}
      {isLoggingOut && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <div style={{
            width: 60,
            height: 60,
            border: '4px solid #10b981',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: 20
          }} />
          <Typography variant="h6" style={{ fontWeight: 600 }}>Logging out...</Typography>
          <Typography variant="body2" style={{ marginTop: 10, opacity: 0.7 }}>Please wait</Typography>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <div className="container">
        <div className="hero-badge">✓ Premium Facility Management</div>
        <h1 className="hero-title">
          Total Facility Solutions<br />
          <span className="hero-highlight">Across Ghana</span>
        </h1>
        <p className="hero-subtitle">
          Reliable, professional, and affordable facility management for homes and businesses across Ghana.
        </p>
        
        <div className="hero-buttons">
          <button className="btn-primary" onClick={onGetQuote}>Get Free Quote →</button>
          
          {user ? (
            <button className="btn-secondary" onClick={handleGetStarted}>
              Go to Dashboard →
            </button>
          ) : (
            <button className="btn-secondary" onClick={handleGetStarted}>
              Get Started
            </button>
          )}
        </div>
        
        <div className="hero-buttons" style={{ marginTop: '12px' }}>
          {user ? (
            <button 
              className="btn-outline" 
              onClick={handleLogout} 
              style={{ borderColor: '#ef4444', color: '#ef4444' }}
            >
              Logout
            </button>
          ) : (
            <button className="btn-outline" onClick={handleSignIn}>
              Sign In
            </button>
          )}
        </div>

        {user && (
          <div style={{ 
            marginTop: '20px', 
            padding: '10px 20px', 
            backgroundColor: '#e6f7f0', 
            borderRadius: '8px', 
            display: 'inline-block'
          }}>
            <span style={{ color: '#10b981', fontWeight: 600 }}>
              👋 Welcome back, {user.full_name}!
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

export default Hero
