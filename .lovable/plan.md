

# Migrar banco de dados completo para o novo projeto

## Contexto
O projeto foi remixado e agora aponta para um novo backend vazio. Todas as 14 migrations existentes precisam ser consolidadas em uma unica migration que recria todo o schema no novo projeto.

## O que sera feito

### 1. Criar migration consolidada com todo o schema
Uma unica migration SQL que inclui, na ordem correta:

**Enums (7 tipos)**
- `app_role` (admin, comercial, financeiro, artista)
- `contract_status`, `event_status`, `funnel_stage`
- `event_status_pt`, `contract_status_pt`, `payment_type_pt`, `payment_status_pt`
- `taggable_type`, `activity_action`

**Funcoes utilitarias**
- `update_updated_at_column()` - trigger para updated_at
- `is_member_of_org()` - verifica membership
- `has_org_role()` - verifica role na org
- `is_super_admin()` - verifica super admin
- `is_confirmed_date_available()` - verifica conflito de agenda
- `validate_calendar_event_conflicts()` - trigger de validacao
- `mark_overdue_installments()` - marca parcelas atrasadas
- `handle_new_user()` - bootstrap no signup (profile + org + membership + subscription)

**Tabelas (22 tabelas + 1 view)**
- organizations, profiles, memberships
- leads, contracts, calendar_events
- contacts, venues, regions, region_cities
- tags, entity_tags, activity_logs, notes
- tasks, team_members, contract_templates, riders
- lead_messages, finance_transactions
- events, payments
- payment_plans, payment_installments, payment_receipts
- super_admins, subscriptions
- notifications
- View: lead_financial_summary

**RLS completo** - todas as policies existentes para cada tabela

**Triggers** - updated_at automatico, validacao de conflitos, bootstrap de usuario

**Storage** - bucket `receipts` com policies

**Indices** - todos os indices de performance

**Extensoes** - pg_cron e pg_net

### 2. Corrigir erros de build nas Edge Functions
Os dois erros TypeScript nas edge functions:
- `invite-user/index.ts`: tipar `err` como `Error` no catch
- `task-deadline-notifications/index.ts`: tipar `error` como `Error` no catch

## Detalhes tecnicos

A migration sera uma consolidacao limpa de todas as 14 migrations existentes, sem os backfills (INSERT INTO... SELECT) que eram especificos do projeto anterior. A migration usara `CREATE TABLE IF NOT EXISTS` e `DO $$ BEGIN ... EXCEPTION ... END $$` para ser idempotente onde possivel.

O trigger `on_auth_user_created` no `auth.users` sera recriado para chamar `handle_new_user()` no signup.

