import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { login as apiLogin, signup as apiSignup, verifyToken, logout as apiLogout } from '../api/client'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

const getStoredUser = () => {
  const stored = sessionStorage.getItem('zivre_user')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      return null
    }
  }
  return null
}

const getStoredToken = () => {
  return sessionStorage.getItem('zivre_token')
}

const setStoredUser = (user) => {
  if (user) {
    sessionStorage.setItem('zivre_user', JSON.stringify(user))
  } else {
    sessionStorage.removeItem('zivre_user')
  }
}

const setStoredToken = (token) => {
  if (token) {
    sessionStorage.setItem('zivre_token', token)
  } else {
    sessionStorage.removeItem('zivre_token')
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)

  const verifyUser = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setLoading(false)
      return
    }
    
    try {
      const res = await verifyToken()
      if (res.data.valid) {
        setUser(res.data.user)
        setStoredUser(res.data.user)
      } else {
        setUser(null)
        setStoredUser(null)
        setStoredToken(null)
      }
    } catch (err) {
      console.error('Token verification failed:', err)
      setUser(null)
      setStoredUser(null)
      setStoredToken(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    verifyUser()
  }, [verifyUser])

  const login = async (email, password) => {
    setAuthLoading(true)
    try {
      const res = await apiLogin({ email, password })
      const { token, user: userData } = res.data
      setStoredToken(token)
      setUser(userData)
      setStoredUser(userData)
      setAuthLoading(false)
      return res.data
    } catch (err) {
      setAuthLoading(false)
      // ✅ IMPORTANT: Do NOT change user state here
      // ✅ Just re-throw the error for AuthModal to handle
      throw err
    }
  }

  const signup = async (userData) => {
    setAuthLoading(true)
    try {
      const res = await apiSignup(userData)
      const { token, user: newUser, requires_verification, email } = res.data
      
      // ✅ IMPORTANT: If verification required, DON'T auto-login
      if (requires_verification) {
        setAuthLoading(false)
        // Return the full response so AuthModal can redirect
        return { data: { requires_verification, email } }
      }
      
      // Only auto-login if no verification required
      if (token) {
        setStoredToken(token)
      }
      setUser(newUser)
      setStoredUser(newUser)
      setAuthLoading(false)
      return { data: { user: newUser } }
    } catch (err) {
      setAuthLoading(false)
      throw err
    }
  }

  const logout = async () => {
    setAuthLoading(true)
    
    // Clear everything locally
    sessionStorage.clear()
    setUser(null)
    
    // Small delay to ensure overlay shows
    setTimeout(() => {
      window.location.href = '/'
    }, 200)
  }

  const hideAuthLoading = () => {
    setAuthLoading(false)
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    setStoredUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, authLoading, hideAuthLoading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
