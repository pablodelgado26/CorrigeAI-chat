'use client'

import { useAuth } from '../contexts/AuthContext'
import Loading from './Loading/index.jsx'

function AuthGuard({ children }) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '200px',
        textAlign: 'center'
      }}>
        <Loading />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
          Verificando autenticação...
        </p>
      </div>
    )
  }

  return children
}

export default AuthGuard
