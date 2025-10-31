#!/bin/bash

# Script para corrigir botões de exportar em todos os relatórios

cd "/Users/andrebaggio/Documents/Yve Beauty/Apps/app_yve_gestion"

files=(
  "app/(dashboard)/reports/aging/page.tsx"
  "app/(dashboard)/reports/pnl/page.tsx"
  "app/(dashboard)/reports/cashflow/page.tsx"
  "app/(dashboard)/reports/balance/page.tsx"
  "app/(dashboard)/reports/ledger/page.tsx"
)

echo "🔧 Corrigindo botões de exportar..."

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ Processando: $file"
    
    # Fix export buttons with bg-primary
    sed -i '' 's/bg-primary hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed text-white/bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white disabled:text-gray-500/g' "$file"
    
    # Fix buttons with wrong text color (black bg + gray-900 text)
    sed -i '' 's/bg-black hover:bg-gray-800 text-gray-900/bg-black hover:bg-gray-800 text-white/g' "$file"
    
  else
    echo "  ✗ Arquivo não encontrado: $file"
  fi
done

echo ""
echo "✅ Botões de exportar corrigidos!"

