import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { resetPassword } from '../api/client'
import { Container, Paper, Typography, TextField, Button, Alert, CircularProgress, Box, IconButton, InputAdornment } from '@mui/material'
import { Visibility, VisibilityOff, CheckCircle, Cancel } from '@mui/icons-material'
import Header from '../layout/Header'
import Footer from '../layout/Footer'

const ResetPassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const tokenParam = params.get('token')
    console.log('Token from URL:', tokenParam)
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      setError('Invalid or missing reset token. Please request a new password reset link.')
    }
  }, [location])

  const checkPasswordStrength = (pwd) => {
    setPasswordStrength({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    })
  }

  const isPasswordValid = () => {
    return passwordStrength.length && 
           passwordStrength.uppercase && 
           passwordStrength.lowercase && 
           passwordStrength.number && 
           passwordStrength.special
  }

  const getPasswordErrorMessage = () => {
    if (!passwordStrength.length) return "Password must be at least 8 characters"
    if (!passwordStrength.uppercase) return "Password must contain at least one uppercase letter (A-Z)"
    if (!passwordStrength.lowercase) return "Password must contain at least one lowercase letter (a-z)"
    if (!passwordStrength.number) return "Password must contain at least one number (0-9)"
    if (!passwordStrength.special) return "Password must contain at least one special character (!@#$%^&*)"
    return ""
  }

  const getPasswordStrengthColor = () => {
    const passed = Object.values(passwordStrength).filter(Boolean).length
    if (passed <= 2) return '#ef4444'
    if (passed <= 4) return '#f59e0b'
    return '#10b981'
  }

  const getPasswordStrengthText = () => {
    const passed = Object.values(passwordStrength).filter(Boolean).length
    if (passed <= 2) return 'Weak'
    if (passed <= 4) return 'Medium'
    return 'Strong'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!token) {
      setError('Invalid reset token. Please request a new password reset link.')
      return
    }
    
    if (!isPasswordValid()) {
      setError(getPasswordErrorMessage())
      return
    }
    
    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }
    
    setLoading(true)
    try {
      console.log('Resetting password with token:', token)
      const response = await resetPassword(token, password)
      console.log('Reset response:', response.data)
      setSuccess('Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/')
      }, 3000)
    } catch (err) {
      console.error('Reset error:', err.response?.data)
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Header onGetQuote={scrollToContact} />
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" fontWeight="800" sx={{ textAlign: 'center', color: '#0f172a', mb: 1 }}>
            Reset Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
            Enter your new password below
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                checkPasswordStrength(e.target.value)
              }}
              required
              margin="normal"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            
            {password && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Password Strength:</Typography>
                  <Typography variant="caption" sx={{ color: getPasswordStrengthColor(), fontWeight: 500 }}>
                    {getPasswordStrengthText()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                  {Object.entries(passwordStrength).map(([key, valid]) => (
                    <Box 
                      key={key} 
                      sx={{ 
                        flex: 1, 
                        height: 4, 
                        bgcolor: valid ? getPasswordStrengthColor() : '#e2e8f0',
                        borderRadius: 2
                      }} 
                    />
                  ))}
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: passwordStrength.length ? '#10b981' : '#64748b' }}>
                    {passwordStrength.length ? <CheckCircle sx={{ fontSize: 12 }} /> : <Cancel sx={{ fontSize: 12 }} />}
                    8+ characters
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: passwordStrength.uppercase ? '#10b981' : '#64748b' }}>
                    {passwordStrength.uppercase ? <CheckCircle sx={{ fontSize: 12 }} /> : <Cancel sx={{ fontSize: 12 }} />}
                    Uppercase
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: passwordStrength.lowercase ? '#10b981' : '#64748b' }}>
                    {passwordStrength.lowercase ? <CheckCircle sx={{ fontSize: 12 }} /> : <Cancel sx={{ fontSize: 12 }} />}
                    Lowercase
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: passwordStrength.number ? '#10b981' : '#64748b' }}>
                    {passwordStrength.number ? <CheckCircle sx={{ fontSize: 12 }} /> : <Cancel sx={{ fontSize: 12 }} />}
                    Number
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: passwordStrength.special ? '#10b981' : '#64748b' }}>
                    {passwordStrength.special ? <CheckCircle sx={{ fontSize: 12 }} /> : <Cancel sx={{ fontSize: 12 }} />}
                    Special char
                  </Typography>
                </Box>
              </Box>
            )}
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              margin="normal"
              error={!!(confirmPassword && password !== confirmPassword)}
              helperText={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ''}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || (password !== '' && !isPasswordValid())}
              sx={{ mt: 3, py: 1.5, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Reset Password'}
            </Button>
            
            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/')}
              sx={{ mt: 2, color: '#64748b' }}
            >
              Back to Home
            </Button>
          </form>
        </Paper>
      </Container>
      <Footer />
    </>
  )
}

export default ResetPassword