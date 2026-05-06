import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const DataContext = createContext(null)

const STORAGE_KEY = 'empire_data'
const API_BASE = 'https://empire-api.faisal-cluster.workers.dev'

const DEFAULT_STORES = [
  { id: 's1', name: 'Bengal Crafts', emoji: '🏺', etsyUrl: '' },
  { id: 's2', name: 'Dhaka Designs', emoji: '🎨', etsyUrl: '' },
  { id: 's3', name: 'Artisan BD', emoji: '🧵', etsyUrl: '' },
  { id: 's4', name: 'Jute & Joy', emoji: '🌿', etsyUrl: '' },
  { id: 's5', name: 'Crafts Corner', emoji: '✨', etsyUrl: '' },
  { id: 's6', name: 'Heritage Hands', emoji: '🤲', etsyUrl: '' },
]

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 11)
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function getInitialData() {
  // 1. Define complete default structure
  const today = todayStr()
  const demoMetrics = {}
  DEFAULT_STORES.forEach(s => {
    const listingsTotal = Math.floor(Math.random() * 100) + 50
    demoMetrics[s.id] = {
      [today]: {
        sales_amount: Math.floor(Math.random() * 500) + 100,
        sales_count: Math.floor(Math.random() * 15) + 3,
        listings_added: Math.floor(Math.random() * 10) + 1,
        listings_total: listingsTotal,
        add_to_cart: Math.floor(Math.random() * 40) + 10,
        seo_visits: Math.floor(Math.random() * 500) + 100,
      }
    }
  })

  const defaults = {
    user: null,
    users: [
      { id: 'u1', email: 'admin@empire.com', name: 'Admin', password: 'admin123', role: 'admin' },
    ],
    stores: DEFAULT_STORES,
    selectedStoreId: DEFAULT_STORES[0].id,
    metrics: demoMetrics,
    metricHistory: [],
    teamMembers: [
      { id: 'u1', email: 'admin@empire.com', name: 'Admin', role: 'admin' },
    ],
    activity: [
      { id: 'a1', user: 'Admin', action: 'Created the workspace', time: new Date().toISOString(), color: '#667eea' },
    ],
  }

  // 2. Load from localStorage and merge
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        ...defaults,
        ...parsed,
        // Ensure arrays are at least initialized if they were null/missing in parsed
        users: parsed.users || defaults.users,
        stores: parsed.stores || defaults.stores,
        metrics: parsed.metrics || defaults.metrics,
        metricHistory: parsed.metricHistory || defaults.metricHistory,
        teamMembers: parsed.teamMembers || defaults.teamMembers,
        activity: parsed.activity || defaults.activity,
      }
    }
  } catch (e) { /* ignore */ }

  return defaults
}

export function DataProvider({ children }) {
  const [data, setData] = useState(getInitialData)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Login error:', error)
        return false
      }

      const result = await response.json()
      const { user, tokens } = result

      // Store tokens in localStorage
      localStorage.setItem('empire_access_token', tokens.accessToken)
      localStorage.setItem('empire_refresh_token', tokens.refreshToken)

      setData(d => ({ ...d, user }))
      return true
    } catch (error) {
      console.error('Login error:', error)
      return false
    }
  }, [])

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Register error:', error)
        return false
      }

      const result = await response.json()
      const { user, tokens } = result

      // Store tokens in localStorage
      localStorage.setItem('empire_access_token', tokens.accessToken)
      localStorage.setItem('empire_refresh_token', tokens.refreshToken)

      setData(d => ({
        ...d,
        user,
        teamMembers: [...d.teamMembers, { id: user.id, email: user.email, name: user.name, role: user.role }],
        activity: [{ id: generateId(), user: name, action: 'joined the team', time: new Date().toISOString(), color: '#43e97b' }, ...d.activity],
      }))
      return true
    } catch (error) {
      console.error('Register error:', error)
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('empire_refresh_token')
      if (refreshToken) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear tokens
      localStorage.removeItem('empire_access_token')
      localStorage.removeItem('empire_refresh_token')
      setData(d => ({ ...d, user: null }))
    }
  }, [])

  const selectStore = useCallback((storeId) => {
    setData(d => ({ ...d, selectedStoreId: storeId }))
  }, [])

  const addStore = useCallback((name, emoji) => {
    const id = generateId()
    setData(d => ({
      ...d,
      stores: [...d.stores, { id, name, emoji: emoji || '🏪', etsyUrl: '' }],
      metrics: { ...d.metrics, [id]: {} },
    }))
    showToast(`Store "${name}" added!`)
  }, [showToast])

  const deleteStore = useCallback((storeId) => {
    setData(d => {
      const newMetrics = { ...d.metrics }
      delete newMetrics[storeId]
      return {
        ...d,
        stores: d.stores.filter(s => s.id !== storeId),
        metrics: newMetrics,
        selectedStoreId: d.selectedStoreId === storeId ? (d.stores[0]?.id || '') : d.selectedStoreId,
      }
    })
    showToast('Store removed')
  }, [showToast])

  const addMetric = useCallback((storeId, metricType, value) => {
    const today = todayStr()
    const numVal = parseFloat(value) || 0
    if (numVal === 0) return

    setData(d => {
      const storeMetrics = { ...(d.metrics[storeId] || {}) }
      const dayMetrics = { ...(storeMetrics[today] || { sales_amount: 0, sales_count: 0, listings_added: 0, listings_total: 0, add_to_cart: 0, seo_visits: 0 }) }
      const prevVal = dayMetrics[metricType] || 0
      dayMetrics[metricType] = prevVal + numVal
      storeMetrics[today] = dayMetrics

      const historyEntry = {
        id: generateId(),
        storeId,
        storeName: d.stores.find(s => s.id === storeId)?.name || '',
        date: today,
        metric: metricType,
        addedValue: numVal,
        newValue: dayMetrics[metricType],
        addedBy: d.user?.name || 'Unknown',
        addedAt: new Date().toISOString(),
      }

      const activityEntry = {
        id: generateId(),
        user: d.user?.name || 'Unknown',
        action: `added ${metricType === 'sales_amount' ? '$' : ''}${numVal} to ${metricType.replace(/_/g, ' ')}`,
        time: new Date().toISOString(),
        color: metricType === 'sales_amount' ? '#667eea' : metricType === 'listings_added' ? '#00c6fb' : metricType === 'add_to_cart' ? '#f093fb' : '#43e97b',
      }

      return {
        ...d,
        metrics: { ...d.metrics, [storeId]: storeMetrics },
        metricHistory: [historyEntry, ...d.metricHistory],
        activity: [activityEntry, ...d.activity].slice(0, 50),
      }
    })

    const labels = { sales_amount: 'Sales', sales_count: 'Orders', listings_added: 'Listings', listings_total: 'Total Listings', add_to_cart: 'Add to Cart', seo_visits: 'SEO Visits' }
    showToast(`+${metricType === 'sales_amount' ? '$' : ''}${numVal} ${labels[metricType] || metricType}`)
  }, [showToast])

  const getStoreMetrics = useCallback((storeId, date) => {
    const d = date || todayStr()
    return data.metrics[storeId]?.[d] || { sales_amount: 0, sales_count: 0, listings_added: 0, listings_total: 0, add_to_cart: 0, seo_visits: 0 }
  }, [data.metrics])

  const getStoreHistory = useCallback((storeId, metricType) => {
    return data.metricHistory.filter(h => h.storeId === storeId && (!metricType || h.metric === metricType))
  }, [data.metricHistory])

  const getStoreTrend = useCallback((storeId, metricType, days = 7) => {
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateKey = d.toISOString().split('T')[0]
      const dayData = data.metrics[storeId]?.[dateKey]
      result.push({
        date: dateKey,
        label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        value: dayData?.[metricType] || 0,
      })
    }
    return result
  }, [data.metrics])

  const addTeamMember = useCallback((name, email, role) => {
    if (data.teamMembers.find(m => m.email === email)) {
      showToast('Member already exists')
      return false
    }
    const id = generateId()
    const password = 'empire' + Math.floor(Math.random() * 9000 + 1000)
    setData(d => ({
      ...d,
      users: [...d.users, { id, email, name, password, role }],
      teamMembers: [...d.teamMembers, { id, email, name, role }],
      activity: [{ id: generateId(), user: d.user?.name || 'Admin', action: `invited ${name} as ${role}`, time: new Date().toISOString(), color: '#f093fb' }, ...d.activity],
    }))
    showToast(`${name} added to team!`)
    return true
  }, [data.teamMembers, showToast])

  const removeTeamMember = useCallback((memberId) => {
    setData(d => ({
      ...d,
      teamMembers: d.teamMembers.filter(m => m.id !== memberId),
      users: d.users.filter(u => u.id !== memberId),
    }))
    showToast('Member removed')
  }, [showToast])

  const selectedStore = data.stores.find(s => s.id === data.selectedStoreId)

  const value = {
    ...data, selectedStore, toast,
    login, register, logout, selectStore, addStore, deleteStore,
    addMetric, getStoreMetrics, getStoreHistory, getStoreTrend,
    addTeamMember, removeTeamMember, showToast,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be inside DataProvider')
  return ctx
}
