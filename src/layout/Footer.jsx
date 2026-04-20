import React from 'react'

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h4>Zivre Facility Services</h4>
                        <p>Total facility management solutions across Ghana.</p>
                    </div>
                    <div className="footer-col">
                        <h4>Quick Links</h4>
                        <a onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}>Services</a>
                        <a onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>About</a>
                        <a onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</a>
                    </div>
                    <div className="footer-col">
                        <h4>Our Services</h4>
                        <a>HVAC Systems</a>
                        <a>Electrical</a>
                        <a>Plumbing</a>
                        <a>Security</a>
                    </div>
                    <div className="footer-col">
                        <h4>Contact Info</h4>
                        <p>Near S.D.A Church, New Life Road, Pokuase</p>
                        <p>+233 54 346 3686</p>
                        <p>zivrefaserve@gmail.com</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2025 Zivre Facility Services. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer