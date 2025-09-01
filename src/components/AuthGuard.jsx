'use client'

import { useAuth } from '../contexts/AuthContext'
import styles from './loading.module.css'

function AuthGuard({ children }) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Verificando autenticação...</p>
      </div>
    )
  }

  return children
}

export default AuthGuard
