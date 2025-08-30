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
  const [lastRequestTime, setLastRequestTime] = useState(0)
  const [requestCount, setRequestCount] = useState(0)
  const [useAdvancedProcessing, setUseAdvancedProcessing] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Rate limiting - máximo 5 requests por minuto
  const RATE_LIMIT = 5
  const RATE_WINDOW = 60000 // 1 minuto em ms

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
    setInputValue('')
    setUploadedImage(null)
    setIsLoading(true)

    try {
      // Verificar se é uma solicitação de PDF ou processamento avançado
      if (inputValue.toLowerCase().includes('crie um pdf') || useAdvancedProcessing) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: useAdvancedProcessing 
            ? 'Usando processamento avançado com OCR e análise profissional. Analisando documento...' 
            : 'Analisando as imagens das provas e comparando com o gabarito... Por favor, aguarde enquanto faço a correção visual detalhada.',
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
        timestamp: new Date(),
        hasPdfDownload: true,
        pdfContent: data.response,
        isProofAnalysis: isProofAnalysis
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
            
            <div className={styles.suggestions}>
              <button className={styles.suggestionBtn} onClick={() => setInputValue('Crie um PDF sobre física quântica')}>
                Crie um PDF sobre física quântica
              </button>
              <button className={styles.suggestionBtn} onClick={() => setInputValue('Analise visualmente as provas anexadas, compare cada resposta com o gabarito da primeira imagem e crie um PDF com relatório preciso dos erros e acertos reais')}>
                Corrigir provas e gerar relatório preciso
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
          
          <div className={styles.processingToggle}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={useAdvancedProcessing}
                onChange={(e) => setUseAdvancedProcessing(e.target.checked)}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleText}>
                🔬 Modo Avançado (OCR + IA)
              </span>
            </label>
          </div>
          
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
