import React from 'react'

const WhyChoose = () => {
    const features = [
        { title: "24/7 Support", description: "Round-the-clock emergency response team" },
        { title: "Certified Experts", description: "Licensed & trained professionals you can trust" },
        { title: "Nationwide Coverage", description: "Serving all regions across Ghana" },
        { title: "Best Pricing", description: "Premium service at competitive rates" }
    ]

    return (
        <section className="why-choose">
            <div className="container">
                <div className="why-grid">
                    <div className="why-content">
                        <div className="section-label left">Why Choose Zivre</div>
                        <h2>We bring excellence to your facility</h2>
                        <p>Our commitment to quality and customer satisfaction makes us the leading facility management choice across Ghana.</p>
                        <div className="features-list">
                            {features.map((item, idx) => (
                                <div key={idx} className="feature-item">
                                    <span className="feature-check">✓</span>
                                    <div>
                                        <strong>{item.title}</strong>
                                        <p>{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="why-image">
                        <div className="stats-card">
                            <div className="stat">11+</div>
                            <div>Years of Excellence</div>
                            <div className="stat">★★★★★</div>
                            <div>5.0 Rating</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default WhyChoose