import React, { useState, useEffect, useCallback } from 'react'
import { Box, Card, CardContent, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, IconButton, CircularProgress, Alert, Divider } from '@mui/material'
import { WhatsApp, ContentCopy, Close, Warning, PhoneAndroid, AccountBalance } from '@mui/icons-material'
import { getPaymentSettings } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const PaymentFlier = () => {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [settings, setSettings] = useState({
    payment_number: '024 000 0000',
    momopay_number: '024 000 0000',
    support_number: '050 000 0000',
    whatsapp_number: '233500000000'
  })
  const [loading, setLoading] = useState(true)

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await getPaymentSettings()
      setSettings(res.data)
    } catch (err) {
      console.error('Failed to load payment settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  // ========== REALTIME PAYMENT SETTINGS UPDATE LISTENER ==========
  useEffect(() => {
    const handlePaymentSettingsUpdated = (event) => {
      console.log('💰 Payment settings updated in realtime:', event.detail)
      setSettings(event.detail)
      setLoading(false)
    }

    window.addEventListener('payment_settings_updated', handlePaymentSettingsUpdated)

    return () => {
      window.removeEventListener('payment_settings_updated', handlePaymentSettingsUpdated)
    }
  }, [])

  // Set up an interval to refresh settings every 30 seconds as fallback
  useEffect(() => {
    const interval = setInterval(() => {
      loadSettings()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [loadSettings])

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <Card sx={{ mb: 2, borderRadius: 2, bgcolor: '#0f3b2c', p: 2 }}>
        <CircularProgress size={24} sx={{ color: 'white' }} />
      </Card>
    )
  }

  return (
    <>
      {/* Moving Ticker - KEPT EXACTLY THE SAME */}
      <Card 
        onClick={() => setOpen(true)}
        sx={{ 
          mb: 2, 
          borderRadius: 2,
          bgcolor: '#0f3b2c',
          color: 'white',
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': { bgcolor: '#1a5a44', transform: 'scale(1.01)' },
          overflow: 'hidden'
        }}
      >
        <CardContent sx={{ p: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            animation: 'scroll 20s linear infinite',
            whiteSpace: 'nowrap',
            '@keyframes scroll': {
              '0%': { transform: 'translateX(100%)' },
              '100%': { transform: 'translateX(-100%)' }
            },
            '&:hover': { animationPlayState: 'paused' }
          }}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 'bold' }}>
              💳 <strong>Tap here for payment info →</strong>
            </Typography>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <strong>Send money to:</strong> {settings.payment_number}
            </Typography>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <strong>MoMoPay:</strong> {settings.momopay_number}
            </Typography>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <strong>Works with:</strong> MTN | Vodafone | AirtelTigo
            </Typography>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
               <strong>Need help?</strong> WhatsApp {settings.support_number}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Modal Dialog - UPDATED WITH CORRECT PAYMENT STEPS */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#0f3b2c', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div" fontWeight="bold">How to Pay</Typography>
          <IconButton onClick={() => setOpen(false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            {/* IMPORTANT NOTICE - PAY AFTER SERVICE */}
            <Alert severity="warning" icon={<Warning />} sx={{ borderRadius: 2 }}>
              <Typography variant="body2" fontWeight="bold"> IMPORTANT</Typography>
              <Typography variant="body2">You pay the provider <strong>AFTER they complete the service</strong>. Never pay before service is done.</Typography>
            </Alert>

            {/* Payment Number Box */}
            <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary"> Send payment to this number</Typography>
              <Typography variant="h4" fontWeight="800" sx={{ color: '#10b981', fontFamily: 'monospace', letterSpacing: 1 }}>
                {settings.payment_number}
              </Typography>
              <Button 
                size="small" 
                startIcon={<ContentCopy />} 
                onClick={() => handleCopy(settings.payment_number)}
                sx={{ mt: 1, fontWeight: 'bold' }}
              >
                {copied ? '✓ Copied!' : 'Copy number'}
              </Button>
            </Box>

            {/* MoMoPay Number */}
            <Box sx={{ p: 2, bgcolor: '#e0f2fe', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary"> MoMoPay Number (Alternative)</Typography>
              <Typography variant="h4" fontWeight="800" sx={{ color: '#0284c7', fontFamily: 'monospace', letterSpacing: 1 }}>
                {settings.momopay_number}
              </Typography>
            </Box>

            {/* Payment Methods */}
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Accepted Payment Methods:</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>• <strong>MTN Mobile Money</strong> - Dial *170#</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>• <strong>Vodafone Cash</strong> - Dial *110#</Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>• <strong>AirtelTigo Money</strong> - Dial *110#</Typography>
              <Typography variant="body2">• <strong>Cash</strong> - Pay directly to the provider</Typography>
            </Box>

            {/* Step by Step Guide */}
            <Box sx={{ p: 1.5, bgcolor: '#fef3c7', borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>How to Pay (Mobile Money):</Typography>
              
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Step 1:</strong> Dial your network's short code:
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5, ml: 2 }}>• MTN: <strong>*170#</strong> → Select "Send Money and follow due process."</Typography>
              <Typography variant="body2" sx={{ mb: 0.5, ml: 2 }}>• Vodafone: <strong>*110#</strong> → Select "Send Money and follow due process."</Typography>
              <Typography variant="body2" sx={{ mb: 1, ml: 2 }}>• AirtelTigo: <strong>*110#</strong> → Select "Send Money and follow due process."</Typography>
              
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Step 2:</strong> Enter recipient number: <strong>{settings.payment_number}</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Step 3:</strong> Enter the exact amount shown on the service
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Step 4:</strong> Enter your <strong>Reference</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Step 5:</strong> Enter your Mobile Money PIN to confirm
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Step 6:</strong> Take a screenshot of the payment confirmation
              </Typography>
            </Box>

            {/* WhatsApp Support */}
            <Box sx={{ p: 1.5, bgcolor: '#25D366', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'white', flexWrap: 'wrap' }}>
              <WhatsApp />
              <Typography variant="body2" fontWeight="bold">WhatsApp Support: {settings.support_number}</Typography>
              <Button 
                size="small" 
                variant="contained" 
                sx={{ bgcolor: 'white', color: '#25D366', ml: 'auto', '&:hover': { bgcolor: '#f0f0f0' }, fontWeight: 'bold' }}
                onClick={() => window.open(`https://wa.me/${settings.whatsapp_number}`, '_blank')}
              >
                Chat with us
              </Button>
            </Box>

            {/* Final Note */}
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="caption" display="block">
                 <strong>Note:</strong> Zivre does NOT collect payments. You pay the provider directly after service completion.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} fullWidth variant="contained" sx={{ bgcolor: '#10b981', fontWeight: 'bold' }}>
            Got it, thanks 👍
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PaymentFlier