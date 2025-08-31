import { NextResponse } from 'next/server'

// Cache simples para respostas (em produção, use Redis ou similar)
const responseCache = new Map()

// Função para gerar hash da requisição
function generateRequestHash(message, imageSize) {
  return Buffer.from(message + (imageSize || '')).toString('base64').slice(0, 32)
}

// Função para detectar solicitações de geração de imagem
function isImageGenerationRequest(message) {
  const imageKeywords = [
    'crie uma imagem', 'criar imagem', 'gerar imagem', 'gere uma imagem',
    'faça uma imagem', 'desenhe', 'ilustre', 'create image', 'generate image'
  ]
  
  const lowerMessage = message.toLowerCase()
  return imageKeywords.some(keyword => lowerMessage.includes(keyword))
}

// Função para gerar imagem usando Pollinations AI (gratuita)
async function generateImage(prompt) {
  try {
    // Traduzir e otimizar prompt
    let optimizedPrompt = prompt
      .replace(/crie uma imagem de|criar imagem de|gerar imagem de|gere uma imagem de|faça uma imagem de|desenhe|ilustre/gi, '')
      .trim()
    
    // Se o prompt estiver vazio, usar um padrão
    if (!optimizedPrompt) {
      optimizedPrompt = "beautiful landscape"
    }
    
    // Traduzir palavras básicas do português para inglês
    const translations = {
      'pôr do sol': 'sunset',
      'por do sol': 'sunset', 
      'nascer do sol': 'sunrise',
      'paisagem': 'landscape',
      'gato': 'cat',
      'cachorro': 'dog',
      'floresta': 'forest',
      'montanha': 'mountain',
      'oceano': 'ocean',
      'praia': 'beach',
      'cidade': 'city',
      'futurista': 'futuristic',
      'lindo': 'beautiful',
      'bonito': 'beautiful'
    }
    
    Object.entries(translations).forEach(([pt, en]) => {
      optimizedPrompt = optimizedPrompt.replace(new RegExp(pt, 'gi'), en)
    })
    
    // URL da API Pollinations (gratuita) - usando parâmetros mais estáveis
    const externalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(optimizedPrompt)}?width=512&height=512`
    
    console.log('Gerando imagem com URL:', externalImageUrl)
    
    // Validar se a URL está acessível
    try {
      const testResponse = await fetch(externalImageUrl, { method: 'HEAD' })
      if (!testResponse.ok) {
        throw new Error(`Erro ${testResponse.status} ao gerar imagem`)
      }
    } catch (error) {
      console.error('Erro ao validar URL da imagem:', error)
      return {
        success: false,
        error: 'Falha na geração da imagem. Tente novamente.'
      }
    }
    
    // Usar proxy interno para evitar problemas de CORS
    const imageUrl = `/api/image-proxy?url=${encodeURIComponent(externalImageUrl)}`
    
    return {
      success: true,
      imageUrl: imageUrl,
      prompt: optimizedPrompt
    }
    
  } catch (error) {
    console.error('Erro ao gerar imagem:', error)
    return {
      success: false,
      error: error.message
    }
  }
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
    
    // Verificar se é uma solicitação de geração de imagem
    if (isImageGenerationRequest(message)) {
      console.log('Detectada solicitação de geração de imagem')
      
      const imageResult = await generateImage(message)
      
      if (imageResult.success) {
        const responseData = {
          response: `🎨 **Imagem Gerada com Sucesso!**\n\n**Prompt usado:** ${imageResult.prompt}\n\n*Imagem criada usando Pollinations AI - uma ferramenta gratuita de geração de imagens por IA.*`,
          imageUrl: imageResult.imageUrl,
          isImageGeneration: true
        }
        
        // Cache da resposta
        const imageSize = image ? image.length : null
        const requestHash = generateRequestHash(message, imageSize)
        responseCache.set(requestHash, responseData)
        setTimeout(() => responseCache.delete(requestHash), 60 * 60 * 1000) // 1 hora
        
        return NextResponse.json(responseData)
      } else {
        return NextResponse.json({
          response: `❌ **Erro ao gerar imagem**\n\nNão foi possível criar a imagem solicitada. Erro: ${imageResult.error}\n\nTente reformular sua solicitação ou tente novamente em alguns minutos.`,
          isImageGeneration: true
        })
      }
    }
    
    // Gerar hash para cache (para outras requisições)
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
    const deploymentName = 'o4-mini' // Deployment correto no Azure OpenAI
    const apiVersion = '2025-01-01-preview'
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
      max_completion_tokens: 4000
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
