import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useWebSocketContext } from '../contexts/WebSocketContext'
import { 
  sendMessage, getUserMessages, markMessageRead, getUnreadMessagesCount, 
  getConversation, deleteMessage, getContacts, uploadFile, editMessage
} from '../api/client'
import DOMPurify from 'dompurify'
import EmojiPicker from 'emoji-picker-react'
import {
  Box, Container, Paper, TextField, Button, Typography,
  Avatar, IconButton, Badge, CircularProgress, Alert,
  InputAdornment, Menu, MenuItem, Tooltip, Chip, Tab, Tabs,
  Dialog, DialogTitle, DialogContent, DialogActions,
  LinearProgress, ClickAwayListener, Popper, Divider
} from '@mui/material'
import {
  Send as SendIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Message as MessageIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  DoneAll as DoneAllIcon,
  People as PeopleIcon,
  Chat as ChatIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  Build as BuildIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Edit as EditIcon,
  Reply as ReplyIcon,
  Close as CloseIcon,
  Image as ImageIcon,
  FilePresent as FileIcon,
  DeleteSweep as DeleteSweepIcon,
  WifiOff as WifiOffIcon,
  Wifi as WifiIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material'
import Header from '../layout/Header'
import ConfirmModal from '../common/ConfirmModal'

const saveMessagesState = (key, value) => {
  localStorage.setItem(`messages_${key}`, JSON.stringify(value))
}

const loadMessagesState = (key, defaultValue) => {
  const saved = localStorage.getItem(`messages_${key}`)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      return defaultValue
    }
  }
  return defaultValue
}

const Messages = () => {
  const { user } = useAuth()
  const { isConnected, sendMessage: wsSendMessage, sendTyping, markAsRead, typingUsers, onlineUsers, reconnect } = useWebSocketContext()
  
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [filteredConversations, setFilteredConversations] = useState([])
  const [selectedUser, setSelectedUser] = useState(() => loadMessagesState('selectedUser', null))
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState(null)
  const [contacts, setContacts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [tabValue, setTabValue] = useState(() => loadMessagesState('tabValue', 0))
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteForEveryone, setDeleteForEveryone] = useState(false)
  const [editMessageOpen, setEditMessageOpen] = useState(false)
  const [editMessageText, setEditMessageText] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [attachmentMenuAnchor, setAttachmentMenuAnchor] = useState(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [pullToRefresh, setPullToRefresh] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [unreadCounts, setUnreadCounts] = useState({})
  const [viewMessageOpen, setViewMessageOpen] = useState(false)
  const [viewingMessage, setViewingMessage] = useState(null)
  
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const isFetchingRef = useRef(false)
  const isMountedRef = useRef(true)
  const pollingIntervalRef = useRef(null)
  const initialLoadDoneRef = useRef(false)

  useEffect(() => {
    if (selectedUser) {
      saveMessagesState('selectedUser', selectedUser)
    }
  }, [selectedUser])

  useEffect(() => {
    saveMessagesState('tabValue', tabValue)
  }, [tabValue])

  useEffect(() => {
    if (selectedUser && unreadCounts[selectedUser.id]) {
      setUnreadCounts(prev => ({ ...prev, [selectedUser.id]: 0 }))
      const savedCounts = loadMessagesState('unreadCounts', {})
      delete savedCounts[selectedUser.id]
      saveMessagesState('unreadCounts', savedCounts)
    }
  }, [selectedUser, unreadCounts])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleNewMessage = (event) => {
      console.log('📩 New message event received:', event.detail)
      loadMessages()
      loadUnreadCounts()
    }
    
    const handleMessageDelivered = (event) => {
      console.log('✅ Message delivered event:', event.detail)
      loadMessages()
    }
    
    const handleMessageRead = (event) => {
      console.log('👁️ Message read event:', event.detail)
      loadMessages()
    }
    
    const handleMessageEdited = (event) => {
      console.log('✏️ Message edited event:', event.detail)
      loadMessages()
    }
    
    const handleUserStatusChanged = (event) => {
      console.log('🟢 User status changed:', event.detail)
      setContacts(prev => prev.map(contact => 
        contact.id === event.detail.userId 
          ? { ...contact, is_online: event.detail.isOnline }
          : contact
      ))
    }

    window.addEventListener('new_message_received', handleNewMessage)
    window.addEventListener('message_delivered', handleMessageDelivered)
    window.addEventListener('message_read', handleMessageRead)
    window.addEventListener('message_edited', handleMessageEdited)
    window.addEventListener('user_status_changed', handleUserStatusChanged)

    return () => {
      window.removeEventListener('new_message_received', handleNewMessage)
      window.removeEventListener('message_delivered', handleMessageDelivered)
      window.removeEventListener('message_read', handleMessageRead)
      window.removeEventListener('message_edited', handleMessageEdited)
      window.removeEventListener('user_status_changed', handleUserStatusChanged)
    }
  }, [])

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadMessages = useCallback(async () => {
    if (isFetchingRef.current || !isMountedRef.current) return
    isFetchingRef.current = true
    
    try {
      const res = await getUserMessages(user.id)
      if (!isMountedRef.current) return
      setMessages(res.data)
      
      const newUnreadCounts = {}
      const convMap = new Map()
      
      res.data.forEach(msg => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        const otherName = msg.sender_id === user.id ? msg.receiver_name : msg.sender_name
        const otherRole = msg.sender_id === user.id ? msg.receiver_role : msg.sender_role
        
        if (msg.receiver_id === user.id && !msg.is_read) {
          newUnreadCounts[otherId] = (newUnreadCounts[otherId] || 0) + 1
        }
        
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            id: otherId,
            name: otherName,
            role: otherRole,
            lastMessage: msg.message || (msg.attachment_name ? `📎 ${msg.attachment_name}` : ''),
            lastMessageTime: msg.created_at,
            unread: msg.receiver_id === user.id && !msg.is_read,
            lastMessageIsAttachment: !!msg.attachment_path
          })
        }
      })
      
      setUnreadCounts(newUnreadCounts)
      saveMessagesState('unreadCounts', newUnreadCounts)
      
      const convList = Array.from(convMap.values()).sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      )
      setConversations(convList)
      setFilteredConversations(convList)
    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      isFetchingRef.current = false
      setLoading(false)
    }
  }, [user.id])

  const loadContacts = useCallback(async () => {
    if (!isMountedRef.current) return
    
    try {
      const res = await getContacts(user.id)
      if (!isMountedRef.current) return
      setContacts(res.data)
      initialLoadDoneRef.current = true
    } catch (err) {
      console.error('Error loading contacts:', err)
    }
  }, [user.id])

  const loadUnreadCounts = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await getUnreadMessagesCount(user.id)
      window.dispatchEvent(new CustomEvent('unread_messages_updated', { detail: { count: res.data.count } }))
    } catch (err) {
      console.error('Error loading unread count:', err)
    }
  }, [user?.id])

  useEffect(() => {
    isMountedRef.current = true
    loadMessages()
    loadContacts()
    
    const intervalTime = selectedUser ? 3000 : 8000
    pollingIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && !document.hidden) {
        loadMessages()
      }
    }, intervalTime)
    
    return () => {
      isMountedRef.current = false
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [loadMessages, loadContacts, selectedUser])

  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      setFilteredConversations(
        conversations.filter(conv => 
          conv.name.toLowerCase().includes(term) ||
          (conv.lastMessage && conv.lastMessage.toLowerCase().includes(term))
        )
      )
    } else {
      setFilteredConversations(conversations)
    }
  }, [searchTerm, conversations])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (selectedUser) {
      const unreadMessages = messages.filter(m => 
        m.sender_id === selectedUser.id && m.receiver_id === user.id && !m.is_read
      )
      unreadMessages.forEach(async (msg) => {
        try {
          await markMessageRead(msg.id)
          if (markAsRead) markAsRead(msg.id, msg.sender_id)
        } catch (err) {
          console.error('Error marking message read:', err)
        }
      })
      setUnreadCounts(prev => ({ ...prev, [selectedUser.id]: 0 }))
    }
  }, [selectedUser, messages, user.id, markAsRead])

  const handleTyping = () => {
    if (!isTyping && selectedUser) {
      setIsTyping(true)
      if (sendTyping) sendTyping(selectedUser.id, true)
    }
    if (typingTimeout) clearTimeout(typingTimeout)
    const timeout = setTimeout(() => {
      setIsTyping(false)
      if (sendTyping && selectedUser) sendTyping(selectedUser.id, false)
    }, 1000)
    setTypingTimeout(timeout)
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !replyingTo && !uploadingFile) {
      showToast('Please enter a message', 'error')
      return
    }
    
    const sanitizedMessage = newMessage.trim() ? DOMPurify.sanitize(newMessage.trim()) : ''
    const tempId = Date.now().toString()
    
    const tempMessage = {
      id: tempId,
      sender_id: user.id,
      sender_name: user.full_name,
      sender_role: user.role,
      receiver_id: selectedUser.id,
      receiver_name: selectedUser.name,
      receiver_role: selectedUser.role,
      message: sanitizedMessage,
      reply_to_id: replyingTo?.id,
      is_read: false,
      is_delivered: false,
      created_at: new Date().toISOString(),
      is_temp: true
    }
    setMessages(prev => [...prev, tempMessage])
    setNewMessage('')
    setReplyingTo(null)
    setSending(true)
    
    let sent = false
    if (isConnected && wsSendMessage) {
      sent = wsSendMessage(selectedUser.id, sanitizedMessage, tempId, replyingTo?.id)
    }
    
    if (!sent) {
      try {
        await sendMessage({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          subject: 'Chat',
          message: sanitizedMessage,
          reply_to_id: replyingTo?.id
        })
        await loadMessages()
      } catch (err) {
        showToast(err.response?.data?.error || 'Failed to send message', 'error')
        setMessages(prev => prev.filter(m => m.id !== tempId))
      } finally {
        setSending(false)
      }
    } else {
      setSending(false)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    
    if (file.size > 50 * 1024 * 1024) {
      showToast('File too large. Maximum 50MB', 'error')
      return
    }
    
    setUploadingFile(true)
    try {
      const res = await uploadFile(file, user.id)
      const uploadedFile = res.data.file
      
      const tempId = Date.now().toString()
      const tempMessage = {
        id: tempId,
        sender_id: user.id,
        sender_name: user.full_name,
        sender_role: user.role,
        receiver_id: selectedUser.id,
        receiver_name: selectedUser.name,
        receiver_role: selectedUser.role,
        message: '',
        attachment_path: uploadedFile.path,
        attachment_type: uploadedFile.type,
        attachment_name: uploadedFile.original_name,
        is_read: false,
        is_delivered: false,
        created_at: new Date().toISOString(),
        is_temp: true
      }
      setMessages(prev => [...prev, tempMessage])
      
      await sendMessage({
        sender_id: user.id,
        receiver_id: selectedUser.id,
        subject: 'Chat',
        message: '',
        attachment_path: uploadedFile.path,
        attachment_type: uploadedFile.type,
        attachment_name: uploadedFile.original_name
      })
      await loadMessages()
      showToast('File sent!', 'success')
    } catch (err) {
      showToast('Error uploading file', 'error')
    } finally {
      setUploadingFile(false)
      setAttachmentMenuAnchor(null)
    }
  }

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji)
    setEmojiPickerAnchor(null)
  }

  const handleSelectConversation = async (conversation) => {
    setSelectedUser(conversation)
    setTabValue(0)
    setReplyingTo(null)
    setUnreadCounts(prev => ({ ...prev, [conversation.id]: 0 }))
    await loadMessages()
  }

  const handleNewConversation = async (selectedUserId, selectedUserName, selectedUserRole) => {
    const newSelectedUser = { id: selectedUserId, name: selectedUserName, role: selectedUserRole }
    setSelectedUser(newSelectedUser)
    setTabValue(0)
    setSearchTerm('')
    setReplyingTo(null)
    setUnreadCounts(prev => ({ ...prev, [selectedUserId]: 0 }))
    try {
      const res = await getConversation(user.id, selectedUserId)
      setMessages(res.data)
    } catch (err) {
      console.error('Error loading conversation:', err)
      setMessages([])
    }
  }

  const handleMessageMenuOpen = (event, message) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setSelectedMessage(message)
  }

  const handleMessageMenuClose = () => {
    setAnchorEl(null)
  }

  const handleCopyMessage = () => {
    if (selectedMessage) {
      navigator.clipboard.writeText(selectedMessage.message)
      showToast('Message copied!', 'success')
      handleMessageMenuClose()
    }
  }

  const handleViewMessage = (message) => {
    setViewingMessage(message)
    setViewMessageOpen(true)
  }

  const handleEditMessage = () => {
    if (selectedMessage) {
      setEditMessageText(selectedMessage.message)
      setEditMessageOpen(true)
      handleMessageMenuClose()
    }
  }

  const handleEditMessageSubmit = async () => {
    if (!editMessageText.trim()) {
      showToast('Message cannot be empty', 'error')
      return
    }
    try {
      await editMessage(selectedMessage.id, user.id, editMessageText)
      showToast('Message edited!', 'success')
      setEditMessageOpen(false)
      setEditMessageText('')
      await loadMessages()
    } catch (err) {
      showToast(err.response?.data?.error || 'Error editing message', 'error')
    }
  }

  const handleDeleteMessage = async () => {
    if (selectedMessage) {
      try {
        await deleteMessage(selectedMessage.id, user.id, deleteForEveryone)
        showToast(deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted', 'success')
        await loadMessages()
      } catch (err) {
        showToast(err.response?.data?.error || 'Error deleting message', 'error')
      }
    }
    setDeleteConfirmOpen(false)
    setDeleteForEveryone(false)
    setSelectedMessage(null)
    handleMessageMenuClose()
  }

  const confirmDeleteMessage = (deleteForEveryoneFlag = false) => {
    setDeleteForEveryone(deleteForEveryoneFlag)
    setDeleteConfirmOpen(true)
    handleMessageMenuClose()
  }

  const getMessageStatus = (message) => {
    if (message.sender_id !== user.id) return null
    if (message.is_read) return <DoneAllIcon sx={{ fontSize: 14, color: '#34b7f1' }} />
    if (message.is_delivered) return <DoneAllIcon sx={{ fontSize: 14, color: '#9e9e9e' }} />
    return <CheckIcon sx={{ fontSize: 14, color: '#9e9e9e' }} />
  }

  const getAttachmentIcon = (type) => {
    switch(type) {
      case 'image': return <ImageIcon />
      default: return <FileIcon />
    }
  }

  const getRoleIcon = (role) => {
    switch(role) {
      case 'admin': return <AdminIcon sx={{ fontSize: 14, color: '#8b5cf6' }} />
      case 'provider': return <BuildIcon sx={{ fontSize: 14, color: '#f59e0b' }} />
      default: return <PersonIcon sx={{ fontSize: 14, color: '#10b981' }} />
    }
  }

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin': return '#8b5cf6'
      case 'provider': return '#f59e0b'
      default: return '#10b981'
    }
  }

  const formatTime = (date) => {
    const d = new Date(date)
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    return d.toLocaleDateString()
  }

  const groupMessagesByDate = (messagesList) => {
    const groups = {}
    messagesList.forEach(msg => {
      const date = new Date(msg.created_at).toLocaleDateString()
      if (!groups[date]) groups[date] = []
      groups[date].push(msg)
    })
    return groups
  }

  const handleTouchStart = (e) => {
    if (messagesContainerRef.current?.scrollTop === 0) {
      setPullStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e) => {
    if (pullStartY && e.touches[0].clientY - pullStartY > 100) {
      setPullToRefresh(true)
    }
  }

  const handleTouchEnd = () => {
    if (pullToRefresh) {
      loadMessages()
      setPullToRefresh(false)
    }
    setPullStartY(0)
  }

  const conversationMessages = messages.filter(m => 
    ((m.sender_id === selectedUser?.id && m.receiver_id === user.id) ||
     (m.sender_id === user.id && m.receiver_id === selectedUser?.id)) &&
    !(m.is_deleted_for_sender && m.sender_id === user.id) &&
    !(m.is_deleted_for_receiver && m.receiver_id === user.id)
  ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const groupedMessages = groupMessagesByDate(conversationMessages)

  const getMessagingRules = () => {
    if (user.role === 'admin') {
      return "You can message all users (customers and providers)"
    } else if (user.role === 'provider') {
      return "You can message the Admin and only Customers assigned to your active or completed jobs"
    } else {
      return "You can message: Admin + Providers assigned to your active or completed jobs"
    }
  }

  const getReplyMessage = (replyToId) => {
    return messages.find(m => m.id === replyToId)
  }

  const totalUnreadCount = Object.values(unreadCounts).reduce((a, b) => a + b, 0)

  if (loading) {
    return (
      <>
        <Header onGetQuote={scrollToContact} hideNavLinks={true} />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress sx={{ color: '#10b981' }} />
        </Box>
      </>
    )
  }

  return (
    <>
      <Header onGetQuote={scrollToContact} hideNavLinks={true} />
      
      <Box sx={{ height: 'calc(100vh - 64px)', bgcolor: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
        {toast && (
          <Alert severity={toast.type} sx={{ position: 'fixed', top: 70, right: 20, zIndex: 1000, borderRadius: 2 }} onClose={() => setToast(null)}>
            {toast.message}
          </Alert>
        )}
        
        {pullToRefresh && (
          <LinearProgress sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 1000 }} />
        )}
        
        <Container maxWidth="xl" sx={{ height: '100%', py: 2, px: { xs: 1, md: 2 } }}>
          <Paper sx={{ display: 'flex', height: '100%', overflow: 'hidden', borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            
            {/* Sidebar */}
            <Box sx={{ 
              width: { xs: selectedUser && isMobile ? 0 : '100%', md: 360 }, 
              display: { xs: selectedUser && isMobile ? 'none' : 'flex', md: 'flex' },
              borderRight: '1px solid #e2e8f0', 
              flexDirection: 'column', 
              bgcolor: 'white', 
              overflow: 'hidden', 
              transition: 'width 0.3s' 
            }}>
              
              <Box sx={{ p: 2, bgcolor: '#075e54', color: 'white' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="600">Messages</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {!isConnected && (
                      <Tooltip title="Reconnect">
                        <IconButton onClick={reconnect} sx={{ color: '#f59e0b' }} size="small">
                          <WifiOffIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {isConnected && (
                      <Tooltip title="Connected">
                        <WifiIcon sx={{ color: '#25D366', fontSize: 20 }} />
                      </Tooltip>
                    )}
                    {totalUnreadCount > 0 && (
                      <Badge badgeContent={totalUnreadCount} color="error">
                        <MessageIcon />
                      </Badge>
                    )}
                  </Box>
                </Box>
                <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>
                  🟢 Always Online • {getMessagingRules()}
                </Typography>
              </Box>
              
              <Box sx={{ p: 1.5, bgcolor: '#f0f2f5' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search chats or contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#54656f', fontSize: 20 }} /></InputAdornment>
                    }
                  }}
                  sx={{ bgcolor: 'white', borderRadius: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>
              
              <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ borderBottom: '1px solid #e2e8f0' }}>
                <Tab icon={<ChatIcon />} label="Chats" iconPosition="start" />
                <Tab icon={<PeopleIcon />} label="Contacts" iconPosition="start" />
              </Tabs>
              
              {tabValue === 0 && (
                <Box sx={{ flex: 1, overflow: 'auto' }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                  {filteredConversations.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">No conversations yet</Typography>
                      <Button 
                        size="small" 
                        onClick={() => setTabValue(1)}
                        sx={{ mt: 1, color: '#10b981' }}
                      >
                        Start a new chat →
                      </Button>
                    </Box>
                  ) : (
                    filteredConversations.map(conv => (
                      <Box
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          p: 1.5,
                          cursor: 'pointer',
                          bgcolor: selectedUser?.id === conv.id ? '#e8f0fe' : 'transparent',
                          borderBottom: '1px solid #e2e8f0',
                          '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <Avatar sx={{ bgcolor: getRoleColor(conv.role), mr: 2 }}>
                            {conv.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          {onlineUsers[conv.id] && (
                            <Box sx={{ position: 'absolute', bottom: 2, right: 10, width: 10, height: 10, bgcolor: '#25D366', borderRadius: '50%', border: '2px solid white' }} />
                          )}
                        </Box>
                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" fontWeight={unreadCounts[conv.id] > 0 ? 'bold' : 'normal'} noWrap>
                                {conv.name}
                              </Typography>
                              {getRoleIcon(conv.role)}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {formatTime(conv.lastMessageTime)}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontWeight: unreadCounts[conv.id] > 0 ? 'bold' : 'normal' }}>
                            {conv.lastMessageIsAttachment ? '📎 ' : ''}{conv.lastMessage?.substring(0, 40)}
                          </Typography>
                        </Box>
                        {unreadCounts[conv.id] > 0 && (
                          <Badge badgeContent={unreadCounts[conv.id]} color="error" sx={{ ml: 1 }} />
                        )}
                      </Box>
                    ))
                  )}
                </Box>
              )}
              
              {tabValue === 1 && (
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <Box sx={{ p: 1.5, bgcolor: '#f0f2f5', borderBottom: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" color="text.secondary">
                      {contacts.length} contact{contacts.length !== 1 ? 's' : ''} available
                    </Typography>
                  </Box>
                  {contacts.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {user.role === 'customer' 
                          ? "No active service requests. Once you request a service and a provider is assigned, they'll appear here."
                          : user.role === 'provider'
                          ? "No active jobs assigned. Once you're assigned to a job, the customer will appear here."
                          : "No contacts available"}
                      </Typography>
                    </Box>
                  ) : (
                    contacts
                      .filter(contact => {
                        if (searchTerm && searchTerm.trim()) {
                          const term = searchTerm.toLowerCase().trim()
                          return contact.full_name?.toLowerCase().includes(term) ||
                                 (contact.email && contact.email.toLowerCase().includes(term)) ||
                                 (contact.phone && contact.phone.includes(term))
                        }
                        return true
                      })
                      .map(contact => (
                        <Box
                          key={contact.id}
                          onClick={() => handleNewConversation(contact.id, contact.full_name, contact.role)}
                          sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            p: 1.5,
                            cursor: 'pointer',
                            borderBottom: '1px solid #e2e8f0',
                            '&:hover': { bgcolor: '#f5f5f5' }
                          }}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <Avatar sx={{ bgcolor: getRoleColor(contact.role), mr: 2 }}>
                              {contact.full_name?.charAt(0).toUpperCase()}
                            </Avatar>
                            {contact.is_online && (
                              <Box sx={{ position: 'absolute', bottom: 2, right: 10, width: 10, height: 10, bgcolor: '#25D366', borderRadius: '50%', border: '2px solid white' }} />
                            )}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2" fontWeight="500">
                                {contact.full_name}
                              </Typography>
                              {getRoleIcon(contact.role)}
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {contact.role === 'admin' ? 'Administrator' : 
                               contact.role === 'provider' ? `⭐ ${contact.rating || 'New'} • ${contact.total_jobs || 0} jobs` :
                               'Customer'}
                            </Typography>
                          </Box>
                          <Button 
                            size="small" 
                            variant="outlined"
                            sx={{ borderColor: '#10b981', color: '#10b981', borderRadius: 2 }}
                          >
                            Message
                          </Button>
                        </Box>
                      ))
                  )}
                </Box>
              )}
            </Box>

            {/* Chat Area */}
            <Box sx={{ 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column', 
              bgcolor: '#e5ddd5', 
              position: 'relative',
              backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.02) 100%)'
            }}>
              {selectedUser ? (
                <>
                  <Box sx={{ 
                    p: 1.5, 
                    bgcolor: '#075e54', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    {isMobile && (
                      <IconButton onClick={() => setSelectedUser(null)} sx={{ color: 'white' }}>
                        <ArrowBackIcon />
                      </IconButton>
                    )}
                    <Box sx={{ position: 'relative' }}>
                      <Avatar sx={{ bgcolor: getRoleColor(selectedUser.role) }}>
                        {selectedUser.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, bgcolor: '#25D366', borderRadius: '50%', border: '2px solid #075e54' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="subtitle1" fontWeight="600">{selectedUser.name}</Typography>
                        {getRoleIcon(selectedUser.role)}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ opacity: 0.8, color: '#25D366' }}>
                          🟢 Online
                        </Typography>
                      </Box>
                    </Box>
                    <Chip 
                      size="small" 
                      label={isConnected ? '🟢 Live' : '📡 HTTP'} 
                      sx={{ bgcolor: isConnected ? '#25D366' : '#f59e0b', color: 'white' }} 
                    />
                  </Box>
                  
                  {replyingTo && (
                    <Box sx={{ p: 1, bgcolor: '#e8f0fe', borderLeft: `4px solid #10b981`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Replying to {replyingTo.sender_name}</Typography>
                        <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>{replyingTo.message?.substring(0, 50)}</Typography>
                      </Box>
                      <IconButton size="small" onClick={() => setReplyingTo(null)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  
                  <Box 
                    ref={messagesContainerRef}
                    sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    {Object.entries(groupedMessages).map(([date, msgs]) => (
                      <Box key={date}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                          <Typography variant="caption" sx={{ bgcolor: '#e0e0e0', px: 2, py: 0.5, borderRadius: 10 }}>
                            {date === new Date().toLocaleDateString() ? 'Today' : date}
                          </Typography>
                        </Box>
                        {msgs.map(msg => {
                          const replyTo = msg.reply_to_id ? getReplyMessage(msg.reply_to_id) : null
                          const isEdited = msg.updated_at && msg.updated_at !== msg.created_at
                          
                          return (
                            <Box
                              key={msg.id}
                              sx={{
                                display: 'flex',
                                justifyContent: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                                position: 'relative'
                              }}
                            >
                              <Paper
                                onClick={() => handleViewMessage(msg)}
                                onContextMenu={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleMessageMenuOpen(e, msg)
                                }}
                                sx={{
                                  p: 1.5,
                                  maxWidth: { xs: '85%', md: '70%' },
                                  bgcolor: msg.sender_id === user.id ? '#dcf8c5' : 'white',
                                  borderRadius: 2,
                                  position: 'relative',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  '&:hover': { opacity: 0.9 }
                                }}
                              >
                                {replyTo && (
                                  <Box sx={{ mb: 1, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1, borderLeft: `3px solid #10b981` }}>
                                    <Typography variant="caption" fontWeight="bold" color="text.secondary">
                                      {replyTo.sender_name}:
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      {replyTo.message?.substring(0, 60) || (replyTo.attachment_name ? `📎 ${replyTo.attachment_name}` : '')}
                                    </Typography>
                                  </Box>
                                )}
                                
                                {msg.attachment_path && (
                                  <Box sx={{ mb: 1 }}>
                                    {msg.attachment_type === 'image' ? (
                                      <Box sx={{ maxWidth: 200, maxHeight: 150, overflow: 'hidden', borderRadius: 1 }}>
                                        <img 
                                          src={msg.attachment_path} 
                                          alt={msg.attachment_name}
                                          style={{ width: '100%', height: 'auto', cursor: 'pointer' }}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            window.open(`${import.meta.env.VITE_API_URL || ''}${msg.attachment_path}`, '_blank')
                                          }}
                                        />
                                      </Box>
                                    ) : (
                                      <Button 
                                        size="small" 
                                        startIcon={getAttachmentIcon(msg.attachment_type)}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          window.open(`${import.meta.env.VITE_API_URL || ''}${msg.attachment_path}`, '_blank')
                                        }}
                                        sx={{ textTransform: 'none' }}
                                      >
                                        {msg.attachment_name}
                                      </Button>
                                    )}
                                  </Box>
                                )}
                                
                                {msg.message && (
                                  <Typography 
                                    variant="body2"
                                    sx={{
                                      overflow: 'hidden',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical'
                                    }}
                                  >
                                    {msg.message}
                                  </Typography>
                                )}
                                
                                {isEdited && (
                                  <Typography variant="caption" sx={{ opacity: 0.5, fontSize: '0.6rem', display: 'block' }}>
                                    (edited)
                                  </Typography>
                                )}
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.5 }}>
                                  <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.65rem' }}>
                                    {formatTime(msg.created_at)}
                                  </Typography>
                                  {getMessageStatus(msg)}
                                </Box>
                              </Paper>
                              
                              <IconButton
                                size="small"
                                onClick={(e) => handleMessageMenuOpen(e, msg)}
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  [msg.sender_id === user.id ? 'left' : 'right']: -30,
                                  opacity: 0.5,
                                  '&:hover': { opacity: 1 }
                                }}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          )
                        })}
                      </Box>
                    ))}
                    {typingUsers && typingUsers[selectedUser.id] && (
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                        <Paper sx={{ p: 1, bgcolor: 'white', borderRadius: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            {selectedUser.name} is typing...
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                    <div ref={messagesEndRef} />
                  </Box>
                  
                  <Box sx={{ p: 1.5, bgcolor: '#f0f2f5', display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <IconButton 
                      onClick={(e) => setEmojiPickerAnchor(e.currentTarget)}
                      sx={{ color: '#54656f' }}
                    >
                      <EmojiIcon />
                    </IconButton>
                    
                    {/* Emoji Picker - Properly sized */}
<Popper
  open={Boolean(emojiPickerAnchor)}
  anchorEl={emojiPickerAnchor}
  placement="top-start"
  sx={{ zIndex: 9999 }}
>
  <ClickAwayListener onClickAway={() => setEmojiPickerAnchor(null)}>
    <Box 
      sx={{ 
        mt: 1,
        '& .EmojiPickerReact': {
          width: '320px !important',
          height: '400px !important',
          '--epr-emoji-size': '26px',
          '--epr-emoji-gap': '4px',
        },
        '& .epr-emoji-category-content': {
          display: 'grid !important',
          gridTemplateColumns: 'repeat(8, 1fr) !important',
        },
      }}
    >
          <EmojiPicker 
        onEmojiClick={handleEmojiClick} 
        theme="light"
        width="320"
        height="400"
        previewConfig={{ showPreview: false }}
        searchDisabled={true}
        skinTonesDisabled={false}
    />
    </Box>
  </ClickAwayListener>
</Popper>
                    
                    <IconButton 
                      onClick={(e) => setAttachmentMenuAnchor(e.currentTarget)}
                      sx={{ color: '#54656f' }}
                    >
                      <AttachFileIcon />
                    </IconButton>
                    
                    <Menu
                      anchorEl={attachmentMenuAnchor}
                      open={Boolean(attachmentMenuAnchor)}
                      onClose={() => setAttachmentMenuAnchor(null)}
                    >
                      <MenuItem component="label">
                        <input
                          type="file"
                          hidden
                          accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                        />
                        <AttachFileIcon sx={{ mr: 1.5 }} /> Choose File
                      </MenuItem>
                    </Menu>
                    
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type a message"
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value)
                        handleTyping()
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && !sending && handleSendMessage()}
                      sx={{ bgcolor: 'white', borderRadius: 2, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      disabled={uploadingFile}
                    />
                    
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={sending || (!newMessage.trim() && !replyingTo) || uploadingFile}
                      sx={{ bgcolor: '#075e54', '&:hover': { bgcolor: '#054740' }, minWidth: 50, borderRadius: 2 }}
                    >
                      {sending ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <SendIcon />}
                    </Button>
                  </Box>
                  
                  {uploadingFile && (
                    <LinearProgress sx={{ position: 'absolute', bottom: 70, left: 0, right: 0 }} />
                  )}
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', gap: 2 }}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: '#075e54' }}>
                    <MessageIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Typography variant="h6" color="text.secondary">Select a chat to start messaging</Typography>
                  <Typography variant="body2" color="text.secondary">Click on a conversation or go to Contacts tab</Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => setTabValue(1)}
                    sx={{ borderColor: '#10b981', color: '#10b981' }}
                  >
                    Browse Contacts
                  </Button>
                </Box>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>

      {/* Message Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMessageMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedMessage) {
            handleViewMessage(selectedMessage)
            handleMessageMenuClose()
          }
        }}>
          <VisibilityIcon sx={{ mr: 1.5, fontSize: 20 }} /> View Message
        </MenuItem>
        <MenuItem onClick={handleCopyMessage}>
          <CopyIcon sx={{ mr: 1.5, fontSize: 20 }} /> Copy Message
        </MenuItem>
        {selectedMessage?.sender_id === user.id && (
          <MenuItem onClick={handleEditMessage}>
            <EditIcon sx={{ mr: 1.5, fontSize: 20 }} /> Edit Message
          </MenuItem>
        )}
        <MenuItem onClick={() => confirmDeleteMessage(false)}>
          <DeleteIcon sx={{ mr: 1.5, fontSize: 20 }} /> Delete for me
        </MenuItem>
        {selectedMessage?.sender_id === user.id && (
          <MenuItem onClick={() => confirmDeleteMessage(true)} sx={{ color: '#ef4444' }}>
            <DeleteSweepIcon sx={{ mr: 1.5, fontSize: 20 }} /> Delete for everyone
          </MenuItem>
        )}
        {selectedMessage && (
          <MenuItem onClick={() => {
            setReplyingTo(selectedMessage)
            handleMessageMenuClose()
          }}>
            <ReplyIcon sx={{ mr: 1.5, fontSize: 20 }} /> Reply
          </MenuItem>
        )}
      </Menu>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteMessage}
        title={deleteForEveryone ? "Delete for Everyone" : "Delete Message"}
        message={deleteForEveryone 
          ? "This message will be deleted for everyone. This action cannot be undone." 
          : "This message will be deleted only for you. The other person will still see it."}
        confirmText="Delete"
        confirmColor="#ef4444"
        loading={false}
      />

      {/* Edit Message Modal */}
      <Dialog open={editMessageOpen} onClose={() => setEditMessageOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Message</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={editMessageText}
            onChange={(e) => setEditMessageText(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Alert severity="info" sx={{ mt: 2 }}>
            You can only edit messages within 5 minutes of sending.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMessageOpen(false)}>Cancel</Button>
          <Button onClick={handleEditMessageSubmit} variant="contained" sx={{ bgcolor: '#10b981' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Message Modal */}
      <Dialog open={viewMessageOpen} onClose={() => setViewMessageOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#10b981', color: 'white' }}>
          Message from {viewingMessage?.sender_name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {new Date(viewingMessage?.created_at).toLocaleString()}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {viewingMessage?.attachment_path && (
            <Box sx={{ mb: 2 }}>
              {viewingMessage.attachment_type === 'image' ? (
                <Box sx={{ maxWidth: '100%', maxHeight: 300, overflow: 'hidden', borderRadius: 1 }}>
                  <img 
                    src={viewingMessage.attachment_path} 
                    alt={viewingMessage.attachment_name}
                    style={{ width: '100%', height: 'auto', cursor: 'pointer' }}
                    onClick={() => window.open(`${import.meta.env.VITE_API_URL || ''}${viewingMessage.attachment_path}`, '_blank')}
                  />
                </Box>
              ) : (
                <Button 
                  startIcon={getAttachmentIcon(viewingMessage.attachment_type)}
                  onClick={() => window.open(`${import.meta.env.VITE_API_URL || ''}${viewingMessage.attachment_path}`, '_blank')}
                >
                  {viewingMessage.attachment_name}
                </Button>
              )}
            </Box>
          )}
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {viewingMessage?.message}
          </Typography>
          {viewingMessage?.reply_to_id && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f0fdf4', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">
                In reply to:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {messages.find(m => m.id === viewingMessage.reply_to_id)?.message?.substring(0, 100)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewMessageOpen(false)}>Close</Button>
          {viewingMessage?.sender_id === user.id && (
            <Button 
              onClick={() => {
                setViewMessageOpen(false)
                setEditMessageText(viewingMessage.message)
                setSelectedMessage(viewingMessage)
                setEditMessageOpen(true)
              }}
              sx={{ color: '#10b981' }}
            >
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  )
}

export default Messages