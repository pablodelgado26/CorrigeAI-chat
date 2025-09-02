import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromPDF, isValidPDF, extractMetadata, splitTextIntoChunks } from '../../../../lib/pdf/pdfReader.js'
import { analyzeDocument, analyzeDocumentInChunks } from '../../../../lib/ai/documentAnalyzer.js'
import { validateAnalysisParams, formatErrorResponse, formatSuccessResponse, calculateTextStats } from '../../../../lib/utils/validation.js'

export const config = {
  api: {
    bodyParser: false, // Importante para upload de arquivos
  },
}

export async function POST(request) {
  try {
    console.log('=== INICIANDO ANÁLISE DE PDF ===')
    
    // Parse do FormData
    const formData = await request.formData()
    const file = formData.get('pdf')
    const analysisType = formData.get('analysisType') || 'comprehensive'
    
    console.log('Arquivo recebido:', file?.name, file?.size)
    console.log('Tipo de análise:', analysisType)
    
    // Validações
    if (!file) {
      return NextResponse.json(
        formatErrorResponse('Nenhum arquivo PDF foi enviado', 400),
        { status: 400 }
      )
    }
    
    const analysisValidation = validateAnalysisParams(analysisType)
    if (!analysisValidation.isValid) {
      return NextResponse.json(
        formatErrorResponse(analysisValidation.error, 400),
        { status: 400 }
      )
    }
    
    // Converte arquivo para buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Valida se é um PDF
    if (!isValidPDF(buffer)) {
      return NextResponse.json(
        formatErrorResponse('Arquivo não é um PDF válido', 400),
        { status: 400 }
      )
    }
    
    console.log('✅ Arquivo PDF válido')
    
    // Extrai texto do PDF
    let pdfData
    try {
      pdfData = await extractTextFromPDF(buffer)
      console.log(`✅ Texto extraído: ${pdfData.wordCount} palavras, ${pdfData.numPages} páginas`)
    } catch (error) {
      console.error('❌ Erro na extração do PDF:', error)
      return NextResponse.json(
        formatErrorResponse('Falha ao extrair texto do PDF. Verifique se o arquivo não está corrompido.', 422),
        { status: 422 }
      )
    }
    
    // Verifica se há texto suficiente
    if (!pdfData.cleanText || pdfData.cleanText.length < 50) {
      return NextResponse.json(
        formatErrorResponse('PDF não contém texto suficiente para análise. Verifique se não é apenas imagens.', 422),
        { status: 422 }
      )
    }
    
    // Extrai metadados
    const metadata = extractMetadata(pdfData)
    console.log('✅ Metadados extraídos:', metadata.title)
    
    // Calcula estatísticas do texto
    const textStats = calculateTextStats(pdfData.cleanText)
    console.log(`✅ Estatísticas: ${textStats.words} palavras, tempo de leitura: ${textStats.readingTimeMinutes}min`)
    
    // Decide se deve analisar em chunks baseado no tamanho
    const maxTokens = 6000 // Limite conservador para o modelo
    const shouldUseChunks = pdfData.cleanText.length > maxTokens
    
    let analysis
    
    if (shouldUseChunks) {
      console.log('📄 Documento grande - analisando em chunks...')
      const chunks = splitTextIntoChunks(pdfData.cleanText, maxTokens)
      console.log(`Dividido em ${chunks.length} chunks`)
      
      analysis = await analyzeDocumentInChunks(chunks, metadata, analysisType)
    } else {
      console.log('📄 Documento pequeno - análise direta...')
      analysis = await analyzeDocument(pdfData.cleanText, metadata, analysisType)
    }
    
    console.log('✅ Análise concluída com sucesso')
    
    // Prepara resposta final
    const responseData = {
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        pages: pdfData.numPages
      },
      textStats,
      metadata,
      analysis: analysis.analysis,
      analysisType: analysis.analysisType,
      timestamp: analysis.timestamp,
      processingInfo: {
        chunksUsed: shouldUseChunks,
        chunksCount: shouldUseChunks ? analysis.chunksAnalyzed : 1,
        textExtracted: pdfData.wordCount > 0
      }
    }
    
    return NextResponse.json(
      formatSuccessResponse(responseData, 'PDF analisado com sucesso'),
      { status: 200 }
    )
    
  } catch (error) {
    console.error('❌ Erro geral na análise:', error)
    
    // Tratamento específico de erros
    if (error.message.includes('Azure OpenAI')) {
      return NextResponse.json(
        formatErrorResponse('Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.', 503),
        { status: 503 }
      )
    }
    
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return NextResponse.json(
        formatErrorResponse('Limite de uso atingido. Tente novamente em alguns minutos.', 429),
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      formatErrorResponse('Erro interno do servidor. Tente novamente mais tarde.', 500),
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API de análise de PDF',
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
      'educational - Análise educacional'
    ]
  })
}
