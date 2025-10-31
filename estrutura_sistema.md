🧠 PROMPT INICIAL — SISTEMA Yve gestion
🎯 Visão Geral

Desenvolver um sistema interno de gestão financeira e administrativa, otimizado para mobile, utilizando:

Frontend: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui

Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions)

Foco: Contas a pagar, contas a receber, faturamento, clientes, funcionários e configurações gerais.

Fase 1: gestão financeira e emissão de faturas.

Futuro: expansão para gestão completa de processos, serviços e automações.

A empresa matriz é americana, com faturamento global (EUA, UE, Brasil, etc.), e contas multimoedas.
O sistema deve suportar moedas múltiplas por filial, conversão automática para USD apenas para fins contábeis internos, e interface multilíngue (pt-BR, es-ES e en-US).

🧩 Módulos Principais (MVP)
1. Financeiro

Funcionalidades:

Contas a Pagar e Contas a Receber (AP/AR)

Provisões e recorrências (mensais e trimestrais)

Pagamentos e recebimentos com anexos (PDF, comprovantes)

Fluxo de Caixa consolidado (por moeda e em USD estimado)

Relatórios contábeis:

DRE (P&L)

Balanço Patrimonial

Fluxo de Caixa (indireto)

Aging (Contas vencidas)

Razão (Ledger)

Regras principais:

Regime de competência.

Cada transação (AP/AR/Pagamento/Recebimento) grava fx_rate_used, usd_equiv_amount e fx_fee_amount (se houver).

Conversão para USD é apenas interna (nunca mostrada ao cliente).

Rotina diária marca registros em atraso automaticamente.

Possibilidade de parcelas e exclusão em série (“Excluir futuras não pagas”).

Contas multimoedas (ex.: Revolut USD, EUR, BRL).

2. Faturamento

Funcionalidades:

Contratos (únicos ou recorrentes)

Emissão manual de faturas (após fechamento do mês)

Modelos de faturamento: único, recorrente (mensal, trimestral), por competência ou vigência

Numeração contínua INV-{ANO}{SEQ} (sem reinício anual)

Emissão em qualquer moeda

Envio por e-mail (linguagem do contrato)

Templates configuráveis e traduzíveis

Regras principais:

Contrato define moeda e idioma.

Fatura é gerada e armazenada na moeda do contrato.

Conversão para USD ocorre apenas internamente (para relatórios e contabilidade).

Sem impostos fora dos EUA (UE e BR isentos no MVP).

Sales tax apenas quando cliente e filial forem dos EUA.

Status: rascunho | emitida | enviada | parcial | paga | cancelada | em atraso.

Sem notas de crédito no MVP.

Templates de fatura e e-mail com placeholders multilíngues ({{company.name}}, {{invoice.total}}, etc.).

3. Clientes

Funcionalidades:

Cadastro completo com:

Nome legal e fantasia

País, endereço, telefone (validação internacional)

Tax ID conforme país (EIN, VAT, NIF, CNPJ etc.)

Contatos múltiplos (nome, e-mail, telefone)

Idioma preferencial

Documentos anexos (contratos, faturas, comprovantes)

Histórico automático de faturas e contratos vinculados.

Regras principais:

Validação internacional de endereços e telefones (libphonenumber).

Dados obrigatórios por país (EUA, UE, BR).

Anexos armazenados automaticamente no Storage.

Sem LGPD/GDPR obrigatórios no MVP.

4. Funcionários

Funcionalidades:

Cadastro com país, tipo de contrato (Fixo, Temporário, Estagiário, Terceiro)

Vínculo com usuário do sistema

Valor contratual e dia de pagamento (gera provisões automáticas no Financeiro)

Campos de endereço, documentos e dados de contato

Controle de visibilidade por permissão (“somente meus dados” ou “todos”)

Regras principais:

Folha de pagamento não implementada no MVP.

Todos os funcionários atuais são Terceiros (PJ).

Ao cadastrar, o sistema gera automaticamente uma provisão mensal no Financeiro.

5. Configurações

Funcionalidades:

Plano de Contas (COA) completo e editável

Métodos de pagamento (transferência e Stripe)

Moedas ativas e taxas de câmbio (import manual ou via API)

Templates (faturas e e-mails, traduzíveis em pt/es/en)

Criação de papéis e permissões com granularidade de acesso

Filiais (estrutura pronta, não obrigatória no MVP)

Configurações do sistema (fiscais, idioma, e-mail, etc.)

Regras principais:

Idioma vinculado ao usuário (pt-BR, es-ES, en-US).

Papéis e permissões criados no painel, com controle de telas e ações.

Cada filial pode operar em moedas distintas, consolidando em USD.

💵 Multi-moeda e câmbio (versão final)

Base contábil: USD (sempre).

Conversão automática: via API externa (ex.: exchangerate.host ou openexchangerates).

Fallback manual: se API falhar, o usuário informa a taxa.

Taxa congelada: no momento da emissão, pagamento ou lançamento.

Sem taxa de câmbio (spread) automática.

Campo manual: fx_fee_amount opcional (para diferenças bancárias).

Exibição de USD apenas internamente:

Em relatórios financeiros

Em contas a pagar/receber e fluxo de caixa

Nunca em faturas ou comunicações ao cliente

Armazenamento:

fx_rate_used, fx_rate_source, fx_rate_timestamp, usd_equiv_amount em cada lançamento

Cache diário (fx_rate): atualiza automaticamente via cron job

Conversão:

rate = QUOTE por 1 USD

usd_equiv = amount / rate

🔒 Segurança e Permissões

Autenticação: Supabase Auth (email + senha).

Usuário master criado inicialmente.

Papéis e permissões: criados via painel de configurações.

Auditoria total: logs de todas as ações (criar, editar, excluir, enviar, pagar, aprovar, login).

RLS (Row Level Security): escopo por empresa/filial e por role.

PII (dados sensíveis): mascarados em views e logs.

Ações críticas (exclusão, status): exigem confirmação e registro no audit_log.

📊 Relatórios (internos)

DRE (P&L)

Balanço

Fluxo de Caixa (indireto)

Aging (Contas vencidas AP/AR)

Razão geral (Ledger)

Opção de exibição:

“Mostrar valores em moeda original”

“Mostrar equivalente em USD (contábil)”

🧱 Arquitetura técnica

Frontend

Next.js (App Router, TSX, Tailwind, shadcn/ui)

i18next para multilíngue

React Hook Form + Zod

TanStack Query para cache e offline

Componentes base:

MoneyDisplay (com modo interno/externo)

FxTooltip (detalhes da taxa/fee)

StatusBadge (faturas/pagamentos)

DashboardCard (KPIs e gráficos)

Backend (Supabase)

Banco PostgreSQL 15

Tabelas: company, branch, user, role, permission, customer, vendor, invoice, contract, ap, ar, fx_rate, bank_account, provision, ledger_entry, audit_log

Edge Functions:

fx_refresh_daily: atualiza taxas USD↔outras moedas

generate_invoice_pdf: gera fatura com template multilíngue

mark_overdue: rotina diária de faturas/contas vencidas

Storage:

Pastas: /invoices/, /contracts/, /attachments/

Auditoria via triggers automáticas

RLS e logs definidos diretamente no Cursor

📱 Interface (mobile-first)

Menu inferior (tabs):

Dashboard

Financeiro

Faturamento

Clientes

Funcionários

Configurações

Design:

Minimalista, responsivo, tema escuro/claro

Layout tipo app financeiro (Painel com KPIs, botões flutuantes para criar fatura ou conta)

Cards interativos e tabelas com filtros por data, moeda e status

📅 Backlog MVP (6 Sprints sugeridas)

1️⃣ Fundação & Autenticação

Estrutura base (layout, login, roles, RLS, audit_log)

Configurações iniciais (idioma, moedas, API câmbio)

2️⃣ Clientes & Funcionários

CRUD completo com validações e anexos

Permissões iniciais

3️⃣ Financeiro Base (AP/AR)

Cadastro e gestão de contas, PDF obrigatório

Recorrências, parcelas, status e vencimentos

4️⃣ Faturamento

Contratos, fechamento mensal, geração e envio de faturas

Templates multilíngues, numeração contínua

5️⃣ Relatórios

DRE, Balanço, Fluxo de Caixa, Aging e Razão

Filtros por filial, moeda e período

6️⃣ Polimento & Dashboard

KPIs iniciais

Marcação automática de atrasos

Logs detalhados e auditoria visual

🧮 Regras contábeis (GAAP simplificado)

Competência (accrual basis)

Receita reconhecida na emissão (ou no fechamento mensal, se recorrente)

Sales tax apenas em clientes/filiais EUA

Fora dos EUA → “isento”

Moeda funcional: USD

Conversão conforme taxa do dia do evento (emissão ou pagamento)

Diferenças cambiais registradas automaticamente nos relatórios, não afetam fatura

🧾 Padrões de Fatura

Numeração: INV-{ANO}{SEQ} (sem reinício)

Idioma: herdado do contrato

Moeda: do contrato

Layout: configurável por template

PDF: gerado via Edge Function

Envio: manual (com logs de envio e idioma)

Anexos: armazenados automaticamente no histórico do cliente

⚙️ Regras de Automação

Fechamento mensal: gera faturas para contratos ativos

Provisões automáticas: para funcionários terceirizados e contratos recorrentes

Atualização cambial diária: consulta API e atualiza fx_rate

Marcação “em atraso”: rotina diária para faturas/contas vencidas

🧭 Internacionalização

Idiomas: pt-BR, es-ES, en-US

Idioma vinculado ao usuário

Datas e números formatados conforme localidade

Faturas e e-mails traduzidos conforme idioma do contrato

Endereços e telefones formatados por país

🧠 Regras complementares

Auditoria total e exportável

Controle de exclusão: sempre com confirmação e log

Campos obrigatórios e máscaras por país

Interface leve e responsiva

Estrutura preparada para expansão futura (filiais, conciliação bancária, integrações API)

Se quiser, posso gerar agora o prompt técnico formatado para o Cursor, com:

Estrutura de pastas (/app, /lib, /components, /modules)

Configuração inicial do Supabase e i18n

Tipagem dos módulos (Financeiro, Faturamento, Clientes etc.)

Edge Functions mockadas

Providers globais e hooks (useFxRate, useMoneyDisplay, useAuditLog)ß