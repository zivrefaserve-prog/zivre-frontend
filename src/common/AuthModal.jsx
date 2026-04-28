import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Dialog, DialogTitle, DialogContent, TextField, Button, Box, Typography, Alert, CircularProgress, IconButton, InputAdornment, Chip, MenuItem, Select, FormControl, InputLabel, Divider } from '@mui/material'
import { Visibility, VisibilityOff, CheckCircle, Cancel, Person, Email, Phone, Lock, Share } from '@mui/icons-material'
import { getServices } from '../api/client'
import LoadingOverlay from './LoadingOverlay'

const AuthModal = ({ isSignUp, role, onClose, onSuccess, onSwitchToSignIn, onSwitchToSignUp }) => {
  const { login, signup, authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [services, setServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [isReferralSignup, setIsReferralSignup] = useState(false)
  const [referralCodeFromStorage, setReferralCodeFromStorage] = useState('')
  
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
    referral_code: ''
  })

  // Load services for provider signup
  useEffect(() => {
    if (isSignUp && role === 'provider') {
      setLoadingServices(true)
      getServices(true).then(res => {
        setServices(res.data)
        setLoadingServices(false)
      }).catch(err => {
        console.error('Error loading services:', err)
        setLoadingServices(false)
      })
    }
  }, [isSignUp, role])

  // Check for referral code from sessionStorage when modal opens
  useEffect(() => {
    const storedCode = sessionStorage.getItem('zivre_referral_code');
    if (storedCode && isSignUp && role === 'customer') {
      setIsReferralSignup(true);
      setReferralCodeFromStorage(storedCode);
      setFormData(prev => ({ ...prev, referral_code: storedCode }));
      // Clear it so it doesn't show again on next modal open
      sessionStorage.removeItem('zivre_referral_code');
    } else {
      setIsReferralSignup(false);
    }
  }, [isSignUp, role]);
  
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

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value
    setFormData({ ...formData, password: newPassword })
    checkPasswordStrength(newPassword)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
  
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address (e.g., name@example.com)')
      return
    }
  
    if (isSignUp) {
      // ========== SIGN UP ==========
      if (!formData.full_name.trim()) {
        setError('Please enter your full name')
        return
      }
  
      if (!validatePhone(formData.phone)) {
        setError('Please enter a valid phone number (10-15 digits, e.g., 024XXXXXXX)')
        return
      }
  
      if (!isPasswordValid()) {
        setError(getPasswordErrorMessage())
        return
      }
  
      if (formData.password !== formData.confirm_password) {
        setError("Passwords don't match. Please re-enter.")
        return
      }
  
      if (role === 'provider' && !formData.service_specialization) {
        setError('Please select your service specialization')
        return
      }
  
      setLoading(true)
      setError('')
      try {
        const userData = {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: role || 'customer',
          service_specialization: role === 'provider' ? parseInt(formData.service_specialization) : null,
          referral_code: formData.referral_code
        }
        
        const res = await signup(userData)
        
        if (res.data && res.data.requires_verification) {
          onClose()
          window.location.href = `/verification-sent?email=${encodeURIComponent(res.data.email)}`
          return
        }
        
        if (res.data && res.data.user) {
          onSuccess(res.data.user)
          onClose()
        }
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
    } else {
      // ========== SIGN IN ==========
      if (!formData.email || !formData.password) {
        setError('Please enter both email and password')
        return
      }
  
      setLoading(true)
      setError('')
      try {
        const res = await login(formData.email, formData.password)
        
        if (res && res.user) {
          onSuccess(res.user)
          onClose()
        }
      } catch (err) {
        console.error('Login error:', err)
        
        let errorMessage = 'Login failed. Please try again.'
        
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message
        } else if (err.message) {
          errorMessage = err.message
        }
        
        if (errorMessage.includes('verify')) {
          errorMessage = 'Please verify your email address before logging in. Check your inbox for the verification link.'
        } else if (errorMessage.includes('Invalid email or password')) {
          errorMessage = 'Incorrect email or password. Please try again.'
        } else if (errorMessage.includes('suspended')) {
          errorMessage = 'Your account has been suspended. Please contact support.'
        }
        
        setError(errorMessage)
        setFormData(prev => ({ ...prev, password: '' }))
        
      } finally {
        setLoading(false)
      }
    }
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

  const handleForgotPassword = () => {
    console.log('Opening forgot password modal')
    onClose()
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open_forgot_password'))
    }, 100)
  }

  // ========== SPECIAL REFERRAL SIGNUP MODAL ==========
  if (isSignUp && role === 'customer' && isReferralSignup) {
    return (
      <>
        <LoadingOverlay open={authLoading} message="Creating your account..." />
        
        <Dialog 
          open={true} 
          onClose={onClose} 
          maxWidth="md" 
          fullWidth
          disableEnforceFocus
          sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ textAlign: 'center', pt: 4, bgcolor: '#10b981', color: 'white' }}>
            <Typography variant="h5" component="div" fontWeight="800">
              🎉 YOU'VE BEEN REFERRED! 🎉
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
              Join Zivre and start earning today
            </Typography>
          </DialogTitle>

          <DialogContent sx={{ pb: 4, pt: 3 }}>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Referred by: <strong>KOFI MENSAH</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your referral code: <strong>{referralCodeFromStorage}</strong> ✓ Applied
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                size="small"
                label="Full Name"
                margin="dense"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                sx={{ mb: 2 }}
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
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                size="small"
                label="Phone Number"
                margin="dense"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                error={!!(formData.phone && !validatePhone(formData.phone))}
                helperText={formData.phone && !validatePhone(formData.phone) ? 'Enter valid phone number' : ''}
                required
                InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                size="small"
                label="Referral Code"
                margin="dense"
                value={formData.referral_code}
                disabled
                InputProps={{ 
                  startAdornment: <InputAdornment position="start"><Share sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>,
                  readOnly: true
                }}
                sx={{ mb: 2, '& .MuiInputBase-root': { bgcolor: '#f8fafc' } }}
              />

              <TextField
                fullWidth
                size="small"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                margin="dense"
                value={formData.password}
                onChange={handlePasswordChange}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />

              {formData.password && (
                <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Password Strength:</Typography>
                    <Chip label={getPasswordStrengthText()} size="small" sx={{ bgcolor: `${getPasswordStrengthColor()}15`, color: getPasswordStrengthColor(), height: 20, fontSize: '0.6rem' }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                    {Object.entries(passwordStrength).map(([key, valid]) => (
                      <Box key={key} sx={{ flex: 1, height: 3, bgcolor: valid ? getPasswordStrengthColor() : '#e2e8f0', borderRadius: 3 }} />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: passwordStrength.length ? '#10b981' : '#64748b', fontSize: '0.65rem' }}>
                      {passwordStrength.length ? <CheckCircle sx={{ fontSize: 10 }} /> : <Cancel sx={{ fontSize: 10 }} />} 8+ chars
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: passwordStrength.uppercase ? '#10b981' : '#64748b', fontSize: '0.65rem' }}>
                      {passwordStrength.uppercase ? <CheckCircle sx={{ fontSize: 10 }} /> : <Cancel sx={{ fontSize: 10 }} />} A-Z
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: passwordStrength.lowercase ? '#10b981' : '#64748b', fontSize: '0.65rem' }}>
                      {passwordStrength.lowercase ? <CheckCircle sx={{ fontSize: 10 }} /> : <Cancel sx={{ fontSize: 10 }} />} a-z
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: passwordStrength.number ? '#10b981' : '#64748b', fontSize: '0.65rem' }}>
                      {passwordStrength.number ? <CheckCircle sx={{ fontSize: 10 }} /> : <Cancel sx={{ fontSize: 10 }} />} 0-9
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: passwordStrength.special ? '#10b981' : '#64748b', fontSize: '0.65rem' }}>
                      {passwordStrength.special ? <CheckCircle sx={{ fontSize: 10 }} /> : <Cancel sx={{ fontSize: 10 }} />} !@#$%
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
                  startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3, p: 2, bgcolor: '#e0f2fe', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#0284c7', mb: 1.5 }}>
                  💰 HOW YOU BOTH EARN
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, bgcolor: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" fontWeight="700" sx={{ color: 'white' }}>1</Typography>
                    </Box>
                    <Typography variant="body2">
                      <strong>KOFI EARNS 20%</strong> when you complete your first service
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, bgcolor: '#f59e0b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" fontWeight="700" sx={{ color: 'white' }}>2</Typography>
                    </Box>
                    <Typography variant="body2">
                      <strong>YOU EARN 5%</strong> on your very first booking (self-bonus!)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, bgcolor: '#8b5cf6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" fontWeight="700" sx={{ color: 'white' }}>3</Typography>
                    </Box>
                    <Typography variant="body2">
                      <strong>YOU EARN 20%</strong> from everyone YOU refer
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 32, height: 32, bgcolor: '#ec4898', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" fontWeight="700" sx={{ color: 'white' }}>4</Typography>
                    </Box>
                    <Typography variant="body2">
                      <strong>WITHDRAW GHS 20+</strong> to Mobile Money (MTN, Vodafone, AirtelTigo)
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || !isPasswordValid()}
                sx={{ py: 1.5, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : '🚀 SIGN UP & START EARNING'}
              </Button>
            </form>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Button onClick={onSwitchToSignIn} sx={{ textTransform: 'none', color: '#10b981', fontWeight: 600, p: 0, minWidth: 'auto' }}>
                  Sign In
                </Button>
              </Typography>
            </Box>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // ========== REGULAR SIGNUP MODAL (No referral) ==========
  return (
    <>
      <LoadingOverlay 
        open={authLoading} 
        message={isSignUp ? "Creating your account..." : "Signing you in..."} 
      />
      
      <Dialog 
        open={true} 
        onClose={onClose} 
        maxWidth="xs" 
        fullWidth
        disableEnforceFocus
        sx={{ '& .MuiPaper-root': { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
          <Typography variant="h6" component="div" fontWeight="800" sx={{ color: '#0f172a' }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {isSignUp 
              ? `Sign up as a ${role === 'provider' ? 'Service Provider' : 'Customer'}`
              : 'Sign in to your account'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ pb: 4 }}>
          
          {error && (
            <Alert 
              severity="error" 
              sx={{ mb: 2, borderRadius: 2 }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <TextField
                  fullWidth
                  size="small"
                  label="Full Name"
                  margin="dense"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  sx={{ mb: 1.5 }}
                  helperText="Enter your full name as it appears on ID"
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
                  helperText={formData.email && !validateEmail(formData.email) ? 'Enter a valid email (e.g., name@example.com)' : ''}
                  required
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
                  helperText={formData.phone && !validatePhone(formData.phone) ? 'Enter valid phone number (e.g., 024XXXXXXX)' : ''}
                  required
                  sx={{ mb: 1.5 }}
                />

                {role !== 'provider' && (
                  <TextField
                    fullWidth
                    size="small"
                    label="Referral Code or Link (Optional)"
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
                    margin="dense"
                    helperText="Enter a referral code if you have one"
                    sx={{ mb: 1.5 }}
                  />
                )}

                {role === 'provider' && (
                  <FormControl fullWidth size="small" sx={{ mb: 1.5 }} required>
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
              </>
            )}

            {!isSignUp && (
              <TextField
                fullWidth
                size="small"
                label="Email Address"
                type="email"
                margin="dense"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                sx={{ mb: 1.5 }}
              />
            )}

            <TextField
              fullWidth
              size="small"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              margin="dense"
              value={formData.password}
              onChange={isSignUp ? handlePasswordChange : (e) => setFormData({ ...formData, password: e.target.value })}
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
              sx={{ mb: 1.5 }}
            />

            {!isSignUp && (
              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Button
                  onClick={handleForgotPassword}
                  sx={{ 
                    color: '#10b981', 
                    cursor: 'pointer', 
                    textTransform: 'none',
                    backgroundColor: 'transparent',
                    padding: 0,
                    minWidth: 'auto',
                    '&:hover': { 
                      textDecoration: 'underline',
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  Forgot Password?
                </Button>
              </Box>
            )}

            {isSignUp && (
              <>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Password Strength:</Typography>
                    <Chip 
                      label={getPasswordStrengthText()} 
                      size="small" 
                      sx={{ 
                        bgcolor: `${getPasswordStrengthColor()}15`, 
                        color: getPasswordStrengthColor(),
                        fontWeight: 500,
                        fontSize: '0.7rem'
                      }} 
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                    {Object.entries(passwordStrength).map(([key, valid]) => (
                      <Box 
                        key={key} 
                        sx={{ 
                          flex: 1, 
                          height: 3, 
                          bgcolor: valid ? '#10b981' : '#e2e8f0',
                          borderRadius: 3
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
                  {formData.password && !isPasswordValid() && (
                    <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                      {getPasswordErrorMessage()}
                    </Typography>
                  )}
                </Box>

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
                  sx={{ mb: 1.5 }}
                />
              </>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || (isSignUp && !isPasswordValid()) || (isSignUp && role === 'provider' && !formData.service_specialization)}
              sx={{ py: 1.5, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (isSignUp ? 'Sign Up' : 'Sign In')}
            </Button>
          </form>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <Button 
                onClick={() => {
                  if (isSignUp) {
                    onSwitchToSignIn()
                  } else {
                    onSwitchToSignUp(role)
                  }
                }}
                sx={{ textTransform: 'none', color: '#10b981', fontWeight: 600, padding: 0, minWidth: 'auto' }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Button>
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default AuthModal
