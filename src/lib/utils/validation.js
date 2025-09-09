/**
 * Utilitários para validação de arquivos e formatação
 */

/**
 * Valida se o arquivo é um PDF válido
 * @param {File} file - Arquivo para validar
 * @returns {Object} Resultado da validação
 */
export function validatePDFFile(file) {
  const errors = []
  const warnings = []
  
  // Verificar se é um arquivo
  if (!file) {
    errors.push('Nenhum arquivo foi fornecido')
    return { isValid: false, errors, warnings }
  }
  
  // Verificar tipo MIME
  const validMimeTypes = ['application/pdf']
  if (!validMimeTypes.includes(file.type)) {
    errors.push('Tipo de arquivo inválido. Apenas arquivos PDF são aceitos.')
  }
  
  // Verificar extensão
  const fileName = file.name.toLowerCase()
  if (!fileName.endsWith('.pdf')) {
    errors.push('Extensão de arquivo inválida. Use apenas arquivos .pdf')
  }
  
  // Verificar tamanho (máximo 50MB)
  const maxSize = 50 * 1024 * 1024 // 50MB em bytes
  if (file.size > maxSize) {
    errors.push(`Arquivo muito grande. Tamanho máximo: 50MB. Tamanho atual: ${formatFileSize(file.size)}`)
  }
  
  // Verificar tamanho mínimo (100 bytes)
  const minSize = 100
  if (file.size < minSize) {
    errors.push('Arquivo muito pequeno ou corrompido')
  }
  
  // Warnings para arquivos grandes
  const warningSize = 10 * 1024 * 1024 // 10MB
  if (file.size > warningSize) {
    warnings.push(`Arquivo grande (${formatFileSize(file.size)}). O processamento pode demorar mais.`)
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      name: file.name,
      size: file.size,
      formattedSize: formatFileSize(file.size),
      type: file.type,
      lastModified: new Date(file.lastModified)
    }
  }
}

/**
 * Formata o tamanho do arquivo em formato legível
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} Tamanho formatado
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Gera um nome único para o arquivo
 * @param {string} originalName - Nome original do arquivo
 * @returns {string} Nome único
 */
export function generateUniqueFileName(originalName) {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const extension = originalName.split('.').pop()
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "")
  
  return `${nameWithoutExt}_${timestamp}_${random}.${extension}`
}

/**
 * Sanitiza o nome do arquivo removendo caracteres perigosos
 * @param {string} fileName - Nome do arquivo
 * @returns {string} Nome sanitizado
 */
export function sanitizeFileName(fileName) {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Remove caracteres especiais
    .replace(/_{2,}/g, '_') // Remove underscores duplos
    .replace(/^_+|_+$/g, '') // Remove underscores do início e fim
    .toLowerCase()
}

/**
 * Valida parâmetros de análise
 * @param {string} analysisType - Tipo de análise
 * @returns {Object} Resultado da validação
 */
export function validateAnalysisParams(analysisType) {
  const validTypes = ['comprehensive', 'summary', 'academic', 'business', 'educational', 'exam_correction']
  
  if (!analysisType) {
    return {
      isValid: false,
      error: 'Tipo de análise é obrigatório'
    }
  }
  
  if (!validTypes.includes(analysisType)) {
    return {
      isValid: false,
      error: `Tipo de análise inválido. Tipos válidos: ${validTypes.join(', ')}`
    }
  }
  
  return { isValid: true }
}

/**
 * Formata a resposta de erro de forma consistente
 * @param {string} message - Mensagem de erro
 * @param {number} status - Status HTTP
 * @param {Object} details - Detalhes adicionais do erro
 * @returns {Object} Objeto de erro formatado
 */
export function formatErrorResponse(message, status = 500, details = null) {
  return {
    error: message,
    status,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  }
}

/**
 * Formata a resposta de sucesso de forma consistente
 * @param {Object} data - Dados de resposta
 * @param {string} message - Mensagem de sucesso
 * @returns {Object} Objeto de sucesso formatado
 */
export function formatSuccessResponse(data, message = 'Operação realizada com sucesso') {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  }
}

/**
 * Calcula estatísticas do texto
 * @param {string} text - Texto para analisar
 * @returns {Object} Estatísticas do texto
 */
export function calculateTextStats(text) {
  if (!text || typeof text !== 'string') {
    return {
      characters: 0,
      words: 0,
      paragraphs: 0,
      sentences: 0,
      readingTimeMinutes: 0
    }
  }
  
  const characters = text.length
  const words = text.split(/\s+/).filter(word => word.length > 0).length
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  
  // Calcula tempo de leitura (assumindo 200 palavras por minuto)
  const readingTimeMinutes = Math.ceil(words / 200)
  
  return {
    characters,
    words,
    paragraphs,
    sentences,
    readingTimeMinutes,
    averageWordsPerSentence: sentences > 0 ? Math.round(words / sentences) : 0,
    averageSentencesPerParagraph: paragraphs > 0 ? Math.round(sentences / paragraphs) : 0
  }
}

/**
 * Trunca texto para preview
 * @param {string} text - Texto completo
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} Texto truncado
 */
export function truncateText(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return text
  
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  return lastSpace > 0 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...'
}

/**
 * Extrai palavras-chave do texto
 * @param {string} text - Texto para análise
 * @param {number} maxKeywords - Número máximo de palavras-chave
 * @returns {Array<string>} Array de palavras-chave
 */
export function extractKeywords(text, maxKeywords = 10) {
  if (!text) return []
  
  // Remove pontuação e converte para minúscula
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ')
  
  // Lista de stop words em português
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'will', 'with', 'o', 'a', 'os', 'as', 'um', 'uma',
    'e', 'ou', 'mas', 'por', 'para', 'com', 'sem', 'de', 'do', 'da',
    'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'que', 'é', 'são',
    'foi', 'era', 'tem', 'teve', 'ter', 'ser', 'estar', 'isso', 'este',
    'esta', 'esse', 'essa', 'aquele', 'aquela', 'seu', 'sua', 'seus',
    'suas', 'meu', 'minha', 'meus', 'minhas'
  ])
  
  const words = cleanText.split(/\s+/)
  const wordCount = {}
  
  // Conta as palavras (mínimo 3 caracteres, não stop words)
  words.forEach(word => {
    if (word.length >= 3 && !stopWords.has(word)) {
      wordCount[word] = (wordCount[word] || 0) + 1
    }
  })
  
  // Ordena por frequência e retorna as top palavras
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word)
}
