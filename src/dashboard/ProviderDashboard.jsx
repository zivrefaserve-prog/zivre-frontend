import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getAvailableJobs, claimJob, getProviderJobs, updateJobStatus,
  getNotifications, providerCompleteRequest,
  getUnreadMessagesCount, getUnreadCount,
  getPercentages
} from '../api/client'
import {
  Box, Drawer, Typography, IconButton, Grid, Card, CardContent,
  Button, Chip, Alert, Snackbar, CircularProgress, Avatar,
  Tooltip, Badge, Dialog, DialogTitle, DialogContent,
  DialogActions, LinearProgress, Divider, TextField
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, Work as WorkIcon,
  History as HistoryIcon, Settings as SettingsIcon,
  Refresh as RefreshIcon, LocationOn as LocationIcon,
  Star as StarIcon, Pending as PendingIcon, Message as MessageIcon,
  Paid as PaidIcon, TrendingUp as TrendingUpIcon, Build as BuildIcon,
  Search as SearchIcon, Phone as PhoneIcon, Close as CloseIcon
} from '@mui/icons-material'
import PaymentFlier from '../common/PaymentFlier'
import Header from '../layout/Header'
import { DashboardSkeleton } from '../common/LoadingSkeleton'

const drawerWidth = 280

// Helper functions for localStorage persistence
const saveProviderState = (key, value) => {
  localStorage.setItem(`provider_${key}`, JSON.stringify(value))
}

const loadProviderState = (key, defaultValue) => {
  const saved = localStorage.getItem(`provider_${key}`)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return defaultValue
    }
  }
  return defaultValue
}

const ProviderDashboard = () => {
  const { user, updateUser } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  // Persist active tab across refresh
  const [activeTab, setActiveTab] = useState(() => loadProviderState('activeTab', 0))
  
  const [availableJobs, setAvailableJobs] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [notifications, setNotifications] = useState([])
  const [percentages, setPercentages] = useState({
    provider_percent: 60,
    admin_percent: 25,
    site_fee_percent: 15
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate total earned from completed jobs
  const totalEarned = myJobs
    .filter(job => job.status === 'confirmed')
    .reduce((sum, job) => sum + (job.provider_payout || job.amount * (percentages.provider_percent / 100)), 0)
  
  const completedJobsCount = myJobs.filter(job => job.status === 'confirmed').length
  const activeJobsCount = myJobs.filter(job => job.status === 'assigned' || job.status === 'in_progress').length

  // Filtered data for search
  const filteredAvailableJobs = useMemo(() => {
    if (!searchTerm.trim()) return availableJobs
    const term = searchTerm.toLowerCase().trim()
    return availableJobs.filter(job => 
      job.service_name?.toLowerCase().includes(term) ||
      job.customer_name?.toLowerCase().includes(term) ||
      job.location_city?.toLowerCase().includes(term) ||
      job.location_region?.toLowerCase().includes(term)
    )
  }, [availableJobs, searchTerm])

  const filteredMyJobs = useMemo(() => {
    if (!searchTerm.trim()) return myJobs
    const term = searchTerm.toLowerCase().trim()
    return myJobs.filter(job => 
      job.service_name?.toLowerCase().includes(term) ||
      job.customer_name?.toLowerCase().includes(term) ||
      job.location_city?.toLowerCase().includes(term) ||
      job.location_region?.toLowerCase().includes(term)
    )
  }, [myJobs, searchTerm])

  // Save active tab when changed
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    saveProviderState('activeTab', tab)
    setSearchTerm('')
    // Close drawer on mobile when tab is selected
    if (isMobile) {
      setMobileOpen(false)
    }
  }

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
  if (!user?.id || user?.role !== 'provider') {
    return
  }
  
  // Unverified providers - set empty arrays, NO API calls
  if (!user?.is_verified) {
    setAvailableJobs([])
    setMyJobs([])
    setNotifications([])
    setLoading(false)
    return
  }
  
  setRefreshing(true)
  try {
    const [availableRes, jobsRes, notifRes] = await Promise.all([
      getAvailableJobs(),
      getProviderJobs(user.id),
      getNotifications(user.id)
    ])
    setAvailableJobs(availableRes.data)
    setMyJobs(jobsRes.data)
    setNotifications(notifRes.data)
  } catch (err) {
    console.error(err)
    if (err.response?.status !== 403 && err.response?.status !== 401) {
      showToast('Error loading data', 'error')
    }
    setAvailableJobs([])
    setMyJobs([])
  } finally {
    setLoading(false)
    setRefreshing(false)
  }
}, [user?.id, user?.role, user?.is_verified])

  
  

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
    console.log('🔄 ProviderDashboard: Realtime refresh triggered')
    loadData()
    loadUnreadCounts()
  }, [loadData, loadUnreadCounts])

  const handleNewRequest = useCallback((event) => {
    console.log('📢 New request available:', event.detail)
    loadData()
    showToast('A new job is available! Check Available Jobs tab.', 'info')
  }, [loadData])

  const handleProviderAssigned = useCallback((event) => {
    console.log('👤 You have been assigned to a job:', event.detail)
    loadData()
    loadUnreadCounts()
    showToast('You have been assigned to a new job! Check My Jobs tab.', 'success')
  }, [loadData, loadUnreadCounts])

  const handleJobStarted = useCallback((event) => {
    console.log('🔧 Job started:', event.detail)
    loadData()
  }, [loadData])

  const handleJobCompleted = useCallback((event) => {
    console.log('✅ Job completed by provider:', event.detail)
    loadData()
  }, [loadData])

  const handleCustomerConfirmed = useCallback((event) => {
    console.log('✓ Customer confirmed completion:', event.detail)
    loadData()
    loadUnreadCounts()
    if (event.detail.provider_id === user?.id) {
      showToast('Customer confirmed completion! Payment received.', 'success')
    }
  }, [loadData, loadUnreadCounts, user?.id])

  const handleJobClaimed = useCallback((event) => {
    console.log('📌 Job claimed:', event.detail)
    if (event.detail.provider_id !== user?.id) {
      loadData()
    }
  }, [loadData, user?.id])

  const handleRequestStatusChanged = useCallback((event) => {
    console.log('📊 Request status changed:', event.detail)
    loadData()
  }, [loadData])

  const handleNewNotification = useCallback((event) => {
    console.log('🔔 New notification:', event.detail)
    loadUnreadCounts()
    if (event.detail.type === 'job' || event.detail.type === 'success') {
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
    window.addEventListener('new_request', handleNewRequest)
    window.addEventListener('request_status_changed', handleRequestStatusChanged)
    window.addEventListener('provider_assigned', handleProviderAssigned)
    window.addEventListener('job_claimed', handleJobClaimed)
    window.addEventListener('job_started', handleJobStarted)
    window.addEventListener('job_completed', handleJobCompleted)
    window.addEventListener('customer_confirmed', handleCustomerConfirmed)
    window.addEventListener('new_notification', handleNewNotification)
    window.addEventListener('new_message_received', handleMessageReceived)
    window.addEventListener('message_delivered', handleMessageReceived)
    window.addEventListener('percentages_updated', handlePercentagesUpdated)
    window.addEventListener('user_verified', handleRealtimeRefresh)

    return () => {
      window.removeEventListener('service_created', handleRealtimeRefresh)
      window.removeEventListener('service_updated', handleRealtimeRefresh)
      window.removeEventListener('service_toggled', handleRealtimeRefresh)
      window.removeEventListener('new_request', handleNewRequest)
      window.removeEventListener('request_status_changed', handleRequestStatusChanged)
      window.removeEventListener('provider_assigned', handleProviderAssigned)
      window.removeEventListener('job_claimed', handleJobClaimed)
      window.removeEventListener('job_started', handleJobStarted)
      window.removeEventListener('job_completed', handleJobCompleted)
      window.removeEventListener('customer_confirmed', handleCustomerConfirmed)
      window.removeEventListener('new_notification', handleNewNotification)
      window.removeEventListener('new_message_received', handleMessageReceived)
      window.removeEventListener('message_delivered', handleMessageReceived)
      window.removeEventListener('percentages_updated', handlePercentagesUpdated)
      window.removeEventListener('user_verified', handleRealtimeRefresh)
    }
  }, [handleRealtimeRefresh, handleNewRequest, handleRequestStatusChanged, handleProviderAssigned, handleJobClaimed, handleJobStarted, handleJobCompleted, handleCustomerConfirmed, handleNewNotification, handleMessageReceived, handlePercentagesUpdated])

  // Fallback polling interval (15 seconds)
// Fallback polling interval (15 seconds)
useEffect(() => {
  const interval = setInterval(() => {
    if (!document.hidden && user?.role === 'provider' && user?.is_verified === true) {
      loadData()
      loadUnreadCounts()
    }
  }, 15000)
  return () => clearInterval(interval)
}, [loadData, loadUnreadCounts, user?.role, user?.is_verified])

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

  const handleClaim = async (requestId) => {
    setActionLoading(requestId)
    try {
      await claimJob({ request_id: requestId, provider_id: user.id })
      showToast('✅ Job claimed successfully!')
      await loadData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Error claiming job', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkComplete = async (jobId) => {
    setActionLoading(jobId)
    try {
      await providerCompleteRequest(jobId)
      showToast('✅ Job marked as completed! Awaiting customer confirmation.', 'success')
      await loadData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Error marking complete', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateStatus = async (jobId, newStatus) => {
    setActionLoading(jobId)
    try {
      await updateJobStatus(jobId, newStatus)
      showToast(`✅ Job marked as ${newStatus}!`)
      await loadData()
    } catch (err) {
      showToast('Error updating job status', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusChip = (status) => {
    const config = {
      assigned: { label: '📋 Assigned - Awaiting Start', color: '#3b82f6', bg: '#dbeafe' },
      in_progress: { label: '🔧 In Progress', color: '#8b5cf6', bg: '#ede9fe' },
      completed: { label: '✅ Completed - Awaiting Customer', color: '#f59e0b', bg: '#fef3c7' },
      confirmed: { label: '✓ Confirmed - Payment Received', color: '#10b981', bg: '#d1fae5' }
    }
    const c = config[status] || { label: status, color: '#64748b', bg: '#f1f5f9' }
    return <Chip label={c.label} size="small" sx={{ bgcolor: c.bg, color: c.color, fontWeight: 500 }} />
  }

  const menuItems = [
    { label: ' Available Jobs', icon: <WorkIcon />, tab: 0, badge: filteredAvailableJobs.length },
    { label: ' My Jobs', icon: <HistoryIcon />, tab: 1, badge: activeJobsCount },
    { label: ' Earnings Overview', icon: <TrendingUpIcon />, tab: 2, badge: 0 },
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
            <Typography variant="caption" color="text.secondary">Provider</Typography>
            {user?.is_verified ? (
              <Chip label="✅ Verified" size="small" sx={{ mt: 0.5, bgcolor: '#10b98115', color: '#10b981', height: 18, fontSize: '0.6rem' }} />
            ) : (
              <Chip label="⏳ Pending Verification" size="small" sx={{ mt: 0.5, bgcolor: '#f59e0b15', color: '#f59e0b', height: 18, fontSize: '0.6rem' }} />
            )}
            {user?.service_specialization && (
              <Chip 
                icon={<BuildIcon sx={{ fontSize: 12 }} />}
                label={user.service_specialization} 
                size="small" 
                sx={{ mt: 0.5, bgcolor: '#e6f7f0', color: '#10b981', height: 18, fontSize: '0.6rem', width: '100%', justifyContent: 'flex-start' }} 
              />
            )}
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
              <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a' }}>Provider Dashboard</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(activeTab === 0 || activeTab === 1) && (
                <TextField
                  size="small"
                  placeholder={activeTab === 0 ? "Search available jobs..." : "Search my jobs by service or customer..."}
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
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>Manage your jobs and grow your business</Typography>
            {user?.service_specialization && (
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                🔧 Specializing in: <strong>{user.service_specialization}</strong>
              </Typography>
            )}
            <Alert severity="info" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
               Customers will pay you directly after service completion. You earn {percentages.provider_percent}% of each job amount.
            </Alert>
            {!user?.is_verified && (
              <Alert severity="warning" sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                ⏳ Your account is pending verification. You can claim jobs once verified.
              </Alert>
            )}
          </Card>

          <PaymentFlier />

          {activeTab === 0 && (
            <>
              {availableJobs.length > 0 && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                   Showing jobs for your specialization: <strong>{user?.service_specialization || 'Any'}</strong>
                </Alert>
              )}
              {filteredAvailableJobs.length === 0 && searchTerm && (
                <Alert severity="info" sx={{ mb: 2 }}>No jobs matching "{searchTerm}"</Alert>
              )}
              {filteredAvailableJobs.length === 0 && !searchTerm ? (
                <Card sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">No available jobs at the moment for your specialization.</Typography>
                  {user?.service_specialization && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      You specialize in {user.service_specialization}. Only jobs matching this service will appear here.
                    </Typography>
                  )}
                </Card>
              ) : (
                <Grid container spacing={3}>
                  {filteredAvailableJobs.map(job => (
                    <Grid size={{ xs: 12, md: 6, lg: 4 }} key={job.id}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 3 } }}>
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" fontWeight="700">{job.service_name}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>👤 Customer: {job.customer_name}</Typography>
                          <Typography variant="body2" color="text.secondary">📞 Phone: {job.customer_phone || 'Not provided'}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                            <LocationIcon sx={{ fontSize: 16, color: '#64748b' }} />
                            <Typography variant="caption" color="text.secondary">{job.location_address}, {job.location_city}</Typography>
                          </Box>
                          {job.location_landmark && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              📌 Landmark: {job.location_landmark}
                            </Typography>
                          )}
                          <Typography variant="h5" fontWeight="700" sx={{ color: '#10b981', mt: 2 }}>GH₵{job.amount}</Typography>
                          <Typography variant="caption" color="success.main">
                            💵 You earn: GH₵{(job.amount * percentages.provider_percent / 100).toFixed(2)} ({percentages.provider_percent}%)
                          </Typography>
                          <Box sx={{ mt: 1, p: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Platform fees: GH₵{(job.amount * (100 - percentages.provider_percent) / 100).toFixed(2)} ({100 - percentages.provider_percent}%)
                            </Typography>
                          </Box>
                        </CardContent>
                        <Box sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleClaim(job.id)}
                            disabled={!user?.is_verified || actionLoading === job.id}
                            sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                          >
                            {actionLoading === job.id ? <CircularProgress size={24} sx={{ color: 'white' }} /> : '📌 Claim Job'}
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {activeTab === 1 && (
            <>
              {filteredMyJobs.length === 0 && searchTerm && (
                <Alert severity="info" sx={{ mb: 2 }}>No jobs matching "{searchTerm}"</Alert>
              )}
              {filteredMyJobs.length === 0 && !searchTerm ? (
                <Card sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">No assigned jobs yet.</Typography>
                </Card>
              ) : (
                <Grid container spacing={3}>
                  {filteredMyJobs.map(job => (
                    <Grid size={{ xs: 12, md: 6 }} key={job.id}>
                      <Card sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" fontWeight="700">{job.service_name}</Typography>
                          {getStatusChip(job.status)}
                        </Box>
                        <Typography variant="body2">👤 Customer: {job.customer_name}</Typography>
                        <Typography variant="body2">📞 Phone: {job.customer_phone || 'Not provided'}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                          <LocationIcon sx={{ fontSize: 16, color: '#64748b' }} />
                          <Typography variant="caption" color="text.secondary">
                            📍 {job.location_address}, {job.location_city}, {job.location_region}
                          </Typography>
                        </Box>
                        {job.location_landmark && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            📌 Landmark: {job.location_landmark}
                          </Typography>
                        )}
                        <Typography variant="h5" fontWeight="700" sx={{ color: '#10b981', mt: 2 }}>GH₵{job.amount}</Typography>
                        <Typography variant="caption" color="success.main">
                          💵 Your earnings: GH₵{(job.amount * percentages.provider_percent / 100).toFixed(2)} ({percentages.provider_percent}%)
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          {job.status === 'assigned' && (
                            <Button
                              variant="contained"
                              onClick={() => handleUpdateStatus(job.id, 'in_progress')}
                              disabled={actionLoading === job.id}
                              sx={{ bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' } }}
                            >
                              {actionLoading === job.id ? <CircularProgress size={20} sx={{ color: 'white' }} /> : ' Start Job'}
                            </Button>
                          )}
                          {job.status === 'in_progress' && (
                            <Button
                              variant="contained"
                              onClick={() => handleMarkComplete(job.id)}
                              disabled={actionLoading === job.id}
                              sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                            >
                              {actionLoading === job.id ? <CircularProgress size={20} sx={{ color: 'white' }} /> : ' Mark Complete'}
                            </Button>
                          )}
                          {job.status === 'completed' && !job.customer_confirmed && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PendingIcon sx={{ color: '#f59e0b' }} />
                              <Typography variant="caption" color="text.secondary">⏳ Awaiting customer confirmation</Typography>
                            </Box>
                          )}
                          {job.status === 'confirmed' && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PaidIcon sx={{ color: '#10b981' }} />
                              <Typography variant="caption" color="success.main">✓ Customer confirmed - Payment received!</Typography>
                            </Box>
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ p: 3, textAlign: 'center', bgcolor: '#10b981', color: 'white' }}>
                  <TrendingUpIcon sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>💰 Total Earnings (All Time)</Typography>
                  <Typography variant="h3" fontWeight="800">GH₵{totalEarned.toFixed(2)}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    From {completedJobsCount} completed jobs
                  </Typography>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Card sx={{ p: 3, textAlign: 'center' }}>
                  <PaidIcon sx={{ fontSize: 48, mb: 1, color: '#10b981' }} />
                  <Typography variant="body2" color="text.secondary">⭐ Your Rating</Typography>
                  <Typography variant="h2" fontWeight="800">{user?.rating || 0}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <StarIcon key={star} sx={{ color: star <= (user?.rating || 0) ? '#fbbf24' : '#e2e8f0' }} />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary">Based on {user?.total_jobs || 0} completed jobs</Typography>
                </Card>
              </Grid>
              <Grid size={12}>
                <Card sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>📊 Earnings Breakdown</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  {/* Percentage Info */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>Your Commission Rate</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" sx={{ width: 120 }}>You earn:</Typography>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={percentages.provider_percent} 
                          sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight="600" sx={{ color: '#10b981' }}>{percentages.provider_percent}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                      <Typography variant="body2" sx={{ width: 120 }}>Platform fees:</Typography>
                      <Box sx={{ flex: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={100 - percentages.provider_percent} 
                          sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#94a3b8' } }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight="600" sx={{ color: '#64748b' }}>{100 - percentages.provider_percent}%</Typography>
                    </Box>
                  </Box>

                  {/* Job History */}
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>Job History</Typography>
                  {myJobs.filter(j => j.status === 'confirmed').map((job, idx) => (
                    <Box key={job.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: idx < completedJobsCount - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      <Box>
                        <Typography variant="body2"><strong>{job.service_name}</strong></Typography>
                        <Typography variant="caption" color="text.secondary">{job.customer_name} • {new Date(job.created_at).toLocaleDateString()}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="600" sx={{ color: '#10b981' }}>
                        +GH₵{(job.amount * percentages.provider_percent / 100).toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  {completedJobsCount === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No completed jobs yet.</Typography>
                  )}
                </Card>
              </Grid>
            </Grid>
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
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}>⚙️ Profile Settings</Typography>
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
        </Box>
      </Box>
    </>
  )
}

export default ProviderDashboard
