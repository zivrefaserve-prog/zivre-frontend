import React, { useState } from 'react'
import { forgotPassword } from '../api/client'
import { Dialog, DialogTitle, DialogContent, TextField, Button, Box, Typography, Alert, CircularProgress } from '@mui/material'

const ForgotPasswordModal = ({ onClose }) => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!email) {
            setError('Please enter your email address')
            return
        }
        
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            console.log('Sending forgot password request for:', email)
            const response = await forgotPassword(email)
            console.log('Response:', response.data)
            
            setSuccess('Password reset link has been sent to your email address! Please check your inbox and spam folder.')
            setEmail('')
            
            setTimeout(() => {
                onClose()
            }, 4000)
            
        } catch (err) {
            console.error('Forgot password error:', err)
            
            if (err.response?.data?.error === 'Email not found') {
                setError('No account found with this email address. Please sign up first.')
            } else {
                setError('Something went wrong. Please try again later.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog 
            open={true} 
            onClose={onClose} 
            maxWidth="xs" 
            fullWidth
            disableEnforceFocus
            sx={{ '& .MuiPaper-root': { borderRadius: 4 } }}
        >
            <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
                <Typography variant="h6" component="div" fontWeight="800" sx={{ color: '#0f172a' }}>
                    Forgot Password?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Enter your email address and we'll send you a link to reset your password.
                </Typography>
            </DialogTitle>
            <DialogContent sx={{ pb: 4 }}>
                {success && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                        {success}
                    </Alert>
                )}
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                    </Alert>
                )}
                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        margin="normal"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        placeholder="your@email.com"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{ mt: 3, py: 1.5, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Send Reset Link'}
                    </Button>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Button 
                            onClick={onClose} 
                            sx={{ textTransform: 'none', color: '#64748b' }}
                        >
                            Back to Sign In
                        </Button>
                    </Box>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default ForgotPasswordModal