import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPercentages } from '../api/client'
import LoadingOverlay from '../common/LoadingOverlay'
import {
  Container, Paper, Box, Typography, TextField, Button,
  Alert, CircularProgress, IconButton, InputAdornment,
  Chip, Grid, Avatar, Divider, LinearProgress,
  useMediaQuery
} from '@mui/material'
import {
  Visibility, VisibilityOff, CheckCircle, Cancel,
  Person, ArrowBack, Phone, Email, Lock,
  AccountBalanceWallet, TrendingUp, Login,
  WhatsApp, ContentCopy, Star, Verified, Share, EmojiEvents,
  Security
} from '@mui/icons-material'
import Header from '../layout/Header'
import Footer from '../layout/Footer'

const ReferralSignup = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { signup } = useAuth()
  
  const urlParams = new URLSearchParams(location.search)
  const referralCodeFromUrl = urlParams.get('ref') || ''
  
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
        <LoadingOverlay open={isLoading} message="Loading..." />
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
      
      <Box sx={{ bgcolor: '#f8fafc', minHeight: 'calc(100vh - 64px)', py: { xs: 2, md: 3 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, md: 2 } }}>
          
          {/* Hero Banner - COMPACT */}
          <Paper sx={{ 
            mb: { xs: 2, md: 3 }, 
            p: { xs: 2, md: 2.5 }, 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            color: 'white', 
            borderRadius: { xs: 2, md: 3 },
            textAlign: 'center'
          }}>
            <Avatar sx={{ 
              bgcolor: 'white', 
              color: '#10b981', 
              width: { xs: 50, md: 55 }, 
              height: { xs: 50, md: 55 }, 
              mx: 'auto', 
              mb: 1
            }}>
              <EmojiEvents sx={{ fontSize: { xs: 28, md: 30 } }} />
            </Avatar>
            
            <Typography variant="h5" fontWeight="800" sx={{ fontSize: { xs: '1.2rem', md: '1.3rem' } }}>
              {referralCodeFromUrl ? '🎉 You Were Referred!' : 'Join Zivre'}
            </Typography>
            
            <Typography variant="body2" sx={{ opacity: 0.95, maxWidth: 500, mx: 'auto', mt: 0.5 }}>
              {referralCodeFromUrl 
                ? 'Your referral code is applied. Sign up and start earning!'
                : 'Get premium services and earn by referring friends.'}
            </Typography>
            
            {referralCodeFromUrl && (
              <Box sx={{ 
                mt: 1.5, 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 0.5, 
                bgcolor: 'rgba(255,255,255,0.2)', 
                px: 1.5, 
                py: 0.5, 
                borderRadius: 2 
              }}>
                <Verified sx={{ fontSize: 14 }} />
                <Typography variant="caption" fontWeight="600">
                  {referralCodeFromUrl}
                </Typography>
                <IconButton size="small" onClick={handleCopyReferralCode} sx={{ color: 'white', p: 0.5 }}>
                  <ContentCopy sx={{ fontSize: 14 }} />
                </IconButton>
                {copied && <Typography variant="caption">✓</Typography>}
              </Box>
            )}
          </Paper>

          <Grid container spacing={{ xs: 2, md: 2.5 }}>
            
            {/* LEFT COLUMN - Signup Form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ borderRadius: { xs: 2, md: 3 }, overflow: 'hidden' }}>
                <Box sx={{ 
                  p: { xs: 1.5, md: 2 }, 
                  bgcolor: '#10b981', 
                  color: 'white',
                  textAlign: 'center'
                }}>
                  <Person sx={{ fontSize: { xs: 26, md: 30 }, mb: 0.5 }} />
                  <Typography variant="h6" fontWeight="700" sx={{ fontSize: { xs: '1rem', md: '1.1rem' } }}>
                    Customer Account
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>Sign up & earn commissions</Typography>
                </Box>
                
                <Box sx={{ p: { xs: 1.5, md: 2 } }}>
                  {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1 }}>{error}</Alert>}
                  {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 1 }}>{success}</Alert>}

                  <form onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      size="small"
                      margin="dense"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                      InputProps={{ startAdornment: <Person sx={{ fontSize: 18, mr: 0.5, color: '#94a3b8' }} /> }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      size="small"
                      margin="dense"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      InputProps={{ startAdornment: <Email sx={{ fontSize: 18, mr: 0.5, color: '#94a3b8' }} /> }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Phone"
                      size="small"
                      margin="dense"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      InputProps={{ startAdornment: <Phone sx={{ fontSize: 18, mr: 0.5, color: '#94a3b8' }} /> }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Referral Code"
                      size="small"
                      margin="dense"
                      value={formData.referral_code}
                      onChange={(e) => {
                        let input = e.target.value;
                        if (input.includes('ref=')) {
                          const match = input.match(/ref=([A-Za-z0-9]+)/);
                          if (match && match[1]) input = match[1];
                        }
                        setFormData({ ...formData, referral_code: input });
                      }}
                      helperText={referralCodeFromUrl ? "✓ Applied from link" : "Optional"}
                      InputProps={{
                        readOnly: !!referralCodeFromUrl,
                        startAdornment: <Share sx={{ fontSize: 18, mr: 0.5, color: '#94a3b8' }} />
                      }}
                      sx={{ '& .MuiInputBase-root': referralCodeFromUrl ? { bgcolor: '#f0fdf4' } : {} }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      size="small"
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
                    />
                    
                    {/* ✅ PASSWORD REQUIREMENTS - VISIBLE */}
                    {formData.password && (
                      <Box sx={{ mt: 1, mb: 1.5, p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
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
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      size="small"
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
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={loading || (formData.password && !isPasswordValid())}
                      sx={{ mt: 2, py: 1, bgcolor: '#10b981' }}
                    >
                      {loading ? <CircularProgress size={20} /> : 'Create Account'}
                    </Button>
                  </form>

                  <Box sx={{ textAlign: 'center', mt: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Already have an account?{' '}
                      <Button onClick={handleSignInClick} sx={{ textTransform: 'none', color: '#10b981', p: 0, minWidth: 'auto' }}>
                        Sign In
                      </Button>
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* RIGHT COLUMN - Compact Commission Info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ 
                p: { xs: 1.5, md: 2 }, 
                borderRadius: { xs: 2, md: 3 }, 
                position: { xs: 'relative', md: 'sticky' }, 
                top: 16,
                border: '1px solid #e2e8f0'
              }}>
                <Typography variant="subtitle1" fontWeight="800" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccountBalanceWallet sx={{ color: '#10b981', fontSize: 20 }} />
                  How You Earn
                </Typography>
                
                <Divider sx={{ mb: 1.5 }} />
                
                <Box sx={{ mb: 1.5, p: 1, bgcolor: '#e0f2fe', borderRadius: 1 }}>
                  <Typography variant="body2" fontWeight="700" sx={{ color: '#0284c7', fontSize: '0.8rem' }}>
                    Referral Pool: {referralPoolPercent}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {referralPoolPercent}% of each booking to referrers
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="caption" fontWeight="700">On GHS {exampleBookingAmount}:</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="caption">Referral Pool:</Typography>
                    <Typography variant="caption" fontWeight="700">GHS {referralPoolAmount.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#f0fdf4' }}>
                    <Typography variant="caption">🎁 Self-bonus:</Typography>
                    <Typography variant="caption" fontWeight="700">+ GHS {selfBonus.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="caption">Level 1 (Direct):</Typography>
                    <Typography variant="caption">GHS {level1Earning.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="caption">Level 2 (Indirect):</Typography>
                    <Typography variant="caption">GHS {level2Earning.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="caption">Level 3+ (5%):</Typography>
                    <Typography variant="caption">GHS {level3Earning.toFixed(2)}</Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ p: 1, bgcolor: '#f0fdf4', borderRadius: 1, mb: 1 }}>
                  <Typography variant="caption" fontWeight="700" sx={{ color: '#10b981' }}>
                    💰 Refer 5 friends → Earn GHS {(level1Earning * 5 + level2Earning * 5).toFixed(2)}+
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.5 }}>
                  <WhatsApp sx={{ color: '#25D366', fontSize: 20 }} />
                  <Typography variant="caption" fontWeight="600">Withdraw to Mobile Money (Min GHS 20)</Typography>
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Security sx={{ color: '#10b981', fontSize: 18 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Secure</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Verified sx={{ color: '#10b981', fontSize: 18 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Verified</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Star sx={{ color: '#fbbf24', fontSize: 18 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>5-Star</Typography>
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
