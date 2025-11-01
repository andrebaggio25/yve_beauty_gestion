# API de Atualização de Taxas de Câmbio

## Endpoint

`GET/POST /api/fx-rates/update`

## Descrição

Esta API atualiza as taxas de câmbio EUR-USD e BRL-USD na tabela `fx_rate` do banco de dados. A API busca as taxas atualizadas do serviço externo e salva no banco de dados para uso posterior.

## Funcionalidade

1. Verifica se já existe taxa atualizada para o dia atual
2. Se não existir, busca taxas da API externa (exchangerate-api.com)
3. Salva as taxas EUR-USD e BRL-USD na tabela `fx_rate`
4. Retorna status da operação

## Formato da Resposta

### Sucesso
```json
{
  "success": true,
  "message": "Taxas atualizadas com sucesso",
  "date": "2025-01-15",
  "rates": {
    "EUR": 1.0869,
    "BRL": 0.20
  }
}
```

### Já Atualizado Hoje
```json
{
  "success": true,
  "message": "Taxas já atualizadas hoje",
  "date": "2025-01-15",
  "rates": [...]
}
```

### Erro
```json
{
  "success": false,
  "error": "Mensagem de erro",
  "details": "Detalhes adicionais"
}
```

## Configuração de Cronjob

### Opção 1: Vercel Cron (Se estiver no Vercel)

Adicione ao arquivo `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/fx-rates/update",
      "schedule": "0 13 * * *"
    }
  ]
}
```

Horário: 13:00 UTC = 10:00 BRT (horário de Brasília)

### Opção 2: Serviço Externo (cron-job.org, EasyCron, etc.)

1. Acesse o serviço de cronjob
2. Configure uma nova tarefa
3. URL: `https://seu-dominio.com/api/fx-rates/update`
4. Método: GET ou POST
5. Frequência: Diário às 10:00 (horário de Brasília)
6. Timezone: UTC (13:00 UTC = 10:00 BRT)

### Opção 3: Chamada Manual

Você pode chamar a API manualmente a qualquer momento:

```bash
curl https://seu-dominio.com/api/fx-rates/update
```

## Variáveis de Ambiente

Certifique-se de ter configurado:

```
NEXT_PUBLIC_EXCHANGE_RATE_API_KEY=sua-api-key-opcional
```

Se não configurar, a API usará a chave 'demo' (limitada).

## Estrutura da Tabela fx_rate

A API salva os dados na seguinte estrutura:

- `date`: Data da taxa (YYYY-MM-DD)
- `base`: Moeda de origem (EUR ou BRL)
- `quote`: Moeda de destino (USD)
- `rate`: Taxa de conversão (ex: 1 EUR = 1.0869 USD)
- `provider`: Fonte da taxa ('exchangerate-api.com')

## Notas

- A API verifica se já existe taxa para o dia atual antes de buscar novas taxas
- Se já existir taxa para o dia, retorna as taxas existentes sem fazer nova requisição
- A taxa é calculada como inverso da taxa retornada pela API (já que a API retorna USD como base)

