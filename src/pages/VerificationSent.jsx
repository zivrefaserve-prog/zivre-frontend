import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Container, Paper, Typography, Button, Box, Alert, TextField, CircularProgress, Divider } from '@mui/material'
import { Markunread, CheckCircle, ArrowBack, Refresh, Edit } from '@mui/icons-material'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import { resendVerification } from '../api/client'

const VerificationSent = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const params = new URLSearchParams(location.search)
  const initialEmail = params.get('email') || ''
  
  const [resendEmail, setResendEmail] = useState(initialEmail)
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
      setResendSuccess(`✓ Verification email sent to ${resendEmail}! Please check your inbox.`)
    } catch (err) {
      setResendError(err.response?.data?.error || 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  const handleGoToLogin = () => {
    navigate('/')
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open_signin_modal'))
    }, 100)
  }

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Header hideNavLinks={true} />
      
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          
          <Box sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: '#e0f2fe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3
          }}>
            <Markunread sx={{ fontSize: 56, color: '#0284c7' }} />
          </Box>
          
          <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a', mb: 2 }}>
            Check Your Email
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
            We've sent a verification link to:
          </Typography>
          
          <Typography variant="h6" fontWeight="700" sx={{ 
            color: '#10b981', mb: 3, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, wordBreak: 'break-all'
          }}>
            {initialEmail || 'your email address'}
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
            <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1 }}>
              📧 Next steps to activate your account:
            </Typography>
            <ol style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Open your email inbox</li>
              <li>Click the verification link in the email</li>
              <li>Your account will be activated</li>
              <li>Return here and click "Go to Login"</li>
            </ol>
          </Alert>
          
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
            <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1 }}>
              ⚠️ Didn't receive the email?
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Check your spam/junk folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>Click "Resend Verification Email" below</li>
              <li>Wait a few minutes and check again</li>
            </ul>
          </Alert>
          
          <Box sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" fontWeight="600" sx={{ mb: 1 }}>
              Need a new verification link?
            </Typography>
            
            {!showChangeEmail ? (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  Send to: <strong>{initialEmail || 'your email'}</strong>
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
                py: 1,
                '&:hover': { borderColor: '#059669', bgcolor: '#e6f7f0' }
              }}
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </Button>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<CheckCircle />}
              onClick={handleGoToLogin}
              sx={{ bgcolor: '#10b981', py: 1.2, '&:hover': { bgcolor: '#059669' } }}
            >
              Go to Login
            </Button>
            
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/signup')}
              sx={{ color: '#64748b', borderColor: '#cbd5e1', py: 1.2 }}
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
