import { useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook for real-time auto-refresh using WebSocket events
 * 
 * @param {Function} refreshFunction - The function to call when refresh is needed
 * @param {Array} events - Array of event names to listen for
 * @param {number} fallbackInterval - Fallback polling interval in ms (default: 15000)
 * @returns {Object} - { lastRefreshed, isRefreshing, manualRefresh }
 */
export const useRealtimeRefresh = (refreshFunction, events = [], fallbackInterval = 15000) => {
  const lastRefreshedRef = useRef(null)
  const isRefreshingRef = useRef(false)
  const intervalRef = useRef(null)
  const isMountedRef = useRef(true)
  const refreshFunctionRef = useRef(refreshFunction)

  // Update ref when refreshFunction changes
  useEffect(() => {
    refreshFunctionRef.current = refreshFunction
  }, [refreshFunction])

  // Manual refresh function
  const manualRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    
    isRefreshingRef.current = true
    try {
      await refreshFunctionRef.current()
      lastRefreshedRef.current = new Date()
    } catch (err) {
      console.error('Manual refresh error:', err)
    } finally {
      isRefreshingRef.current = false
    }
  }, [])

  // Set up event listeners for real-time updates
  useEffect(() => {
    isMountedRef.current = true

    // Handler for all events
    const handleEvent = async (event) => {
      console.log(`📡 Real-time event triggered: ${event.type}`)
      if (!isRefreshingRef.current) {
        isRefreshingRef.current = true
        try {
          await refreshFunctionRef.current()
          lastRefreshedRef.current = new Date()
        } catch (err) {
          console.error(`Refresh error for event ${event.type}:`, err)
        } finally {
          isRefreshingRef.current = false
        }
      }
    }

    // Register event listeners for all specified events
    events.forEach(eventName => {
      window.addEventListener(eventName, handleEvent)
    })

    // Fallback polling interval (in case WebSocket fails)
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current && !document.hidden && !isRefreshingRef.current) {
        refreshFunctionRef.current().catch(err => {
          console.error('Fallback refresh error:', err)
        }).finally(() => {
          lastRefreshedRef.current = new Date()
        })
      }
    }, fallbackInterval)

    // Visibility change handler - refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && isMountedRef.current && !isRefreshingRef.current) {
        refreshFunctionRef.current().catch(err => {
          console.error('Visibility refresh error:', err)
        }).finally(() => {
          lastRefreshedRef.current = new Date()
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isMountedRef.current = false
      events.forEach(eventName => {
        window.removeEventListener(eventName, handleEvent)
      })
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [events, fallbackInterval])

  return {
    lastRefreshed: lastRefreshedRef.current,
    isRefreshing: isRefreshingRef.current,
    manualRefresh
  }
}

export default useRealtimeRefresh