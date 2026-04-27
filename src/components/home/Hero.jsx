import React, { useState } from 'react'
import LoadingOverlay from '../../common/LoadingOverlay'

const Hero = ({ onGetQuote }) => {
  const [loggingOut, setLoggingOut] = useState(false)

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

  const handleLogout = () => {
    setLoggingOut(true)
    setTimeout(() => {
      sessionStorage.removeItem('zivre_token')
      sessionStorage.removeItem('zivre_user')
      window.location.href = '/'
    }, 500)
  }

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
    <>
      <LoadingOverlay open={loggingOut} message="Logging out..." />
      
      <section className="hero">
        <div className="container">
          <div className="hero-badge">✓ Premium Facility Management</div>
           <h1 className="hero-title">
            <span className="hero-highlight" style={{ fontSize: '3.5rem', display: 'inline-block' }}>
              ZIVRE
            </span>
            <br />
            giving life to facilities
            <br />
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
    </>
  )
}

export default Hero
