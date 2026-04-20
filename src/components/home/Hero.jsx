import React from 'react'

const Hero = ({ onGetQuote }) => {
    const handleGetStarted = () => {
        const buttons = document.querySelectorAll('button')
        for (let btn of buttons) {
            if (btn.textContent === 'Get Started') {
                btn.click()
                break
            }
        }
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