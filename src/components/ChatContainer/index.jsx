'use client'

import React, { useState, useRef, useEffect } from 'react'
import ChatMessage from '../ChatMessage/index.jsx'
import ImageUpload from '../ImageUpload/index.jsx'
import styles from './ChatContainer.module.css'

function ChatContainer() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Carregar conversas salvas ao inicializar
  useEffect(() => {
    const savedMessages = localStorage.getItem('corrigeai-messages')
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages)
      } catch (error) {
        console.error('Erro ao carregar mensagens salvas:', error)
      }
    }
  }, [])

  // Salvar mensagens quando mudarem
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('corrigeai-messages', JSON.stringify(messages))
    }
  }, [messages])

  const clearConversation = () => {
    setMessages([])
    localStorage.removeItem('corrigeai-messages')
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputValue])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!inputValue.trim() && !uploadedImage) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      image: uploadedImage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setUploadedImage(null)
    setIsLoading(true)

    try {
      // Verificar se é uma solicitação de PDF
      if (inputValue.toLowerCase().includes('crie um pdf')) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: 'Gerando conteúdo para o PDF...',
          timestamp: new Date(),
          isGeneratingPdf: true
        }
        
        setMessages(prev => [...prev, botMessage])
        await handlePdfCreation(inputValue, uploadedImage)
      } else {
        await sendToGemini(inputValue, uploadedImage)
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const sendToGemini = async (text, image) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          image: image
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro na comunicação com o servidor')
      }

      if (data.error) {
        throw new Error(data.error)
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Erro ao comunicar com IA:', error)
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: error.message || 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handlePdfCreation = async (text, image) => {
    // Primeiro envia para a IA para gerar o conteúdo
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `${text} (Por favor, gere um conteúdo detalhado e bem estruturado para este PDF)`,
          image: image
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro na comunicação com o servidor')
      }
      
      if (data.error) {
        throw new Error(data.error)
      }

      // Criar mensagem com o conteúdo do PDF
      const successMessage = {
        id: Date.now() + 2,
        type: 'bot',
        content: data.response,
        timestamp: new Date(),
        hasPdfDownload: true,
        pdfContent: data.response
      }
      
      setMessages(prev => prev.map(msg => 
        msg.isGeneratingPdf ? successMessage : msg
      ))
      
    } catch (error) {
      console.error('Erro ao gerar conteúdo do PDF:', error)
      
      const errorMessage = {
        id: Date.now() + 2,
        type: 'bot',
        content: error.message || 'Desculpe, ocorreu um erro ao gerar o conteúdo do PDF. Tente novamente.',
        timestamp: new Date()
      }
      
      setMessages(prev => prev.map(msg => 
        msg.isGeneratingPdf ? errorMessage : msg
      ))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <main className={styles.chatContainer}>
      <div className={styles.messagesArea}>
        {messages.length === 0 ? (
          <div className={styles.welcomeMessage}>
            <h2>Olá! Bem-vindo ao CorrigeAI! 🤖</h2>
            <p>Digite sua mensagem ou envie uma imagem para começar nossa conversa.</p>
            
            <div className={styles.suggestions}>
              <button className={styles.suggestionBtn} onClick={() => setInputValue('Crie um PDF sobre física quântica')}>
                Crie um PDF sobre física quântica
              </button>
              <button className={styles.suggestionBtn} onClick={() => setInputValue('Explique conceitos de programação')}>
                Explique conceitos de programação
              </button>
              <button className={styles.suggestionBtn} onClick={() => setInputValue('Ajude com correção de texto')}>
                Ajude com correção de texto
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.messagesList}>
            <div className={styles.messagesHeader}>
              <button 
                className={styles.clearBtn}
                onClick={clearConversation}
                title="Limpar conversa"
              >
                🗑️ Limpar Conversa
              </button>
            </div>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className={styles.loadingMessage}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form className={styles.inputForm} onSubmit={handleSubmit}>
        {uploadedImage && (
          <div className={styles.uploadedImagePreview}>
            <img src={uploadedImage} alt="Imagem anexada" />
            <button 
              type="button" 
              className={styles.removeImageBtn}
              onClick={() => setUploadedImage(null)}
            >
              ×
            </button>
          </div>
        )}
        
        <div className={styles.inputContainer}>
          <ImageUpload onImageUpload={setUploadedImage} />
          
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className={styles.messageInput}
            rows={1}
          />
          
          <button 
            type="submit" 
            className={styles.sendBtn}
            disabled={isLoading || (!inputValue.trim() && !uploadedImage)}
          >
            <span className={styles.sendIcon}>→</span>
          </button>
        </div>
      </form>
    </main>
  )
}

export default ChatContainer
