import React from 'react'
import { useAuth } from '../contexts/AuthContext'

const Hero = ({ onGetQuote }) => {
    const { user } = useAuth()

    const handleGetStarted = () => {
        // If user is already logged in, go to dashboard
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

        // Method 1: Try to find by class (most reliable)
        const headerGetStartedBtn = document.querySelector('header .auth-buttons .btn-primary')
        if (headerGetStartedBtn) {
            headerGetStartedBtn.click()
            return
        }

        // Method 2: Try to find by text content (fallback)
        const buttons = document.querySelectorAll('button')
        for (let btn of buttons) {
            if (btn.textContent === 'Get Started') {
                btn.click()
                return
            }
        }

        // Method 3: Last resort - dispatch custom event
        window.dispatchEvent(new CustomEvent('open_get_started_modal'))
    }

    return (
        <section className="hero">
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
                    <button className="btn-secondary" onClick={handleGetStarted}>Get Started</button>
                </div>
            </div>
        </section>
    )
}

export default Hero
