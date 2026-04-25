import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPercentages, getServices } from '../api/client'
import {
  Container, Paper, Box, Typography, TextField, Button,
  Alert, CircularProgress, IconButton, InputAdornment,
  Chip, MenuItem, Select, FormControl, InputLabel,
  Card, CardContent, Grid, Avatar,
  Divider, LinearProgress, useMediaQuery
} from '@mui/material'
import {
  Visibility, VisibilityOff, CheckCircle, Cancel,
  Person, Build, ArrowBack, Phone,
  AccountBalanceWallet, TrendingUp, Login, HowToReg
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
  
  const [selectedRole, setSelectedRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [percentages, setPercentages] = useState({
    provider_percent: 60,
    admin_percent: 20,
    site_fee_percent: 10,
    referral_pool_percent: 10
  })
  const [loadingPercentages, setLoadingPercentages] = useState(true)
  
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
    service_specialization: '',
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
      }
    }
    loadData()
  }, [])

  // Load services for provider signup
  useEffect(() => {
    if (selectedRole === 'provider') {
      setLoadingServices(true)
      getServices(true).then(res => {
        setServices(res.data)
        setLoadingServices(false)
      }).catch(err => {
        console.error('Error loading services:', err)
        setLoadingServices(false)
      })
    }
  }, [selectedRole])

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

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    setError('')
  }

  const handleBackToRoles = () => {
    setSelectedRole(null)
    setError('')
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

    if (selectedRole === 'provider' && !formData.service_specialization) {
      setError('Please select your service specialization')
      return
    }

    setLoading(true)
    try {
      const userData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: selectedRole,
        service_specialization: selectedRole === 'provider' ? parseInt(formData.service_specialization) : null,
        referral_code: formData.referral_code
      }
      const res = await signup(userData)
      setSuccess('Account created successfully! Redirecting to dashboard...')
      setTimeout(() => {
        if (res.user.role === 'customer') {
          navigate('/customer/dashboard')
        } else if (res.user.role === 'provider') {
          navigate('/provider/dashboard')
        } else {
          navigate('/')
        }
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

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle Sign In click
  const handleSignInClick = () => {
    window.dispatchEvent(new CustomEvent('open_signin_modal'))
  }

  if (loadingPercentages) {
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
      
      <Box sx={{ 
        bgcolor: '#f8fafc', 
        minHeight: 'calc(100vh - 64px)', 
        py: { xs: 2, sm: 3, md: 6 }
      }}>
        <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 2, md: 3 } }}>
          
          {/* Hero Banner - Mobile optimized */}
          <Paper sx={{ 
            mb: { xs: 2, sm: 3, md: 5 }, 
            p: { xs: 2, sm: 3, md: 4 }, 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            color: 'white', 
            borderRadius: { xs: 2, sm: 3, md: 4 },
            textAlign: 'center'
          }}>
            <Avatar sx={{ 
              bgcolor: 'white', 
              color: '#10b981', 
              width: { xs: 50, sm: 60, md: 70 }, 
              height: { xs: 50, sm: 60, md: 70 }, 
              mx: 'auto', 
              mb: { xs: 1.5, sm: 2 },
              boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
            }}>
              <TrendingUp sx={{ fontSize: { xs: 28, sm: 34, md: 40 } }} />
            </Avatar>
            <Typography variant="h4" fontWeight="800" sx={{ fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.1rem' } }}>
              {referralCodeFromUrl ? '🎉 You Were Referred!' : 'Join Zivre Today!'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95, maxWidth: 600, mx: 'auto', mt: 1, fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
              {referralCodeFromUrl 
                ? 'Your referral code is already applied. Sign up now and start earning commissions!'
                : 'Get premium facility services or offer your skills and earn money.'}
            </Typography>
          </Paper>

          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
            
            {/* LEFT COLUMN - Role Selection or Signup Form */}
            <Grid size={{ xs: 12, md: 7 }}>
              {!selectedRole ? (
                // ROLE SELECTION CARDS - Mobile optimized
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {/* Customer Card */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Card sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: { xs: 2, sm: 3, md: 4 },
                      overflow: 'hidden',
                      '&:hover': { transform: { xs: 'none', sm: 'translateY(-4px)', md: 'translateY(-8px)' }, boxShadow: { xs: 2, sm: 4, md: 8 } }
                    }}>
                      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
                        <Avatar sx={{ 
                          bgcolor: '#10b98120', 
                          color: '#10b981', 
                          width: { xs: 60, sm: 70, md: 80 }, 
                          height: { xs: 60, sm: 70, md: 80 }, 
                          mx: 'auto', 
                          mb: { xs: 1.5, sm: 2 }
                        }}>
                          <Person sx={{ fontSize: { xs: 36, sm: 42, md: 48 } }} />
                        </Avatar>
                        <Typography variant="h5" fontWeight="800" sx={{ fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' } }}>
                          Customer
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          Request professional facility services
                        </Typography>
                        
                        <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
                        
                        <Box sx={{ textAlign: 'left', mb: { xs: 2, sm: 3 } }}>
                          <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                            ✓ What you'll do:
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                            Request HVAC, Electrical, Plumbing & more
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                            Track your service requests
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                            Rate providers after service
                          </Typography>
                        </Box>
                        
                        <Box sx={{ bgcolor: '#e0f2fe', p: { xs: 1, sm: 1.5, md: 2 }, borderRadius: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                          <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#0284c7' }} gutterBottom fontSize={{ xs: '0.7rem', sm: '0.75rem' }}>
                            💰 Your Earnings
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                            • Earn {percentages.referral_pool_percent}% commission on referrals
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                            • Self-bonus: 5% on your first booking
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                            • Withdraw from GHS 20
                          </Typography>
                        </Box>
                        
                        <Button 
                          fullWidth 
                          variant="contained"
                          size={isMobile ? "medium" : "large"}
                          startIcon={<HowToReg />}
                          onClick={() => handleRoleSelect('customer')}
                          sx={{ 
                            bgcolor: '#10b981', 
                            py: { xs: 1, sm: 1.5 },
                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                            fontWeight: 700,
                            '&:hover': { bgcolor: '#059669' }
                          }}
                        >
                          {isMobile ? "Sign Up" : "Sign Up as Customer"}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Provider Card */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Card sx={{ 
                      height: '100%', 
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      borderRadius: { xs: 2, sm: 3, md: 4 },
                      overflow: 'hidden',
                      '&:hover': { transform: { xs: 'none', sm: 'translateY(-4px)', md: 'translateY(-8px)' }, boxShadow: { xs: 2, sm: 4, md: 8 } }
                    }}>
                      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
                        <Avatar sx={{ 
                          bgcolor: '#fef3c720', 
                          color: '#f59e0b', 
                          width: { xs: 60, sm: 70, md: 80 }, 
                          height: { xs: 60, sm: 70, md: 80 }, 
                          mx: 'auto', 
                          mb: { xs: 1.5, sm: 2 }
                        }}>
                          <Build sx={{ fontSize: { xs: 36, sm: 42, md: 48 } }} />
                        </Avatar>
                        <Typography variant="h5" fontWeight="800" sx={{ fontSize: { xs: '1.2rem', sm: '1.3rem', md: '1.5rem' } }}>
                          Service Provider
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '0.7rem', sm: '0.8rem' } }}>
                          Offer your skills and earn money
                        </Typography>
                        
                        <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />
                        
                        <Box sx={{ textAlign: 'left', mb: { xs: 2, sm: 3 } }}>
                          <Typography variant="subtitle2" fontWeight="600" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                            ✓ What you'll do:
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                            Get assigned to customer requests
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5, fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                            Complete jobs and update status
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}>
                            Get paid directly by customers
                          </Typography>
                        </Box>
                        
                        <Box sx={{ bgcolor: '#fef3c7', p: { xs: 1, sm: 1.5, md: 2 }, borderRadius: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
                          <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#d97706' }} gutterBottom fontSize={{ xs: '0.7rem', sm: '0.75rem' }}>
                            💰 Your Earnings
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                            • Earn {percentages.provider_percent}% per job
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                            • Customers pay you DIRECTLY
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                            • Plus referral commissions!
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5, fontWeight: 600, fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                            Example: GHS 500 → You earn GHS {(500 * percentages.provider_percent / 100).toFixed(0)}!
                          </Typography>
                        </Box>
                        
                        <Button 
                          fullWidth 
                          variant="contained"
                          size={isMobile ? "medium" : "large"}
                          startIcon={<HowToReg />}
                          onClick={() => handleRoleSelect('provider')}
                          sx={{ 
                            bgcolor: '#10b981', 
                            py: { xs: 1, sm: 1.5 },
                            fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' },
                            fontWeight: 700,
                            '&:hover': { bgcolor: '#059669' }
                          }}
                        >
                          {isMobile ? "Sign Up" : "Sign Up as Provider"}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  {/* Sign In Link below cards */}
                  <Grid size={12}>
                    <Box sx={{ textAlign: 'center', mt: { xs: 2, sm: 3 } }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                        Already have an account?{' '}
                        <Button 
                          onClick={handleSignInClick}
                          startIcon={<Login />}
                          sx={{ 
                            textTransform: 'none', 
                            color: '#10b981', 
                            fontWeight: 700,
                            fontSize: { xs: '0.75rem', sm: '0.8rem' },
                            '&:hover': { bgcolor: '#e6f7f0' }
                          }}
                        >
                          Sign In Here
                        </Button>
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                // SIGNUP FORM (When role is selected) - Mobile optimized
                <Paper sx={{ borderRadius: { xs: 2, sm: 3, md: 4 }, overflow: 'hidden' }}>
                  {/* Header */}
                  <Box sx={{ 
                    p: { xs: 2, sm: 2.5, md: 3 }, 
                    bgcolor: '#10b981', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton onClick={handleBackToRoles} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', p: { xs: 0.8, sm: 1 } }}>
                        <ArrowBack />
                      </IconButton>
                      <Typography variant="h6" fontWeight="700" sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.2rem' } }}>
                        Create {selectedRole === 'customer' ? 'Customer' : 'Provider'} Account
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'white', color: '#10b981', width: { xs: 32, sm: 36, md: 40 }, height: { xs: 32, sm: 36, md: 40 } }}>
                      {selectedRole === 'customer' ? <Person /> : <Build />}
                    </Avatar>
                  </Box>
                  
                  <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                    {error && (
                      <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
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
                        label="Full Name"
                        size={isMobile ? "small" : "medium"}
                        margin={isMobile ? "dense" : "normal"}
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                        placeholder="John Doe"
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
                      />
                      
                      <TextField
                        fullWidth
                        label="Referral Code"
                        size={isMobile ? "small" : "medium"}
                        margin={isMobile ? "dense" : "normal"}
                        value={formData.referral_code}
                        InputProps={{ readOnly: true }}
                        helperText={referralCodeFromUrl ? "✓ Referral code applied from your link!" : "Enter a referral code if you have one"}
                        sx={{ '& .MuiInputBase-root': { bgcolor: '#f0fdf4' } }}
                      />

                      {selectedRole === 'provider' && (
                        <FormControl fullWidth size={isMobile ? "small" : "medium"} margin={isMobile ? "dense" : "normal"} required>
                          <InputLabel>Service Specialization</InputLabel>
                          <Select
                            value={formData.service_specialization}
                            onChange={(e) => setFormData({ ...formData, service_specialization: e.target.value })}
                            label="Service Specialization"
                            disabled={loadingServices}
                          >
                            {loadingServices ? (
                              <MenuItem disabled>Loading services...</MenuItem>
                            ) : services.length === 0 ? (
                              <MenuItem disabled>No active services available</MenuItem>
                            ) : (
                              services.map((service) => (
                                <MenuItem key={service.id} value={service.id}>
                                  {service.icon} {service.name}
                                </MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      )}

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
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                                  {showPassword ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }
                        }}
                      />
                      
                      {formData.password && (
                        <Box sx={{ mt: 1.5, mb: 1.5 }}>
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
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 }, mt: 1 }}>
                            {Object.entries(passwordStrength).map(([key, valid]) => (
                              <Typography key={key} variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: valid ? '#10b981' : '#64748b', fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                                {valid ? <CheckCircle sx={{ fontSize: { xs: 10, sm: 12 } }} /> : <Cancel sx={{ fontSize: { xs: 10, sm: 12 } }} />}
                                {key === 'length' ? '8+ chars' : key}
                              </Typography>
                            ))}
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
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
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
                        size={isMobile ? "medium" : "large"}
                        disabled={loading || (formData.password && !isPasswordValid())}
                        sx={{ 
                          mt: { xs: 2, sm: 3, md: 4 }, 
                          py: { xs: 1.2, sm: 1.5, md: 1.8 }, 
                          bgcolor: '#10b981',
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                          fontWeight: 800,
                          '&:hover': { bgcolor: '#059669' }
                        }}
                      >
                        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Account'}
                      </Button>
                    </form>

                    <Box sx={{ textAlign: 'center', mt: { xs: 2, sm: 2.5, md: 3 } }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' } }}>
                        Already have an account?{' '}
                        <Button 
                          onClick={handleSignInClick}
                          startIcon={<Login />}
                          sx={{ textTransform: 'none', color: '#10b981', fontWeight: 700, fontSize: 'inherit' }}
                        >
                          Sign In
                        </Button>
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}
            </Grid>

            {/* RIGHT COLUMN - Commission Info (Sticky) - Mobile optimized */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ 
                p: { xs: 2, sm: 2.5, md: 3 }, 
                borderRadius: { xs: 2, sm: 3, md: 4 }, 
                position: { xs: 'relative', md: 'sticky' }, 
                top: 20,
                border: '1px solid #e2e8f0'
              }}>
                <Typography variant="h6" fontWeight="800" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.1rem', md: '1.2rem' } }}>
                  <AccountBalanceWallet sx={{ color: '#10b981', fontSize: { xs: 22, sm: 24, md: 28 } }} />
                  How You Earn
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                {/* Referral Pool Info */}
                <Box sx={{ mb: 3, p: { xs: 1.5, sm: 2 }, bgcolor: '#e0f2fe', borderRadius: { xs: 2, sm: 3 } }}>
                  <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#0284c7', fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                    📊 Referral Pool: {percentages.referral_pool_percent}% of each booking
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                    When someone you refer completes a service, {percentages.referral_pool_percent}% goes to the referral pool.
                  </Typography>
                </Box>
                
                {/* Commission Table */}
                <Typography variant="subtitle2" fontWeight="700" sx={{ mb: 1.5, fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' } }}>
                  Commission Distribution (on GHS 500):
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: { xs: 1, sm: 1.2 }, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Referral Pool Amount:</Typography>
                    <Typography variant="body2" fontWeight="700" sx={{ color: '#10b981', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      GHS {(500 * percentages.referral_pool_percent / 100).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: { xs: 1, sm: 1.2 }, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Level 0 (Your first - 5%):</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>GHS {(500 * percentages.referral_pool_percent / 100 * 0.05).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: { xs: 1, sm: 1.2 }, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Level 1 (Direct - 20%):</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>GHS {(500 * percentages.referral_pool_percent / 100 * 0.2).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: { xs: 1, sm: 1.2 }, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Level 2 (Indirect - 10%):</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>GHS {(500 * percentages.referral_pool_percent / 100 * 0.1).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: { xs: 1, sm: 1.2 } }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Level 3+ (5% each):</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>GHS {(500 * percentages.referral_pool_percent / 100 * 0.05).toFixed(2)}</Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Example Earnings */}
                <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: '#f0fdf4', borderRadius: { xs: 2, sm: 3 }, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#10b981', mb: 1, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                    💰 Example: You refer 5 friends
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5, fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                    Each friend books GHS 500:
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ color: '#10b981', fontWeight: 600, fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                    • 5 direct × GHS 10 = GHS 50
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ color: '#10b981', fontWeight: 600, mb: 1, fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                    • Their referrals = GHS 25+
                  </Typography>
                  <Typography variant="body2" fontWeight="800" sx={{ color: '#10b981', fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                    Total: GHS 75+
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Withdrawal Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
                  <Phone sx={{ color: '#25D366', fontSize: { xs: 24, sm: 28 } }} />
                  <Box>
                    <Typography variant="body2" fontWeight="800" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                      Withdraw to Mobile Money
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.65rem' } }}>
                      Minimum: GHS 20
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
