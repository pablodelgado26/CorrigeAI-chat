'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import styles from './Toast.module.css'

const ToastContext = createContext()

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showSuccess = useCallback((message, duration) => {
    return addToast(message, 'success', duration)
  }, [addToast])

  const showError = useCallback((message, duration) => {
    return addToast(message, 'error', duration)
  }, [addToast])

  const showInfo = useCallback((message, duration) => {
    return addToast(message, 'info', duration)
  }, [addToast])

  const showWarning = useCallback((message, duration) => {
    return addToast(message, 'warning', duration)
  }, [addToast])

  const value = {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    removeToast
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const Toast = ({ id, message, type, onClose }) => {
  return (
    <div 
      className={`${styles.toast} ${styles[type]}`}
      onClick={onClose}
    >
      <div className={styles.toastContent}>
        <div className={styles.toastIcon}>
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </div>
        <div className={styles.toastMessage}>
          {message}
        </div>
      </div>
      <button 
        className={styles.toastClose}
        onClick={onClose}
        aria-label="Fechar notificação"
      >
        ×
      </button>
    </div>
  )
}

export default ToastProvider
