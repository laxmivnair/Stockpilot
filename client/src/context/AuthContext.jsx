import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('stockpilot_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function verifyUser() {
      const storedToken = localStorage.getItem('stockpilot_token')
      if (!storedToken) {
        setLoading(false)
        return
      }

      try {
        const res = await api.getMe()
        setUser(res.user)
      } catch (err) {
        console.warn('Session verification failed, clearing stored token', err)
        localStorage.removeItem('stockpilot_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    verifyUser()
  }, [])

  const login = async (email, password) => {
    const res = await api.login({ email, password })
    localStorage.setItem('stockpilot_token', res.token)
    setToken(res.token)
    setUser(res.user)
    return res.user
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (err) {
      console.warn('Logout API error:', err)
    } finally {
      localStorage.removeItem('stockpilot_token')
      setToken(null)
      setUser(null)
    }
  }

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isEmployee: user?.role === 'employee',
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
