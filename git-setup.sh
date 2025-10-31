#!/bin/bash

# Script para configurar e fazer push do projeto para o GitHub
# Repositório: https://github.com/andrebaggio25/yve_beauty_gestion.git

echo "🚀 Iniciando configuração do Git..."

# 1. Inicializar repositório Git (se ainda não estiver inicializado)
echo "📦 Inicializando repositório Git..."
git init

# 2. Adicionar remote origin
echo "🔗 Configurando remote origin..."
git remote add origin https://github.com/andrebaggio25/yve_beauty_gestion.git

# Verificar se já existe um remote (caso o script seja executado novamente)
if git remote get-url origin &>/dev/null; then
    echo "⚠️  Remote origin já existe. Atualizando..."
    git remote set-url origin https://github.com/andrebaggio25/yve_beauty_gestion.git
fi

# 3. Adicionar todos os arquivos ao staging
echo "➕ Adicionando arquivos ao staging..."
git add .

# 4. Fazer commit inicial
echo "💾 Criando commit inicial..."
git commit -m "Initial commit: Yve Beauty Gestão App"

# 5. Verificar branch atual e criar/alternar para main se necessário
echo "🌿 Configurando branch main..."
git branch -M main

# 6. Fazer push para o repositório remoto
echo "📤 Fazendo push para o GitHub..."
git push -u origin main

echo "✅ Concluído! Projeto enviado para o GitHub."
echo "🔗 Repositório: https://github.com/andrebaggio25/yve_beauty_gestion.git"

