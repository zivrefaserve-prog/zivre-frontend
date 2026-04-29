import React, { useState, useEffect } from 'react'
import { getServices } from "../../api/client";
import LoadingSpinner from "../../common/LoadingSpinner";

const ServicesGrid = () => {
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [showServices, setShowServices] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // ===== ADD YOUR IMAGES HERE =====
    const carouselImages = [
        { src: "/Adi.jpg", alt: "Zivre Facility Service 1" },
        { src: "/Adi2.jpg", alt: "Zivre Facility Service 2" },
        // Add more images here when you have them
    ]

    // Auto-slide every 5 seconds
    useEffect(() => {
        if (carouselImages.length <= 1) return
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [carouselImages.length])

    const goToPrevious = () => {
        setCurrentImageIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length)
    }

    const goToNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
    }

    const handleServiceClick = () => {
        const userData = sessionStorage.getItem('zivre_user')
        if (!userData) {
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

            {/* IMAGE SLIDER - NETFLIX STYLE (NO DOTS, JUST ARROWS) */}
            {carouselImages.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
                    <div style={{ position: 'relative', maxWidth: '450px', margin: '0 auto', display: 'inline-block' }}>
                        <img 
                            src={carouselImages[currentImageIndex].src}
                            alt={carouselImages[currentImageIndex].alt}
                            style={{ 
                                maxWidth: '400px', 
                                width: '100%', 
                                height: 'auto', 
                                borderRadius: '16px', 
                                display: 'block', 
                                margin: '0 auto', 
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                transition: 'all 0.5s ease-in-out'
                            }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        
                        {/* Left Arrow */}
                        {carouselImages.length > 1 && (
                            <button 
                                onClick={goToPrevious}
                                style={{
                                    position: 'absolute',
                                    left: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    zIndex: 1,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
                            >
                                ❮
                            </button>
                        )}
                        
                        {/* Right Arrow */}
                        {carouselImages.length > 1 && (
                            <button 
                                onClick={goToNext}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    cursor: 'pointer',
                                    fontSize: '20px',
                                    zIndex: 1,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.8)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.5)'}
                            >
                                ❯
                            </button>
                        )}
                    </div>
                </div>
            )}
        </section>
    )
}

export default ServicesGrid
