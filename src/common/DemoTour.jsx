import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogContent, DialogActions,
  Button, Box, Typography, Step, StepLabel, Stepper,
  IconButton
} from '@mui/material'
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  School as SchoolIcon
} from '@mui/icons-material'

const DemoTour = ({ open, onClose, onComplete, steps, title = "Guided Tour" }) => {
  const [activeStep, setActiveStep] = useState(0)
  const isLastStep = activeStep === steps.length - 1

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setActiveStep(0)
    }
  }, [open])

  const handleNext = () => {
    if (isLastStep) {
      // User COMPLETED the tour
      if (onComplete) onComplete()
      onClose()
      setActiveStep(0)
    } else {
      setActiveStep(activeStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep(activeStep - 1)
  }

  const handleSkip = () => {
    // Skip does NOT mark as completed
    setActiveStep(0)
    onClose()
  }

  const currentStep = steps[activeStep]

  return (
    <Dialog 
      open={open} 
      onClose={handleSkip}
      maxWidth="sm" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <Box sx={{ bgcolor: '#10b981', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon />
          <Typography variant="h6" fontWeight="600">{title}</Typography>
        </Box>
        <IconButton onClick={handleSkip} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, minHeight: 320 }}>
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, overflowX: 'auto' }}>
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
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
        <Button onClick={handleSkip} sx={{ color: '#64748b' }}>
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
          endIcon={isLastStep ? null : <NextIcon />}
          sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
        >
          {isLastStep ? 'Complete Tour' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ============================================
// HOMEPAGE TOUR (6 steps)
// ============================================
export const homepageTourSteps = [
  {
    title: 'Welcome to Zivre!',
    description: 'Zivre Facility Services provides professional facility management solutions across Ghana. From HVAC to Security, we handle it all.',
    icon: '👋',
    tip: 'Click "Get Started" to create your free account today!'
  },
  {
    title: 'Browse Our Services',
    description: 'We offer 13+ professional services including HVAC, Electrical, Plumbing, Security, Cleaning, Fire Safety, Waste Management, Healthcare, and Hospitality.',
    icon: '🔧',
    tip: 'Click "View All Services" to see our complete service catalog.'
  },
  {
    title: 'Request a Free Quote',
    description: 'Fill out the contact form with your name, phone, email, service type, location, and message. Our team will respond within 24 hours.',
    icon: '📝',
    tip: 'Scroll down to the contact section to request a free quote.'
  },
  {
    title: 'How It Works',
    description: '1. Sign up as a Customer or Provider.\n2. Customers request services.\n3. Admin assigns a verified provider.\n4. Provider completes the job.\n5. Customer pays provider directly after service.',
    icon: '📊',
    tip: '⚠️ IMPORTANT: Never pay before service is complete! Pay directly to the provider after they finish.'
  },
  {
    title: 'For Service Providers',
    description: 'Are you a professional? Sign up as a Provider, get verified by admin, and start getting assigned to jobs in your area.',
    icon: '🔨',
    tip: 'Providers earn directly from customers. No online payment processing fees.'
  },
  {
    title: '24/7 Support',
    description: 'Need help? Contact us via WhatsApp, phone, or email. Our support team is available 24/7 to assist you.',
    icon: '🛠️',
    tip: 'Check the green payment banner at the top for our WhatsApp number.'
  }
]

// ============================================
// CUSTOMER TOUR (12 steps)
// ============================================
export const customerTourSteps = [
  {
    title: 'Welcome to Your Customer Dashboard!',
    description: 'This is your command center. From here, you can request services, track your requests, and manage your account.',
    icon: '👋',
    tip: 'Use the sidebar menu on the left to navigate between different sections.'
  },
  {
    title: 'Dashboard Overview',
    description: 'See your total spending, active requests, and completed jobs at a glance. You can also view how payments are distributed.',
    icon: '📊',
    tip: 'Active requests show services that are currently being processed or in progress.'
  },
  {
    title: 'Available Services',
    description: 'Click on "Available Services" in the sidebar. Browse all active facility services, see prices, and read descriptions.',
    icon: '🔧',
    tip: 'Only active services are shown. Inactive services are temporarily unavailable.'
  },
  {
    title: 'Request a Service',
    description: 'Click on any service card, then click "Request Service". Fill in your phone number and location details (address, city, region).',
    icon: '📝',
    tip: 'Double-check your phone number - providers will call you on this number!'
  },
  {
    title: 'My Requests',
    description: 'Click "My Requests" in the sidebar to see all your service requests. Each request shows status, amount, and assigned provider.',
    icon: '📋',
    tip: 'Request statuses: Pending → Assigned → In Progress → Completed → Confirmed'
  },
  {
    title: 'Track Request Status',
    description: 'Monitor your request as it progresses. You will receive notifications when status changes.',
    icon: '📍',
    tip: 'When provider is assigned, their name and phone number will appear.'
  },
  {
    title: 'Cancel Request',
    description: 'If you change your mind, you can cancel a request while it is in "Pending Approval" or "Assigned" status.',
    icon: '❌',
    tip: 'Cancelled requests cannot be restored. You will need to create a new request.'
  },
  {
    title: 'Confirm Completion & Pay',
    description: 'When provider marks job complete, click "Confirm Completion" to verify. Then pay the provider directly via Mobile Money or Cash.',
    icon: '💰',
    tip: '⚠️ NEVER pay before service is complete! Pay only after you confirm completion.'
  },
  {
    title: 'Rate Your Provider',
    description: 'After confirming completion, you can rate your provider from 1 to 5 stars. Your feedback helps other customers.',
    icon: '⭐',
    tip: 'Honest ratings help maintain quality service standards.'
  },
  {
    title: 'Messages',
    description: 'Click "Messages" in the sidebar to communicate with your assigned provider or admin. Send text, images, and files.',
    icon: '💬',
    tip: 'Check your messages regularly for updates from your provider.'
  },
  {
    title: 'Referral Program',
    description: 'Go to "Referrals" tab to see your unique referral code and link. Share with friends. When they complete their first service, you earn commissions!',
    icon: '💰',
    tip: 'Minimum withdrawal is GHS 20. Request payout when you reach the threshold.'
  },
  {
    title: 'Profile Settings',
    description: 'Click "Profile Settings" to update your personal information, change your password, or delete your account.',
    icon: '⚙️',
    tip: 'Keep your contact information up to date for smooth communication.'
  }
]

// ============================================
// PROVIDER TOUR (10 steps)
// ============================================
export const providerTourSteps = [
  {
    title: 'Welcome to Your Provider Dashboard!',
    description: 'This is your workspace. View jobs assigned to you, update status, and track your earnings.',
    icon: '👋',
    tip: 'Complete your profile and get verified by admin to start receiving job assignments.'
  },
  {
    title: 'Available Jobs',
    description: 'When admin assigns you to a job, it appears in "Available Jobs" tab. Only jobs matching your specialization appear here.',
    icon: '🔍',
    tip: 'Check this tab regularly for new assignments.'
  },
  {
    title: 'Claim a Job',
    description: 'Click "Claim Job" to accept an assignment. Once claimed, the job moves to "My Jobs" tab and customer is notified.',
    icon: '✅',
    tip: 'Contact the customer immediately after claiming to confirm your arrival time.'
  },
  {
    title: 'My Jobs',
    description: 'View all your active and completed jobs here. Each job shows customer details, location, and amount.',
    icon: '📋',
    tip: 'Click on any job to see full details.'
  },
  {
    title: 'Update Job Status',
    description: 'Click "Start Job" when you begin working. Click "Mark Complete" when you finish. The customer must then confirm.',
    icon: '🔄',
    tip: 'Always update status so customers know your progress.'
  },
  {
    title: 'Decline a Job',
    description: 'If you cannot complete a job, click "Decline Job" and provide a reason. Admin will reassign it to another provider.',
    icon: '❌',
    tip: 'Only decline if absolutely necessary - it affects your reliability rating.'
  },
  {
    title: 'Getting Paid',
    description: 'After you mark complete, customer confirms and pays you DIRECTLY via Mobile Money or Cash. Collect payment when job is done.',
    icon: '💰',
    tip: '⚠️ You are paid directly by the customer. No online payment processing.'
  },
  {
    title: 'Earnings Overview',
    description: 'Click "Earnings Overview" to see your total earnings, rating, and job history. You earn a percentage of each job (set by admin).',
    icon: '📊',
    tip: 'Higher ratings lead to more job assignments!'
  },
  {
    title: 'Messages',
    description: 'Use Messages to communicate with customers assigned to you. Keep them updated on your arrival and progress.',
    icon: '💬',
    tip: 'Good communication leads to better ratings and more jobs!'
  },
  {
    title: 'Profile Settings',
    description: 'Update your personal information, change your password, or manage your account.',
    icon: '⚙️',
    tip: 'Keep your phone number updated - customers need to reach you!'
  }
]

// ============================================
// ADMIN TOUR (14 steps)
// ============================================
export const adminTourSteps = [
  {
    title: 'Welcome to Admin Control Center!',
    description: 'This is your complete management dashboard. Control services, users, requests, referrals, and system settings.',
    icon: '👑',
    tip: 'Use the sidebar to navigate between different management sections.'
  },
  {
    title: 'Dashboard Overview',
    description: 'View key metrics: Total Users, Total Revenue, Admin Fees, Site Fees, Provider Payouts, Pending Approvals, Active Services, and Comments.',
    icon: '📊',
    tip: 'Pending Approval shows requests waiting for provider assignment.'
  },
  {
    title: 'Service Management',
    description: 'Add, edit, or deactivate services. Set service prices. When you change global percentages, all service payouts update automatically.',
    icon: '🔧',
    tip: 'Only active services are visible to customers.'
  },
  {
    title: 'Percentage Settings (IMPORTANT)',
    description: 'Set 4 percentages: Provider %, Admin %, Site Fee %, and Referral Pool %. Total MUST equal 100%. Changing these automatically recalculates ALL services.',
    icon: '📊',
    tip: 'Example: Provider 50%, Admin 20%, Site 10%, Referral Pool 20% = 100%'
  },
  {
    title: 'User Management',
    description: 'View all users, filter by role (customer/provider), verify providers, suspend accounts, or delete users.',
    icon: '👥',
    tip: 'Click "View Full Details" to see user history and service requests.'
  },
  {
    title: 'Verify Providers',
    description: 'Providers must be verified before they can be assigned to jobs. Click the verify icon next to any unverified provider.',
    icon: '✅',
    tip: 'Only verify providers after confirming their credentials.'
  },
  {
    title: 'Quote Requests',
    description: 'View and manage quote requests from the homepage contact form. Update status: Pending → Contacted → Closed.',
    icon: '📝',
    tip: 'Respond to quote requests promptly to convert leads to customers.'
  },
  {
    title: 'Assign Providers',
    description: 'Match customer requests with verified providers. Select a provider from the dropdown and click "Assign Provider". Both parties are notified.',
    icon: '📌',
    tip: 'Only providers with matching specialization appear in the dropdown.'
  },
  {
    title: 'Assigned Jobs',
    description: 'Monitor all jobs currently in progress. You can notify customers if a provider is delayed using the "Notify Customer" button.',
    icon: '🔨',
    tip: 'Keep track of active jobs to ensure timely completion.'
  },
  {
    title: 'Comments Moderation',
    description: 'Approve, hide, or delete user comments and reviews. Keep the community clean and professional.',
    icon: '💬',
    tip: 'Approve genuine reviews quickly to build trust.'
  },
  {
    title: 'Referral System',
    description: 'Manage withdrawal requests, view pending bookings, see service shares (read-only from Percentage Settings), and view user referral trees.',
    icon: '💰',
    tip: 'Withdrawals must be marked as sent only after you actually send the money.'
  },
  {
    title: 'Pending Withdrawals',
    description: 'Review withdrawal requests from users. Verify details, then click "Mark as Sent" after you send the money. User will confirm receipt.',
    icon: '💸',
    tip: 'Always verify account details before sending money.'
  },
  {
    title: 'Payment Settings',
    description: 'Update the payment numbers displayed on the payment banner. This includes Mobile Money numbers and WhatsApp support.',
    icon: '⚙️',
    tip: 'Keep these numbers updated - customers use them to pay providers.'
  },
  {
    title: 'All Requests History',
    description: 'View complete history of all service requests. You can reject pending requests or permanently delete any request.',
    icon: '📜',
    tip: 'Deleting a request is permanent - use with caution.'
  }
]

// ============================================
// TOUR BUTTON COMPONENT (Manual start button)
// ============================================
export const TourButton = ({ tourSteps, title = "Guided Tour" }) => {
  const [tourOpen, setTourOpen] = useState(false)

  const handleStartTour = () => {
    setTourOpen(true)
  }

  const handleCloseTour = () => {
    setTourOpen(false)
  }

  const handleCompleteTour = () => {
    setTourOpen(false)
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<SchoolIcon />}
        onClick={handleStartTour}
        sx={{ 
          bgcolor: '#10b981', 
          color: 'white',
          '&:hover': { bgcolor: '#059669' },
          position: 'fixed',
          bottom: { xs: 16, sm: 20 },
          right: { xs: 16, sm: 20 },
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: 8,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 0.75, sm: 1 },
          textTransform: 'none',
          fontWeight: 600,
          fontSize: { xs: '0.8rem', sm: '0.9rem' }
        }}
      >
        <SchoolIcon sx={{ mr: 1, fontSize: { xs: 18, sm: 20 } }} />
        Start Tour
      </Button>
      
      <DemoTour 
        open={tourOpen} 
        onClose={handleCloseTour}
        onComplete={handleCompleteTour}
        steps={tourSteps}
        title={title}
      />
    </>
  )
}

export default DemoTour
