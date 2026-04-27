import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { 
  Container, Paper, Typography, Button, Box, Alert, 
  CircularProgress, Divider, TextField
} from '@mui/material'
import { Receipt, Verified } from '@mui/icons-material'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import { verifyTransaction } from '../api/client'

const VerifyReceipt = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [manualTxId, setManualTxId] = useState('')
  const [manualVerifying, setManualVerifying] = useState(false)
  const [manualResult, setManualResult] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const txId = params.get('txn')
    
    if (txId) {
      verifyTransactionManual(txId)
    } else {
      setLoading(false)
    }
  }, [location])

  const verifyTransactionManual = async (txId) => {
    setLoading(true)
    setError('')
    try {
      const res = await verifyTransaction(txId)
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction not found')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleManualVerify = async () => {
    if (!manualTxId.trim()) {
      setManualResult({ error: 'Please enter a Transaction ID' })
      return
    }
    setManualVerifying(true)
    setManualResult(null)
    try {
      const res = await verifyTransaction(manualTxId)
      setManualResult(res.data)
    } catch (err) {
      setManualResult({ error: err.response?.data?.message || 'Transaction not found' })
    } finally {
      setManualVerifying(false)
    }
  }

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <>
        <Header onGetQuote={scrollToContact} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#10b981' }} />
        </Box>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header onGetQuote={scrollToContact} />
      
      <Container maxWidth="sm" sx={{ py: 6 }}>
        <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          
          <Receipt sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
          
          <Typography variant="h5" fontWeight="800" sx={{ color: '#0f172a', mb: 1 }}>
            Verify Withdrawal Receipt
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Enter a Transaction ID to verify its authenticity
          </Typography>
          
          {/* Manual Entry Form */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              size="small"
              label="Transaction ID"
              placeholder="ZIV-WD-XXXXXXXX"
              value={manualTxId}
              onChange={(e) => setManualTxId(e.target.value.toUpperCase())}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleManualVerify}
              disabled={manualVerifying}
              sx={{ bgcolor: '#10b981', minWidth: 100 }}
            >
              {manualVerifying ? <CircularProgress size={24} /> : 'Verify'}
            </Button>
          </Box>
          
          {/* Manual Verification Result */}
          {manualResult && (
            <Alert 
              severity={manualResult.error ? 'error' : 'success'} 
              sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}
            >
              {manualResult.error ? (
                <Typography>{manualResult.error}</Typography>
              ) : (
                <Box>
                  <Typography variant="subtitle1" fontWeight="700" sx={{ mb: 1 }}>
                    ✓ Valid Receipt
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2"><strong>Transaction ID:</strong> {manualResult.transaction.transaction_id}</Typography>
                  <Typography variant="body2"><strong>Amount:</strong> GHS{manualResult.transaction.amount}</Typography>
                  <Typography variant="body2"><strong>Recipient:</strong> {manualResult.transaction.recipient_name}</Typography>
                  <Typography variant="body2"><strong>Status:</strong> {manualResult.transaction.status}</Typography>
                  <Typography variant="body2"><strong>Date:</strong> {new Date(manualResult.transaction.processed_at).toLocaleString()}</Typography>
                </Box>
              )}
            </Alert>
          )}
          
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">OR</Typography>
          </Divider>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Scan the QR code on your receipt to automatically verify
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<Verified />}
            onClick={() => navigate('/')}
            sx={{ borderColor: '#10b981', color: '#10b981', textTransform: 'none' }}
          >
            Back to Home
          </Button>
        </Paper>
      </Container>
      
      <Footer />
    </>
  )
}

export default VerifyReceipt
