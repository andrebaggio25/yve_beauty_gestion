# Comandos Git - Subir Projeto para GitHub

## Repositório: https://github.com/andrebaggio25/yve_beauty_gestion.git

### Opção 1: Executar Script Automático
```bash
cd "/Users/andrebaggio/Documents/Yve Beauty/Apps/app_yve_gestion"
./git-setup.sh
```

### Opção 2: Executar Comandos Manualmente

Execute os seguintes comandos na ordem:

```bash
# 1. Navegar para o diretório do projeto
cd "/Users/andrebaggio/Documents/Yve Beauty/Apps/app_yve_gestion"

# 2. Inicializar repositório Git
git init

# 3. Adicionar remote origin
git remote add origin https://github.com/andrebaggio25/yve_beauty_gestion.git

# (Se já existir o remote, use este comando ao invés do anterior)
# git remote set-url origin https://github.com/andrebaggio25/yve_beauty_gestion.git

# 4. Adicionar todos os arquivos ao staging
git add .

# 5. Criar commit inicial
git commit -m "Initial commit: Yve Beauty Gestão App"

# 6. Configurar branch main
git branch -M main

# 7. Fazer push para o GitHub
git push -u origin main
```

### Notas Importantes:

- ✅ O arquivo `.env.local` está configurado para ser incluído no Git (ajustado no `.gitignore`)
- ⚠️  Certifique-se de que o arquivo `.env.local` existe antes de fazer o commit
- 🔐 Se suas credenciais são sensíveis, considere usar variáveis de ambiente na VPS ao invés de commitar o `.env.local`

### Para Deploy na VPS:

Após fazer o push, na VPS você pode clonar o repositório:

```bash
git clone https://github.com/andrebaggio25/yve_beauty_gestion.git
cd yve_beauty_gestion
npm install
# O .env.local já estará no repositório
```

