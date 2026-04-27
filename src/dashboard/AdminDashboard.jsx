import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import RoleBasedTour from '../common/RoleBasedTour'
import ConfirmModal from '../common/ConfirmModal'
import { TourButton, adminTourSteps } from '../common/DemoTour'
import {
  getAdminStats, getServices, toggleServiceActive, updateService, createService,
  getQuotes, updateQuoteStatus, deleteQuote, getAllRequests, approveAndAssignRequest,
  notifyNoProvider, getAllUsers, deleteUser, verifyUser, suspendUser,
  getAvailableProviders, getUnreadMessagesCount, getUnreadCount,
  getAdminComments, toggleCommentApproval, adminDeleteComment,
  getPaymentSettings, updatePaymentSettings,
  getPercentages, updatePercentages,  // ← ADD THIS
  getUserFullDetails, rejectRequest, deleteRequestPermanently
} from '../api/client'
import {
  Box, Drawer, Typography, IconButton, Grid, Card, CardContent,
  Button, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Chip, TextField, Select, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Snackbar, CircularProgress, Avatar,
  Tooltip, Switch, TablePagination, Divider, FormControl, InputLabel, Badge,
  Rating, LinearProgress, Tab, Tabs
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard as DashboardIcon, Build as BuildIcon,
  People as PeopleIcon, Description as DescriptionIcon,
  Refresh as RefreshIcon, Add as AddIcon,
  Edit as EditIcon, Delete as DeleteIcon, Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Search as SearchIcon, Close as CloseIcon, Check as CheckIcon,
  Home as HomeIcon, Assignment as AssignmentIcon, Work as WorkIcon,
  Message as MessageIcon, Comment as CommentIcon, Settings as SettingsIcon,
  Verified as VerifiedIcon, History as HistoryIcon, Percent as PercentIcon,
  Paid as PaidIcon, TrendingUp as TrendingUpIcon
} from '@mui/icons-material'
import PaymentFlier from '../common/PaymentFlier'
import Header from '../layout/Header'
import { DashboardSkeleton } from '../common/LoadingSkeleton'

const drawerWidth = 280

// Helper to save state to localStorage
const saveAdminState = (key, value) => {
  localStorage.setItem(`admin_${key}`, JSON.stringify(value))
}

const loadAdminState = (key, defaultValue) => {
  const saved = localStorage.getItem(`admin_${key}`)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return defaultValue
    }
  }
  return defaultValue
}

const AdminDashboard = () => {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  
  // Persist active tab across refresh
  const [activeTab, setActiveTab] = useState(() => loadAdminState('activeTab', 0))
  
  const [stats, setStats] = useState({})
  const [services, setServices] = useState([])
  const [quotes, setQuotes] = useState([])
  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [providers, setProviders] = useState([])
  const [comments, setComments] = useState([])
  const [percentages, setPercentages] = useState({
      provider_percent: 60,
      admin_percent: 20,
      site_fee_percent: 10,
      referral_pool_percent: 10
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState(null)
  const [openServiceModal, setOpenServiceModal] = useState(false)
  const [editingService, setEditingService] = useState(null)
  const [newService, setNewService] = useState({ name: '', description: '', total_price: '', icon: '🔧' })
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [openUserModal, setOpenUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedUserDetails, setSelectedUserDetails] = useState(null)
  const [userDetailsLoading, setUserDetailsLoading] = useState(false)
  const [quoteFilter, setQuoteFilter] = useState('all')
  const [userRoleFilter, setUserRoleFilter] = useState('all')
  const [requestFilter, setRequestFilter] = useState('all')
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [percentageError, setPercentageError] = useState('')
  const [percentageSuccess, setPercentageSuccess] = useState('')
  const [userDetailsTab, setUserDetailsTab] = useState(0)
  const [assigningRequest, setAssigningRequest] = useState(null)
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  // NEW: Separate state for each request's provider selection
  const [selectedProviderForRequest, setSelectedProviderForRequest] = useState({})
  const [providersForRequest, setProvidersForRequest] = useState({})

  const [paymentSettings, setPaymentSettings] = useState({
    payment_number: '024 000 0000',
    momopay_number: '024 000 0000',
    support_number: '050 000 0000',
    whatsapp_number: '233500000000'
  })
  const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(false)

    // ✅ ADD THESE TWO LINES BELOW
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)
  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Save active tab when changed
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    saveAdminState('activeTab', tab)
    setSearchTerm('')
    
    // ✅ Preload providers when switching to Assign Providers tab (tab 4)
    if (tab === 4 && assignableRequests.length > 0) {
      assignableRequests.forEach(request => {
        if (!providersForRequest[request.id]) {
          // Preload in background - NO SPINNER, user doesn't notice
          loadProvidersForRequest(request.id, request.service_id)
        }
      })
    }
  }

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
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

  // Load payment settings
  const loadPaymentSettings = async () => {
    try {
      const res = await getPaymentSettings()
      setPaymentSettings(res.data)
    } catch (err) {
      console.error('Error loading payment settings:', err)
    }
  }

  // NEW: Load providers for a specific request
  const loadProvidersForRequest = async (requestId, serviceId) => {
    // ✅ Check cache first - providers don't change often
    const cacheKey = `providers_${serviceId}`
    const cached = localStorage.getItem(cacheKey)
    const cachedTime = localStorage.getItem(`${cacheKey}_time`)
    
    // Use cache if less than 5 minutes old
    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < 300000) {
      try {
        const providers = JSON.parse(cached)
        setProvidersForRequest(prev => ({ ...prev, [requestId]: providers }))
        return  // ✅ INSTANT! No API call, no spinner, no flicker
      } catch (e) {
        console.error('Cache parse error:', e)
      }
    }
    
    // ✅ REMOVED: setLoadingProviders(true) - NO SPINNER
    // ✅ REMOVED: clearing providers - NO FLICKER
    
    try {
      const res = await getAvailableProviders(serviceId)
      setProvidersForRequest(prev => ({ ...prev, [requestId]: res.data }))
      
      // ✅ Save to cache for next time
      localStorage.setItem(cacheKey, JSON.stringify(res.data))
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString())
      
    } catch (err) {
      console.error('Error loading providers for request:', err)
      setProvidersForRequest(prev => ({ ...prev, [requestId]: [] }))
    }
    // ✅ REMOVED: setLoadingProviders(false)
  }

  // NEW: Handle assign provider for a specific request
  const handleAssignProvider = async (requestId, providerId) => {
    if (!providerId) {
      showToast('Please select a provider', 'error')
      return
    }
    setAssigningRequest(requestId)
    try {
      await approveAndAssignRequest(requestId, providerId)
      showToast('Provider assigned successfully!', 'success')
      
      // ✅ Update local state instantly
      const providerName = selectedProviderForRequest[requestId]
      setRequests(prev => prev.map(req =>
        req.id === requestId
          ? { ...req, status: 'assigned', provider_id: providerId, provider_name: providerName }
          : req
      ))
      
      setSelectedProviderForRequest(prev => {
        const newState = { ...prev }
        delete newState[requestId]
        return newState
      })
      setProvidersForRequest(prev => {
        const newState = { ...prev }
        delete newState[requestId]
        return newState
      })
      
      // ✅ Background refresh (no spinner)
      loadData(false)
      
    } catch (err) {
      showToast(err.response?.data?.error || 'Error assigning provider', 'error')
    } finally {
      setAssigningRequest(null)
    }
  }

  // Main data loading function

  const loadData = useCallback(async (showSpinner = true) => {
    if (user?.role !== 'admin') return
    
    if (showSpinner) {
      setRefreshing(true)  // ← Only show spinner on manual refresh
    }
    try {
      setLoading(false)
      const [statsRes, servicesRes, quotesRes, requestsRes, usersRes, commentsRes] = await Promise.all([
        getAdminStats(),
        getServices(false),
        getQuotes(),
        getAllRequests(),
        getAllUsers(),
        getAdminComments()
      ])
      setStats(statsRes.data)
      setServices(servicesRes.data)
      setQuotes(quotesRes.data)
      setRequests(requestsRes.data)
      setUsers(usersRes.data)
      setComments(commentsRes.data)
    } catch (err) {
      console.error(err)
      if (showSpinner) {
        showToast('Error loading data', 'error')
      }
    } finally {
      if (showSpinner) {
        setRefreshing(false)
      }
    }
  }, [user])
  // Load unread counts
  const loadUnreadCounts = useCallback(async () => {
    if (user?.role !== 'admin') return
    try {
      if (user?.id) {
        const [msgRes, notifRes] = await Promise.all([
          getUnreadMessagesCount(user.id),
          getUnreadCount(user.id)
        ])
        setUnreadMessagesCount(msgRes.data.count)
        setUnreadNotificationsCount(notifRes.data.count)
      }
    } catch (err) {
      console.error('Error loading unread counts:', err)
    }
  }, [user?.id, user?.role])

  // Load user full details
  const loadUserFullDetails = async (userId) => {
    // ✅ Check cache first
    const cacheKey = `user_details_${userId}`
    const cached = localStorage.getItem(cacheKey)
    const cachedTime = localStorage.getItem(`${cacheKey}_time`)
    
    // Use cache if less than 1 minute old
    if (cached && cachedTime && Date.now() - parseInt(cachedTime) < 60000) {
      try {
        setSelectedUserDetails(JSON.parse(cached))
        setUserDetailsLoading(false)
        return
      } catch(e) {}
    }
    
    setUserDetailsLoading(true)
    try {
      const res = await getUserFullDetails(userId)
      setSelectedUserDetails(res.data)
      
      // ✅ Save to cache
      localStorage.setItem(cacheKey, JSON.stringify(res.data))
      localStorage.setItem(`${cacheKey}_time`, Date.now().toString())
      
    } catch (err) {
      console.error('Error loading user details:', err)
      showToast('Error loading user details', 'error')
    } finally {
      setUserDetailsLoading(false)
    }
  }

  // ========== FILTERED DATA FOR SEARCH ==========
  
  // Filtered Users
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(u => u.role !== 'admin')
    if (userRoleFilter !== 'all' && userRoleFilter) {
      filtered = filtered.filter(u => u.role === userRoleFilter)
    }
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone?.includes(term)
      )
    }
    return filtered
  }, [users, userRoleFilter, searchTerm])

  // Filtered Quotes with search
  const filteredQuotes = useMemo(() => {
    let filtered = quotes
    if (quoteFilter !== 'all') {
      filtered = filtered.filter(q => q.status === quoteFilter)
    }
    if (searchTerm && searchTerm.trim() && activeTab === 3) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(q => 
        q.full_name?.toLowerCase().includes(term) ||
        q.email?.toLowerCase().includes(term) ||
        q.phone?.includes(term) ||
        q.service_type?.toLowerCase().includes(term) ||
        q.location?.toLowerCase().includes(term)
      )
    }
    return filtered
  }, [quotes, quoteFilter, searchTerm, activeTab])

  // Filtered Comments with search
  const filteredComments = useMemo(() => {
    let filtered = comments
    if (searchTerm && searchTerm.trim() && activeTab === 6) {
      const term = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(c => 
        c.user_name?.toLowerCase().includes(term) ||
        c.comment?.toLowerCase().includes(term)
      )
    }
    return filtered
  }, [comments, searchTerm, activeTab])

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    if (requestFilter === 'all') return requests
    return requests.filter(r => r.status === requestFilter)
  }, [requests, requestFilter])

  const assignableRequests = useMemo(() => 
    requests.filter(r => r.status === 'pending_approval'),
    [requests]
  )

  const assignedRequests = useMemo(() => 
    requests.filter(r => r.status === 'assigned' || r.status === 'in_progress'),
    [requests]
  )

  // ========== REALTIME EVENT HANDLERS ==========
  const handleRealtimeRefresh = useCallback(() => {
    console.log('🔄 AdminDashboard: Realtime refresh triggered')
    loadData()
    loadUnreadCounts()
  }, [loadData, loadUnreadCounts])

  const handleNewRequest = useCallback((event) => {
    console.log('📢 New request received:', event.detail)
    loadData()
    loadUnreadCounts()
    showToast(`New request from ${event.detail.customer_name} for ${event.detail.service_name}`, 'info')
  }, [loadData, loadUnreadCounts])

  const handleRequestStatusChanged = useCallback((event) => {
    console.log('📊 Request status changed:', event.detail)
    loadData()
  }, [loadData])

  const handleProviderAssigned = useCallback((event) => {
    console.log('👤 Provider assigned:', event.detail)
    loadData()
  }, [loadData])

  const handleJobClaimed = useCallback((event) => {
    console.log('📌 Job claimed:', event.detail)
    loadData()
  }, [loadData])

  const handleJobStarted = useCallback((event) => {
    console.log('🔧 Job started:', event.detail)
    loadData()
  }, [loadData])

  const handleJobCompleted = useCallback((event) => {
    console.log('✅ Job completed:', event.detail)
    loadData()
  }, [loadData])

  const handleCustomerConfirmed = useCallback((event) => {
    console.log('✓ Customer confirmed:', event.detail)
    loadData()
  }, [loadData])

  const handleServiceCreated = useCallback((event) => {
    console.log('🛠️ Service created:', event.detail)
    loadData()
    showToast(`New service "${event.detail.name}" created`, 'success')
  }, [loadData])

  const handleServiceUpdated = useCallback((event) => {
    console.log('🛠️ Service updated:', event.detail)
    loadData()
  }, [loadData])

  const handleServiceToggled = useCallback((event) => {
    console.log('🛠️ Service toggled:', event.detail)
    loadData()
    showToast(`Service "${event.detail.name}" is now ${event.detail.is_active ? 'active' : 'inactive'}`, 'info')
  }, [loadData])

  const handlePercentagesUpdated = useCallback((event) => {
    console.log('📊 Percentages updated:', event.detail)
    setPercentages(event.detail)
    loadData()
    setPercentageSuccess('Percentages updated successfully!')
    setTimeout(() => setPercentageSuccess(''), 3000)
  }, [loadData])

  const handleNewQuote = useCallback((event) => {
    console.log('📝 New quote received:', event.detail)
    loadData()
    showToast(`New quote request from ${event.detail.full_name} for ${event.detail.service_type}`, 'info')
  }, [loadData])


const handleRejectRequest = async (requestId) => {
  const reason = prompt('Enter reason for rejection:')
  if (!reason) return
  
  setActionLoading(requestId)
  try {
    await rejectRequest(requestId, reason)
    showToast('Request rejected successfully', 'success')
    await loadData()
  } catch (err) {
    showToast(err.response?.data?.error || 'Error rejecting request', 'error')
  } finally {
    setActionLoading(null)
  }
}

const handleDeleteRequestPermanently = async (requestId) => {
  if (!window.confirm('PERMANENT DELETE: This action cannot be undone. Are you sure?')) return
  
  setActionLoading(requestId)
  try {
    await deleteRequestPermanently(requestId)
    showToast('Request permanently deleted', 'success')
    await loadData()
  } catch (err) {
    showToast(err.response?.data?.error || 'Error deleting request', 'error')
  } finally {
    setActionLoading(null)
  }
}

  

  
      
  const handleQuoteStatusUpdated = useCallback((event) => {
    console.log('📝 Quote status updated:', event.detail)
    loadData()
  }, [loadData])

  const handleNewComment = useCallback((event) => {
    console.log('💬 New comment:', event.detail)
    loadData()
  }, [loadData])

  const handleCommentToggled = useCallback((event) => {
    console.log('💬 Comment toggled:', event.detail)
    loadData()
  }, [loadData])

  const handleCommentDeleted = useCallback((event) => {
    console.log('💬 Comment deleted:', event.detail)
    loadData()
  }, [loadData])

  const handleUsersUpdated = useCallback((event) => {
    console.log('👥 Users updated:', event.detail)
    
    // ✅ Clear provider cache so new providers appear
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('providers_')) {
        localStorage.removeItem(key)
        localStorage.removeItem(`${key}_time`)
      }
    })
    
    loadData(false)  // Background refresh, NO SPINNER
  }, [loadData])

  const handleUserVerified = useCallback((event) => {
    console.log('✅ User verified:', event.detail)
    loadData()
    showToast(`User has been verified`, 'success')
  }, [loadData])

  const handleUserSuspended = useCallback((event) => {
    console.log('⚠️ User suspended:', event.detail)
    loadData()
  }, [loadData])

  const handlePaymentSettingsUpdated = useCallback((event) => {
    console.log('💰 Payment settings updated:', event.detail)
    setPaymentSettings(event.detail)
    showToast('Payment settings updated', 'success')
  }, [])

  const handleNewNotification = useCallback((event) => {
    console.log('🔔 New notification:', event.detail)
    loadUnreadCounts()
  }, [loadUnreadCounts])

  const handleMessageReceived = useCallback(() => {
    console.log('💬 New message received')
    loadUnreadCounts()
  }, [loadUnreadCounts])

  // Set up all realtime event listeners
  useEffect(() => {
    window.addEventListener('service_created', handleServiceCreated)
    window.addEventListener('service_updated', handleServiceUpdated)
    window.addEventListener('service_toggled', handleServiceToggled)
    window.addEventListener('new_request', handleNewRequest)
    window.addEventListener('request_status_changed', handleRequestStatusChanged)
    window.addEventListener('provider_assigned', handleProviderAssigned)
    window.addEventListener('job_claimed', handleJobClaimed)
    window.addEventListener('job_started', handleJobStarted)
    window.addEventListener('job_completed', handleJobCompleted)
    window.addEventListener('customer_confirmed', handleCustomerConfirmed)
    window.addEventListener('new_quote', handleNewQuote)
    window.addEventListener('quote_status_updated', handleQuoteStatusUpdated)
    window.addEventListener('new_comment', handleNewComment)
    window.addEventListener('comment_toggled', handleCommentToggled)
    window.addEventListener('comment_deleted', handleCommentDeleted)
    window.addEventListener('users_updated', handleUsersUpdated)
    window.addEventListener('user_verified', handleUserVerified)
    window.addEventListener('user_suspended', handleUserSuspended)
    window.addEventListener('user_deleted', handleUsersUpdated)
    window.addEventListener('percentages_updated', handlePercentagesUpdated)
    window.addEventListener('payment_settings_updated', handlePaymentSettingsUpdated)
    window.addEventListener('new_notification', handleNewNotification)
    window.addEventListener('new_message_received', handleMessageReceived)
    window.addEventListener('message_delivered', handleMessageReceived)

    return () => {
      window.removeEventListener('service_created', handleServiceCreated)
      window.removeEventListener('service_updated', handleServiceUpdated)
      window.removeEventListener('service_toggled', handleServiceToggled)
      window.removeEventListener('new_request', handleNewRequest)
      window.removeEventListener('request_status_changed', handleRequestStatusChanged)
      window.removeEventListener('provider_assigned', handleProviderAssigned)
      window.removeEventListener('job_claimed', handleJobClaimed)
      window.removeEventListener('job_started', handleJobStarted)
      window.removeEventListener('job_completed', handleJobCompleted)
      window.removeEventListener('customer_confirmed', handleCustomerConfirmed)
      window.removeEventListener('new_quote', handleNewQuote)
      window.removeEventListener('quote_status_updated', handleQuoteStatusUpdated)
      window.removeEventListener('new_comment', handleNewComment)
      window.removeEventListener('comment_toggled', handleCommentToggled)
      window.removeEventListener('comment_deleted', handleCommentDeleted)
      window.removeEventListener('users_updated', handleUsersUpdated)
      window.removeEventListener('user_verified', handleUserVerified)
      window.removeEventListener('user_suspended', handleUserSuspended)
      window.removeEventListener('user_deleted', handleUsersUpdated)
      window.removeEventListener('percentages_updated', handlePercentagesUpdated)
      window.removeEventListener('payment_settings_updated', handlePaymentSettingsUpdated)
      window.removeEventListener('new_notification', handleNewNotification)
      window.removeEventListener('new_message_received', handleMessageReceived)
      window.removeEventListener('message_delivered', handleMessageReceived)
    }
  }, [handleServiceCreated, handleServiceUpdated, handleServiceToggled, handleNewRequest, handleRequestStatusChanged, handleProviderAssigned, handleJobClaimed, handleJobStarted, handleJobCompleted, handleCustomerConfirmed, handleNewQuote, handleQuoteStatusUpdated, handleNewComment, handleCommentToggled, handleCommentDeleted, handleUsersUpdated, handleUserVerified, handleUserSuspended, handlePercentagesUpdated, handlePaymentSettingsUpdated, handleNewNotification, handleMessageReceived])

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
    if (user?.role !== 'admin') {
      window.location.href = '/'
      return
    }
    
    loadData()
    loadUnreadCounts()
    loadPaymentSettings()
    loadPercentages()
  }, [user, loadData, loadPercentages, loadUnreadCounts])

  const handleViewUserDetails = async (userObj) => {
    setSelectedUser(userObj)
    await loadUserFullDetails(userObj.id)
    setOpenUserModal(true)
  }

  const handleUpdatePaymentSettings = async () => {
    setPaymentSettingsLoading(true)
    try {
      await updatePaymentSettings(paymentSettings)
      showToast('Payment settings updated successfully!', 'success')
    } catch (err) {
      showToast('Error updating payment settings', 'error')
    } finally {
      setPaymentSettingsLoading(false)
    }
  }

  const handleUpdatePercentages = async () => {
      const total = percentages.provider_percent + percentages.admin_percent + percentages.site_fee_percent + (percentages.referral_pool_percent || 0)
      if (Math.abs(total - 100) > 0.01) {
        setPercentageError(`Total must be 100%. Current total: ${total}%`)
        return
      }
      setPercentageError('')
      setActionLoading(true)
      try {
        await updatePercentages(percentages)
        showToast('Percentages updated successfully!', 'success')
        await loadPercentages()
        await loadData()
      } catch (err) {
        showToast(err.response?.data?.error || 'Error updating percentages', 'error')
      } finally {
        setActionLoading(false)
      }
  }

  const handleToggleService = async (serviceId) => {
    // ✅ Get current state BEFORE changing
    const currentService = services.find(s => s.id === serviceId)
    const newActiveState = !currentService?.is_active
    
    // ✅ OPTIMISTIC UPDATE - Change UI immediately
    setServices(prev => prev.map(service =>
      service.id === serviceId
        ? { ...service, is_active: newActiveState }
        : service
    ))
    
    // ✅ Disable switch during API call
    setActionLoading(serviceId)
    
    try {
      const res = await toggleServiceActive(serviceId)
      showToast(res.data.message)
      
      // ✅ Background refresh to ensure consistency
      loadData(false)
      
    } catch (err) {
      // ✅ REVERT on error - put the switch back
      setServices(prev => prev.map(service =>
        service.id === serviceId
          ? { ...service, is_active: !newActiveState }
          : service
      ))
      showToast(err.response?.data?.error || 'Error toggling service', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateService = async () => {
    if (!editingService) return
    setActionLoading(true)
    try {
      await updateService(editingService.id, editingService)
      showToast('Service updated successfully')
      setEditingService(null)
      setOpenServiceModal(false)
      await loadData()
    } catch (err) {
      showToast('Error updating service', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateService = async () => {
    if (!newService.name || !newService.total_price) {
      showToast('Please fill all fields', 'error')
      return
    }
    setActionLoading(true)
    try {
      await createService(newService)
      showToast('Service created successfully')
      setNewService({ name: '', description: '', total_price: '', icon: '🔧' })
      setOpenServiceModal(false)
      await loadData()
    } catch (err) {
      showToast('Error creating service', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleNotifyCustomer = async (requestId) => {
    setActionLoading(true)
    try {
      await notifyNoProvider(requestId)
      showToast('Customer has been notified', 'success')
      await loadData()
    } catch (err) {
      showToast('Error sending notification', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleVerifyUser = async (userId) => {
    setActionLoading(true)
    try {
      await verifyUser(userId)
      showToast('Provider verified successfully', 'success')
      
      // ✅ Update local state instantly - UI changes immediately
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, is_verified: true } : user
      ))
      
      // ✅ REMOVED loadData(false) - No waiting!
      
    } catch (err) {
      showToast(err.response?.data?.error || 'Error verifying user', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspendUser = async (userId, currentStatus) => {
    setActionLoading(true)
    try {
      await suspendUser(userId)
      showToast(`User ${currentStatus ? 'suspended' : 'activated'} successfully`, 'success')
      
      // ✅ Update local state instantly - UI changes immediately
      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ))
      
    } catch (err) {
      console.error('Suspend error:', err)
      showToast(err.response?.data?.error || 'Error updating user status', 'error')
    } finally {
      setActionLoading(false)
    }
  }
 

  const handleDeleteUser = async (userId, userName) => {
    setActionLoading(true)
    try {
      await deleteUser(userId)
      showToast(`${userName} has been deleted`, 'success')
      
      // ✅ Update local state instantly
      setUsers(prev => prev.filter(user => user.id !== userId))
      
      setOpenUserModal(false)
      setSelectedUser(null)
      setSelectedUserDetails(null)
      
      // ✅ Background refresh
      loadData(false)
      
    } catch (err) {
      showToast(err.response?.data?.error || 'Error deleting user', 'error')
    } finally {
      setActionLoading(false)
      setDeleteConfirmOpen(false)  // ✅ ADD THIS LINE
      setUserToDelete(null)         // ✅ ADD THIS LINE
    }
  }

  // ✅ ADD THIS NEW FUNCTION RIGHT AFTER handleDeleteUser
  const openDeleteConfirm = (user) => {
    setUserToDelete(user)
    setDeleteConfirmOpen(true)
  }

  
  const handleUpdateQuoteStatus = async (quoteId, status) => {
    setActionLoading(true)
    try {
      await updateQuoteStatus(quoteId, status)
      showToast('Quote status updated', 'success')
      await loadData()
    } catch (err) {
      showToast('Error updating quote', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteQuote = async (quoteId) => {
    setActionLoading(true)
    try {
      await deleteQuote(quoteId)
      showToast('Quote deleted', 'success')
      await loadData()
    } catch (err) {
      showToast('Error deleting quote', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleComment = async (commentId) => {
    setActionLoading(commentId)
    try {
      await toggleCommentApproval(commentId)
      showToast('Comment status updated', 'success')
      await loadData()
    } catch (err) {
      showToast('Error updating comment', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!commentId) return;
    
    setActionLoading(commentId)
    try {
        await adminDeleteComment(commentId)
        showToast('Comment deleted', 'success')
        await loadData()
    } catch (err) {
        if (err.response?.status !== 404) {
            showToast('Error deleting comment', 'error')
        }
    } finally {
        setActionLoading(null)
    }
  }

  const activeServicesCount = services.filter(s => s.is_active).length

  const statCards = [
    { title: 'Total Users', value: stats.total_users || 0, subtitle: `${stats.total_customers || 0} customers | ${stats.total_providers || 0} providers`, icon: <PeopleIcon />, color: '#10b981' },
    { title: 'Total Revenue', value: `GH₵${(stats.total_revenue || 0).toFixed(2)}`, subtitle: 'from all services', icon: <PaidIcon />, color: '#8b5cf6' },
    { title: 'Admin Fees', value: `GH₵${(stats.total_admin_fees || 0).toFixed(2)}`, subtitle: `${percentages.admin_percent}% of all services`, icon: <PercentIcon />, color: '#3b82f6' },
    { title: 'Site Fees', value: `GH₵${(stats.total_site_fees || 0).toFixed(2)}`, subtitle: `${percentages.site_fee_percent}% of all services`, icon: <TrendingUpIcon />, color: '#f59e0b' },
    { title: 'Provider Payouts', value: `GH₵${(stats.total_provider_payouts || 0).toFixed(2)}`, subtitle: `${percentages.provider_percent}% paid to providers`, icon: <WorkIcon />, color: '#10b981' },
    { title: 'Pending Approval', value: stats.pending_approval || 0, subtitle: 'requests waiting', icon: <AssignmentIcon />, color: '#3b82f6' },
    { title: 'Active Services', value: `${stats.active_services || 0}`, subtitle: 'active services', icon: <BuildIcon />, color: '#10b981' },
    { title: 'In Progress', value: stats.in_progress || 0, subtitle: 'jobs being done', icon: <WorkIcon />, color: '#ec4898' },
    { title: 'Total Comments', value: stats.total_comments || 0, subtitle: 'user feedback', icon: <CommentIcon />, color: '#8b5cf6' },
  ]

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, tab: 0, badge: 0 },
    { label: 'Service Management', icon: <BuildIcon />, tab: 1, badge: `${activeServicesCount} active` },
    { label: 'User Management', icon: <PeopleIcon />, tab: 2, badge: 0 },
    { label: 'Quote Requests', icon: <DescriptionIcon />, tab: 3, badge: quotes.filter(q => q.status === 'pending').length },
    { label: 'Assign Providers', icon: <AssignmentIcon />, tab: 4, badge: assignableRequests.length },
    { label: 'Assigned Jobs', icon: <WorkIcon />, tab: 5, badge: assignedRequests.length },
    { label: 'Comments', icon: <CommentIcon />, tab: 6, badge: comments.filter(c => !c.is_approved).length },
    { label: 'Percentage Settings', icon: <PercentIcon />, tab: 7, badge: 0 },
    { label: 'Payment Settings', icon: <SettingsIcon />, tab: 8, badge: 0 },
    { label: 'All Requests History', icon: <HistoryIcon />, tab: 9, badge: 0 },
    { label: 'Messages', icon: <MessageIcon />, tab: 10, badge: unreadMessagesCount, action: () => window.location.href = '/messages' },
  ]

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'white' }}>
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid #e2e8f0' }}>
        <Avatar sx={{ bgcolor: '#10b981', width: 40, height: 40 }}>Z</Avatar>
        <Typography variant="h6" fontWeight="800" sx={{ color: '#0f172a' }}>ZIVRE ADMIN</Typography>
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
            {typeof item.badge === 'number' && item.badge > 0 && (
              <Badge badgeContent={item.badge} color="error" sx={{ ml: 'auto' }} />
            )}
            {typeof item.badge === 'string' && (
              <Chip label={item.badge} size="small" sx={{ ml: 'auto', bgcolor: '#f1f5f9', height: 20, fontSize: '0.7rem' }} />
            )}
          </Button>
        ))}
      </Box>
    </Box>
  )

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
      
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)', bgcolor: '#f8fafc' }}>
        <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={toast?.type} sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{toast?.message}</Alert>
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
            <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a' }}>Admin Dashboard</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<HomeIcon />}
                onClick={() => window.location.href = '/'}
                sx={{ borderColor: '#10b981', color: '#10b981', '&:hover': { borderColor: '#059669', backgroundColor: '#e6f7f0' } }}
              >
                Back to Home
              </Button>
              {(activeTab === 2 || activeTab === 3 || activeTab === 6) && (
                <TextField
                  size="small"
                  placeholder={
                    activeTab === 2 ? "Search users..." : 
                    activeTab === 3 ? "Search quotes by name, email, phone, service..." : 
                    "Search comments..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: '#94a3b8' }} /> } }}
                  sx={{ width: isMobile ? 200 : 280, bgcolor: 'white', borderRadius: 2 }}
                />
              )}
              <IconButton onClick={() => loadData(true)} disabled={refreshing} sx={{ bgcolor: 'white' }}>
                {refreshing ? <CircularProgress size={24} sx={{ color: '#10b981' }} /> : <RefreshIcon />}
              </IconButton>
              <IconButton onClick={() => setMobileOpen(!mobileOpen)} sx={{ display: { xs: 'flex', md: 'none' } }}>
                <MenuIcon />
              </IconButton>
            </Box>
          </Box>

          <PaymentFlier />

          {/* Dashboard Tab Content */}
          {activeTab === 0 && (
            <>
              <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((card, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={i}>
                    <Card sx={{ p: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">{card.title}</Typography>
                          <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a', mt: 0.5 }}>{card.value}</Typography>
                          <Typography variant="caption" color="text.secondary">{card.subtitle}</Typography>
                        </Box>
                        <Avatar sx={{ bgcolor: `${card.color}15`, color: card.color, width: 48, height: 48 }}>{card.icon}</Avatar>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Card sx={{ p: 3, mb: 3, bgcolor: '#f8fafc' }}>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#0f172a' }}>💰 Current Fee Distribution</Typography>
                
                {/* Provider Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ width: 120 }}>Provider gets:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress variant="determinate" value={percentages.provider_percent} sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#10b981' } }} />
                  </Box>
                  <Typography variant="body2" fontWeight="600" sx={{ color: '#10b981' }}>{percentages.provider_percent}%</Typography>
                </Box>
                
                {/* Admin Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ width: 120 }}>Admin fee:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress variant="determinate" value={percentages.admin_percent} sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#8b5cf6' } }} />
                  </Box>
                  <Typography variant="body2" fontWeight="600" sx={{ color: '#8b5cf6' }}>{percentages.admin_percent}%</Typography>
                </Box>
                
                {/* Site Fee Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ width: 120 }}>Site fee:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress variant="determinate" value={percentages.site_fee_percent} sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' } }} />
                  </Box>
                  <Typography variant="body2" fontWeight="600" sx={{ color: '#f59e0b' }}>{percentages.site_fee_percent}%</Typography>
                </Box>
                
                {/* NEW: Referral Pool Row - ADD THIS */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Typography variant="body2" sx={{ width: 120 }}>Referral Pool:</Typography>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress variant="determinate" value={percentages.referral_pool_percent || 0} sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#0284c7' } }} />
                  </Box>
                  <Typography variant="body2" fontWeight="600" sx={{ color: '#0284c7' }}>{percentages.referral_pool_percent || 0}%</Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Total - Now includes Referral Pool */}
                <Typography variant="body2" color="text.secondary">
                  <strong>Total: {(percentages.provider_percent + percentages.admin_percent + percentages.site_fee_percent + (percentages.referral_pool_percent || 0)).toFixed(1)}%</strong>
                  {Math.abs(percentages.provider_percent + percentages.admin_percent + percentages.site_fee_percent + (percentages.referral_pool_percent || 0) - 100) > 0.01 ? (
                    <span style={{ color: '#ef4444' }}> ❌ Must equal 100%</span>
                  ) : (
                    <span style={{ color: '#10b981' }}> ✓ Valid</span>
                  )}
                </Typography>
              </Card>

              <Card sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#0f172a' }}>Recent Activity</Typography>
                <Divider sx={{ mb: 2 }} />
                {requests.slice(0, 10).map((req, idx) => (
                  <Box key={req.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: idx < 9 ? '1px solid #e2e8f0' : 'none' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#e6f7f0' }}>
                        <PeopleIcon sx={{ fontSize: 16, color: '#10b981' }} />
                      </Avatar>
                      <Typography variant="body2">{req.customer_name} requested <strong>{req.service_name}</strong> - Status: {req.status}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{new Date(req.created_at).toLocaleString()}</Typography>
                  </Box>
                ))}
                {requests.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No recent activity</Typography>}
              </Card>
            </>
          )}

          {/* Service Management Tab */}
          {activeTab === 1 && (
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" fontWeight="600" sx={{ color: '#0f172a' }}>Service Management</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingService(null); setNewService({ name: '', description: '', total_price: '', icon: '🔧' }); setOpenServiceModal(true) }} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
                  Add New Service
                </Button>
              </Box>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <strong>Current Fee Distribution:</strong> Provider {percentages.provider_percent}% | Admin {percentages.admin_percent}% | Site Fee {percentages.site_fee_percent}% | Referral Pool {percentages.referral_pool_percent || 0}%
              </Alert>
              <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                <Table sx={{ minWidth: 600 }}>
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell>Icon</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Total Price</TableCell>
                      <TableCell>Provider ({percentages.provider_percent}%)</TableCell>
                      <TableCell>Admin ({percentages.admin_percent}%)</TableCell>
                      <TableCell>Site ({percentages.site_fee_percent}%)</TableCell>
                      <TableCell>Referral Pool ({percentages.referral_pool_percent || 0}%)</TableCell>  {/* ADD THIS */}
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                  </TableRow>
                  </TableHead>
                  <TableBody>
                    {services.map((s) => (
                      <TableRow key={s.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell><Typography variant="h5">{s.icon}</Typography></TableCell>
                        <TableCell>
                          <Typography fontWeight="600">{s.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.description?.substring(0, 60)}...</Typography>
                        </TableCell>
                        <TableCell><Typography fontWeight="600">GH₵{s.total_price}</Typography></TableCell>
                        <TableCell><Typography fontWeight="600" sx={{ color: '#10b981' }}>GH₵{s.provider_payout?.toFixed(2)}</Typography></TableCell>
                        <TableCell><Typography fontWeight="600" sx={{ color: '#8b5cf6' }}>GH₵{s.admin_fee?.toFixed(2)}</Typography></TableCell>
                        <TableCell><Typography fontWeight="600" sx={{ color: '#f59e0b' }}>GH₵{s.site_fee?.toFixed(2)}</Typography></TableCell>
                        {/* NEW: Referral Pool Cell */}
                        <TableCell>
                          <Typography fontWeight="600" sx={{ color: '#0284c7' }}>
                            GH₵{s.referral_pool_amount?.toFixed(2) || (s.total_price * (percentages.referral_pool_percent || 0) / 100).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={s.is_active ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{ bgcolor: s.is_active ? '#10b98115' : '#ef444415', color: s.is_active ? '#10b981' : '#ef4444', fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => { setEditingService(s); setOpenServiceModal(true) }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={s.is_active ? 'Deactivate' : 'Activate'}>
                            <Switch
                              checked={s.is_active}
                              onChange={() => handleToggleService(s.id)}
                              disabled={actionLoading === true}
                              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#10b981' } }}
                            />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>

                  
                </Table>
              </TableContainer>
            </Card>
          )}

          {/* User Management Tab */}
          {activeTab === 2 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}>User Management</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter by Role</InputLabel>
                  <Select value={userRoleFilter} label="Filter by Role" onChange={(e) => setUserRoleFilter(e.target.value)}>
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="customer">Customers</MenuItem>
                    <MenuItem value="provider">Providers</MenuItem>
                  </Select>
                </FormControl>
                {filteredUsers.length > 0 && (
                  <Typography variant="body2" sx={{ alignSelf: 'center', color: '#64748b' }}>
                    Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
              <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                <Table sx={{ minWidth: 600 }}>
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Contact</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Specialization</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Rating/Jobs</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((u) => (
                      <TableRow key={u.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: '#10b981', width: 40, height: 40 }}>{u.full_name?.charAt(0).toUpperCase()}</Avatar>
                            <Box>
                              <Typography fontWeight="600">{u.full_name}</Typography>
                              <Typography variant="caption" color="text.secondary">ID: {u.id}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{u.email}</Typography>
                          <Typography variant="caption" color="text.secondary">{u.phone}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.role}
                            size="small"
                            sx={{ bgcolor: u.role === 'admin' ? '#8b5cf615' : u.role === 'provider' ? '#3b82f615' : '#10b98115', color: u.role === 'admin' ? '#8b5cf6' : u.role === 'provider' ? '#3b82f6' : '#10b981' }}
                          />
                        </TableCell>
                        <TableCell>
                          {u.role === 'provider' && u.service_specialization ? (
                            <Chip
                              label={u.service_specialization}
                              size="small"
                              sx={{ bgcolor: '#fef3c7', color: '#f59e0b' }}
                            />
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={u.is_active ? 'Active' : 'Suspended'}
                            size="small"
                            sx={{ bgcolor: u.is_active ? '#10b98115' : '#ef444415', color: u.is_active ? '#10b981' : '#ef4444' }}
                          />
                        </TableCell>
                        <TableCell>
                          {u.role === 'provider' ? (
                            <Box>
                              <Typography variant="body2">⭐ {u.rating || 'N/A'}</Typography>
                              <Typography variant="caption" color="text.secondary">{u.total_jobs || 0} jobs completed</Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {/* VIEW Button */}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityIcon />}
                              onClick={() => handleViewUserDetails(u)}
                              sx={{
                                color: '#10b981',
                                borderColor: '#10b981',
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                py: 0.5,
                                px: 1.5,
                                minWidth: 'auto',
                                '&:hover': { bgcolor: '#e6f7f0', borderColor: '#10b981' }
                              }}
                            >
                              View
                            </Button>
                            
                            {/* VERIFY Button - only for unverified providers */}
                            {u.role === 'provider' && !u.is_verified && (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VerifiedIcon />}
                                onClick={() => handleVerifyUser(u.id)}
                                sx={{
                                  color: '#3b82f6',
                                  borderColor: '#3b82f6',
                                  textTransform: 'none',
                                  fontSize: '0.7rem',
                                  py: 0.5,
                                  px: 1.5,
                                  minWidth: 'auto',
                                  '&:hover': { bgcolor: '#eff6ff', borderColor: '#3b82f6' }
                                }}
                              >
                                Verify
                              </Button>
                            )}
                            
                            {/* SUSPEND/ACTIVATE Button */}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={u.is_active ? <CloseIcon /> : <CheckIcon />}
                              onClick={() => handleSuspendUser(u.id, u.is_active)}
                              sx={{
                                color: u.is_active ? '#f59e0b' : '#10b981',
                                borderColor: u.is_active ? '#f59e0b' : '#10b981',
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                py: 0.5,
                                px: 1.5,
                                minWidth: 'auto',
                                '&:hover': { 
                                  bgcolor: u.is_active ? '#fef3c7' : '#e6f7f0',
                                  borderColor: u.is_active ? '#f59e0b' : '#10b981'
                                }
                              }}
                            >
                              {u.is_active ? 'Suspend' : 'Activate'}
                            </Button>
                            
                            {/* DELETE Button - opens confirmation modal */}
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DeleteIcon />}
                              onClick={() => openDeleteConfirm(u)}
                              sx={{
                                color: '#ef4444',
                                borderColor: '#ef4444',
                                textTransform: 'none',
                                fontSize: '0.7rem',
                                py: 0.5,
                                px: 1.5,
                                minWidth: 'auto',
                                '&:hover': { bgcolor: '#fef2f2', borderColor: '#ef4444' }
                              }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={isMobile ? [5, 10] : [5, 10, 25]}
                component="div"
                count={filteredUsers.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, p) => setPage(p)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
                labelRowsPerPage={isMobile ? "Rows:" : "Rows per page:"}
              />
            </Card>
          )}

          {/* Quote Requests Tab */}
          {activeTab === 3 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}>Quote Requests</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select value={quoteFilter} label="Filter by Status" onChange={(e) => setQuoteFilter(e.target.value)}>
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="contacted">Contacted</MenuItem>
                    <MenuItem value="closed">Closed</MenuItem>
                  </Select>
                </FormControl>
                {filteredQuotes.length > 0 && (
                  <Typography variant="body2" sx={{ alignSelf: 'center', color: '#64748b' }}>
                    Found {filteredQuotes.length} quote{filteredQuotes.length !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
              <Grid container spacing={3}>
                {filteredQuotes.map((q) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={q.id}>
                    <Card sx={{ p: 2, border: '1px solid #e2e8f0', boxShadow: 'none', transition: 'all 0.2s', '&:hover': { boxShadow: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography fontWeight="600">{q.full_name}</Typography>
                        <Chip
                          label={q.status}
                          size="small"
                          sx={{ bgcolor: q.status === 'pending' ? '#f59e0b15' : q.status === 'contacted' ? '#3b82f615' : '#10b98115', color: q.status === 'pending' ? '#f59e0b' : q.status === 'contacted' ? '#3b82f6' : '#10b981' }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{q.email} | {q.phone}</Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}><strong>Service:</strong> {q.service_type}</Typography>
                      <Typography variant="body2"><strong>Location:</strong> {q.location}</Typography>
                      <Typography variant="body2"><strong>Message:</strong> {q.message?.substring(0, 100)}{q.message?.length > 100 ? '...' : ''}</Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                        <Select
                          size="small"
                          value={q.status}
                          onChange={(e) => handleUpdateQuoteStatus(q.id, e.target.value)}
                          sx={{ minWidth: 100 }}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="contacted">Contacted</MenuItem>
                          <MenuItem value="closed">Closed</MenuItem>
                        </Select>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDeleteQuote(q.id)} sx={{ color: '#ef4444' }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>{new Date(q.created_at).toLocaleString()}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              {filteredQuotes.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No quote requests found</Typography>
              )}
            </Card>
          )}

          {/* Assign Providers Tab - FIXED */}
          {activeTab === 4 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}>
                Assign Providers to Requests
              </Typography>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                Only verified providers who specialize in the requested service will appear.
              </Alert>
              
              {assignableRequests.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No requests awaiting provider assignment.
                </Typography>
              ) : (
                assignableRequests.map((r) => (
                  <Card key={r.id} sx={{ p: 2, mb: 2, border: '1px solid #e2e8f0', bgcolor: '#fef3c7' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography fontWeight="600">{r.service_name}</Typography>
                        <Typography variant="body2">Customer: {r.customer_name} ({r.customer_phone})</Typography>
                        <Typography variant="body2">Amount: <strong style={{ color: '#10b981' }}>GH₵{r.amount}</strong></Typography>
                        <Typography variant="body2">Provider payout: <strong style={{ color: '#10b981' }}>GH₵{r.provider_payout?.toFixed(2)} ({percentages.provider_percent}%)</strong></Typography>
                        <Typography variant="body2">📍 {r.location_address}, {r.location_city}, {r.location_region}</Typography>
                        <Chip 
                          label={`Service: ${r.service_name}`} 
                          size="small" 
                          sx={{ mt: 1, bgcolor: '#3b82f615', color: '#3b82f6' }} 
                        />
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', minWidth: 320 }}>
                        <FormControl fullWidth size="small" sx={{ minWidth: 250 }}>
                          <InputLabel>Select Provider</InputLabel>
                          <Select
                            value={selectedProviderForRequest[r.id] || ''}
                            onChange={(e) => {
                              setSelectedProviderForRequest(prev => ({ ...prev, [r.id]: e.target.value }))
                            }}
                            onOpen={() => {
                              if (!providersForRequest[r.id]) {
                                loadProvidersForRequest(r.id, r.service_id)
                              }
                            }}
                            label="Select Provider"
                          >
                            <MenuItem value="">-- Select a provider --</MenuItem>
                            {(providersForRequest[r.id] || []).map(p => (
                              <MenuItem key={p.id} value={p.id}>
                                {p.full_name} (⭐ {p.rating || 'New'} | {p.total_jobs || 0} jobs) - {p.service_specialization || 'Specialization'}
                              </MenuItem>
                            ))}
                            {(!providersForRequest[r.id] || providersForRequest[r.id].length === 0) && (
                              <MenuItem disabled>No verified providers available for this service</MenuItem>
                            )}
                          </Select>
                        </FormControl>
                        <Button
                          variant="contained"
                          onClick={() => handleAssignProvider(r.id, selectedProviderForRequest[r.id])}
                          disabled={!selectedProviderForRequest[r.id] || assigningRequest === r.id}
                          sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                        >
                          {assigningRequest === r.id ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Assign Provider'}
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                ))
              )}
            </Card>
          )}

          {/* Assigned Jobs Tab */}
          {activeTab === 5 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}>
                Assigned Jobs (In Progress)
              </Typography>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                Currently assigned jobs: {assignedRequests.length}
              </Alert>
              
              {assignedRequests.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No jobs currently assigned to providers.
                </Typography>
              ) : (
                assignedRequests.map((r) => (
                  <Card key={r.id} sx={{ p: 2, mb: 2, border: '1px solid #8b5cf6', bgcolor: '#ede9fe' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography fontWeight="600">{r.service_name}</Typography>
                        <Typography variant="body2">Customer: {r.customer_name} ({r.customer_phone})</Typography>
                        <Typography variant="body2">Provider: <strong>{r.provider_name}</strong> ({r.provider_phone})</Typography>
                        <Typography variant="body2">Amount: <strong style={{ color: '#10b981' }}>GH₵{r.amount}</strong></Typography>
                        <Typography variant="body2">Provider payout: <strong style={{ color: '#10b981' }}>GH₵{r.provider_payout?.toFixed(2)}</strong></Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">Status:</Typography>
                          <Chip label={r.status} size="small" sx={{ bgcolor: '#8b5cf615', color: '#8b5cf6' }} />
                        </Box>
                        <Typography variant="body2">📍 {r.location_address}, {r.location_city}, {r.location_region}</Typography>
                      </Box>
                      <Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleNotifyCustomer(r.id)}
                          sx={{ borderColor: '#f59e0b', color: '#f59e0b' }}
                        >
                          Notify Customer
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                ))
              )}
            </Card>
          )}

          {/* Comments Tab */}
          {activeTab === 6 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}>User Comments & Reviews</Typography>
              {filteredComments.length > 0 && (
                <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
                  Found {filteredComments.length} comment{filteredComments.length !== 1 ? 's' : ''}
                </Typography>
              )}
              <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                <Table sx={{ minWidth: 600 }}>
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Rating</TableCell>
                      <TableCell>Comment</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredComments.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: '#10b981', width: 32, height: 32 }}>{c.user_name?.charAt(0).toUpperCase()}</Avatar>
                            <Typography fontWeight="500">{c.user_name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Rating value={c.rating} readOnly size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }}>{c.comment}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">{new Date(c.created_at).toLocaleDateString()}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={c.is_approved ? 'Approved' : 'Hidden'}
                            size="small"
                            sx={{ bgcolor: c.is_approved ? '#10b98115' : '#ef444415', color: c.is_approved ? '#10b981' : '#ef4444' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={c.is_approved ? 'Hide' : 'Approve'}>
                            <IconButton size="small" onClick={() => handleToggleComment(c.id)} sx={{ color: c.is_approved ? '#f59e0b' : '#10b981' }}>
                              {c.is_approved ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDeleteComment(c.id)} sx={{ color: '#ef4444' }}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredComments.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  {searchTerm ? `No comments matching "${searchTerm}"` : 'No comments yet.'}
                </Typography>
              )}
            </Card>
          )}

          {/* Percentage Settings Tab */}
          {activeTab === 7 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}> Fee Distribution Percentages</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These percentages determine how each service payment is distributed.
                <strong> Total must equal 100%</strong>
              </Typography>
              
              {percentageError && (
                <Alert severity="error" sx={{ mb: 2 }}>{percentageError}</Alert>
              )}
              {percentageSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>{percentageSuccess}</Alert>
              )}
              

                
              <Grid container spacing={3}>
                  {/* Provider Percentage Card */}
                  <Grid size={{ xs: 12, md: 3 }}>
                      <Card sx={{ p: 2, bgcolor: '#f0fdf4', height: '100%' }}>
                          <Typography variant="subtitle1" fontWeight="600" sx={{ color: '#10b981', mb: 1 }}>
                              Provider Percentage
                          </Typography>
                          <TextField
                              fullWidth
                              type="number"
                              label="Provider %"
                              value={percentages.provider_percent}
                              onChange={(e) => setPercentages({...percentages, provider_percent: parseFloat(e.target.value) || 0})}
                              slotProps={{ input: { endAdornment: '%' } }}
                              sx={{ mb: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                              What providers earn from each job
                          </Typography>
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'white', borderRadius: 1 }}>
                              <Typography variant="body2">Example on GH₵500:</Typography>
                              <Typography variant="body2" fontWeight="600" sx={{ color: '#10b981' }}>
                                  Provider gets: GH₵{(500 * percentages.provider_percent / 100).toFixed(2)}
                              </Typography>
                          </Box>
                      </Card>
                  </Grid>
                  
                  {/* Admin Percentage Card */}
                  <Grid size={{ xs: 12, md: 3 }}>
                      <Card sx={{ p: 2, bgcolor: '#f3e8ff', height: '100%' }}>
                          <Typography variant="subtitle1" fontWeight="600" sx={{ color: '#8b5cf6', mb: 1 }}>
                              Admin Percentage
                          </Typography>
                          <TextField
                              fullWidth
                              type="number"
                              label="Admin %"
                              value={percentages.admin_percent}
                              onChange={(e) => setPercentages({...percentages, admin_percent: parseFloat(e.target.value) || 0})}
                              slotProps={{ input: { endAdornment: '%' } }}
                              sx={{ mb: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                              Platform admin fee
                          </Typography>
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'white', borderRadius: 1 }}>
                              <Typography variant="body2">Example on GH₵500:</Typography>
                              <Typography variant="body2" fontWeight="600" sx={{ color: '#8b5cf6' }}>
                                  Admin earns: GH₵{(500 * percentages.admin_percent / 100).toFixed(2)}
                              </Typography>
                          </Box>
                      </Card>
                  </Grid>
                  
                  {/* Site Fee Percentage Card */}
                  <Grid size={{ xs: 12, md: 3 }}>
                      <Card sx={{ p: 2, bgcolor: '#fef3c7', height: '100%' }}>
                          <Typography variant="subtitle1" fontWeight="600" sx={{ color: '#f59e0b', mb: 1 }}>
                              Site Fee Percentage
                          </Typography>
                          <TextField
                              fullWidth
                              type="number"
                              label="Site Fee %"
                              value={percentages.site_fee_percent}
                              onChange={(e) => setPercentages({...percentages, site_fee_percent: parseFloat(e.target.value) || 0})}
                              slotProps={{ input: { endAdornment: '%' } }}
                              sx={{ mb: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                              Maintenance & marketing fee
                          </Typography>
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'white', borderRadius: 1 }}>
                              <Typography variant="body2">Example on GH₵500:</Typography>
                              <Typography variant="body2" fontWeight="600" sx={{ color: '#f59e0b' }}>
                                  Site fee: GH₵{(500 * percentages.site_fee_percent / 100).toFixed(2)}
                              </Typography>
                          </Box>
                      </Card>
                  </Grid>
                  
                  {/* NEW: Referral Pool Percentage Card */}
                  <Grid size={{ xs: 12, md: 3 }}>
                      <Card sx={{ p: 2, bgcolor: '#e0f2fe', height: '100%', border: '2px solid #0284c7' }}>
                          <Typography variant="subtitle1" fontWeight="600" sx={{ color: '#0284c7', mb: 1 }}>
                              Referral Pool Percentage
                          </Typography>
                          <TextField
                              fullWidth
                              type="number"
                              label="Referral Pool %"
                              value={percentages.referral_pool_percent || 0}
                              onChange={(e) => setPercentages({...percentages, referral_pool_percent: parseFloat(e.target.value) || 0})}
                              slotProps={{ input: { endAdornment: '%' } }}
                              sx={{ mb: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                              Distributed to referrers (self, level 1, level 2, etc.)
                          </Typography>
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'white', borderRadius: 1 }}>
                              <Typography variant="body2">Example on GH₵500:</Typography>
                              <Typography variant="body2" fontWeight="600" sx={{ color: '#0284c7' }}>
                                  Referral pool: GH₵{(500 * (percentages.referral_pool_percent || 0) / 100).toFixed(2)}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                  Shared among all referrers in the chain
                              </Typography>
                          </Box>
                      </Card>
                  </Grid>
              </Grid>
              <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                  <Typography variant="body2">
                      <strong>Total: {(
                          percentages.provider_percent + 
                          percentages.admin_percent + 
                          percentages.site_fee_percent + 
                          (percentages.referral_pool_percent || 0)
                      ).toFixed(1)}%</strong>
                      {Math.abs(
                          percentages.provider_percent + 
                          percentages.admin_percent + 
                          percentages.site_fee_percent + 
                          (percentages.referral_pool_percent || 0) - 100
                      ) > 0.01 ? (
                          <span style={{ color: '#ef4444' }}> ❌ Must equal 100%</span>
                      ) : (
                          <span style={{ color: '#10b981' }}> ✓ Valid</span>
                      )}
                  </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={handleUpdatePercentages}
                disabled={actionLoading === true || Math.abs(percentages.provider_percent + percentages.admin_percent + percentages.site_fee_percent + (percentages.referral_pool_percent || 0) - 100) > 0.01}
                sx={{ mt: 3, bgcolor: '#10b981' }}
              >
                {actionLoading === true ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Update Percentages'}
              </Button>
            </Card>
          )}

          {/* Payment Settings Tab */}
          {activeTab === 8 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}> Payment Information Settings</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Update the payment numbers displayed on the payment flier across the platform for manual payments.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Payment Number"
                    value={paymentSettings.payment_number}
                    onChange={(e) => setPaymentSettings({...paymentSettings, payment_number: e.target.value})}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="MoMoPay Number"
                    value={paymentSettings.momopay_number}
                    onChange={(e) => setPaymentSettings({...paymentSettings, momopay_number: e.target.value})}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Support WhatsApp Number"
                    value={paymentSettings.support_number}
                    onChange={(e) => setPaymentSettings({...paymentSettings, support_number: e.target.value})}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="WhatsApp Chat Number (without +)"
                    value={paymentSettings.whatsapp_number}
                    onChange={(e) => setPaymentSettings({...paymentSettings, whatsapp_number: e.target.value})}
                  />
                </Grid>
              </Grid>
              <Button
                variant="contained"
                size="small"
                onClick={handleUpdatePaymentSettings}
                disabled={paymentSettingsLoading}
                sx={{ mt: 2, bgcolor: '#10b981' }}
              >
                {paymentSettingsLoading ? <CircularProgress size={20} /> : 'Save Payment Settings'}
              </Button>
            </Card>
          )}

          {/* All Requests History Tab */}
          {activeTab === 9 && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 3, color: '#0f172a' }}>
                All Service Requests (History)
              </Typography>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                Complete history of all service requests - {requests.length} total requests
              </Alert>
              <TableContainer component={Paper} sx={{ overflowX: 'auto', borderRadius: 2, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                <Table sx={{ minWidth: 600 }}>
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Provider Payout</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.id}</TableCell>
                        <TableCell>{r.customer_name}</TableCell>
                        <TableCell>{r.service_name}</TableCell>
                        <TableCell>GH₵{r.amount}</TableCell>
                        <TableCell sx={{ color: '#10b981' }}>GH₵{r.provider_payout?.toFixed(2)}</TableCell>
                        <TableCell><Chip label={r.status} size="small" /></TableCell>
                        <TableCell>{r.provider_name || 'Not assigned'}</TableCell>
                        <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {r.status === 'pending_approval' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              onClick={() => handleRejectRequest(r.id)}
                              disabled={actionLoading === r.id}
                              sx={{ mr: 1, mb: { xs: 1, sm: 0 } }}
                            >
                              Reject
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => handleDeleteRequestPermanently(r.id)}
                            disabled={actionLoading === r.id}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {requests.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No requests found.</Typography>
              )}
            </Card>
          )}



          
          {/* Service Modal */}
          <Dialog open={openServiceModal} onClose={() => { setOpenServiceModal(false); setEditingService(null) }} maxWidth="sm" fullWidth>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogContent>
              <TextField
                fullWidth
                label="Service Name"
                margin="normal"
                value={editingService?.name || newService.name}
                onChange={(e) => editingService ? setEditingService({...editingService, name: e.target.value}) : setNewService({...newService, name: e.target.value})}
              />
              <TextField
                fullWidth
                label="Description"
                margin="normal"
                multiline
                rows={3}
                value={editingService?.description || newService.description}
                onChange={(e) => editingService ? setEditingService({...editingService, description: e.target.value}) : setNewService({...newService, description: e.target.value})}
              />
              <TextField
                fullWidth
                label="Total Price (GH₵)"
                type="number"
                margin="normal"
                value={editingService?.total_price || newService.total_price}
                onChange={(e) => editingService ? setEditingService({...editingService, total_price: e.target.value}) : setNewService({...newService, total_price: e.target.value})}
              />
              <Alert severity="info" sx={{ mt: 2 }}>
                Based on current percentages:
                <br />Provider earns: GH₵{((editingService?.total_price || newService.total_price) * percentages.provider_percent / 100).toFixed(2)} ({percentages.provider_percent}%)
                <br />Admin fee: GH₵{((editingService?.total_price || newService.total_price) * percentages.admin_percent / 100).toFixed(2)} ({percentages.admin_percent}%)
                <br />Site fee: GH₵{((editingService?.total_price || newService.total_price) * percentages.site_fee_percent / 100).toFixed(2)} ({percentages.site_fee_percent}%)
              </Alert>
              <TextField
                fullWidth
                label="Icon (emoji)"
                margin="normal"
                value={editingService?.icon || newService.icon}
                onChange={(e) => editingService ? setEditingService({...editingService, icon: e.target.value}) : setNewService({...newService, icon: e.target.value})}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setOpenServiceModal(false); setEditingService(null) }}>Cancel</Button>
              <Button
                variant="contained"
                onClick={editingService ? handleUpdateService : handleCreateService}
                disabled={actionLoading === true}
                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
              >
                {actionLoading === true ? <CircularProgress size={24} sx={{ color: 'white' }} /> : (editingService ? 'Save Changes' : 'Create Service')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* User Full Details Modal */}
          <Dialog open={openUserModal} onClose={() => { setOpenUserModal(false); setSelectedUser(null); setSelectedUserDetails(null); setUserDetailsTab(0) }} maxWidth="md" fullWidth>
            <DialogTitle sx={{ bgcolor: '#10b981', color: 'white' }}>
              User Details: {selectedUser?.full_name}
            </DialogTitle>
            <DialogContent>
              {userDetailsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress sx={{ color: '#10b981' }} />
                </Box>
              ) : selectedUserDetails ? (
                <Box sx={{ mt: 2 }}>
                  <Card sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}> Basic Information</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">User ID</Typography>
                        <Typography variant="body2">#{selectedUserDetails.id}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Role</Typography>
                        <Chip label={selectedUserDetails.role} size="small" sx={{ bgcolor: '#e6f7f0', color: '#10b981' }} />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Email</Typography>
                        <Typography variant="body2">{selectedUserDetails.email}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Phone</Typography>
                        <Typography variant="body2">{selectedUserDetails.phone}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Joined</Typography>
                        <Typography variant="body2">{new Date(selectedUserDetails.created_at).toLocaleDateString()}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Status</Typography>
                        <Chip label={selectedUserDetails.is_active ? 'Active' : 'Suspended'} size="small" sx={{ bgcolor: selectedUserDetails.is_active ? '#10b98115' : '#ef444415', color: selectedUserDetails.is_active ? '#10b981' : '#ef4444' }} />
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Last Seen</Typography>
                        <Typography variant="body2">{selectedUserDetails.last_seen ? new Date(selectedUserDetails.last_seen).toLocaleString() : 'Never'}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Online Status</Typography>
                        <Chip label={selectedUserDetails.is_online ? 'Online' : 'Offline'} size="small" sx={{ bgcolor: selectedUserDetails.is_online ? '#10b98115' : '#64748b15', color: selectedUserDetails.is_online ? '#10b981' : '#64748b' }} />
                      </Grid>
                      {selectedUserDetails.role === 'provider' && selectedUserDetails.service_specialization && (
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">Service Specialization</Typography>
                          <Chip label={selectedUserDetails.service_specialization} size="small" sx={{ bgcolor: '#fef3c7', color: '#f59e0b', mt: 0.5 }} />
                        </Grid>
                      )}
                    </Grid>
                  </Card>

                  {selectedUserDetails.role === 'provider' && (
                    <Card sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>🔧 Provider Information</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Rating</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h5" fontWeight="700">{selectedUserDetails.rating || 0}</Typography>
                            <Rating value={selectedUserDetails.rating || 0} readOnly size="small" />
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Total Jobs</Typography>
                          <Typography variant="h5" fontWeight="700">{selectedUserDetails.total_jobs || 0}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Verified</Typography>
                          <Chip label={selectedUserDetails.is_verified ? 'Verified' : 'Pending'} size="small" sx={{ bgcolor: selectedUserDetails.is_verified ? '#10b98115' : '#f59e0b15', color: selectedUserDetails.is_verified ? '#10b981' : '#f59e0b' }} />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Total Earned</Typography>
                          <Typography variant="h5" fontWeight="700" sx={{ color: '#10b981' }}>GH₵{selectedUserDetails.total_earned?.toFixed(2) || 0}</Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  )}

                  {selectedUserDetails.role === 'customer' && (
                    <Card sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 1 }}>👤 Customer Information</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Total Spent</Typography>
                          <Typography variant="h5" fontWeight="700" sx={{ color: '#10b981' }}>GH₵{selectedUserDetails.total_spent?.toFixed(2) || 0}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Total Requests</Typography>
                          <Typography variant="h5" fontWeight="700">{selectedUserDetails.total_requests || 0}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Completed Requests</Typography>
                          <Typography variant="h5" fontWeight="700">{selectedUserDetails.completed_requests_count || 0}</Typography>
                        </Grid>
                      </Grid>
                    </Card>
                  )}

                  <Tabs value={userDetailsTab} onChange={(e, v) => setUserDetailsTab(v)} sx={{ mb: 2 }}>
                    <Tab label="Service Requests" />
                    <Tab label="Comments" />
                  </Tabs>

                  {userDetailsTab === 0 && (
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}> Service Requests History</Typography>
                      {selectedUserDetails.service_requests?.length > 0 ? (
                        <TableContainer component={Paper} sx={{ overflowX: 'auto', boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                          <Table size="small" sx={{ minWidth: 400 }}>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                              <TableRow>
                                <TableCell>Service</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Provider</TableCell>
                                <TableCell>Date</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {selectedUserDetails.service_requests.map((req) => (
                                <TableRow key={req.id}>
                                  <TableCell>{req.service_name}</TableCell>
                                  <TableCell>GH₵{req.amount}</TableCell>
                                  <TableCell><Chip label={req.status} size="small" /></TableCell>
                                  <TableCell>{req.provider_name || '-'}</TableCell>
                                  <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No service requests found.</Typography>
                      )}
                    </Card>
                  )}

                  {userDetailsTab === 1 && (
                    <Card sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>💬 Comments & Reviews</Typography>
                      {comments.filter(c => c.user_id === selectedUserDetails.id).length > 0 ? (
                        comments.filter(c => c.user_id === selectedUserDetails.id).map((comment) => (
                          <Box key={comment.id} sx={{ p: 1.5, mb: 1, bgcolor: '#f8fafc', borderRadius: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Rating value={comment.rating} readOnly size="small" />
                              <Typography variant="caption" color="text.secondary">{new Date(comment.created_at).toLocaleDateString()}</Typography>
                            </Box>
                            <Typography variant="body2">{comment.comment}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No comments found.</Typography>
                      )}
                    </Card>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No user details available.</Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setOpenUserModal(false); setSelectedUser(null); setSelectedUserDetails(null); }}>Close</Button>
              {selectedUser && selectedUser.role !== 'admin' && (
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleDeleteUser(selectedUser.id, selectedUser.full_name)}
                >
                  Delete Account
                </Button>
              )}
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
      
      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false)
          setUserToDelete(null)
        }}
        onConfirm={() => handleDeleteUser(userToDelete?.id, userToDelete?.full_name)}
        title="Delete User"
        message={`⚠️ Are you sure you want to delete "${userToDelete?.full_name || 'this user'}"?\n\nThis will permanently remove:\n• All service requests\n• All messages\n• All notifications\n• All comments\n\nThis action CANNOT be undone!`}
        confirmText="Delete Permanently"
        cancelText="Cancel"
        confirmColor="#ef4444"
        loading={actionLoading}
      />
      
      <RoleBasedTour />
      <TourButton tourSteps={adminTourSteps} title="Admin Dashboard Tour" />
    </>
  )
}

export default AdminDashboard
