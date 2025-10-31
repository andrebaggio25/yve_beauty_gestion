# Setup Master User - Instruções

## Problema
O usuário `andrebaggio@yvebeauty.com` (UUID: `2c689a7d-54ea-4da1-b900-42df04d8a088`) foi criado manualmente no Supabase Auth, mas não tem registro nas tabelas `user_profile` e `user_role`, causando um loading infinito no login.

### Problema Técnico Adicional
A tabela `user_role` tem um trigger de auditoria (`trg_user_role_audit`) que espera uma coluna `id`, mas a tabela usa chave primária composta (`user_profile_id`, `role_id`). O script temporariamente desabilita esse trigger durante a inserção para evitar o erro `record "new" has no field "id"`.

### Problema Crítico de RLS (Row Level Security)
O maior problema identificado: **Deadlock de autenticação causado por RLS**

1. A policy de `user_profile` exige `company_id` no JWT para ler o profile
2. Mas o `company_id` no JWT vem DO `user_profile`
3. Resultado: Loading infinito porque não consegue ler o profile

**Solução:** Criar uma policy que permite ler o próprio profile usando apenas `auth.uid()`, sem precisar de `company_id`.

## Solução

### Passo 1: Corrigir o RLS (CRÍTICO - FAÇA PRIMEIRO)

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Abra o arquivo: `lib/supabase/migrations/fix_user_profile_rls.sql`
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**

Você deverá ver:
```
DROP POLICY
CREATE POLICY
CREATE POLICY
COMMENT
COMMENT
```

### Passo 2: Executar o SQL de Criação do Usuário Master

1. Acesse o Supabase Dashboard
2. Vá para **SQL Editor**
3. Abra o arquivo: `lib/supabase/migrations/create_master_user.sql`
4. Copie todo o conteúdo do arquivo
5. Cole no SQL Editor do Supabase
6. Clique em **Run** (ou pressione Ctrl/Cmd + Enter)

### Passo 2: Verificar o Resultado

Você deverá ver mensagens como:

```
NOTICE: Using existing company with ID: [uuid]
NOTICE: Using existing branch with ID: [uuid]
NOTICE: Created user_profile for user: 2c689a7d-54ea-4da1-b900-42df04d8a088
NOTICE: Created master role with ID: [uuid]
NOTICE: Assigned master role to user
NOTICE: === MASTER USER SETUP COMPLETE ===
NOTICE: User ID: 2c689a7d-54ea-4da1-b900-42df04d8a088
NOTICE: Email: andrebaggio@yvebeauty.com
NOTICE: Company ID: [uuid]
NOTICE: Branch ID: [uuid]
NOTICE: Role: Master (full access)
```

No final, uma query SELECT mostrará os dados do usuário criado.

### Passo 3: Fazer Logout Completo

**IMPORTANTE:** Você precisa fazer logout para limpar o JWT antigo.

1. No navegador, abra o Console (F12)
2. Execute:
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   ```
3. Ou simplesmente abra uma **aba anônima**

### Passo 4: Fazer Login Novamente

1. **Acessar a página de login**: `http://localhost:3000/login`
2. **Fazer login** com:
   - Email: `andrebaggio@yvebeauty.com`
   - Senha: (sua senha)

### Passo 5: Verificar os Logs no Console

Com os logs detalhados que adicionamos, você verá no console do navegador:

```
🔐 [Login] Starting login process...
📧 [Login] Email: andrebaggio@yvebeauty.com
✅ [Login] Sign in successful
👤 [Login] User ID: 2c689a7d-54ea-4da1-b900-42df04d8a088
📧 [Login] User email: andrebaggio@yvebeauty.com
🔄 [Login] Redirecting to dashboard...

🔐 [AuthContext] Starting initial session fetch...
✅ [AuthContext] Session retrieved: User authenticated
👤 [AuthContext] Fetching profile for user: 2c689a7d-54ea-4da1-b900-42df04d8a088
📧 [AuthContext] User email: andrebaggio@yvebeauty.com
✅ [AuthContext] Profile loaded: { id: [uuid], is_master: true, company_id: [uuid], branch_id: [uuid] }
✅ [AuthContext] Initial session fetch complete. Loading: false

✅ [ProtectedRoute] User authenticated, rendering protected content
✅ [ProtectedRoute] Rendering protected content
```

## O Que Foi Feito

### 1. SQL de Criação (`create_master_user.sql`)
- Cria ou usa empresa existente (Yve Beauty LLC)
- Cria ou usa filial existente (Main Office)
- Cria `user_profile` para o UUID especificado
- Cria role "Master" com acesso total
- Atribui a role ao usuário
- Marca o usuário como `is_master = true`

### 2. Logs Detalhados Adicionados
- **Login Page**: Rastreia o processo de login step-by-step
- **AuthContext**: Mostra o fluxo completo de autenticação e busca de profile
- **ProtectedRoute**: Indica quando o usuário está autenticado e pode acessar conteúdo protegido

### 3. Correções no AuthContext
- Agora sempre finaliza o loading, mesmo se o profile não existir
- Trata o erro PGRST116 (no rows) como válido
- Permite que o app funcione sem profile (embora exiba warnings)

## Troubleshooting

### Se ainda ficar em loading infinito:

1. **Verifique os logs no console** - eles dirão exatamente onde está travando
2. **Verifique se o SQL foi executado** - rode esta query no Supabase:
   ```sql
   SELECT * FROM user_profile WHERE auth_user_id = '2c689a7d-54ea-4da1-b900-42df04d8a088';
   ```
3. **Limpe o storage do navegador**:
   - DevTools → Application → Storage → Clear Site Data
4. **Reinicie o servidor Next.js**:
   ```bash
   npm run dev
   ```

### Se o erro persistir:

Envie uma screenshot dos logs do console (com os emojis 🔐✅❌⚠️) para identificarmos exatamente onde está travando.

## Próximos Passos

Após o login funcionar, continuaremos com:

1. ✅ **Invoice Form** - Formulário completo de faturas
2. ✅ **Invoice PDF Generation** - Geração de PDF no padrão internacional
3. 🔄 **Visual Redesign** - Aplicar tema branco em todas as páginas
4. 🔄 **Company Logo Integration** - Logo na navbar, login, favicon
5. 🔄 **Multi-currency Display** - Conversão USD em todos os valores
6. 🔄 **Employee Tax ID Fix** - Suporte PF e PJ
7. 🔄 **Report Exports** - PDF e Excel em todos os relatórios

---

**Data**: Outubro 2025  
**Versão**: 1.5.1  
**Status**: 🔧 Correção de Autenticação

