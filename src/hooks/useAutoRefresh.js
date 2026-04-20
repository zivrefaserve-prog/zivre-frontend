import { useEffect, useCallback, useRef, useState } from 'react'

export const useAutoRefresh = (refreshFunction, interval = 15000, dependencies = []) => {
  const [lastRefreshed, setLastRefreshed] = useState(() => {
    const saved = localStorage.getItem('last_refreshed')
    return saved ? new Date(saved) : null
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const intervalRef = useRef(null)
  const isMounted = useRef(true)
  const isRefreshingRef = useRef(false)
  const refreshFunctionRef = useRef(refreshFunction)

  useEffect(() => {
    refreshFunctionRef.current = refreshFunction
  }, [refreshFunction])

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    
    isRefreshingRef.current = true
    
    if (isMounted.current) {
      setIsRefreshing(true)
    }
    
    try {
      await refreshFunctionRef.current()
      const now = new Date()
      if (isMounted.current) {
        setLastRefreshed(now)
        localStorage.setItem('last_refreshed', now.toISOString())
      }
    } catch (err) {
      console.error('Auto-refresh error:', err)
    } finally {
      if (isMounted.current) {
        setIsRefreshing(false)
      }
      isRefreshingRef.current = false
    }
  }, [])

  const manualRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return
    await refresh()
  }, [refresh])

  // Clear all stored state on logout
  const clearStoredState = useCallback(() => {
    const keys = ['last_refreshed', 'customer_activeTab', 'provider_activeTab', 'admin_activeTab', 'messages_selectedUser', 'messages_tabValue', 'messages_unreadCounts']
    keys.forEach(key => localStorage.removeItem(key))
  }, [])

  useEffect(() => {
    isMounted.current = true
    
    // Initial refresh
    refresh()
    
    intervalRef.current = setInterval(() => {
      if (isMounted.current && !document.hidden) {
        refresh()
      }
    }, interval)
    
    // Visibility change handler - refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && isMounted.current) {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      isMounted.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refresh, interval, ...dependencies])

  return { lastRefreshed, isRefreshing, manualRefresh, clearStoredState }
}

export default useAutoRefresh