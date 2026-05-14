import React, { useState, useEffect } from 'react'
import { Drawer, Box, Typography, IconButton, List, ListItem, Chip, Button, Divider, CircularProgress } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { getUserRequests, cancelRequest, confirmRequestCompletion } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const CartDrawer = ({ open, onClose }) => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  const loadRequests = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await getUserRequests(user.id)
      const active = res.data
        .filter(r => !['confirmed','cancelled_by_customer','rejected_by_admin','declined_by_provider'].includes(r.status))
        .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 20);
      setRequests(active)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) loadRequests()
  }, [open, user])

  const handleCancel = async (requestId) => {
    if (!window.confirm('Cancel this request?')) return
    setActionLoading(requestId)
    try {
      await cancelRequest(requestId)
      await loadRequests()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel')
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmCompletion = async (requestId) => {
    if (!window.confirm('Confirm that the service is completed and you will pay the provider directly?')) return
    setActionLoading(requestId)
    try {
      await confirmRequestCompletion(requestId)
      alert('✅ Completion confirmed! Thank you for using Zivre!')
      await loadRequests()
    } catch (err) {
      alert(err.response?.data?.error || 'Error confirming completion')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusChip = (status) => {
    const config = {
      pending_approval: { label: 'Pending Approval', color: '#f59e0b' },
      assigned: { label: 'Assigned', color: '#8b5cf6' },
      in_progress: { label: 'In Progress', color: '#ec4898' },
      completed: { label: 'Waiting Confirmation', color: '#f59e0b' },
      confirmed: { label: 'Confirmed', color: '#10b981' }
    }
    const c = config[status] || { label: status, color: '#64748b' }
    return <Chip label={c.label} size="small" sx={{ bgcolor: `${c.color}15`, color: c.color }} />
  }

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 450 }, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="700">🛒 My Active Requests</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : requests.length === 0 ? (
          <Typography sx={{ p: 4, textAlign: 'center' }}>No active requests.</Typography>
        ) : (
          <List sx={{ mt: 2 }}>
            {requests.map(req => (
              <ListItem key={req.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2, border: '1px solid #e2e8f0', borderRadius: 2, p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 1 }}>
                  <Typography fontWeight="600">{req.service_name}</Typography>
                  {getStatusChip(req.status)}
                </Box>
                {req.components_data && req.components_data.length > 0 && (
                  <Box sx={{ width: '100%', mb: 1, pl: 2 }}>
                    <Typography variant="caption" color="text.secondary">Components:</Typography>
                    {req.components_data.map((comp, idx) => (
                      <Typography key={idx} variant="body2" sx={{ fontSize: '0.8rem' }}>
                        {comp.quantity} x {comp.name} (GHS{comp.unit_price}) = GHS{comp.subtotal}
                      </Typography>
                    ))}
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 1 }}>
                  <Typography variant="body2">📍 {req.location_city}, {req.location_region}</Typography>
                  <Typography fontWeight="700" sx={{ color: '#10b981' }}>GHS{req.amount.toFixed(2)}</Typography>
                </Box>
                {req.provider_name && <Typography variant="caption">Provider: {req.provider_name} ({req.provider_phone})</Typography>}
                
                {/* Cancel button for pending/assigned */}
                {(req.status === 'pending_approval' || req.status === 'assigned') && (
                  <Button size="small" variant="outlined" color="error" onClick={() => handleCancel(req.id)} disabled={actionLoading === req.id} sx={{ mt: 1 }}>
                    {actionLoading === req.id ? <CircularProgress size={16} /> : 'Cancel Request'}
                  </Button>
                )}

                {/* Confirm button for completed waiting confirmation */}
                {req.status === 'completed' && !req.customer_confirmed && (
                  <Button size="small" variant="contained" onClick={() => handleConfirmCompletion(req.id)} disabled={actionLoading === req.id} sx={{ mt: 1, bgcolor: '#10b981' }}>
                    {actionLoading === req.id ? <CircularProgress size={16} sx={{ color: 'white' }} /> : 'Confirm Completion & Pay Provider'}
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  )
}

export default CartDrawer
