import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { message, image } = await request.json()
    
    // Verificar se a API key está configurada
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('API key do Gemini não configurada')
      return NextResponse.json(
        { error: 'Serviço temporariamente indisponível. Tente novamente mais tarde.' },
        { status: 503 }
      )
    }

    // Configurar a requisição para a API do Gemini
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`
    
    let requestBody = {
      contents: [{
        parts: [{ text: message }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    }

    // Se há uma imagem, incluir na requisição
    if (image) {
      try {
        // Remove o prefixo data:image/...;base64,
        const base64Data = image.split(',')[1]
        const mimeType = image.split(';')[0].split(':')[1]
        
        requestBody.contents[0].parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        })
      } catch (imageError) {
        console.error('Erro ao processar imagem:', imageError)
        return NextResponse.json(
          { error: 'Erro ao processar a imagem enviada' },
          { status: 400 }
        )
      }
    }

    console.log('Enviando requisição para Gemini...')
    
    // Fazer a requisição para o Gemini
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    // Log detalhado do erro para debugging
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro na API do Gemini (${response.status}):`, errorText)
      
      let errorMessage = 'Desculpe, não consegui processar sua solicitação no momento. Tente novamente.'
      
      if (response.status === 429) {
        errorMessage = 'Muitas solicitações foram feitas. Aguarde um momento e tente novamente.'
      } else if (response.status >= 500) {
        errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('Resposta recebida do Gemini')
    
    // Verificar se a resposta tem o formato esperado
    if (!data.candidates || data.candidates.length === 0) {
      console.error('Resposta inválida do Gemini:', data)
      return NextResponse.json(
        { error: 'Não foi possível gerar uma resposta. Tente reformular sua pergunta.' },
        { status: 500 }
      )
    }
    
    // Extrair a resposta do Gemini
    const geminiResponse = data.candidates[0]?.content?.parts?.[0]?.text
    
    if (!geminiResponse) {
      console.error('Texto de resposta não encontrado:', data.candidates[0])
      return NextResponse.json(
        { error: 'Não foi possível gerar uma resposta. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ response: geminiResponse })

  } catch (error) {
    console.error('Erro na API do chat:', error)
    
    // Verificar se é um erro de rede
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return NextResponse.json(
        { error: 'Erro de conexão. Verifique sua internet e tente novamente.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente.' },
      { status: 500 }
    )
  }
}
