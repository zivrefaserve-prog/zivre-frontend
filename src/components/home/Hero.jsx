import React from 'react'

const Hero = ({ onGetQuote }) => {
    const handleGetStarted = () => {
        // Check if user is logged in via sessionStorage
        const userData = sessionStorage.getItem('zivre_user')
        
        if (userData) {
            try {
                const user = JSON.parse(userData)
                if (user.role === 'customer') {
                    window.location.href = '/customer/dashboard'
                    return
                } else if (user.role === 'provider') {
                    window.location.href = '/provider/dashboard'
                    return
                } else if (user.role === 'admin') {
                    window.location.href = '/admin/dashboard'
                    return
                }
            } catch (e) {
                console.error('Error parsing user data', e)
            }
        }

        // DIRECT APPROACH: Find ALL possible Get Started buttons
        const allButtons = document.querySelectorAll('button')
        
        for (let btn of allButtons) {
            const btnText = btn.textContent || btn.innerText
            if (btnText === 'Get Started' || btnText.includes('Get Started')) {
                // Add a small delay to ensure click registers on mobile
                setTimeout(() => {
                    btn.click()
                }, 50)
                return
            }
        }
        
        // If button not found, try to find by class
        const headerBtn = document.querySelector('.btn-primary')
        if (headerBtn && headerBtn.textContent.includes('Get Started')) {
            setTimeout(() => {
                headerBtn.click()
            }, 50)
            return
        }
        
        // Last resort: Show role modal directly
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
