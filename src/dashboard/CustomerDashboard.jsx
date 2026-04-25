import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import RoleBasedTour from '../common/RoleBasedTour'
import {
  getServices, createRequest, getUserRequests, getNotifications, rateRequest,
  confirmRequestCompletion, getUnreadMessagesCount, getUnreadCount,
  getPercentages, cancelRequest
} from '../api/client'
import {
  Box, Drawer, Typography, IconButton, Grid, Card, CardContent,
  Button, Chip, TextField, Select, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar,
  CircularProgress, Avatar, Tooltip, InputAdornment, Badge,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Divider, LinearProgress
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, ShoppingBag as ServicesIcon,
  History as HistoryIcon, Settings as SettingsIcon,
  Refresh as RefreshIcon, Star as StarIcon, StarBorder as StarBorderIcon,
  LocationOn as LocationIcon, Message as MessageIcon, Search as SearchIcon,
  Phone as PhoneIcon, Close as CloseIcon
} from '@mui/icons-material'
import PaymentFlier from '../common/PaymentFlier'
import Header from '../layout/Header'
import { DashboardSkeleton, ServicesGridSkeleton } from '../common/LoadingSkeleton'

const drawerWidth = 280

// Helper functions for localStorage persistence
const saveCustomerState = (key, value) => {
  localStorage.setItem(`customer_${key}`, JSON.stringify(value))
}

const loadCustomerState = (key, defaultValue) => {
  const saved = localStorage.getItem(`customer_${key}`)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return defaultValue
    }
  }
  return defaultValue
}

const saveLocationData = (userId, data) => {
  localStorage.setItem(`saved_location_${userId}`, JSON.stringify(data))
}

const loadLocationData = (userId) => {
  const saved = localStorage.getItem(`saved_location_${userId}`)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return { address: '', city: '', region: '', landmark: '', customer_phone: '' }
    }
  }
  return { address: '', city: '', region: '', landmark: '', customer_phone: '' }
}

const CustomerDashboard = () => {
  const { user, updateUser } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  // Persist active tab across refresh
  const [activeTab, setActiveTab] = useState(() => loadCustomerState('activeTab', 0))
  
  const [services, setServices] = useState([])
  const [requests, setRequests] = useState([])
  const [notifications, setNotifications] = useState([])
  const [percentages, setPercentages] = useState({
    provider_percent: 60,
    admin_percent: 25,
    site_fee_percent: 15
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState(null)
  const [openRequestModal, setOpenRequestModal] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [ratingLoading, setRatingLoading] = useState(null)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [totalSpent, setTotalSpent] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Load saved location from localStorage
  const [locationData, setLocationData] = useState(() => ({
    ...loadLocationData(user?.id),
    customer_phone: user?.phone || ''
  }))

  // Save location when changed
  const handleLocationChange = (field, value) => {
    const newLocation = { ...locationData, [field]: value }
    setLocationData(newLocation)
    if (user?.id) {
      saveLocationData(user.id, newLocation)
    }
  }

  const pendingConfirmationCount = requests.filter(r => r.status === 'completed' && !r.customer_confirmed).length

  // Save active tab when changed
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    saveCustomerState('activeTab', tab)
    setSearchTerm('')
    // Close drawer on mobile when tab is selected
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  // Filtered data for search
  const filteredServices = useMemo(() => {
    if (!searchTerm.trim()) return services
    const term = searchTerm.toLowerCase().trim()
    return services.filter(s => 
      s.name.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term)
    )
  }, [services, searchTerm])

  const filteredRequests = useMemo(() => {
    if (!searchTerm.trim()) return requests
    const term = searchTerm.toLowerCase().trim()
    return requests.filter(r => 
      r.service_name.toLowerCase().includes(term) ||
      r.location_address?.toLowerCase().includes(term) ||
      r.location_city?.toLowerCase().includes(term) ||
      r.location_region?.toLowerCase().includes(term)
    )
  }, [requests, searchTerm])

  // Load percentages
  const loadPercentages = useCallback(async () => {
    try {
      const res = await getPercentages()
      setPercentages(res.data)
    } catch (err) {
      console.error('Error loading percentages:', err)
    }
  }, [])

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Main data loading function
  const loadData = useCallback(async () => {
    if (!user?.id) return
    
    setRefreshing(true)
    try {
      // Show dashboard shell immediately
      setLoading(false)
      
      // Load data in background (doesn't block UI)
      const [servicesRes, requestsRes, notifRes] = await Promise.all([
        getServices(true),
        getUserRequests(user.id),
        getNotifications(user.id)
      ])
      setServices(servicesRes.data)
      setRequests(requestsRes.data)
      setNotifications(notifRes.data)
      
      const totalSpentForUser = requestsRes.data.reduce((sum, r) => sum + r.amount, 0)
      setTotalSpent(totalSpentForUser)
    } catch (err) {
      console.error(err)
      showToast('Error loading data', 'error')
    } finally {
      setRefreshing(false)
    }
  }, [user?.id])

  // Load unread counts
  const loadUnreadCounts = useCallback(async () => {
    if (!user?.id) return
    try {
      const [msgRes, notifRes] = await Promise.all([
        getUnreadMessagesCount(user.id),
        getUnreadCount(user.id)
      ])
      setUnreadMessagesCount(msgRes.data.count)
      setUnreadNotificationsCount(notifRes.data.count)
    } catch (err) {
      console.error('Error loading unread counts:', err)
    }
  }, [user?.id])

  // ========== REALTIME EVENT HANDLERS ==========
  const handleRealtimeRefresh = useCallback(() => {
    console.log('🔄 CustomerDashboard: Realtime refresh triggered')
    loadData()
    loadUnreadCounts()
  }, [loadData, loadUnreadCounts])

  const handleRequestStatusChange = useCallback((event) => {
    console.log('📢 Request status changed:', event.detail)
    loadData()
    loadUnreadCounts()
  }, [loadData, loadUnreadCounts])

  const handleProviderAssigned = useCallback((event) => {
    console.log(' Provider assigned:', event.detail)
    loadData()
    loadUnreadCounts()
    showToast('A provider has been assigned to your request!', 'success')
  }, [loadData, loadUnreadCounts])

  const handleJobStarted = useCallback((event) => {
    console.log(' Job started:', event.detail)
    loadData()
    showToast('Your provider has started working on your request!', 'info')
  }, [loadData])

  const handleJobCompleted = useCallback((event) => {
    console.log('✅ Job completed:', event.detail)
    loadData()
    showToast('Your provider has completed the service! Please confirm completion.', 'success')
  }, [loadData])

  const handleCustomerConfirmed = useCallback((event) => {
    console.log('✓ Customer confirmed:', event.detail)
    loadData()
  }, [loadData])

  const handleNewNotification = useCallback((event) => {
    console.log('🔔 New notification:', event.detail)
    loadUnreadCounts()
    if (event.detail.type === 'success' || event.detail.type === 'job') {
      showToast(event.detail.message, event.detail.type)
    }
  }, [loadUnreadCounts])

  const handleMessageReceived = useCallback(() => {
    console.log('💬 New message received')
    loadUnreadCounts()
  }, [loadUnreadCounts])

  const handlePercentagesUpdated = useCallback((event) => {
    console.log('📊 Percentages updated:', event.detail)
    setPercentages(event.detail)
    loadData()
  }, [loadData])

  // Set up all realtime event listeners
  useEffect(() => {
    window.addEventListener('service_created', handleRealtimeRefresh)
    window.addEventListener('service_updated', handleRealtimeRefresh)
    window.addEventListener('service_toggled', handleRealtimeRefresh)
    window.addEventListener('request_created', handleRealtimeRefresh)
    window.addEventListener('request_status_changed', handleRequestStatusChange)
    window.addEventListener('provider_assigned', handleProviderAssigned)
    window.addEventListener('job_started', handleJobStarted)
    window.addEventListener('job_completed', handleJobCompleted)
    window.addEventListener('customer_confirmed', handleCustomerConfirmed)
    window.addEventListener('new_notification', handleNewNotification)
    window.addEventListener('new_message_received', handleMessageReceived)
    window.addEventListener('message_delivered', handleMessageReceived)
    window.addEventListener('percentages_updated', handlePercentagesUpdated)

    return () => {
      window.removeEventListener('service_created', handleRealtimeRefresh)
      window.removeEventListener('service_updated', handleRealtimeRefresh)
      window.removeEventListener('service_toggled', handleRealtimeRefresh)
      window.removeEventListener('request_created', handleRealtimeRefresh)
      window.removeEventListener('request_status_changed', handleRequestStatusChange)
      window.removeEventListener('provider_assigned', handleProviderAssigned)
      window.removeEventListener('job_started', handleJobStarted)
      window.removeEventListener('job_completed', handleJobCompleted)
      window.removeEventListener('customer_confirmed', handleCustomerConfirmed)
      window.removeEventListener('new_notification', handleNewNotification)
      window.removeEventListener('new_message_received', handleMessageReceived)
      window.removeEventListener('message_delivered', handleMessageReceived)
      window.removeEventListener('percentages_updated', handlePercentagesUpdated)
    }
  }, [handleRealtimeRefresh, handleRequestStatusChange, handleProviderAssigned, handleJobStarted, handleJobCompleted, handleCustomerConfirmed, handleNewNotification, handleMessageReceived, handlePercentagesUpdated])

  // Fallback polling interval (15 seconds)
// Fallback polling interval (5 seconds for faster updates)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadData()
        loadUnreadCounts()
      }
    }, 5000)  // Changed from 15000 to 5000
    return () => clearInterval(interval)
  }, [loadData, loadUnreadCounts])

  // Initial load
  useEffect(() => {
    if (!user?.id) {
      window.location.href = '/'
      return
    }
    
    loadData()
    loadUnreadCounts()
    loadPercentages()
  }, [user?.id, loadData, loadUnreadCounts, loadPercentages])

  const handleRequest = async () => {
    if (!locationData.address || !locationData.city || !locationData.region) {
      showToast('Please fill in your location details (Address, City, and Region)', 'error')
      return
    }
    if (!locationData.customer_phone) {
      showToast('Please enter your phone number', 'error')
      return
    }
    setActionLoading(true)
    try {
      await createRequest({
        user_id: user.id,
        service_id: selectedService.id,
        location_address: locationData.address,
        location_city: locationData.city,
        location_region: locationData.region,
        location_landmark: locationData.landmark,
        customer_phone: locationData.customer_phone
      })
      showToast(' Request submitted successfully! Admin will review and assign a provider. You will pay the provider directly after service completion.', 'success')
      setOpenRequestModal(false)
      setSelectedService(null)
      await loadData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Error submitting request', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRateRequest = async (requestId, rating) => {
    setRatingLoading(requestId)
    try {
      await rateRequest(requestId, rating)
      showToast('⭐ Thank you for your rating!')
      await loadData()
    } catch (err) {
      showToast('Error submitting rating', 'error')
    } finally {
      setRatingLoading(null)
    }
  }


const handleCancelRequest = async (requestId) => {
  if (!window.confirm('Are you sure you want to cancel this request? This cannot be undone.')) return
  
  setActionLoading(requestId)
  try {
    await cancelRequest(requestId)
    showToast('Request cancelled successfully', 'success')
    await loadData()
  } catch (err) {
    showToast(err.response?.data?.error || 'Error cancelling request', 'error')
  } finally {
    setActionLoading(null)
  }
}
  
  const handleConfirmCompletion = async (requestId) => {
    setActionLoading(true)
    try {
      await confirmRequestCompletion(requestId)
      showToast('✅ Completion confirmed! Thank you for using Zivre!', 'success')
      await loadData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Error confirming completion', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusChip = (status) => {
    const config = {
      pending_approval: { label: ' Pending Approval', color: '#f59e0b', bg: '#fef3c7' },
      assigned: { label: ' Provider Assigned', color: '#8b5cf6', bg: '#ede9fe' },
      in_progress: { label: ' In Progress', color: '#ec4898', bg: '#fce7f3' },
      completed: { label: '✅ Completed - Awaiting Confirmation', color: '#f59e0b', bg: '#fef3c7' },
      confirmed: { label: '✓ Confirmed - Pay Provider', color: '#10b981', bg: '#d1fae5' }
    }
    const c = config[status] || { label: status, color: '#64748b', bg: '#f1f5f9' }
    return <Chip label={c.label} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 500 }} />
  }

  const menuItems = [
    { label: ' Overview', icon: <DashboardIcon />, tab: 0, badge: 0 },
    { label: ' Available Services', icon: <ServicesIcon />, tab: 1, badge: 0 },
    { label: ' My Requests', icon: <HistoryIcon />, tab: 2, badge: pendingConfirmationCount },
    { label: ' Messages', icon: <MessageIcon />, tab: 3, badge: unreadMessagesCount, action: () => window.location.href = '/messages' },
    { label: ' Profile Settings', icon: <SettingsIcon />, tab: 4, badge: 0 },
  ]

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'white' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: '#10b981', width: 40, height: 40 }}>{user?.full_name?.charAt(0).toUpperCase()}</Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight="600">{user?.full_name}</Typography>
            <Typography variant="caption" color="text.secondary">Customer</Typography>
          </Box>
        </Box>
        {isMobile && (
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#64748b' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <Box sx={{ p: 2 }}>
        {menuItems.map((item) => (
          <Button
            key={item.tab}
            startIcon={item.icon}
            onClick={() => {
              if (item.action) {
                item.action()
              } else {
                handleTabChange(item.tab)
              }
              setMobileOpen(false)
            }}
            fullWidth
            sx={{
              justifyContent: 'flex-start', mb: 0.5, py: 1.5, px: 2, borderRadius: 2,
              bgcolor: activeTab === item.tab ? '#e6f7f0' : 'transparent',
              color: activeTab === item.tab ? '#10b981' : '#64748b',
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            {item.label}
            {item.badge > 0 && (
              <Badge badgeContent={item.badge} color="error" sx={{ ml: 'auto' }} />
            )}
          </Button>
        ))}
      </Box>
    </Box>
  )

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <>
        <Header onGetQuote={scrollToContact} hideNavLinks={true} />
        <DashboardSkeleton />
      </>
    )
  }

  const activeRequestsCount = requests.filter(r => r.status !== 'confirmed').length
  const completedCount = requests.filter(r => r.status === 'confirmed').length

  return (
    <>
      <Header onGetQuote={scrollToContact} hideNavLinks={true} />
      
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
        <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={toast?.type} sx={{ borderRadius: 2 }}>{toast?.message}</Alert>
        </Snackbar>

        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}>
            {drawer}
          </Drawer>
          <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid #e2e8f0', bgcolor: 'white' } }}>
            {drawer}
          </Drawer>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, width: { md: `calc(100% - ${drawerWidth}px)` } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isMobile && (
                <IconButton 
                  onClick={() => setMobileOpen(true)}
                  sx={{ 
                    bgcolor: '#10b981', 
                    color: 'white',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a' }}>Customer Dashboard</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(activeTab === 1 || activeTab === 2) && (
                <TextField
                  size="small"
                  placeholder={activeTab === 1 ? "Search services..." : "Search requests by service or location..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: '#94a3b8' }} /> } }}
                  sx={{ width: isMobile ? 200 : 280, bgcolor: 'white', borderRadius: 2 }}
                />
              )}
              <IconButton onClick={loadData} disabled={refreshing} sx={{ bgcolor: 'white' }}>
                {refreshing ? <CircularProgress size={24} sx={{ color: '#10b981' }} /> : <RefreshIcon />}
              </IconButton>
            </Box>
          </Box>

          <Card sx={{ p: 3, mb: 4, bgcolor: '#10b981', color: 'white', borderRadius: 3 }}>
            <Typography variant="h5" fontWeight="700">👋 Welcome back, {user?.full_name}!</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>Track your services and manage your account</Typography>
            <Alert severity="info" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
               You will pay the provider directly after service completion. No online payment required.
            </Alert>
          </Card>

          <PaymentFlier />

          {activeTab === 0 && (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">💰 Total Spent</Typography>
                    <Typography variant="h4" fontWeight="800" sx={{ color: '#10b981' }}>GH₵{totalSpent.toFixed(2)}</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">🔄 Active Requests</Typography>
                    <Typography variant="h4" fontWeight="800">{activeRequestsCount}</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">✅ Completed Jobs</Typography>
                    <Typography variant="h4" fontWeight="800">{completedCount}</Typography>
                  </Card>
                </Grid>
              </Grid>

              <Card sx={{ p: 3, mb: 3, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1, color: '#0f172a' }}>💰 How Payments Work</Typography>
                <Typography variant="body2" color="text.secondary">
                  When you pay for a service, the amount is distributed as follows:
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="body2" sx={{ width: 120 }}>Provider gets:</Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={percentages.provider_percent} 
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="600" sx={{ color: '#10b981' }}>{percentages.provider_percent}%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="body2" sx={{ width: 120 }}>Admin fee:</Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={percentages.admin_percent} 
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#8b5cf6' } }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="600" sx={{ color: '#8b5cf6' }}>{percentages.admin_percent}%</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ width: 120 }}>Site fee:</Typography>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={percentages.site_fee_percent} 
                        sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' } }}
                      />
                    </Box>
                    <Typography variant="body2" fontWeight="600" sx={{ color: '#f59e0b' }}>{percentages.site_fee_percent}%</Typography>
                  </Box>
                </Box>
              </Card>

              <Card sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#0f172a' }}>Recent Activity</Typography>
                <Divider sx={{ mb: 2 }} />
                {requests.slice(0, 5).map((req, idx) => (
                  <Box key={req.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: idx < 4 ? '1px solid #e2e8f0' : 'none' }}>
                    <Box>
                      <Typography variant="body2"><strong>{req.service_name}</strong></Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(req.created_at).toLocaleDateString()}</Typography>
                    </Box>
                    {getStatusChip(req.status)}
                  </Box>
                ))}
                {requests.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No recent activity</Typography>}
              </Card>
            </>
          )}

          {activeTab === 1 && (
            loading ? (
              <ServicesGridSkeleton />
            ) : (
              <>
                {filteredServices.length === 0 && searchTerm && (
                  <Alert severity="info" sx={{ mb: 2 }}>No services matching "{searchTerm}"</Alert>
                )}
                <Grid container spacing={3}>
                  {filteredServices.map(service => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={service.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Typography variant="h3">{service.icon}</Typography>
                            <Typography variant="h6" fontWeight="700">{service.name}</Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{service.description}</Typography>
                          <Typography variant="h5" fontWeight="700" sx={{ color: '#10b981' }}>GH₵{service.total_price}</Typography>
                        </CardContent>
                        <Box sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => { setSelectedService(service); setOpenRequestModal(true) }}
                            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                          >
                             Request Service
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                {filteredServices.length === 0 && !searchTerm && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No active services available at the moment.</Typography>
                )}
              </>
            )
          )}

          {activeTab === 2 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}> My Service Requests</Typography>
              {filteredRequests.length === 0 && searchTerm && (
                <Alert severity="info" sx={{ mb: 2 }}>No requests matching "{searchTerm}"</Alert>
              )}
              <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                <Table sx={{ minWidth: 600 }}>
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRequests.map((req) => (
                      <TableRow key={req.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell><Typography fontWeight="500">{req.service_name}</Typography></TableCell>
                        <TableCell>
                          <Typography fontWeight="600" sx={{ color: '#10b981' }}>GH₵{req.amount}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            (Provider: GH₵{req.provider_payout?.toFixed(2)})
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{req.location_address}</Typography>
                          <Typography variant="caption" color="text.secondary">{req.location_city}, {req.location_region}</Typography>
                        </TableCell>
                        <TableCell>{getStatusChip(req.status)}</TableCell>
                        <TableCell>
                          {req.provider_name ? (
                            <Box>
                              <Typography variant="body2">{req.provider_name}</Typography>
                              <Typography variant="caption" color="text.secondary">{req.provider_phone}</Typography>
                            </Box>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {req.status === 'completed' && !req.customer_confirmed && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleConfirmCompletion(req.id)}
                              disabled={actionLoading === true}
                              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                            >
                              {actionLoading === true ? <CircularProgress size={20} sx={{ color: 'white' }} /> : ' Confirm Completion & Pay Provider'}
                            </Button>
                          )}
                          {req.status === 'confirmed' && (
                            <Typography variant="caption" color="success.main">✓ Service complete. Please pay provider directly.</Typography>
                          )}
                          {req.status === 'assigned' && (
                            <>
                              <Typography variant="caption" color="success.main" sx={{ display: 'block' }}> Provider will contact you</Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleCancelRequest(req.id)}
                                disabled={actionLoading === req.id}
                                sx={{ mt: 1 }}
                              >
                                {actionLoading === req.id ? <CircularProgress size={20} /> : 'Cancel Request'}
                              </Button>
                            </>
                          )}
                          {req.status === 'pending_approval' && (
                            <>
                              <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}> Awaiting admin approval</Typography>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleCancelRequest(req.id)}
                                disabled={actionLoading === req.id}
                                sx={{ mt: 1 }}
                              >
                                {actionLoading === req.id ? <CircularProgress size={20} /> : 'Cancel Request'}
                              </Button>
                            </>
                          )}
                        </TableCell>

                        
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredRequests.length === 0 && !searchTerm && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No service requests yet.</Typography>
              )}
            </Card>
          )}

          {activeTab === 3 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}>💬 Messages</Typography>
              <Typography variant="body2" color="text.secondary">Click the button below to go to your messages.</Typography>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/messages'}
                sx={{ mt: 2, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
              >
                Go to Messages
              </Button>
            </Card>
          )}

          {activeTab === 4 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}> Profile Settings</Typography>
              <Typography variant="body2" color="text.secondary">Click the button below to go to your profile settings page.</Typography>
              <Button
                variant="contained"
                onClick={() => window.location.href = '/profile'}
                sx={{ mt: 2, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
              >
                Go to Profile Settings
              </Button>
            </Card>
          )}

          {/* Request Modal */}
          <Dialog open={openRequestModal} onClose={() => setOpenRequestModal(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: '90vh' } } }}>
            <DialogTitle> Request {selectedService?.name}</DialogTitle>
            <DialogContent>
              <Typography variant="h5" fontWeight="700" sx={{ color: '#10b981', my: 2 }}>GH₵{selectedService?.total_price}</Typography>
              
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                You will pay the provider directly after service completion. No online payment required.
              </Alert>
              
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>📞 Contact Information</Typography>
              <TextField
                fullWidth
                label="Your Phone Number"
                margin="normal"
                value={locationData.customer_phone}
                onChange={(e) => handleLocationChange('customer_phone', e.target.value)}
                required
                placeholder="e.g., 024XXXXXXX"
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#94a3b8' }} /></InputAdornment> } }}
              />
              
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1, mt: 2 }}>📍 Service Location</Typography>
              <TextField
                fullWidth
                label="Street Address"
                margin="normal"
                value={locationData.address}
                onChange={(e) => handleLocationChange('address', e.target.value)}
                required
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><LocationIcon sx={{ color: '#94a3b8' }} /></InputAdornment> } }}
              />
              <TextField
                fullWidth
                label="City/Town"
                margin="normal"
                value={locationData.city}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                required
              />
              <Select
                fullWidth
                displayEmpty
                value={locationData.region}
                onChange={(e) => handleLocationChange('region', e.target.value)}
                sx={{ mt: 2 }}
                required
              >
                <MenuItem value="" disabled>Select Region</MenuItem>
                {['Greater Accra', 'Ashanti', 'Western', 'Eastern', 'Central', 'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'].map(r => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </Select>
              <TextField
                fullWidth
                label="Landmark (Optional)"
                margin="normal"
                value={locationData.landmark}
                onChange={(e) => handleLocationChange('landmark', e.target.value)}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenRequestModal(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleRequest}
                disabled={actionLoading === true}
                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
              >
                {actionLoading === true ? <CircularProgress size={24} sx={{ color: 'white' }} /> : ' Submit Request'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
      <RoleBasedTour />
    </>
  )
}

export default CustomerDashboard
