import React, { useState, useEffect } from 'react'
import { getServices } from "../../api/client";
import LoadingSpinner from "../../common/LoadingSpinner";

const ServicesGrid = () => {
    const [services, setServices] = useState([])
    const [loading, setLoading] = useState(true)
    const [showServices, setShowServices] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    // ===== ADD YOUR IMAGES HERE - ADD AS MANY AS YOU WANT =====
    const carouselImages = [
        { src: "/Adi.jpg", alt: "Zivre Facility Service 1" },
        { src: "/image2.jpg", alt: "Zivre Facility Service 2" },
        // { src: "/image3.jpg", alt: "Zivre Facility Service 3" },
        // { src: "/image4.jpg", alt: "Zivre Facility Service 4" },
        // Just keep adding more here...
    ]

    const imageCount = carouselImages.length

    // Auto-slide every 4 seconds - only if more than 1 image
    useEffect(() => {
        if (imageCount <= 1) return
        
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % imageCount)
        }, 4000)
        
        return () => clearInterval(interval)
    }, [imageCount])

    const goToPrevious = () => {
        setCurrentImageIndex((prev) => (prev - 1 + imageCount) % imageCount)
    }

    const goToNext = () => {
        setCurrentImageIndex((prev) => (prev + 1) % imageCount)
    }

    const goToSlide = (index) => {
        setCurrentImageIndex(index)
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

            {/* IMAGE CAROUSEL - WORKS FOR 1, 2, 3, OR ANY NUMBER OF IMAGES */}
            {imageCount > 0 && (
                <div style={{ textAlign: 'center', marginTop: '2rem', marginBottom: '2rem' }}>
                    <div style={{ 
                        position: 'relative',
                        maxWidth: '450px',
                        margin: '0 auto',
                        display: 'inline-block'
                    }}>
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
                                transition: 'opacity 0.3s ease'
                            }}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />

                        {/* Only show arrows if more than 1 image */}
                        {imageCount > 1 && (
                            <>
                                <button
                                    onClick={goToPrevious}
                                    style={{
                                        position: 'absolute',
                                        left: '-30px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        zIndex: 1
                                    }}
                                >
                                    ❮
                                </button>
                                <button
                                    onClick={goToNext}
                                    style={{
                                        position: 'absolute',
                                        right: '-30px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        zIndex: 1
                                    }}
                                >
                                    ❯
                                </button>
                            </>
                        )}
                    </div>

                    {/* Only show dots if more than 1 image */}
                    {imageCount > 1 && (
                        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                            {carouselImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: currentImageIndex === index ? '#10b981' : '#cbd5e1',
                                        cursor: 'pointer',
                                        padding: 0
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </section>
    )
}

export default ServicesGrid
