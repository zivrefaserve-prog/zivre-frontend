import React, { useState, useEffect, useRef } from 'react'
import { IconButton, Badge, Menu, MenuItem, Typography, Box, Divider, CircularProgress, Tooltip, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import NotificationsIcon from '@mui/icons-material/Notifications'
import { getNotifications, markNotificationRead, markAllNotificationsRead, getUnreadCount, deleteNotification, deleteAllNotifications } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import DeleteIcon from '@mui/icons-material/Delete'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import ConfirmModal from './ConfirmModal'

// Helper for localStorage
const getStoredUnreadCount = (userId) => {
  const stored = localStorage.getItem(`notif_unread_${userId}`)
  return stored ? parseInt(stored) : 0
}

const setStoredUnreadCount = (userId, count) => {
  localStorage.setItem(`notif_unread_${userId}`, count.toString())
}

const NotificationDropdown = () => {
  const { user } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(() => getStoredUnreadCount(user?.id))
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [selectedNotificationId, setSelectedNotificationId] = useState(null)
  // FIX: Add state for viewing system notification modal
  const [viewNotificationOpen, setViewNotificationOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)
  
  const isFetchingRef = useRef(false)
  const isMarkingReadRef = useRef(false)

  const fetchNotifications = async () => {
    if (!user) return
    if (isFetchingRef.current) return
    
    isFetchingRef.current = true
    setLoading(true)
    try {
      const [notificationsRes, countRes] = await Promise.all([
        getNotifications(user.id),
        getUnreadCount(user.id)
      ])
      setNotifications(notificationsRes.data)
      const newCount = countRes.data.count
      setUnreadCount(newCount)
      setStoredUnreadCount(user.id, newCount)
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId)
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ))
      const newCount = Math.max(0, unreadCount - 1)
      setUnreadCount(newCount)
      setStoredUnreadCount(user.id, newCount)
    } catch (err) {
      console.error('Error marking notification read:', err)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    if (isMarkingReadRef.current) return
    if (unreadCount === 0) return
    
    isMarkingReadRef.current = true
    try {
      await markAllNotificationsRead(user.id)
      setUnreadCount(0)
      setStoredUnreadCount(user.id, 0)
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch (err) {
      console.error('Error marking all notifications read:', err)
    } finally {
      isMarkingReadRef.current = false
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleOpen = async (event) => {
    setAnchorEl(event.currentTarget)
    // Mark all as read when dropdown opens
    await markAllAsRead()
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // FIX: Modified handleNotificationClick - message notifications redirect, system notifications show modal
  const handleNotificationClick = async (notification) => {
    // Mark as read immediately
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    
    // For message notifications - redirect to messages (keep existing behavior)
    if (notification.type === 'message') {
      window.location.href = '/messages'
      handleClose()
      return
    }
    
    // For all other system notifications (job, success, info, warning, etc.) - show modal
    setSelectedNotification(notification)
    setViewNotificationOpen(true)
    handleClose()
  }

  // FIX: Close system notification modal
  const handleViewNotificationClose = () => {
    setViewNotificationOpen(false)
    setSelectedNotification(null)
  }

  const handleDeleteAll = async () => {
    setDeleteAllConfirmOpen(false)
    setLoading(true)
    try {
      await deleteAllNotifications(user.id)
      setNotifications([])
      setUnreadCount(0)
      setStoredUnreadCount(user.id, 0)
    } catch (err) {
      console.error('Error deleting all notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (notificationId, event) => {
    event.stopPropagation()
    setSelectedNotificationId(notificationId)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedNotificationId) return
    
    setDeleting(selectedNotificationId)
    try {
      const wasUnread = notifications.find(n => n.id === selectedNotificationId)?.read === false
      await deleteNotification(selectedNotificationId)
      if (wasUnread) {
        const newCount = Math.max(0, unreadCount - 1)
        setUnreadCount(newCount)
        setStoredUnreadCount(user.id, newCount)
      }
      setNotifications(prev => prev.filter(n => n.id !== selectedNotificationId))
    } catch (err) {
      console.error('Error deleting notification:', err)
    } finally {
      setDeleting(null)
      setSelectedNotificationId(null)
      setDeleteConfirmOpen(false)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'job': return '🔧'
      case 'referral': return '💰'
      case 'message': return '💬'
      default: return '📢'
    }
  }

  return (
    <>
      <IconButton onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{ paper: { sx: { width: 380, maxHeight: 500, mt: 1.5 } } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {unreadCount > 0 && (
              <Tooltip title="Mark all as read">
                <IconButton size="small" onClick={markAllAsRead} sx={{ color: '#10b981' }}>
                  <DoneAllIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {notifications.length > 0 && (
              <Tooltip title="Delete all notifications">
                <IconButton size="small" onClick={() => setDeleteAllConfirmOpen(true)} sx={{ color: '#ef4444' }}>
                  <DeleteSweepIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} sx={{ color: '#10b981' }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">No notifications</Typography>
          </Box>
        ) : (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              sx={{
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                bgcolor: notification.read ? 'transparent' : '#f0fdf4',
                borderBottom: '1px solid #e2e8f0',
                p: 1.5,
                display: 'block'
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', width: '100%' }}>
                <Typography variant="h6">{getNotificationIcon(notification.type)}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(notification.created_at).toLocaleString()}
                  </Typography>
                </Box>
                <Tooltip title="Delete">
                  <IconButton 
                    size="small" 
                    onClick={(e) => handleDeleteClick(notification.id, e)}
                    disabled={deleting === notification.id}
                    sx={{ color: '#ef4444' }}
                  >
                    {deleting === notification.id ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* FIX: Modal for system notifications - shows message bigger without redirect */}
      <Dialog 
        open={viewNotificationOpen} 
        onClose={handleViewNotificationClose} 
        maxWidth="sm" 
        fullWidth
        // FIX: Add disableEnforceFocus to fix aria-hidden warning
        disableEnforceFocus
      >
        <DialogTitle sx={{ bgcolor: '#10b981', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5">{getNotificationIcon(selectedNotification?.type)}</Typography>
            <Typography variant="h6" component="span">
              {selectedNotification?.type === 'job' ? 'Job Update' : 
               selectedNotification?.type === 'success' ? 'Success' :
               selectedNotification?.type === 'warning' ? 'Warning' :
               selectedNotification?.type === 'error' ? 'Error' : 'Notification'}
            </Typography>
          </Box>
          <IconButton onClick={handleViewNotificationClose} sx={{ color: 'white' }}>
            ✕
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {selectedNotification?.message}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            {selectedNotification?.created_at && new Date(selectedNotification.created_at).toLocaleString()}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleViewNotificationClose} variant="contained" sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Notification"
        message="Are you sure you want to delete this notification?"
        confirmText="Delete"
        confirmColor="#ef4444"
        loading={deleting !== null}
      />

      <ConfirmModal
        open={deleteAllConfirmOpen}
        onClose={() => setDeleteAllConfirmOpen(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Notifications"
        message="Are you sure you want to delete ALL notifications? This action cannot be undone."
        confirmText="Delete All"
        confirmColor="#ef4444"
        loading={loading}
      />
    </>
  )
}

export default NotificationDropdown