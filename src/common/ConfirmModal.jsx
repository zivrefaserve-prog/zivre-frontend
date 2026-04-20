import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress } from '@mui/material'

const ConfirmModal = ({ 
  open, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  confirmColor = "#ef4444",
  loading = false 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xs" 
      fullWidth 
      disableEnforceFocus
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, color: '#0f172a' }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ color: '#64748b' }}>
          {cancelText}
        </Button>
        <Button 
          variant="contained" 
          onClick={onConfirm} 
          disabled={loading}
          sx={{ bgcolor: confirmColor, '&:hover': { bgcolor: confirmColor === "#ef4444" ? "#dc2626" : "#059669" } }}
        >
          {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmModal