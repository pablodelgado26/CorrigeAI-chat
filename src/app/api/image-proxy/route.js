import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')
    
    console.log('=== PROXY DE IMAGEM INICIADO ===')
    console.log('URL solicitada:', imageUrl)
    
    if (!imageUrl) {
      console.error('URL da imagem não fornecida')
      return NextResponse.json({ error: 'URL da imagem é obrigatória' }, { status: 400 })
    }
    
    // Buscar a imagem
    console.log('Fazendo fetch da imagem...')
    const response = await fetch(imageUrl, {
      timeout: 15000 // 15 segundos de timeout
    })
    
    console.log('Status da resposta:', response.status)
    console.log('Content-Type:', response.headers.get('content-type'))
    
    if (!response.ok) {
      console.error(`Erro ao buscar imagem: ${response.status} ${response.statusText}`)
      return NextResponse.json({ 
        error: `Erro ao buscar imagem: ${response.status}` 
      }, { status: response.status })
    }
    
    // Obter o buffer da imagem
    console.log('Convertendo para buffer...')
    const imageBuffer = await response.arrayBuffer()
    console.log('Tamanho do buffer:', imageBuffer.byteLength)
    
    console.log('=== PROXY DE IMAGEM CONCLUÍDO ===')
    
    // Retornar a imagem com headers apropriados
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
    
  } catch (error) {
    console.error('ERRO no proxy de imagem:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}
