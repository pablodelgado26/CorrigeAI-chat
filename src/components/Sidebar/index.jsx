'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import styles from './Sidebar.module.css'

export default function Sidebar({ 
  conversations = [], 
  currentConversationId, 
  onCreateNewConversation, 
  onLoadConversation, 
  onDeleteConversation,
  onLoadConversations 
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { getAuthHeaders } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // Função para formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) {
      return 'Hoje'
    } else if (diffDays === 2) {
      return 'Ontem'
    } else if (diffDays <= 7) {
      return `${diffDays - 1} dias atrás`
    } else {
      return date.toLocaleDateString('pt-BR', { 
        day: 'numeric', 
        month: 'short' 
      })
    }
  }

  // Função para criar nova conversa
  const handleNewConversation = async () => {
    if (onCreateNewConversation) {
      await onCreateNewConversation()
    }
  }

  // Função para carregar conversa
  const handleLoadConversation = async (conversationId) => {
    if (onLoadConversation) {
      await onLoadConversation(conversationId)
    }
  }

  // Função para editar título da conversa
  const handleEditTitle = async (conversationId, currentTitle, event) => {
    event.stopPropagation() // Evitar que clique na conversa
    
    const newTitle = prompt('Novo título da conversa:', currentTitle)
    if (newTitle && newTitle.trim() && newTitle !== currentTitle) {
      try {
        const authHeaders = getAuthHeaders()
        console.log('📋 Headers de autenticação:', authHeaders)
        
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders
          },
          body: JSON.stringify({ title: newTitle.trim() })
        })
        
        if (response.ok) {
          console.log('✅ Título editado com sucesso')
          // Recarregar conversas para atualizar a lista
          if (onLoadConversations) {
            await onLoadConversations()
          }
        } else {
          console.error('❌ Erro na resposta da API:', response.status)
          const errorData = await response.json()
          console.error('❌ Detalhes do erro:', errorData)
        }
      } catch (error) {
        console.error('❌ Erro ao editar título:', error)
      }
    }
  }

  // Função para deletar conversa
  const handleDeleteConversation = async (conversationId, event) => {
    event.stopPropagation() // Evitar que clique na conversa
    
    if (confirm('Tem certeza que deseja deletar esta conversa?')) {
      if (onDeleteConversation) {
        await onDeleteConversation(conversationId)
      }
    }
  }

  return (
    <>


      {/* Overlay para mobile */}
      {isMobileMenuOpen && (
        <div 
          className={styles.overlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <h2 className={styles.title}>CorrigeAI SESI</h2>
          
          <button 
            className={styles.newChatBtn}
            onClick={handleNewConversation}
            title="Nova Conversa"
          >
            <span className={styles.plusIcon}>+</span>
            <span>Nova Conversa</span>
          </button>
        </div>

        {/* Lista de Conversas */}
        <div className={styles.conversationsList}>
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`${styles.conversationItem} ${
                  conversation.id === currentConversationId ? styles.active : ''
                }`}
                onClick={() => handleLoadConversation(conversation.id)}
              >
                <div className={styles.conversationInfo}>
                  <div className={styles.conversationTitle}>
                    {conversation.title}
                  </div>
                  <div className={styles.conversationDate}>
                    {formatDate(conversation.createdAt)}
                  </div>
                </div>
                <div className={styles.conversationActions}>
                  <button
                    className={styles.editButton}
                    onClick={(e) => handleEditTitle(conversation.id, conversation.title, e)}
                    title="Editar título"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => handleDeleteConversation(conversation.id, e)}
                    title="Deletar conversa"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>Nenhuma conversa ainda.</p>
              <p>Comece uma nova conversa!</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.navigation}>
          <button 
            className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}
            onClick={() => router.push('/')}
          >
            <span className={styles.navIcon}>💬</span>
            Chat
          </button>
          <button 
            className={`${styles.navItem} ${pathname === '/pdf-analyzer' ? styles.active : ''}`}
            onClick={() => router.push('/pdf-analyzer')}
          >
            <span className={styles.navIcon}>📄</span>
            Analisar PDF
          </button>
          <button 
            className={`${styles.navItem} ${pathname === '/sobre' ? styles.active : ''}`}
            onClick={() => router.push('/sobre')}
          >
            <span className={styles.navIcon}>ℹ️</span>
            Sobre
          </button>
        </nav>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <button 
            className={styles.themeToggle}
            onClick={() => {
              const html = document.documentElement
              const currentTheme = html.getAttribute('data-theme')
              const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
              html.setAttribute('data-theme', newTheme)
              localStorage.setItem('theme', newTheme)
            }}
          >
            <span className={styles.themeIcon}>🌓</span>
            <span>Alternar Tema</span>
          </button>
        </div>
      </aside>
    </>
  )
}
