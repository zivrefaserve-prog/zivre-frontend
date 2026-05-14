import React, { useState } from 'react'
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

  const handleNext = () => {
    if (isLastStep) {
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
// HOMEPAGE TOUR (no changes – still 8 steps)
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
    description: '1. Sign up as a Customer or Provider.\n2. Customers request services (fixed or custom).\n3. Admin assigns a verified provider.\n4. Provider completes the job.\n5. Customer confirms completion & pays provider directly.',
    icon: '📊',
    tip: '⚠️ IMPORTANT: Never pay before service is complete! Pay directly to the provider after they finish.'
  },
  {
    title: '💰 Referral Program – Earn Money!',
    description: 'Get your unique referral code after signing up. Share it with friends. When they complete their first service, YOU earn commissions! Referral earnings can be withdrawn to Mobile Money.',
    icon: '💰',
    tip: 'Check the "Referrals" tab in your dashboard to see your code, earnings, and referral tree.'
  },
  {
    title: '💬 Messaging System',
    description: 'Once a provider is assigned to your request, you can message them directly via the Messages tab. Get real‑time updates about your service.',
    icon: '💬',
    tip: 'A message icon now appears in the header for quick access (all logged‑in users).'
  },
  {
    title: 'For Service Providers',
    description: 'Sign up as a Provider, get verified by admin, and receive job assignments. Use the bottom navigation on mobile to quickly access available jobs, my jobs, earnings, messages, and profile.',
    icon: '🔨',
    tip: 'Providers earn a percentage of each job (set by admin). Customers pay you directly after service.'
  },
  {
    title: '24/7 Support',
    description: 'Need help? Contact us via WhatsApp, phone, or email. Our support team is available 24/7 to assist you.',
    icon: '🛠️',
    tip: 'Check the green payment banner at the top for our WhatsApp number.'
  }
]

// ============================================
// CUSTOMER TOUR (14 steps – updated)
// ============================================
export const customerTourSteps = [
  {
    title: 'Welcome to Your Customer Dashboard!',
    description: 'This is your command center. From here, you can request services (fixed or custom), track requests, manage referrals, send messages, and more.',
    icon: '👋',
    tip: 'Use the sidebar on desktop or the bottom navigation on mobile to switch sections.'
  },
  {
    title: 'Dashboard Overview',
    description: 'See your total spending, active requests, and completed jobs at a glance.',
    icon: '📊',
    tip: 'Active requests are those waiting for admin approval, assignment, or completion.'
  },
  {
    title: '🔔 Notifications',
    description: 'The bell icon shows notifications. You’ll be alerted when a provider is assigned, status changes, or when you receive messages.',
    icon: '🔔',
    tip: 'Red badge indicates unread notifications. Click to view them.'
  },
  {
    title: '💬 Messages',
    description: 'The message icon in the header (or sidebar) takes you to your conversations with providers and admin.',
    icon: '💬',
    tip: 'Check messages regularly – providers may send updates about arrival times.'
  },
  {
    title: '🛒 My Active Requests (Cart)',
    description: 'Click the shopping cart icon in the header. It shows all your active requests (pending, assigned, in progress, waiting confirmation). You can cancel pending requests here.',
    icon: '🛒',
    tip: 'Once a request is confirmed, it moves out of the cart (but you can still see it in your dashboard activity).'
  },
  {
    title: 'Available Services (Fixed Price)',
    description: 'Browse all active services with fixed prices. Click on any service to request it.',
    icon: '🔧',
    tip: 'Only active services (green badge) can be requested.'
  },
  {
    title: '✨ Request Customized Service',
    description: 'Click the "Request Customized Service" button. Choose a service category, then select components and quantities. The total price updates instantly.',
    icon: '✨',
    tip: 'If you don’t see the component you need, contact support – admin can add more components.'
  },
  {
    title: '📍 Location & Phone',
    description: 'When requesting a service, fill in your location (address, city, region) and phone number. This information is saved for future requests.',
    icon: '📍',
    tip: 'Providers use this location to reach you – double‑check for accuracy.'
  },
  {
    title: '💰 Payment Information',
    description: 'The green payment banner shows how to pay. You pay the provider DIRECTLY after service completion via Mobile Money or Cash. Never pay before service is done.',
    icon: '💰',
    tip: 'Tap the banner to see full payment instructions and WhatsApp support number.'
  },
  {
    title: 'Track Request Status',
    description: 'Monitor your request as it progresses (Pending → Assigned → In Progress → Completed → Confirmed). You will receive notifications when status changes.',
    icon: '📍',
    tip: 'When a provider is assigned, their name and phone number appear.'
  },
  {
    title: 'Cancel Request',
    description: 'You can cancel a request while it is in "Pending Approval" or "Assigned" status. Use the cancel button in the cart or request details.',
    icon: '❌',
    tip: 'Cancelled requests cannot be restored – you will need to create a new request.'
  },
  {
    title: 'Confirm Completion & Pay',
    description: 'When the provider marks a job complete, click "Confirm Completion". Then pay the provider directly (cash or mobile money). After payment, the request is closed.',
    icon: '✅',
    tip: '⚠️ NEVER pay before confirming completion. Pay only after you verify the work is done.'
  },
  {
    title: 'Rate Your Provider',
    description: 'After confirming completion, you can rate your provider from 1 to 5 stars. Your feedback helps other customers.',
    icon: '⭐',
    tip: 'Honest ratings help maintain quality service standards.'
  },
  {
    title: '💰 Referral Program & Withdrawal',
    description: 'Go to "Referrals" tab to see your unique code, referral tree, commission balance, and withdrawal history. Minimum withdrawal amount is set by admin (shown in the card).',
    icon: '💰',
    tip: 'You can only withdraw when your balance reaches or exceeds the minimum threshold.'
  }
]

// ============================================
// PROVIDER TOUR (14 steps – updated)
// ============================================
export const providerTourSteps = [
  {
    title: 'Welcome to Your Provider Dashboard!',
    description: 'View jobs assigned to you, update status, track earnings, and message customers. Use the bottom navigation on mobile for quick access.',
    icon: '👋',
    tip: 'You must be verified by admin before you can receive job assignments.'
  },
  {
    title: 'Verification Status',
    description: 'Your profile card shows whether you are verified or pending. Admin must verify you first.',
    icon: '✅',
    tip: 'Complete your profile to help admin verify you faster.'
  },
  {
    title: '🔔 Notifications',
    description: 'The bell icon shows notifications about new job assignments, status updates, and messages.',
    icon: '🔔',
    tip: 'Check notifications regularly so you don\'t miss job assignments.'
  },
  {
    title: 'Your Specialization',
    description: 'Your profile shows your service specialization (e.g., HVAC, Electrical). You will only receive jobs matching your specialization.',
    icon: '🔧',
    tip: 'Contact admin if your specialization needs to be updated.'
  },
  {
    title: 'Available Jobs',
    description: 'When admin assigns you to a job, it appears in the "Available Jobs" tab. Only jobs matching your specialization appear here.',
    icon: '🔍',
    tip: 'Check this tab regularly for new assignments.'
  },
  {
    title: 'Claim a Job',
    description: 'Click "Claim Job" to accept an assignment. Once claimed, the job moves to "My Jobs" tab and the customer is notified.',
    icon: '✅',
    tip: 'Contact the customer immediately after claiming to confirm your arrival time.'
  },
  {
    title: 'My Jobs',
    description: 'View all your active and completed jobs. Each job shows customer details, location, amount, and your expected earnings.',
    icon: '📋',
    tip: 'Click on any job to see full details, including custom components if the customer requested a custom service.'
  },
  {
    title: 'Update Job Status',
    description: 'Click "Start Job" when you begin working. Click "Mark Complete" when you finish. The customer must then confirm and pay you.',
    icon: '🔄',
    tip: 'Always update status so customers know your progress.'
  },
  {
    title: 'Decline a Job',
    description: 'If you cannot complete a job, click "Decline Job" and provide a reason. The job will be reassigned to another provider.',
    icon: '❌',
    tip: 'Only decline if absolutely necessary – it affects your reliability rating.'
  },
  {
    title: '💬 Messages',
    description: 'Use Messages to communicate with customers assigned to you. Keep them updated on your arrival and progress. You can also message admin.',
    icon: '💬',
    tip: 'Good communication leads to better ratings and more job assignments!'
  },
  {
    title: 'Getting Paid',
    description: 'After you mark complete and the customer confirms, you receive payment DIRECTLY from the customer (cash or mobile money).',
    icon: '💰',
    tip: 'Your earnings are shown in the Earnings Overview tab. Discuss payment method with the customer before starting.'
  },
  {
    title: 'Earnings Overview',
    description: 'See your total earnings, rating, job history, and the commission rate (set by admin). Higher ratings lead to more assignments.',
    icon: '📊',
    tip: 'Complete jobs on time and communicate well to get 5‑star ratings.'
  },
  {
    title: 'Withdrawal & Commissions',
    description: 'Your earnings are not held by the platform – you are paid directly. The Earnings Overview shows your history and the percentage you keep.',
    icon: '💰',
    tip: 'If you have any issues with payment, contact support immediately.'
  },
  {
    title: 'Profile Settings',
    description: 'Update your personal information, change your password, or delete your account.',
    icon: '⚙️',
    tip: 'Keep your phone number updated – customers need to reach you!'
  }
]

// ============================================
// ADMIN TOUR (19 steps – updated)
// ============================================
export const adminTourSteps = [
  {
    title: 'Welcome to Admin Control Center!',
    description: 'Complete management dashboard for services, users, requests, referrals, messages, and system settings.',
    icon: '👑',
    tip: 'Use the sidebar to navigate between sections.'
  },
  {
    title: 'Dashboard Overview',
    description: 'Key metrics: Total Users, Revenue, Admin Fees, Site Fees, Provider Payouts, Pending Approvals, Active Services, Comments.',
    icon: '📊',
    tip: 'The pending approval count shows requests waiting for provider assignment.'
  },
  {
    title: '🔔 Notifications',
    description: 'System notifications about new requests, assignments, withdrawals, and more.',
    icon: '🔔',
    tip: 'Red badge indicates unread notifications.'
  },
  {
    title: '💬 Messages',
    description: 'Message any user (customers, providers). Useful for dispute resolution or support.',
    icon: '💬',
    tip: 'Messages are real‑time; use them to resolve issues quickly.'
  },
  {
    title: 'Service Management',
    description: 'Add, edit, or deactivate services. Prices and percentages are automatically updated when you change global settings.',
    icon: '🔧',
    tip: 'Only active services are visible to customers.'
  },
  {
    title: 'Service Components (New)',
    description: 'Under “Service Components” tab, you can add components to each service (e.g., Electrical → “Replace bulb”). Customers can then build custom requests.',
    icon: '🧩',
    tip: 'Components allow dynamic pricing – customers choose quantities and get a total price.'
  },
  {
    title: 'Percentage Settings',
    description: 'Set provider %, admin %, site fee %, and referral pool %. Total must be 100%. Changing these recalculates all service payouts.',
    icon: '📊',
    tip: 'Example: Provider 50%, Admin 20%, Site 10%, Referral Pool 20% = 100%'
  },
  {
    title: 'User Management',
    description: 'View all users, filter by role, verify providers, suspend or delete accounts. Click “View Full Details” for more info.',
    icon: '👥',
    tip: 'Providers must be verified before they can claim jobs.'
  },
  {
    title: 'Verify Providers',
    description: 'Click the verify icon next to an unverified provider. They will be notified and can start accepting jobs.',
    icon: '✅',
    tip: 'Only verify after confirming their credentials.'
  },
  {
    title: 'Quote Requests',
    description: 'Quote requests from the homepage contact form. Update status: Pending → Contacted → Closed.',
    icon: '📝',
    tip: 'Respond quickly to convert leads to customers.'
  },
  {
    title: 'Assign Providers',
    description: 'Match customer requests (both fixed and custom) with verified providers. Only providers with matching specialization appear.',
    icon: '📌',
    tip: 'You can see the components requested in custom service requests before assigning.'
  },
  {
    title: 'Assigned Jobs',
    description: 'Monitor jobs in progress. Use “Notify Customer” if a provider is delayed.',
    icon: '🔨',
    tip: 'Keep track of active jobs to ensure timely completion.'
  },
  {
    title: 'Comments Moderation',
    description: 'Approve, hide, or delete user comments and reviews. Keep the community clean.',
    icon: '💬',
    tip: 'Approve genuine reviews quickly to build trust.'
  },
  {
    title: 'Payment Settings',
    description: 'Update payment numbers displayed on the payment banner (Mobile Money, MoMoPay, WhatsApp support).',
    icon: '⚙️',
    tip: 'Also here you can set the minimum withdrawal amount for referral earnings.'
  },
  {
    title: 'Withdrawal Threshold',
    description: 'Inside Payment Settings, you can change the minimum amount users must reach before requesting a withdrawal (default 20 GHS).',
    icon: '💰',
    tip: 'Users see this threshold in their referral dashboard and cannot withdraw below it.'
  },
  {
    title: 'Referral System – Pending Withdrawals',
    description: 'Go to “Referral Admin” tab. Review pending withdrawal requests, verify details, and mark as sent once you transfer the money.',
    icon: '💸',
    tip: 'Always verify account details before marking as sent.'
  },
  {
    title: 'Referral System – Pending Bookings',
    description: 'Bookings awaiting customer confirmation. When they confirm, referral commissions are automatically processed.',
    icon: '📋',
    tip: 'Commissions are calculated based on the global referral pool percentage.'
  },
  {
    title: 'Referral Tree Viewer',
    description: 'Search any user by ID to see their complete referral tree (who they invited and their balances).',
    icon: '🌳',
    tip: 'Useful for debugging or seeing top referrers.'
  },
  {
    title: 'All Requests History',
    description: 'Complete history of all service requests. You can reject pending requests or permanently delete them.',
    icon: '📜',
    tip: 'Deleting a request is permanent – use with caution.'
  }
]

// ============================================
// TOUR BUTTON COMPONENT (adjusted for bottom nav)
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
          bottom: { xs: 75, sm: 20 },
          right: { xs: 16, sm: 20 },
          zIndex: 1100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          borderRadius: 8,
          px: { xs: 1.5, sm: 2 },
          py: { xs: 0.75, sm: 1 },
          textTransform: 'none',
          fontWeight: 600,
          fontSize: { xs: '0.8rem', sm: '0.9rem' }
        }}
      >
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
