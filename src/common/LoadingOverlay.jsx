import React from 'react'
import { Backdrop, CircularProgress, Typography, Box, Fade } from '@mui/material'

const LoadingOverlay = ({ open, message = 'Loading...' }) => {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2
      }}
      open={open}
      transitionDuration={300}  // ← CHANGE BACK to 300
    >
      <Fade in={open} timeout={500}>  // ← CHANGE BACK to 500
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={70} sx={{ color: '#10b981', mb: 3 }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            {message}
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>
            Please wait...
          </Typography>
        </Box>
      </Fade>
    </Backdrop>
  )
}

export default LoadingOverlay
