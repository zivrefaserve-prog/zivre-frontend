import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Box, Container, Typography, Card, CardContent, Grid, Button,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, CircularProgress, Chip, Divider, IconButton,
  Tooltip, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Accordion, AccordionSummary, AccordionDetails,
  Avatar  // ← ADDED Avatar import
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import { useState, useEffect } from 'react'  // Make sure useState and useEffect are imported
import { 
  getMyReferralInfo, 
  getMyReferralTree, 
  getCommissionHistory, 
  requestWithdrawal, 
  getWithdrawalHistory, 
  getReferralKPIs,
  confirmWithdrawalReceipt
} from '../api/client'

const UserReferralDashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [myInfo, setMyInfo] = useState(null)
  const [tree, setTree] = useState(null)
  const [commissions, setCommissions] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [kpis, setKpis] = useState(null)
  const [toast, setToast] = useState(null)
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('mobile_money')
  const [accountDetails, setAccountDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = async () => {
    setRefreshing(true)
    try {
      const [infoRes, treeRes, commissionRes, withdrawalRes, kpisRes] = await Promise.all([
        getMyReferralInfo(),
        getMyReferralTree(),
        getCommissionHistory(),
        getWithdrawalHistory(),
        getReferralKPIs()
      ])
      setMyInfo(infoRes.data)
      setTree(treeRes.data.tree)
      setCommissions(commissionRes.data)
      setWithdrawals(withdrawalRes.data)
      setKpis(kpisRes.data)
    } catch (err) {
      console.error('Error loading referral data:', err)
      showToast('Error loading data', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const handleCopyLink = () => {
    if (myInfo?.referral_link) {
      navigator.clipboard.writeText(myInfo.referral_link)
      showToast('Referral link copied!', 'success')
    }
  }

  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < 20) {
      showToast('Minimum withdrawal amount is GHS20', 'error')
      return
    }
    if (amount > (myInfo?.commission_balance || 0)) {
      showToast('Insufficient balance', 'error')
      return
    }
    if (!accountDetails) {
      showToast('Please enter your account details', 'error')
      return
    }

    setSubmitting(true)
    try {
      await requestWithdrawal({
        amount: amount,
        payment_method: paymentMethod,
        account_details: accountDetails
      })
      showToast('Withdrawal request submitted successfully!', 'success')
      setWithdrawModalOpen(false)
      setWithdrawAmount('')
      setAccountDetails('')
      await loadData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Error submitting withdrawal', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmReceipt = async (withdrawalId) => {
    setSubmitting(true)
    try {
      await confirmWithdrawalReceipt(withdrawalId)
      showToast('Withdrawal confirmed successfully!', 'success')
      await loadData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Error confirming receipt', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ========== NEW VERTICAL TREE VIEW (Like your friend's) ==========
  const getPositionColor = (position) => {
    if (position === 'left') return '#2196f3'
    if (position === 'center') return '#9c27b0'
    if (position === 'right') return '#ff9800'
    return '#10b981'
  }

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || '?'
  }

// ========== MOBILE-FRIENDLY VERTICAL TREE VIEW ==========
  const TreeView = ({ node, level = 0 }) => {
    if (!node) return null
    
    const [expanded, setExpanded] = useState(true)
    const hasChildren = node.children && node.children.length > 0
    const isMobile = window.innerWidth <= 768
    
    const toggleExpand = () => {
      if (hasChildren) {
        setExpanded(!expanded)
      }
    }
    
    return (
      <Box sx={{ 
        ml: level === 0 ? 0 : { xs: 2, sm: 3 },
        mb: 1.5,
        borderLeft: level > 0 ? '2px solid #e2e8f0' : 'none',
        pl: level > 0 ? { xs: 1.5, sm: 2 } : 0
      }}>
        {/* Current Node Card */}
        <Paper
          elevation={1}
          onClick={toggleExpand}
          sx={{
            p: { xs: 1.5, sm: 2 },
            bgcolor: node.is_referral_active ? '#f0fdf4' : '#fefce8',
            borderLeft: `4px solid ${getPositionColor(node.position)}`,
            borderRadius: 2,
            cursor: hasChildren ? 'pointer' : 'default',
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: node.is_referral_active ? '#dcfce7' : '#fef9c3',
              transform: 'translateX(4px)'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Expand/Collapse Icon for children */}
            {hasChildren && (
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); toggleExpand() }}
                sx={{ p: 0.5 }}
              >
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
            
            {/* Avatar */}
            <Avatar 
              sx={{ 
                width: { xs: 40, sm: 48 }, 
                height: { xs: 40, sm: 48 }, 
                bgcolor: getPositionColor(node.position),
                fontSize: { xs: '1rem', sm: '1.25rem' },
                fontWeight: 'bold'
              }}
            >
              {getInitials(node.full_name)}
            </Avatar>
            
            {/* User Info */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                <Typography variant="body1" fontWeight="700" sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                  {node.full_name}
                </Typography>
                {node.position && (
                  <Chip
                    label={node.position.toUpperCase()}
                    size="small"
                    sx={{ 
                      height: 18, 
                      fontSize: '0.55rem',
                      fontWeight: 600,
                      bgcolor: `${getPositionColor(node.position)}20`,
                      color: getPositionColor(node.position)
                    }}
                  />
                )}
                <Chip
                  label={node.is_referral_active ? 'Active' : 'Inactive'}
                  size="small"
                  sx={{ 
                    height: 18, 
                    fontSize: '0.55rem',
                    bgcolor: node.is_referral_active ? '#10b98115' : '#f59e0b15',
                    color: node.is_referral_active ? '#10b981' : '#f59e0b'
                  }}
                />
              </Box>
              <Typography variant="body2" fontWeight="700" sx={{ color: '#10b981', fontSize: { xs: '0.8rem', sm: '0.85rem' } }}>
                GHS{node.commission_balance?.toFixed(2) || '0.00'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                Total earned: GHS{node.total_earned?.toFixed(2) || '0.00'}
              </Typography>
            </Box>
          </Box>
        </Paper>
  
        {/* Children Section - Collapsible */}
        {hasChildren && expanded && (
          <Box sx={{ mt: 1.5, ml: { xs: 2, sm: 3 } }}>
            {node.children.map((child) => (
              <TreeView key={child.id} node={child} level={level + 1} />
            ))}
          </Box>
        )}
      </Box>
    )
  }

  if (loading) {
    return (
      <>
        <Header hideNavLinks={true} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#10b981' }} />
        </Box>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header hideNavLinks={true} />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={toast?.type} sx={{ borderRadius: 2 }}>{toast?.message}</Alert>
        </Snackbar>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" fontWeight="800" sx={{ color: '#0f172a' }}>
            My Referrals
          </Typography>
          <IconButton onClick={loadData} disabled={refreshing}>
            {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Box>

        {/* Balance Card */}
        <Card sx={{ mb: 4, bgcolor: '#10b981', color: 'white' }}>
          <CardContent>
            <Grid container alignItems="center" spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WalletIcon sx={{ fontSize: 48 }} />
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Commission Balance</Typography>
                    <Typography variant="h3" fontWeight="800">GHS{myInfo?.commission_balance?.toFixed(2)}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Total Earned: GHS{myInfo?.total_earned?.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ textAlign: 'right' }}>
                  {myInfo?.commission_balance >= 20 && (
                    <Button
                      variant="contained"
                      onClick={() => setWithdrawModalOpen(true)}
                      sx={{ bgcolor: 'white', color: '#10b981', '&:hover': { bgcolor: '#f5f5f5' } }}
                    >
                      Request Withdrawal (Min GHS20)
                    </Button>
                  )}
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.8 }}>
                    {myInfo?.is_referral_active ? '✅ Account Active' : '⏳ Complete your first service to activate'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Referral Link Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Your Referral Link</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                size="small"
                value={myInfo?.referral_link || ''}
                InputProps={{ readOnly: true }}
                sx={{ flex: 1 }}
              />
              <Button variant="contained" startIcon={<CopyIcon />} onClick={handleCopyLink} sx={{ bgcolor: '#10b981' }}>
                Copy
              </Button>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Share this link with friends. When they sign up and complete a service, you earn commissions!
            </Typography>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <PeopleIcon sx={{ color: '#10b981', fontSize: 32, mb: 1 }} />
                <Typography variant="h4" fontWeight="700">{kpis?.downline_count || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Total Referrals</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUpIcon sx={{ color: '#10b981', fontSize: 32, mb: 1 }} />
                <Typography variant="h4" fontWeight="700">{kpis?.active_depth || 0}</Typography>
                <Typography variant="body2" color="text.secondary">Max Depth</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <WalletIcon sx={{ color: '#10b981', fontSize: 32, mb: 1 }} />
                <Typography variant="h4" fontWeight="700">GHS{kpis?.total_earned?.toFixed(2) || '0'}</Typography>
                <Typography variant="body2" color="text.secondary">Total Earned</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <HistoryIcon sx={{ color: '#10b981', fontSize: 32, mb: 1 }} />
                <Typography variant="h4" fontWeight="700">{commissions.length}</Typography>
                <Typography variant="body2" color="text.secondary">Commissions</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Referral Tree - NEW VERTICAL LAYOUT */}
        <Card sx={{ mb: 4 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight="600">My Referral Tree</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {tree ? (
                <Box sx={{ overflowX: 'auto', py: 3 }}>
                  <TreeView node={tree} />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No referrals yet. Share your link to build your team!
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Card>

        {/* Commission History */}
        <Card sx={{ mb: 4 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight="600">Commission History</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {commissions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">No commissions yet</TableCell>
                      </TableRow>
                    ) : (
                      commissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>{c.service_name}</TableCell>
                          <TableCell>
                            {c.level === 0 ? 'Self Bonus' : `Level ${c.level}`}
                          </TableCell>
                          <TableCell align="right" sx={{ color: '#10b981', fontWeight: 600 }}>
                            +GHS{c.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Card>

        {/* Withdrawal History */}
        <Card>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" fontWeight="600">Withdrawal History</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {withdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">No withdrawal requests yet</TableCell>
                      </TableRow>
                    ) : (
                      withdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell>{new Date(w.requested_at).toLocaleDateString()}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>GHS{w.amount.toFixed(2)}</TableCell>
                          <TableCell>{w.payment_method === 'mobile_money' ? 'Mobile Money' : w.payment_method}</TableCell>
                          <TableCell>
                            <Chip
                              label={
                                w.status === 'pending' ? 'Pending' :
                                w.status === 'admin_sent' ? 'Sent - Awaiting Confirmation' :
                                w.status === 'user_confirmed' ? 'Completed' : w.status
                              }
                              size="small"
                              sx={{
                                bgcolor: w.status === 'pending' ? '#fff3e0' : w.status === 'admin_sent' ? '#e3f2fd' : '#e8f5e9',
                                color: w.status === 'pending' ? '#ff9800' : w.status === 'admin_sent' ? '#2196f3' : '#4caf50'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {w.status === 'admin_sent' && (
                              <Button
                                size="small"
                                variant="contained"
                                onClick={() => handleConfirmReceipt(w.id)}
                                disabled={submitting}
                                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                              >
                                {submitting ? <CircularProgress size={20} /> : 'Confirm Receipt'}
                              </Button>
                            )}
                            {w.status === 'user_confirmed' && (
                              <Chip label="Completed" size="small" sx={{ bgcolor: '#e8f5e9', color: '#4caf50' }} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        </Card>
      </Container>

      {/* Withdrawal Modal */}
      <Dialog open={withdrawModalOpen} onClose={() => setWithdrawModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Request Withdrawal
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setWithdrawModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            Minimum withdrawal: GHS20. Your current balance: GHS{myInfo?.commission_balance?.toFixed(2)}
          </Alert>
          <TextField
            fullWidth
            label="Amount (GHS)"
            type="number"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            margin="normal"
            required
            inputProps={{ min: 20, max: myInfo?.commission_balance }}
          />
          <TextField
            fullWidth
            select
            label="Payment Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="mobile_money">Mobile Money (MTN, Vodafone, AirtelTigo)</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
          </TextField>
          <TextField
            fullWidth
            label="Account Details"
            value={accountDetails}
            onChange={(e) => setAccountDetails(e.target.value)}
            margin="normal"
            required
            multiline
            rows={2}
            placeholder="Mobile money number or bank account details"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWithdrawModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleWithdrawSubmit}
            disabled={submitting}
            sx={{ bgcolor: '#10b981' }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </>
  )
}

export default UserReferralDashboard
