#!/bin/bash

# Script para iniciar o servidor Python do CorrigeAI
echo "🚀 Iniciando CorrigeAI Backend..."

# Navegar para o diretório correto
cd /home/jrdelgado26/Documentos/IA/gemini-google/python-backend

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado!"
    echo "📝 Copie o .env.example e configure suas chaves de API"
    exit 1
fi

# Carregar variáveis de ambiente
source .env

# Configurar Python
export PYTHONDONTWRITEBYTECODE=1
export PYTHONPATH="/home/jrdelgado26/Documentos/IA/gemini-google/python-backend/venv/lib/python3.13/site-packages"

echo "✅ Variáveis de ambiente carregadas"
echo "✅ PYTHONPATH configurado"  
echo "🌐 Servidor disponível em: http://localhost:8000"

# Executar servidor
/home/jrdelgado26/Documentos/IA/gemini-google/python-backend/venv/bin/python main.py
