import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Box, Container, Typography, Card, CardContent, Grid, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Snackbar, CircularProgress, IconButton,
  Tab, Tabs, Avatar, Tooltip, Divider
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  People as PeopleIcon,
  Paid as PaidIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import {
  getPendingWithdrawals,
  markWithdrawalAsSent,
  getOwnerNetSummary,
  getPendingBookingsForCommission,
  getServices,
  updateServiceShares,
  getUserTreeForAdmin,
  getPercentages   // ← ADD THIS
} from '../api/client'

const AdminReferralDashboard = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pendingWithdrawals, setPendingWithdrawals] = useState([])
  const [ownerNet, setOwnerNet] = useState(null)
  const [pendingBookings, setPendingBookings] = useState([])
  const [services, setServices] = useState([])
  const [tabValue, setTabValue] = useState(0)
  const [toast, setToast] = useState(null)
  const [markSentModalOpen, setMarkSentModalOpen] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [searchUserId, setSearchUserId] = useState('')
  const [searchedTree, setSearchedTree] = useState(null)
  const [editingService, setEditingService] = useState(null)
  const [editSharesOpen, setEditSharesOpen] = useState(false)
  const [percentages, setPercentages] = useState({
    provider_percent: 60,
    admin_percent: 20,
    site_fee_percent: 10,
    referral_pool_percent: 10
  })
  const [editSharesData, setEditSharesData] = useState({ admin_share: '', website_share: '', provider_share: '', referral_pool: '' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadPercentages = async () => {
    try {
        const res = await getPercentages()
        setPercentages(res.data)
    } catch (err) {
        console.error('Error loading percentages:', err)
    }
  }
  const loadData = async () => {
      setRefreshing(true)
      try {
        const [withdrawalsRes, ownerNetRes, bookingsRes, servicesRes] = await Promise.all([
          getPendingWithdrawals(),
          getOwnerNetSummary(),
          getPendingBookingsForCommission(),
          getServices(false)
        ])
        setPendingWithdrawals(withdrawalsRes.data)
        setOwnerNet(ownerNetRes.data)
        setPendingBookings(bookingsRes.data)
        setServices(servicesRes.data)
        await loadPercentages()  // ← ADD THIS LINE
      } catch (err) {
        console.error('Error loading admin referral data:', err)
        showToast('Error loading data', 'error')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData()
    } else {
      window.location.href = '/'
    }
  }, [user])

  const handleMarkAsSent = async () => {
    if (!selectedWithdrawal) return
    
    setActionLoading(true)
    try {
      await markWithdrawalAsSent(selectedWithdrawal.id, { notes: adminNotes })
      showToast('Withdrawal marked as sent!', 'success')
      setMarkSentModalOpen(false)
      setSelectedWithdrawal(null)
      setAdminNotes('')
      await loadData()
    } catch (err) {
      showToast(err.response?.data?.error || 'Error marking withdrawal', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSearchUserTree = async () => {
    if (!searchUserId) {
      showToast('Please enter a user ID', 'error')
      return
    }
    setActionLoading(true)
    try {
      const res = await getUserTreeForAdmin(parseInt(searchUserId))
      setSearchedTree(res.data.tree)
    } catch (err) {
      showToast(err.response?.data?.error || 'User not found', 'error')
      setSearchedTree(null)
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateShares = async () => {
      if (!editingService) return
      
      const total = parseFloat(editSharesData.admin_share) + 
                    parseFloat(editSharesData.website_share) + 
                    parseFloat(editSharesData.provider_share) +
                    parseFloat(editSharesData.referral_pool)
      
      if (Math.abs(total - 100) > 0.01) {
          showToast('Total shares must equal 100%', 'error')
          return
      }
      
      setActionLoading(true)
      try {
          await updateServiceShares(editingService.id, {
              admin_share_percent: parseFloat(editSharesData.admin_share),
              website_share_percent: parseFloat(editSharesData.website_share),
              provider_share_percent: parseFloat(editSharesData.provider_share),
              referral_pool_percent: parseFloat(editSharesData.referral_pool)
          })
          showToast('Service shares updated successfully!', 'success')
          setEditSharesOpen(false)
          setEditingService(null)
          await loadData()
      } catch (err) {
          showToast(err.response?.data?.error || 'Error updating shares', 'error')
      } finally {
          setActionLoading(false)
      }
  }

  const TreeView = ({ node, level = 0 }) => {
    if (!node) return null
    return (
      <Box sx={{ ml: level * 4, mb: 1 }}>
        <Paper variant="outlined" sx={{ p: 1.5, display: 'inline-block', minWidth: 200 }}>
          <Typography variant="body2" fontWeight="600">
            {node.full_name} (ID: {node.id})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {node.is_referral_active ? 'Active' : 'Inactive'} • Balance: GHS{node.commission_balance}
          </Typography>
          {node.position && (
            <Chip label={node.position.toUpperCase()} size="small" sx={{ ml: 1, height: 20 }} />
          )}
        </Paper>
        {node.children && node.children.length > 0 && (
          <Box sx={{ mt: 1 }}>
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
            Referral System Admin
          </Typography>
          <IconButton onClick={loadData} disabled={refreshing}>
            {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
          </IconButton>
        </Box>

        {/* Owner Net Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: '#e8f5e9' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUpIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Referral Pool</Typography>
                    <Typography variant="h4" fontWeight="700">GHS{ownerNet?.total_referral_pool?.toFixed(2) || '0'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: '#fff3e0' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PaidIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Commissions Paid</Typography>
                    <Typography variant="h4" fontWeight="700">GHS{ownerNet?.total_commissions_paid?.toFixed(2) || '0'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ bgcolor: '#e3f2fd' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ReceiptIcon sx={{ fontSize: 40, color: '#2196f3' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Owner Net (Your Profit)</Typography>
                    <Typography variant="h4" fontWeight="700">GHS{ownerNet?.total_owner_net?.toFixed(2) || '0'}</Typography>
                    <Typography variant="caption" color="text.secondary">From {ownerNet?.total_bookings || 0} bookings</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3 }}>
          <Tab label="Pending Withdrawals" icon={<PaidIcon />} iconPosition="start" />
          <Tab label="Pending Bookings" icon={<CheckIcon />} iconPosition="start" />
          <Tab label="Service Shares" icon={<TrendingUpIcon />} iconPosition="start" />
          <Tab label="User Tree Viewer" icon={<SearchIcon />} iconPosition="start" />
        </Tabs>

        {/* Tab 0: Pending Withdrawals */}
        {tabValue === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Pending Withdrawal Requests</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                          <TableCell>Service</TableCell>
                          <TableCell align="center">Admin Share (%)</TableCell>
                          <TableCell align="center">Website Share (%)</TableCell>
                          <TableCell align="center">Provider Share (%)</TableCell>
                          <TableCell align="center">Referral Pool (%)</TableCell>
                          <TableCell align="center">Total</TableCell>
                          <TableCell>Actions</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingWithdrawals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No pending withdrawals</TableCell>
                      </TableRow>
                    ) : (
                      pendingWithdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ bgcolor: '#10b981', width: 32, height: 32 }}>
                                {w.user_name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="500">{w.user_name}</Typography>
                                <Typography variant="caption" color="text.secondary">{w.user_email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#10b981' }}>GHS{w.amount.toFixed(2)}</TableCell>
                          <TableCell>{w.payment_method === 'mobile_money' ? 'Mobile Money' : w.payment_method}</TableCell>
                          <TableCell>
                            <Typography variant="body2">{w.account_details}</Typography>
                            <Typography variant="caption" color="text.secondary">{w.user_phone}</Typography>
                          </TableCell>
                          <TableCell>{new Date(w.requested_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                setSelectedWithdrawal(w)
                                setMarkSentModalOpen(true)
                              }}
                              sx={{ bgcolor: '#10b981' }}
                            >
                              Mark as Sent
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Tab 1: Pending Bookings */}
        {tabValue === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>Bookings Awaiting Customer Confirmation</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                When customers confirm these bookings, referral commissions will be calculated automatically.
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell>Booking ID</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Provider</TableCell>
                      <TableCell>Completed</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No pending bookings</TableCell>
                      </TableRow>
                    ) : (
                      pendingBookings.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell>#{b.id}</TableCell>
                          <TableCell>{b.customer_name}</TableCell>
                          <TableCell>{b.service_name}</TableCell>
                          <TableCell>GHS{b.amount.toFixed(2)}</TableCell>
                          <TableCell>{b.provider_name}</TableCell>
                          <TableCell>{b.completed_at ? new Date(b.completed_at).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Service Shares - READ-ONLY */}
        {tabValue === 2 && (
            <Card>
                <CardContent>
                    <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
                        Referral Pool Distribution (Read-Only)
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                        <strong>📌 Note:</strong> These percentages are controlled from the 
                        <strong> "Percentage Settings" tab</strong> in the main Admin Dashboard.
                        To change the referral pool, go to <strong>Percentage Settings → Referral Pool Percentage</strong>.
                    </Alert>
        
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell>Component</TableCell>
                                    <TableCell align="center">Percentage</TableCell>
                                    <TableCell>Description</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow>
                                    <TableCell>💰 Provider Share</TableCell>
                                    <TableCell align="center">
                                        <Chip label={`${percentages?.provider_percent || 60}%`} sx={{ bgcolor: '#10b98115', color: '#10b981', fontWeight: 600 }} />
                                    </TableCell>
                                    <TableCell>What the service provider earns (from global settings)</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>🏢 Admin Share</TableCell>
                                    <TableCell align="center">
                                        <Chip label={`${percentages?.admin_percent || 20}%`} sx={{ bgcolor: '#8b5cf615', color: '#8b5cf6', fontWeight: 600 }} />
                                    </TableCell>
                                    <TableCell>Platform admin fee (from global settings)</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>🌐 Site Fee</TableCell>
                                    <TableCell align="center">
                                        <Chip label={`${percentages?.site_fee_percent || 10}%`} sx={{ bgcolor: '#f59e0b15', color: '#f59e0b', fontWeight: 600 }} />
                                    </TableCell>
                                    <TableCell>Maintenance &amp; marketing fee (from global settings)</TableCell>
                                </TableRow>
                                <TableRow sx={{ bgcolor: '#e0f2fe' }}>
                                    <TableCell>
                                        <strong>💰 Referral Pool</strong>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip 
                                            label={`${percentages?.referral_pool_percent || 10}%`} 
                                            sx={{ bgcolor: '#0284c715', color: '#0284c7', fontWeight: 700, fontSize: '1rem', py: 2 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <strong>From Percentage Settings → Referral Pool %</strong>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            This percentage of each booking goes to the referral commission pool
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
        
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            <strong>📌 How to change these values:</strong>
                            <br />
                            1. Go back to <strong>Admin Dashboard → Percentage Settings</strong>
                            <br />
                            2. Update <strong>Provider %, Admin %, Site Fee %, or Referral Pool %</strong>
                            <br />
                            3. Click <strong>Update Percentages</strong>
                            <br />
                            <br />
                            <strong>💡 Note:</strong> Changes will only affect future bookings. Existing bookings already have their shares locked.
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        )}
        {/* Tab 3: User Tree Viewer */}
        {tabValue === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>View User Referral Tree</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="User ID"
                  type="number"
                  value={searchUserId}
                  onChange={(e) => setSearchUserId(e.target.value)}
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={handleSearchUserTree}
                  disabled={actionLoading}
                  sx={{ bgcolor: '#10b981' }}
                >
                  {actionLoading ? <CircularProgress size={24} /> : 'Search'}
                </Button>
              </Box>
              {searchedTree && (
                <Box sx={{ mt: 2, maxHeight: 500, overflow: 'auto' }}>
                  <TreeView node={searchedTree} />
                </Box>
              )}
              {searchedTree === null && searchUserId && !actionLoading && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No user found with ID {searchUserId}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Mark as Sent Modal */}
      <Dialog open={markSentModalOpen} onClose={() => setMarkSentModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirm Money Sent
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setMarkSentModalOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            You are about to mark GHS{selectedWithdrawal?.amount?.toFixed(2)} as sent to {selectedWithdrawal?.user_name}.
            Make sure you have actually sent the money via {selectedWithdrawal?.payment_method}.
          </Alert>
          <TextField
            fullWidth
            label="Admin Notes (Optional)"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            margin="normal"
            multiline
            rows={2}
            placeholder="Reference number, transaction ID, or notes"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMarkSentModalOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleMarkAsSent}
            disabled={actionLoading}
            sx={{ bgcolor: '#10b981' }}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirm Money Sent'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Shares Modal */}
      <Dialog open={editSharesOpen} onClose={() => setEditSharesOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Service Shares: {editingService?.name}
          <IconButton sx={{ position: 'absolute', right: 8, top: 8 }} onClick={() => setEditSharesOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, mt: 1 }}>
            Changes will only affect future bookings. Existing bookings already have their shares locked.
          </Alert>
          <TextField
            fullWidth
            label="Admin Share (%)"
            type="number"
            value={editSharesData.admin_share}
            onChange={(e) => setEditSharesData({ ...editSharesData, admin_share: e.target.value })}
            margin="normal"
            inputProps={{ min: 0, max: 100, step: 0.5 }}
          />
          <TextField
            fullWidth
            label="Website Share (%)"
            type="number"
            value={editSharesData.website_share}
            onChange={(e) => setEditSharesData({ ...editSharesData, website_share: e.target.value })}
            margin="normal"
            inputProps={{ min: 0, max: 100, step: 0.5 }}
          />
          <TextField
              fullWidth
              label="Provider Share (%)"
              type="number"
              value={editSharesData.provider_share}
              onChange={(e) => setEditSharesData({ ...editSharesData, provider_share: e.target.value })}
              margin="normal"
              inputProps={{ min: 0, max: 100, step: 0.5 }}
          />
          <TextField
              fullWidth
              label="Referral Pool (%)"
              type="number"
              value={editSharesData.referral_pool}
              onChange={(e) => setEditSharesData({ ...editSharesData, referral_pool: e.target.value })}
              margin="normal"
              inputProps={{ min: 0, max: 100, step: 0.5 }}
              helperText="This percentage is used for referral commissions (separate from Admin/Website fees)"
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Total: {(
                  parseFloat(editSharesData.admin_share || 0) + 
                  parseFloat(editSharesData.website_share || 0) + 
                  parseFloat(editSharesData.provider_share || 0) +
                  parseFloat(editSharesData.referral_pool || 0)
              ).toFixed(1)}% (Must be 100%)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSharesOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpdateShares}
            disabled={actionLoading}
            sx={{ bgcolor: '#10b981' }}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </>
  )
}

export default AdminReferralDashboard
