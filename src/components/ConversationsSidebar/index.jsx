'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './ConversationsSidebar.module.css'

function ConversationsSidebar({ isOpen, onToggle, currentConversationId, onConversationSelect }) {
  const [conversations, setConversations] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // Carregar tema do localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
  }, [])

  useEffect(() => {
    if (isOpen) {
      loadConversations()
    }
  }, [isOpen])

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nova Conversa' })
      })
      
      if (response.ok) {
        const newConversation = await response.json()
        if (onConversationSelect) {
          onConversationSelect(newConversation.id)
        }
        loadConversations()
      }
    } catch (error) {
      console.error('Erro ao criar conversa:', error)
    }
  }

  const deleteConversation = async (conversationId, e) => {
    e.stopPropagation()
    
    if (confirm('Tem certeza que deseja deletar esta conversa?')) {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          loadConversations()
          // Se a conversa deletada era a atual, criar uma nova
          if (conversationId === currentConversationId) {
            createNewConversation()
          }
        }
      } catch (error) {
        console.error('Erro ao deletar conversa:', error)
      }
    }
  }

  const clearAllConversations = async () => {
    if (confirm('Tem certeza que deseja deletar todas as conversas?')) {
      try {
        const response = await fetch('/api/conversations', {
          method: 'DELETE'
        })
        
        if (response.ok) {
          setConversations([])
          createNewConversation()
        }
      } catch (error) {
        console.error('Erro ao limpar conversas:', error)
      }
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div className={styles.overlay} onClick={onToggle} />
      )}
      
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.headerTop}>
            <h2 className={styles.title}>💬 Conversas</h2>
            <button 
              className={styles.closeBtn}
              onClick={onToggle}
              title="Fechar sidebar"
            >
              ×
            </button>
          </div>
          
          <button 
            className={styles.newChatBtn}
            onClick={createNewConversation}
          >
            <span className={styles.plusIcon}>+</span>
            Nova Conversa
          </button>
        </div>

        <div className={styles.conversationsList}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.loadingSpinner}></div>
              <p>Carregando...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💬</div>
              <h3 className={styles.emptyTitle}>Nenhuma conversa</h3>
              <p className={styles.emptyDescription}>
                Clique em "Nova Conversa" para começar.
              </p>
            </div>
          ) : (
            conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${
                  conversation.id === currentConversationId ? styles.active : ''
                }`}
                onClick={() => onConversationSelect && onConversationSelect(conversation.id)}
              >
                <div className={styles.conversationInfo}>
                  <h4 className={styles.conversationTitle}>
                    {conversation.title || 'Conversa sem título'}
                  </h4>
                  {conversation.messages?.[0] && (
                    <p className={styles.lastMessage}>
                      {conversation.messages[0].content.substring(0, 50)}
                      {conversation.messages[0].content.length > 50 ? '...' : ''}
                    </p>
                  )}
                  <span className={styles.timestamp}>
                    {formatDate(conversation.updatedAt)}
                  </span>
                </div>
                
                <button
                  className={styles.deleteBtn}
                  onClick={(e) => deleteConversation(conversation.id, e)}
                  title="Deletar conversa"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        <div className={styles.sidebarFooter}>
          <button 
            className={styles.clearAllBtn}
            onClick={clearAllConversations}
            title="Limpar todas as conversas"
          >
            🗑️ Limpar Tudo
          </button>

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
            {theme === 'light' ? 'Escuro' : 'Claro'}
          </button>

          <div className={styles.dbInfo}>
            <span>🗄️ SQLite + Prisma</span>
            <small>{conversations.length} conversa{conversations.length !== 1 ? 's' : ''}</small>
          </div>
        </div>
      </aside>
    </>
  )
}

export default ConversationsSidebar
