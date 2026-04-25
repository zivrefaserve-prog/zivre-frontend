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

  // Check if user has COMPLETED the tour for their role
  const hasCompletedTour = () => {
    if (!user) return true
    const completed = localStorage.getItem(`zivre_tour_${user.role}_completed`)
    return completed === 'true'
  }

  useEffect(() => {
    if (!user) return
    
    // Only auto-show if user has NOT completed the tour
    if (!hasCompletedTour()) {
      const timer = setTimeout(() => setShowTour(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [user])

  const handleCompleteTour = () => {
    // Save that user COMPLETED the tour
    if (user) {
      localStorage.setItem(`zivre_tour_${user.role}_completed`, 'true')
    }
    setShowTour(false)
  }

  const handleCloseTour = () => {
    // Just close - do NOT save completion
    setShowTour(false)
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
      onComplete={handleCompleteTour}
      steps={tourSteps}
      title={tourTitle}
    />
  )
}

export default RoleBasedTour
