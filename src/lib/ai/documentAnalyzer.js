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
# SISTEMA DE CORREÇÃO AUTOMÁTICA DE PROVAS - ANÁLISE ESPECIALIZADA

## CONTEXTO TÉCNICO:
**Documento analisado**: PDF com texto extraído
**Tipo de estrutura detectada**: ${metadata.textStructure?.type || 'Não detectado'}
**Confiança na detecção**: ${metadata.textStructure?.confidence || 0}%
**Tem gabarito visual**: ${metadata.textStructure?.hasVisualGabarito || false}

## INSTRUÇÕES ESPECÍFICAS PARA GABARITOS VISUAIS:

### 🎯 FORMATO DO GABARITO ESPERADO:
\`\`\`
NOME: GABARITO DATA: 29/08/2025
1
 A
 B
 C
 D
 E
2
 A
 B
 C
 D
 E
[... continua até questão 25]
\`\`\`

### 📋 REGRAS DE INTERPRETAÇÃO:
1. **IDENTIFICAÇÃO DO GABARITO**:
   - Primeira seção com "NOME: GABARITO" ou "GABARITO DATA:"
   - Cada questão numerada (1, 2, 3, ..., 25)
   - Sequência de alternativas A, B, C, D, E abaixo de cada número

2. **INTERPRETAÇÃO VISUAL** (baseada no texto extraído):
   - Quando o PDF é processado, as marcações visuais podem aparecer como:
     * Sequências "A B C D E" onde UMA alternativa pode estar destacada
     * Padrões de espaçamento diferentes
     * Caracteres especiais ou símbolos próximos à resposta correta
     * Linhas com apenas uma letra isolada (indicando resposta marcada)

3. **PROCESSO DE ANÁLISE**:
   - Identifique a seção do gabarito (com "NOME: GABARITO")
   - Para cada questão (1-25), determine qual alternativa está marcada
   - Se não conseguir determinar visualmente, indique "Não identificado"

### 📊 RELATÓRIO OBRIGATÓRIO:

**Metadados do documento:**
${JSON.stringify(metadata, null, 2)}

**TEXTO EXTRAÍDO PARA ANÁLISE:**
${text}

**ESTRUTURA DO RELATÓRIO:**

# 🎯 ANÁLISE DE GABARITO VISUAL

## 📋 1. IDENTIFICAÇÃO DO GABARITO
**Status da detecção**: [✅ Encontrado / ❌ Não encontrado]
**Localização**: [Primeira página / Outra localização]
**Formato identificado**: [Visual com quadrados / Texto simples / Outro]

## � 2. GABARITO EXTRAÍDO
| Questão | Resposta | Confiança | Observações |
|---------|----------|-----------|-------------|
| 1       | [A/B/C/D/E] | [Alta/Média/Baixa] | [Padrão identificado] |
| 2       | [A/B/C/D/E] | [Alta/Média/Baixa] | [Padrão identificado] |
[... para todas as 25 questões]

## � 3. ANÁLISE DE QUALIDADE
- **Total de questões identificadas**: [número]/25
- **Respostas com alta confiança**: [número]
- **Respostas com baixa confiança**: [número]
- **Questões não identificadas**: [lista]

## 🔍 4. PADRÕES VISUAIS DETECTADOS
- **Tipo de marcação identificado**: [Descrição]
- **Consistência do formato**: [Alta/Média/Baixa]
- **Possíveis problemas**: [Lista de inconsistências]

## ⚠️ 5. LIMITAÇÕES E OBSERVAÇÕES
- **Qualidade da extração de texto**: [Boa/Regular/Ruim]
- **Elementos visuais perdidos**: [Descrição]
- **Recomendações de melhoria**: [Sugestões]

## 🎯 6. RESUMO EXECUTIVO
- **Gabarito utilizável**: [✅ Sim / ❌ Não]
- **Confiabilidade geral**: [Alta/Média/Baixa]
- **Próximos passos recomendados**: [Orientações]

---

**IMPORTANTE**: 
- Use APENAS informações que conseguir identificar no texto extraído
- Se algo não estiver claro, indique "Não foi possível identificar"
- Seja específico sobre os padrões visuais que conseguiu detectar
- Foque na extração precisa do gabarito para correção posterior

Proceda com a análise do documento fornecido:`

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
