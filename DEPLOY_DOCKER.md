# Deploy com Docker - Yve Gestión

## 📦 Pré-requisitos

- Docker instalado na VPS
- Docker Compose instalado (opcional, mas recomendado)
- Acesso SSH à VPS
- Domínio configurado (opcional, mas recomendado)

## 🚀 Passo a Passo

### 1. Preparar o Projeto

Certifique-se de ter todas as variáveis de ambiente necessárias. Crie um arquivo `.env.production` na raiz:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key

# Exchange Rate API (opcional)
NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=sua-api-key

# App Config
NEXT_PUBLIC_APP_NAME=Yve Gestión
NEXT_PUBLIC_DEFAULT_LOCALE=pt-BR
```

### 2. Subir para a VPS

#### Opção A: Via Git (Recomendado)

```bash
# Na VPS
cd /opt  # ou onde preferir
git clone seu-repositorio.git yve-gestion
cd yve-gestion
```

#### Opção B: Via SCP/SFTP

```bash
# No seu computador local
scp -r . usuario@vps-ip:/opt/yve-gestion
```

### 3. Configurar Variáveis de Ambiente na VPS

```bash
cd /opt/yve-gestion
cp .env.production .env.local
nano .env.local  # Edite com suas variáveis
```

### 4. Construir e Iniciar Container

#### Com Docker Compose (Recomendado)

```bash
# Construir imagem
docker-compose build

# Iniciar container
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar container
docker-compose down
```

#### Sem Docker Compose

```bash
# Construir imagem
docker build -t yve-gestion:latest .

# Rodar container
docker run -d \
  --name yve-gestion-app \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.local \
  yve-gestion:latest

# Ver logs
docker logs -f yve-gestion-app

# Parar container
docker stop yve-gestion-app
docker rm yve-gestion-app
```

### 5. Configurar Nginx como Reverse Proxy (Recomendado)

Crie `/etc/nginx/sites-available/yve-gestion`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/yve-gestion /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Configurar SSL (Certbot/Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 7. Atualizar Migration 21 com URL da Aplicação

No Supabase, configure a URL da API:

**Settings → Database → Custom Config → Add:**
- Key: `app.fx_rates_api_url`
- Value: `https://seu-dominio.com/api/fx-rates/update`

Ou edite a migration 21 antes de aplicar.

## 🔄 Atualizações

### Atualizar Aplicação

```bash
cd /opt/yve-gestion

# Se usar Git
git pull origin main

# Rebuild e restart
docker-compose build
docker-compose up -d

# Ou sem compose
docker build -t yve-gestion:latest .
docker stop yve-gestion-app
docker rm yve-gestion-app
docker run -d --name yve-gestion-app --restart unless-stopped -p 3000:3000 --env-file .env.local yve-gestion:latest
```

## 📊 Monitoramento

### Ver logs

```bash
# Com docker-compose
docker-compose logs -f

# Sem docker-compose
docker logs -f yve-gestion-app
```

### Verificar se está rodando

```bash
docker ps | grep yve-gestion
curl http://localhost:3000
```

### Recursos do container

```bash
docker stats yve-gestion-app
```

## 🛠️ Troubleshooting

### Container não inicia

```bash
# Ver logs de erro
docker logs yve-gestion-app

# Verificar variáveis de ambiente
docker exec yve-gestion-app env
```

### Porta já em uso

```bash
# Ver o que está usando a porta
sudo lsof -i :3000

# Ou mudar porta no docker-compose.yml
ports:
  - "3001:3000"  # Mapear porta externa 3001 para interna 3000
```

### Problemas de build

```bash
# Limpar cache e rebuild
docker-compose build --no-cache
```

### Rebuild completo

```bash
docker-compose down
docker system prune -a  # Cuidado: remove todas as imagens não usadas
docker-compose build --no-cache
docker-compose up -d
```

## 🔒 Segurança

1. **Não commitar `.env.local`** - já está no `.gitignore`
2. **Usar HTTPS** - configure SSL com Certbot
3. **Firewall** - bloqueie portas desnecessárias (mantenha apenas 80/443)
4. **Atualizar Docker** regularmente
5. **Backup** do `.env.local` em local seguro

## 📝 Notas Importantes

- O Dockerfile usa multi-stage build para otimizar tamanho da imagem
- A aplicação roda na porta 3000 dentro do container
- Use Nginx como reverse proxy para melhor performance
- Configure SSL/HTTPS para produção
- Monitore logs regularmente

## 🎯 Próximos Passos

1. ✅ Subir aplicação na VPS
2. ✅ Configurar domínio e SSL
3. ✅ Aplicar migration 21 no Supabase
4. ✅ Configurar `app.fx_rates_api_url` no Supabase
5. ✅ Testar cronjob de atualização de taxas

