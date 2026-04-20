import React, { useState, useEffect, useMemo } from 'react'
import { getComments, createComment, deleteComment, updateComment, createReply } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import {
  Box, Container, Typography, Rating, TextField, Button, Card, CardContent,
  Avatar, Grid, Alert, CircularProgress, Divider, IconButton, Tooltip,
  Pagination, LinearProgress, ToggleButton, ToggleButtonGroup,
  Dialog, DialogTitle, DialogContent, DialogActions, Menu, MenuItem, Chip
} from '@mui/material'
import {
  Star as StarIcon,
  Send as SendIcon,
  ThumbUp as ThumbUpIcon,
  Person as PersonIcon,
  Flag as FlagIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  Search as SearchIcon
} from '@mui/icons-material'

const CommentSection = () => {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [sortBy, setSortBy] = useState('newest')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [editingComment, setEditingComment] = useState(null)
  const [editText, setEditText] = useState('')
  const [editRating, setEditRating] = useState(5)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [selectedComment, setSelectedComment] = useState(null)
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [showReplyDialog, setShowReplyDialog] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  
  const commentsPerPage = 5
  
  const [newComment, setNewComment] = useState({
    user_name: '',
    rating: 5,
    comment: ''
  })

  // Handle window resize for mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (user) {
      setNewComment(prev => ({ ...prev, user_name: user.full_name }))
    }
  }, [user])

  const isEditable = (createdAt, commentUserId) => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (commentUserId !== user.id) return false
    const commentTime = new Date(createdAt).getTime()
    const currentTime = new Date().getTime()
    const minutesDiff = (currentTime - commentTime) / (1000 * 60)
    return minutesDiff <= 2
  }

  const canDelete = (comment) => {
    if (!user) return false
    if (user.role === 'admin') return true
    if (comment.user_id === user.id) {
      const commentTime = new Date(comment.created_at).getTime()
      const currentTime = new Date().getTime()
      const minutesDiff = (currentTime - commentTime) / (1000 * 60)
      return minutesDiff <= 2
    }
    return false
  }

  const canReply = () => !!user
  const canReport = (commentUserId) => {
    if (!user) return false
    if (commentUserId === user.id) return false
    return true
  }
  const canMarkHelpful = (commentUserId) => {
    if (!user) return false
    if (commentUserId === user.id) return false
    return true
  }

  const loadComments = async () => {
    try {
      const res = await getComments()
      let commentsData = res.data
      
      if (ratingFilter !== 'all') {
        commentsData = commentsData.filter(c => Math.floor(c.rating) === parseInt(ratingFilter))
      }
      
      if (sortBy === 'newest') {
        commentsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      } else if (sortBy === 'oldest') {
        commentsData.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      } else if (sortBy === 'highest') {
        commentsData.sort((a, b) => b.rating - a.rating)
      } else if (sortBy === 'lowest') {
        commentsData.sort((a, b) => a.rating - b.rating)
      } else if (sortBy === 'helpful') {
        commentsData.sort((a, b) => (b.helpful_count || 0) - (a.helpful_count || 0))
      }
      
      setComments(commentsData)
    } catch (err) {
      console.error('Error loading comments:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filtered comments for search
  const filteredComments = useMemo(() => {
    if (!searchTerm.trim()) return comments
    const term = searchTerm.toLowerCase().trim()
    return comments.filter(c => 
      c.user_name?.toLowerCase().includes(term) ||
      c.comment?.toLowerCase().includes(term)
    )
  }, [comments, searchTerm])

  // ========== REALTIME COMMENT EVENT LISTENERS ==========
  useEffect(() => {
    const handleNewComment = () => {
      console.log('💬 New comment received in realtime')
      loadComments()
    }
    
    const handleCommentUpdated = () => {
      console.log('✏️ Comment updated in realtime')
      loadComments()
    }
    
    const handleCommentDeleted = () => {
      console.log('🗑️ Comment deleted in realtime')
      loadComments()
    }
    
    const handleCommentToggled = () => {
      console.log('👁️ Comment toggled in realtime')
      loadComments()
    }
    
    const handleNewReply = () => {
      console.log('💬 New reply received in realtime')
      loadComments()
    }

    window.addEventListener('new_comment', handleNewComment)
    window.addEventListener('comment_updated', handleCommentUpdated)
    window.addEventListener('comment_deleted', handleCommentDeleted)
    window.addEventListener('comment_toggled', handleCommentToggled)
    window.addEventListener('new_reply', handleNewReply)

    return () => {
      window.removeEventListener('new_comment', handleNewComment)
      window.removeEventListener('comment_updated', handleCommentUpdated)
      window.removeEventListener('comment_deleted', handleCommentDeleted)
      window.removeEventListener('comment_toggled', handleCommentToggled)
      window.removeEventListener('new_reply', handleNewReply)
    }
  }, [])

  useEffect(() => {
    loadComments()
  }, [sortBy, ratingFilter])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      setShowLoginPrompt(true)
      return
    }
    
    if (!newComment.comment.trim()) {
      showToast('Please enter your comment', 'error')
      return
    }
    
    if (newComment.comment.length < 3) {
      showToast('Comment must be at least 3 characters', 'error')
      return
    }

    setSubmitting(true)
    try {
      const commentData = {
        user_name: user.full_name,
        user_id: user.id,
        user_role: user.role,
        rating: newComment.rating,
        comment: newComment.comment
      }
      await createComment(commentData)
      showToast('Thank you for your feedback!', 'success')
      setNewComment({
        user_name: user.full_name,
        rating: 5,
        comment: ''
      })
      await loadComments()
    } catch (err) {
      showToast('Error submitting comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async () => {
    if (!editText.trim()) {
      showToast('Please enter your comment', 'error')
      return
    }
    
    setSubmitting(true)
    try {
      await updateComment(editingComment.id, {
        comment: editText,
        rating: editRating
      })
      showToast('Comment updated successfully!', 'success')
      setEditingComment(null)
      setEditText('')
      setEditRating(5)
      await loadComments()
    } catch (err) {
      showToast('Error updating comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async () => {
    if (!selectedComment) return
    
    setSubmitting(true)
    try {
      await deleteComment(selectedComment.id)
      showToast('Comment deleted successfully!', 'success')
      setMenuAnchorEl(null)
      setSelectedComment(null)
      await loadComments()
    } catch (err) {
      showToast('Error deleting comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async () => {
    if (!replyText.trim()) {
      showToast('Please enter a reply', 'error')
      return
    }
    
    setSubmitting(true)
    try {
      await createReply({
        comment_id: replyingTo.id,
        user_id: user.id,
        user_name: user.full_name,
        user_role: user.role,
        message: replyText
      })
      showToast('Reply submitted!', 'success')
      setReplyingTo(null)
      setReplyText('')
      setShowReplyDialog(false)
      await loadComments()
    } catch (err) {
      showToast('Error submitting reply', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReport = async () => {
    if (!reportReason) {
      showToast('Please select a reason', 'error')
      return
    }
    showToast('Report submitted. Thank you for helping keep our community safe.', 'success')
    setShowReportDialog(false)
    setReportReason('')
    setSelectedComment(null)
  }

  const handleShare = (comment) => {
    const text = `"${comment.comment.substring(0, 100)}..." - ${comment.user_name} (${comment.rating} stars)`
    if (navigator.share) {
      navigator.share({
        title: 'Review on Zivre',
        text: text,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(text)
      showToast('Review copied to clipboard!', 'success')
    }
  }

  const handleMenuOpen = (event, comment) => {
    setMenuAnchorEl(event.currentTarget)
    setSelectedComment(comment)
  }

  const handleMenuClose = () => {
    setMenuAnchorEl(null)
  }

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || 'U'
  }

  const getRandomAvatar = (name) => {
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4898', '#f59e0b', '#ef4444']
    const index = name?.length % colors.length || 0
    return colors[index]
  }

  const getRoleChip = (role) => {
    if (role === 'admin') {
      return <Chip label="Admin" size="small" sx={{ ml: 1, height: 20, bgcolor: '#8b5cf615', color: '#8b5cf6' }} />
    }
    if (role === 'provider') {
      return <Chip label="Provider" size="small" sx={{ ml: 1, height: 20, bgcolor: '#f59e0b15', color: '#f59e0b' }} />
    }
    if (role === 'customer') {
      return <Chip label="Verified Customer" size="small" sx={{ ml: 1, height: 20, bgcolor: '#10b98115', color: '#10b981' }} />
    }
    return null
  }

  const totalComments = filteredComments.length
  const averageRating = totalComments > 0 
    ? (filteredComments.reduce((sum, c) => sum + c.rating, 0) / totalComments).toFixed(1) 
    : 0
  
  const ratingDistribution = {
    5: filteredComments.filter(c => Math.floor(c.rating) === 5).length,
    4: filteredComments.filter(c => Math.floor(c.rating) === 4).length,
    3: filteredComments.filter(c => Math.floor(c.rating) === 3).length,
    2: filteredComments.filter(c => Math.floor(c.rating) === 2).length,
    1: filteredComments.filter(c => Math.floor(c.rating) === 1).length
  }

  const getPercentage = (count) => {
    return totalComments > 0 ? (count / totalComments * 100).toFixed(0) : 0
  }

  const paginatedComments = filteredComments.slice(
    (page - 1) * commentsPerPage,
    page * commentsPerPage
  )

  if (loading) {
    return (
      <Box sx={{ py: 6, bgcolor: '#f8fafc' }}>
        <Container maxWidth="lg">
          <CircularProgress sx={{ color: '#10b981', display: 'block', mx: 'auto' }} />
        </Container>
      </Box>
    )
  }

  return (
    <Box sx={{ py: 6, bgcolor: '#f8fafc' }}>
      <Container maxWidth="lg">
        {toast && (
          <Alert severity={toast.type} sx={{ mb: 3, borderRadius: 2 }} onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        )}

        <Typography variant="h4" fontWeight="800" sx={{ textAlign: 'center', color: '#0f172a', mb: 1 }}>
          What Our Community Says
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', mb: 4 }}>
          Reviews from customers, providers, and admins
        </Typography>

        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h2" fontWeight="800" sx={{ color: '#0f172a' }}>
                {averageRating}
              </Typography>
              <Rating value={Number(averageRating)} precision={0.5} readOnly size="large" sx={{ my: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Based on {totalComments} reviews
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              {[5, 4, 3, 2, 1].map(star => (
                <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box sx={{ minWidth: 60 }}>
                    <Typography variant="body2">{star} ★</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={Number(getPercentage(ratingDistribution[star]))} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#fbbf24' } }}
                    />
                  </Box>
                  <Box sx={{ minWidth: 40 }}>
                    <Typography variant="caption" color="text.secondary">
                      {getPercentage(ratingDistribution[star])}%
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <ToggleButtonGroup
              value={ratingFilter}
              exclusive
              onChange={(e, val) => val && setRatingFilter(val)}
              size="small"
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="5">5 ★</ToggleButton>
              <ToggleButton value="4">4 ★</ToggleButton>
              <ToggleButton value="3">3 ★</ToggleButton>
              <ToggleButton value="2">2 ★</ToggleButton>
              <ToggleButton value="1">1 ★</ToggleButton>
            </ToggleButtonGroup>
            
            <TextField
              size="small"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: '#94a3b8' }} /> } }}
              sx={{ width: isMobile ? 180 : 250, bgcolor: 'white', borderRadius: 2 }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>Sort by:</Typography>
            <ToggleButtonGroup
              value={sortBy}
              exclusive
              onChange={(e, val) => val && setSortBy(val)}
              size="small"
            >
              <ToggleButton value="newest">Newest</ToggleButton>
              <ToggleButton value="highest">Highest Rated</ToggleButton>
              <ToggleButton value="helpful">Most Helpful</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {searchTerm && filteredComments.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>No comments matching "{searchTerm}"</Alert>
        )}

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#0f172a' }}>
                All Reviews ({filteredComments.length})
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {paginatedComments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">No reviews yet. Be the first to leave a review!</Typography>
                </Box>
              ) : (
                <>
                  {paginatedComments.map((comment, index) => {
                    const editable = isEditable(comment.created_at, comment.user_id)
                    const deletable = canDelete(comment)
                    const replyable = canReply()
                    const reportable = canReport(comment.user_id)
                    const helpfulable = canMarkHelpful(comment.user_id)
                    const isOwner = user?.id === comment.user_id
                    const timeSince = new Date().getTime() - new Date(comment.created_at).getTime()
                    const minutesSince = Math.floor(timeSince / (1000 * 60))
                    const isWithin2Mins = minutesSince <= 2
                    
                    return (
                      <Box key={comment.id} sx={{ mb: 3, pb: 2, borderBottom: index < paginatedComments.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Avatar sx={{ bgcolor: getRandomAvatar(comment.user_name), width: 48, height: 48 }}>
                            {getInitials(comment.user_name)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                                <Typography variant="subtitle1" fontWeight="600">{comment.user_name}</Typography>
                                {getRoleChip(comment.user_role)}
                                {isOwner && isWithin2Mins && (
                                  <Chip label="Can edit (2 min left)" size="small" sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#fef3c7', color: '#f59e0b' }} />
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </Typography>
                                {(editable || deletable) && (
                                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, comment)}>
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </Box>
                            <Rating value={comment.rating} readOnly size="small" sx={{ mb: 1 }} />
                            <Typography variant="body2" sx={{ color: '#334155' }}>
                              {comment.comment}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                              {helpfulable && (
                                <Button 
                                  size="small" 
                                  startIcon={<ThumbUpIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => showToast('Thanks for your feedback!', 'success')}
                                  sx={{ color: '#64748b' }}
                                >
                                  Helpful ({comment.helpful_count || 0})
                                </Button>
                              )}
                              
                              {replyable && (
                                <Button 
                                  size="small" 
                                  startIcon={<ReplyIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => {
                                    setReplyingTo(comment)
                                    setShowReplyDialog(true)
                                  }}
                                  sx={{ color: '#64748b' }}
                                >
                                  Reply
                                </Button>
                              )}
                              
                              {reportable && (
                                <Button 
                                  size="small" 
                                  startIcon={<FlagIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => { setSelectedComment(comment); setShowReportDialog(true) }}
                                  sx={{ color: '#64748b' }}
                                >
                                  Report
                                </Button>
                              )}
                              
                              <Button 
                                size="small" 
                                startIcon={<ShareIcon sx={{ fontSize: 16 }} />}
                                onClick={() => handleShare(comment)}
                                sx={{ color: '#64748b' }}
                              >
                                Share
                              </Button>
                            </Box>
                            
                            {comment.replies && comment.replies.length > 0 && (
                              <Box sx={{ mt: 2, pl: 4, borderLeft: '2px solid #e2e8f0' }}>
                                {comment.replies.map((reply) => (
                                  <Box key={reply.id} sx={{ mb: 1, display: 'flex', gap: 1 }}>
                                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#10b981', fontSize: '0.75rem' }}>
                                      {reply.user_name?.charAt(0)}
                                    </Avatar>
                                    <Box>
                                      <Typography variant="caption" fontWeight="600">
                                        {reply.user_name}
                                        {reply.user_role === 'admin' && <Chip label="Admin" size="small" sx={{ ml: 1, height: 16, fontSize: '0.6rem' }} />}
                                        {reply.user_role === 'provider' && <Chip label="Provider" size="small" sx={{ ml: 1, height: 16, fontSize: '0.6rem' }} />}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                        {reply.message}
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    )
                  })}
                  <Pagination 
                    count={Math.ceil(filteredComments.length / commentsPerPage)} 
                    page={page} 
                    onChange={(e, val) => setPage(val)}
                    sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
                  />
                </>
              )}
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ p: 3, borderRadius: 3, height: '100%', bgcolor: 'white' }}>
              {!user ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LockIcon sx={{ fontSize: 60, color: '#94a3b8', mb: 2 }} />
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 1, color: '#0f172a' }}>
                    Login to Leave a Review
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Sign in to share your experience
                  </Typography>
                  <Button 
                      variant="contained" 
                      startIcon={<LoginIcon />}
                      onClick={() => {
                        setShowLoginPrompt(false)
                        const buttons = document.querySelectorAll('button')
                        for (let btn of buttons) {
                          if (btn.textContent === 'Get Started') {
                            btn.click()
                            break
                          }
                        }
                      }}
                      sx={{ bgcolor: '#10b981' }}
                    >
                      Login / Sign Up
                </Button>
                </Box>
              ) : (
                <>
                  <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: '#0f172a' }}>
                    Leave a Review
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Share your experience with Zivre Facility Services
                  </Typography>

                  <form onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Your Name"
                      value={newComment.user_name}
                      slotProps={{ input: { readOnly: true, startAdornment: <PersonIcon sx={{ color: '#94a3b8', mr: 1 }} /> } }}
                      sx={{ mb: 2 }}
                    />

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 1, color: '#475569' }}>Your Rating</Typography>
                      <Rating
                        value={newComment.rating}
                        onChange={(e, newValue) => setNewComment({ ...newComment, rating: newValue || 5 })}
                        size="large"
                        icon={<StarIcon sx={{ fontSize: 32 }} />}
                        emptyIcon={<StarIcon sx={{ fontSize: 32, color: '#cbd5e1' }} />}
                      />
                    </Box>

                    <TextField
                      fullWidth
                      size="small"
                      label="Your Review"
                      multiline
                      rows={4}
                      value={newComment.comment}
                      onChange={(e) => setNewComment({ ...newComment, comment: e.target.value })}
                      required
                      placeholder="Tell us about your experience..."
                      sx={{ mb: 2 }}
                    />

                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      disabled={submitting}
                      sx={{ py: 1.5, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                      endIcon={!submitting && <SendIcon />}
                    >
                      {submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit Review'}
                    </Button>
                  </form>

                  <Box sx={{ mt: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
                    <Typography variant="caption" color="#10b981" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ThumbUpIcon sx={{ fontSize: 14 }} />
                      Your feedback helps us improve our services!
                    </Typography>
                    <Typography variant="caption" color="#f59e0b" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <EditIcon sx={{ fontSize: 12 }} />
                      You can edit or delete your review within 2 minutes of posting.
                    </Typography>
                  </Box>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={showLoginPrompt} onClose={() => setShowLoginPrompt(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>Login Required</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
            Please login to leave a review
          </Typography>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={() => {
              setShowLoginPrompt(false)
              const getStartedBtn = document.querySelector('.auth-buttons .btn-primary')
              if (getStartedBtn) getStartedBtn.click()
            }}
            sx={{ bgcolor: '#10b981' }}
          >
            Go to Login
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLoginPrompt(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editingComment} onClose={() => setEditingComment(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Your Review</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Rating</Typography>
            <Rating
              value={editRating}
              onChange={(e, newValue) => setEditRating(newValue || 5)}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            label="Your Review"
            multiline
            rows={4}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            required
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            You can only edit your review within 2 minutes of posting.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingComment(null)}>Cancel</Button>
          <Button onClick={handleEditComment} variant="contained" sx={{ bgcolor: '#10b981' }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showReplyDialog} onClose={() => setShowReplyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reply to Review</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Replying to: <strong>{replyingTo?.user_name}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Your Reply"
            multiline
            rows={3}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            required
            placeholder="Write your reply here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReplyDialog(false)}>Cancel</Button>
          <Button onClick={handleReply} variant="contained" sx={{ bgcolor: '#10b981' }}>
            Post Reply
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showReportDialog} onClose={() => setShowReportDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Report Review</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Why are you reporting this review?
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            {['Spam or advertising', 'Offensive language', 'Fake review', 'Wrong information', 'Other'].map(reason => (
              <Button
                key={reason}
                variant={reportReason === reason ? 'contained' : 'outlined'}
                onClick={() => setReportReason(reason)}
                sx={{ 
                  justifyContent: 'flex-start',
                  bgcolor: reportReason === reason ? '#10b981' : 'transparent',
                  borderColor: '#e2e8f0',
                  '&:hover': { bgcolor: reportReason === reason ? '#059669' : '#f8fafc' }
                }}
              >
                {reason}
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReportDialog(false)}>Cancel</Button>
          <Button onClick={handleReport} variant="contained" sx={{ bgcolor: '#ef4444' }}>Submit Report</Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
        {selectedComment && isEditable(selectedComment.created_at, selectedComment.user_id) && (
          <MenuItem onClick={() => {
            setEditingComment(selectedComment)
            setEditText(selectedComment.comment)
            setEditRating(selectedComment.rating)
            handleMenuClose()
          }}>
            <EditIcon sx={{ mr: 1.5, fontSize: 20 }} /> Edit Comment
          </MenuItem>
        )}
        {selectedComment && canDelete(selectedComment) && (
          <MenuItem onClick={handleDeleteComment} sx={{ color: '#ef4444' }}>
            <DeleteIcon sx={{ mr: 1.5, fontSize: 20 }} /> Delete Comment
          </MenuItem>
        )}
      </Menu>
    </Box>
  )
}

export default CommentSection