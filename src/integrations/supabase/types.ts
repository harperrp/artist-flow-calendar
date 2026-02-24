export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          new_value: Json | null
          old_value: Json | null
          organization_id: string
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          new_value?: Json | null
          old_value?: Json | null
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          city: string | null
          contract_id: string | null
          contract_status: Database["public"]["Enums"]["contract_status"] | null
          contractor_name: string | null
          created_at: string
          created_by: string
          end_time: string | null
          fee: number | null
          id: string
          latitude: number | null
          lead_id: string | null
          longitude: number | null
          notes: string | null
          organization_id: string
          stage: Database["public"]["Enums"]["funnel_stage"] | null
          start_time: string
          state: string | null
          status: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at: string
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          city?: string | null
          contract_id?: string | null
          contract_status?:
            | Database["public"]["Enums"]["contract_status"]
            | null
          contractor_name?: string | null
          created_at?: string
          created_by: string
          end_time?: string | null
          fee?: number | null
          id?: string
          latitude?: number | null
          lead_id?: string | null
          longitude?: number | null
          notes?: string | null
          organization_id: string
          stage?: Database["public"]["Enums"]["funnel_stage"] | null
          start_time: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title: string
          updated_at?: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          city?: string | null
          contract_id?: string | null
          contract_status?:
            | Database["public"]["Enums"]["contract_status"]
            | null
          contractor_name?: string | null
          created_at?: string
          created_by?: string
          end_time?: string | null
          fee?: number | null
          id?: string
          latitude?: number | null
          lead_id?: string | null
          longitude?: number | null
          notes?: string | null
          organization_id?: string
          stage?: Database["public"]["Enums"]["funnel_stage"] | null
          start_time?: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          title?: string
          updated_at?: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          city: string | null
          contract_id: string | null
          contract_status: Database["public"]["Enums"]["contract_status_pt"] | null
          created_at: string
          created_by: string
          end_at: string | null
          fee: number | null
          id: string
          lead_id: string | null
          notes: string | null
          organization_id: string
          owner_id: string | null
          stage: Database["public"]["Enums"]["funnel_stage"] | null
          start_at: string
          state: string | null
          status: Database["public"]["Enums"]["event_status_pt"]
          title: string
          updated_at: string
          venue_id: string | null
        }
        Insert: {
          city?: string | null
          contract_id?: string | null
          contract_status?: Database["public"]["Enums"]["contract_status_pt"] | null
          created_at?: string
          created_by: string
          end_at?: string | null
          fee?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id: string
          owner_id?: string | null
          stage?: Database["public"]["Enums"]["funnel_stage"] | null
          start_at: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status_pt"]
          title: string
          updated_at?: string
          venue_id?: string | null
        }
        Update: {
          city?: string | null
          contract_id?: string | null
          contract_status?: Database["public"]["Enums"]["contract_status_pt"] | null
          created_at?: string
          created_by?: string
          end_at?: string | null
          fee?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string
          owner_id?: string | null
          stage?: Database["public"]["Enums"]["funnel_stage"] | null
          start_at?: string
          state?: string | null
          status?: Database["public"]["Enums"]["event_status_pt"]
          title?: string
          updated_at?: string
          venue_id?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          content: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string
          created_by: string
          document_url: string | null
          fee: number | null
          id: string
          lead_id: string
          organization_id: string
          payment_method: string | null
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          document_url?: string | null
          fee?: number | null
          id?: string
          lead_id: string
          organization_id: string
          payment_method?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          document_url?: string | null
          fee?: number | null
          id?: string
          lead_id?: string
          organization_id?: string
          payment_method?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_tags: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["taggable_type"]
          id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: Database["public"]["Enums"]["taggable_type"]
          id?: string
          tag_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["taggable_type"]
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          category: string
          contract_id: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          notes: string | null
          organization_id: string
          paid_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string
          contract_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id: string
          paid_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string
          contract_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string
          paid_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          category: string
          contract_id: string | null
          created_at: string
          created_by: string
          description: string | null
          event_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          organization_id: string
          owner_id: string | null
          paid_at: string | null
          status: Database["public"]["Enums"]["payment_status_pt"]
          type: Database["public"]["Enums"]["payment_type_pt"]
          updated_at: string
          vencimento: string | null
        }
        Insert: {
          amount?: number
          category?: string
          contract_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          event_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id: string
          owner_id?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status_pt"]
          type: Database["public"]["Enums"]["payment_type_pt"]
          updated_at?: string
          vencimento?: string | null
        }
        Update: {
          amount?: number
          category?: string
          contract_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string
          owner_id?: string | null
          paid_at?: string | null
          status?: Database["public"]["Enums"]["payment_status_pt"]
          type?: Database["public"]["Enums"]["payment_type_pt"]
          updated_at?: string
          vencimento?: string | null
        }
        Relationships: []
      }
      lead_messages: {
        Row: {
          created_at: string
          direction: string
          id: string
          lead_id: string
          media_url: string | null
          message_text: string | null
          message_type: string
          organization_id: string
          raw_payload: Json | null
          wa_id: string | null
        }
        Insert: {
          created_at?: string
          direction?: string
          id?: string
          lead_id: string
          media_url?: string | null
          message_text?: string | null
          message_type?: string
          organization_id: string
          raw_payload?: Json | null
          wa_id?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          id?: string
          lead_id?: string
          media_url?: string | null
          message_text?: string | null
          message_type?: string
          organization_id?: string
          raw_payload?: Json | null
          wa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          contact_email: string | null
          contact_id: string | null
          contact_phone: string | null
          contractor_name: string
          contractor_type: string | null
          created_at: string
          created_by: string
          event_date: string | null
          event_name: string | null
          fee: number | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          organization_id: string
          origin: string | null
          stage: Database["public"]["Enums"]["funnel_stage"]
          state: string | null
          updated_at: string
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          city?: string | null
          contact_email?: string | null
          contact_id?: string | null
          contact_phone?: string | null
          contractor_name: string
          contractor_type?: string | null
          created_at?: string
          created_by: string
          event_date?: string | null
          event_name?: string | null
          fee?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          organization_id: string
          origin?: string | null
          stage?: Database["public"]["Enums"]["funnel_stage"]
          state?: string | null
          updated_at?: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          city?: string | null
          contact_email?: string | null
          contact_id?: string | null
          contact_phone?: string | null
          contractor_name?: string
          contractor_type?: string | null
          created_at?: string
          created_by?: string
          event_date?: string | null
          event_name?: string | null
          fee?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          organization_id?: string
          origin?: string | null
          stage?: Database["public"]["Enums"]["funnel_stage"]
          state?: string | null
          updated_at?: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          is_pinned: boolean | null
          organization_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          is_pinned?: boolean | null
          organization_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_pinned?: boolean | null
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_organization_id: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          active_organization_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          active_organization_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      region_cities: {
        Row: {
          city: string
          created_at: string
          id: string
          region_id: string
          state: string
        }
        Insert: {
          city: string
          created_at?: string
          id?: string
          region_id: string
          state: string
        }
        Update: {
          city?: string
          created_at?: string
          id?: string
          region_id?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "region_cities_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      riders: {
        Row: {
          created_at: string
          created_by: string
          document_url: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          document_url?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          document_url?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          is_completed: boolean
          organization_id: string
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_completed?: boolean
          organization_id: string
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_completed?: boolean
          organization_id?: string
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar_url: string | null
          category: string
          created_at: string
          created_by: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          role: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          category?: string
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          role?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          category?: string
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          role?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          capacity: number | null
          city: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          organization_id: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          organization_id: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          capacity?: number | null
          city?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          organization_id?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_confirmed_date_available: {
        Args: {
          _end: string
          _ignore_id: string
          _org_id: string
          _start: string
        }
        Returns: boolean
      }
      is_member_of_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      activity_action:
        | "created"
        | "updated"
        | "deleted"
        | "stage_changed"
        | "status_changed"
        | "note_added"
        | "tag_added"
        | "tag_removed"
      app_role: "admin" | "comercial" | "financeiro"
      contract_status: "pending" | "signed" | "canceled"
      contract_status_pt: "pendente" | "assinado" | "cancelado"
      event_status: "negotiation" | "confirmed" | "blocked" | "hold"
      event_status_pt: "negociacao" | "confirmado" | "bloqueado" | "aguardando"
      payment_status_pt: "pendente" | "pago" | "atrasado" | "cancelado"
      payment_type_pt: "receita" | "despesa"
      funnel_stage:
        | "Prospecção"
        | "Contato"
        | "Proposta"
        | "Negociação"
        | "Contrato"
        | "Fechado"
      taggable_type: "lead" | "contact" | "venue" | "event"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_action: [
        "created",
        "updated",
        "deleted",
        "stage_changed",
        "status_changed",
        "note_added",
        "tag_added",
        "tag_removed",
      ],
      app_role: ["admin", "comercial", "financeiro"],
      contract_status: ["pending", "signed", "canceled"],
      contract_status_pt: ["pendente", "assinado", "cancelado"],
      event_status: ["negotiation", "confirmed", "blocked", "hold"],
      event_status_pt: ["negociacao", "confirmado", "bloqueado", "aguardando"],
      payment_status_pt: ["pendente", "pago", "atrasado", "cancelado"],
      payment_type_pt: ["receita", "despesa"],
      funnel_stage: [
        "Prospecção",
        "Contato",
        "Proposta",
        "Negociação",
        "Contrato",
        "Fechado",
      ],
      taggable_type: ["lead", "contact", "venue", "event"],
    },
  },
} as const
