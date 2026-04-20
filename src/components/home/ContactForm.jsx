import React, { useState } from 'react'
import { createQuote } from '../../api/client'

const ContactForm = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        service_type: '',
        location: '',
        message: ''
    })
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const serviceTypes = [
        'HVAC Systems', 'Electrical', 'Plumbing', 'Fire Safety', 'Cleaning',
        'Security', 'Waste Management', 'Reception', 'Industry Services',
        'Healthcare', 'Poultry & Agri', 'Hospitality', 'Wellness'
    ]

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            await createQuote(formData)
            setSuccess('Thank you! We will contact you within 24 hours.')
            setFormData({ full_name: '', phone: '', email: '', service_type: '', location: '', message: '' })
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <section id="contact" className="contact">
            <div className="container">
                <div className="contact-grid">
                    <div className="contact-info">
                        <h3>Get Your Free Quote Today</h3>
                        <div className="contact-cards">
                            <div className="contact-card">
                                <strong>ZIVRE FACILITY SERVICES</strong>
                                <p>📍 Near S.D.A Church, New Life Road, Pokuase</p>
                                <p>📞 +233 54 346 3686</p>
                                <p>✉️ zivrefaservice@gmail.com</p>
                            </div>
                            <div className="contact-card">
                                <strong>EMERGENCY 24/7</strong>
                                <p>📞 ++233 54 346 368</p>
                                <p>🕒 Available 24/7</p>
                            </div>
                        </div>
                    </div>
                    <div className="contact-form">
                        <form onSubmit={handleSubmit}>
                            {success && <div className="success-message">{success}</div>}
                            {error && <div className="error-message">{error}</div>}
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                required
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                required
                            />
                            <select
                                value={formData.service_type}
                                onChange={(e) => setFormData({...formData, service_type: e.target.value})}
                                required
                            >
                                <option value="">Select Service Type</option>
                                {serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <input
                                type="text"
                                placeholder="Location"
                                value={formData.location}
                                onChange={(e) => setFormData({...formData, location: e.target.value})}
                                required
                            />
                            <textarea
                                placeholder="Tell us about your facility needs"
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                rows="3"
                                required
                            ></textarea>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Message →'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default ContactForm