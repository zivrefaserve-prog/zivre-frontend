import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPercentages } from '../api/client'
import LoadingOverlay from '../common/LoadingOverlay'
import {
  Container, Paper, Box, Typography, TextField, Button,
  Alert, CircularProgress, IconButton, InputAdornment,
  Chip, Grid, Avatar, Divider, LinearProgress,
  useMediaQuery, Card, CardContent
} from '@mui/material'
import {
  Visibility, VisibilityOff, CheckCircle, Cancel,
  Person, ArrowBack, Phone, Email, Lock,
  AccountBalanceWallet, TrendingUp, Login, HowToReg,
  WhatsApp, ContentCopy, Star, Verified, Share, EmojiEvents
} from '@mui/icons-material'
import Header from '../layout/Header'
import Footer from '../layout/Footer'

const ReferralSignup = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signup } = useAuth()
  
  // Get referral code from URL
  const urlParams = new URLSearchParams(location.search)
  const referralCodeFromUrl = urlParams.get('ref') || ''
  
  // Mobile detection
  const isMobile = useMediaQuery('(max-width:768px)')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [percentages, setPercentages] = useState({
    provider_percent: 60,
    admin_percent: 20,
    site_fee_percent: 10,
    referral_pool_percent: 10
  })
  const [loadingPercentages, setLoadingPercentages] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
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

  // Load percentages
  useEffect(() => {
    const loadData = async () => {
      try {
        const percentagesRes = await getPercentages()
        setPercentages(percentagesRes.data)
      } catch (err) {
        console.error('Error loading percentages:', err)
      } finally {
        setLoadingPercentages(false)
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const validateEmail = (email) => {
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return pattern.test(email)
  }

  const validatePhone = (phone) => {
    const pattern = /^\+?[0-9]{10,15}$/
    return pattern.test(phone)
  }

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
      setError(getPasswordErrorMessage())
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
      
      // Check if email verification is required
      if (res.data && res.data.requires_verification) {
        navigate(`/verification-sent?email=${encodeURIComponent(res.data.email)}`)
        return
      }
      
      setSuccess('Account created successfully! Redirecting to dashboard...')
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

  const handleCopyReferralCode = () => {
    if (referralCodeFromUrl) {
      navigator.clipboard.writeText(referralCodeFromUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSignInClick = () => {
    window.dispatchEvent(new CustomEvent('open_signin_modal'))
  }

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Calculate example earnings
  const referralPoolPercent = percentages.referral_pool_percent || 10
  const exampleBookingAmount = 500
  const referralPoolAmount = (exampleBookingAmount * referralPoolPercent) / 100
  const level1Earning = referralPoolAmount * 0.20
  const level2Earning = referralPoolAmount * 0.10
  const level3Earning = referralPoolAmount * 0.05
  const selfBonus = referralPoolAmount * 0.05

  if (loadingPercentages) {
    return (
      <>
        <LoadingOverlay open={isLoading} message="Loading referral page..." />
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
      
      <Box sx={{ 
        bgcolor: '#f8fafc', 
        minHeight: 'calc(100vh - 64px)', 
        py: { xs: 3, sm: 4, md: 6 }
      }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          
          {/* Hero Banner */}
          <Paper sx={{ 
            mb: { xs: 3, sm: 4, md: 5 }, 
            p: { xs: 3, sm: 4, md: 5 }, 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            color: 'white', 
            borderRadius: { xs: 3, sm: 4, md: 5 },
            textAlign: 'center'
          }}>
            <Avatar sx={{ 
              bgcolor: 'white', 
              color: '#10b981', 
              width: { xs: 60, sm: 70, md: 80 }, 
              height: { xs: 60, sm: 70, md: 80 }, 
              mx: 'auto', 
              mb: { xs: 2, sm: 3 },
              boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
            }}>
              <EmojiEvents sx={{ fontSize: { xs: 36, sm: 42, md: 48 } }} />
            </Avatar>
            
            <Typography variant="h4" fontWeight="800" sx={{ fontSize: { xs: '1.6rem', sm: '2rem', md: '2.2rem' } }}>
              {referralCodeFromUrl ? '🎉 You Were Referred!' : 'Join Zivre Today!'}
            </Typography>
            
            <Typography variant="body1" sx={{ opacity: 0.95, maxWidth: 600, mx: 'auto', mt: 2, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {referralCodeFromUrl 
                ? 'Your referral code is already applied. Sign up now and start earning commissions when you refer friends!'
                : 'Get premium facility services and earn money by referring friends to Zivre.'}
            </Typography>
            
            {referralCodeFromUrl && (
              <Box sx={{ 
                mt: 3, 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 1, 
                bgcolor: 'rgba(255,255,255,0.2)', 
                px: 2, 
                py: 1, 
                borderRadius: 3 
              }}>
                <Verified sx={{ fontSize: 20 }} />
                <Typography variant="body2" fontWeight="600">
                  Referral Code: {referralCodeFromUrl}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleCopyReferralCode}
                  sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.2)' }}
                >
                  <ContentCopy sx={{ fontSize: 18 }} />
                </IconButton>
                {copied && (
                  <Typography variant="caption" sx={{ ml: 1 }}>✓ Copied!</Typography>
                )}
              </Box>
            )}
          </Paper>

          <Grid container spacing={{ xs: 3, sm: 4, md: 5 }}>
            
            {/* LEFT COLUMN - Signup Form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ 
                borderRadius: { xs: 3, sm: 4, md: 5 }, 
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
              }}>
                {/* Header */}
                <Box sx={{ 
                  p: { xs: 2.5, sm: 3, md: 4 }, 
                  bgcolor: '#10b981', 
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <Person sx={{ fontSize: { xs: 40, sm: 48 }, mb: 1 }} />
                  <Typography variant="h5" fontWeight="700" sx={{ fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' } }}>
                    Customer Account
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                    Sign up to request services and earn referral commissions
                  </Typography>
                </Box>
                
                <Box sx={{ p: { xs: 2.5, sm: 3, md: 4 } }}>
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
                      label="Full Name"
                      size={isMobile ? "small" : "medium"}
                      margin={isMobile ? "dense" : "normal"}
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      placeholder="John Doe"
                      InputProps={{
                        startAdornment: <Person sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      size={isMobile ? "small" : "medium"}
                      margin={isMobile ? "dense" : "normal"}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      placeholder="john@example.com"
                      InputProps={{
                        startAdornment: <Email sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Phone Number"
                      size={isMobile ? "small" : "medium"}
                      margin={isMobile ? "dense" : "normal"}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="024XXXXXXX"
                      InputProps={{
                        startAdornment: <Phone sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
                      }}
                    />
                    
                    {/* Referral Code Field - Show always for customers */}
                    <TextField
                      fullWidth
                      label="Referral Code"
                      size={isMobile ? "small" : "medium"}
                      margin={isMobile ? "dense" : "normal"}
                      value={formData.referral_code}
                      onChange={(e) => {
                        let input = e.target.value;
                        if (input.includes('ref=')) {
                          const match = input.match(/ref=([A-Za-z0-9]+)/);
                          if (match && match[1]) {
                            input = match[1];
                          }
                        }
                        setFormData({ ...formData, referral_code: input });
                      }}
                      helperText={referralCodeFromUrl ? "✓ Referral code applied from your link!" : "Enter a referral code if you have one (optional)"}
                      InputProps={{
                        readOnly: !!referralCodeFromUrl,
                        startAdornment: <Share sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />
                      }}
                      sx={{ 
                        '& .MuiInputBase-root': referralCodeFromUrl ? { bgcolor: '#f0fdf4' } : {}
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      size={isMobile ? "small" : "medium"}
                      margin={isMobile ? "dense" : "normal"}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value })
                        checkPasswordStrength(e.target.value)
                      }}
                      required
                      InputProps={{
                        startAdornment: <Lock sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />
                    
                    {formData.password && (
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Password Strength:</Typography>
                          <Chip 
                            label={getPasswordStrengthText()} 
                            size="small" 
                            sx={{ 
                              bgcolor: `${getPasswordStrengthColor()}15`, 
                              color: getPasswordStrengthColor(),
                              fontWeight: 600,
                              height: { xs: 20, sm: 24 }
                            }} 
                          />
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={Object.values(passwordStrength).filter(Boolean).length * 20} 
                          sx={{ 
                            height: { xs: 4, sm: 6 }, 
                            borderRadius: 3, 
                            bgcolor: '#e2e8f0', 
                            '& .MuiLinearProgress-bar': { bgcolor: getPasswordStrengthColor() } 
                          }} 
                        />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 }, mt: 1.5 }}>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: passwordStrength.length ? '#10b981' : '#64748b', fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                            {passwordStrength.length ? <CheckCircle sx={{ fontSize: { xs: 10, sm: 12 } }} /> : <Cancel sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                            8+ characters
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: passwordStrength.uppercase ? '#10b981' : '#64748b' }}>
                            {passwordStrength.uppercase ? <CheckCircle sx={{ fontSize: { xs: 10, sm: 12 } }} /> : <Cancel sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                            Uppercase
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: passwordStrength.lowercase ? '#10b981' : '#64748b' }}>
                            {passwordStrength.lowercase ? <CheckCircle sx={{ fontSize: { xs: 10, sm: 12 } }} /> : <Cancel sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                            Lowercase
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: passwordStrength.number ? '#10b981' : '#64748b' }}>
                            {passwordStrength.number ? <CheckCircle sx={{ fontSize: { xs: 10, sm: 12 } }} /> : <Cancel sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                            Number
                          </Typography>
                          <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: passwordStrength.special ? '#10b981' : '#64748b' }}>
                            {passwordStrength.special ? <CheckCircle sx={{ fontSize: { xs: 10, sm: 12 } }} /> : <Cancel sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                            Special char
                          </Typography>
                        </Box>
                      </Box>
                    )}

                    <TextField
                      fullWidth
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      size={isMobile ? "small" : "medium"}
                      margin={isMobile ? "dense" : "normal"}
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      error={!!(formData.confirm_password && formData.password !== formData.confirm_password)}
                      helperText={formData.confirm_password && formData.password !== formData.confirm_password ? 'Passwords do not match' : ''}
                      required
                      InputProps={{
                        startAdornment: <Lock sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} />,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                              {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size={isMobile ? "large" : "large"}
                      disabled={loading || (formData.password && !isPasswordValid())}
                      sx={{ 
                        mt: { xs: 3, sm: 4 }, 
                        py: { xs: 1.5, sm: 1.8 }, 
                        bgcolor: '#10b981',
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#059669' }
                      }}
                    >
                      {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Customer Account'}
                    </Button>
                  </form>

                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Already have an account?{' '}
                      <Button 
                        onClick={handleSignInClick}
                        startIcon={<Login />}
                        sx={{ textTransform: 'none', color: '#10b981', fontWeight: 600 }}
                      >
                        Sign In
                      </Button>
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* RIGHT COLUMN - Commission Info (Sticky) */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ 
                p: { xs: 2.5, sm: 3, md: 4 }, 
                borderRadius: { xs: 3, sm: 4, md: 5 }, 
                position: { xs: 'relative', md: 'sticky' }, 
                top: 20,
                border: '1px solid #e2e8f0',
                bgcolor: 'white'
              }}>
                <Typography variant="h6" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1.1rem', sm: '1.2rem' } }}>
                  <AccountBalanceWallet sx={{ color: '#10b981', fontSize: { xs: 24, sm: 28 } }} />
                  How You Earn
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                {/* Referral Pool Info */}
                <Box sx={{ mb: 3, p: 2, bgcolor: '#e0f2fe', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#0284c7', mb: 1, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                    📊 Referral Pool: {referralPoolPercent}% of each booking
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                    When someone you refer completes a service, {referralPoolPercent}% of the booking amount goes to the referral pool for distribution.
                  </Typography>
                </Box>
                
                {/* Commission Table */}
                <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 2, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                  Commission Distribution (on GHS {exampleBookingAmount}):
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>Referral Pool Amount:</Typography>
                    <Typography variant="body2" fontWeight="700" sx={{ color: '#0284c7', fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                      GHS {referralPoolAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: '1px solid #e2e8f0', bgcolor: '#f0fdf4' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>🎁 Self-bonus (Your first booking):</Typography>
                    <Typography variant="body2" fontWeight="700" sx={{ color: '#10b981', fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                      + GHS {selfBonus.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>Level 1 (Direct referral - 20%):</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                      GHS {level1Earning.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>Level 2 (Indirect - 10%):</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                      GHS {level2Earning.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.2 }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>Level 3+ (5% each):</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                      GHS {level3Earning.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Example Earnings */}
                <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#10b981', mb: 1.5, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                    💰 Example: You refer 5 friends
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                    Each friend books GHS {exampleBookingAmount}:
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ color: '#10b981', fontWeight: 600, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                    • 5 direct referrals × GHS {level1Earning.toFixed(2)} = GHS {(level1Earning * 5).toFixed(2)}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ color: '#10b981', fontWeight: 600, mb: 1, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                    • Their referrals (indirect) = GHS {(level2Earning * 5).toFixed(2)}+
                  </Typography>
                  <Typography variant="body2" fontWeight="800" sx={{ color: '#10b981', fontSize: { xs: '0.85rem', sm: '0.9rem' }, mt: 1 }}>
                    Total Potential Earnings: GHS {(level1Earning * 5 + level2Earning * 5).toFixed(2)}+
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Withdrawal Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
                  <WhatsApp sx={{ color: '#25D366', fontSize: { xs: 28, sm: 32 } }} />
                  <Box>
                    <Typography variant="body2" fontWeight="800" sx={{ fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                      Withdraw to Mobile Money
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                      Minimum withdrawal: GHS 20 • MTN • Vodafone • AirtelTigo
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Trust Badges */}
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Security sx={{ color: '#10b981', fontSize: 24 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                      Secure
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Verified sx={{ color: '#10b981', fontSize: 24 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                      Verified
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Star sx={{ color: '#fbbf24', fontSize: 24 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem' }}>
                      5-Star Service
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>
      
      <Footer />
    </>
  )
}

export default ReferralSignup
