import { NextResponse } from 'next/server'
import { 
  extractTextFromPDF, 
  isValidPDF, 
  extractMetadata, 
  splitTextIntoChunks,
  analyzeTextStructure 
} from '../../../../lib/pdf/pdfReader.js'
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
        formatErrorResponse('Nenhum arquivo PDF foi enviado', 400),
        { status: 400 }
      )
    }
    
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
    
    // Validação do PDF
    if (!isValidPDF(buffer)) {
      console.log('❌ Arquivo não é um PDF válido')
      return NextResponse.json(
        formatErrorResponse('Arquivo não é um PDF válido ou está corrompido', 400),
        { status: 400 }
      )
    }
    console.log('✅ PDF válido confirmado')
    
    // === EXTRAÇÃO DE TEXTO ===
    let pdfData
    try {
      console.log('⏳ Extraindo texto do PDF...')
      pdfData = await extractTextFromPDF(buffer)
      console.log('✅ Extração concluída:', {
        paginas: pdfData.numPages,
        palavras: pdfData.wordCount,
        caracteres: pdfData.charCount,
        temConteudo: pdfData.hasEnoughContent
      })
    } catch (error) {
      console.error('❌ Erro na extração do PDF:', {
        message: error.message,
        stack: error.stack
      })
      
      // Mensagens mais específicas baseadas no tipo de erro
      let errorMessage = 'Falha ao extrair texto do PDF.'
      if (error.message.includes('corrompido')) {
        errorMessage += ' O arquivo parece estar corrompido.'
      } else if (error.message.includes('senha')) {
        errorMessage += ' O arquivo está protegido por senha.'
      } else if (error.message.includes('biblioteca')) {
        errorMessage += ' Erro interno do sistema de leitura.'
      } else {
        errorMessage += ` Detalhes: ${error.message}`
      }
      
      return NextResponse.json(
        formatErrorResponse(errorMessage, 422),
        { status: 422 }
      )
    }
    
    // Verifica se há conteúdo suficiente
    if (!pdfData.hasEnoughContent) {
      console.log('❌ PDF sem conteúdo suficiente:', {
        isEmpty: pdfData.isEmpty,
        textLength: pdfData.cleanText.length
      })
      
      const errorMessage = pdfData.isEmpty 
        ? 'PDF não contém texto legível. Pode ser composto apenas por imagens.'
        : 'PDF contém muito pouco texto para análise. Verifique o conteúdo.'
      
      return NextResponse.json(
        formatErrorResponse(errorMessage, 422),
        { status: 422 }
      )
    }
    
    // === ANÁLISE DA ESTRUTURA ===
    const textStructure = analyzeTextStructure(pdfData.cleanText)
    console.log('🔍 Estrutura do texto analisada:', textStructure.type)
    
    // === EXTRAÇÃO DE METADADOS ===
    const metadata = extractMetadata(pdfData)
    console.log('📊 Metadados extraídos:', {
      titulo: metadata.title,
      autor: metadata.author,
      paginas: metadata.pages
    })
    
    // === CÁLCULO DE ESTATÍSTICAS ===
    const textStats = calculateTextStats(pdfData.cleanText)
    console.log('📈 Estatísticas calculadas:', {
      palavras: textStats.words,
      tempoLeitura: textStats.readingTimeMinutes
    })
    
    // === ANÁLISE COM IA ===
    console.log('🧠 Iniciando análise com IA...')
    
    // Decide se deve analisar em chunks baseado no tamanho
    const maxTokens = 6000 // Limite conservador para o modelo
    const shouldUseChunks = pdfData.cleanText.length > maxTokens
    
    let analysis
    
    // Adiciona informações da estrutura do texto para a IA
    const enhancedMetadata = {
      ...metadata,
      textStructure,
      analysisContext: {
        isExamRelated: textStructure.type.includes('exam') || textStructure.type.includes('answer'),
        hasGabarito: textStructure.hasGabarito,
        hasStudentNames: textStructure.hasStudentNames,
        confidence: textStructure.confidence
      }
    }
    
    try {
      if (shouldUseChunks) {
        console.log('📄 Documento grande - analisando em chunks...')
        const chunks = splitTextIntoChunks(pdfData.cleanText, maxTokens)
        console.log(`Dividido em ${chunks.length} chunks`)
        
        analysis = await analyzeDocumentInChunks(chunks, enhancedMetadata, analysisType)
      } else {
        console.log('📄 Documento pequeno - análise direta...')
        analysis = await analyzeDocument(pdfData.cleanText, enhancedMetadata, analysisType)
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
        pages: pdfData.numPages
      },
      textStats,
      metadata: enhancedMetadata,
      analysis: analysis.analysis,
      analysisType: analysis.analysisType,
      timestamp: analysis.timestamp,
      processingInfo: {
        chunksUsed: shouldUseChunks,
        chunksCount: shouldUseChunks ? analysis.chunksAnalyzed : 1,
        textExtracted: pdfData.wordCount > 0,
        structureAnalyzed: textStructure.type,
        confidence: textStructure.confidence
      }
    }
    
    console.log('🎉 Análise concluída com sucesso!')
    return NextResponse.json(
      formatSuccessResponse(responseData, 'PDF analisado com sucesso'),
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

export async function GET() {
  return NextResponse.json({
    message: 'API de análise de PDF - Versão Melhorada',
    endpoints: {
      POST: '/api/pdf/analyze - Envia PDF para análise'
    },
    supportedFormats: ['application/pdf'],
    maxFileSize: '50MB',
    analysisTypes: [
      'comprehensive - Análise completa e detalhada',
      'summary - Resumo conciso',
      'academic - Análise acadêmica',
      'business - Análise empresarial',
      'educational - Análise educacional',
      'exam_correction - Correção automática de provas'
    ],
    features: [
      'Extração robusta de texto',
      'Análise da estrutura do documento',
      'Identificação automática de gabaritos e provas',
      'Tratamento melhorado de erros',
      'Logs detalhados para debugging'
    ]
  })
}
