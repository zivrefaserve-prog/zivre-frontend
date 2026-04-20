import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { updateProfile, changePassword, deleteUser } from '../api/client'
import Toast from '../common/Toast'
import ConfirmModal from '../common/ConfirmModal'
import Header from '../layout/Header'
import Footer from '../layout/Footer'

const ProfileSettings = () => {
    const { user, updateUser, logout } = useAuth()
    const [loading, setLoading] = useState(false)
    const [toast, setToast] = useState(null)
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    
    const [profileData, setProfileData] = useState({
        full_name: user?.full_name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    })
    
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    })

    const handleProfileUpdate = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await updateProfile(user.id, profileData)
            updateUser({ ...user, ...profileData })
            setToast({ message: 'Profile updated successfully!', type: 'success' })
            setTimeout(() => setToast(null), 3000)
        } catch (err) {
            setToast({ message: err.response?.data?.error || 'Update failed', type: 'error' })
            setTimeout(() => setToast(null), 3000)
        } finally {
            setLoading(false)
        }
    }

    const handlePasswordChange = async (e) => {
        e.preventDefault()
        if (passwordData.new_password !== passwordData.confirm_password) {
            setToast({ message: 'New passwords do not match', type: 'error' })
            setTimeout(() => setToast(null), 3000)
            return
        }
        if (passwordData.new_password.length < 6) {
            setToast({ message: 'Password must be at least 6 characters', type: 'error' })
            setTimeout(() => setToast(null), 3000)
            return
        }
        setLoading(true)
        try {
            await changePassword(user.id, {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password
            })
            setToast({ message: 'Password changed successfully!', type: 'success' })
            setTimeout(() => setToast(null), 3000)
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' })
        } catch (err) {
            setToast({ message: err.response?.data?.error || 'Password change failed', type: 'error' })
            setTimeout(() => setToast(null), 3000)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        setLoading(true)
        try {
            await deleteUser(user.id)
            setToast({ message: 'Account deleted successfully', type: 'success' })
            setTimeout(() => {
                logout()
            }, 2000)
        } catch (err) {
            setToast({ message: err.response?.data?.error || 'Delete failed', type: 'error' })
            setTimeout(() => setToast(null), 3000)
        } finally {
            setLoading(false)
            setShowConfirmModal(false)
        }
    }

    const scrollToContact = () => {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
    }

    return (
        <>
            <Header onGetQuote={scrollToContact} hideNavLinks={true} />
            
            <div className="profile-settings-container">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                
                <div className="profile-header">
                    <h1>Profile Settings</h1>
                    <button className="btn-secondary" onClick={() => window.location.href = '/'}>Back to Home</button>
                </div>

                <div className="profile-grid">
                    {/* Personal Information Card */}
                    <div className="profile-card">
                        <h2>Personal Information</h2>
                        <form onSubmit={handleProfileUpdate}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input 
                                    type="text" 
                                    value={profileData.full_name} 
                                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input 
                                    type="email" 
                                    value={profileData.email} 
                                    onChange={(e) => setProfileData({...profileData, email: e.target.value})} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input 
                                    type="tel" 
                                    value={profileData.phone} 
                                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})} 
                                    required 
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? <span className="spinner-small"></span> : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* Change Password Card */}
                    <div className="profile-card">
                        <h2>Change Password</h2>
                        <form onSubmit={handlePasswordChange}>
                            <div className="form-group password-group">
                                <label>Current Password</label>
                                <input 
                                    type={showCurrentPassword ? 'text' : 'password'} 
                                    value={passwordData.current_password} 
                                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})} 
                                    required 
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            <div className="form-group password-group">
                                <label>New Password</label>
                                <input 
                                    type={showNewPassword ? 'text' : 'password'} 
                                    value={passwordData.new_password} 
                                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})} 
                                    required 
                                />
                                <button type="button" className="password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={passwordData.confirm_password} 
                                    onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})} 
                                    required 
                                />
                            </div>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? <span className="spinner-small"></span> : 'Change Password'}
                            </button>
                        </form>
                    </div>

                    {/* Referral Information Card (Only for customers) */}
                    {user?.role === 'customer' && (
                        <div className="profile-card">
                            <h2>Referral Information</h2>
                            <div className="referral-code-display">
                                <label>Your Referral Code</label>
                                <div className="code-box">
                                    <code>{user.referral_id}</code>
                                    <button onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/ref/${user.referral_id}`)
                                        setToast({ message: 'Referral link copied!', type: 'success' })
                                        setTimeout(() => setToast(null), 2000)
                                    }}>Copy</button>
                                </div>
                            </div>
                            <div className="referral-stats-info">
                                <p>Share your referral link with friends</p>
                                <p>When they sign up and request services, you earn commissions!</p>
                            </div>
                        </div>
                    )}

                    {/* Danger Zone Card */}
                    <div className="profile-card danger-zone">
                        <h2>Danger Zone</h2>
                        <p>Once you delete your account, there is no going back. All your data will be permanently removed.</p>
                        <button className="btn-danger" onClick={() => setShowConfirmModal(true)}>
                            Delete Account
                        </button>
                    </div>
                </div>

                {/* Delete Account Confirmation Modal */}
                <ConfirmModal
                    open={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={handleDeleteAccount}
                    title="Delete Account"
                    message="Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed."
                    confirmText="Delete Account"
                    confirmColor="#ef4444"
                    loading={loading}
                />
            </div>
            
            <Footer />
        </>
    )
}

export default ProfileSettings