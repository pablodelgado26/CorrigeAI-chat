'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const AuthContext = createContext({})

// Utilitário para gerenciar cookies manualmente
const cookieUtils = {
  set: (name, value, days = 7) => {
    if (typeof document !== 'undefined') {
      const expires = new Date()
      expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`
    }
  },
  
  get: (name) => {
    if (typeof document === 'undefined') return null
    
    const nameEQ = name + "="
    const ca = document.cookie.split(';')
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  },
  
  remove: (name) => {
    if (typeof document !== 'undefined') {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
    }
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const isAuthRoute = useCallback((path) => {
    return path?.startsWith('/auth/')
  }, [])

  const logout = useCallback(() => {
    try {
      cookieUtils.remove('authToken')
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('user')
      }
      setUser(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }, [router])

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = cookieUtils.get('authToken')
        const userData = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null

        if (token && userData) {
          setUser(JSON.parse(userData))
          // Se está logado e tenta acessar página de auth, redirecionar para home
          if (isAuthRoute(pathname)) {
            router.push('/')
            return
          }
        } else {
          // Se não tem token/dados e não está em rota de auth, redirecionar para login
          if (!isAuthRoute(pathname)) {
            router.push('/auth/login')
            return
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error)
        logout()
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [pathname, router, logout, isAuthRoute])

  const login = useCallback((userData, token) => {
    try {
      cookieUtils.set('authToken', token, 7)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData))
      }
      setUser(userData)
      router.push('/')
    } catch (error) {
      console.error('Erro no login:', error)
    }
  }, [router])

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Após registro bem-sucedido, fazer login automaticamente
        if (data.token && data.user) {
          login(data.user, data.token)
        }
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.error || 'Erro no cadastro' }
      }
    } catch (error) {
      console.error('Erro no registro:', error)
      return { success: false, error: 'Erro de conexão. Tente novamente.' }
    }
  }, [login])

  const getAuthHeaders = useCallback(() => {
    const token = cookieUtils.get('authToken')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }, [])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    getAuthHeaders,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
