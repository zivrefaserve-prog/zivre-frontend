import React from 'react'

const About = () => {
    return (
        <section id="about" className="about">
            <div className="container">
                <div className="about-grid">
                    <div className="about-image">
                        <div className="about-badge">Since 2014</div>
                    </div>
                    <div className="about-content">
                        <div className="section-label left">About Us</div>
                        <h2>Redefining Facility Management Across Ghana</h2>
                        <p>Zivre Facility Services started with a simple mission: to provide the highest standard of facility maintenance for families and businesses. We believe a well-maintained space is the foundation of a healthy and productive life.</p>
                        <p>Our dedicated team is trained in the latest techniques and uses modern equipment to ensure your environment is not just functional, but truly exceptional.</p>
                        <div className="about-buttons">
                            <button className="btn-primary" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Book a Service</button>
                            <button className="btn-secondary">Learn More</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default About