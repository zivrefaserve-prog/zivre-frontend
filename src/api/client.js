import axios from 'axios'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
})

// FIXED: Handle 403 for admin endpoints properly
api.interceptors.response.use(
    response => response,
    error => {
        const url = error.config?.url || ''
        const isJobsEndpoint = url.includes('/jobs/available') || url.includes('/jobs/provider/')
        const isAdminEndpoint = url.includes('/admin/')
        
        // For admin endpoints with 403 - return empty data (don't redirect, don't throw)
        if (isAdminEndpoint && error.response?.status === 403) {
            console.log('Admin access restricted - returning empty data')
            return Promise.resolve({ data: [] })
        }
        
        // For 401 on non-jobs endpoints - redirect to login
        if (error.response?.status === 401 && !isJobsEndpoint) {
            sessionStorage.removeItem('zivre_user')
            window.location.href = '/'
            return Promise.reject(error)
        }
        
        // For jobs endpoints with 403 or 401 - return empty array
        if (isJobsEndpoint && (error.response?.status === 403 || error.response?.status === 401)) {
            return Promise.resolve({ data: [] })
        }
        
        return Promise.reject(error)
    }
)

// ========== AUTH ==========
export const signup = (data) => api.post('/auth/signup', data)
export const login = (data) => api.post('/auth/login', data)
export const logout = () => api.post('/auth/logout')
export const getUser = (userId) => api.get(`/auth/user/${userId}`)
export const updateProfile = (userId, data) => api.put(`/auth/update-profile/${userId}`, data)
export const changePassword = (userId, data) => api.put(`/auth/change-password/${userId}`, data)
export const toggleOnlineStatus = (userId, isOnline) => api.put(`/auth/toggle-online/${userId}`, { is_online: isOnline })

// ========== SESSION KEEP ALIVE ==========
export const keepAlive = () => api.get('/auth/ping')

// ========== PERCENTAGES ==========
export const getPercentages = () => api.get('/settings/percentages')
export const updatePercentages = (data) => api.put('/admin/settings/percentages', data)

// ========== UPLOADS ==========
export const uploadFile = (file, userId) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)
    return api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

// ========== SERVICES ==========
export const getServices = (activeOnly = false) => api.get(`/services?active_only=${activeOnly}`)
export const createService = (data) => api.post('/services', data)
export const updateService = (id, data) => api.put(`/services/${id}`, data)
export const toggleServiceActive = (id) => api.put(`/services/${id}/toggle`)

// ========== QUOTES ==========
export const createQuote = (data) => api.post('/quotes', data)
export const getQuotes = () => api.get('/quotes')
export const updateQuoteStatus = (id, status) => api.put(`/quotes/${id}/status`, { status })
export const deleteQuote = (id) => api.delete(`/quotes/${id}`)

// ========== SERVICE REQUESTS ==========
export const createRequest = (data) => api.post('/requests', data)
export const getUserRequests = (userId) => api.get(`/requests/user/${userId}`)
export const approveAndAssignRequest = (requestId, providerId) => api.put(`/requests/${requestId}/approve-assign`, { provider_id: providerId })
export const notifyNoProvider = (requestId) => api.post(`/requests/${requestId}/notify-no-provider`)
export const rateRequest = (requestId, rating) => api.post(`/requests/${requestId}/rate`, { rating })
export const confirmRequestCompletion = (requestId) => api.put(`/requests/${requestId}/confirm`)
export const providerCompleteRequest = (requestId) => api.put(`/requests/${requestId}/provider-complete`)

// ========== JOBS / PROVIDER ==========
export const getAvailableJobs = () => api.get('/jobs/available')
export const claimJob = (data) => api.post('/jobs/claim', data)
export const getProviderJobs = (providerId) => api.get(`/jobs/provider/${providerId}`)
export const updateJobStatus = (jobId, status) => api.put(`/jobs/${jobId}/status`, { status })

// ========== NOTIFICATIONS ==========
export const getNotifications = (userId) => api.get(`/notifications/${userId}`)
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`)
export const markAllNotificationsRead = (userId) => api.put(`/notifications/read-all/${userId}`)
export const deleteAllNotifications = (userId) => api.delete(`/notifications/delete-all/${userId}`)
export const getUnreadCount = (userId) => api.get(`/notifications/unread-count/${userId}`)
export const deleteNotification = (notificationId) => api.delete(`/notifications/${notificationId}`)

// ========== MESSAGING ==========
export const sendMessage = (data) => api.post('/messages', data)
export const getUserMessages = (userId) => api.get(`/messages/user/${userId}`)
export const markMessageRead = (id) => api.put(`/messages/${id}/read`)
export const getUnreadMessagesCount = (userId) => api.get(`/messages/unread/${userId}`)
export const getConversation = (user1, user2) => api.get(`/messages/conversation/${user1}/${user2}`)
export const deleteMessage = (messageId, userId, deleteForEveryone = false) => api.delete(`/messages/${messageId}`, { data: { user_id: userId, delete_for_everyone: deleteForEveryone } })
export const editMessage = (messageId, userId, newMessage) => api.put(`/messages/${messageId}/edit`, { user_id: userId, message: newMessage })

// ========== CONTACTS ==========
export const getContacts = (userId) => api.get(`/contacts/${userId}`)

// ========== ADMIN ==========
export const getAllUsers = () => api.get('/admin/users')
export const getUserFullDetails = (userId) => api.get(`/admin/users/${userId}/full-details`)
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`)
export const verifyUser = (userId) => api.put(`/admin/users/${userId}/verify`)
export const suspendUser = (userId) => api.put(`/admin/users/${userId}/suspend`)
export const getAllRequests = () => api.get('/admin/requests')
export const getAvailableProviders = (serviceId = null) => {
    const url = serviceId ? `/admin/providers?service_id=${serviceId}` : '/admin/providers'
    return api.get(url)
}
export const getAdminStats = () => api.get('/admin/stats')

// ========== COMMENTS ==========
export const getComments = () => api.get('/comments')
export const createComment = (data) => api.post('/comments', data)
export const updateComment = (commentId, data) => api.put(`/comments/${commentId}`, data)
export const deleteComment = (commentId, userId) => api.delete(`/comments/${commentId}`, { data: { user_id: userId } })
export const createReply = (data) => api.post('/comments/reply', data)
export const getAdminComments = () => api.get('/admin/comments')
export const toggleCommentApproval = (commentId) => api.put(`/admin/comments/${commentId}/toggle`)
export const adminDeleteComment = (commentId) => api.delete(`/admin/comments/${commentId}`)

// ========== PAYMENT SETTINGS ==========
export const getPaymentSettings = () => api.get('/admin/payment-settings')
export const updatePaymentSettings = (data) => api.put('/admin/payment-settings', data)

// ========== PASSWORD RESET ==========
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email })
export const resetPassword = (token, newPassword) => api.post('/auth/reset-password', { token, new_password: newPassword })

export default api
