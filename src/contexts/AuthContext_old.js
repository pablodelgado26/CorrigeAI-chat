'use client'

import React, { createContext, useContext, use  const login = useCallback(async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Salvar token e dados do usuário
        Cookies.set('authToken', data.token, { 
          expires: 7, // 7 dias
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        })
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return { success: true, data }
      } else {
        return { success: false, error: data.error || 'Erro no login' }
      }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Erro de conexão' }
    }
  }, [])

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
        // Salvar token e dados do usuário
        Cookies.set('authToken', data.token, { 
          expires: 7, // 7 dias
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        })
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return { success: true, data }
      } else {
        return { success: false, error: data.error || 'Erro no cadastro' }
      }
    } catch (error) {
      console.error('Erro no registro:', error)
      return { success: false, error: 'Erro de conexão' }
    }
  }, [])Effect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Cookies from 'js-cookie'

const AuthContext = createContext({})

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
      Cookies.remove('authToken')
      localStorage.removeItem('user')
      setUser(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }, [router])

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = Cookies.get('authToken')
        const userData = localStorage.getItem('user')

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
      Cookies.set('authToken', token, { expires: 7 })
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      router.push('/')
    } catch (error) {
      console.error('Erro no login:', error)
    }
  }, [router])

  const getAuthHeaders = useCallback(() => {
    const token = Cookies.get('authToken')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }, [])

  const value = {
    user,
    loading,
    login,
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
