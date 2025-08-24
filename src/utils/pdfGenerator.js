// Utilitário para criação de PDFs
export class PDFGenerator {
  static async loadJsPDF() {
    try {
      // Tentar carregar de diferentes CDNs
      const cdnUrls = [
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
        'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
      ]

      for (const url of cdnUrls) {
        try {
          await this.loadScript(url)
          if (window.jspdf && window.jspdf.jsPDF) {
            return window.jspdf.jsPDF
          }
        } catch (error) {
          console.warn(`Falha ao carregar jsPDF de ${url}:`, error)
          continue
        }
      }
      
      throw new Error('Não foi possível carregar a biblioteca jsPDF')
    } catch (error) {
      console.error('Erro ao carregar jsPDF:', error)
      throw error
    }
  }

  static loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  static async createPDF(content, title = 'Documento CorrigeAI') {
    try {
      const jsPDF = await this.loadJsPDF()
      const doc = new jsPDF()
      
      // Configurações do documento
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - (margin * 2)
      let yPosition = 30
      
      // Função para adicionar nova página se necessário
      const checkPageBreak = (increment) => {
        if (yPosition + increment > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
        }
      }
      
      // Título
      doc.setFontSize(18)
      doc.setFont(undefined, 'bold')
      doc.text(title, margin, yPosition)
      yPosition += 15
      
      // Data
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      const currentDate = new Date().toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      doc.text(`Gerado em: ${currentDate}`, margin, yPosition)
      yPosition += 10
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 15
      
      // Conteúdo
      doc.setFontSize(12)
      doc.setFont(undefined, 'normal')
      
      // Dividir o conteúdo em parágrafos
      const paragraphs = content.split('\n\n')
      
      for (const paragraph of paragraphs) {
        if (paragraph.trim()) {
          checkPageBreak(20)
          const lines = doc.splitTextToSize(paragraph.trim(), maxWidth)
          
          for (const line of lines) {
            checkPageBreak(7)
            doc.text(line, margin, yPosition)
            yPosition += 7
          }
          yPosition += 5 // Espaço entre parágrafos
        }
      }
      
      // Rodapé
      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Página ${i} de ${totalPages} - Gerado por CorrigeAI`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }
      
      // Download do PDF
      const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.pdf`
      doc.save(filename)
      
      return { success: true, filename }
      
    } catch (error) {
      console.error('Erro ao criar PDF:', error)
      throw error
    }
  }

  static createHTMLFallback(content, title = 'Documento CorrigeAI') {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px 20px;
              line-height: 1.6;
              color: #333;
              background-color: #fff;
            }
            .header {
              border-bottom: 3px solid #007bff;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #007bff;
              margin: 0 0 10px 0;
            }
            .meta {
              color: #666;
              font-size: 14px;
            }
            .content {
              font-size: 16px;
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #888;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; padding: 20px; }
              .footer { position: fixed; bottom: 0; width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${title}</h1>
            <div class="meta">
              Gerado em: ${new Date().toLocaleDateString('pt-BR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          <div class="content">${content}</div>
          <div class="footer">
            Documento gerado por CorrigeAI - ${new Date().getFullYear()}
          </div>
        </body>
        </html>
      `
      
      const blob = new Blob([htmlContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.html`
      
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return { success: true, filename, fallback: true }
      
    } catch (error) {
      console.error('Erro ao criar documento HTML:', error)
      throw error
    }
  }

  static async generateDocument(content, title) {
    try {
      // Tentar criar PDF primeiro
      return await this.createPDF(content, title)
    } catch (error) {
      console.warn('Falha na criação do PDF, usando fallback HTML:', error)
      // Se falhar, usar fallback HTML
      return this.createHTMLFallback(content, title)
    }
  }
}
