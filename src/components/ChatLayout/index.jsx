'use client'

import React, { useState, useEffect } from 'react'
import ChatContainer from '../ChatContainer/index.jsx'
import Sidebar from '../Sidebar/index.jsx'
import { useAuth } from '../../contexts/AuthContext'

export default function ChatLayout() {
  const { getAuthHeaders, isAuthenticated } = useAuth()
  const [conversationsList, setConversationsList] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [messages, setMessages] = useState([])

  // Função para carregar lista de conversas
  const loadConversations = async () => {
    // Só carregar conversas se estiver autenticado
    if (!isAuthenticated) {
      return
    }

    try {
      const authHeaders = getAuthHeaders()
      
      const response = await fetch('/api/conversations', {
        headers: authHeaders
      })

      if (response.ok) {
        const conversations = await response.json()
        setConversationsList(conversations)
        
        // Se não há conversa atual e existem conversas, carregar a mais recente
        if (!currentConversationId && conversations.length > 0) {
          setCurrentConversationId(conversations[0].id)
        }
      } else if (response.status === 401) {
        console.error('Erro de autenticação ao carregar conversas')
      }
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    }
  }

  // Função para criar nova conversa (apenas quando usuário enviar primeira mensagem)
  const createNewConversation = async (title = null) => {
    if (!isAuthenticated) {
      console.error('Usuário não autenticado')
      return null
    }

    try {
      const authHeaders = getAuthHeaders()
      
      // Se não há título, gerar um baseado no número de conversas
      const conversationNumber = conversationsList.length + 1
      const defaultTitle = title || `Conversa ${conversationNumber.toString().padStart(2, '0')}`
      
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({ title: defaultTitle })
      })

      if (response.ok) {
        const newConversation = await response.json()
        setCurrentConversationId(newConversation.id)
        setMessages([])
        await loadConversations() // Recarregar lista de conversas
        return newConversation
      } else {
        throw new Error('Erro ao criar conversa')
      }
    } catch (error) {
      console.error('Erro ao criar nova conversa:', error)
      return null
    }
  }

  // Função para criar conversa quando usuário enviar primeira mensagem
  const createConversationOnFirstMessage = async () => {
    if (!currentConversationId && isAuthenticated) {
      console.log('🆕 Criando nova conversa ao enviar primeira mensagem')
      return await createNewConversation()
    }
    return { id: currentConversationId }
  }

  // Função para carregar uma conversa específica
  const loadConversation = async (conversationId) => {
    if (!isAuthenticated) {
      console.error('Usuário não autenticado')
      return
    }

    try {
      const authHeaders = getAuthHeaders()
      
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: authHeaders
      })

      if (response.ok) {
        const conversation = await response.json()
        setCurrentConversationId(conversationId)
        
        // Carregar mensagens da conversa
        const conversationMessages = conversation.messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          type: msg.isUser ? 'user' : 'bot',
          timestamp: msg.createdAt,
          savedToDb: true
        }))
        
        setMessages(conversationMessages)
      } else {
        throw new Error('Erro ao carregar conversa')
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error)
    }
  }

  // Função para deletar uma conversa
  const deleteConversation = async (conversationId) => {
    if (!isAuthenticated) {
      console.error('Usuário não autenticado')
      return
    }

    try {
      console.log('🗑️ ChatLayout: Iniciando exclusão da conversa:', conversationId)
      const authHeaders = getAuthHeaders()
      
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders
        }
      })

      console.log('🗑️ ChatLayout: Status da resposta:', response.status)

      if (response.ok) {
        console.log('✅ ChatLayout: Conversa deletada com sucesso')
        // Se a conversa deletada é a atual, criar uma nova
        if (conversationId === currentConversationId) {
          const newConversation = await createNewConversation()
          if (newConversation) {
            setCurrentConversationId(newConversation.id)
            setMessages([])
          }
        }
        
        // Recarregar lista de conversas
        await loadConversations()
      } else {
        const errorData = await response.json()
        console.error('❌ ChatLayout: Erro na API:', errorData)
        throw new Error('Erro ao deletar conversa')
      }
    } catch (error) {
      console.error('❌ ChatLayout: Erro ao deletar conversa:', error)
    }
  }

  // Carregar conversas ao montar o componente ou quando autenticação mudar
  useEffect(() => {
    console.log('ChatLayout: isAuthenticated mudou para:', isAuthenticated)
    if (isAuthenticated) {
      console.log('ChatLayout: Carregando conversas...')
      loadConversations()
    } else {
      console.log('ChatLayout: Usuário não autenticado, limpando estado')
      // Limpar estado quando não autenticado
      setConversationsList([])
      setCurrentConversationId(null)
      setMessages([])
    }
  }, [isAuthenticated])

  return (
    <div className="app-container">
      <Sidebar 
        conversations={conversationsList}
        currentConversationId={currentConversationId}
        onCreateNewConversation={createNewConversation}
        onLoadConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        onLoadConversations={loadConversations}
      />
      <ChatContainer 
        currentConversationId={currentConversationId}
        setCurrentConversationId={setCurrentConversationId}
        messages={messages}
        setMessages={setMessages}
        loadConversations={loadConversations}
        createConversationOnFirstMessage={createConversationOnFirstMessage}
      />
    </div>
  )
}
