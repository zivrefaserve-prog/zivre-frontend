import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { login as apiLogin, signup as apiSignup, getUser, logout as apiLogout } from '../api/client'

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

const setStoredUser = (user) => {
  if (user) {
    sessionStorage.setItem('zivre_user', JSON.stringify(user))
  } else {
    sessionStorage.removeItem('zivre_user')
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(true)

  const verifyUser = useCallback(async (userData) => {
    try {
      const res = await getUser(userData.id)
      if (res.data) {
        setUser(res.data)
        setStoredUser(res.data)
      }
    } catch (err) {
      console.error('User verification failed:', err)
      setUser(null)
      setStoredUser(null)
    }
  }, [])

  useEffect(() => {
    const storedUser = getStoredUser()
    if (storedUser && storedUser.id) {
      verifyUser(storedUser)
    }
    setLoading(false)
  }, [verifyUser])

  const login = async (email, password) => {
    const res = await apiLogin({ email, password })
    const userData = res.data.user
    setUser(userData)
    setStoredUser(userData)
    return res.data
  }

  const signup = async (userData) => {
    const res = await apiSignup(userData)
    const newUser = res.data.user
    setUser(newUser)
    setStoredUser(newUser)
    return res.data
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

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    setStoredUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}