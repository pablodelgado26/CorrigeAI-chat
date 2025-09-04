'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import ChatMessage from '../ChatMessage'
import ImageUpload from '../ImageUpload'
import ErrorMessage from '../ErrorMessage'
import styles from './ChatContainer.module.css'

export default function ChatContainer({ 
  currentConversationId, 
  setCurrentConversationId, 
  messages, 
  setMessages,
  loadConversations,
  createConversationOnFirstMessage
}) {
  const { getAuthHeaders } = useAuth()
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [lastRequestTime, setLastRequestTime] = useState(0)
  const [requestCount, setRequestCount] = useState(0)
  const [lastUserMessage, setLastUserMessage] = useState(null)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Rate limiting - máximo 5 requests por minuto
  const RATE_LIMIT = 5
  const RATE_WINDOW = 60000 // 1 minuto em ms

    // Carregar conversas salvas ao inicializar
  useEffect(() => {
    // O ChatLayout agora gerencia conversas, ChatContainer apenas exibe mensagens
    // Se há mensagens e currentConversationId, não fazer nada
    // Se não há mensagens mas há currentConversationId, carregar da API
    if (currentConversationId && messages.length === 0) {
      loadConversationMessages(currentConversationId)
    }
  }, [currentConversationId])

  const loadConversationMessages = async (conversationId) => {
    try {
      const authHeaders = getAuthHeaders()
      
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: authHeaders
      })

      if (response.ok) {
        const conversation = await response.json()
        
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
        console.error('Erro ao carregar mensagens da conversa')
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  // Função para gerar título automático baseado na primeira mensagem
  const generateConversationTitle = (firstMessage) => {
    if (!firstMessage) return 'Nova Conversa'
    
    // Pegar as primeiras palavras da mensagem do usuário
    const words = firstMessage.content.split(' ').slice(0, 4).join(' ')
    return words.length > 30 ? words.substring(0, 30) + '...' : words
  }

  const saveMessageToDatabase = async (conversationId, message) => {
    try {
      const authHeaders = getAuthHeaders()
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders
        },
        body: JSON.stringify({
          content: message.content,
          type: message.type.toUpperCase(),
          image: message.image,
          generatedImageUrl: message.generatedImageUrl
        })
      })
      
      if (response.ok) {
        return await response.json()
      } else if (response.status === 401) {
        console.error('Erro de autenticação ao salvar mensagem')
        setError({
          type: 'auth',
          message: 'Erro de autenticação. Faça login novamente.'
        })
      }
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error)
    }
    return null
  }

  // Salvar mensagens quando mudarem
  useEffect(() => {
    if (messages.length > 0 && currentConversationId) {
      // Salvar última mensagem no banco se ainda não foi salva
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && !lastMessage.savedToDb) {
        console.log('💾 Salvando mensagem no banco:', lastMessage.content.substring(0, 50) + '...')
        saveMessageToDatabase(currentConversationId, lastMessage)
          .then(() => {
            console.log('✅ Mensagem salva com sucesso')
            // Marcar como salva
            setMessages(prev => prev.map(msg => 
              msg.id === lastMessage.id ? { ...msg, savedToDb: true } : msg
            ))
          })
          .catch(error => {
            console.error('❌ Erro ao salvar mensagem:', error)
          })
      }
    }
  }, [messages, currentConversationId])

  // Função para limpar conversa (apenas local, criação de nova conversa é responsabilidade do ChatLayout)
  const clearConversation = async () => {
    try {
      // Sempre limpar localmente
      setMessages([])
      localStorage.removeItem('corrigeai-messages')
      
      // Notificar que precisa criar nova conversa (via callback se necessário)
      // O ChatLayout será responsável por gerenciar a criação
    } catch (error) {
      console.error('Erro ao limpar conversa:', error)
      // Sempre fazer fallback para limpeza local
      setMessages([])
      localStorage.removeItem('corrigeai-messages')
    }
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

  // Função para detectar automaticamente se deve usar processamento avançado
  const shouldUseAdvancedProcessing = () => {
    // Sempre usar processamento avançado se houver imagem/arquivo
    if (uploadedImage) return true
    
    // Se não há imagem, não usar processamento avançado
    // (isso permitirá que "crie um pdf" use handlePdfCreation)
    return false
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!inputValue.trim() && !uploadedImage) return

    // Verificar rate limiting
    const now = Date.now()
    if (now - lastRequestTime < RATE_WINDOW) {
      if (requestCount >= RATE_LIMIT) {
        const timeLeft = Math.ceil((RATE_WINDOW - (now - lastRequestTime)) / 1000)
        const errorMessage = {
          id: Date.now(),
          type: 'bot',
          content: `⚠️ Muitas solicitações foram feitas. Aguarde ${timeLeft} segundos antes de tentar novamente para evitar limite da API.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
        return
      }
      setRequestCount(prev => prev + 1)
    } else {
      setLastRequestTime(now)
      setRequestCount(1)
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      image: uploadedImage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setLastUserMessage({ text: inputValue, image: uploadedImage }) // Salvar para retry
    setInputValue('')
    setUploadedImage(null)
    setIsLoading(true)

    try {
      // Detectar automaticamente se deve usar processamento avançado
      const useAdvancedProcessing = shouldUseAdvancedProcessing()
      
      // Detectar solicitações específicas de PDF (mais específicas)
      const isPdfRequest = inputValue.toLowerCase().includes('crie um pdf') || 
                          inputValue.toLowerCase().includes('criar pdf') ||
                          inputValue.toLowerCase().includes('gerar pdf') ||
                          inputValue.toLowerCase().includes('relatório pdf') ||
                          inputValue.toLowerCase().includes('documento pdf')
      
      // Verificar se é uma solicitação de PDF ou processamento avançado
      if (isPdfRequest || useAdvancedProcessing) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: useAdvancedProcessing 
            ? '🔬 **Modo Avançado Ativado**\n\nUsando OCR + IA para análise profissional. Processando documento...' 
            : '📄 **Gerando PDF**\n\nCriando relatório personalizado baseado na sua solicitação...',
          timestamp: new Date(),
          isGeneratingPdf: true
        }
        
        setMessages(prev => [...prev, botMessage])
        
        if (useAdvancedProcessing) {
          await handleAdvancedProcessing(inputValue, uploadedImage)
        } else {
          await handlePdfCreation(inputValue, uploadedImage)
        }
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
        if (response.status === 503) {
          throw new Error('Serviço temporariamente indisponível. Aguarde alguns segundos e tente novamente.')
        } else if (response.status === 429) {
          throw new Error('Muitas requisições. Aguarde um momento e tente novamente.')
        } else if (response.status >= 500) {
          throw new Error('Erro interno do servidor. Tente novamente em alguns minutos.')
        }
        throw new Error(data.error || 'Erro na comunicação com o servidor')
      }

      if (data.error) {
        throw new Error(data.error)
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response,
        timestamp: new Date(),
        // Se é geração de imagem, incluir a URL da imagem
        generatedImageUrl: data.isImageGeneration ? data.imageUrl : null
      }
      
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Erro ao comunicar com IA:', error)
      
      let errorMessage = 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.'
      let errorType = 'error'
      
      // Detectar tipos específicos de erro
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
        errorType = 'network'
      } else if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'Timeout na conexão. O servidor demorou para responder. Tente novamente.'
        errorType = 'timeout'
      } else if (error.message.includes('503') || error.message.includes('temporariamente indisponível')) {
        errorMessage = 'Serviço temporariamente indisponível. Aguarde alguns segundos e tente novamente.'
        errorType = 'server'
      } else if (error.message.includes('429')) {
        errorMessage = 'Muitas requisições simultâneas. Aguarde um momento e tente novamente.'
        errorType = 'server'
      } else if (error.message) {
        errorMessage = error.message
        // Manter errorType como 'error' para mensagens customizadas
      }
      
      const botErrorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: errorMessage,
        timestamp: new Date(),
        isError: true,
        errorType: errorType
      }
      setMessages(prev => [...prev, botErrorMessage])
    }
  }

  const handleRetry = async () => {
    if (!lastUserMessage || isLoading) return
    
    // Remover a última mensagem de erro
    setMessages(prev => prev.filter(msg => !msg.isError))
    
    // Reenviar a última mensagem
    setIsLoading(true)
    try {
      await sendToGemini(lastUserMessage.text, lastUserMessage.image)
    } catch (error) {
      console.error('Erro no retry:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePdfCreation = async (text, image) => {
    // Primeiro envia para a IA para gerar o conteúdo
    try {
      // Verificar se é uma análise de provas
      const isProofAnalysis = text.toLowerCase().includes('corrija as provas') || 
                            text.toLowerCase().includes('gabarito') ||
                            text.toLowerCase().includes('relatório') ||
                            text.toLowerCase().includes('analise as provas') ||
                            text.toLowerCase().includes('compare com o gabarito') ||
                            text.toLowerCase().includes('correção de provas');
      
      let prompt = text;
      if (isProofAnalysis) {
        prompt = `ANÁLISE VISUAL DE PROVAS - VOCÊ CONSEGUE VER E PROCESSAR IMAGENS!

${text}

INSTRUÇÕES ESPECÍFICAS:

1. **PRIMEIRO:** Encontre a página com "GABARITO" escrito
   - Esta página tem todas as respostas corretas
   - Anote cada resposta do gabarito (A, B, C, D, etc.)
   - Esta é sua referência para correção

2. **SEGUNDO:** Para cada prova de aluno:
   - Leia o nome do aluno no cabeçalho
   - Compare cada resposta marcada com o gabarito
   - Conte quantas estão certas e quantas estão erradas
   - Anote quais questões específicas cada aluno errou

3. **TERCEIRO:** Crie relatório com dados REAIS:

# RELATÓRIO DE CORREÇÃO - ANÁLISE VISUAL

## GABARITO OFICIAL (da primeira página)
[Liste as respostas que viu no gabarito]

## CORREÇÃO POR ALUNO
| Aluno | Acertos | Erros | Questões Erradas | Nota % |
|-------|---------|-------|------------------|--------|
[Para cada aluno que conseguiu analisar]

## QUESTÕES MAIS ERRADAS
| Questão | Qtd Erros | Gabarito | Alunos que Erraram |
|---------|-----------|----------|-------------------|
[Só questões onde realmente viu erros]

## ANÁLISE PEDAGÓGICA
- Questão mais difícil: [baseado nos erros reais]
- Aluno com melhor desempenho: [nome e %]
- Alunos que precisam reforço: [lista]

IMPORTANTE: Use apenas dados das imagens que conseguir ver claramente.`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: prompt,
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
        timestamp: new Date()
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

  const handleAdvancedProcessing = async (text, image) => {
    try {
      // Testar primeiro a conectividade básica
      const testResponse = await fetch('http://localhost:8000/')
      
      if (!testResponse.ok) {
        throw new Error('Servidor Python não está respondendo')
      }
      
      // Se chegou até aqui, o servidor está funcionando
      // Agora vamos tentar um endpoint mais simples
      if (!image) {
        throw new Error('Modo avançado requer uma imagem para análise OCR')
      }

      // Detectar tipo de arquivo baseado no MIME type
      const mimeType = image.split(',')[0].split(':')[1].split(';')[0]
      const isPdf = mimeType === 'application/pdf'
      const isImage = mimeType.startsWith('image/')

      console.log('Tipo de arquivo detectado:', { mimeType, isPdf, isImage })

      // Preparar dados de forma mais simples para testar
      const formData = new FormData()
      
      // Converter base64 para blob de forma mais robusta
      const base64Data = image.split(',')[1]
      
      // Converter base64 para Uint8Array
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      
      const blob = new Blob([byteArray], { type: mimeType })
      
      let endpoint
      let fileName
      
      if (isPdf) {
        // Para PDFs, usar o endpoint de análise completa
        endpoint = 'http://localhost:8000/analyze-exams'
        fileName = 'document.pdf'
        formData.append('files', blob, fileName)
        formData.append('instructions', text || 'Analise este documento PDF e extraia informações relevantes')
      } else if (isImage) {
        // Para imagens, usar o endpoint de OCR
        endpoint = 'http://localhost:8000/extract-text-from-image'
        fileName = 'image.' + mimeType.split('/')[1]
        formData.append('file', blob, fileName)
      } else {
        throw new Error(`Tipo de arquivo não suportado: ${mimeType}`)
      }

      console.log('Enviando para endpoint:', endpoint)

      // Enviar para o endpoint apropriado
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('Erro ao parsear JSON:', jsonError)
        const text = await response.text()
        console.error('Resposta raw:', text)
        throw new Error(`Erro de comunicação: resposta inválida do servidor (${response.status})`)
      }

      if (!response.ok) {
        console.error('Erro do servidor Python:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        })
        throw new Error(data.detail || data.error || `Erro ${response.status}: ${response.statusText}`)
      }

      // Criar mensagem com resultado do processamento
      let content
      
      if (isPdf) {
        // Converter análise para texto legível
        let analysisText = 'Análise não disponível'
        if (data.analysis) {
          if (typeof data.analysis === 'object') {
            // Se for um objeto, extrair as informações de forma organizada
            try {
              if (data.analysis.content || data.analysis.message || data.analysis.text) {
                analysisText = data.analysis.content || data.analysis.message || data.analysis.text
              } else {
                // Formatar objeto JSON de forma legível
                analysisText = Object.entries(data.analysis)
                  .map(([key, value]) => `**${key}:** ${value}`)
                  .join('\n')
              }
            } catch (e) {
              analysisText = JSON.stringify(data.analysis, null, 2)
            }
          } else {
            analysisText = data.analysis.toString()
          }
        }

        content = `# 🎯 Análise PDF Concluída!

## 📄 Tipo: Documento PDF
**Arquivo:** ${fileName}

## 📊 Resultados:
${data.success ? '✅ Processamento bem-sucedido' : '❌ Falha no processamento'}

## 📝 Análise:
${analysisText}

## 📈 Estatísticas:
- **Estudantes encontrados:** ${data.students_count || 0}
- **Gabarito detectado:** ${data.answer_key ? '✅ Sim' : '❌ Não'}

## ⚡ Modo Avançado PDF
- ✅ PyMuPDF para extração
- ✅ Análise estruturada
- ✅ Processamento em lote`

        // Adicionar botão de download se houver relatório
        if (data.report_url) {
          content += `\n\n## 📄 Relatório Gerado\n\n[📥 **Baixar Relatório PDF**](http://localhost:8000${data.report_url})`
        }
      } else {
        content = `# 🎯 Análise OCR Concluída!

## 📝 Texto Extraído:
${data.text || 'Nenhum texto detectado'}

## 📊 Estatísticas:
- **Confiança OCR:** ${(data.confidence || 0).toFixed(1)}%
- **Método:** Tesseract OCR + OpenCV
- **Status:** ${data.success ? '✅ Sucesso' : '❌ Falha'}

## ⚡ Modo Avançado Ativo
- ✅ Preprocessamento de imagem
- ✅ Múltiplos idiomas (PT/EN)
- ✅ Correção automática de texto

*Use o texto extraído para análises mais detalhadas!*`
      }

      const successMessage = {
        id: Date.now() + 2,
        type: 'bot',
        content: content,
        timestamp: new Date(),
        hasAdvancedReport: true,
        extractedText: data.text || data.extracted_text,
        confidence: data.confidence,
        isPdfAnalysis: isPdf
      }
      
      setMessages(prev => prev.map(msg => 
        msg.isGeneratingPdf ? successMessage : msg
      ))
      
    } catch (error) {
      console.error('Erro no processamento avançado:', error)
      
      const errorMessage = {
        id: Date.now() + 2,
        type: 'bot',
        content: `❌ **Erro no Modo Avançado**

**Detalhes:** ${error.message}

**Status dos Serviços:**
- Frontend: ✅ Funcionando (localhost:3000)
- Backend Python: ${error.message.includes('não está respondendo') ? '❌' : '🔄'} (localhost:8000)

**Soluções:**
1. Verifique se o servidor Python está rodando
2. Use o modo básico (desmarcando o toggle)
3. Recarregue a página e tente novamente

**Tip:** O modo básico já oferece análise inteligente excelente!`,
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
          </div>
        ) : (
          <div className={styles.messagesList}>
            <div className={styles.messagesHeader}>
              <div className={styles.rateLimitInfo}>
                ⓘ Limite: {requestCount}/{RATE_LIMIT} por minuto
              </div>
              <button 
                className={styles.clearBtn}
                onClick={clearConversation}
                title="Limpar conversa"
              >
                🗑️ Limpar Conversa
              </button>
            </div>
            {messages.map((message) => (
              message.isError ? (
                <ErrorMessage
                  key={message.id}
                  message={message.content}
                  type={message.errorType}
                  onRetry={handleRetry}
                />
              ) : (
                <ChatMessage key={message.id} message={message} />
              )
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
