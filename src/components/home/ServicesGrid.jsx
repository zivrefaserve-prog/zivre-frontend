import React, { useState, useEffect } from 'react'
import { getServices } from "../../api/client";
import LoadingSpinner from "../../common/LoadingSpinner";

const ServicesGrid = () => {
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [showServices, setShowServices] = useState(false)  // ← ADD THIS - controls visibility

    // FIX: Service cards now open signup for non-logged-in users
    const handleServiceClick = () => {
        // Check if user is logged in
        const userData = sessionStorage.getItem('zivre_user')
        if (!userData) {
            // Find and click the Get Started button
            const buttons = document.querySelectorAll('button')
            for (let btn of buttons) {
                if (btn.textContent === 'Get Started') {
                    btn.click()
                    break
                }
            }
        }
    }

    useEffect(() => {
        getServices(false).then(res => {
            setServices(res.data)
            setLoading(false)
        }).catch(() => {
            setServices([
                { id: 1, name: "HVAC Systems", icon: "❄️", description: "Heating, ventilation, and air conditioning maintenance", is_active: false },
                { id: 2, name: "Electrical", icon: "⚡", description: "Complete electrical installations and repairs", is_active: false },
                { id: 3, name: "Plumbing", icon: "💧", description: "Pipe installations and leak repairs", is_active: false },
                { id: 4, name: "Fire Safety", icon: "🔥", description: "Fire alarm systems and safety equipment", is_active: false },
                { id: 5, name: "Cleaning", icon: "🧹", description: "Professional cleaning for homes and businesses", is_active: false },
                { id: 6, name: "Security", icon: "🔒", description: "CCTV and access control systems", is_active: false },
                { id: 7, name: "Waste Management", icon: "🗑️", description: "Eco-friendly waste disposal", is_active: false },
                { id: 8, name: "Reception", icon: "📋", description: "Front desk management services", is_active: false },
                { id: 9, name: "Industry Services", icon: "🏭", description: "Industrial facility maintenance", is_active: false },
                { id: 10, name: "Healthcare", icon: "🏥", description: "Medical facility cleaning", is_active: false },
                { id: 11, name: "Poultry & Agri", icon: "🐔", description: "Farm facility management", is_active: false },
                { id: 12, name: "Hospitality", icon: "🏨", description: "Hotel and restaurant solutions", is_active: false },
                { id: 13, name: "Wellness", icon: "🧘", description: "Spa and wellness center maintenance", is_active: false }
            ])
            setLoading(false)
        })
    }, [])

    if (loading) return <LoadingSpinner />

    return (
        <section id="services" className="services">
            <div className="container">
                <div className="section-label">Our Expertise</div>
                <h2 className="section-title">Tailored Facility Solutions</h2>
                <p className="section-subtitle">From HVAC to Security, Plumbing to Healthcare — a complete solution for every need.</p>
                
                {/* ADDED: View All Services Button */}
                <div style={{ textAlign: 'center', marginBottom: showServices ? '2rem' : '0' }}>
                    <button 
                        className="btn-primary"
                        onClick={() => setShowServices(!showServices)}
                        style={{ 
                            padding: '0.75rem 2rem', 
                            fontSize: '1rem',
                            backgroundColor: showServices ? '#64748b' : '#10b981'
                        }}
                    >
                        {showServices ? 'Hide Services ↑' : 'View All Services →'}
                    </button>
                </div>

                {/* ADDED: Services only show when button is clicked */}
                {showServices && (
                    <div className="services-grid">
                        {services.map((service) => (
                            <div 
                                key={service.id} 
                                className={`service-card ${!service.is_active ? 'inactive-service' : ''}`}
                                onClick={handleServiceClick}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="service-icon">{service.icon}</div>
                                <h3>{service.name}</h3>
                                <p>{service.description}</p>
                                {!service.is_active && (
                                    <span className="service-badge inactive">Currently Unavailable</span>
                                )}
                                {service.is_active && (
                                    <span className="service-badge active">Available Now</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
                        {/* ADD YOUR IMAGE HERE - RIGHT BEFORE WHY CHOOSE SECTION STARTS */}
            <div style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
                <img 
                    src="zivre-frontend/public/Adi.jpg"   // CHANGE THIS TO YOUR IMAGE FILE NAME
                    alt="Zivre Facility Services"
                    style={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: '16px'
                    }}
                />
            </div>
        </section>
    )
}

export default ServicesGrid
