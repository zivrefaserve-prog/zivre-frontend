import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  Container, Paper, Typography, Button, Box, Alert, 
  CircularProgress, Divider, IconButton,
  TextField   // ← ADD THIS
} from '@mui/material'
import { CheckCircle, Error, Email } from '@mui/icons-material'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import { verifyEmail, resendVerification } from '../api/client'

const VerifyEmail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    
    if (!token) {
      setError('No verification token provided')
      setLoading(false)
      return
    }
    
    const verify = async () => {
      try {
        const res = await verifyEmail({ token })
        setSuccess(true)
      } catch (err) {
        setError(err.response?.data?.error || 'Verification failed')
      } finally {
        setLoading(false)
      }
    }
    
    verify()
  }, [location])

  const handleResend = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }
    
    setResending(true)
    setError('')
    setResendSuccess('')
    
    try {
      await resendVerification({ email })
      setResendSuccess('Verification email sent! Please check your inbox.')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <>
        <Header onGetQuote={scrollToContact} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#10b981' }} />
        </Box>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header onGetQuote={scrollToContact} />
      
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          {success ? (
            <>
              <CheckCircle sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
              <Typography variant="h5" fontWeight="800" sx={{ mb: 2, color: '#0f172a' }}>
                Email Verified!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your email has been successfully verified. You can now login to your account.
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/')}
                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
              >
                Go to Login
              </Button>
            </>
          ) : (
            <>
              <Error sx={{ fontSize: 64, color: '#ef4444', mb: 2 }} />
              <Typography variant="h5" fontWeight="800" sx={{ mb: 2, color: '#0f172a' }}>
                Verification Failed
              </Typography>
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error || 'Invalid or expired verification link'}
              </Alert>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your email below to receive a new verification link.
              </Typography>
              
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              {resendSuccess && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                  {resendSuccess}
                </Alert>
              )}
              
              <Button
                fullWidth
                variant="contained"
                onClick={handleResend}
                disabled={resending}
                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
              >
                {resending ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Resend Verification Email'}
              </Button>
              
              <Button
                fullWidth
                variant="text"
                onClick={() => navigate('/')}
                sx={{ mt: 2, color: '#64748b' }}
              >
                Back to Home
              </Button>
            </>
          )}
        </Paper>
      </Container>
      
      <Footer />
    </>
  )
}

export default VerifyEmail
