import React from 'react'
import { Dialog, DialogTitle, DialogContent, Box, Button, Typography, Card, CardContent } from '@mui/material'
import PersonIcon from '@mui/icons-material/Person'
import BuildIcon from '@mui/icons-material/Build'

const RoleModal = ({ onSelect, onClose }) => {
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth disableEnforceFocus>
      <DialogTitle sx={{ textAlign: 'center', pt: 4 }}>
        <Typography variant="h4" component="span" fontWeight="800">Join Zivre Platform</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Choose how you want to use our services</Typography>
      </DialogTitle>
      <DialogContent sx={{ pb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 2 }}>
          <Card sx={{ cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }} onClick={() => onSelect('customer')}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <PersonIcon sx={{ fontSize: 56, color: '#10b981', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold">Customer</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>Request facility services, track jobs, earn referrals</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 4, bgcolor: '#10b981', borderRadius: '50%' }} />
                  <Typography variant="caption">Quality services</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 4, bgcolor: '#10b981', borderRadius: '50%' }} />
                  <Typography variant="caption">Earn up to 3x spend</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 4, bgcolor: '#10b981', borderRadius: '50%' }} />
                  <Typography variant="caption">24/7 support</Typography>
                </Box>
              </Box>
              <Button variant="contained" fullWidth sx={{ bgcolor: '#10b981' }}>Sign Up as Customer</Button>
            </CardContent>
          </Card>
          <Card sx={{ cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }} onClick={() => onSelect('provider')}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <BuildIcon sx={{ fontSize: 56, color: '#10b981', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold">Service Provider</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>Offer your services, get jobs, earn money</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-start', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 4, bgcolor: '#10b981', borderRadius: '50%' }} />
                  <Typography variant="caption">Get verified jobs</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 4, bgcolor: '#10b981', borderRadius: '50%' }} />
                  <Typography variant="caption">Set your own schedule</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 4, bgcolor: '#10b981', borderRadius: '50%' }} />
                  <Typography variant="caption">Grow your business</Typography>
                </Box>
              </Box>
              <Button variant="contained" fullWidth sx={{ bgcolor: '#10b981' }}>Sign Up as Provider</Button>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>
    </Dialog>
  )
}

export default RoleModal