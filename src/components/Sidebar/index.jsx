'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './Sidebar.module.css'

function Sidebar() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // Carregar tema do localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const startNewConversation = () => {
    // Aqui você implementaria a lógica para iniciar nova conversa
    console.log('Nova conversa iniciada')
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <button 
          className={styles.newChatBtn}
          onClick={startNewConversation}
        >
          <span className={styles.plusIcon}>+</span>
          Nova Conversa
        </button>
      </div>

      <div className={styles.conversationsList}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>💬</div>
          <h3 className={styles.emptyTitle}>Conversas Anteriores</h3>
          <p className={styles.emptyDescription}>
            Suas conversas aparecerão aqui quando você começar a usar o chat.
          </p>
        </div>
      </div>

      <div className={styles.sidebarFooter}>
        <Link href="/sobre" className={styles.aboutLink}>
          <span className={styles.aboutIcon}>ℹ️</span>
          Sobre o CorrigeAI
        </Link>
        
        <button 
          className={styles.themeToggle}
          onClick={toggleTheme}
          title={`Mudar para tema ${theme === 'light' ? 'escuro' : 'claro'}`}
        >
          <span className={styles.themeIcon}>
            {theme === 'light' ? '🌙' : '☀️'}
          </span>
          {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
