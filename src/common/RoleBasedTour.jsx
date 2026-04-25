import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DemoTour from './DemoTour'
import { 
  customerTourSteps, 
  providerTourSteps, 
  adminTourSteps
} from './DemoTour'

const RoleBasedTour = () => {
  const { user } = useAuth()
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    if (!user) return
    
    // Check if user has seen the tour for their role
    const tourKey = `zivre_tour_${user.role}_seen`
    const tourSeen = localStorage.getItem(tourKey)
    
    if (!tourSeen) {
      // Show tour after 1.5 seconds
      const timer = setTimeout(() => setShowTour(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [user])

  const handleCloseTour = () => {
    setShowTour(false)
    if (user) {
      localStorage.setItem(`zivre_tour_${user.role}_seen`, 'true')
    }
  }

  // Select correct tour steps based on user role
  const getTourSteps = () => {
    if (!user) return []
    switch (user.role) {
      case 'customer':
        return customerTourSteps
      case 'provider':
        return providerTourSteps
      case 'admin':
        return adminTourSteps
      default:
        return []
    }
  }

  const getTourTitle = () => {
    if (!user) return ''
    switch (user.role) {
      case 'customer':
        return 'Welcome to Your Customer Dashboard!'
      case 'provider':
        return 'Welcome to Your Provider Dashboard!'
      case 'admin':
        return 'Welcome to Admin Control Center!'
      default:
        return 'Guided Tour'
    }
  }

  const tourSteps = getTourSteps()
  const tourTitle = getTourTitle()

  if (!user || tourSteps.length === 0) return null

  return (
    <DemoTour
      open={showTour}
      onClose={handleCloseTour}
      steps={tourSteps}
      title={tourTitle}
    />
  )
}

export default RoleBasedTour
