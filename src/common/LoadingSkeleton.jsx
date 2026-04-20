import React from 'react'
import { Skeleton, Card, CardContent, Box, Grid, Avatar } from '@mui/material'

// Card skeleton for service listings
export const ServiceCardSkeleton = () => {
  return (
    <Card sx={{ height: '100%', p: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width="60%" height={32} />
        </Box>
        <Skeleton variant="text" width="90%" height={20} />
        <Skeleton variant="text" width="80%" height={20} />
        <Skeleton variant="text" width="50%" height={20} sx={{ mt: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={36} sx={{ mt: 2, borderRadius: 1 }} />
      </CardContent>
    </Card>
  )
}

// Dashboard stats card skeleton
export const StatsCardSkeleton = () => {
  return (
    <Card sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={40} sx={{ mt: 0.5 }} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton variant="circular" width={48} height={48} />
      </Box>
    </Card>
  )
}

// Table row skeleton
export const TableRowSkeleton = ({ columns = 5 }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
      {Array(columns).fill().map((_, i) => (
        <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={24} />
      ))}
    </Box>
  )
}

// Chat message skeleton
export const MessageSkeleton = ({ isSender = false }) => {
  return (
    <Box sx={{ display: 'flex', justifyContent: isSender ? 'flex-end' : 'flex-start', mb: 1 }}>
      <Box sx={{ maxWidth: '70%' }}>
        <Skeleton variant="rounded" width={200} height={40} sx={{ borderRadius: 2 }} />
      </Box>
    </Box>
  )
}

// Conversation list item skeleton
export const ConversationSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5 }}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="70%" height={20} />
        <Skeleton variant="text" width="50%" height={16} />
      </Box>
    </Box>
  )
}

// Comment skeleton
export const CommentSkeleton = () => {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
      <Skeleton variant="circular" width={48} height={48} />
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Skeleton variant="text" width="30%" height={24} />
          <Skeleton variant="text" width="20%" height={16} />
        </Box>
        <Skeleton variant="text" width="40%" height={20} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="90%" height={20} />
      </Box>
    </Box>
  )
}

// Dashboard content skeleton (full page)
export const DashboardSkeleton = () => {
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={250} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array(4).fill().map((_, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <StatsCardSkeleton />
          </Grid>
        ))}
      </Grid>
      
      <Card sx={{ p: 3 }}>
        <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
        {Array(5).fill().map((_, i) => (
          <TableRowSkeleton key={i} columns={4} />
        ))}
      </Card>
    </Box>
  )
}

// Service grid skeleton
export const ServicesGridSkeleton = () => {
  return (
    <Grid container spacing={3}>
      {Array(6).fill().map((_, i) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
          <ServiceCardSkeleton />
        </Grid>
      ))}
    </Grid>
  )
}

// Profile settings skeleton
export const ProfileSkeleton = () => {
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" width={120} height={36} />
      </Box>
      
      <Grid container spacing={3}>
        {Array(2).fill().map((_, i) => (
          <Grid size={{ xs: 12, md: 6 }} key={i}>
            <Card sx={{ p: 3 }}>
              <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
              {Array(3).fill().map((_, j) => (
                <Box key={j} sx={{ mb: 2 }}>
                  <Skeleton variant="text" width="30%" height={20} sx={{ mb: 0.5 }} />
                  <Skeleton variant="rounded" width="100%" height={40} />
                </Box>
              ))}
              <Skeleton variant="rounded" width="100%" height={40} sx={{ mt: 2 }} />
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default {
  ServiceCardSkeleton,
  StatsCardSkeleton,
  TableRowSkeleton,
  MessageSkeleton,
  ConversationSkeleton,
  CommentSkeleton,
  DashboardSkeleton,
  ServicesGridSkeleton,
  ProfileSkeleton
}