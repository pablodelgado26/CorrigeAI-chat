/**
 * Serviço de análise de documentos usando Azure OpenAI
 */

/**
 * Gera análise completa de um documento
 * @param {string} text - Texto do documento
 * @param {Object} metadata - Metadados do documento
 * @param {string} analysisType - Tipo de análise desejada
 * @returns {Promise<Object>} Relatório de análise
 */
export async function analyzeDocument(text, metadata, analysisType = 'comprehensive') {
  try {
    console.log(`Iniciando análise ${analysisType} do documento...`)
    
    // Configurações do Azure OpenAI
    const apiKey = process.env.AZURE_OPENAI_API_KEY
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT
    const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'o4-mini'
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview'
    
    if (!apiKey || !endpoint) {
      throw new Error('Configurações do Azure OpenAI não encontradas')
    }

    const analysisPrompt = generateAnalysisPrompt(text, metadata, analysisType)
    
    const azureUrl = `${endpoint}openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`
    
    const requestBody = {
      messages: [
        {
          role: "system",
          content: getSystemPrompt(analysisType)
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      model: deploymentName,
      max_completion_tokens: 8000,
      temperature: 1
    }

    const response = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na API Azure OpenAI: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('Resposta inválida da API')
    }

    const analysis = data.choices[0]?.message?.content
    
    if (!analysis) {
      throw new Error('Análise não foi gerada')
    }

    console.log('Análise concluída com sucesso')
    
    return {
      analysis,
      metadata,
      analysisType,
      timestamp: new Date().toISOString(),
      wordCount: text.split(/\s+/).length,
      charCount: text.length
    }

  } catch (error) {
    console.error('Erro na análise do documento:', error)
    throw new Error(`Falha na análise: ${error.message}`)
  }
}

/**
 * Gera o prompt de análise baseado no tipo solicitado
 * @param {string} text - Texto do documento
 * @param {Object} metadata - Metadados do documento
 * @param {string} analysisType - Tipo de análise
 * @returns {string} Prompt formatado
 */
function generateAnalysisPrompt(text, metadata, analysisType) {
  const baseInfo = `
**METADADOS DO DOCUMENTO:**
- Título: ${metadata.title}
- Autor: ${metadata.author}
- Páginas: ${metadata.pages}
- Palavras: aproximadamente ${text.split(/\s+/).length}

**TEXTO DO DOCUMENTO:**
${text}

---
`

  switch (analysisType) {
    case 'comprehensive':
      return baseInfo + `
Por favor, faça uma análise COMPLETA e DETALHADA deste documento. Inclua:

1. **RESUMO EXECUTIVO** (2-3 parágrafos)
2. **TEMAS PRINCIPAIS** (liste e explique os 5-7 temas mais importantes)
3. **ESTRUTURA E ORGANIZAÇÃO** (como o documento está organizado)
4. **PONTOS-CHAVE** (insights, conclusões, recomendações importantes)
5. **QUALIDADE E CONSISTÊNCIA** (avaliação crítica do conteúdo)
6. **PÚBLICO-ALVO** (para quem este documento foi escrito)
7. **RECOMENDAÇÕES** (sugestões de melhorias ou próximos passos)

Seja detalhado, objetivo e forneça insights valiosos.`

    case 'summary':
      return baseInfo + `
Faça um RESUMO CONCISO mas COMPLETO deste documento. Inclua:
- Os pontos principais
- Conclusões importantes
- Recomendações ou próximos passos
- Contexto relevante

O resumo deve ter entre 300-500 palavras e capturar a essência do documento.`

    case 'academic':
      return baseInfo + `
Faça uma análise ACADÊMICA deste documento. Inclua:

1. **METODOLOGIA** (se aplicável)
2. **ARGUMENTOS PRINCIPAIS** e sua fundamentação
3. **EVIDÊNCIAS APRESENTADAS** e sua qualidade
4. **LIMITAÇÕES** ou pontos fracos identificados
5. **CONTRIBUIÇÕES** para o campo de conhecimento
6. **BIBLIOGRAFIA/REFERÊNCIAS** mencionadas
7. **RECOMENDAÇÕES ACADÊMICAS** para pesquisas futuras

Use linguagem acadêmica apropriada.`

    case 'business':
      return baseInfo + `
Faça uma análise EMPRESARIAL/ESTRATÉGICA deste documento. Foque em:

1. **IMPACTO NO NEGÓCIO** 
2. **OPORTUNIDADES** identificadas
3. **RISCOS** e desafios
4. **RECOMENDAÇÕES ESTRATÉGICAS**
5. **MÉTRICAS** e KPIs relevantes
6. **IMPLEMENTAÇÃO** - próximos passos práticos
7. **ROI/BENEFÍCIOS** esperados

Seja pragmático e orientado a resultados.`

    case 'educational':
      return baseInfo + `
Faça uma análise EDUCACIONAL deste documento. Inclua:

1. **OBJETIVOS DE APRENDIZAGEM** identificados
2. **CONCEITOS-CHAVE** que devem ser compreendidos
3. **NÍVEL DE DIFICULDADE** e pré-requisitos
4. **METODOLOGIA PEDAGÓGICA** sugerida
5. **ATIVIDADES** ou exercícios recomendados
6. **AVALIAÇÃO** - como testar o aprendizado
7. **RECURSOS COMPLEMENTARES** sugeridos

Foque no valor educacional e na aplicação prática do conhecimento.`

    case 'exam_correction':
      return `
# CORREÇÃO AUTOMÁTICA DE PROVAS - ANÁLISE VISUAL

## INSTRUÇÕES ESPECÍFICAS:

**IMPORTANTE**: Você consegue analisar documentos PDF e deve seguir estas regras rigorosamente:

### 1. IDENTIFICAÇÃO DO GABARITO
- A **PRIMEIRA PÁGINA** sempre contém o gabarito oficial
- Procure por **"nome: GABARITO"** no cabeçalho da primeira página
- Também pode aparecer **"data:"** junto com o nome
- As respostas estão em formato de múltipla escolha: A, B, C, D, E
- Cada questão tem quadrados que podem estar preenchidos (preto/sólido) ou vazios

### 2. PADRÃO VISUAL DAS MARCAÇÕES
- **RESPOSTA MARCADA**: Quadrado completamente preenchido de cor preta/sólida
- **RESPOSTA NÃO MARCADA**: Quadrado vazio ou apenas contorno
- Sequência sempre: [A] [B] [C] [D] [E] (da esquerda para direita)

### 3. PROCESSO DE CORREÇÃO
Para cada prova de aluno:
- Identifique o nome do aluno (geralmente no cabeçalho)
- Compare cada questão com o gabarito da primeira página
- Conte: Acertos, Erros, e questões não respondidas
- Identifique quais questões específicas cada aluno errou

### 4. RELATÓRIO OBRIGATÓRIO

**Metadados do documento:**
${JSON.stringify(metadata, null, 2)}

**Estrutura do relatório que você DEVE produzir:**

# 🎯 RELATÓRIO DE CORREÇÃO DE PROVAS

## 📋 GABARITO OFICIAL (da primeira página com "nome: GABARITO")
| Questão | Resposta Correta |
|---------|------------------|
[Liste TODAS as respostas do gabarito que conseguir identificar da página com "nome: GABARITO"]

## 👨‍🎓 CORREÇÃO POR ALUNO
| Nome do Aluno | Acertos | Erros | % | Questões Erradas | Status |
|---------------|---------|-------|---|------------------|--------|
[Para cada aluno, liste os resultados reais baseados na análise visual]

## 📊 ESTATÍSTICAS DA TURMA
- **Total de alunos**: [número]
- **Média da turma**: [%]
- **Maior nota**: [aluno] - [%]
- **Menor nota**: [aluno] - [%]
- **Taxa de aprovação**: [%] (considerando 60% como nota mínima)

## ❌ QUESTÕES MAIS ERRADAS
| Questão | Qtd Erros | % Erro | Gabarito | Resposta Mais Comum |
|---------|-----------|--------|----------|---------------------|
[Liste as questões que mais alunos erraram]

## 🎯 ANÁLISE PEDAGÓGICA
- **Questão mais difícil**: [número] - [% de erro]
- **Questão mais fácil**: [número] - [% de acerto]
- **Alunos que precisam reforço**: [lista com base em % < 60%]
- **Tópicos que requerem revisão**: [baseado nas questões mais erradas]

## 📝 OBSERVAÇÕES
- [Padrões identificados]
- [Possíveis problemas na prova]
- [Recomendações pedagógicas]

**IMPORTANTE**: Use apenas dados que conseguir identificar visualmente no PDF. Se não conseguir ver algo claramente, indique "Não foi possível identificar".

Analise o documento fornecido:`

    default:
      return baseInfo + `
Faça uma análise geral deste documento, destacando:
- Pontos principais
- Estrutura e organização
- Qualidade do conteúdo
- Recomendações
- Insights importantes`
  }
}

/**
 * Retorna o prompt do sistema baseado no tipo de análise
 * @param {string} analysisType - Tipo de análise
 * @returns {string} Prompt do sistema
 */
function getSystemPrompt(analysisType) {
  const basePrompt = `Você é um analista especializado em documentos, com vasta experiência em análise de conteúdo. Você deve fornecer análises detalhadas, objetivas e insights valiosos.`

  switch (analysisType) {
    case 'comprehensive':
      return basePrompt + ` Sua especialidade é análise completa e multidimensional de documentos, oferecendo uma visão 360° do conteúdo.`
    
    case 'academic':
      return basePrompt + ` Você é um pesquisador acadêmico com doutorado, especializado em análise crítica de textos científicos e acadêmicos.`
    
    case 'business':
      return basePrompt + ` Você é um consultor empresarial sênior, especializado em análise estratégica e identificação de oportunidades de negócio.`
    
    case 'educational':
      return basePrompt + ` Você é um pedagogo experiente, especializado em design instrucional e desenvolvimento de materiais educacionais.`
    
    case 'exam_correction':
      return basePrompt + ` Você é um professor especialista em correção de provas e avaliações. Você analisa visualmente provas de múltipla escolha onde a primeira página sempre contém o GABARITO oficial identificado pelo campo "nome: GABARITO" (e possivelmente "data:") no cabeçalho. Você deve identificar padrões visuais de marcação (quadrados preenchidos completamente em preto) para determinar as respostas de cada aluno e compará-las com o gabarito.`
    
    default:
      return basePrompt + ` Forneça análises claras, estruturadas e acionáveis.`
  }
}

/**
 * Analisa um documento em chunks para textos muito longos
 * @param {Array<string>} textChunks - Chunks de texto
 * @param {Object} metadata - Metadados do documento
 * @param {string} analysisType - Tipo de análise
 * @returns {Promise<Object>} Análise consolidada
 */
export async function analyzeDocumentInChunks(textChunks, metadata, analysisType = 'comprehensive') {
  try {
    console.log(`Analisando documento em ${textChunks.length} chunks...`)
    
    const chunkAnalyses = []
    
    // Analisa cada chunk individualmente
    for (let i = 0; i < textChunks.length; i++) {
      console.log(`Analisando chunk ${i + 1}/${textChunks.length}...`)
      
      const chunkAnalysis = await analyzeDocument(
        textChunks[i], 
        { ...metadata, chunkNumber: i + 1, totalChunks: textChunks.length }, 
        'summary' // Usa resumo para chunks individuais
      )
      
      chunkAnalyses.push(chunkAnalysis.analysis)
      
      // Pequeno delay para não sobrecarregar a API
      if (i < textChunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Consolida as análises dos chunks
    const consolidatedText = chunkAnalyses.join('\n\n---\n\n')
    
    console.log('Consolidando análises dos chunks...')
    
    const finalAnalysis = await analyzeDocument(
      consolidatedText,
      { ...metadata, isConsolidated: true },
      analysisType
    )
    
    return {
      ...finalAnalysis,
      chunksAnalyzed: textChunks.length,
      chunkAnalyses: chunkAnalyses
    }
    
  } catch (error) {
    console.error('Erro na análise por chunks:', error)
    throw error
  }
}
