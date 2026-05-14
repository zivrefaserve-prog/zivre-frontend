import React from 'react'
import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material'

const BottomNav = ({ tabs, activeTab, onChange }) => {
  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 1000,
        borderTop: '1px solid #e2e8f0',
        display: { xs: 'block', md: 'none' },  // only on mobile
        borderRadius: 0
      }} 
      elevation={3}
    >
      <BottomNavigation
        value={activeTab}
        onChange={(event, newValue) => onChange(newValue)}
        showLabels
        sx={{ height: 65 }}
      >
        {tabs.map((tab) => (
          <BottomNavigationAction
            key={tab.tabIndex}
            label={tab.label}
            icon={tab.icon}
            value={tab.tabIndex}
            sx={{
              color: activeTab === tab.tabIndex ? '#10b981' : '#64748b',
              '&.Mui-selected': { color: '#10b981' }
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}

export default BottomNav
