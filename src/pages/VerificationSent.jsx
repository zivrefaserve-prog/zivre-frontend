import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Container, Paper, Typography, Button, Box, Alert, TextField, CircularProgress } from '@mui/material'
import { Email, CheckCircle, ArrowBack, Refresh, Edit } from '@mui/icons-material'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import { resendVerification } from '../api/client'

const VerificationSent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  
  const [resendEmail, setResendEmail] = useState(email)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const [resendError, setResendError] = useState('')
  const [showChangeEmail, setShowChangeEmail] = useState(false)

  const handleResendVerification = async () => {
    if (!resendEmail) {
      setResendError('Please enter your email address')
      return
    }
    
    setResending(true)
    setResendError('')
    setResendSuccess('')
    
    try {
      await resendVerification({ email: resendEmail })
      setResendSuccess(`Verification email sent to ${resendEmail}! Please check your inbox.`)
    } catch (err) {
      setResendError(err.response?.data?.error || 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  const handleGoToLogin = () => {
    navigate('/')
    // Trigger login modal
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open_signin_modal'))
    }, 100)
  }

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Header onGetQuote={scrollToContact} />
      
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          {/* Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <Email sx={{ fontSize: 48, color: '#0284c7' }} />
          </Box>
          
          {/* Title */}
          <Typography variant="h5" fontWeight="800" sx={{ color: '#0f172a', mb: 1 }}>
            Check Your Email
          </Typography>
          
          {/* Message */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            We've sent a verification link to:
          </Typography>
          
          <Typography 
            variant="body1" 
            fontWeight="600" 
            sx={{ 
              color: '#10b981', 
              mb: 3, 
              p: 1.5, 
              bgcolor: '#f0fdf4', 
              borderRadius: 2,
              wordBreak: 'break-all'
            }}
          >
            {email || 'your email address'}
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
            <strong>📧 Next steps:</strong>
            <ol style={{ margin: '8px 0 0 20px', padding: 0 }}>
              <li>Check your inbox for the verification email</li>
              <li>Click the verification link in the email</li>
              <li>Your account will be activated</li>
              <li>Then you can login</li>
            </ol>
          </Alert>
          
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
            <strong>⚠️ Didn't receive the email?</strong>
            <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
              <li>Check your spam/junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Click "Resend Verification Email" below</li>
            </ul>
          </Alert>
          
          {/* Resend Section */}
          <Box sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
              Need a new verification link?
            </Typography>
            
            {!showChangeEmail ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  Send to: <strong>{email || 'your email'}</strong>
                </Typography>
                <Button 
                  size="small" 
                  startIcon={<Edit />}
                  onClick={() => setShowChangeEmail(true)}
                  sx={{ textTransform: 'none', color: '#10b981' }}
                >
                  Change email
                </Button>
              </Box>
            ) : (
              <TextField
                fullWidth
                size="small"
                label="Email Address"
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                sx={{ mb: 1 }}
              />
            )}
            
            {resendError && (
              <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>{resendError}</Alert>
            )}
            
            {resendSuccess && (
              <Alert severity="success" sx={{ mt: 1, borderRadius: 2 }}>{resendSuccess}</Alert>
            )}
            
            <Button
              fullWidth
              variant="outlined"
              startIcon={resending ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleResendVerification}
              disabled={resending}
              sx={{ 
                mt: 2, 
                borderColor: '#10b981', 
                color: '#10b981',
                '&:hover': { borderColor: '#059669', bgcolor: '#e6f7f0' }
              }}
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<CheckCircle />}
              onClick={handleGoToLogin}
              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              Go to Login
            </Button>
            
            <Button
              fullWidth
              variant="text"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/signup')}
              sx={{ color: '#64748b' }}
            >
              Back to Signup
            </Button>
          </Box>
        </Paper>
      </Container>
      
      <Footer />
    </>
  )
}

export default VerificationSent
