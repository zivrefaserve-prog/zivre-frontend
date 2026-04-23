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
      throw err
    }
  }

  const signup = async (userData) => {
    setAuthLoading(true)
    try {
      const res = await apiSignup(userData)
      const { token, user: newUser } = res.data
      if (token) {
        setStoredToken(token)
      }
      setUser(newUser)
      setStoredUser(newUser)
      setAuthLoading(false)
      return res.data
    } catch (err) {
      setAuthLoading(false)
      throw err
    }
  }

  const logout = async () => {
    try {
      await apiLogout()
    } catch (err) {
      console.error('Logout error:', err)
    }
    sessionStorage.clear()
    setUser(null)
    window.location.href = '/'
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
