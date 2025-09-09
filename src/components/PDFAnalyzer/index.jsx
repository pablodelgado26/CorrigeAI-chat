'use client'

import { useState, useRef } from 'react'
import { useToast } from '../Toast/index.jsx'
import Loading from '../Loading/index.jsx'
import styles from './PDFAnalyzer.module.css'

export default function PDFAnalyzer() {
  const [file, setFile] = useState(null)
  const [analysisType, setAnalysisType] = useState('comprehensive')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const { showSuccess, showError, showWarning } = useToast()

  const analysisTypes = [
    { value: 'comprehensive', label: 'Análise Completa', description: 'Análise detalhada com todos os aspectos' },
    { value: 'summary', label: 'Resumo', description: 'Resumo conciso dos pontos principais' },
    { value: 'academic', label: 'Análise Acadêmica', description: 'Foco em metodologia e rigor científico' },
    { value: 'business', label: 'Análise Empresarial', description: 'Foco em estratégia e impacto no negócio' },
    { value: 'educational', label: 'Análise Educacional', description: 'Foco em objetivos de aprendizagem' },
    { value: 'exam_correction', label: 'Correção de Provas', description: 'Correção automática - suporte a PDF e Excel com padrões binários (0/1)' }
  ]

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    
    if (!selectedFile) return
    
    // Validações para tipos suportados
    const supportedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel' // .xls
    ]
    
    const supportedExtensions = ['.pdf', '.xlsx', '.xls']
    const fileExtension = selectedFile.name.toLowerCase().slice(selectedFile.name.lastIndexOf('.'))
    
    if (!supportedTypes.includes(selectedFile.type) && !supportedExtensions.includes(fileExtension)) {
      showError('Tipo de arquivo não suportado. Use PDF (.pdf) ou Excel (.xlsx, .xls)')
      return
    }
    
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (selectedFile.size > maxSize) {
      showError('Arquivo muito grande. Tamanho máximo: 50MB')
      return
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
      showWarning('Arquivo grande detectado. O processamento pode demorar mais.')
    }
    
    // Mensagem específica baseada no tipo de arquivo
    const fileType = fileExtension === '.pdf' ? 'PDF' : 'Excel'
    
    setFile(selectedFile)
    setError(null)
    setResult(null)
    showSuccess(`Arquivo ${fileType} "${selectedFile.name}" selecionado com sucesso`)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files[0]
    
    if (droppedFile) {
      // Simula o evento de input para reutilizar a validação
      const fakeEvent = { target: { files: [droppedFile] } }
      handleFileSelect(fakeEvent)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
  }

  const removeFile = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const analyzeFile = async () => {
    if (!file) {
      showError('Selecione um arquivo PDF primeiro')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('pdf', file)
      formData.append('analysisType', analysisType)

      console.log('🚀 Iniciando análise do PDF:', file.name)
      showSuccess('Iniciando análise do PDF...')

      const response = await fetch('/api/pdf/analyze', {
        method: 'POST',
        body: formData
      })

      console.log('📡 Resposta recebida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error('❌ Erro ao parsear resposta JSON:', parseError)
        throw new Error('Resposta inválida do servidor. Verifique se o serviço está funcionando.')
      }

      if (!response.ok) {
        console.error('❌ Erro na resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          data: data
        })
        
        // Mensagens mais específicas baseadas no status
        let errorMessage = 'Erro na análise do PDF'
        
        if (response.status === 422) {
          errorMessage = data.error || 'Falha ao processar o PDF. Verifique se o arquivo não está corrompido ou protegido por senha.'
        } else if (response.status === 400) {
          errorMessage = data.error || 'Dados inválidos. Verifique se selecionou um arquivo PDF válido.'
        } else if (response.status === 413) {
          errorMessage = 'Arquivo muito grande para processamento. Tente com um arquivo menor.'
        } else if (response.status === 429) {
          errorMessage = 'Muitas requisições. Aguarde alguns minutos antes de tentar novamente.'
        } else if (response.status === 500) {
          errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.'
        } else if (response.status === 503) {
          errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
        } else {
          errorMessage = data.error || `Erro ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      if (data.success && data.data) {
        setResult(data.data)
        showSuccess('PDF analisado com sucesso!')
        console.log('✅ Análise concluída:', {
          tipo: data.data.analysisType,
          paginas: data.data.fileInfo?.pages,
          estrutura: data.data.processingInfo?.structureAnalyzed
        })
      } else {
        throw new Error(data.error || 'Resposta inválida do servidor')
      }

    } catch (error) {
      console.error('💥 Erro na análise:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      
      let errorMessage = error.message
      
      // Tratamentos específicos para diferentes tipos de erro
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.'
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Erro de rede. Verifique sua conexão e tente novamente.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Operação demorou muito. Tente com um arquivo menor.'
      } else if (!errorMessage || errorMessage === 'Failed to fetch') {
        errorMessage = 'Erro de comunicação com o servidor. Verifique se o serviço está funcionando.'
      }
      
      setError(errorMessage)
      showError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const downloadReport = () => {
    if (!result) return

    const reportContent = `
RELATÓRIO DE ANÁLISE DE PDF
============================

ARQUIVO: ${result.fileInfo.name}
DATA: ${new Date(result.timestamp).toLocaleString('pt-BR')}
TIPO DE ANÁLISE: ${result.analysisType}

INFORMAÇÕES DO DOCUMENTO:
- Páginas: ${result.fileInfo.pages}
- Tamanho: ${(result.fileInfo.size / 1024 / 1024).toFixed(2)} MB
- Palavras: ${result.textStats.words}
- Tempo de leitura: ${result.textStats.readingTimeMinutes} minutos

METADADOS:
- Título: ${result.metadata.title}
- Autor: ${result.metadata.author}
- Assunto: ${result.metadata.subject}

ANÁLISE:
========

${result.analysis}

---
Relatório gerado por CorrigeAI
${new Date().toLocaleString('pt-BR')}
    `.trim()

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio_${result.fileInfo.name.replace('.pdf', '')}_${Date.now()}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showSuccess('Relatório baixado com sucesso!')
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📄 Analisador de Documentos</h2>
        <p>Faça upload de um PDF ou Excel e obtenha uma análise detalhada usando IA</p>
        <div className={styles.supportedFormats}>
          <span>📋 Formatos suportados:</span>
          <span className={styles.format}>PDF</span>
          <span className={styles.format}>Excel (.xlsx/.xls)</span>
        </div>
      </div>

      {/* Upload Area */}
      <div 
        className={`${styles.uploadArea} ${file ? styles.hasFile : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileSelect}
          className={styles.fileInput}
        />
        
        {!file ? (
          <div className={styles.uploadPrompt}>
            <div className={styles.uploadIcon}>📁</div>
            <p>Clique aqui ou arraste um arquivo PDF ou Excel</p>
            <span>Máximo 50MB • PDF, .xlsx, .xls</span>
          </div>
        ) : (
          <div className={styles.fileInfo}>
            <div className={styles.fileIcon}>
              {file.name.toLowerCase().endsWith('.pdf') ? '📄' : '📊'}
            </div>
            <div className={styles.fileDetails}>
              <h4>{file.name}</h4>
              <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile()
                }}
                className={styles.removeButton}
              >
                ✕ Remover
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Type Selection */}
      {file && (
        <div className={styles.analysisOptions}>
          <h3>Tipo de Análise</h3>
          <div className={styles.analysisGrid}>
            {analysisTypes.map((type) => (
              <label key={type.value} className={styles.analysisOption}>
                <input
                  type="radio"
                  name="analysisType"
                  value={type.value}
                  checked={analysisType === type.value}
                  onChange={(e) => setAnalysisType(e.target.value)}
                />
                <div className={styles.optionContent}>
                  <h4>{type.label}</h4>
                  <p>{type.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Exam Correction Instructions */}
      {file && analysisType === 'exam_correction' && (
        <div className={styles.examInstructions}>
          <h3>📝 Instruções para Correção de Provas</h3>
          <div className={styles.instructionCard}>
            <h4>📄 Formatos Suportados:</h4>
            <div className={styles.formatTabs}>
              <div className={styles.formatTab}>
                <h5>🗋 PDF</h5>
                <ul>
                  <li><strong>Primeira página:</strong> Gabarito oficial com "nome: GABARITO" e "data:"</li>
                  <li><strong>Páginas seguintes:</strong> Provas dos alunos</li>
                  <li><strong>Marcação:</strong> Quadrados preenchidos (pretos) para respostas corretas</li>
                </ul>
              </div>
              
              <div className={styles.formatTab}>
                <h5>📊 Excel (.xlsx/.xls)</h5>
                <ul>
                  <li><strong>Padrões binários:</strong> 0 = não marcado, 1 = marcado</li>
                  <li><strong>Horizontal:</strong> 1 | 0 1 0 0 0 (questão na primeira coluna)</li>
                  <li><strong>Vertical:</strong> Questão em uma linha, 0/1 nas linhas seguintes</li>
                  <li><strong>Com rótulos:</strong> A=1 B=0 C=0 D=0 E=0</li>
                </ul>
              </div>
            </div>
            
            <h4>� Exemplos de Formatos Binários (Excel):</h4>
            <div className={styles.binaryExamples}>
              <div className={styles.exampleFormat}>
                <h6>Formato 1: Horizontal</h6>
                <pre>
{`| Questão | A | B | C | D | E |
|---------|---|---|---|---|---|
|    1    | 0 | 1 | 0 | 0 | 0 |
|    2    | 1 | 0 | 0 | 0 | 0 |`}
                </pre>
              </div>
              
              <div className={styles.exampleFormat}>
                <h6>Formato 2: Sequencial</h6>
                <pre>
{`1
01000
2  
10000`}
                </pre>
              </div>
              
              <div className={styles.exampleFormat}>
                <h6>Formato 3: Com rótulos</h6>
                <pre>
{`Q1: A=0 B=1 C=0 D=0 E=0
Q2: A=1 B=0 C=0 D=0 E=0`}
                </pre>
              </div>
            </div>
            
            <h4>✅ Padrão de Marcação:</h4>
            <ul>
              <li><strong>Alternativas:</strong> A, B, C, D, E em sequência</li>
              <li><strong>Valor 1:</strong> Resposta selecionada/marcada</li>
              <li><strong>Valor 0:</strong> Resposta não selecionada</li>
              <li><strong>PDF:</strong> Quadrado completamente preenchido = marcado</li>
              <li><strong>Excel:</strong> Célula com valor "1" = marcado</li>
            </ul>
            
            <div className={styles.warningBox}>
              <strong>⚠️ Importante:</strong> O sistema detecta automaticamente o formato usado. Para PDFs, procure por "nome: GABARITO". Para Excel, use padrões binários (0/1) consistentes. O sistema suporta até 30 questões por gabarito.
            </div>
          </div>
        </div>
      )}

      {/* Analyze Button */}
      {file && (
        <div className={styles.actions}>
          <button
            onClick={analyzeFile}
            disabled={isAnalyzing}
            className={styles.analyzeButton}
          >
            {isAnalyzing ? (
              <>
                <Loading size="small" color="white" />
                Analisando...
              </>
            ) : (
              `🔍 Analisar ${file?.name?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Excel'}`
            )}
          </button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className={styles.error}>
          <h4>❌ Erro na Análise</h4>
          <p>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className={styles.results}>
          <div className={styles.resultHeader}>
            <h3>✅ Análise Concluída</h3>
            <button onClick={downloadReport} className={styles.downloadButton}>
              💾 Baixar Relatório
            </button>
          </div>

          <div className={styles.resultSummary}>
            <div className={styles.summaryItem}>
              <strong>Arquivo:</strong> {result.fileInfo.name}
            </div>
            <div className={styles.summaryItem}>
              <strong>Páginas:</strong> {result.fileInfo.pages}
            </div>
            <div className={styles.summaryItem}>
              <strong>Palavras:</strong> {result.textStats.words.toLocaleString()}
            </div>
            <div className={styles.summaryItem}>
              <strong>Tempo de leitura:</strong> {result.textStats.readingTimeMinutes} min
            </div>
            <div className={styles.summaryItem}>
              <strong>Tipo de análise:</strong> {analysisTypes.find(t => t.value === result.analysisType)?.label}
            </div>
            {result.processingInfo?.structureAnalyzed && (
              <div className={styles.summaryItem}>
                <strong>Estrutura identificada:</strong> 
                <span className={styles.structureTag}>
                  {result.processingInfo.structureAnalyzed === 'exam_with_answer_key' && '📝 Prova com Gabarito'}
                  {result.processingInfo.structureAnalyzed === 'answer_key_only' && '🎯 Apenas Gabarito'}
                  {result.processingInfo.structureAnalyzed === 'student_exam' && '👨‍🎓 Prova de Aluno'}
                  {result.processingInfo.structureAnalyzed === 'exam_or_test' && '📄 Prova/Teste'}
                  {result.processingInfo.structureAnalyzed === 'general_document' && '📄 Documento Geral'}
                  {!['exam_with_answer_key', 'answer_key_only', 'student_exam', 'exam_or_test', 'general_document'].includes(result.processingInfo.structureAnalyzed) && '📄 Outro'}
                </span>
                {result.processingInfo.confidence && (
                  <span className={styles.confidenceTag}>
                    Confiança: {Math.round(result.processingInfo.confidence * 100)}%
                  </span>
                )}
              </div>
            )}
            {result.processingInfo?.chunksUsed && (
              <div className={styles.summaryItem}>
                <strong>Processamento:</strong> Analisado em {result.processingInfo.chunksCount} partes
              </div>
            )}
          </div>

          <div className={styles.analysisContent}>
            <h4>📋 Relatório de Análise</h4>
            <div className={styles.analysisText}>
              {result.analysis.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>

          {result.metadata && (
            <div className={styles.metadata}>
              <h4>📊 Metadados do Documento</h4>
              <div className={styles.metadataGrid}>
                <div><strong>Título:</strong> {result.metadata.title}</div>
                <div><strong>Autor:</strong> {result.metadata.author}</div>
                <div><strong>Assunto:</strong> {result.metadata.subject}</div>
                <div><strong>Criador:</strong> {result.metadata.creator}</div>
                
                {result.metadata.analysisContext && (
                  <>
                    {result.metadata.analysisContext.hasGabarito && (
                      <div className={styles.specialInfo}>
                        <strong>🎯 Gabarito detectado:</strong> Sim
                      </div>
                    )}
                    {result.metadata.analysisContext.hasStudentNames && (
                      <div className={styles.specialInfo}>
                        <strong>👨‍🎓 Nomes de alunos:</strong> Detectados
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
