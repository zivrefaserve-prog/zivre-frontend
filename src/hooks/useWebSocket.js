import { useState, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const useWebSocket = (userId, options = {}) => {
  const {
    autoConnect = true,
    onMessageReceived,
    onTypingReceived,
    onStatusChange,
    onReadReceipt,
    reconnectAttempts = 5,
    reconnectDelay = 1000
  } = options

  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    if (!userId) return
    if (socket?.connected) return

    setIsConnecting(true)
    setConnectionError(null)

    const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:5000'
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      query: { userId },
      reconnection: false,
      timeout: 10000
    })

    newSocket.on('connect', () => {
      console.log('WebSocket connected')
      setIsConnected(true)
      setIsConnecting(false)
      setConnectionError(null)
      reconnectAttemptsRef.current = 0
      
      if (onStatusChange) onStatusChange(true)
    })

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      setIsConnected(false)
      
      if (onStatusChange) onStatusChange(false)
      
      if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < reconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++
          connect()
        }, reconnectDelay * reconnectAttemptsRef.current)
      }
    })

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      setConnectionError(error.message)
      setIsConnecting(false)
      
      if (reconnectAttemptsRef.current < reconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++
          connect()
        }, reconnectDelay * reconnectAttemptsRef.current)
      }
    })

    newSocket.on('new_message', (data) => {
      if (onMessageReceived) onMessageReceived(data)
    })

    newSocket.on('typing', (data) => {
      if (onTypingReceived) onTypingReceived(data)
    })

    newSocket.on('message_delivered', (data) => {
      if (onReadReceipt) onReadReceipt(data)
    })

    newSocket.on('message_read', (data) => {
      if (onReadReceipt) onReadReceipt(data)
    })

    newSocket.on('user_status', (data) => {
      if (onStatusChange) onStatusChange(data.isOnline, data.userId)
    })

    setSocket(newSocket)
  }, [userId, socket, reconnectAttempts, reconnectDelay, onMessageReceived, onTypingReceived, onStatusChange, onReadReceipt])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
    setIsConnected(false)
    setIsConnecting(false)
  }, [socket])

  const sendMessage = useCallback((receiverId, message, messageId = null) => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        receiverId,
        message,
        messageId: messageId || Date.now().toString(),
        timestamp: new Date().toISOString()
      })
      return true
    }
    return false
  }, [socket, isConnected])

  const sendTyping = useCallback((receiverId, isTyping) => {
    if (socket && isConnected) {
      socket.emit('typing', { receiverId, isTyping })
    }
  }, [socket, isConnected])

  const markAsRead = useCallback((messageId, senderId) => {
    if (socket && isConnected) {
      socket.emit('mark_read', { messageId, senderId })
    }
  }, [socket, isConnected])

  const markAsDelivered = useCallback((messageId, senderId) => {
    if (socket && isConnected) {
      socket.emit('mark_delivered', { messageId, senderId })
    }
  }, [socket, isConnected])

  useEffect(() => {
    if (autoConnect && userId) {
      connect()
    }
    return () => {
      disconnect()
    }
  }, [autoConnect, userId, connect, disconnect])

  return {
    socket,
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    sendTyping,
    markAsRead,
    markAsDelivered
  }
}

export default useWebSocket