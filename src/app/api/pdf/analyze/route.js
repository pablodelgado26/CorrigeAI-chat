import { NextResponse } from 'next/server'
import { 
  extractTextFromPDF, 
  isValidPDF, 
  extractMetadata, 
  splitTextIntoChunks,
  analyzeTextStructure,
  extractVisualAnswerKey
} from '../../../../lib/pdf/pdfReader.js'
import { 
  extractDataFromExcel, 
  isValidExcel, 
  detectFileType 
} from '../../../../lib/excel/excelReader.js'
import { analyzeDocument, analyzeDocumentInChunks } from '../../../../lib/ai/documentAnalyzer.js'
import { validateAnalysisParams, formatErrorResponse, formatSuccessResponse, calculateTextStats } from '../../../../lib/utils/validation.js'

export const config = {
  api: {
    bodyParser: false, // Importante para upload de arquivos
  },
}

export async function POST(request) {
  console.log('🚀 === INICIANDO ANÁLISE DE PDF ===')
  
  try {
    // Parse do FormData
    const formData = await request.formData()
    const file = formData.get('pdf')
    const analysisType = formData.get('analysisType') || 'comprehensive'
    
    console.log('📄 Arquivo recebido:', {
      name: file?.name,
      size: file?.size,
      type: file?.type
    })
    console.log('🎯 Tipo de análise solicitado:', analysisType)
    
    // === VALIDAÇÕES INICIAIS ===
    if (!file) {
      console.log('❌ Nenhum arquivo enviado')
      return NextResponse.json(
        formatErrorResponse('Nenhum arquivo foi enviado', 400),
        { status: 400 }
      )
    }
    
    // Detecta tipo de arquivo
    const fileType = detectFileType(file.name)
    console.log('📁 Tipo de arquivo detectado:', fileType)
    
    // Validação do tipo de análise
    const analysisValidation = validateAnalysisParams(analysisType)
    if (!analysisValidation.isValid) {
      console.log('❌ Tipo de análise inválido:', analysisValidation.error)
      return NextResponse.json(
        formatErrorResponse(analysisValidation.error, 400),
        { status: 400 }
      )
    }
    
    // === PROCESSAMENTO DO ARQUIVO ===
    console.log('⏳ Convertendo arquivo para buffer...')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log(`✅ Buffer criado: ${buffer.length} bytes`)
    
    // Validação baseada no tipo de arquivo
    let documentData
    
    if (fileType === 'pdf') {
      // Processamento PDF
      if (!isValidPDF(buffer)) {
        console.log('❌ Arquivo não é um PDF válido')
        return NextResponse.json(
          formatErrorResponse('Arquivo não é um PDF válido ou está corrompido', 400),
          { status: 400 }
        )
      }
      console.log('✅ PDF válido confirmado')
      
      // === EXTRAÇÃO DE TEXTO DO PDF ===
      try {
        console.log('⏳ Extraindo texto do PDF...')
        documentData = await extractTextFromPDF(buffer)
        documentData.fileType = 'pdf'
        console.log('✅ Extração PDF concluída:', {
          paginas: documentData.numPages,
          palavras: documentData.wordCount,
          caracteres: documentData.charCount,
          temConteudo: documentData.hasEnoughContent
        })
      } catch (error) {
        console.error('❌ Erro na extração do PDF:', error)
        return handleExtractionError(error, 'PDF')
      }
      
    } else if (fileType === 'excel') {
      // Processamento Excel
      if (!isValidExcel(buffer)) {
        console.log('❌ Arquivo não é um Excel válido')
        return NextResponse.json(
          formatErrorResponse('Arquivo não é um Excel válido ou está corrompido', 400),
          { status: 400 }
        )
      }
      console.log('✅ Excel válido confirmado')
      
      // === EXTRAÇÃO DE DADOS DO EXCEL ===
      try {
        console.log('⏳ Extraindo dados do Excel...')
        documentData = await extractDataFromExcel(buffer)
        documentData.fileType = 'excel'
        console.log('✅ Extração Excel concluída:', {
          linhas: documentData.numRows,
          colunas: documentData.numCols,
          palavras: documentData.wordCount,
          temConteudo: documentData.hasEnoughContent
        })
      } catch (error) {
        console.error('❌ Erro na extração do Excel:', error)
        return handleExtractionError(error, 'Excel')
      }
      
    } else {
      console.log('❌ Tipo de arquivo não suportado:', fileType)
      return NextResponse.json(
        formatErrorResponse('Tipo de arquivo não suportado. Apenas PDF e Excel (.xlsx/.xls) são aceitos.', 400),
        { status: 400 }
      )
    }
    
    // Verifica se há conteúdo suficiente
    if (!documentData.hasEnoughContent) {
      console.log('❌ Documento sem conteúdo suficiente:', {
        isEmpty: documentData.isEmpty,
        textLength: documentData.cleanText.length
      })
      
      const errorMessage = documentData.isEmpty 
        ? `${fileType.toUpperCase()} não contém texto legível. Pode ser composto apenas por imagens.`
        : `${fileType.toUpperCase()} contém muito pouco texto para análise. Verifique o conteúdo.`
      
      return NextResponse.json(
        formatErrorResponse(errorMessage, 422),
        { status: 422 }
      )
    }
    
    // === ANÁLISE DA ESTRUTURA ===
    let textStructure
    let visualAnswerKey = null
    
    if (fileType === 'pdf') {
      textStructure = analyzeTextStructure(documentData.cleanText)
      console.log('🔍 Estrutura do texto analisada:', textStructure.type)
      
      // === EXTRAÇÃO ESPECÍFICA DE GABARITO VISUAL ===
      if (textStructure.type === 'visual_answer_key' || 
          textStructure.type === 'answer_key_document' || 
          textStructure.hasVisualGabarito ||
          analysisType === 'exam_correction') {
        
        console.log('🎯 Tentando extrair gabarito visual do PDF...')
        visualAnswerKey = extractVisualAnswerKey(documentData.cleanText)
        
        if (visualAnswerKey.success) {
          console.log(`✅ Gabarito visual extraído: ${visualAnswerKey.questionsFound} questões`)
        } else {
          console.log(`⚠️ Extração de gabarito falhou: ${visualAnswerKey.message}`)
        }
      }
    } else if (fileType === 'excel') {
      // Para Excel, usa análise específica já feita na extração
      textStructure = {
        type: documentData.answerKeyAnalysis.hasAnswerKey ? 'excel_answer_key' : 'excel_document',
        confidence: documentData.answerKeyAnalysis.confidence,
        hasGabarito: documentData.answerKeyAnalysis.hasAnswerKey,
        hasVisualGabarito: documentData.answerKeyAnalysis.format === 'binary',
        format: documentData.answerKeyAnalysis.format
      }
      
      console.log('📊 Estrutura Excel analisada:', textStructure.type)
      
      // Usa gabarito extraído do Excel
      if (documentData.answerKeyAnalysis.hasAnswerKey) {
        visualAnswerKey = {
          success: Object.keys(documentData.answerKeyAnalysis.answerKey).length > 0,
          answerKey: documentData.answerKeyAnalysis.answerKey,
          questionsFound: Object.keys(documentData.answerKeyAnalysis.answerKey).length,
          extractionLog: documentData.answerKeyAnalysis.patterns,
          message: `Gabarito Excel extraído: ${Object.keys(documentData.answerKeyAnalysis.answerKey).length} questões`
        }
        console.log(`✅ Gabarito Excel extraído: ${visualAnswerKey.questionsFound} questões`)
      }
    }
    
    // === EXTRAÇÃO DE METADADOS ===
    const metadata = fileType === 'pdf' 
      ? extractMetadata(documentData)
      : {
          title: `Planilha Excel: ${file.name}`,
          author: 'Não especificado',
          subject: 'Análise de Excel',
          creator: 'Sistema CorrigeAI',
          producer: 'Excel Reader',
          pages: 1,
          version: 'Excel',
          sheetName: documentData.sheetName,
          allSheets: documentData.allSheets,
          rows: documentData.numRows,
          cols: documentData.numCols
        }
    
    console.log('📊 Metadados extraídos:', {
      titulo: metadata.title,
      autor: metadata.author,
      paginas: metadata.pages
    })
    
    // === CÁLCULO DE ESTATÍSTICAS ===
    const textStats = calculateTextStats(documentData.cleanText)
    console.log('📈 Estatísticas calculadas:', {
      palavras: textStats.words,
      tempoLeitura: textStats.readingTimeMinutes
    })
    
    // === ANÁLISE COM IA ===
    console.log('🧠 Iniciando análise com IA...')
    
    // Decide se deve analisar em chunks baseado no tamanho
    const maxTokens = 6000 // Limite conservador para o modelo
    const shouldUseChunks = documentData.cleanText.length > maxTokens
    
    let analysis
    
    // Adiciona informações da estrutura do texto para a IA
    const enhancedMetadata = {
      ...metadata,
      textStructure,
      visualAnswerKey: visualAnswerKey || null,
      fileType,
      analysisContext: {
        isExamRelated: textStructure.type.includes('exam') || textStructure.type.includes('answer'),
        hasGabarito: textStructure.hasGabarito,
        hasVisualGabarito: textStructure.hasVisualGabarito,
        hasStudentNames: textStructure.hasStudentNames || false,
        confidence: textStructure.confidence,
        visualAnswerKeyExtracted: visualAnswerKey?.success || false,
        questionsInAnswerKey: visualAnswerKey?.questionsFound || 0,
        documentFormat: fileType,
        binaryPatterns: fileType === 'excel' ? documentData.answerKeyAnalysis.binaryPatterns : []
      }
    }
    
    try {
      if (shouldUseChunks) {
        console.log('📄 Documento grande - analisando em chunks...')
        const chunks = splitTextIntoChunks(documentData.cleanText, maxTokens)
        console.log(`Dividido em ${chunks.length} chunks`)
        
        analysis = await analyzeDocumentInChunks(chunks, enhancedMetadata, analysisType)
      } else {
        console.log('📄 Documento pequeno - análise direta...')
        analysis = await analyzeDocument(documentData.cleanText, enhancedMetadata, analysisType)
      }
      
      console.log('✅ Análise com IA concluída com sucesso')
    } catch (aiError) {
      console.error('❌ Erro na análise com IA:', aiError)
      
      // Tratamento específico de erros da IA
      let errorMessage = 'Erro na análise do documento.'
      if (aiError.message.includes('rate limit') || aiError.message.includes('quota')) {
        errorMessage = 'Limite de uso da IA atingido. Tente novamente em alguns minutos.'
        return NextResponse.json(
          formatErrorResponse(errorMessage, 429),
          { status: 429 }
        )
      } else if (aiError.message.includes('timeout')) {
        errorMessage = 'Análise demorou muito para ser concluída. Tente com um arquivo menor.'
        return NextResponse.json(
          formatErrorResponse(errorMessage, 408),
          { status: 408 }
        )
      } else {
        errorMessage += ` Detalhes: ${aiError.message}`
        return NextResponse.json(
          formatErrorResponse(errorMessage, 503),
          { status: 503 }
        )
      }
    }
    
    // === PREPARAÇÃO DA RESPOSTA ===
    const responseData = {
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        pages: fileType === 'pdf' ? documentData.numPages : documentData.numRows,
        fileType,
        ...(fileType === 'excel' && {
          sheetName: documentData.sheetName,
          allSheets: documentData.allSheets,
          rows: documentData.numRows,
          cols: documentData.numCols
        })
      },
      textStats,
      metadata: enhancedMetadata,
      analysis: analysis.analysis,
      analysisType: analysis.analysisType,
      timestamp: analysis.timestamp,
      processingInfo: {
        chunksUsed: shouldUseChunks,
        chunksCount: shouldUseChunks ? analysis.chunksAnalyzed : 1,
        textExtracted: documentData.wordCount > 0,
        structureAnalyzed: textStructure.type,
        confidence: textStructure.confidence,
        visualAnswerKeyExtracted: visualAnswerKey?.success || false,
        visualAnswerKey: visualAnswerKey || null,
        fileType,
        supportsBinary: fileType === 'excel' || textStructure.hasVisualGabarito
      }
    }
    
    console.log('🎉 Análise concluída com sucesso!')
    return NextResponse.json(
      formatSuccessResponse(responseData, `${fileType.toUpperCase()} analisado com sucesso`),
      { status: 200 }
    )
    
  } catch (error) {
    console.error('💥 Erro geral na análise:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    // Tratamento específico de erros gerais
    let errorMessage = 'Erro interno do servidor.'
    let statusCode = 500
    
    if (error.message.includes('FormData') || error.message.includes('multipart')) {
      errorMessage = 'Erro no processamento do arquivo enviado. Verifique o formato.'
      statusCode = 400
    } else if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
      errorMessage = 'Operação expirou. Tente novamente com um arquivo menor.'
      statusCode = 408
    } else if (error.message.includes('Memory') || error.message.includes('heap')) {
      errorMessage = 'Arquivo muito grande para processamento. Reduza o tamanho e tente novamente.'
      statusCode = 413
    }
    
    return NextResponse.json(
      formatErrorResponse(errorMessage, statusCode),
      { status: statusCode }
    )
  }
}

/**
 * Trata erros de extração de arquivos
 */
function handleExtractionError(error, fileType) {
  // Mensagens mais específicas baseadas no tipo de erro
  let errorMessage = `Falha ao extrair dados do ${fileType}.`
  
  if (error.message.includes('corrompido')) {
    errorMessage += ' O arquivo parece estar corrompido.'
  } else if (error.message.includes('senha')) {
    errorMessage += ' O arquivo está protegido por senha.'
  } else if (error.message.includes('biblioteca') || error.message.includes('library')) {
    errorMessage += ' Erro interno do sistema de leitura.'
  } else if (error.message.includes('format') || error.message.includes('formato')) {
    errorMessage += ' Formato de arquivo não suportado ou inválido.'
  } else {
    errorMessage += ` Detalhes: ${error.message}`
  }
  
  return NextResponse.json(
    formatErrorResponse(errorMessage, 422),
    { status: 422 }
  )
}

export async function GET() {
  return NextResponse.json({
    message: 'API de análise de documentos - Versão Aprimorada com Excel',
    endpoints: {
      POST: '/api/pdf/analyze - Envia PDF ou Excel para análise'
    },
    supportedFormats: [
      'application/pdf - Arquivos PDF',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet - Excel (.xlsx)',
      'application/vnd.ms-excel - Excel (.xls)'
    ],
    maxFileSize: '50MB',
    analysisTypes: [
      'comprehensive - Análise completa e detalhada',
      'summary - Resumo conciso',
      'academic - Análise acadêmica',
      'business - Análise empresarial',
      'educational - Análise educacional',
      'exam_correction - Correção automática de provas (NOVO: suporte a padrões binários 0/1)'
    ],
    features: [
      'Extração robusta de texto (PDF e Excel)',
      'Análise da estrutura do documento',
      'Identificação automática de gabaritos visuais',
      'NOVO: Suporte a padrões binários (0/1) para marcações',
      'NOVO: Leitura de arquivos Excel (.xlsx/.xls)',
      'NOVO: Detecção de gabaritos em formato A=1, B=0, C=0, D=0, E=0',
      'Tratamento melhorado de erros',
      'Logs detalhados para debugging'
    ],
    binaryPatterns: [
      'Formato horizontal: 1 0 1 0 0 (questão seguida de 5 valores binários)',
      'Formato vertical: questão em uma linha, 0/1 nas linhas seguintes',
      'Formato com símbolos: A=1 B=0 C=0 D=0 E=0',
      'Formato simples: 01000 (apenas os 5 dígitos)',
      'Detecção automática do padrão usado no documento'
    ]
  })
}
