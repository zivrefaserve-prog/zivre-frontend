import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'

const WebSocketContext = createContext(null)

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext)
  if (!context) throw new Error('useWebSocketContext must be used within WebSocketProvider')
  return context
}

export const WebSocketProvider = ({ children, userId }) => {
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState({})
  const [typingUsers, setTypingUsers] = useState({})
  
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef(null)
  const socketRef = useRef(null)
  const isConnectingRef = useRef(false)
  const maxReconnectAttempts = 10
  const baseReconnectDelay = 1000
  const isMountedRef = useRef(true)

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    if (isMountedRef.current) {
      setSocket(null)
      setIsConnected(false)
      setIsConnecting(false)
      setConnectionError(null)
    }
    isConnectingRef.current = false
    reconnectAttemptsRef.current = 0
  }, [])

  // FIX: Updated connect function with better error handling
  const connect = useCallback(() => {
    if (!userId) {
      console.log('No userId provided, skipping WebSocket connection')
      return
    }
    
    if (socketRef.current?.connected) {
      console.log('WebSocket already connected')
      return
    }
    
    if (isConnectingRef.current) {
      console.log('WebSocket connection already in progress')
      return
    }
    
    if (!isMountedRef.current) return

    console.log(`Attempting WebSocket connection for user ${userId} (attempt ${reconnectAttemptsRef.current + 1})`)
    
    if (socketRef.current) {
      try {
        socketRef.current.disconnect()
      } catch(e) {}
      socketRef.current = null
    }

    isConnectingRef.current = true
    
    if (isMountedRef.current) {
      setIsConnecting(true)
      setConnectionError(null)
    }

    // Use VITE_API_URL for WebSocket, fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SOCKET_URL = API_URL.replace('/api', '').replace('http://', 'https://')
    
console.log('🔌 Attempting WebSocket connection to:', SOCKET_URL)    
const newSocket = io(SOCKET_URL, {
  transports: ['polling', 'websocket'],
  query: { userId: userId.toString() },
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 60000,
  withCredentials: true,
  autoConnect: true,
  forceNew: true
})

    socketRef.current = newSocket

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected successfully')
      if (isMountedRef.current) {
        setIsConnected(true)
        setIsConnecting(false)
        setConnectionError(null)
        setSocket(newSocket)
      }
      isConnectingRef.current = false
      reconnectAttemptsRef.current = 0
      
      newSocket.emit('ping', { timestamp: Date.now() })
    })

    newSocket.on('disconnect', (reason) => {
      console.log('🔴 WebSocket disconnected:', reason)
      if (isMountedRef.current) {
        setIsConnected(false)
        setSocket(null)
      }
      
      if (reason !== 'io client disconnect' && isMountedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 30000)
        console.log(`Attempting reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`)
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && !socketRef.current?.connected) {
            reconnectAttemptsRef.current++
            isConnectingRef.current = false
            connect()
          }
        }, delay)
      } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
        console.log('Max reconnect attempts reached, giving up')
        if (isMountedRef.current) {
          setConnectionError('Unable to connect to chat server. Please refresh the page.')
        }
        isConnectingRef.current = false
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error.message)
      if (isMountedRef.current) {
        setConnectionError(error.message)
        setIsConnecting(false)
        setSocket(null)
      }
      isConnectingRef.current = false
      
      if (isMountedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current), 30000)
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && !socketRef.current?.connected) {
            reconnectAttemptsRef.current++
            connect()
          }
        }, delay)
      }
    })

    newSocket.on('pong', (data) => {
      console.log('🏓 WebSocket pong received', data)
    })

    newSocket.on('service_created', (data) => {
      console.log('🔄 Real-time: Service created', data)
      window.dispatchEvent(new CustomEvent('service_created', { detail: data }))
    })

    newSocket.on('service_updated', (data) => {
      console.log('🔄 Real-time: Service updated', data)
      window.dispatchEvent(new CustomEvent('service_updated', { detail: data }))
    })

    newSocket.on('service_toggled', (data) => {
      console.log('🔄 Real-time: Service toggled', data)
      window.dispatchEvent(new CustomEvent('service_toggled', { detail: data }))
    })

    newSocket.on('new_request', (data) => {
      console.log('🔄 Real-time: New request submitted', data)
      window.dispatchEvent(new CustomEvent('new_request', { detail: data }))
    })
    
    newSocket.on('request_created', (data) => {
      console.log('🔄 Real-time: Request created for customer', data)
      window.dispatchEvent(new CustomEvent('request_created', { detail: data }))
    })

    newSocket.on('request_status_changed', (data) => {
      console.log('🔄 Real-time: Request status changed', data)
      window.dispatchEvent(new CustomEvent('request_status_changed', { detail: data }))
    })

    newSocket.on('provider_assigned', (data) => {
      console.log('🔄 Real-time: Provider assigned', data)
      window.dispatchEvent(new CustomEvent('provider_assigned', { detail: data }))
    })

    newSocket.on('job_claimed', (data) => {
      console.log('🔄 Real-time: Job claimed', data)
      window.dispatchEvent(new CustomEvent('job_claimed', { detail: data }))
    })

    newSocket.on('job_started', (data) => {
      console.log('🔄 Real-time: Job started', data)
      window.dispatchEvent(new CustomEvent('job_started', { detail: data }))
    })

    newSocket.on('job_completed', (data) => {
      console.log('🔄 Real-time: Job completed', data)
      window.dispatchEvent(new CustomEvent('job_completed', { detail: data }))
    })

    newSocket.on('customer_confirmed', (data) => {
      console.log('🔄 Real-time: Customer confirmed', data)
      window.dispatchEvent(new CustomEvent('customer_confirmed', { detail: data }))
    })

    newSocket.on('percentages_updated', (data) => {
      console.log('🔄 Real-time: Percentages updated', data)
      window.dispatchEvent(new CustomEvent('percentages_updated', { detail: data }))
    })

    newSocket.on('new_comment', (data) => {
      console.log('🔄 Real-time: New comment', data)
      window.dispatchEvent(new CustomEvent('new_comment', { detail: data }))
    })
    
    newSocket.on('comment_updated', (data) => {
      console.log('🔄 Real-time: Comment updated', data)
      window.dispatchEvent(new CustomEvent('comment_updated', { detail: data }))
    })
    
    newSocket.on('comment_deleted', (data) => {
      console.log('🔄 Real-time: Comment deleted', data)
      window.dispatchEvent(new CustomEvent('comment_deleted', { detail: data }))
    })
    
    newSocket.on('comment_toggled', (data) => {
      console.log('🔄 Real-time: Comment toggled', data)
      window.dispatchEvent(new CustomEvent('comment_toggled', { detail: data }))
    })
    
    newSocket.on('new_reply', (data) => {
      console.log('🔄 Real-time: New reply', data)
      window.dispatchEvent(new CustomEvent('new_reply', { detail: data }))
    })

    newSocket.on('new_quote', (data) => {
      console.log('🔄 Real-time: New quote', data)
      window.dispatchEvent(new CustomEvent('new_quote', { detail: data }))
    })
    
    newSocket.on('quote_status_updated', (data) => {
      console.log('🔄 Real-time: Quote status updated', data)
      window.dispatchEvent(new CustomEvent('quote_status_updated', { detail: data }))
    })

    newSocket.on('new_notification', (data) => {
      console.log('🔔 Real-time: New notification', data)
      window.dispatchEvent(new CustomEvent('new_notification', { detail: data }))
    })

    newSocket.on('user_verified', (data) => {
      console.log('🔄 Real-time: User verified', data)
      window.dispatchEvent(new CustomEvent('user_verified', { detail: data }))
    })
    
    newSocket.on('user_suspended', (data) => {
      console.log('🔄 Real-time: User suspended', data)
      window.dispatchEvent(new CustomEvent('user_suspended', { detail: data }))
    })
    
    newSocket.on('user_deleted', (data) => {
      console.log('🔄 Real-time: User deleted', data)
      window.dispatchEvent(new CustomEvent('user_deleted', { detail: data }))
    })
    
    newSocket.on('users_updated', (data) => {
      console.log('🔄 Real-time: Users updated', data)
      window.dispatchEvent(new CustomEvent('users_updated', { detail: data }))
    })

    newSocket.on('payment_settings_updated', (data) => {
      console.log('🔄 Real-time: Payment settings updated', data)
      window.dispatchEvent(new CustomEvent('payment_settings_updated', { detail: data }))
    })

    newSocket.on('new_message', (data) => {
      console.log('📩 New message received:', data)
      window.dispatchEvent(new CustomEvent('new_message_received', { detail: data }))
    })

    newSocket.on('typing', (data) => {
      if (isMountedRef.current) {
        setTypingUsers(prev => ({
          ...prev,
          [data.sender_id]: data.isTyping
        }))
        setTimeout(() => {
          if (isMountedRef.current) {
            setTypingUsers(prev => ({
              ...prev,
              [data.sender_id]: false
            }))
          }
        }, 3000)
      }
    })

    newSocket.on('message_delivered', (data) => {
      console.log('✅ Message delivered:', data)
      window.dispatchEvent(new CustomEvent('message_delivered', { detail: data }))
    })

    newSocket.on('message_read', (data) => {
      console.log('👁️ Message read:', data)
      window.dispatchEvent(new CustomEvent('message_read', { detail: data }))
    })

    newSocket.on('message_edited', (data) => {
      console.log('✏️ Message edited:', data)
      window.dispatchEvent(new CustomEvent('message_edited', { detail: data }))
    })

    newSocket.on('user_status', (data) => {
      console.log('🟢 User status changed:', data)
      if (isMountedRef.current) {
        setOnlineUsers(prev => ({
          ...prev,
          [data.userId]: data.isOnline
        }))
        window.dispatchEvent(new CustomEvent('user_status_changed', { detail: data }))
      }
    })
  }, [userId])

  const reconnect = useCallback(() => {
    console.log('Manual reconnect requested')
    reconnectAttemptsRef.current = 0
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    isConnectingRef.current = false
    disconnect()
    setTimeout(() => connect(), 100)
  }, [connect, disconnect])

  useEffect(() => {
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (userId) {
      reconnectAttemptsRef.current = 0
      isConnectingRef.current = false
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      connect()
    } else {
      disconnect()
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [userId, connect, disconnect])

  const sendMessage = useCallback((receiverId, message, messageId = null, replyToId = null) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('send_message', {
        receiverId,
        message,
        messageId: messageId || Date.now().toString(),
        replyToId,
        timestamp: new Date().toISOString()
      })
      return true
    }
    console.warn('Cannot send message: WebSocket not connected')
    return false
  }, [isConnected])

  const sendTyping = useCallback((receiverId, isTyping) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('typing', { receiverId, isTyping })
    }
  }, [isConnected])

  const markAsRead = useCallback((messageId, senderId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_read', { messageId, senderId })
    }
  }, [isConnected])

  const markAsDelivered = useCallback((messageId, senderId) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('mark_delivered', { messageId, senderId })
    }
  }, [isConnected])

  const value = {
    socket: socketRef.current,
    isConnected,
    isConnecting,
    connectionError,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendTyping,
    markAsRead,
    markAsDelivered,
    reconnect,
    onEvent: (event, callback) => {
      if (socketRef.current) {
        socketRef.current.on(event, callback)
        return () => socketRef.current?.off(event, callback)
      }
      return () => {}
    },
    connect,
    disconnect
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

export default WebSocketProvider
