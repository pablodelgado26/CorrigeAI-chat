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
    { value: 'exam_correction', label: 'Correção de Provas', description: 'Correção automática com primeira página como gabarito' }
  ]

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0]
    
    if (!selectedFile) return
    
    // Validações básicas
    if (selectedFile.type !== 'application/pdf') {
      showError('Por favor, selecione apenas arquivos PDF')
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
    
    setFile(selectedFile)
    setError(null)
    setResult(null)
    showSuccess(`Arquivo "${selectedFile.name}" selecionado com sucesso`)
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
        <h2>📄 Analisador de PDF</h2>
        <p>Faça upload de um PDF e obtenha uma análise detalhada usando IA</p>
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
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className={styles.fileInput}
        />
        
        {!file ? (
          <div className={styles.uploadPrompt}>
            <div className={styles.uploadIcon}>📁</div>
            <p>Clique aqui ou arraste um arquivo PDF</p>
            <span>Máximo 50MB</span>
          </div>
        ) : (
          <div className={styles.fileInfo}>
            <div className={styles.fileIcon}>📄</div>
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
            <h4>🎯 Formato Obrigatório do PDF:</h4>
            <ul>
              <li><strong>Primeira página:</strong> Gabarito oficial com "nome: GABARITO" e "data:"</li>
              <li><strong>Páginas seguintes:</strong> Provas dos alunos (uma ou mais por página)</li>
            </ul>
            
            <h4>✅ Padrão de Marcação:</h4>
            <ul>
              <li><strong>Alternativas:</strong> A, B, C, D, E em sequência</li>
              <li><strong>Marcação válida:</strong> Quadrado completamente preenchido em preto</li>
              <li><strong>Não marcado:</strong> Quadrado vazio ou apenas contorno</li>
            </ul>
            
            <h4>👨‍🎓 Identificação dos Alunos:</h4>
            <ul>
              <li>Nome do aluno deve estar visível no cabeçalho de cada prova</li>
              <li>Formato: "nome: [NOME DO ALUNO]" e "data:" (similar ao gabarito)</li>
              <li>Questões numeradas em ordem sequencial</li>
            </ul>
            
            <div className={styles.warningBox}>
              <strong>⚠️ Importante:</strong> A IA analisará visualmente o PDF. O gabarito deve conter "nome: GABARITO" no cabeçalho para identificação automática. Certifique-se de que as marcações estejam bem visíveis e contrastadas.
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
              '🔍 Analisar PDF'
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
