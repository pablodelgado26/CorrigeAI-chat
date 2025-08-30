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
      
      // Detectar se é análise de provas
      const isProofAnalysis = message.isProofAnalysis || 
                            message.pdfContent.toLowerCase().includes('relatório de correção') ||
                            message.pdfContent.toLowerCase().includes('desempenho individual') ||
                            message.pdfContent.toLowerCase().includes('gabarito')
      
      // Título do documento
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      if (isProofAnalysis) {
        pdf.text('RELATÓRIO DE CORREÇÃO DE PROVAS', margin, 30)
      } else {
        pdf.text('Documento gerado pelo CorrigeAI', margin, 30)
      }
      
      // Data e subtítulo
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const dataAtual = new Date().toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      pdf.text(`Gerado em: ${dataAtual}`, margin, 45)
      
      if (isProofAnalysis) {
        pdf.setFontSize(10)
        pdf.setTextColor(100, 100, 100)
        pdf.text('Sistema Inteligente de Correção - CorrigeAI', margin, 55)
        pdf.setTextColor(0, 0, 0)
      }
      
      // Linha separadora
      pdf.setLineWidth(1)
      pdf.setDrawColor(52, 152, 219)
      pdf.line(margin, 65, pageWidth - margin, 65)
      
      let yPosition = 80
      
      // Limpar e processar o texto
      const cleanText = cleanTextForPDF(message.pdfContent)
      const sections = cleanText.split(/(?=##\s|#\s)/g).filter(section => section.trim())
      
      for (let section of sections) {
        section = section.trim()
        if (!section) continue
        
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 50) {
          pdf.addPage()
          yPosition = 30
        }
        
        const lines = section.split('\n').filter(line => line.trim())
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue
          
          // Verificar se precisa de nova página
          if (yPosition > pageHeight - 30) {
            pdf.addPage()
            yPosition = 30
          }
          
          if (line.startsWith('##')) {
            // Subtítulos
            pdf.setFontSize(14)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(52, 152, 219)
            
            const title = line.replace(/^##\s/, '')
            pdf.text(title, margin, yPosition)
            yPosition += 12
            
            // Linha decorativa
            pdf.setLineWidth(0.5)
            pdf.line(margin, yPosition - 2, margin + 60, yPosition - 2)
            yPosition += 8
            pdf.setTextColor(0, 0, 0)
            
          } else if (line.startsWith('#')) {
            // Títulos principais
            pdf.setFontSize(16)
            pdf.setFont('helvetica', 'bold')
            pdf.setTextColor(231, 76, 60)
            
            const title = line.replace(/^#\s/, '')
            pdf.text(title, margin, yPosition)
            yPosition += 15
            pdf.setTextColor(0, 0, 0)
            
          } else if (line.startsWith('|')) {
            // Tabelas
            pdf.setFontSize(9)
            pdf.setFont('helvetica', 'normal')
            
            // Processar linha da tabela
            const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell)
            const cellWidth = (maxWidth - 10) / cells.length
            
            // Detectar se é cabeçalho (primeira linha da tabela)
            const isHeader = cells.some(cell => 
              cell.toLowerCase().includes('nome') || 
              cell.toLowerCase().includes('posição') ||
              cell.toLowerCase().includes('questão')
            )
            
            if (isHeader) {
              pdf.setFont('helvetica', 'bold')
              pdf.setFillColor(52, 152, 219)
              pdf.setTextColor(255, 255, 255)
              pdf.rect(margin, yPosition - 8, maxWidth, 12, 'F')
            }
            
            for (let j = 0; j < cells.length; j++) {
              const x = margin + (j * cellWidth) + 2
              pdf.text(cells[j], x, yPosition)
            }
            
            if (isHeader) {
              pdf.setTextColor(0, 0, 0)
              pdf.setFont('helvetica', 'normal')
            }
            
            yPosition += 10
            
            // Linha separadora da tabela
            if (!isHeader) {
              pdf.setDrawColor(200, 200, 200)
              pdf.setLineWidth(0.1)
              pdf.line(margin, yPosition - 5, pageWidth - margin, yPosition - 5)
            }
            
          } else if (isListItem(line)) {
            // Itens de lista
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')
            
            const cleanListItem = line.replace(/^[\s]*[-*•]\s/, '• ').replace(/^[\s]*\d+\.\s/, '• ')
            const listLines = pdf.splitTextToSize(cleanListItem, maxWidth - 10)
            
            pdf.text(listLines, margin + 5, yPosition)
            yPosition += listLines.length * 5 + 3
            
          } else if (isTitle(line)) {
            // Títulos menores
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            
            const titleLines = pdf.splitTextToSize(line, maxWidth)
            pdf.text(titleLines, margin, yPosition)
            yPosition += titleLines.length * 6 + 8
            
          } else {
            // Parágrafos normais
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'normal')
            
            const paragraphLines = pdf.splitTextToSize(line, maxWidth)
            pdf.text(paragraphLines, margin, yPosition)
            yPosition += paragraphLines.length * 5 + 8
          }
        }
        
        yPosition += 10 // Espaço entre seções
      }
      
      // Rodapé estilizado
      const totalPages = pdf.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        
        // Linha no rodapé
        pdf.setDrawColor(200, 200, 200)
        pdf.setLineWidth(0.5)
        pdf.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20)
        
        // Texto do rodapé
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 100, 100)
        
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - 40, pageHeight - 10)
        pdf.text('Gerado por CorrigeAI', margin, pageHeight - 10)
        
        if (isProofAnalysis) {
          pdf.text('Relatório de Análise Acadêmica', pageWidth/2, pageHeight - 10, { align: 'center' })
        }
      }
      
      // Download do PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const filename = isProofAnalysis ? 
        `Relatório-Correção-Provas-${timestamp}.pdf` : 
        `CorrigeAI-documento-${timestamp}.pdf`
      
      pdf.save(filename)
      
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
      // Converter links markdown para HTML clicável
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>')
      // Converter blocos de código
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
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
