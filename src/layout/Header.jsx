import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import RoleModal from '../common/RoleModal'
import AuthModal from '../common/AuthModal'
import NotificationDropdown from '../common/NotificationDropdown'
import {
  AppBar, Toolbar, Box, Button, Avatar, Menu, MenuItem, Divider,
  Typography, IconButton, Tooltip, useMediaQuery, Drawer, List,
  ListItem, ListItemIcon, ListItemText
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import SettingsIcon from '@mui/icons-material/Settings'
import LogoutIcon from '@mui/icons-material/Logout'
import MessageIcon from '@mui/icons-material/Message'
import HomeIcon from '@mui/icons-material/Home'
import InfoIcon from '@mui/icons-material/Info'
import QuoteIcon from '@mui/icons-material/FormatQuote'
import PersonIcon from '@mui/icons-material/Person'

const Header = ({ onGetQuote, hideNavLinks = false }) => {
  const { user, logout } = useAuth()
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width:768px)')

  const blurActiveElement = () => {
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur()
    }
  }

  const handleGetStarted = () => {
    blurActiveElement()
    setShowRoleModal(true)
  }

  const handleBookService = () => {
    blurActiveElement()
    setShowRoleModal(true)
  }

  const handleSignIn = () => {
    blurActiveElement()
    setShowSignInModal(true)
  }

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    blurActiveElement()
    setAnchorEl(null)
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleRoleSelect = (role) => {
    blurActiveElement()
    setSelectedRole(role)
    setShowRoleModal(false)
    setShowSignUpModal(true)
  }

  const handleAuthSuccess = (loggedInUser) => {
    blurActiveElement()
    setShowSignUpModal(false)
    setShowSignInModal(false)
    if (loggedInUser.role === 'customer') {
      window.location.href = '/customer/dashboard'
    } else if (loggedInUser.role === 'provider') {
      window.location.href = '/provider/dashboard'
    } else if (loggedInUser.role === 'admin') {
      window.location.href = '/admin/dashboard'
    } else {
      window.location.href = '/'
    }
  }

  const handleSwitchToSignIn = () => {
    blurActiveElement()
    setShowSignUpModal(false)
    setShowSignInModal(true)
  }

  const handleSwitchToSignUp = (role = 'customer') => {
    blurActiveElement()
    setShowSignInModal(false)
    setSelectedRole(role)
    setShowSignUpModal(true)
  }

  const getDashboardUrl = () => {
    if (!user) return '/'
    if (user.role === 'customer') return '/customer/dashboard'
    if (user.role === 'provider') return '/provider/dashboard'
    if (user.role === 'admin') return '/admin/dashboard'
    return '/'
  }

  const navItems = [
    { label: 'Services', icon: <HomeIcon />, action: () => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'About', icon: <InfoIcon />, action: () => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) },
    { label: 'Get Quote', icon: <QuoteIcon />, action: onGetQuote },
  ]

  const drawer = (
    <Box sx={{ width: 250, p: 2 }} role="presentation">
      <Typography variant="h6" sx={{ fontWeight: 800, color: '#10b981', mb: 2 }}>ZIVRE</Typography>
      <List>
        {!hideNavLinks && navItems.map((item) => (
          <ListItem 
            key={item.label} 
            onClick={() => { 
              blurActiveElement()
              item.action(); 
              setMobileOpen(false); 
            }}
            sx={{ cursor: 'pointer' }}
          >
            <ListItemIcon sx={{ color: '#10b981' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItem>
        ))}
        {user ? (
          <>
            <ListItem 
              onClick={() => { 
                blurActiveElement()
                window.location.href = '/'; 
                setMobileOpen(false); 
              }}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon><HomeIcon /></ListItemIcon>
              <ListItemText primary="Homepage" />
            </ListItem>
            <ListItem 
              onClick={() => { 
                blurActiveElement()
                window.location.href = getDashboardUrl(); 
                setMobileOpen(false); 
              }}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem 
              onClick={() => { 
                blurActiveElement()
                window.location.href = '/messages'; 
                setMobileOpen(false); 
              }}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon><MessageIcon /></ListItemIcon>
              <ListItemText primary="Messages" />
            </ListItem>
            <ListItem 
              onClick={() => { 
                blurActiveElement()
                window.location.href = '/profile'; 
                setMobileOpen(false); 
              }}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Profile Settings" />
            </ListItem>
            <ListItem 
              onClick={() => { 
                blurActiveElement()
                logout(); 
                setMobileOpen(false); 
              }}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem 
              onClick={() => { 
                handleSignIn(); 
                setMobileOpen(false); 
              }}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Sign In" />
            </ListItem>
            <ListItem 
              onClick={() => { 
                handleGetStarted(); 
                setMobileOpen(false); 
              }}
              sx={{ cursor: 'pointer' }}
            >
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Get Started" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  return (
    <>
      <AppBar position="sticky" color="default" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1400, width: '100%', mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton onClick={handleDrawerToggle}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography 
              variant="h6" 
              sx={{ fontWeight: 800, color: '#10b981', cursor: 'pointer' }} 
              onClick={() => window.location.href = '/'}
            >
              ZIVRE <span style={{ fontWeight: 400, color: '#64748b' }}>Facility Services</span>
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {!hideNavLinks && navItems.map((item) => (
                <Button key={item.label} color="inherit" onClick={() => {
                  blurActiveElement()
                  item.action()
                }} sx={{ color: '#475569' }}>
                  {item.label}
                </Button>
              ))}
              {user ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationDropdown />
                  <Tooltip title="Account">
                    <Avatar 
                      sx={{ bgcolor: '#10b981', cursor: 'pointer', width: 40, height: 40 }} 
                      onClick={handleMenuOpen}
                    >
                      {user.full_name?.charAt(0).toUpperCase()}
                    </Avatar>
                  </Tooltip>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <Box sx={{ px: 2, py: 1.5, minWidth: 200 }}>
                      <Typography variant="subtitle2" fontWeight="bold">{user.full_name}</Typography>
                      <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                    </Box>
                    <Divider />
                    <MenuItem onClick={() => { 
                      blurActiveElement()
                      handleMenuClose(); 
                      window.location.href = '/'; 
                    }}>
                      <HomeIcon sx={{ mr: 1.5, fontSize: 20 }} /> Homepage
                    </MenuItem>
                    <MenuItem onClick={() => { 
                      blurActiveElement()
                      handleMenuClose(); 
                      window.location.href = getDashboardUrl(); 
                    }}>
                      <DashboardIcon sx={{ mr: 1.5, fontSize: 20 }} /> Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { 
                      blurActiveElement()
                      handleMenuClose(); 
                      window.location.href = '/messages'; 
                    }}>
                      <MessageIcon sx={{ mr: 1.5, fontSize: 20 }} /> Messages
                    </MenuItem>
                    <MenuItem onClick={() => { 
                      blurActiveElement()
                      handleMenuClose(); 
                      window.location.href = '/profile'; 
                    }}>
                      <SettingsIcon sx={{ mr: 1.5, fontSize: 20 }} /> Profile Settings
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={() => { 
                      blurActiveElement()
                      handleMenuClose(); 
                      logout(); 
                    }} sx={{ color: '#ef4444' }}>
                      <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} /> Logout
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={handleSignIn} sx={{ borderColor: '#10b981', color: '#10b981' }}>
                    Sign In
                  </Button>
                  <Button variant="contained" onClick={handleBookService} sx={{ bgcolor: '#10b981' }}>
                    Get Started
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
      >
        {drawer}
      </Drawer>

      {showRoleModal && <RoleModal onSelect={handleRoleSelect} onClose={() => {
        blurActiveElement()
        setShowRoleModal(false)
      }} />}
      {showSignUpModal && (
        <AuthModal 
          isSignUp={true} 
          role={selectedRole} 
          onClose={() => {
            blurActiveElement()
            setShowSignUpModal(false)
          }} 
          onSuccess={handleAuthSuccess}
          onSwitchToSignIn={handleSwitchToSignIn}
        />
      )}
      {showSignInModal && (
        <AuthModal 
          isSignUp={false} 
          onClose={() => {
            blurActiveElement()
            setShowSignInModal(false)
          }} 
          onSuccess={handleAuthSuccess}
          onSwitchToSignUp={handleSwitchToSignUp}
        />
      )}
    </>
  )
}

export default Header
