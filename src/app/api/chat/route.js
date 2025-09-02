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
    'crie uma imagem', 'crie a imagem', 'criar imagem', 'gerar imagem', 'gere uma imagem',
    'faça uma imagem', 'faça a imagem', 'desenhe', 'ilustre', 'create image', 'generate image',
    'crie um desenho', 'faça um desenho', 'gere um desenho'
  ]
  
  const lowerMessage = message.toLowerCase()
  return imageKeywords.some(keyword => lowerMessage.includes(keyword))
}

// Função para gerar imagem usando Pollinations AI (gratuita)
async function generateImage(prompt) {
  try {
    console.log('=== INICIANDO GERAÇÃO DE IMAGEM ===')
    console.log('Prompt original:', prompt)
    
    // Traduzir e otimizar prompt
    let optimizedPrompt = prompt
      .replace(/crie uma imagem de|crie a imagem de|criar imagem de|gerar imagem de|gere uma imagem de|faça uma imagem de|faça a imagem de|desenhe|ilustre|crie um desenho de|faça um desenho de|gere um desenho de/gi, '')
      .trim()
    
    console.log('Prompt após limpeza:', optimizedPrompt)
    
    // Se o prompt estiver vazio, usar um padrão
    if (!optimizedPrompt) {
      optimizedPrompt = "beautiful landscape"
      console.log('Prompt vazio, usando padrão:', optimizedPrompt)
    }
    
    // URL da API Pollinations (gratuita)
    const externalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(optimizedPrompt)}?width=512&height=512&seed=${Date.now()}`
    
    console.log('URL da imagem externa:', externalImageUrl)
    
    return {
      success: true,
      imageUrl: externalImageUrl,
      prompt: optimizedPrompt
    }
    
  } catch (error) {
    console.error('ERRO GERAL na geração de imagem:', error)
    return {
      success: false,
      error: error.message || 'Falha na geração da imagem. Tente novamente.'
    }
  }
}

export async function POST(request) {
  try {
    const { message, image, conversationHistory } = await request.json()
    
    console.log('=== PROCESSANDO MENSAGEM ===')
    console.log('Mensagem recebida:', message)
    console.log('Teste de geração de imagem:', isImageGenerationRequest(message))
    
    // Verificar se é uma solicitação de geração de imagem
    if (isImageGenerationRequest(message)) {
      console.log('✅ Detectada solicitação de geração de imagem')
      
      const imageResult = await generateImage(message)
      
      if (imageResult.success) {
        const responseData = {
          response: `🎨 **Imagem Gerada com Sucesso!**\n\n**Prompt usado:** ${imageResult.prompt}\n\n*Imagem criada usando Pollinations AI - uma ferramenta gratuita de geração de imagens por IA.*`,
          imageUrl: imageResult.imageUrl,
          isImageGeneration: true
        }
        
        return NextResponse.json(responseData)
      } else {
        return NextResponse.json({
          response: `❌ **Erro ao gerar imagem**\n\nNão foi possível criar a imagem solicitada. Erro: ${imageResult.error}\n\nTente reformular sua solicitação ou tente novamente em alguns minutos.`,
          isImageGeneration: true
        })
      }
    }
    
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
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'o4-mini'
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview'
    
    if (!apiKey || !endpoint) {
      console.error('Configurações do Azure OpenAI não encontradas')
      return NextResponse.json(
        { error: 'Serviço temporariamente indisponível. Tente novamente mais tarde.' },
        { status: 503 }
      )
    }

    // Preparar mensagens para Azure OpenAI
    let messages = [
      {
        role: "system",
        content: "Você é um assistente inteligente e útil. Responda de forma clara, precisa e educativa. Se uma imagem for enviada, analise-a detalhadamente e forneça informações relevantes."
      }
    ]

    // Adicionar histórico da conversa se existir
    if (conversationHistory && Array.isArray(conversationHistory)) {
      messages.push(...conversationHistory.slice(-10)) // Limitar a 10 mensagens recentes
    }

    // Preparar a mensagem atual
    let currentMessage = {
      role: "user",
      content: message
    }

    // Se há uma imagem, incluir na mensagem
    if (image) {
      try {
        console.log('Processando imagem para análise no Azure OpenAI...')
        
        currentMessage = {
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

    messages.push(currentMessage)

    console.log('Enviando requisição para Azure OpenAI...')
    console.log('Deployment:', deploymentName)
    console.log('Tem imagem:', !!image)
    console.log('Tamanho da mensagem:', message.length)
    
    // Configurar a requisição para Azure OpenAI usando fetch
    const azureUrl = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`
    
    const requestBody = {
      messages: messages,
      model: deploymentName, // Baseado na documentação Azure
      max_completion_tokens: 4000,
      temperature: 1 // o4-mini só aceita temperature = 1 e não aceita top_p
    }

    // Fazer a requisição para o Azure OpenAI
    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    })

    console.log('Status da resposta:', response.status)
    
    // Log detalhado do erro para debugging
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Erro na API do Azure OpenAI (${response.status}):`, errorText)
      
      let errorMessage = 'Desculpe, não consegui processar sua solicitação no momento. Tente novamente.'
      
      if (response.status === 429) {
        errorMessage = 'Muitas solicitações foram feitas. Aguarde alguns minutos e tente novamente.'
      } else if (response.status >= 500) {
        errorMessage = 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.'
      } else if (response.status === 401) {
        errorMessage = 'Erro de autenticação. Verifique as configurações da API.'
      } else if (response.status === 404) {
        errorMessage = `Deployment "${deploymentName}" não encontrado. Verifique a configuração do Azure OpenAI.`
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Resposta recebida do Azure OpenAI')
    
    // Verificar se a resposta tem o formato esperado
    if (!data.choices || data.choices.length === 0) {
      console.error('Resposta inválida do Azure OpenAI:', data)
      return NextResponse.json(
        { error: 'Não foi possível gerar uma resposta. Tente reformular sua pergunta.' },
        { status: 500 }
      )
    }
    
    // Extrair a resposta
    const aiResponse = data.choices[0]?.message?.content
    
    if (!aiResponse) {
      console.error('Texto de resposta não encontrado:', data.choices[0])
      return NextResponse.json(
        { error: 'Não foi possível gerar uma resposta. Tente novamente.' },
        { status: 500 }
      )
    }

    const responseData = { response: aiResponse }
    
    // Cache da resposta (com TTL de 1 hora)
    responseCache.set(requestHash, responseData)
    setTimeout(() => responseCache.delete(requestHash), 60 * 60 * 1000)

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Erro na API do chat:', error)
    
    // Verificar tipos específicos de erro
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ENETUNREACH') {
      return NextResponse.json(
        { error: 'Serviço de IA temporariamente indisponível. Verifique sua conexão e tente novamente.' },
        { status: 503 }
      )
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'Erro de conectividade. Verifique sua internet e tente novamente.' },
        { status: 503 }
      )
    }
    
    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Muitas solicitações foram feitas. Aguarde alguns minutos e tente novamente.' },
        { status: 429 }
      )
    }
    
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Erro de autenticação. Verifique as configurações da API.' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erro interno. Tente novamente em alguns instantes.' },
      { status: 500 }
    )
  }
}
