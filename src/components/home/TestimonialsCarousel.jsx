import React from 'react'

const TestimonialsCarousel = () => {
    const testimonials = [
        { name: "Kofi Amoah", role: "Facility Manager", text: "Zivre has been our partner for over two years. Their HVAC and electrical teams are exceptional.", stars: 5 },
        { name: "Sarah Mensah", role: "Hospitality Director", text: "From HVAC to security, they handle everything. The best facility management company in Ghana.", stars: 5 },
        { name: "David Osei", role: "Business Owner", text: "Excellent service. Their plumbing and electrical teams are top-notch. Highly recommended.", stars: 5 },
        { name: "Abena Boateng", role: "Healthcare Admin", text: "Professional, reliable, and affordable. They transformed our facility maintenance completely.", stars: 5 },
        { name: "Emmanuel Quartey", role: "Property Developer", text: "Best facility services in Ghana. Every corner spotless. Will definitely use them again.", stars: 5 },
        { name: "Michael Addo", role: "School Administrator", text: "Their security and cleaning services are outstanding. Very professional team.", stars: 5 },
        { name: "Grace Asare", role: "Restaurant Owner", text: "Fast response, great work, fair prices. Highly recommend Zivre for hospitality needs.", stars: 5 }
    ]

    // Duplicate for infinite scroll effect
    const allTestimonials = [...testimonials, ...testimonials, ...testimonials]

    return (
        <section className="testimonials">
            <div className="container">
                <div className="section-label">Client Reviews</div>
                <h2 className="section-title">What Our Clients Say</h2>
                <div className="carousel-container">
                    <div className="carousel-track">
                        {allTestimonials.map((testimonial, idx) => (
                            <div key={idx} className="testimonial-card">
                                <div className="stars">{'★'.repeat(testimonial.stars)}</div>
                                <p>"{testimonial.text}"</p>
                                <h4>{testimonial.name}</h4>
                                <small>{testimonial.role}</small>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default TestimonialsCarousel