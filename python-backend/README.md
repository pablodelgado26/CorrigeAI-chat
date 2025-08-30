# CorrigeAI Python Backend

## Visão Geral
Backend Python robusto para análise inteligente de provas e documentos acadêmicos usando bibliotecas especializadas.

## Funcionalidades

### 📄 Processamento de PDFs
- **PyMuPDF (fitz)**: Extração rápida de texto e metadados
- **pdfplumber**: Análise estruturada e extração de tabelas
- Suporte a documentos complexos e multi-página

### 🖼️ Processamento de Imagens
- **Pillow**: Manipulação e otimização de imagens
- **OpenCV**: Detecção de regiões de texto e preprocessamento
- **pytesseract**: OCR avançado com múltiplos idiomas

### 📊 Geração de Relatórios
- **ReportLab**: Criação de PDFs profissionais
- **matplotlib**: Gráficos e visualizações
- Templates personalizados e estilos

### 🤖 Inteligência Artificial
- **Azure OpenAI**: Análise inteligente e insights pedagógicos
- Correção automática de texto OCR
- Recomendações personalizadas

## Instalação

```bash
cd python-backend
pip install -r requirements.txt
```

## Configuração

Crie arquivo `.env`:
```
AZURE_OPENAI_API_KEY=sua_chave_aqui
AZURE_OPENAI_ENDPOINT=https://seu-endpoint.openai.azure.com/
```

## Executar

```bash
python main.py
```

O servidor estará disponível em `http://localhost:8000`

## Endpoints

### POST /analyze-exams
Analisa múltiplas provas e gera relatório completo
- Upload de imagens/PDFs
- Identificação automática de gabarito
- Correção de provas dos alunos
- Relatório PDF profissional

### POST /extract-text-from-image
Extrai texto de imagem usando OCR avançado
- Preprocessamento inteligente
- Score de confiança
- Múltiplos formatos suportados

### POST /create-pdf-report
Cria relatório PDF personalizado
- Templates profissionais
- Suporte a markdown
- Gráficos e tabelas

### GET /download-report/{filename}
Download de relatórios gerados

## Melhorias Implementadas

1. **OCR Robusto**: 
   - Preprocessamento de imagens
   - Múltiplos padrões de detecção
   - Correção automática com IA

2. **PDFs Profissionais**:
   - Estilos personalizados
   - Tabelas formatadas
   - Gráficos integrados

3. **Análise Inteligente**:
   - Insights pedagógicos
   - Recomendações personalizadas
   - Estatísticas avançadas

4. **Performance**:
   - Cache de resultados
   - Processamento paralelo
   - Otimização de memória
