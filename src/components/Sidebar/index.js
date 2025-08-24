'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import styles from './Sidebar.module.css'

export default function Sidebar() {
  const [theme, setTheme] = useState('light')
  const [conversations, setConversations] = useState([])

  // Conversas de exemplo (normalmente viriam de um banco de dados)
  const exampleConversations = [
    {
      id: 1,
      title: 'Correção de texto acadêmico',
      preview: 'Ajuda com correção de artigo científico...',
      timestamp: '2024-01-15T10:30:00Z',
      messageCount: 12
    },
    {
      id: 2,
      title: 'PDF sobre Física Quântica',
      preview: 'Criação de material didático sobre mecânica...',
      timestamp: '2024-01-14T15:45:00Z',
      messageCount: 8
    },
    {
      id: 3,
      title: 'Programação em React',
      preview: 'Explicação sobre hooks e components...',
      timestamp: '2024-01-13T09:20:00Z',
      messageCount: 15
    },
    {
      id: 4,
      title: 'Análise de imagem médica',
      preview: 'Interpretação de exame radiológico...',
      timestamp: '2024-01-12T14:10:00Z',
      messageCount: 6
    },
    {
      id: 5,
      title: 'Tradução de documento',
      preview: 'Tradução de contrato comercial...',
      timestamp: '2024-01-11T11:55:00Z',
      messageCount: 4
    },
    {
      id: 6,
      title: 'Resumo de livro científico',
      preview: 'Criação de resumo executivo...',
      timestamp: '2024-01-10T16:30:00Z',
      messageCount: 9
    },
    {
      id: 7,
      title: 'Correção de dissertação',
      preview: 'Revisão ortográfica e gramatical...',
      timestamp: '2024-01-09T13:15:00Z',
      messageCount: 23
    },
    {
      id: 8,
      title: 'Criação de questionário',
      preview: 'Desenvolvimento de questionário...',
      timestamp: '2024-01-08T08:40:00Z',
      messageCount: 7
    },
    {
      id: 9,
      title: 'Análise de dados estatísticos',
      preview: 'Interpretação de gráficos e tabelas...',
      timestamp: '2024-01-07T16:20:00Z',
      messageCount: 11
    },
    {
      id: 10,
      title: 'Reescrita de artigo',
      preview: 'Melhoria de estilo e clareza...',
      timestamp: '2024-01-06T12:30:00Z',
      messageCount: 18
    }
  ]

  useEffect(() => {
    // Carregar tema do localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
    
    // Carregar conversas (aqui você carregaria do seu backend)
    setConversations(exampleConversations)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Hoje'
    if (diffDays === 2) return 'Ontem'
    if (diffDays <= 7) return `${diffDays} dias atrás`
    return date.toLocaleDateString('pt-BR')
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
        <h3 className={styles.sectionTitle}>Conversas Recentes</h3>
        
        {conversations.map((conversation) => (
          <div key={conversation.id} className={styles.conversationItem}>
            <div className={styles.conversationHeader}>
              <h4 className={styles.conversationTitle}>
                {conversation.title}
              </h4>
              <span className={styles.conversationDate}>
                {formatDate(conversation.timestamp)}
              </span>
            </div>
            <p className={styles.conversationPreview}>
              {conversation.preview}
            </p>
            <div className={styles.conversationMeta}>
              <span className={styles.messageCount}>
                {conversation.messageCount} mensagens
              </span>
            </div>
          </div>
        ))}
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
