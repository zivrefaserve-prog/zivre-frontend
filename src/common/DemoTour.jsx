import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Step, StepLabel, Stepper,
  MobileStepper, Paper, IconButton, Tooltip
} from '@mui/material'
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  PlayArrow as PlayIcon,
  School as SchoolIcon
} from '@mui/icons-material'

const DemoTour = ({ open, onClose, steps, title = "Guided Tour" }) => {
  const [activeStep, setActiveStep] = useState(0)

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onClose()
      setActiveStep(0)
    } else {
      setActiveStep(activeStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(activeStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
    onClose()
  }

  const currentStep = steps[activeStep]

  return (
    <Dialog 
      open={open} 
      onClose={handleReset}
      maxWidth="sm" 
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}
    >
      <Box sx={{ bgcolor: '#10b981', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon />
          <Typography variant="h6" fontWeight="600">{title}</Typography>
        </Box>
        <IconButton onClick={handleReset} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, minHeight: 300 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ fontSize: 48, mb: 2 }}>{currentStep?.icon || '📢'}</Box>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 1, color: '#0f172a' }}>
            {currentStep?.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {currentStep?.description}
          </Typography>
          {currentStep?.tip && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
              <Typography variant="caption" color="#10b981">
                💡 Tip: {currentStep.tip}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid #e2e8f0' }}>
        <Button 
          onClick={handleReset}
          sx={{ color: '#64748b' }}
        >
          Skip Tour
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button 
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<PrevIcon />}
        >
          Back
        </Button>
        <Button 
          onClick={handleNext}
          variant="contained"
          endIcon={activeStep === steps.length - 1 ? null : <NextIcon />}
          sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
        >
          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// Updated Customer Tour Steps (No referral mentions)
export const customerTourSteps = [
  {
    title: 'Welcome to Zivre!',
    description: 'Get premium facility services at your doorstep. HVAC, Electrical, Plumbing, Security, and more!',
    icon: '👋',
    tip: 'Sign Up now to get started or Sign In straight if you already have account!'
  },
  {
    title: 'Browse Services',
    description: 'Explore our wide range of facility services. Click on any service to see details and pricing.',
    icon: '🔧',
    tip: 'We offer 13+ professional services across Ghana.'
  },
  {
    title: 'Request a Service',
    description: 'Fill in your location details and submit a request. Our team will assign a verified provider.',
    icon: '📝',
    tip: 'Provide accurate location for faster service.'
  },
  {
    title: 'Payment',
    description: 'Pay the provider directly through our mobile money or momopay number after service completion using Mobile Money or Cash.',
    icon: '💳',
    tip: 'Payment is made directly to the provider - no online payment required.'
  },
  {
    title: 'Track Your Request',
    description: 'Monitor your request status in your dashboard: Pending → Assigned → In Progress → Completed → Confirmed.',
    icon: '📊',
    tip: 'Confirm completion only after provider finishes the work.'
  },
  {
    title: '24/7 Support',
    description: 'Need help? Contact us via WhatsApp at the number shown on the payment banner.',
    icon: '🛠️',
    tip: 'Check your messages for provider updates.'
  }
]

// Updated Provider Tour Steps (No wallet/earnings mentions)
export const providerTourSteps = [
  {
    title: 'Welcome Provider!',
    description: 'This is your provider dashboard. Find available jobs, manage assignments, and track completed jobs.',
    icon: '👋',
    tip: 'Complete your profile to get verified faster.'
  },
  {
    title: 'Available Jobs',
    description: 'Browse jobs ready for providers. Each job shows customer details and location.',
    icon: '🔍',
    tip: 'Claim jobs that match your expertise and location.'
  },
  {
    title: 'Claim a Job',
    description: 'Click "Claim Job" to accept a service request. The customer will be notified.',
    icon: '✅',
    tip: 'Contact the customer immediately after claiming.'
  },
  {
    title: 'Manage Your Jobs',
    description: 'In "My Jobs", update job status: Start Job → Mark Complete.',
    icon: '📋',
    tip: 'Always mark completion only after finishing the work.'
  },
  {
    title: 'Payment',
    description: 'Customers will pay you directly after service completion. No online payment processing.',
    icon: '💰',
    tip: 'Collect payment directly from the customer when job is done.'
  }
]

// Updated Admin Tour Steps (No wallet, no online mode, no referrals)
export const adminTourSteps = [
  {
    title: 'Admin Control Center',
    description: 'Welcome to the Admin Dashboard. Control services, users, and service requests.',
    icon: '👑',
    tip: 'Use the sidebar to navigate between sections.'
  },
  {
    title: 'Service Management',
    description: 'Add, edit, or activate/deactivate services.',
    icon: '🔧',
    tip: 'Activate services to make them available to customers.'
  },
  {
    title: 'User Management',
    description: 'View all users, verify providers, suspend accounts, or delete users.',
    icon: '👥',
    tip: 'Always verify providers before they can claim jobs.'
  },
  {
    title: 'Assign Providers',
    description: 'Review customer requests and assign verified providers. Both parties are notified.',
    icon: '📌',
    tip: 'Only verified providers can be assigned.'
  },
  {
    title: 'Track Jobs',
    description: 'Monitor all active jobs and their status.',
    icon: '📋',
    tip: 'Use this tab to monitor ongoing jobs.'
  },
  {
    title: 'Payment Settings',
    description: 'Update payment information displayed to customers (Mobile Money numbers, support contacts).',
    icon: '⚙️',
    tip: 'Keep payment information up to date for customers.'
  }
]

// Tour Button Component
export const TourButton = ({ tourSteps, title = "Guided Tour", autoShow = false }) => {
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    if (autoShow) {
      setTourOpen(true)
    }
  }, [autoShow])

  const handleStartTour = () => {
    setTourOpen(true)
  }

  const handleCloseTour = () => {
    setTourOpen(false)
    localStorage.setItem('zivre_tour_seen', 'true')
  }

  return (
    <>
      <Tooltip title="Start Guided Tour">
        <IconButton 
          onClick={handleStartTour}
          sx={{ 
            bgcolor: '#10b981', 
            color: 'white',
            '&:hover': { bgcolor: '#059669' },
            position: 'fixed',
            bottom: 20,
            right: 100,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <PlayIcon />
        </IconButton>
      </Tooltip>
      
      <DemoTour 
        open={tourOpen} 
        onClose={handleCloseTour} 
        steps={tourSteps}
        title={title}
      />
    </>
  )
}

export default DemoTour