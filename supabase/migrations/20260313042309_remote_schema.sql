create extension if not exists "pg_cron" with schema "pg_catalog";

create type "public"."activity_action" as enum ('created', 'updated', 'deleted', 'stage_changed', 'status_changed', 'note_added', 'tag_added', 'tag_removed');

create type "public"."app_role" as enum ('owner', 'admin', 'comercial', 'financeiro', 'artista');

create type "public"."contract_status" as enum ('pending', 'signed', 'canceled');

create type "public"."event_status" as enum ('negotiation', 'confirmed', 'blocked', 'hold');

create type "public"."funnel_stage" as enum ('Prospecção', 'Contato', 'Proposta', 'Negociação', 'Contrato', 'Fechado');

create type "public"."taggable_type" as enum ('lead', 'contact', 'venue', 'event');


  create table "public"."activity_logs" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "user_id" uuid not null,
    "entity_id" uuid not null,
    "entity_type" text not null,
    "action" public.activity_action not null,
    "old_value" jsonb,
    "new_value" jsonb,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."activity_logs" enable row level security;


  create table "public"."calendar_events" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "title" text not null,
    "start_time" timestamp with time zone not null,
    "end_time" timestamp with time zone,
    "status" public.event_status not null default 'negotiation'::public.event_status,
    "venue_name" text,
    "venue_id" uuid,
    "contractor_name" text,
    "fee" numeric,
    "stage" public.funnel_stage,
    "contract_status" public.contract_status,
    "lead_id" uuid,
    "contract_id" uuid,
    "city" text,
    "state" text,
    "latitude" numeric,
    "longitude" numeric,
    "notes" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."calendar_events" enable row level security;


  create table "public"."contacts" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "email" text,
    "phone" text,
    "company" text,
    "role" text,
    "notes" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."contacts" enable row level security;


  create table "public"."contract_templates" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "content" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."contract_templates" enable row level security;


  create table "public"."contracts" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "lead_id" uuid not null,
    "status" public.contract_status not null default 'pending'::public.contract_status,
    "fee" numeric,
    "payment_method" text,
    "document_url" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."contracts" enable row level security;


  create table "public"."entity_tags" (
    "id" uuid not null default gen_random_uuid(),
    "tag_id" uuid not null,
    "entity_id" uuid not null,
    "entity_type" public.taggable_type not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."entity_tags" enable row level security;


  create table "public"."finance_transactions" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "type" text not null,
    "amount" numeric not null default 0,
    "category" text not null default 'Outros'::text,
    "description" text,
    "status" text not null default 'pending'::text,
    "due_date" date,
    "paid_at" date,
    "notes" text,
    "lead_id" uuid,
    "contract_id" uuid,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."finance_transactions" enable row level security;


  create table "public"."funnel_stages" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "position" integer not null default 0,
    "color" text default '#64748b'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."funnel_stages" enable row level security;


  create table "public"."lead_interactions" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid,
    "type" text not null,
    "content" text,
    "metadata" jsonb,
    "created_at" timestamp without time zone not null default now(),
    "organization_id" uuid,
    "user_id" uuid,
    "event_type" text,
    "payload" jsonb default '{}'::jsonb
      );


alter table "public"."lead_interactions" enable row level security;


  create table "public"."lead_messages" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "lead_id" uuid not null,
    "message_text" text,
    "media_url" text,
    "message_type" text not null default 'text'::text,
    "direction" text not null default 'inbound'::text,
    "wa_id" text,
    "raw_payload" jsonb,
    "created_at" timestamp with time zone not null default now(),
    "status" text default 'pending'::text,
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "error_message" text,
    "template_id" uuid
      );


alter table "public"."lead_messages" enable row level security;


  create table "public"."leads" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "contractor_name" text not null,
    "contractor_type" text,
    "event_name" text,
    "event_date" date,
    "fee" numeric,
    "stage" public.funnel_stage not null default 'Negociação'::public.funnel_stage,
    "city" text,
    "state" text,
    "street" text,
    "street_number" text,
    "neighborhood" text,
    "zip_code" text,
    "latitude" numeric,
    "longitude" numeric,
    "venue_id" uuid,
    "venue_name" text,
    "contact_id" uuid,
    "contact_email" text,
    "contact_phone" text,
    "origin" text,
    "notes" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "whatsapp_phone" text,
    "last_message_at" timestamp with time zone,
    "last_message_preview" text,
    "source" text,
    "last_contact_at" timestamp without time zone,
    "last_message" text,
    "unread_count" integer default 0,
    "name" text,
    "phone" text,
    "region" text
      );


alter table "public"."leads" enable row level security;


  create table "public"."memberships" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "user_id" uuid not null,
    "role" public.app_role not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."memberships" enable row level security;


  create table "public"."message_queue" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "lead_id" uuid,
    "message_id" uuid,
    "payload" jsonb default '{}'::jsonb,
    "status" text default 'pending'::text,
    "attempts" integer default 0,
    "last_error" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "instance_id" uuid,
    "provider" text default 'evolution'::text,
    "job_type" text default 'send_message'::text,
    "scheduled_for" timestamp with time zone default now(),
    "locked_at" timestamp with time zone,
    "processed_at" timestamp with time zone
      );


alter table "public"."message_queue" enable row level security;


  create table "public"."notes" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "entity_id" uuid not null,
    "entity_type" text not null,
    "content" text not null,
    "is_pinned" boolean default false,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."notes" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "user_id" uuid not null,
    "type" text not null default 'task_assigned'::text,
    "title" text not null,
    "message" text,
    "entity_type" text,
    "entity_id" uuid,
    "is_read" boolean not null default false,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."notifications" enable row level security;


  create table "public"."organizations" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."organizations" enable row level security;


  create table "public"."payment_installments" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "payment_plan_id" uuid not null,
    "installment_number" integer not null,
    "amount" numeric not null,
    "due_date" date not null,
    "status" text not null default 'pendente'::text,
    "paid_amount" numeric,
    "paid_at" timestamp with time zone,
    "payment_method" text,
    "notes" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."payment_installments" enable row level security;


  create table "public"."payment_plans" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "lead_id" uuid not null,
    "event_id" uuid,
    "model" text not null,
    "total_amount" numeric not null,
    "currency" text not null default 'BRL'::text,
    "notes" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."payment_plans" enable row level security;


  create table "public"."payment_receipts" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "installment_id" uuid not null,
    "file_name" text not null,
    "file_url" text not null,
    "file_size" bigint,
    "mime_type" text,
    "notes" text,
    "uploaded_by" uuid not null,
    "uploaded_at" timestamp with time zone not null default now()
      );


alter table "public"."payment_receipts" enable row level security;


  create table "public"."profiles" (
    "id" uuid not null,
    "email" text,
    "display_name" text,
    "active_organization_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."region_cities" (
    "id" uuid not null default gen_random_uuid(),
    "region_id" uuid not null,
    "city" text not null,
    "state" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."region_cities" enable row level security;


  create table "public"."regions" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "description" text,
    "color" text default '#3b82f6'::text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."regions" enable row level security;


  create table "public"."riders" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "document_url" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."riders" enable row level security;


  create table "public"."subscriptions" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "plan" text not null default 'starter'::text,
    "status" text not null default 'active'::text,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."subscriptions" enable row level security;


  create table "public"."super_admins" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."super_admins" enable row level security;


  create table "public"."tags" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "color" text default '#6366f1'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."tags" enable row level security;


  create table "public"."tasks" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "title" text not null,
    "description" text,
    "priority" text not null default 'medium'::text,
    "is_completed" boolean not null default false,
    "completed_at" timestamp with time zone,
    "due_date" date,
    "assigned_to" uuid,
    "entity_id" uuid,
    "entity_type" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."tasks" enable row level security;


  create table "public"."team_members" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "email" text,
    "phone" text,
    "role" text,
    "category" text not null default 'Músico'::text,
    "is_active" boolean not null default true,
    "avatar_url" text,
    "notes" text,
    "tags" text[] default '{}'::text[],
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."team_members" enable row level security;


  create table "public"."venues" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "address" text,
    "city" text,
    "state" text,
    "capacity" integer,
    "latitude" numeric,
    "longitude" numeric,
    "contact_id" uuid,
    "notes" text,
    "created_by" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."venues" enable row level security;


  create table "public"."whatsapp_chats" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "instance_id" uuid not null,
    "lead_id" uuid,
    "contact_phone" text not null,
    "contact_name" text,
    "chat_type" text not null default 'individual'::text,
    "status" text not null default 'open'::text,
    "last_message" text,
    "last_message_at" timestamp with time zone,
    "unread_count" integer not null default 0,
    "assigned_to" uuid,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."whatsapp_chats" enable row level security;


  create table "public"."whatsapp_conversations" (
    "id" uuid not null default gen_random_uuid(),
    "lead_id" uuid,
    "wa_message_id" text,
    "direction" text,
    "from_number" text,
    "to_number" text,
    "phone_number_id" text,
    "message_type" text,
    "message_text" text,
    "raw_payload" jsonb,
    "status" text,
    "status_updated_at" timestamp without time zone,
    "created_at" timestamp without time zone not null default now(),
    "organization_id" uuid,
    "contact_phone" text,
    "contact_name" text,
    "city" text,
    "region" text,
    "stage" text,
    "last_message" text,
    "last_message_at" timestamp with time zone,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."whatsapp_conversations" enable row level security;


  create table "public"."whatsapp_followups" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "lead_id" uuid not null,
    "scheduled_by" uuid,
    "template_id" uuid,
    "title" text default 'Follow-up'::text,
    "status" text default 'pending'::text,
    "due_at" timestamp with time zone not null,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."whatsapp_followups" enable row level security;


  create table "public"."whatsapp_instances" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "created_by" uuid,
    "provider" text not null default 'evolution'::text,
    "instance_name" text not null,
    "phone_number" text,
    "display_name" text,
    "status" text not null default 'disconnected'::text,
    "qr_code" text,
    "qr_expires_at" timestamp with time zone,
    "api_base_url" text,
    "webhook_url" text,
    "provider_instance_id" text,
    "connected_at" timestamp with time zone,
    "disconnected_at" timestamp with time zone,
    "last_seen_at" timestamp with time zone,
    "is_active" boolean not null default true,
    "metadata" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."whatsapp_instances" enable row level security;


  create table "public"."whatsapp_messages" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "instance_id" uuid not null,
    "chat_id" uuid not null,
    "lead_id" uuid,
    "external_message_id" text,
    "legacy_lead_message_id" uuid,
    "direction" text not null,
    "message_type" text not null default 'text'::text,
    "message_text" text,
    "media_url" text,
    "mime_type" text,
    "from_number" text,
    "to_number" text,
    "status" text not null default 'pending'::text,
    "error_message" text,
    "raw_payload" jsonb,
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."whatsapp_messages" enable row level security;


  create table "public"."whatsapp_templates" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid not null,
    "name" text not null,
    "category" text default 'geral'::text,
    "body" text not null,
    "variables" text[] default '{}'::text[],
    "is_active" boolean default true,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."whatsapp_templates" enable row level security;


  create table "public"."whatsapp_webhook_events" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid,
    "instance_id" uuid,
    "provider" text not null,
    "event_type" text not null,
    "external_event_id" text,
    "payload" jsonb not null,
    "processed" boolean not null default false,
    "processed_at" timestamp with time zone,
    "error" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."whatsapp_webhook_events" enable row level security;

CREATE UNIQUE INDEX activity_logs_pkey ON public.activity_logs USING btree (id);

CREATE UNIQUE INDEX calendar_events_pkey ON public.calendar_events USING btree (id);

CREATE UNIQUE INDEX contacts_pkey ON public.contacts USING btree (id);

CREATE UNIQUE INDEX contract_templates_pkey ON public.contract_templates USING btree (id);

CREATE UNIQUE INDEX contracts_pkey ON public.contracts USING btree (id);

CREATE UNIQUE INDEX entity_tags_pkey ON public.entity_tags USING btree (id);

CREATE UNIQUE INDEX finance_transactions_pkey ON public.finance_transactions USING btree (id);

CREATE UNIQUE INDEX funnel_stages_organization_id_name_key ON public.funnel_stages USING btree (organization_id, name);

CREATE UNIQUE INDEX funnel_stages_pkey ON public.funnel_stages USING btree (id);

CREATE INDEX idx_activity_logs_entity ON public.activity_logs USING btree (entity_type, entity_id);

CREATE INDEX idx_activity_logs_org ON public.activity_logs USING btree (organization_id);

CREATE INDEX idx_calendar_events_org ON public.calendar_events USING btree (organization_id);

CREATE INDEX idx_calendar_events_start ON public.calendar_events USING btree (start_time);

CREATE INDEX idx_calendar_events_status ON public.calendar_events USING btree (status);

CREATE INDEX idx_contacts_org ON public.contacts USING btree (organization_id);

CREATE INDEX idx_contracts_lead ON public.contracts USING btree (lead_id);

CREATE INDEX idx_contracts_org ON public.contracts USING btree (organization_id);

CREATE INDEX idx_entity_tags_entity ON public.entity_tags USING btree (entity_type, entity_id);

CREATE INDEX idx_entity_tags_tag ON public.entity_tags USING btree (tag_id);

CREATE INDEX idx_finance_transactions_lead ON public.finance_transactions USING btree (lead_id);

CREATE INDEX idx_finance_transactions_org ON public.finance_transactions USING btree (organization_id);

CREATE INDEX idx_lead_messages_lead ON public.lead_messages USING btree (lead_id);

CREATE INDEX idx_leads_event_date ON public.leads USING btree (event_date);

CREATE INDEX idx_leads_org ON public.leads USING btree (organization_id);

CREATE INDEX idx_leads_stage ON public.leads USING btree (stage);

CREATE INDEX idx_memberships_org ON public.memberships USING btree (organization_id);

CREATE INDEX idx_memberships_user ON public.memberships USING btree (user_id);

CREATE INDEX idx_message_queue_instance_id ON public.message_queue USING btree (instance_id);

CREATE INDEX idx_message_queue_status_scheduled_for ON public.message_queue USING btree (status, scheduled_for);

CREATE INDEX idx_notes_entity ON public.notes USING btree (entity_type, entity_id);

CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, is_read);

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);

CREATE INDEX idx_payment_installments_plan ON public.payment_installments USING btree (payment_plan_id);

CREATE INDEX idx_payment_plans_lead ON public.payment_plans USING btree (lead_id);

CREATE INDEX idx_payment_receipts_installment ON public.payment_receipts USING btree (installment_id);

CREATE INDEX idx_region_cities_region ON public.region_cities USING btree (region_id);

CREATE INDEX idx_regions_org ON public.regions USING btree (organization_id);

CREATE INDEX idx_tags_org ON public.tags USING btree (organization_id);

CREATE INDEX idx_tasks_assigned ON public.tasks USING btree (assigned_to);

CREATE INDEX idx_tasks_due ON public.tasks USING btree (due_date);

CREATE INDEX idx_tasks_org ON public.tasks USING btree (organization_id);

CREATE INDEX idx_team_members_org ON public.team_members USING btree (organization_id);

CREATE INDEX idx_venues_org ON public.venues USING btree (organization_id);

CREATE INDEX idx_whatsapp_chats_last_message_at ON public.whatsapp_chats USING btree (last_message_at DESC);

CREATE INDEX idx_whatsapp_chats_lead_id ON public.whatsapp_chats USING btree (lead_id);

CREATE INDEX idx_whatsapp_chats_organization_id ON public.whatsapp_chats USING btree (organization_id);

CREATE INDEX idx_whatsapp_instances_organization_id ON public.whatsapp_instances USING btree (organization_id);

CREATE INDEX idx_whatsapp_instances_status ON public.whatsapp_instances USING btree (status);

CREATE INDEX idx_whatsapp_messages_chat_id_created_at ON public.whatsapp_messages USING btree (chat_id, created_at);

CREATE INDEX idx_whatsapp_messages_instance_id ON public.whatsapp_messages USING btree (instance_id);

CREATE INDEX idx_whatsapp_messages_lead_id ON public.whatsapp_messages USING btree (lead_id);

CREATE INDEX idx_whatsapp_webhook_events_instance_id ON public.whatsapp_webhook_events USING btree (instance_id);

CREATE INDEX idx_whatsapp_webhook_events_processed ON public.whatsapp_webhook_events USING btree (processed);

CREATE UNIQUE INDEX lead_interactions_pkey ON public.lead_interactions USING btree (id);

CREATE UNIQUE INDEX lead_messages_pkey ON public.lead_messages USING btree (id);

CREATE UNIQUE INDEX leads_pkey ON public.leads USING btree (id);

CREATE INDEX leads_whatsapp_phone_idx ON public.leads USING btree (whatsapp_phone);

CREATE UNIQUE INDEX memberships_organization_id_user_id_key ON public.memberships USING btree (organization_id, user_id);

CREATE UNIQUE INDEX memberships_pkey ON public.memberships USING btree (id);

CREATE UNIQUE INDEX memberships_user_id_role_organization_id_key ON public.memberships USING btree (user_id, role, organization_id);

CREATE UNIQUE INDEX message_queue_pkey ON public.message_queue USING btree (id);

CREATE UNIQUE INDEX notes_pkey ON public.notes USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX organizations_pkey ON public.organizations USING btree (id);

CREATE UNIQUE INDEX payment_installments_organization_id_payment_plan_id_instal_key ON public.payment_installments USING btree (organization_id, payment_plan_id, installment_number);

CREATE UNIQUE INDEX payment_installments_pkey ON public.payment_installments USING btree (id);

CREATE UNIQUE INDEX payment_plans_organization_id_lead_id_key ON public.payment_plans USING btree (organization_id, lead_id);

CREATE UNIQUE INDEX payment_plans_pkey ON public.payment_plans USING btree (id);

CREATE UNIQUE INDEX payment_receipts_pkey ON public.payment_receipts USING btree (id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX region_cities_pkey ON public.region_cities USING btree (id);

CREATE UNIQUE INDEX regions_pkey ON public.regions USING btree (id);

CREATE UNIQUE INDEX riders_pkey ON public.riders USING btree (id);

CREATE UNIQUE INDEX subscriptions_organization_id_key ON public.subscriptions USING btree (organization_id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX super_admins_pkey ON public.super_admins USING btree (id);

CREATE UNIQUE INDEX super_admins_user_id_key ON public.super_admins USING btree (user_id);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);

CREATE UNIQUE INDEX team_members_pkey ON public.team_members USING btree (id);

CREATE UNIQUE INDEX uq_whatsapp_chats_instance_phone ON public.whatsapp_chats USING btree (instance_id, contact_phone);

CREATE UNIQUE INDEX uq_whatsapp_messages_external_message_id ON public.whatsapp_messages USING btree (external_message_id) WHERE (external_message_id IS NOT NULL);

CREATE UNIQUE INDEX venues_pkey ON public.venues USING btree (id);

CREATE UNIQUE INDEX whatsapp_chats_pkey ON public.whatsapp_chats USING btree (id);

CREATE UNIQUE INDEX whatsapp_conversations_organization_id_contact_phone_key ON public.whatsapp_conversations USING btree (organization_id, contact_phone);

CREATE UNIQUE INDEX whatsapp_conversations_pkey ON public.whatsapp_conversations USING btree (id);

CREATE UNIQUE INDEX whatsapp_conversations_wa_message_id_key ON public.whatsapp_conversations USING btree (wa_message_id);

CREATE UNIQUE INDEX whatsapp_followups_pkey ON public.whatsapp_followups USING btree (id);

CREATE UNIQUE INDEX whatsapp_instances_instance_name_key ON public.whatsapp_instances USING btree (instance_name);

CREATE UNIQUE INDEX whatsapp_instances_pkey ON public.whatsapp_instances USING btree (id);

CREATE UNIQUE INDEX whatsapp_messages_pkey ON public.whatsapp_messages USING btree (id);

CREATE UNIQUE INDEX whatsapp_templates_pkey ON public.whatsapp_templates USING btree (id);

CREATE UNIQUE INDEX whatsapp_webhook_events_pkey ON public.whatsapp_webhook_events USING btree (id);

alter table "public"."activity_logs" add constraint "activity_logs_pkey" PRIMARY KEY using index "activity_logs_pkey";

alter table "public"."calendar_events" add constraint "calendar_events_pkey" PRIMARY KEY using index "calendar_events_pkey";

alter table "public"."contacts" add constraint "contacts_pkey" PRIMARY KEY using index "contacts_pkey";

alter table "public"."contract_templates" add constraint "contract_templates_pkey" PRIMARY KEY using index "contract_templates_pkey";

alter table "public"."contracts" add constraint "contracts_pkey" PRIMARY KEY using index "contracts_pkey";

alter table "public"."entity_tags" add constraint "entity_tags_pkey" PRIMARY KEY using index "entity_tags_pkey";

alter table "public"."finance_transactions" add constraint "finance_transactions_pkey" PRIMARY KEY using index "finance_transactions_pkey";

alter table "public"."funnel_stages" add constraint "funnel_stages_pkey" PRIMARY KEY using index "funnel_stages_pkey";

alter table "public"."lead_interactions" add constraint "lead_interactions_pkey" PRIMARY KEY using index "lead_interactions_pkey";

alter table "public"."lead_messages" add constraint "lead_messages_pkey" PRIMARY KEY using index "lead_messages_pkey";

alter table "public"."leads" add constraint "leads_pkey" PRIMARY KEY using index "leads_pkey";

alter table "public"."memberships" add constraint "memberships_pkey" PRIMARY KEY using index "memberships_pkey";

alter table "public"."message_queue" add constraint "message_queue_pkey" PRIMARY KEY using index "message_queue_pkey";

alter table "public"."notes" add constraint "notes_pkey" PRIMARY KEY using index "notes_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."organizations" add constraint "organizations_pkey" PRIMARY KEY using index "organizations_pkey";

alter table "public"."payment_installments" add constraint "payment_installments_pkey" PRIMARY KEY using index "payment_installments_pkey";

alter table "public"."payment_plans" add constraint "payment_plans_pkey" PRIMARY KEY using index "payment_plans_pkey";

alter table "public"."payment_receipts" add constraint "payment_receipts_pkey" PRIMARY KEY using index "payment_receipts_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."region_cities" add constraint "region_cities_pkey" PRIMARY KEY using index "region_cities_pkey";

alter table "public"."regions" add constraint "regions_pkey" PRIMARY KEY using index "regions_pkey";

alter table "public"."riders" add constraint "riders_pkey" PRIMARY KEY using index "riders_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."super_admins" add constraint "super_admins_pkey" PRIMARY KEY using index "super_admins_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."team_members" add constraint "team_members_pkey" PRIMARY KEY using index "team_members_pkey";

alter table "public"."venues" add constraint "venues_pkey" PRIMARY KEY using index "venues_pkey";

alter table "public"."whatsapp_chats" add constraint "whatsapp_chats_pkey" PRIMARY KEY using index "whatsapp_chats_pkey";

alter table "public"."whatsapp_conversations" add constraint "whatsapp_conversations_pkey" PRIMARY KEY using index "whatsapp_conversations_pkey";

alter table "public"."whatsapp_followups" add constraint "whatsapp_followups_pkey" PRIMARY KEY using index "whatsapp_followups_pkey";

alter table "public"."whatsapp_instances" add constraint "whatsapp_instances_pkey" PRIMARY KEY using index "whatsapp_instances_pkey";

alter table "public"."whatsapp_messages" add constraint "whatsapp_messages_pkey" PRIMARY KEY using index "whatsapp_messages_pkey";

alter table "public"."whatsapp_templates" add constraint "whatsapp_templates_pkey" PRIMARY KEY using index "whatsapp_templates_pkey";

alter table "public"."whatsapp_webhook_events" add constraint "whatsapp_webhook_events_pkey" PRIMARY KEY using index "whatsapp_webhook_events_pkey";

alter table "public"."activity_logs" add constraint "activity_logs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."activity_logs" validate constraint "activity_logs_organization_id_fkey";

alter table "public"."calendar_events" add constraint "calendar_events_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_contract_id_fkey";

alter table "public"."calendar_events" add constraint "calendar_events_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_lead_id_fkey";

alter table "public"."calendar_events" add constraint "calendar_events_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_organization_id_fkey";

alter table "public"."calendar_events" add constraint "calendar_events_venue_id_fkey" FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL not valid;

alter table "public"."calendar_events" validate constraint "calendar_events_venue_id_fkey";

alter table "public"."contacts" add constraint "contacts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."contacts" validate constraint "contacts_organization_id_fkey";

alter table "public"."contract_templates" add constraint "contract_templates_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."contract_templates" validate constraint "contract_templates_organization_id_fkey";

alter table "public"."contracts" add constraint "contracts_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."contracts" validate constraint "contracts_lead_id_fkey";

alter table "public"."contracts" add constraint "contracts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."contracts" validate constraint "contracts_organization_id_fkey";

alter table "public"."entity_tags" add constraint "entity_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE not valid;

alter table "public"."entity_tags" validate constraint "entity_tags_tag_id_fkey";

alter table "public"."finance_transactions" add constraint "finance_transactions_contract_id_fkey" FOREIGN KEY (contract_id) REFERENCES public.contracts(id) ON DELETE SET NULL not valid;

alter table "public"."finance_transactions" validate constraint "finance_transactions_contract_id_fkey";

alter table "public"."finance_transactions" add constraint "finance_transactions_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL not valid;

alter table "public"."finance_transactions" validate constraint "finance_transactions_lead_id_fkey";

alter table "public"."finance_transactions" add constraint "finance_transactions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."finance_transactions" validate constraint "finance_transactions_organization_id_fkey";

alter table "public"."funnel_stages" add constraint "funnel_stages_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."funnel_stages" validate constraint "funnel_stages_organization_id_fkey";

alter table "public"."funnel_stages" add constraint "funnel_stages_organization_id_name_key" UNIQUE using index "funnel_stages_organization_id_name_key";

alter table "public"."lead_interactions" add constraint "lead_interactions_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."lead_interactions" validate constraint "lead_interactions_lead_id_fkey";

alter table "public"."lead_interactions" add constraint "lead_interactions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."lead_interactions" validate constraint "lead_interactions_organization_id_fkey";

alter table "public"."lead_messages" add constraint "lead_messages_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."lead_messages" validate constraint "lead_messages_lead_id_fkey";

alter table "public"."lead_messages" add constraint "lead_messages_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."lead_messages" validate constraint "lead_messages_organization_id_fkey";

alter table "public"."leads" add constraint "leads_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL not valid;

alter table "public"."leads" validate constraint "leads_contact_id_fkey";

alter table "public"."leads" add constraint "leads_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."leads" validate constraint "leads_organization_id_fkey";

alter table "public"."leads" add constraint "leads_venue_id_fkey" FOREIGN KEY (venue_id) REFERENCES public.venues(id) ON DELETE SET NULL not valid;

alter table "public"."leads" validate constraint "leads_venue_id_fkey";

alter table "public"."memberships" add constraint "memberships_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."memberships" validate constraint "memberships_organization_id_fkey";

alter table "public"."memberships" add constraint "memberships_organization_id_user_id_key" UNIQUE using index "memberships_organization_id_user_id_key";

alter table "public"."memberships" add constraint "memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."memberships" validate constraint "memberships_user_id_fkey";

alter table "public"."memberships" add constraint "memberships_user_id_role_organization_id_key" UNIQUE using index "memberships_user_id_role_organization_id_key";

alter table "public"."message_queue" add constraint "message_queue_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL not valid;

alter table "public"."message_queue" validate constraint "message_queue_instance_id_fkey";

alter table "public"."message_queue" add constraint "message_queue_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) not valid;

alter table "public"."message_queue" validate constraint "message_queue_lead_id_fkey";

alter table "public"."message_queue" add constraint "message_queue_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."message_queue" validate constraint "message_queue_organization_id_fkey";

alter table "public"."notes" add constraint "notes_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."notes" validate constraint "notes_organization_id_fkey";

alter table "public"."notifications" add constraint "notifications_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_organization_id_fkey";

alter table "public"."payment_installments" add constraint "payment_installments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."payment_installments" validate constraint "payment_installments_organization_id_fkey";

alter table "public"."payment_installments" add constraint "payment_installments_organization_id_payment_plan_id_instal_key" UNIQUE using index "payment_installments_organization_id_payment_plan_id_instal_key";

alter table "public"."payment_installments" add constraint "payment_installments_payment_plan_id_fkey" FOREIGN KEY (payment_plan_id) REFERENCES public.payment_plans(id) ON DELETE CASCADE not valid;

alter table "public"."payment_installments" validate constraint "payment_installments_payment_plan_id_fkey";

alter table "public"."payment_plans" add constraint "payment_plans_event_id_fkey" FOREIGN KEY (event_id) REFERENCES public.calendar_events(id) ON DELETE SET NULL not valid;

alter table "public"."payment_plans" validate constraint "payment_plans_event_id_fkey";

alter table "public"."payment_plans" add constraint "payment_plans_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE not valid;

alter table "public"."payment_plans" validate constraint "payment_plans_lead_id_fkey";

alter table "public"."payment_plans" add constraint "payment_plans_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."payment_plans" validate constraint "payment_plans_organization_id_fkey";

alter table "public"."payment_plans" add constraint "payment_plans_organization_id_lead_id_key" UNIQUE using index "payment_plans_organization_id_lead_id_key";

alter table "public"."payment_receipts" add constraint "payment_receipts_installment_id_fkey" FOREIGN KEY (installment_id) REFERENCES public.payment_installments(id) ON DELETE CASCADE not valid;

alter table "public"."payment_receipts" validate constraint "payment_receipts_installment_id_fkey";

alter table "public"."payment_receipts" add constraint "payment_receipts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."payment_receipts" validate constraint "payment_receipts_organization_id_fkey";

alter table "public"."region_cities" add constraint "region_cities_region_id_fkey" FOREIGN KEY (region_id) REFERENCES public.regions(id) ON DELETE CASCADE not valid;

alter table "public"."region_cities" validate constraint "region_cities_region_id_fkey";

alter table "public"."regions" add constraint "regions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."regions" validate constraint "regions_organization_id_fkey";

alter table "public"."riders" add constraint "riders_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."riders" validate constraint "riders_organization_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_organization_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_organization_id_key" UNIQUE using index "subscriptions_organization_id_key";

alter table "public"."super_admins" add constraint "super_admins_user_id_key" UNIQUE using index "super_admins_user_id_key";

alter table "public"."tags" add constraint "tags_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."tags" validate constraint "tags_organization_id_fkey";

alter table "public"."tasks" add constraint "tasks_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_organization_id_fkey";

alter table "public"."team_members" add constraint "team_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."team_members" validate constraint "team_members_organization_id_fkey";

alter table "public"."venues" add constraint "venues_contact_id_fkey" FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL not valid;

alter table "public"."venues" validate constraint "venues_contact_id_fkey";

alter table "public"."venues" add constraint "venues_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."venues" validate constraint "venues_organization_id_fkey";

alter table "public"."whatsapp_chats" add constraint "whatsapp_chats_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."whatsapp_chats" validate constraint "whatsapp_chats_assigned_to_fkey";

alter table "public"."whatsapp_chats" add constraint "whatsapp_chats_chat_type_check" CHECK ((chat_type = ANY (ARRAY['individual'::text, 'group'::text]))) not valid;

alter table "public"."whatsapp_chats" validate constraint "whatsapp_chats_chat_type_check";

alter table "public"."whatsapp_chats" add constraint "whatsapp_chats_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE not valid;

alter table "public"."whatsapp_chats" validate constraint "whatsapp_chats_instance_id_fkey";

alter table "public"."whatsapp_chats" add constraint "whatsapp_chats_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL not valid;

alter table "public"."whatsapp_chats" validate constraint "whatsapp_chats_lead_id_fkey";

alter table "public"."whatsapp_chats" add constraint "whatsapp_chats_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."whatsapp_chats" validate constraint "whatsapp_chats_organization_id_fkey";

alter table "public"."whatsapp_chats" add constraint "whatsapp_chats_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'archived'::text, 'closed'::text]))) not valid;

alter table "public"."whatsapp_chats" validate constraint "whatsapp_chats_status_check";

alter table "public"."whatsapp_conversations" add constraint "whatsapp_conversations_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL not valid;

alter table "public"."whatsapp_conversations" validate constraint "whatsapp_conversations_lead_id_fkey";

alter table "public"."whatsapp_conversations" add constraint "whatsapp_conversations_organization_id_contact_phone_key" UNIQUE using index "whatsapp_conversations_organization_id_contact_phone_key";

alter table "public"."whatsapp_conversations" add constraint "whatsapp_conversations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."whatsapp_conversations" validate constraint "whatsapp_conversations_organization_id_fkey";

alter table "public"."whatsapp_conversations" add constraint "whatsapp_conversations_wa_message_id_key" UNIQUE using index "whatsapp_conversations_wa_message_id_key";

alter table "public"."whatsapp_followups" add constraint "whatsapp_followups_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) not valid;

alter table "public"."whatsapp_followups" validate constraint "whatsapp_followups_lead_id_fkey";

alter table "public"."whatsapp_followups" add constraint "whatsapp_followups_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."whatsapp_followups" validate constraint "whatsapp_followups_organization_id_fkey";

alter table "public"."whatsapp_instances" add constraint "whatsapp_instances_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."whatsapp_instances" validate constraint "whatsapp_instances_created_by_fkey";

alter table "public"."whatsapp_instances" add constraint "whatsapp_instances_instance_name_key" UNIQUE using index "whatsapp_instances_instance_name_key";

alter table "public"."whatsapp_instances" add constraint "whatsapp_instances_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."whatsapp_instances" validate constraint "whatsapp_instances_organization_id_fkey";

alter table "public"."whatsapp_instances" add constraint "whatsapp_instances_status_check" CHECK ((status = ANY (ARRAY['disconnected'::text, 'qrcode'::text, 'connecting'::text, 'connected'::text, 'failed'::text]))) not valid;

alter table "public"."whatsapp_instances" validate constraint "whatsapp_instances_status_check";

alter table "public"."whatsapp_messages" add constraint "whatsapp_messages_chat_id_fkey" FOREIGN KEY (chat_id) REFERENCES public.whatsapp_chats(id) ON DELETE CASCADE not valid;

alter table "public"."whatsapp_messages" validate constraint "whatsapp_messages_chat_id_fkey";

alter table "public"."whatsapp_messages" add constraint "whatsapp_messages_direction_check" CHECK ((direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))) not valid;

alter table "public"."whatsapp_messages" validate constraint "whatsapp_messages_direction_check";

alter table "public"."whatsapp_messages" add constraint "whatsapp_messages_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE not valid;

alter table "public"."whatsapp_messages" validate constraint "whatsapp_messages_instance_id_fkey";

alter table "public"."whatsapp_messages" add constraint "whatsapp_messages_lead_id_fkey" FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL not valid;

alter table "public"."whatsapp_messages" validate constraint "whatsapp_messages_lead_id_fkey";

alter table "public"."whatsapp_messages" add constraint "whatsapp_messages_legacy_lead_message_id_fkey" FOREIGN KEY (legacy_lead_message_id) REFERENCES public.lead_messages(id) ON DELETE SET NULL not valid;

alter table "public"."whatsapp_messages" validate constraint "whatsapp_messages_legacy_lead_message_id_fkey";

alter table "public"."whatsapp_messages" add constraint "whatsapp_messages_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."whatsapp_messages" validate constraint "whatsapp_messages_organization_id_fkey";

alter table "public"."whatsapp_messages" add constraint "whatsapp_messages_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'queued'::text, 'sent'::text, 'delivered'::text, 'read'::text, 'received'::text, 'failed'::text]))) not valid;

alter table "public"."whatsapp_messages" validate constraint "whatsapp_messages_status_check";

alter table "public"."whatsapp_templates" add constraint "whatsapp_templates_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) not valid;

alter table "public"."whatsapp_templates" validate constraint "whatsapp_templates_organization_id_fkey";

alter table "public"."whatsapp_webhook_events" add constraint "whatsapp_webhook_events_instance_id_fkey" FOREIGN KEY (instance_id) REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE not valid;

alter table "public"."whatsapp_webhook_events" validate constraint "whatsapp_webhook_events_instance_id_fkey";

alter table "public"."whatsapp_webhook_events" add constraint "whatsapp_webhook_events_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."whatsapp_webhook_events" validate constraint "whatsapp_webhook_events_organization_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_set_org_created_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.organization_id is null then
    select active_organization_id into new.organization_id
    from public.profiles
    where id = auth.uid();
  end if;

  if (new.created_by is null) then
    new.created_by := auth.uid();
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_set_org_only()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.organization_id is null then
    select active_organization_id into new.organization_id
    from public.profiles
    where id = auth.uid();
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_set_org_uploaded_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.organization_id is null then
    select active_organization_id into new.organization_id
    from public.profiles
    where id = auth.uid();
  end if;

  if (new.uploaded_by is null) then
    new.uploaded_by := auth.uid();
  end if;

  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.find_or_create_lead_by_phone(p_organization_id uuid, p_phone text, p_contact_name text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_lead_id uuid;
begin
  select l.id
    into v_lead_id
  from public.leads l
  where l.organization_id = p_organization_id
    and (
      l.whatsapp_phone = p_phone
      or l.phone = p_phone
      or l.contact_phone = p_phone
    )
  order by l.updated_at desc
  limit 1;

  if v_lead_id is not null then
    return v_lead_id;
  end if;

  insert into public.leads (
    organization_id,
    contractor_name,
    created_by,
    whatsapp_phone,
    phone,
    contact_phone,
    name,
    stage,
    source,
    origin,
    created_at,
    updated_at
  )
  values (
    p_organization_id,
    coalesce(p_contact_name, p_phone),
    (
      select o.created_by
      from public.organizations o
      where o.id = p_organization_id
      limit 1
    ),
    p_phone,
    p_phone,
    p_phone,
    p_contact_name,
    'Negociação',
    'whatsapp',
    'whatsapp',
    now(),
    now()
  )
  returning id into v_lead_id;

  return v_lead_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _org_id uuid;
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.organizations (id, name, created_by)
  VALUES (
    gen_random_uuid(),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Minha Organização'),
    NEW.id
  )
  RETURNING id INTO _org_id;

  INSERT INTO public.memberships (organization_id, user_id, role)
  VALUES (_org_id, NEW.id, 'admin')
  ON CONFLICT DO NOTHING;

  UPDATE public.profiles
  SET active_organization_id = _org_id
  WHERE id = NEW.id;

  INSERT INTO public.subscriptions (organization_id, plan, status)
  VALUES (_org_id, COALESCE(NEW.raw_user_meta_data->>'plan', 'starter'), 'active')
  ON CONFLICT (organization_id) DO NOTHING;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _role public.app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = _user_id AND m.organization_id = _org_id AND m.role = _role
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_confirmed_date_available(_org_id uuid, _start timestamp with time zone, _end timestamp with time zone, _ignore_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.calendar_events e
    WHERE e.organization_id = _org_id
      AND e.status = 'confirmed'
      AND (_ignore_id IS NULL OR e.id <> _ignore_id)
      AND (
        COALESCE(e.end_time, e.start_time) >= _start
        AND e.start_time <= COALESCE(_end, _start)
      )
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_member_of_org(_user_id uuid, _org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = _user_id AND m.organization_id = _org_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS(
    SELECT 1 FROM public.super_admins WHERE user_id = _user_id
  );
$function$
;

create or replace view "public"."lead_financial_summary" as  SELECT pp.id AS payment_plan_id,
    pp.organization_id,
    pp.lead_id,
    pp.model,
    pp.total_amount,
    COALESCE(sum(
        CASE
            WHEN (pi.status = 'pago'::text) THEN pi.paid_amount
            ELSE (0)::numeric
        END), (0)::numeric) AS received_amount,
    (pp.total_amount - COALESCE(sum(
        CASE
            WHEN (pi.status = 'pago'::text) THEN pi.paid_amount
            ELSE (0)::numeric
        END), (0)::numeric)) AS remaining_amount,
    (count(pi.id))::integer AS total_installments,
    (count(
        CASE
            WHEN (pi.status = 'pago'::text) THEN 1
            ELSE NULL::integer
        END))::integer AS paid_installments,
    (count(
        CASE
            WHEN (pi.status = 'atrasado'::text) THEN 1
            ELSE NULL::integer
        END))::integer AS overdue_count,
    min(
        CASE
            WHEN (pi.status = 'pendente'::text) THEN pi.due_date
            ELSE NULL::date
        END) AS next_due_date,
        CASE
            WHEN (count(
            CASE
                WHEN (pi.status = 'atrasado'::text) THEN 1
                ELSE NULL::integer
            END) > 0) THEN 'atrasado'::text
            WHEN ((count(
            CASE
                WHEN (pi.status = 'pendente'::text) THEN 1
                ELSE NULL::integer
            END) = 0) AND (count(pi.id) > 0)) THEN 'quitado'::text
            WHEN (count(
            CASE
                WHEN (pi.status = 'pago'::text) THEN 1
                ELSE NULL::integer
            END) > 0) THEN 'parcial'::text
            ELSE 'pendente'::text
        END AS payment_status
   FROM (public.payment_plans pp
     LEFT JOIN public.payment_installments pi ON ((pi.payment_plan_id = pp.id)))
  GROUP BY pp.id, pp.organization_id, pp.lead_id, pp.model, pp.total_amount;


CREATE OR REPLACE FUNCTION public.mark_overdue_installments(_org_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  UPDATE public.payment_installments
  SET status = 'atrasado', updated_at = now()
  WHERE organization_id = _org_id
    AND status = 'pendente'
    AND due_date < CURRENT_DATE;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_whatsapp_chat_as_read(p_chat_id uuid)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  v_lead_id uuid;
begin
  update public.whatsapp_chats
  set unread_count = 0,
      updated_at = now()
  where id = p_chat_id
  returning lead_id into v_lead_id;

  if v_lead_id is not null then
    update public.leads
    set unread_count = 0,
        updated_at = now()
    where id = v_lead_id;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.register_whatsapp_inbound(_org_id uuid, _lead_id uuid, _contact_phone text, _contact_name text, _stage text, _message_text text, _message_at timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  _normalized_phone text;
begin
  -- normaliza telefone: mantém só dígitos
  _normalized_phone := regexp_replace(coalesce(_contact_phone, ''), '\D', '', 'g');

  -- atualiza lead
  update public.leads
  set
    updated_at = _message_at,
    last_contact_at = _message_at,
    last_message_at = _message_at,
    last_message = _message_text,
    last_message_preview = _message_text,
    unread_count = coalesce(unread_count, 0) + 1,
    whatsapp_phone = case
      when coalesce(whatsapp_phone, '') = '' then _normalized_phone
      else whatsapp_phone
    end,
    contact_phone = case
      when coalesce(contact_phone, '') = '' then _normalized_phone
      else contact_phone
    end
  where id = _lead_id;

  -- sincroniza conversa
  insert into public.whatsapp_conversations (
    organization_id,
    lead_id,
    contact_phone,
    contact_name,
    stage,
    last_message,
    last_message_at,
    updated_at
  )
  values (
    _org_id,
    _lead_id,
    _normalized_phone,
    _contact_name,
    _stage,
    _message_text,
    _message_at,
    _message_at
  )
  on conflict (organization_id, contact_phone)
  do update set
    lead_id = excluded.lead_id,
    contact_name = excluded.contact_name,
    stage = excluded.stage,
    last_message = excluded.last_message,
    last_message_at = excluded.last_message_at,
    updated_at = excluded.updated_at;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.upsert_whatsapp_chat(p_organization_id uuid, p_instance_id uuid, p_contact_phone text, p_contact_name text DEFAULT NULL::text, p_last_message text DEFAULT NULL::text, p_last_message_at timestamp with time zone DEFAULT now(), p_increment_unread boolean DEFAULT false)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
declare
  v_chat_id uuid;
  v_lead_id uuid;
begin
  v_lead_id := public.find_or_create_lead_by_phone(
    p_organization_id,
    p_contact_phone,
    p_contact_name
  );

  insert into public.whatsapp_chats (
    organization_id,
    instance_id,
    lead_id,
    contact_phone,
    contact_name,
    last_message,
    last_message_at,
    unread_count
  )
  values (
    p_organization_id,
    p_instance_id,
    v_lead_id,
    p_contact_phone,
    p_contact_name,
    p_last_message,
    p_last_message_at,
    case when p_increment_unread then 1 else 0 end
  )
  on conflict (instance_id, contact_phone)
  do update set
    lead_id = coalesce(public.whatsapp_chats.lead_id, excluded.lead_id),
    contact_name = coalesce(excluded.contact_name, public.whatsapp_chats.contact_name),
    last_message = coalesce(excluded.last_message, public.whatsapp_chats.last_message),
    last_message_at = coalesce(excluded.last_message_at, public.whatsapp_chats.last_message_at),
    unread_count = case
      when p_increment_unread then public.whatsapp_chats.unread_count + 1
      else public.whatsapp_chats.unread_count
    end,
    updated_at = now()
  returning id into v_chat_id;

  update public.leads
  set
    last_message_at = p_last_message_at,
    last_message_preview = p_last_message,
    last_message = p_last_message,
    unread_count = case
      when p_increment_unread then coalesce(unread_count, 0) + 1
      else coalesce(unread_count, 0)
    end,
    updated_at = now()
  where id = v_lead_id;

  return v_chat_id;
end;
$function$
;

create or replace view "public"."v_whatsapp_inbox" as  SELECT c.id AS chat_id,
    c.organization_id,
    c.instance_id,
    c.lead_id,
    c.contact_phone,
    c.contact_name,
    c.last_message,
    c.last_message_at,
    c.unread_count,
    c.status,
    i.display_name AS instance_display_name,
    i.phone_number AS instance_phone_number,
    i.provider,
    i.status AS instance_status
   FROM (public.whatsapp_chats c
     JOIN public.whatsapp_instances i ON ((i.id = c.instance_id)));


CREATE OR REPLACE FUNCTION public.validate_calendar_event_conflicts()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'confirmed' THEN
    IF NOT public.is_confirmed_date_available(NEW.organization_id, NEW.start_time, NEW.end_time, NEW.id) THEN
      RAISE EXCEPTION 'Data indisponível: já existe show confirmado no mesmo período.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."activity_logs" to "anon";

grant insert on table "public"."activity_logs" to "anon";

grant select on table "public"."activity_logs" to "anon";

grant update on table "public"."activity_logs" to "anon";

grant delete on table "public"."activity_logs" to "authenticated";

grant insert on table "public"."activity_logs" to "authenticated";

grant select on table "public"."activity_logs" to "authenticated";

grant update on table "public"."activity_logs" to "authenticated";

grant delete on table "public"."activity_logs" to "service_role";

grant insert on table "public"."activity_logs" to "service_role";

grant select on table "public"."activity_logs" to "service_role";

grant update on table "public"."activity_logs" to "service_role";

grant delete on table "public"."calendar_events" to "anon";

grant insert on table "public"."calendar_events" to "anon";

grant select on table "public"."calendar_events" to "anon";

grant update on table "public"."calendar_events" to "anon";

grant delete on table "public"."calendar_events" to "authenticated";

grant insert on table "public"."calendar_events" to "authenticated";

grant select on table "public"."calendar_events" to "authenticated";

grant update on table "public"."calendar_events" to "authenticated";

grant delete on table "public"."calendar_events" to "service_role";

grant insert on table "public"."calendar_events" to "service_role";

grant select on table "public"."calendar_events" to "service_role";

grant update on table "public"."calendar_events" to "service_role";

grant delete on table "public"."contacts" to "anon";

grant insert on table "public"."contacts" to "anon";

grant select on table "public"."contacts" to "anon";

grant update on table "public"."contacts" to "anon";

grant delete on table "public"."contacts" to "authenticated";

grant insert on table "public"."contacts" to "authenticated";

grant select on table "public"."contacts" to "authenticated";

grant update on table "public"."contacts" to "authenticated";

grant delete on table "public"."contacts" to "service_role";

grant insert on table "public"."contacts" to "service_role";

grant select on table "public"."contacts" to "service_role";

grant update on table "public"."contacts" to "service_role";

grant delete on table "public"."contract_templates" to "anon";

grant insert on table "public"."contract_templates" to "anon";

grant select on table "public"."contract_templates" to "anon";

grant update on table "public"."contract_templates" to "anon";

grant delete on table "public"."contract_templates" to "authenticated";

grant insert on table "public"."contract_templates" to "authenticated";

grant select on table "public"."contract_templates" to "authenticated";

grant update on table "public"."contract_templates" to "authenticated";

grant delete on table "public"."contract_templates" to "service_role";

grant insert on table "public"."contract_templates" to "service_role";

grant select on table "public"."contract_templates" to "service_role";

grant update on table "public"."contract_templates" to "service_role";

grant delete on table "public"."contracts" to "anon";

grant insert on table "public"."contracts" to "anon";

grant select on table "public"."contracts" to "anon";

grant update on table "public"."contracts" to "anon";

grant delete on table "public"."contracts" to "authenticated";

grant insert on table "public"."contracts" to "authenticated";

grant select on table "public"."contracts" to "authenticated";

grant update on table "public"."contracts" to "authenticated";

grant delete on table "public"."contracts" to "service_role";

grant insert on table "public"."contracts" to "service_role";

grant select on table "public"."contracts" to "service_role";

grant update on table "public"."contracts" to "service_role";

grant delete on table "public"."entity_tags" to "anon";

grant insert on table "public"."entity_tags" to "anon";

grant select on table "public"."entity_tags" to "anon";

grant update on table "public"."entity_tags" to "anon";

grant delete on table "public"."entity_tags" to "authenticated";

grant insert on table "public"."entity_tags" to "authenticated";

grant select on table "public"."entity_tags" to "authenticated";

grant update on table "public"."entity_tags" to "authenticated";

grant delete on table "public"."entity_tags" to "service_role";

grant insert on table "public"."entity_tags" to "service_role";

grant select on table "public"."entity_tags" to "service_role";

grant update on table "public"."entity_tags" to "service_role";

grant delete on table "public"."finance_transactions" to "anon";

grant insert on table "public"."finance_transactions" to "anon";

grant select on table "public"."finance_transactions" to "anon";

grant update on table "public"."finance_transactions" to "anon";

grant delete on table "public"."finance_transactions" to "authenticated";

grant insert on table "public"."finance_transactions" to "authenticated";

grant select on table "public"."finance_transactions" to "authenticated";

grant update on table "public"."finance_transactions" to "authenticated";

grant delete on table "public"."finance_transactions" to "service_role";

grant insert on table "public"."finance_transactions" to "service_role";

grant select on table "public"."finance_transactions" to "service_role";

grant update on table "public"."finance_transactions" to "service_role";

grant delete on table "public"."funnel_stages" to "anon";

grant insert on table "public"."funnel_stages" to "anon";

grant select on table "public"."funnel_stages" to "anon";

grant update on table "public"."funnel_stages" to "anon";

grant delete on table "public"."funnel_stages" to "authenticated";

grant insert on table "public"."funnel_stages" to "authenticated";

grant select on table "public"."funnel_stages" to "authenticated";

grant update on table "public"."funnel_stages" to "authenticated";

grant delete on table "public"."funnel_stages" to "service_role";

grant insert on table "public"."funnel_stages" to "service_role";

grant select on table "public"."funnel_stages" to "service_role";

grant update on table "public"."funnel_stages" to "service_role";

grant delete on table "public"."lead_interactions" to "anon";

grant insert on table "public"."lead_interactions" to "anon";

grant select on table "public"."lead_interactions" to "anon";

grant update on table "public"."lead_interactions" to "anon";

grant delete on table "public"."lead_interactions" to "authenticated";

grant insert on table "public"."lead_interactions" to "authenticated";

grant select on table "public"."lead_interactions" to "authenticated";

grant update on table "public"."lead_interactions" to "authenticated";

grant delete on table "public"."lead_interactions" to "service_role";

grant insert on table "public"."lead_interactions" to "service_role";

grant references on table "public"."lead_interactions" to "service_role";

grant select on table "public"."lead_interactions" to "service_role";

grant trigger on table "public"."lead_interactions" to "service_role";

grant truncate on table "public"."lead_interactions" to "service_role";

grant update on table "public"."lead_interactions" to "service_role";

grant delete on table "public"."lead_messages" to "anon";

grant insert on table "public"."lead_messages" to "anon";

grant select on table "public"."lead_messages" to "anon";

grant update on table "public"."lead_messages" to "anon";

grant delete on table "public"."lead_messages" to "authenticated";

grant insert on table "public"."lead_messages" to "authenticated";

grant select on table "public"."lead_messages" to "authenticated";

grant update on table "public"."lead_messages" to "authenticated";

grant delete on table "public"."lead_messages" to "service_role";

grant insert on table "public"."lead_messages" to "service_role";

grant references on table "public"."lead_messages" to "service_role";

grant select on table "public"."lead_messages" to "service_role";

grant trigger on table "public"."lead_messages" to "service_role";

grant truncate on table "public"."lead_messages" to "service_role";

grant update on table "public"."lead_messages" to "service_role";

grant delete on table "public"."leads" to "anon";

grant insert on table "public"."leads" to "anon";

grant select on table "public"."leads" to "anon";

grant update on table "public"."leads" to "anon";

grant delete on table "public"."leads" to "authenticated";

grant insert on table "public"."leads" to "authenticated";

grant select on table "public"."leads" to "authenticated";

grant update on table "public"."leads" to "authenticated";

grant delete on table "public"."leads" to "service_role";

grant insert on table "public"."leads" to "service_role";

grant select on table "public"."leads" to "service_role";

grant update on table "public"."leads" to "service_role";

grant delete on table "public"."memberships" to "anon";

grant insert on table "public"."memberships" to "anon";

grant select on table "public"."memberships" to "anon";

grant update on table "public"."memberships" to "anon";

grant delete on table "public"."memberships" to "authenticated";

grant insert on table "public"."memberships" to "authenticated";

grant select on table "public"."memberships" to "authenticated";

grant update on table "public"."memberships" to "authenticated";

grant delete on table "public"."memberships" to "service_role";

grant insert on table "public"."memberships" to "service_role";

grant select on table "public"."memberships" to "service_role";

grant update on table "public"."memberships" to "service_role";

grant delete on table "public"."message_queue" to "anon";

grant insert on table "public"."message_queue" to "anon";

grant select on table "public"."message_queue" to "anon";

grant update on table "public"."message_queue" to "anon";

grant delete on table "public"."message_queue" to "authenticated";

grant insert on table "public"."message_queue" to "authenticated";

grant select on table "public"."message_queue" to "authenticated";

grant update on table "public"."message_queue" to "authenticated";

grant delete on table "public"."message_queue" to "service_role";

grant insert on table "public"."message_queue" to "service_role";

grant references on table "public"."message_queue" to "service_role";

grant select on table "public"."message_queue" to "service_role";

grant trigger on table "public"."message_queue" to "service_role";

grant truncate on table "public"."message_queue" to "service_role";

grant update on table "public"."message_queue" to "service_role";

grant delete on table "public"."notes" to "anon";

grant insert on table "public"."notes" to "anon";

grant select on table "public"."notes" to "anon";

grant update on table "public"."notes" to "anon";

grant delete on table "public"."notes" to "authenticated";

grant insert on table "public"."notes" to "authenticated";

grant select on table "public"."notes" to "authenticated";

grant update on table "public"."notes" to "authenticated";

grant delete on table "public"."notes" to "service_role";

grant insert on table "public"."notes" to "service_role";

grant select on table "public"."notes" to "service_role";

grant update on table "public"."notes" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."organizations" to "anon";

grant insert on table "public"."organizations" to "anon";

grant select on table "public"."organizations" to "anon";

grant update on table "public"."organizations" to "anon";

grant delete on table "public"."organizations" to "authenticated";

grant insert on table "public"."organizations" to "authenticated";

grant select on table "public"."organizations" to "authenticated";

grant update on table "public"."organizations" to "authenticated";

grant delete on table "public"."organizations" to "service_role";

grant insert on table "public"."organizations" to "service_role";

grant select on table "public"."organizations" to "service_role";

grant update on table "public"."organizations" to "service_role";

grant delete on table "public"."payment_installments" to "anon";

grant insert on table "public"."payment_installments" to "anon";

grant select on table "public"."payment_installments" to "anon";

grant update on table "public"."payment_installments" to "anon";

grant delete on table "public"."payment_installments" to "authenticated";

grant insert on table "public"."payment_installments" to "authenticated";

grant select on table "public"."payment_installments" to "authenticated";

grant update on table "public"."payment_installments" to "authenticated";

grant delete on table "public"."payment_installments" to "service_role";

grant insert on table "public"."payment_installments" to "service_role";

grant select on table "public"."payment_installments" to "service_role";

grant update on table "public"."payment_installments" to "service_role";

grant delete on table "public"."payment_plans" to "anon";

grant insert on table "public"."payment_plans" to "anon";

grant select on table "public"."payment_plans" to "anon";

grant update on table "public"."payment_plans" to "anon";

grant delete on table "public"."payment_plans" to "authenticated";

grant insert on table "public"."payment_plans" to "authenticated";

grant select on table "public"."payment_plans" to "authenticated";

grant update on table "public"."payment_plans" to "authenticated";

grant delete on table "public"."payment_plans" to "service_role";

grant insert on table "public"."payment_plans" to "service_role";

grant select on table "public"."payment_plans" to "service_role";

grant update on table "public"."payment_plans" to "service_role";

grant delete on table "public"."payment_receipts" to "anon";

grant insert on table "public"."payment_receipts" to "anon";

grant select on table "public"."payment_receipts" to "anon";

grant update on table "public"."payment_receipts" to "anon";

grant delete on table "public"."payment_receipts" to "authenticated";

grant insert on table "public"."payment_receipts" to "authenticated";

grant select on table "public"."payment_receipts" to "authenticated";

grant update on table "public"."payment_receipts" to "authenticated";

grant delete on table "public"."payment_receipts" to "service_role";

grant insert on table "public"."payment_receipts" to "service_role";

grant select on table "public"."payment_receipts" to "service_role";

grant update on table "public"."payment_receipts" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."region_cities" to "anon";

grant insert on table "public"."region_cities" to "anon";

grant select on table "public"."region_cities" to "anon";

grant update on table "public"."region_cities" to "anon";

grant delete on table "public"."region_cities" to "authenticated";

grant insert on table "public"."region_cities" to "authenticated";

grant select on table "public"."region_cities" to "authenticated";

grant update on table "public"."region_cities" to "authenticated";

grant delete on table "public"."region_cities" to "service_role";

grant insert on table "public"."region_cities" to "service_role";

grant select on table "public"."region_cities" to "service_role";

grant update on table "public"."region_cities" to "service_role";

grant delete on table "public"."regions" to "anon";

grant insert on table "public"."regions" to "anon";

grant select on table "public"."regions" to "anon";

grant update on table "public"."regions" to "anon";

grant delete on table "public"."regions" to "authenticated";

grant insert on table "public"."regions" to "authenticated";

grant select on table "public"."regions" to "authenticated";

grant update on table "public"."regions" to "authenticated";

grant delete on table "public"."regions" to "service_role";

grant insert on table "public"."regions" to "service_role";

grant select on table "public"."regions" to "service_role";

grant update on table "public"."regions" to "service_role";

grant delete on table "public"."riders" to "anon";

grant insert on table "public"."riders" to "anon";

grant select on table "public"."riders" to "anon";

grant update on table "public"."riders" to "anon";

grant delete on table "public"."riders" to "authenticated";

grant insert on table "public"."riders" to "authenticated";

grant select on table "public"."riders" to "authenticated";

grant update on table "public"."riders" to "authenticated";

grant delete on table "public"."riders" to "service_role";

grant insert on table "public"."riders" to "service_role";

grant select on table "public"."riders" to "service_role";

grant update on table "public"."riders" to "service_role";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

grant delete on table "public"."super_admins" to "anon";

grant insert on table "public"."super_admins" to "anon";

grant select on table "public"."super_admins" to "anon";

grant update on table "public"."super_admins" to "anon";

grant delete on table "public"."super_admins" to "authenticated";

grant insert on table "public"."super_admins" to "authenticated";

grant select on table "public"."super_admins" to "authenticated";

grant update on table "public"."super_admins" to "authenticated";

grant delete on table "public"."super_admins" to "service_role";

grant insert on table "public"."super_admins" to "service_role";

grant select on table "public"."super_admins" to "service_role";

grant update on table "public"."super_admins" to "service_role";

grant delete on table "public"."tags" to "anon";

grant insert on table "public"."tags" to "anon";

grant select on table "public"."tags" to "anon";

grant update on table "public"."tags" to "anon";

grant delete on table "public"."tags" to "authenticated";

grant insert on table "public"."tags" to "authenticated";

grant select on table "public"."tags" to "authenticated";

grant update on table "public"."tags" to "authenticated";

grant delete on table "public"."tags" to "service_role";

grant insert on table "public"."tags" to "service_role";

grant select on table "public"."tags" to "service_role";

grant update on table "public"."tags" to "service_role";

grant delete on table "public"."tasks" to "anon";

grant insert on table "public"."tasks" to "anon";

grant select on table "public"."tasks" to "anon";

grant update on table "public"."tasks" to "anon";

grant delete on table "public"."tasks" to "authenticated";

grant insert on table "public"."tasks" to "authenticated";

grant select on table "public"."tasks" to "authenticated";

grant update on table "public"."tasks" to "authenticated";

grant delete on table "public"."tasks" to "service_role";

grant insert on table "public"."tasks" to "service_role";

grant select on table "public"."tasks" to "service_role";

grant update on table "public"."tasks" to "service_role";

grant delete on table "public"."team_members" to "anon";

grant insert on table "public"."team_members" to "anon";

grant select on table "public"."team_members" to "anon";

grant update on table "public"."team_members" to "anon";

grant delete on table "public"."team_members" to "authenticated";

grant insert on table "public"."team_members" to "authenticated";

grant select on table "public"."team_members" to "authenticated";

grant update on table "public"."team_members" to "authenticated";

grant delete on table "public"."team_members" to "service_role";

grant insert on table "public"."team_members" to "service_role";

grant select on table "public"."team_members" to "service_role";

grant update on table "public"."team_members" to "service_role";

grant delete on table "public"."venues" to "anon";

grant insert on table "public"."venues" to "anon";

grant select on table "public"."venues" to "anon";

grant update on table "public"."venues" to "anon";

grant delete on table "public"."venues" to "authenticated";

grant insert on table "public"."venues" to "authenticated";

grant select on table "public"."venues" to "authenticated";

grant update on table "public"."venues" to "authenticated";

grant delete on table "public"."venues" to "service_role";

grant insert on table "public"."venues" to "service_role";

grant select on table "public"."venues" to "service_role";

grant update on table "public"."venues" to "service_role";

grant delete on table "public"."whatsapp_chats" to "anon";

grant insert on table "public"."whatsapp_chats" to "anon";

grant select on table "public"."whatsapp_chats" to "anon";

grant update on table "public"."whatsapp_chats" to "anon";

grant delete on table "public"."whatsapp_chats" to "authenticated";

grant insert on table "public"."whatsapp_chats" to "authenticated";

grant select on table "public"."whatsapp_chats" to "authenticated";

grant update on table "public"."whatsapp_chats" to "authenticated";

grant delete on table "public"."whatsapp_chats" to "service_role";

grant insert on table "public"."whatsapp_chats" to "service_role";

grant select on table "public"."whatsapp_chats" to "service_role";

grant update on table "public"."whatsapp_chats" to "service_role";

grant delete on table "public"."whatsapp_conversations" to "anon";

grant insert on table "public"."whatsapp_conversations" to "anon";

grant select on table "public"."whatsapp_conversations" to "anon";

grant update on table "public"."whatsapp_conversations" to "anon";

grant delete on table "public"."whatsapp_conversations" to "authenticated";

grant insert on table "public"."whatsapp_conversations" to "authenticated";

grant select on table "public"."whatsapp_conversations" to "authenticated";

grant update on table "public"."whatsapp_conversations" to "authenticated";

grant delete on table "public"."whatsapp_conversations" to "service_role";

grant insert on table "public"."whatsapp_conversations" to "service_role";

grant references on table "public"."whatsapp_conversations" to "service_role";

grant select on table "public"."whatsapp_conversations" to "service_role";

grant trigger on table "public"."whatsapp_conversations" to "service_role";

grant truncate on table "public"."whatsapp_conversations" to "service_role";

grant update on table "public"."whatsapp_conversations" to "service_role";

grant delete on table "public"."whatsapp_followups" to "anon";

grant insert on table "public"."whatsapp_followups" to "anon";

grant select on table "public"."whatsapp_followups" to "anon";

grant update on table "public"."whatsapp_followups" to "anon";

grant delete on table "public"."whatsapp_followups" to "authenticated";

grant insert on table "public"."whatsapp_followups" to "authenticated";

grant select on table "public"."whatsapp_followups" to "authenticated";

grant update on table "public"."whatsapp_followups" to "authenticated";

grant delete on table "public"."whatsapp_followups" to "service_role";

grant insert on table "public"."whatsapp_followups" to "service_role";

grant references on table "public"."whatsapp_followups" to "service_role";

grant select on table "public"."whatsapp_followups" to "service_role";

grant trigger on table "public"."whatsapp_followups" to "service_role";

grant truncate on table "public"."whatsapp_followups" to "service_role";

grant update on table "public"."whatsapp_followups" to "service_role";

grant delete on table "public"."whatsapp_instances" to "anon";

grant insert on table "public"."whatsapp_instances" to "anon";

grant select on table "public"."whatsapp_instances" to "anon";

grant update on table "public"."whatsapp_instances" to "anon";

grant delete on table "public"."whatsapp_instances" to "authenticated";

grant insert on table "public"."whatsapp_instances" to "authenticated";

grant select on table "public"."whatsapp_instances" to "authenticated";

grant update on table "public"."whatsapp_instances" to "authenticated";

grant delete on table "public"."whatsapp_instances" to "service_role";

grant insert on table "public"."whatsapp_instances" to "service_role";

grant select on table "public"."whatsapp_instances" to "service_role";

grant update on table "public"."whatsapp_instances" to "service_role";

grant delete on table "public"."whatsapp_messages" to "anon";

grant insert on table "public"."whatsapp_messages" to "anon";

grant select on table "public"."whatsapp_messages" to "anon";

grant update on table "public"."whatsapp_messages" to "anon";

grant delete on table "public"."whatsapp_messages" to "authenticated";

grant insert on table "public"."whatsapp_messages" to "authenticated";

grant select on table "public"."whatsapp_messages" to "authenticated";

grant update on table "public"."whatsapp_messages" to "authenticated";

grant delete on table "public"."whatsapp_messages" to "service_role";

grant insert on table "public"."whatsapp_messages" to "service_role";

grant select on table "public"."whatsapp_messages" to "service_role";

grant update on table "public"."whatsapp_messages" to "service_role";

grant delete on table "public"."whatsapp_templates" to "anon";

grant insert on table "public"."whatsapp_templates" to "anon";

grant select on table "public"."whatsapp_templates" to "anon";

grant update on table "public"."whatsapp_templates" to "anon";

grant delete on table "public"."whatsapp_templates" to "authenticated";

grant insert on table "public"."whatsapp_templates" to "authenticated";

grant select on table "public"."whatsapp_templates" to "authenticated";

grant update on table "public"."whatsapp_templates" to "authenticated";

grant delete on table "public"."whatsapp_templates" to "service_role";

grant insert on table "public"."whatsapp_templates" to "service_role";

grant references on table "public"."whatsapp_templates" to "service_role";

grant select on table "public"."whatsapp_templates" to "service_role";

grant trigger on table "public"."whatsapp_templates" to "service_role";

grant truncate on table "public"."whatsapp_templates" to "service_role";

grant update on table "public"."whatsapp_templates" to "service_role";

grant delete on table "public"."whatsapp_webhook_events" to "anon";

grant insert on table "public"."whatsapp_webhook_events" to "anon";

grant select on table "public"."whatsapp_webhook_events" to "anon";

grant update on table "public"."whatsapp_webhook_events" to "anon";

grant delete on table "public"."whatsapp_webhook_events" to "authenticated";

grant insert on table "public"."whatsapp_webhook_events" to "authenticated";

grant select on table "public"."whatsapp_webhook_events" to "authenticated";

grant update on table "public"."whatsapp_webhook_events" to "authenticated";

grant delete on table "public"."whatsapp_webhook_events" to "service_role";

grant insert on table "public"."whatsapp_webhook_events" to "service_role";

grant select on table "public"."whatsapp_webhook_events" to "service_role";

grant update on table "public"."whatsapp_webhook_events" to "service_role";


  create policy "activity_logs_insert_org"
  on "public"."activity_logs"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (user_id = auth.uid())));



  create policy "activity_logs_select_org"
  on "public"."activity_logs"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "calendar_events_select_org"
  on "public"."calendar_events"
  as permissive
  for select
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "calendar_events_update_roles"
  on "public"."calendar_events"
  as permissive
  for update
  to authenticated
using ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))))
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))));



  create policy "calendar_events_write_roles"
  on "public"."calendar_events"
  as permissive
  for insert
  to authenticated
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)) AND (created_by = auth.uid())));



  create policy "contacts_delete_org"
  on "public"."contacts"
  as permissive
  for delete
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "contacts_insert_org"
  on "public"."contacts"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (created_by = auth.uid())));



  create policy "contacts_select_org"
  on "public"."contacts"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "contacts_update_org"
  on "public"."contacts"
  as permissive
  for update
  to public
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "contract_templates_delete_org"
  on "public"."contract_templates"
  as permissive
  for delete
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "contract_templates_insert_org"
  on "public"."contract_templates"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (created_by = auth.uid())));



  create policy "contract_templates_select_org"
  on "public"."contract_templates"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "contract_templates_update_org"
  on "public"."contract_templates"
  as permissive
  for update
  to public
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "contracts_select_org"
  on "public"."contracts"
  as permissive
  for select
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "contracts_update_roles"
  on "public"."contracts"
  as permissive
  for update
  to authenticated
using ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))))
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))));



  create policy "contracts_write_roles"
  on "public"."contracts"
  as permissive
  for insert
  to authenticated
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)) AND (created_by = auth.uid())));



  create policy "entity_tags_delete"
  on "public"."entity_tags"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.tags t
  WHERE ((t.id = entity_tags.tag_id) AND public.is_member_of_org(auth.uid(), t.organization_id)))));



  create policy "entity_tags_insert"
  on "public"."entity_tags"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.tags t
  WHERE ((t.id = entity_tags.tag_id) AND public.is_member_of_org(auth.uid(), t.organization_id)))));



  create policy "entity_tags_select"
  on "public"."entity_tags"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.tags t
  WHERE ((t.id = entity_tags.tag_id) AND public.is_member_of_org(auth.uid(), t.organization_id)))));



  create policy "finance_delete_org"
  on "public"."finance_transactions"
  as permissive
  for delete
  to public
using ((public.is_member_of_org(auth.uid(), organization_id) AND public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)));



  create policy "finance_insert_org"
  on "public"."finance_transactions"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)) AND (created_by = auth.uid())));



  create policy "finance_select_org"
  on "public"."finance_transactions"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "finance_update_org"
  on "public"."finance_transactions"
  as permissive
  for update
  to public
using ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))))
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))));



  create policy "Members can delete funnel stages"
  on "public"."funnel_stages"
  as permissive
  for delete
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "Members can insert funnel stages"
  on "public"."funnel_stages"
  as permissive
  for insert
  to authenticated
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "Members can update funnel stages"
  on "public"."funnel_stages"
  as permissive
  for update
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "Members can view funnel stages"
  on "public"."funnel_stages"
  as permissive
  for select
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "funnel_stages_delete_org"
  on "public"."funnel_stages"
  as permissive
  for delete
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "funnel_stages_insert_org"
  on "public"."funnel_stages"
  as permissive
  for insert
  to authenticated
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "funnel_stages_select_org"
  on "public"."funnel_stages"
  as permissive
  for select
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "funnel_stages_update_org"
  on "public"."funnel_stages"
  as permissive
  for update
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "Members can manage lead_interactions"
  on "public"."lead_interactions"
  as permissive
  for all
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "lead_messages_insert_org"
  on "public"."lead_messages"
  as permissive
  for insert
  to public
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "lead_messages_select_org"
  on "public"."lead_messages"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "leads_insert_commercial_admin"
  on "public"."leads"
  as permissive
  for insert
  to authenticated
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)) AND (created_by = auth.uid())));



  create policy "leads_select_org"
  on "public"."leads"
  as permissive
  for select
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "leads_update_commercial_admin"
  on "public"."leads"
  as permissive
  for update
  to authenticated
using ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))))
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))));



  create policy "memberships_delete_admin"
  on "public"."memberships"
  as permissive
  for delete
  to authenticated
using (public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role));



  create policy "memberships_insert_admin"
  on "public"."memberships"
  as permissive
  for insert
  to authenticated
with check ((public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role) AND (user_id <> auth.uid())));



  create policy "memberships_select"
  on "public"."memberships"
  as permissive
  for select
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "memberships_select_own"
  on "public"."memberships"
  as permissive
  for select
  to authenticated
using (((user_id = auth.uid()) OR public.is_super_admin(auth.uid())));



  create policy "memberships_select_super"
  on "public"."memberships"
  as permissive
  for select
  to authenticated
using (public.is_super_admin(auth.uid()));



  create policy "memberships_update_admin"
  on "public"."memberships"
  as permissive
  for update
  to authenticated
using (public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))
with check (public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role));



  create policy "memberships_update_super"
  on "public"."memberships"
  as permissive
  for update
  to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));



  create policy "Members can manage message_queue"
  on "public"."message_queue"
  as permissive
  for all
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "notes_delete_own"
  on "public"."notes"
  as permissive
  for delete
  to public
using ((created_by = auth.uid()));



  create policy "notes_insert_org"
  on "public"."notes"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (created_by = auth.uid())));



  create policy "notes_select_org"
  on "public"."notes"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "notes_update_own"
  on "public"."notes"
  as permissive
  for update
  to public
using ((created_by = auth.uid()))
with check ((created_by = auth.uid()));



  create policy "notifications_delete_own"
  on "public"."notifications"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "notifications_insert_org"
  on "public"."notifications"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (created_by = auth.uid())));



  create policy "notifications_select_own"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "notifications_update_own"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "org_select"
  on "public"."organizations"
  as permissive
  for select
  to authenticated
using (public.is_member_of_org(auth.uid(), id));



  create policy "org_select_super"
  on "public"."organizations"
  as permissive
  for select
  to authenticated
using (public.is_super_admin(auth.uid()));



  create policy "pi_delete_org"
  on "public"."payment_installments"
  as permissive
  for delete
  to public
using ((public.is_member_of_org(auth.uid(), organization_id) AND public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)));



  create policy "pi_insert_org"
  on "public"."payment_installments"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role)) AND (created_by = auth.uid())));



  create policy "pi_select_org"
  on "public"."payment_installments"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "pi_update_org"
  on "public"."payment_installments"
  as permissive
  for update
  to public
using ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))))
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))));



  create policy "pp_delete_org"
  on "public"."payment_plans"
  as permissive
  for delete
  to public
using ((public.is_member_of_org(auth.uid(), organization_id) AND public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)));



  create policy "pp_insert_org"
  on "public"."payment_plans"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'comercial'::public.app_role)) AND (created_by = auth.uid())));



  create policy "pp_select_org"
  on "public"."payment_plans"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "pp_update_org"
  on "public"."payment_plans"
  as permissive
  for update
  to public
using ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))))
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role))));



  create policy "pr_delete_org"
  on "public"."payment_receipts"
  as permissive
  for delete
  to public
using ((public.is_member_of_org(auth.uid(), organization_id) AND public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)));



  create policy "pr_insert_org"
  on "public"."payment_receipts"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (public.has_org_role(auth.uid(), organization_id, 'financeiro'::public.app_role) OR public.has_org_role(auth.uid(), organization_id, 'admin'::public.app_role)) AND (uploaded_by = auth.uid())));



  create policy "pr_select_org"
  on "public"."payment_receipts"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "profiles_select_own"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = id));



  create policy "profiles_select_super"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using (public.is_super_admin(auth.uid()));



  create policy "profiles_update_own"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "region_cities_delete"
  on "public"."region_cities"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.regions r
  WHERE ((r.id = region_cities.region_id) AND public.is_member_of_org(auth.uid(), r.organization_id)))));



  create policy "region_cities_insert"
  on "public"."region_cities"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.regions r
  WHERE ((r.id = region_cities.region_id) AND public.is_member_of_org(auth.uid(), r.organization_id)))));



  create policy "region_cities_select"
  on "public"."region_cities"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.regions r
  WHERE ((r.id = region_cities.region_id) AND public.is_member_of_org(auth.uid(), r.organization_id)))));



  create policy "regions_delete_org"
  on "public"."regions"
  as permissive
  for delete
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "regions_insert_org"
  on "public"."regions"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (created_by = auth.uid())));



  create policy "regions_select_org"
  on "public"."regions"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "regions_update_org"
  on "public"."regions"
  as permissive
  for update
  to public
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "riders_delete_org"
  on "public"."riders"
  as permissive
  for delete
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "riders_insert_org"
  on "public"."riders"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (created_by = auth.uid())));



  create policy "riders_select_org"
  on "public"."riders"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "riders_update_org"
  on "public"."riders"
  as permissive
  for update
  to public
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "sub_insert_super"
  on "public"."subscriptions"
  as permissive
  for insert
  to authenticated
with check (public.is_super_admin(auth.uid()));



  create policy "sub_select_org"
  on "public"."subscriptions"
  as permissive
  for select
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "sub_select_super"
  on "public"."subscriptions"
  as permissive
  for select
  to authenticated
using (public.is_super_admin(auth.uid()));



  create policy "sub_update_super"
  on "public"."subscriptions"
  as permissive
  for update
  to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));



  create policy "super_admins_select"
  on "public"."super_admins"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "tags_delete_org"
  on "public"."tags"
  as permissive
  for delete
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "tags_insert_org"
  on "public"."tags"
  as permissive
  for insert
  to public
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "tags_select_org"
  on "public"."tags"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "tags_update_org"
  on "public"."tags"
  as permissive
  for update
  to public
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "tasks_delete_org"
  on "public"."tasks"
  as permissive
  for delete
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "tasks_insert_org"
  on "public"."tasks"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (created_by = auth.uid())));



  create policy "tasks_select_org"
  on "public"."tasks"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "tasks_update_org"
  on "public"."tasks"
  as permissive
  for update
  to public
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "team_members_delete_org"
  on "public"."team_members"
  as permissive
  for delete
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "team_members_insert_org"
  on "public"."team_members"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (created_by = auth.uid())));



  create policy "team_members_select_org"
  on "public"."team_members"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "team_members_update_org"
  on "public"."team_members"
  as permissive
  for update
  to public
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "venues_delete_org"
  on "public"."venues"
  as permissive
  for delete
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "venues_insert_org"
  on "public"."venues"
  as permissive
  for insert
  to public
with check ((public.is_member_of_org(auth.uid(), organization_id) AND (created_by = auth.uid())));



  create policy "venues_select_org"
  on "public"."venues"
  as permissive
  for select
  to public
using (public.is_member_of_org(auth.uid(), organization_id));



  create policy "venues_update_org"
  on "public"."venues"
  as permissive
  for update
  to public
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "Members can manage whatsapp_conversations"
  on "public"."whatsapp_conversations"
  as permissive
  for all
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "Members can manage whatsapp_followups"
  on "public"."whatsapp_followups"
  as permissive
  for all
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));



  create policy "Members can manage whatsapp_templates"
  on "public"."whatsapp_templates"
  as permissive
  for all
  to authenticated
using (public.is_member_of_org(auth.uid(), organization_id))
with check (public.is_member_of_org(auth.uid(), organization_id));


CREATE TRIGGER set_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_calendar_events BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_calendar_events BEFORE INSERT ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER trg_validate_calendar_conflicts BEFORE INSERT OR UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.validate_calendar_event_conflicts();

CREATE TRIGGER validate_calendar_event_conflicts_trigger BEFORE INSERT OR UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.validate_calendar_event_conflicts();

CREATE TRIGGER set_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_contacts BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_contacts BEFORE INSERT ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER set_contract_templates_updated_at BEFORE UPDATE ON public.contract_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_contract_templates BEFORE UPDATE ON public.contract_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_contract_templates BEFORE INSERT ON public.contract_templates FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER set_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_contracts BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_contracts BEFORE INSERT ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER set_finance_transactions_updated_at BEFORE UPDATE ON public.finance_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_finance_transactions BEFORE UPDATE ON public.finance_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_finance_transactions BEFORE INSERT ON public.finance_transactions FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER trg_autofill_lead_messages BEFORE INSERT ON public.lead_messages FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_only();

CREATE TRIGGER set_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_leads BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_leads BEFORE INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER set_message_queue_updated_at BEFORE UPDATE ON public.message_queue FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_notes BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_notes BEFORE INSERT ON public.notes FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER set_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_payment_installments_updated_at BEFORE UPDATE ON public.payment_installments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_payment_installments BEFORE UPDATE ON public.payment_installments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_payment_installments BEFORE INSERT ON public.payment_installments FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER set_payment_plans_updated_at BEFORE UPDATE ON public.payment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_payment_plans BEFORE UPDATE ON public.payment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_payment_plans BEFORE INSERT ON public.payment_plans FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER trg_autofill_payment_receipts BEFORE INSERT ON public.payment_receipts FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_uploaded_by();

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_regions BEFORE INSERT ON public.regions FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER set_riders_updated_at BEFORE UPDATE ON public.riders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_riders BEFORE UPDATE ON public.riders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_riders BEFORE INSERT ON public.riders FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_tasks BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_tasks BEFORE INSERT ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER set_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_updated_at_team_members BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_team_members BEFORE INSERT ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER set_updated_at_venues BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_venues_updated_at BEFORE UPDATE ON public.venues FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_autofill_venues BEFORE INSERT ON public.venues FOR EACH ROW EXECUTE FUNCTION public.auto_set_org_created_by();

CREATE TRIGGER trg_whatsapp_chats_updated_at BEFORE UPDATE ON public.whatsapp_chats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_whatsapp_conversations_updated_at BEFORE UPDATE ON public.whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_whatsapp_followups_updated_at BEFORE UPDATE ON public.whatsapp_followups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "receipts_delete"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'receipts'::text));



  create policy "receipts_insert"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'receipts'::text));



  create policy "receipts_select"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'receipts'::text));



