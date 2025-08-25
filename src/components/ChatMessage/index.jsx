'use client'

import React, { useState } from 'react'
import jsPDF from 'jspdf'
import styles from './ChatMessage.module.css'

// Função para limpar texto para PDF
function cleanTextForPDF(text) {
  return text
    // Remove asteriscos duplos (markdown bold)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    // Remove asteriscos simples (markdown italic)  
    .replace(/\*(.*?)\*/g, '$1')
    // Remove marcações de código
    .replace(/`(.*?)`/g, '$1')
    // Remove links markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove hashtags de markdown headers
    .replace(/^#+\s/gm, '')
    // Remove linhas com apenas asteriscos ou hífens
    .replace(/^[\*\-\s]*$/gm, '')
    // Remove múltiplas quebras de linha
    .replace(/\n{3,}/g, '\n\n')
    // Remove espaços extras
    .replace(/[ \t]+/g, ' ')
    .trim()
}

// Função para detectar se é uma lista
function isListItem(line) {
  return /^[\s]*[-*•]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)
}

// Função para detectar se é um título
function isTitle(line) {
  return /^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][^.!?]*:?\s*$/.test(line.trim()) && 
         line.trim().length < 80 && 
         line.trim().length > 5
}

function ChatMessage({ message }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const generatePDF = async () => {
    if (!message.pdfContent) return
    
    setIsDownloading(true)
    
    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - (margin * 2)
      
      // Configurações de fonte
      pdf.setFont('helvetica')
      
      // Título do documento
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Documento gerado pelo CorrigeAI', margin, 30)
      
      // Data
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      const dataAtual = new Date().toLocaleDateString('pt-BR')
      pdf.text(`Gerado em: ${dataAtual}`, margin, 45)
      
      // Linha separadora
      pdf.setLineWidth(0.5)
      pdf.line(margin, 55, pageWidth - margin, 55)
      
      let yPosition = 70
      
      // Limpar e processar o texto
      const cleanText = cleanTextForPDF(message.pdfContent)
      const lines = cleanText.split('\n').filter(line => line.trim())
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 30) {
          pdf.addPage()
          yPosition = 30
        }
        
        if (isTitle(line)) {
          // Estilo para títulos
          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'bold')
          
          const titleLines = pdf.splitTextToSize(line, maxWidth)
          pdf.text(titleLines, margin, yPosition)
          yPosition += titleLines.length * 6 + 8
          
        } else if (isListItem(line)) {
          // Estilo para itens de lista
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          
          const cleanListItem = line.replace(/^[\s]*[-*•]\s/, '• ').replace(/^[\s]*\d+\.\s/, '• ')
          const listLines = pdf.splitTextToSize(cleanListItem, maxWidth - 10)
          
          pdf.text(listLines, margin + 5, yPosition)
          yPosition += listLines.length * 5 + 3
          
        } else {
          // Estilo para parágrafos normais
          pdf.setFontSize(10)
          pdf.setFont('helvetica', 'normal')
          
          const paragraphLines = pdf.splitTextToSize(line, maxWidth)
          pdf.text(paragraphLines, margin, yPosition)
          yPosition += paragraphLines.length * 5 + 8
        }
      }
      
      // Rodapé
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 40, pageHeight - 10)
        pdf.text('Gerado por CorrigeAI', margin, pageHeight - 10)
      }
      
      // Download do PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      pdf.save(`CorrigeAI-documento-${timestamp}.pdf`)
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setIsDownloading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatMessageContent = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div className={`${styles.message} ${styles[message.type]}`}>
      <div className={styles.messageContent}>
        {message.image && (
          <div className={styles.imageContainer}>
            <img src={message.image} alt="Imagem enviada" className={styles.messageImage} />
          </div>
        )}
        
        <div 
          className={styles.messageText}
          dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
        />
        
        {message.hasPdfDownload && (
          <div className={styles.pdfDownloadContainer}>
            <button 
              className={styles.pdfDownloadBtn}
              onClick={generatePDF}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <span className={styles.loadingSpinner}></span>
                  Gerando PDF...
                </>
              ) : (
                <>
                  📄 Baixar PDF
                </>
              )}
            </button>
          </div>
        )}
        
        <div className={styles.messageTime}>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  )
}

export default ChatMessage
