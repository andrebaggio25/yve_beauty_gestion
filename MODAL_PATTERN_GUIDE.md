# Padrão de Modal - Yve Gestão

## ✅ Padrão Correto (Template)

```tsx
{showModal && (
  <div 
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={() => setShowModal(false)}
  >
    <div 
      className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header com botão fechar */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Título do Modal</h2>
        <button
          onClick={() => setShowModal(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <X size={24} />
        </button>
      </div>
      
      {/* Content com scroll */}
      <div className="overflow-y-auto p-6 flex-1">
        {/* Conteúdo aqui */}
      </div>
    </div>
  </div>
)}
```

## 🔑 Características Obrigatórias

1. **Overlay clicável**: `onClick={() => setShowModal(false)}` no div externo
2. **Prevent propagation**: `onClick={(e) => e.stopPropagation()}` no div interno
3. **Padding na overlay**: Classe `p-4` para evitar modal grudado na tela
4. **Scroll interno**: `max-h-[90vh]` + `overflow-y-auto` no content
5. **Botão X**: Sempre no header, com ícone `<X size={24} />`
6. **Fundo branco**: `bg-white` no modal (não dark)
7. **Estrutura flex**: `flex flex-col` para header fixo + content scrollável

## 📦 Import Necessário

```tsx
import { X } from 'lucide-react'
```

## 📋 Arquivos Já Corrigidos

- ✅ `app/(dashboard)/billing/monthly-close/page.tsx`
- ✅ `app/(dashboard)/finance/accounts-payable/page.tsx`
- ✅ `app/(dashboard)/finance/accounts-receivable/page.tsx`

## 📝 Arquivos Pendentes

- app/(dashboard)/settings/tax/page.tsx
- app/(dashboard)/settings/chart-of-accounts/page.tsx
- app/(dashboard)/settings/currencies/page.tsx
- app/(dashboard)/settings/payment-methods/page.tsx
- app/(dashboard)/settings/roles/page.tsx
- app/(dashboard)/settings/users/page.tsx
- app/(dashboard)/settings/branches/page.tsx
- app/(dashboard)/billing/invoices/page.tsx
- app/(dashboard)/billing/contracts/page.tsx
- app/(dashboard)/finance/provisions/page.tsx

