import React, { useState, useEffect } from 'react'
import { Box, Fade, Chip, CircularProgress } from '@mui/material'
import { Refresh as RefreshIcon, CheckCircle as CheckIcon } from '@mui/icons-material'

const RefreshIndicator = ({ lastRefreshed, isRefreshing }) => {
  const [visible, setVisible] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (isRefreshing) {
      setVisible(true)
      setShowSuccess(false)
    } else if (lastRefreshed && visible) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setShowSuccess(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isRefreshing, lastRefreshed, visible])

  if (!visible) return null

  return (
    <Fade in={visible}>
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <Chip
          icon={
            isRefreshing ? (
              <CircularProgress size={16} sx={{ color: '#10b981' }} />
            ) : showSuccess ? (
              <CheckIcon sx={{ color: '#10b981', fontSize: 16 }} />
            ) : (
              <RefreshIcon sx={{ color: '#10b981', fontSize: 16 }} />
            )
          }
          label={isRefreshing ? 'Updating...' : showSuccess ? 'Updated!' : 'Refreshed'}
          sx={{
            bgcolor: 'white',
            color: '#10b981',
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            animation: isRefreshing ? 'pulse 1s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { opacity: 0.7 },
              '50%': { opacity: 1 },
              '100%': { opacity: 0.7 }
            }
          }}
        />
      </Box>
    </Fade>
  )
}

export default RefreshIndicator