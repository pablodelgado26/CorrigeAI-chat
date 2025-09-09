# 📄 CorrigeAI - Sistema de Análise Inteligente de PDFs

Um sistema avançado de análise e correção automática de documentos PDF usando Inteligência Artificial.

## 🚀 Funcionalidades

- **📖 Análise Inteligente de PDFs**: Extrai texto e analisa documentos automaticamente
- **🎯 Correção Automática de Provas**: Identifica gabaritos e corrige provas de múltipla escolha
- **📊 Relatórios Detalhados**: Gera estatísticas e análises completas
- **🔍 Múltiplos Tipos de Análise**: 
  - Análise Completa
  - Resumo Executivo
  - Análise Acadêmica
  - Análise Empresarial
  - Análise Educacional
  - Correção de Provas

## 🛠️ Tecnologias

- **Frontend**: Next.js 15.5.0, React 18
- **Backend**: Next.js API Routes
- **IA**: Azure OpenAI GPT-4
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Processamento PDF**: pdf-parse com sistema de fallback
- **Autenticação**: bcryptjs, jsonwebtoken
- **Relatórios**: jsPDF

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Banco de dados PostgreSQL
- Conta Azure OpenAI

## ⚙️ Instalação

1. **Clone o repositório:**
```bash
git clone https://github.com/pablodelgado26/Ia-Gemini-chat.git
cd Ia-Gemini-chat
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Banco de Dados
DATABASE_URL="postgresql://usuario:senha@localhost:5432/corrigeai"

# Azure OpenAI
AZURE_OPENAI_API_KEY="sua_api_key"
AZURE_OPENAI_ENDPOINT="https://seu-endpoint.openai.azure.com/"
AZURE_OPENAI_DEPLOYMENT_NAME="o4-mini"
AZURE_OPENAI_API_VERSION="2024-12-01-preview"

# JWT
JWT_SECRET="seu_jwt_secret_muito_seguro"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="seu_nextauth_secret"
```

4. **Configure o banco de dados:**
```bash
npm run db:migrate
npm run db:seed
```

5. **Inicie o servidor:**
```bash
npm run dev
```

Acesse: http://localhost:3000

## 🎯 Como Usar

### Análise Geral de PDFs

1. Acesse `/pdf-analyzer`
2. Faça upload do seu PDF
3. Escolha o tipo de análise desejado
4. Aguarde o processamento
5. Visualize e baixe o relatório

### Correção Automática de Provas

1. **Prepare o PDF:**
   - **Primeira página**: Gabarito oficial com "nome: GABARITO"
   - **Páginas seguintes**: Provas dos alunos

2. **Formato das questões:**
   - Questões numeradas (1, 2, 3...)
   - Alternativas: A, B, C, D, E
   - Marcações: quadrados completamente preenchidos

3. **Processo:**
   - Selecione "Correção de Provas"
   - Faça upload do PDF
   - O sistema irá identificar automaticamente o gabarito
   - Relatório com notas e estatísticas será gerado

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── pdf/
│   │       └── analyze/   # Endpoint de análise PDF
│   ├── pdf-analyzer/      # Página do analisador
│   └── layout.jsx         # Layout principal
├── components/            # Componentes React
│   ├── PDFAnalyzer/      # Componente principal
│   ├── Toast/            # Sistema de notificações
│   └── Loading/          # Componente de carregamento
├── lib/                   # Utilitários e serviços
│   ├── ai/               # Integração com IA
│   ├── pdf/              # Processamento de PDF
│   └── utils/            # Utilitários gerais
└── contexts/             # Contextos React
```

## 🧪 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa linting
- `npm run db:migrate` - Executa migrações do banco
- `npm run db:seed` - Popula banco com dados iniciais
- `npm run db:reset` - Reseta banco de dados

## 🔧 Configurações Avançadas

### Sistema de Fallback PDF

O sistema possui 3 níveis de processamento PDF:

1. **pdf-parse**: Extração padrão robusta
2. **Análise básica**: Parsing manual da estrutura
3. **Conteúdo placeholder**: Demonstração quando falha

### Tipos de Análise

- **comprehensive**: Análise completa e detalhada
- **summary**: Resumo conciso dos pontos principais
- **academic**: Análise com foco acadêmico e científico
- **business**: Análise estratégica empresarial
- **educational**: Análise pedagógica e educacional
- **exam_correction**: Correção automática especializada

## 🚨 Solução de Problemas

### PDF não é processado
- Verifique se o arquivo não está corrompido
- Certifique-se que não está protegido por senha
- Verifique se contém texto selecionável (não apenas imagens)

### Erro de IA
- Verifique as credenciais Azure OpenAI
- Confirme se há quota disponível
- Verifique conectividade com a internet

### Problemas de banco de dados
- Verifique a string de conexão
- Execute `npm run db:migrate`
- Confirme se o PostgreSQL está rodando

## 📊 Métricas e Logs

O sistema possui logs detalhados para debugging:
- ✅ Logs de sucesso
- ⚠️ Warnings
- ❌ Erros críticos
- 🔍 Informações de debug

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para detalhes.

## 👨‍💻 Autor

**Pablo Delgado**
- GitHub: [@pablodelgado26](https://github.com/pablodelgado26)

---

⭐ **Desenvolvido com ❤️ para revolucionar a análise de documentos educacionais**
