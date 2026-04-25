import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getPercentages, getServices } from '../api/client'
import {
  Container, Paper, Box, Typography, TextField, Button,
  Alert, CircularProgress, IconButton, InputAdornment,
  Chip, MenuItem, Select, FormControl, InputLabel,
  Card, CardContent, Grid, Avatar, Stepper, Step, StepLabel,
  Divider, LinearProgress
} from '@mui/material'
import {
  Visibility, VisibilityOff, CheckCircle, Cancel,
  Person, Build, ArrowBack, WhatsApp, Phone,
  AccountBalanceWallet, TrendingUp, People
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
  
  const [activeStep, setActiveStep] = useState(0)
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

  // Load percentages and services
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
    setActiveStep(1)
    setError('')
  }

  const handleBack = () => {
    setActiveStep(0)
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
      
      <Box sx={{ bgcolor: '#f8fafc', minHeight: 'calc(100vh - 64px)', py: 6 }}>
        <Container maxWidth="lg">
          {/* Banner */}
          <Paper sx={{ mb: 4, p: 3, bgcolor: '#10b981', color: 'white', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Avatar sx={{ bgcolor: 'white', color: '#10b981', width: 56, height: 56 }}>
                <TrendingUp sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="800">
                  {referralCodeFromUrl ? '🎉 You were referred by a friend!' : 'Join Zivre Today!'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {referralCodeFromUrl 
                    ? 'Your referral code is already applied. Sign up now and start earning commissions!'
                    : 'Get premium facility services or offer your skills and earn money.'}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Main Content */}
          <Grid container spacing={4}>
            {/* Left Column - Role Selection or Form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                {activeStep === 0 ? (
                  // Step 1: Role Selection
                  <Box>
                    <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <Typography variant="h6" fontWeight="700" color="#0f172a">
                        Choose Your Role
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Select how you want to use Zivre
                      </Typography>
                    </Box>
                    
                    <Grid container sx={{ p: 3 }} spacing={3}>
                      {/* Customer Card */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Card sx={{ 
                          height: '100%', 
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: '2px solid transparent',
                          '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                        }}
                        onClick={() => handleRoleSelect('customer')}>
                          <CardContent sx={{ p: 3 }}>
                            <Avatar sx={{ bgcolor: '#10b98120', color: '#10b981', width: 56, height: 56, mb: 2 }}>
                              <Person sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Typography variant="h6" fontWeight="700" gutterBottom>
                              Customer
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Request professional facility services at your doorstep
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                                What you'll do:
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                                ✓ Request HVAC, Electrical, Plumbing & more
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                                ✓ Track your service requests
                              </Typography>
                              <Typography variant="caption" display="block">
                                ✓ Rate providers after service
                              </Typography>
                            </Box>
                            <Box sx={{ bgcolor: '#e0f2fe', p: 1.5, borderRadius: 2 }}>
                              <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#0284c7' }} gutterBottom>
                                💰 Your Earnings
                              </Typography>
                              <Typography variant="caption" display="block">
                                • Earn {percentages.referral_pool_percent}% commission on referrals
                                • Self-bonus: 5% on your first booking
                                • Withdraw from GHS 20 to Mobile Money
                              </Typography>
                            </Box>
                            <Button 
                              fullWidth 
                              variant="contained" 
                              sx={{ mt: 2, bgcolor: '#10b981' }}
                              onClick={() => handleRoleSelect('customer')}
                            >
                              Select Customer
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>

                      {/* Provider Card */}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Card sx={{ 
                          height: '100%', 
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          border: '2px solid transparent',
                          '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 }
                        }}
                        onClick={() => handleRoleSelect('provider')}>
                          <CardContent sx={{ p: 3 }}>
                            <Avatar sx={{ bgcolor: '#fef3c720', color: '#f59e0b', width: 56, height: 56, mb: 2 }}>
                              <Build sx={{ fontSize: 32 }} />
                            </Avatar>
                            <Typography variant="h6" fontWeight="700" gutterBottom>
                              Service Provider
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              Offer your skills and earn money completing jobs
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                                What you'll do:
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                                ✓ Get assigned to customer requests
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                                ✓ Complete jobs and update status
                              </Typography>
                              <Typography variant="caption" display="block">
                                ✓ Get paid directly by customers
                              </Typography>
                            </Box>
                            <Box sx={{ bgcolor: '#fef3c7', p: 1.5, borderRadius: 2 }}>
                              <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#d97706' }} gutterBottom>
                                💰 Your Earnings
                              </Typography>
                              <Typography variant="caption" display="block">
                                • Earn {percentages.provider_percent}% per job completed
                                • Customers pay you DIRECTLY via Mobile Money
                                • Plus referral commissions on top!
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 0.5, fontWeight: 600 }}>
                                Example: GHS 500 job → You earn GHS {(500 * percentages.provider_percent / 100).toFixed(0)}!
                              </Typography>
                            </Box>
                            <Button 
                              fullWidth 
                              variant="contained" 
                              sx={{ mt: 2, bgcolor: '#10b981' }}
                              onClick={() => handleRoleSelect('provider')}
                            >
                              Select Provider
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Box>
                ) : (
                  // Step 2: Signup Form
                  <Box>
                    <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton onClick={handleBack}>
                        <ArrowBack />
                      </IconButton>
                      <Typography variant="h6" fontWeight="700" color="#0f172a">
                        Create {selectedRole === 'customer' ? 'Customer' : 'Provider'} Account
                      </Typography>
                    </Box>
                    
                    <Box sx={{ p: 3 }}>
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
                          size="small"
                          label="Full Name"
                          margin="normal"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          required
                          placeholder="John Doe"
                        />
                        
                        <TextField
                          fullWidth
                          size="small"
                          label="Email Address"
                          type="email"
                          margin="normal"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="john@example.com"
                        />
                        
                        <TextField
                          fullWidth
                          size="small"
                          label="Phone Number"
                          margin="normal"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          placeholder="024XXXXXXX"
                        />
                        
                        <TextField
                          fullWidth
                          size="small"
                          label="Referral Code"
                          margin="normal"
                          value={formData.referral_code}
                          InputProps={{ readOnly: true }}
                          helperText={referralCodeFromUrl ? "✓ Referral code applied from your link!" : "Enter a referral code if you have one"}
                        />

                        {selectedRole === 'provider' && (
                          <FormControl fullWidth size="small" margin="normal" required>
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
                          size="small"
                          label="Password"
                          type={showPassword ? 'text' : 'password'}
                          margin="normal"
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
                                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              )
                            }
                          }}
                        />
                        
                        {formData.password && (
                          <Box sx={{ mt: 1, mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">Password Strength:</Typography>
                              <Chip label={getPasswordStrengthText()} size="small" sx={{ bgcolor: `${getPasswordStrengthColor()}15`, color: getPasswordStrengthColor() }} />
                            </Box>
                            <LinearProgress variant="determinate" value={Object.values(passwordStrength).filter(Boolean).length * 20} sx={{ height: 4, borderRadius: 2, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: getPasswordStrengthColor() } }} />
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                              {Object.entries(passwordStrength).map(([key, valid]) => (
                                <Typography key={key} variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: valid ? '#10b981' : '#64748b' }}>
                                  {valid ? <CheckCircle sx={{ fontSize: 12 }} /> : <Cancel sx={{ fontSize: 12 }} />}
                                  {key === 'length' ? '8+ chars' : key}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}

                        <TextField
                          fullWidth
                          size="small"
                          label="Confirm Password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          margin="normal"
                          value={formData.confirm_password}
                          onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                          error={!!(formData.confirm_password && formData.password !== formData.confirm_password)}
                          helperText={formData.confirm_password && formData.password !== formData.confirm_password ? 'Passwords do not match' : ''}
                          required
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
                          disabled={loading || (formData.password && !isPasswordValid())}
                          sx={{ mt: 3, py: 1.5, bgcolor: '#10b981' }}
                        >
                          {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Create Account'}
                        </Button>
                      </form>

                      <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Already have an account?{' '}
                          <Button 
                            onClick={() => window.dispatchEvent(new CustomEvent('open_signin_modal'))}
                            sx={{ textTransform: 'none', color: '#10b981', p: 0 }}
                          >
                            Sign In
                          </Button>
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Right Column - Commission Info (Always Visible) */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 20 }}>
                <Typography variant="h6" fontWeight="700" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountBalanceWallet sx={{ color: '#10b981' }} />
                  How You Earn
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                {/* Referral Pool Info */}
                <Box sx={{ mb: 3, p: 2, bgcolor: '#e0f2fe', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#0284c7' }}>
                    📊 Referral Pool: {percentages.referral_pool_percent}% of each booking
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    When someone you refers completes a service, {percentages.referral_pool_percent}% of the amount goes to the referral pool.
                  </Typography>
                </Box>
                
                {/* Commission Table */}
                <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                  Commission Distribution (on GHS 500 booking):
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2">Referral Pool Amount:</Typography>
                    <Typography variant="body2" fontWeight="600" sx={{ color: '#10b981' }}>
                      GHS {(500 * percentages.referral_pool_percent / 100).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2">Level 0 (Your first booking - 5%):</Typography>
                    <Typography variant="body2" fontWeight="600">GHS {(500 * percentages.referral_pool_percent / 100 * 0.05).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2">Level 1 (Direct referral - 20%):</Typography>
                    <Typography variant="body2" fontWeight="600">GHS {(500 * percentages.referral_pool_percent / 100 * 0.2).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="body2">Level 2 (Indirect - 10%):</Typography>
                    <Typography variant="body2" fontWeight="600">GHS {(500 * percentages.referral_pool_percent / 100 * 0.1).toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Typography variant="body2">Level 3+ (5% each):</Typography>
                    <Typography variant="body2" fontWeight="600">GHS {(500 * percentages.referral_pool_percent / 100 * 0.05).toFixed(2)}</Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Example Earnings */}
                <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#10b981', mb: 1 }}>
                    💰 Example: You refer 5 friends
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    Each friend books GHS 500 service:
                  </Typography>
                  <Typography variant="caption" display="block">
                    • 5 direct referrals × GHS 10 = GHS 50
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                    • Their referrals (level 2) = GHS 25+
                  </Typography>
                  <Typography variant="body2" fontWeight="600" sx={{ color: '#10b981' }}>
                    Total potential: GHS 75+
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Withdrawal Info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Phone sx={{ color: '#25D366' }} />
                  <Box>
                    <Typography variant="body2" fontWeight="600">Withdraw to Mobile Money</Typography>
                    <Typography variant="caption" color="text.secondary">Minimum withdrawal: GHS 20</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>
          
          {/* Sign In Link at Bottom */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Button 
                onClick={() => window.dispatchEvent(new CustomEvent('open_signin_modal'))}
                sx={{ textTransform: 'none', color: '#10b981', fontWeight: 600 }}
              >
                Sign In Here
              </Button>
            </Typography>
          </Box>
        </Container>
      </Box>
      
      <Footer />
    </>
  )
}

export default ReferralSignup
