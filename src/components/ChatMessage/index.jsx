'use client'

import React, { useState } from 'react'
import { LoadingDots } from '../Loading'
import { useToast } from '../Toast'
import styles from './ChatMessage.module.css'

export default function ChatMessage({ message, isLoading = false }) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const { showSuccess, showError } = useToast()

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ''
    
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return ''
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess('Texto copiado para a área de transferência!')
    } catch (error) {
      console.error('Erro ao copiar texto:', error)
      showError('Erro ao copiar texto')
    }
  }

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  if (isLoading) {
    return (
      <div className={`${styles.messageContainer} ${styles.assistant}`}>
        <div className={styles.messageAvatar}>
          <span className={styles.avatarIcon}>🤖</span>
        </div>
        <div className={styles.messageContent}>
          <div className={styles.messageHeader}>
            <span className={styles.messageSender}>Assistente</span>
          </div>
          <div className={styles.messageBody}>
            <div className={styles.loadingMessage}>
              <LoadingDots />
              <span>Pensando...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isUser = message.role === 'user'
  const isError = message.isError

  return (
    <div className={`${styles.messageContainer} ${isUser ? styles.user : styles.assistant} ${isError ? styles.error : ''}`}>
      <div className={styles.messageAvatar}>
        <span className={styles.avatarIcon}>
          {isUser ? '👤' : isError ? '⚠️' : '🤖'}
        </span>
      </div>
      
      <div className={styles.messageContent}>
        <div className={styles.messageHeader}>
          <span className={styles.messageSender}>
            {isUser ? 'Você' : isError ? 'Erro' : 'Assistente'}
          </span>
          <span className={styles.messageTime}>
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
        
        <div className={styles.messageBody}>
          {/* Imagem do usuário (se houver) */}
          {message.imageUrl && isUser && (
            <div className={styles.messageImage}>
              {imageLoading && (
                <div className={styles.imageLoading}>
                  <LoadingDots />
                  <span>Carregando imagem...</span>
                </div>
              )}
              {!imageError ? (
                <img 
                  src={message.imageUrl} 
                  alt="Imagem enviada"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />
              ) : (
                <div className={styles.imageError}>
                  <span>❌ Erro ao carregar imagem</span>
                </div>
              )}
            </div>
          )}
          
          {/* Conteúdo da mensagem */}
          {message.content && (
            <div className={styles.messageText}>
              <p>{message.content}</p>
            </div>
          )}
          
          {/* Imagem gerada pela IA (se houver) */}
          {message.imageUrl && !isUser && (
            <div className={styles.messageImage}>
              {imageLoading && (
                <div className={styles.imageLoading}>
                  <LoadingDots />
                  <span>Carregando imagem...</span>
                </div>
              )}
              {!imageError ? (
                <img 
                  src={message.imageUrl} 
                  alt="Imagem gerada pela IA"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  style={{ display: imageLoading ? 'none' : 'block' }}
                />
              ) : (
                <div className={styles.imageError}>
                  <span>❌ Erro ao carregar imagem</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Ações da mensagem */}
        {!isLoading && !isError && message.content && (
          <div className={styles.messageActions}>
            <button 
              onClick={() => copyToClipboard(message.content)}
              className={styles.actionButton}
              title="Copiar mensagem"
            >
              📋
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
