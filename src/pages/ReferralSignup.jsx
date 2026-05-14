import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPercentages } from '../api/client'
import LoadingOverlay from '../common/LoadingOverlay'
import {
  Dialog, DialogTitle, DialogContent, Box, Typography, TextField, Button,
  Alert, CircularProgress, IconButton, InputAdornment,
  Chip, LinearProgress, useMediaQuery
} from '@mui/material'
import {
  Visibility, VisibilityOff, CheckCircle, Cancel,
  Person, Phone, Email, Lock,
  Share, ContentCopy, Verified, Close as CloseIcon
} from '@mui/icons-material'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import Hero from '../components/home/Hero'
import ServicesGrid from '../components/home/ServicesGrid'
import WhyChoose from '../components/home/WhyChoose'
import About from '../components/home/About'
import ContactForm from '../components/home/ContactForm'
import TestimonialsCarousel from '../components/home/TestimonialsCarousel'

const ReferralSignup = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signup } = useAuth()
  
  const urlParams = new URLSearchParams(location.search)
  const referralCodeFromUrl = urlParams.get('ref') || ''
  
  const isMobile = useMediaQuery('(max-width:768px)')
  
  const [openModal, setOpenModal] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loadingPercentages, setLoadingPercentages] = useState(true)
  const [copied, setCopied] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    referral_code: referralCodeFromUrl
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        await getPercentages() // still load but not displayed
      } catch (err) {
        console.error('Error loading percentages:', err)
      } finally {
        setLoadingPercentages(false)
      }
    }
    loadData()
  }, [])

  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
  const validatePhone = (phone) => /^\+?[0-9]{10,15}$/.test(phone)

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    })
  }

  const isPasswordValid = () => {
    return passwordStrength.length && passwordStrength.uppercase && passwordStrength.lowercase && passwordStrength.number && passwordStrength.special
  }

  const getPasswordErrorMessage = () => {
    if (!passwordStrength.length) return "8+ characters"
    if (!passwordStrength.uppercase) return "Uppercase letter"
    if (!passwordStrength.lowercase) return "Lowercase letter"
    if (!passwordStrength.number) return "Number"
    if (!passwordStrength.special) return "Special character"
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

  const handleCopyReferralCode = () => {
    if (formData.referral_code) {
      navigator.clipboard.writeText(formData.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address')
      return
    }
    if (!formData.full_name.trim()) {
      setError('Please enter your full name')
      return
    }
    if (!validatePhone(formData.phone)) {
      setError('Please enter a valid phone number (10-15 digits)')
      return
    }
    if (!isPasswordValid()) {
      setError('Password must have: 8+ chars, uppercase, lowercase, number, special character')
      return
    }
    if (formData.password !== formData.confirm_password) {
      setError("Passwords don't match")
      return
    }

    setLoading(true)
    try {
      const userData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'customer',
        service_specialization: null,
        referral_code: formData.referral_code
      }
      const res = await signup(userData)
      
      if (res.data && res.data.requires_verification) {
        navigate(`/verification-sent?email=${encodeURIComponent(res.data.email)}`)
        return
      }
      
      setSuccess('Account created successfully! Redirecting...')
      setTimeout(() => {
        navigate('/customer/dashboard')
      }, 2000)
    } catch (err) {
      const errorMsg = err.response?.data?.error
      if (errorMsg === 'Email already exists') {
        setError('This email is already registered. Please sign in instead.')
      } else {
        setError(errorMsg || 'Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSignInClick = () => {
    setOpenModal(false)
    window.dispatchEvent(new CustomEvent('open_signin_modal'))
  }

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loadingPercentages) {
    return (
      <>
        <LoadingOverlay open={true} message="Loading..." />
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
      
      <main>
        <Hero onGetQuote={scrollToContact} />
        <ServicesGrid />
        <WhyChoose />
        <About />
        <TestimonialsCarousel />
        <ContactForm />
      </main>
      
      <Footer />

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="xs"
        fullWidth
        disableEnforceFocus
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {/* Enhanced Referral Banner (only if a referral code exists) */}
        {formData.referral_code && (
          <Box
            sx={{
              mx: 2,
              mt: 2,
              p: 2.5,
              background: 'linear-gradient(135deg, #0f3b2c 0%, #10b981 100%)',
              color: 'white',
              borderRadius: 3,
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h5" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                🎉
              </Typography>
              <Typography variant="h6" fontWeight="800" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                You Were Referred!
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 1.5, opacity: 0.9 }}>
              Sign up now and start earning commissions from your first service.
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: 'rgba(255,255,255,0.2)',
                px: 2,
                py: 1,
                borderRadius: 3,
                backdropFilter: 'blur(4px)'
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                {formData.referral_code}
              </Typography>
              <IconButton
                size="small"
                onClick={handleCopyReferralCode}
                sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}
              >
                <ContentCopy sx={{ fontSize: 18 }} />
              </IconButton>
              {copied && (
                <Typography variant="caption" sx={{ color: '#d1fae5' }}>
                  ✓ Copied
                </Typography>
              )}
            </Box>
          </Box>
        )}

        <DialogTitle sx={{ textAlign: 'center', pt: formData.referral_code ? 2 : 4 }}>
          <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a' }}>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Sign up as a Customer
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pb: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              size="small"
              label="Full Name"
              margin="dense"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              InputProps={{ startAdornment: <Person sx={{ fontSize: 18, mr: 0.5, color: '#94a3b8' }} /> }}
              sx={{ mb: 1.5 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Email Address"
              type="email"
              margin="dense"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={!!(formData.email && !validateEmail(formData.email))}
              helperText={formData.email && !validateEmail(formData.email) ? 'Enter a valid email' : ''}
              required
              InputProps={{ startAdornment: <Email sx={{ fontSize: 18, mr: 0.5, color: '#94a3b8' }} /> }}
              sx={{ mb: 1.5 }}
            />
            <TextField
              fullWidth
              size="small"
              label="Phone Number"
              margin="dense"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              error={!!(formData.phone && !validatePhone(formData.phone))}
              helperText={formData.phone && !validatePhone(formData.phone) ? '10-15 digits' : ''}
              required
              InputProps={{ startAdornment: <Phone sx={{ fontSize: 18, mr: 0.5, color: '#94a3b8' }} /> }}
              sx={{ mb: 1.5 }}
            />

            <TextField
              fullWidth
              size="small"
              label="Referral Code (Optional)"
              value={formData.referral_code}
              onChange={(e) => {
                let input = e.target.value;
                if (input.includes('ref=')) {
                  const match = input.match(/ref=([A-Za-z0-9]+)/);
                  if (match && match[1]) input = match[1];
                }
                setFormData({ ...formData, referral_code: input });
              }}
              helperText={formData.referral_code === referralCodeFromUrl && referralCodeFromUrl ? "✓ Applied from link" : "Enter a referral code if you have one"}
              InputProps={{
                startAdornment: <Share sx={{ fontSize: 18, mr: 0.5, color: '#94a3b8' }} />
              }}
              sx={{ mb: 1.5 }}
            />

            <TextField
              fullWidth
              size="small"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="dense"
              value={formData.password}
              onChange={(e) => {
                setFormData({ ...formData, password: e.target.value })
                checkPasswordStrength(e.target.value)
              }}
              required
              InputProps={{
                startAdornment: <Lock sx={{ fontSize: 18, mr: 0.5, color: '#94a3b8' }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 1.5 }}
            />

            {formData.password && (
              <Box sx={{ mb: 2, p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Password Strength:</Typography>
                  <Chip
                    label={getPasswordStrengthText()}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.6rem',
                      bgcolor: `${getPasswordStrengthColor()}15`,
                      color: getPasswordStrengthColor()
                    }}
                  />
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Object.values(passwordStrength).filter(Boolean).length * 20}
                  sx={{ height: 3, borderRadius: 2, mb: 1 }}
                />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: passwordStrength.length ? '#10b981' : '#64748b', fontSize: '0.65rem' }}>
                    {passwordStrength.length ? <CheckCircle sx={{ fontSize: 11 }} /> : <Cancel sx={{ fontSize: 11 }} />}
                    8+ chars
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: passwordStrength.uppercase ? '#10b981' : '#64748b', fontSize: '0.65rem' }}>
                    {passwordStrength.uppercase ? <CheckCircle sx={{ fontSize: 11 }} /> : <Cancel sx={{ fontSize: 11 }} />}
                    A-Z
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: passwordStrength.lowercase ? '#10b981' : '#64748b', fontSize: '0.65rem' }}>
                    {passwordStrength.lowercase ? <CheckCircle sx={{ fontSize: 11 }} /> : <Cancel sx={{ fontSize: 11 }} />}
                    a-z
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: passwordStrength.number ? '#10b981' : '#64748b', fontSize: '0.65rem' }}>
                    {passwordStrength.number ? <CheckCircle sx={{ fontSize: 11 }} /> : <Cancel sx={{ fontSize: 11 }} />}
                    0-9
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: passwordStrength.special ? '#10b981' : '#64748b', fontSize: '0.65rem' }}>
                    {passwordStrength.special ? <CheckCircle sx={{ fontSize: 11 }} /> : <Cancel sx={{ fontSize: 11 }} />}
                    !@#$%
                  </Typography>
                </Box>
              </Box>
            )}

            <TextField
              fullWidth
              size="small"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              margin="dense"
              value={formData.confirm_password}
              onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              error={!!(formData.confirm_password && formData.password !== formData.confirm_password)}
              helperText={formData.confirm_password && formData.password !== formData.confirm_password ? 'Passwords do not match' : ''}
              required
              InputProps={{
                startAdornment: <Lock sx={{ fontSize: 18, mr: 0.5, color: '#94a3b8' }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ mb: 1.5 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || (formData.password && !isPasswordValid())}
              sx={{ py: 1.5, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign Up'}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Button
                onClick={handleSignInClick}
                sx={{ textTransform: 'none', color: '#10b981', fontWeight: 600, p: 0, minWidth: 'auto' }}
              >
                Sign In
              </Button>
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ReferralSignup
