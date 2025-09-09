/**
 * Leitor de arquivos Excel (.xlsx/.xls) especializado em gabaritos
 */

import * as XLSX from 'xlsx'

/**
 * Extrai dados de um arquivo Excel
 * @param {Buffer} excelBuffer - Buffer do arquivo Excel
 * @returns {Promise<Object>} Dados extraídos estruturados
 */
export async function extractDataFromExcel(excelBuffer) {
  console.log('📊 Iniciando extração de dados do Excel...')
  
  try {
    // Lê o arquivo Excel do buffer
    const workbook = XLSX.read(excelBuffer, { type: 'buffer' })
    console.log(`📄 Planilhas encontradas: ${workbook.SheetNames.join(', ')}`)
    
    // Pega a primeira planilha
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // Converte para JSON mantendo células vazias
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1,
      defval: '',
      raw: false
    })
    
    // Converte para texto estruturado
    const textData = convertExcelToText(jsonData)
    
    // Análise específica para gabarito
    const gabaritoData = analyzeExcelForAnswerKey(jsonData)
    
    console.log(`✅ Excel processado: ${jsonData.length} linhas`)
    
    return {
      text: textData,
      rawData: jsonData,
      answerKeyAnalysis: gabaritoData,
      numRows: jsonData.length,
      numCols: Math.max(...jsonData.map(row => row.length)),
      sheetName: firstSheetName,
      allSheets: workbook.SheetNames,
      wordCount: textData.split(/\s+/).length,
      charCount: textData.length,
      cleanText: textData,
      isEmpty: textData.trim().length === 0,
      hasEnoughContent: textData.trim().length >= 50
    }
    
  } catch (error) {
    console.error('❌ Erro na leitura do Excel:', error)
    throw new Error(`Falha ao processar Excel: ${error.message}`)
  }
}

/**
 * Converte dados do Excel para texto estruturado
 * @param {Array} jsonData - Dados do Excel em formato JSON
 * @returns {string} Texto estruturado
 */
function convertExcelToText(jsonData) {
  let text = ''
  
  for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
    const row = jsonData[rowIndex]
    
    // Pula linhas vazias
    if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
      continue
    }
    
    // Adiciona linha com índice
    const lineContent = row
      .map(cell => cell ? cell.toString().trim() : '')
      .filter(cell => cell !== '')
      .join(' ')
    
    if (lineContent) {
      text += lineContent + '\n'
    }
  }
  
  return text.trim()
}

/**
 * Analisa Excel especificamente procurando por padrões de gabarito
 * @param {Array} jsonData - Dados do Excel
 * @returns {Object} Análise de gabarito
 */
function analyzeExcelForAnswerKey(jsonData) {
  console.log('🎯 Analisando Excel para padrões de gabarito...')
  
  const analysis = {
    hasAnswerKey: false,
    answerKey: {},
    patterns: [],
    binaryPatterns: [], // Para 0/1
    confidence: 0,
    format: 'unknown'
  }
  
  try {
    // Procura por padrões de gabarito nas primeiras linhas
    for (let rowIndex = 0; rowIndex < Math.min(10, jsonData.length); rowIndex++) {
      const row = jsonData[rowIndex] || []
      const rowText = row.join(' ').toLowerCase()
      
      // Verifica se é linha de cabeçalho de gabarito
      if (/gabarito|answer.*key/i.test(rowText)) {
        analysis.hasAnswerKey = true
        analysis.patterns.push(`Gabarito encontrado na linha ${rowIndex + 1}`)
        break
      }
    }
    
    // Se encontrou gabarito, tenta extrair respostas
    if (analysis.hasAnswerKey) {
      analysis.answerKey = extractAnswerKeyFromExcel(jsonData)
      analysis.confidence = Object.keys(analysis.answerKey).length > 0 ? 0.8 : 0.3
    }
    
    // Procura por padrões binários (0/1)
    const binaryAnalysis = analyzeBinaryPatterns(jsonData)
    if (binaryAnalysis.hasBinaryPattern) {
      analysis.binaryPatterns = binaryAnalysis.patterns
      analysis.format = 'binary'
      analysis.hasAnswerKey = true
      analysis.answerKey = { ...analysis.answerKey, ...binaryAnalysis.answerKey }
      analysis.confidence = Math.max(analysis.confidence, binaryAnalysis.confidence)
    }
    
    // Procura por padrões de múltipla escolha
    const multipleChoiceAnalysis = analyzeMultipleChoicePatterns(jsonData)
    if (multipleChoiceAnalysis.hasPattern) {
      analysis.format = multipleChoiceAnalysis.format
      analysis.hasAnswerKey = true
      analysis.answerKey = { ...analysis.answerKey, ...multipleChoiceAnalysis.answerKey }
      analysis.confidence = Math.max(analysis.confidence, multipleChoiceAnalysis.confidence)
    }
    
    console.log(`   📊 Análise concluída: ${analysis.hasAnswerKey ? 'Gabarito detectado' : 'Gabarito não detectado'}`)
    console.log(`   📊 Confiança: ${analysis.confidence}`)
    console.log(`   📊 Formato: ${analysis.format}`)
    
  } catch (error) {
    console.error('❌ Erro na análise do gabarito Excel:', error)
    analysis.error = error.message
  }
  
  return analysis
}

/**
 * Extrai gabarito de formato tradicional (A,B,C,D,E)
 */
function extractAnswerKeyFromExcel(jsonData) {
  const answerKey = {}
  let currentQuestion = 1
  
  for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
    const row = jsonData[rowIndex] || []
    
    // Procura por números de questão
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cell = row[colIndex]?.toString().trim()
      
      // Se é um número (questão)
      if (/^\d+$/.test(cell)) {
        const questionNum = parseInt(cell)
        
        // Procura a resposta nas próximas células ou linhas
        const answer = findAnswerForQuestion(jsonData, rowIndex, colIndex, questionNum)
        if (answer) {
          answerKey[questionNum] = answer
        }
      }
    }
  }
  
  return answerKey
}

/**
 * Procura resposta para uma questão específica
 */
function findAnswerForQuestion(jsonData, questionRow, questionCol, questionNum) {
  // Procura nas próximas 5 células da mesma linha
  const row = jsonData[questionRow] || []
  for (let i = questionCol + 1; i < Math.min(questionCol + 6, row.length); i++) {
    const cell = row[i]?.toString().trim().toUpperCase()
    if (/^[ABCDE]$/.test(cell)) {
      return cell
    }
  }
  
  // Procura nas próximas 5 linhas, mesma coluna ou próximas
  for (let rowOffset = 1; rowOffset <= 5; rowOffset++) {
    const nextRow = jsonData[questionRow + rowOffset] || []
    
    for (let colOffset = 0; colOffset <= 2; colOffset++) {
      const cell = nextRow[questionCol + colOffset]?.toString().trim().toUpperCase()
      if (/^[ABCDE]$/.test(cell)) {
        return cell
      }
    }
  }
  
  return null
}

/**
 * Analisa padrões binários (0/1) que representam respostas marcadas
 */
function analyzeBinaryPatterns(jsonData) {
  console.log('🔢 Analisando padrões binários (0/1)...')
  
  const result = {
    hasBinaryPattern: false,
    patterns: [],
    answerKey: {},
    confidence: 0
  }
  
  try {
    for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
      const row = jsonData[rowIndex] || []
      
      // Procura por sequências de 0s e 1s (formato: questão seguida de 0,1,0,0,0 = resposta B)
      for (let colIndex = 0; colIndex < row.length - 5; colIndex++) {
        const cell = row[colIndex]?.toString().trim()
        
        // Se é um número de questão
        if (/^\d+$/.test(cell)) {
          const questionNum = parseInt(cell)
          
          // Verifica se as próximas 5 células são binários (0/1)
          const nextCells = []
          for (let i = 1; i <= 5; i++) {
            const nextCell = row[colIndex + i]?.toString().trim()
            if (/^[01]$/.test(nextCell)) {
              nextCells.push(nextCell)
            } else {
              break
            }
          }
          
          // Se encontrou 5 valores binários consecutivos
          if (nextCells.length === 5) {
            result.hasBinaryPattern = true
            result.patterns.push(`Q${questionNum}: ${nextCells.join(',')}`)
            
            // Encontra qual posição tem '1' (resposta marcada)
            const answerIndex = nextCells.indexOf('1')
            if (answerIndex !== -1) {
              const answerLetter = String.fromCharCode(65 + answerIndex) // A=65, B=66, etc.
              result.answerKey[questionNum] = answerLetter
              result.confidence = Math.max(result.confidence, 0.9)
            }
          }
        }
      }
    }
    
    // Também verifica formato vertical (questão em uma linha, 0/1 nas linhas seguintes)
    if (!result.hasBinaryPattern) {
      result = { ...result, ...analyzeBinaryVerticalPattern(jsonData) }
    }
    
    console.log(`   🔢 Padrões binários encontrados: ${result.patterns.length}`)
    
  } catch (error) {
    console.error('❌ Erro na análise de padrões binários:', error)
  }
  
  return result
}

/**
 * Analisa padrões binários em formato vertical
 */
function analyzeBinaryVerticalPattern(jsonData) {
  const result = {
    hasBinaryPattern: false,
    patterns: [],
    answerKey: {},
    confidence: 0
  }
  
  for (let rowIndex = 0; rowIndex < jsonData.length - 5; rowIndex++) {
    const row = jsonData[rowIndex] || []
    
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cell = row[colIndex]?.toString().trim()
      
      // Se é um número de questão
      if (/^\d+$/.test(cell)) {
        const questionNum = parseInt(cell)
        
        // Verifica as próximas 5 linhas na mesma coluna ou próxima
        const binaryValues = []
        for (let lineOffset = 1; lineOffset <= 5; lineOffset++) {
          const nextRow = jsonData[rowIndex + lineOffset] || []
          const nextCell = nextRow[colIndex] || nextRow[colIndex + 1] || ''
          const cellValue = nextCell.toString().trim()
          
          if (/^[01]$/.test(cellValue)) {
            binaryValues.push(cellValue)
          } else {
            break
          }
        }
        
        if (binaryValues.length === 5) {
          result.hasBinaryPattern = true
          result.patterns.push(`Q${questionNum}: ${binaryValues.join(',')} (vertical)`)
          
          const answerIndex = binaryValues.indexOf('1')
          if (answerIndex !== -1) {
            const answerLetter = String.fromCharCode(65 + answerIndex)
            result.answerKey[questionNum] = answerLetter
            result.confidence = Math.max(result.confidence, 0.85)
          }
        }
      }
    }
  }
  
  return result
}

/**
 * Analisa padrões de múltipla escolha tradicionais
 */
function analyzeMultipleChoicePatterns(jsonData) {
  const result = {
    hasPattern: false,
    format: 'traditional',
    answerKey: {},
    confidence: 0
  }
  
  // Implementa análise de padrões A,B,C,D,E
  // Similar ao que já existe, mas adaptado para Excel
  
  return result
}

/**
 * Valida se o buffer é um arquivo Excel válido
 * @param {Buffer} buffer - Buffer do arquivo
 * @returns {boolean} True se for um Excel válido
 */
export function isValidExcel(buffer) {
  if (!buffer || buffer.length < 8) return false
  
  // Excel files podem começar com diferentes assinaturas
  const header = buffer.slice(0, 8)
  
  // XLSX (ZIP-based)
  if (header[0] === 0x50 && header[1] === 0x4B) return true
  
  // XLS (OLE-based)  
  if (header[0] === 0xD0 && header[1] === 0xCF) return true
  
  return false
}

/**
 * Detecta o tipo de arquivo baseado na extensão
 * @param {string} filename - Nome do arquivo
 * @returns {string} Tipo detectado
 */
export function detectFileType(filename) {
  if (!filename) return 'unknown'
  
  const ext = filename.toLowerCase().split('.').pop()
  
  switch (ext) {
    case 'xlsx':
    case 'xls':
      return 'excel'
    case 'pdf':
      return 'pdf'
    default:
      return 'unknown'
  }
}
