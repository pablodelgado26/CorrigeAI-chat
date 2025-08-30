# Segurança e Configuração de API

## ⚠️ IMPORTANTE - Não commitar chaves de API

### Configuração Local

1. Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas credenciais reais:
```bash
AZURE_OPENAI_API_KEY=sua_chave_real_aqui
AZURE_OPENAI_ENDPOINT=https://seu-recurso.openai.azure.com
```

### Deployment no Vercel

Configure as variáveis de ambiente no painel do Vercel:
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`

### Backend Python

O backend Python lê automaticamente do arquivo `.env` através das variáveis de ambiente do sistema.

## 🔒 Segurança

- ✅ Arquivo `.env` está no `.gitignore`
- ✅ Chaves removidas do código fonte
- ✅ Variáveis de ambiente são obrigatórias
- ❌ NUNCA commite chaves de API no código

### Se você commitou uma chave por engano:

1. **Revogue a chave imediatamente** no Azure Portal
2. **Gere uma nova chave**
3. **Limpe o histórico do Git** se necessário:
```bash
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch arquivo_com_chave.py' --prune-empty --tag-name-filter cat -- --all
```
