import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://smart-expense-tracker-0jwb.onrender.com',
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — clear auth and redirect, and intercept dynamic notifications
api.interceptors.response.use(
  (res) => {
    // ── AXIOS NOTIFICATION INTERCEPTOR ENGINE ──
    try {
      if (res.config.method === 'post' && res.config.url?.includes('/api/expenses') && res.data?.budget_alert) {
        const [type, message] = res.data.budget_alert.split('|')
        
        // Load user settings from localStorage (defaults to true if not set)
        const savedSettings = JSON.parse(localStorage.getItem('app_settings') || '{}')
        
        if ('Notification' in window && Notification.permission === 'granted') {
          const isLimit = type === 'LIMIT_EXCEEDED'
          const isThreshold = type === 'THRESHOLD_80'
          const isAnomaly = type === 'UNUSUAL_ACTIVITY'

          let shouldShow = false
          let title = 'Smart Expense Tracker'

          if (isLimit) {
            shouldShow = savedSettings.overspendingAlerts !== false
            title = '🚨 Budget Limit Exceeded!'
          } else if (isThreshold) {
            shouldShow = savedSettings.budgetAlerts !== false
            title = '⚠️ Budget Warning (80%)'
          } else if (isAnomaly) {
            shouldShow = savedSettings.unusualActivity === true
            title = '⚠️ Unusual Activity Detected!'
          }

          if (shouldShow) {
            const options = {
              body: message,
              icon: '/icon-192.png',
              badge: '/favicon.svg',
              vibrate: [100, 50, 100],
              tag: type
            }

            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
              navigator.serviceWorker.ready
                .then((reg) => {
                  reg.showNotification(title, options)
                })
                .catch((err) => {
                  console.warn('[SW showNotification failed, falling back]', err)
                  try {
                    new Notification(title, options)
                  } catch (e) {
                    console.error('[Fallback Notification failed]', e)
                  }
                })
            } else {
              try {
                new Notification(title, options)
              } catch (e) {
                console.error('[Direct Notification failed]', e)
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('[Axios Notification Interceptor Error]', e)
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
