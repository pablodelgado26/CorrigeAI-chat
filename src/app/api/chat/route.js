import { NextResponse } from 'next/server'

// Cache simples para respostas (em produção, use Redis ou similar)
const responseCache = new Map()

// Função para gerar hash da requisição
function generateRequestHash(message, imageSize) {
  return Buffer.from(message + (imageSize || '')).toString('base64').slice(0, 32)
}

// Função para retry com backoff exponencial
async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options)
      
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 1000 // 2s, 4s, 8s
        console.log(`Rate limit atingido. Tentativa ${attempt}/${maxRetries}. Aguardando ${waitTime}ms...`)
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      }
      
      return response
    } catch (error) {
      if (attempt === maxRetries) throw error
      
      const waitTime = Math.pow(2, attempt) * 1000
      console.log(`Erro na tentativa ${attempt}/${maxRetries}. Aguardando ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
}

export async function POST(request) {
  try {
    const { message, image } = await request.json()
    
    // Gerar hash para cache
    const imageSize = image ? image.length : null
    const requestHash = generateRequestHash(message, imageSize)
    
    // Verificar cache primeiro
    if (responseCache.has(requestHash)) {
      console.log('Resposta encontrada no cache')
      return NextResponse.json(responseCache.get(requestHash))
    }
    
    // Verificar se as configurações do Azure OpenAI estão definidas
    const apiKey = process.env.AZURE_OPENAI_API_KEY
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT
    
    if (!apiKey || !endpoint) {
      console.error('Configurações do Azure OpenAI não encontradas')
      return NextResponse.json(
        { error: 'Serviço temporariamente indisponível. Tente novamente mais tarde.' },
        { status: 503 }
      )
    }

    // Configurar a requisição para Azure OpenAI
    const deploymentName = 'gpt-4o' // Deployment correto configurado no Azure
    const apiVersion = '2024-02-15-preview'
    const azureUrl = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`
    
    // Preparar mensagens para Azure OpenAI
    let messages = [
      {
        role: "system",
        content: "Você é um assistente especializado em educação, capaz de analisar imagens de provas e documentos acadêmicos. Sempre forneça análises precisas baseadas no que conseguir ver nas imagens."
      },
      {
        role: "user",
        content: message
      }
    ]

    // Se há uma imagem, incluir na mensagem
    if (image) {
      try {
        console.log('Processando imagem para análise no Azure OpenAI...')
        
        messages[1] = {
          role: "user",
          content: [
            {
              type: "text",
              text: message
            },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "high"
              }
            }
          ]
        }
        
        console.log('Imagem adicionada à requisição do Azure OpenAI')
      } catch (imageError) {
        console.error('Erro ao processar imagem:', imageError)
        return NextResponse.json(
          { error: 'Erro ao processar a imagem enviada' },
          { status: 400 }
        )
      }
    }

    let requestBody = {
      messages: messages,
      max_tokens: 4000,
      temperature: 0.3,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    }

    console.log('Enviando requisição para Azure OpenAI...')
    console.log('Endpoint:', azureUrl)
    console.log('Tem imagem:', !!image)
    console.log('Tamanho da mensagem:', message.length)
    
    // Fazer a requisição para o Azure OpenAI com retry
    const response = await fetchWithRetry(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    })

    // Log detalhado do erro para debugging
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro na API do Azure OpenAI (${response.status}):`, errorText)
      
      let errorMessage = 'Desculpe, não consegui processar sua solicitação no momento. Tente novamente.'
      
      if (response.status === 429) {
        errorMessage = 'Muitas solicitações foram feitas. Aguarde alguns minutos e tente novamente. O limite será renovado em breve.'
      } else if (response.status >= 500) {
        errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
      } else if (response.status === 401) {
        errorMessage = 'Erro de autenticação. Verifique as configurações da API.'
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Resposta recebida do Azure OpenAI')
    
    // Verificar se a resposta tem o formato esperado do OpenAI
    if (!data.choices || data.choices.length === 0) {
      console.error('Resposta inválida do Azure OpenAI:', data)
      return NextResponse.json(
        { error: 'Não foi possível gerar uma resposta. Tente reformular sua pergunta.' },
        { status: 500 }
      )
    }
    
    // Extrair a resposta do OpenAI
    const openaiResponse = data.choices[0]?.message?.content
    
    if (!openaiResponse) {
      console.error('Texto de resposta não encontrado:', data.choices[0])
      return NextResponse.json(
        { error: 'Não foi possível gerar uma resposta. Tente novamente.' },
        { status: 500 }
      )
    }

    const responseData = { response: openaiResponse }
    
    // Cache da resposta (com TTL de 1 hora)
    responseCache.set(requestHash, responseData)
    setTimeout(() => responseCache.delete(requestHash), 60 * 60 * 1000)

    return NextResponse.json(responseData)

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
