export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      anonymous_identities: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          last_seen_at: string;
          linked_at: string | null;
          linked_user_id: string | null;
          metadata: Json | null;
          token_hash: string;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          last_seen_at?: string;
          linked_at?: string | null;
          linked_user_id?: string | null;
          metadata?: Json | null;
          token_hash: string;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          last_seen_at?: string;
          linked_at?: string | null;
          linked_user_id?: string | null;
          metadata?: Json | null;
          token_hash?: string;
        };
        Relationships: [];
      };
      consent_documents: {
        Row: {
          consent_type: Database["public"]["Enums"]["consent_type"];
          content_reference: string | null;
          created_at: string;
          effective_at: string;
          id: string;
          locale: string;
          version: string;
        };
        Insert: {
          consent_type: Database["public"]["Enums"]["consent_type"];
          content_reference?: string | null;
          created_at?: string;
          effective_at?: string;
          id?: string;
          locale?: string;
          version: string;
        };
        Update: {
          consent_type?: Database["public"]["Enums"]["consent_type"];
          content_reference?: string | null;
          created_at?: string;
          effective_at?: string;
          id?: string;
          locale?: string;
          version?: string;
        };
        Relationships: [];
      };
      consent_records: {
        Row: {
          anonymous_identity_id: string | null;
          consent_document_id: string;
          id: string;
          metadata_json: Json | null;
          recorded_at: string;
          source: string | null;
          status: Database["public"]["Enums"]["consent_status"];
          user_id: string | null;
        };
        Insert: {
          anonymous_identity_id?: string | null;
          consent_document_id: string;
          id?: string;
          metadata_json?: Json | null;
          recorded_at?: string;
          source?: string | null;
          status?: Database["public"]["Enums"]["consent_status"];
          user_id?: string | null;
        };
        Update: {
          anonymous_identity_id?: string | null;
          consent_document_id?: string;
          id?: string;
          metadata_json?: Json | null;
          recorded_at?: string;
          source?: string | null;
          status?: Database["public"]["Enums"]["consent_status"];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "consent_records_anonymous_identity_id_fkey";
            columns: ["anonymous_identity_id"];
            isOneToOne: false;
            referencedRelation: "anonymous_identities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "consent_records_consent_document_id_fkey";
            columns: ["consent_document_id"];
            isOneToOne: false;
            referencedRelation: "consent_documents";
            referencedColumns: ["id"];
          },
        ];
      };
      identity_links: {
        Row: {
          anonymous_identity_id: string;
          created_at: string;
          id: string;
          idempotency_key: string | null;
          link_method: string | null;
          link_status: Database["public"]["Enums"]["identity_link_status"];
          linked_at: string;
          user_id: string;
        };
        Insert: {
          anonymous_identity_id: string;
          created_at?: string;
          id?: string;
          idempotency_key?: string | null;
          link_method?: string | null;
          link_status?: Database["public"]["Enums"]["identity_link_status"];
          linked_at?: string;
          user_id: string;
        };
        Update: {
          anonymous_identity_id?: string;
          created_at?: string;
          id?: string;
          idempotency_key?: string | null;
          link_method?: string | null;
          link_status?: Database["public"]["Enums"]["identity_link_status"];
          linked_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "identity_links_anonymous_identity_id_fkey";
            columns: ["anonymous_identity_id"];
            isOneToOne: false;
            referencedRelation: "anonymous_identities";
            referencedColumns: ["id"];
          },
        ];
      };
      image_candidates: {
        Row: {
          area: string;
          attribution: string | null;
          created_at: string;
          description: string | null;
          id: string;
          license: string;
          place_candidate_id: string | null;
          run_id: string | null;
          source_type: string;
          source_url: string;
          status: string;
          suggested_use: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          area: string;
          attribution?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          license?: string;
          place_candidate_id?: string | null;
          run_id?: string | null;
          source_type: string;
          source_url: string;
          status?: string;
          suggested_use?: string;
          updated_at?: string;
          url: string;
        };
        Update: {
          area?: string;
          attribution?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          license?: string;
          place_candidate_id?: string | null;
          run_id?: string | null;
          source_type?: string;
          source_url?: string;
          status?: string;
          suggested_use?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "image_candidates_place_candidate_id_fkey";
            columns: ["place_candidate_id"];
            isOneToOne: false;
            referencedRelation: "place_candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "image_candidates_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "research_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      ingredients: {
        Row: {
          also_known_as: string[];
          benefits: string | null;
          caution: string | null;
          created_at: string;
          description: string | null;
          functions: string[];
          good_for_skin_types: string[];
          id: string;
          inci_name: string | null;
          meta_description: string | null;
          name: string;
          seo_title: string | null;
          slug: string;
          status: Database["public"]["Enums"]["post_status"];
          summary: string | null;
          targets_concerns: string[];
          updated_at: string;
        };
        Insert: {
          also_known_as?: string[];
          benefits?: string | null;
          caution?: string | null;
          created_at?: string;
          description?: string | null;
          functions?: string[];
          good_for_skin_types?: string[];
          id?: string;
          inci_name?: string | null;
          meta_description?: string | null;
          name: string;
          seo_title?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["post_status"];
          summary?: string | null;
          targets_concerns?: string[];
          updated_at?: string;
        };
        Update: {
          also_known_as?: string[];
          benefits?: string | null;
          caution?: string | null;
          created_at?: string;
          description?: string | null;
          functions?: string[];
          good_for_skin_types?: string[];
          id?: string;
          inci_name?: string | null;
          meta_description?: string | null;
          name?: string;
          seo_title?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["post_status"];
          summary?: string | null;
          targets_concerns?: string[];
          updated_at?: string;
        };
        Relationships: [];
      };
      media: {
        Row: {
          alt_text: string;
          caption: string | null;
          created_at: string;
          folder: string | null;
          height: number | null;
          id: string;
          storage_path: string;
          width: number | null;
        };
        Insert: {
          alt_text: string;
          caption?: string | null;
          created_at?: string;
          folder?: string | null;
          height?: number | null;
          id?: string;
          storage_path: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string;
          caption?: string | null;
          created_at?: string;
          folder?: string | null;
          height?: number | null;
          id?: string;
          storage_path?: string;
          width?: number | null;
        };
        Relationships: [];
      };
      neighborhoods: {
        Row: {
          created_at: string;
          hero_image: string | null;
          id: string;
          linked_guide_post_id: string | null;
          name: string;
          name_kr: string | null;
          slug: string;
          updated_at: string;
          vibe_tags: string[];
        };
        Insert: {
          created_at?: string;
          hero_image?: string | null;
          id?: string;
          linked_guide_post_id?: string | null;
          name: string;
          name_kr?: string | null;
          slug: string;
          updated_at?: string;
          vibe_tags?: string[];
        };
        Update: {
          created_at?: string;
          hero_image?: string | null;
          id?: string;
          linked_guide_post_id?: string | null;
          name?: string;
          name_kr?: string | null;
          slug?: string;
          updated_at?: string;
          vibe_tags?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "neighborhoods_linked_guide_post_id_fkey";
            columns: ["linked_guide_post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: {
          created_at: string;
          email: string;
          id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
        };
        Relationships: [];
      };
      place_candidates: {
        Row: {
          area: string;
          category_guess: Database["public"]["Enums"]["place_category"] | null;
          confidence: number | null;
          created_at: string;
          dedupe_key: string;
          evidence: Json | null;
          id: string;
          name: string;
          promoted_place_id: string | null;
          run_id: string | null;
          source_urls: Json;
          status: string;
          updated_at: string;
          why_notable: string | null;
        };
        Insert: {
          area: string;
          category_guess?: Database["public"]["Enums"]["place_category"] | null;
          confidence?: number | null;
          created_at?: string;
          dedupe_key: string;
          evidence?: Json | null;
          id?: string;
          name: string;
          promoted_place_id?: string | null;
          run_id?: string | null;
          source_urls: Json;
          status?: string;
          updated_at?: string;
          why_notable?: string | null;
        };
        Update: {
          area?: string;
          category_guess?: Database["public"]["Enums"]["place_category"] | null;
          confidence?: number | null;
          created_at?: string;
          dedupe_key?: string;
          evidence?: Json | null;
          id?: string;
          name?: string;
          promoted_place_id?: string | null;
          run_id?: string | null;
          source_urls?: Json;
          status?: string;
          updated_at?: string;
          why_notable?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "place_candidates_promoted_place_id_fkey";
            columns: ["promoted_place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "place_candidates_run_id_fkey";
            columns: ["run_id"];
            isOneToOne: false;
            referencedRelation: "research_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      place_evidence: {
        Row: {
          checked_at: string;
          confidence: number;
          created_at: string;
          evidence_kind: string;
          id: string;
          notes: string | null;
          observed_value: string | null;
          place_candidate_id: string;
          source_account_id: string | null;
          source_item_id: string | null;
          source_name: string | null;
          source_type: string;
          url: string;
        };
        Insert: {
          checked_at?: string;
          confidence?: number;
          created_at?: string;
          evidence_kind: string;
          id?: string;
          notes?: string | null;
          observed_value?: string | null;
          place_candidate_id: string;
          source_account_id?: string | null;
          source_item_id?: string | null;
          source_name?: string | null;
          source_type: string;
          url: string;
        };
        Update: {
          checked_at?: string;
          confidence?: number;
          created_at?: string;
          evidence_kind?: string;
          id?: string;
          notes?: string | null;
          observed_value?: string | null;
          place_candidate_id?: string;
          source_account_id?: string | null;
          source_item_id?: string | null;
          source_name?: string | null;
          source_type?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "place_evidence_source_account_id_fkey";
            columns: ["source_account_id"];
            isOneToOne: false;
            referencedRelation: "source_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "place_evidence_source_item_id_fkey";
            columns: ["source_item_id"];
            isOneToOne: false;
            referencedRelation: "source_items";
            referencedColumns: ["id"];
          },
        ];
      };
      places: {
        Row: {
          address: string | null;
          area: string | null;
          best_for: string | null;
          booking_channel: string | null;
          booking_url: string | null;
          category: Database["public"]["Enums"]["place_category"];
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          deposit_policy: string | null;
          editorial_status: string;
          entry_type: Database["public"]["Enums"]["place_entry_type"];
          geo_lat: number | null;
          geo_lng: number | null;
          google_map_url: string | null;
          id: string;
          images: Json;
          instagram_url: string | null;
          is_published: boolean;
          kakao_map_url: string | null;
          languages: string[];
          last_verified_at: string | null;
          long_description: string | null;
          name: string;
          name_kr: string | null;
          naver_map_url: string | null;
          neighborhood_id: string | null;
          notes: string | null;
          opening_hours: Json | null;
          partnership_status: Database["public"]["Enums"]["partnership_status"];
          price_max_krw: number | null;
          price_min_krw: number | null;
          price_range: string | null;
          rating: number | null;
          review_count: number | null;
          service_detail: string | null;
          short_description: string | null;
          slug: string;
          updated_at: string;
          website_url: string | null;
          why_we_like_it: string | null;
        };
        Insert: {
          address?: string | null;
          area?: string | null;
          best_for?: string | null;
          booking_channel?: string | null;
          booking_url?: string | null;
          category: Database["public"]["Enums"]["place_category"];
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          deposit_policy?: string | null;
          editorial_status?: string;
          entry_type?: Database["public"]["Enums"]["place_entry_type"];
          geo_lat?: number | null;
          geo_lng?: number | null;
          google_map_url?: string | null;
          id?: string;
          images?: Json;
          instagram_url?: string | null;
          is_published?: boolean;
          kakao_map_url?: string | null;
          languages?: string[];
          last_verified_at?: string | null;
          long_description?: string | null;
          name: string;
          name_kr?: string | null;
          naver_map_url?: string | null;
          neighborhood_id?: string | null;
          notes?: string | null;
          opening_hours?: Json | null;
          partnership_status?: Database["public"]["Enums"]["partnership_status"];
          price_max_krw?: number | null;
          price_min_krw?: number | null;
          price_range?: string | null;
          rating?: number | null;
          review_count?: number | null;
          service_detail?: string | null;
          short_description?: string | null;
          slug: string;
          updated_at?: string;
          website_url?: string | null;
          why_we_like_it?: string | null;
        };
        Update: {
          address?: string | null;
          area?: string | null;
          best_for?: string | null;
          booking_channel?: string | null;
          booking_url?: string | null;
          category?: Database["public"]["Enums"]["place_category"];
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          deposit_policy?: string | null;
          editorial_status?: string;
          entry_type?: Database["public"]["Enums"]["place_entry_type"];
          geo_lat?: number | null;
          geo_lng?: number | null;
          google_map_url?: string | null;
          id?: string;
          images?: Json;
          instagram_url?: string | null;
          is_published?: boolean;
          kakao_map_url?: string | null;
          languages?: string[];
          last_verified_at?: string | null;
          long_description?: string | null;
          name?: string;
          name_kr?: string | null;
          naver_map_url?: string | null;
          neighborhood_id?: string | null;
          notes?: string | null;
          opening_hours?: Json | null;
          partnership_status?: Database["public"]["Enums"]["partnership_status"];
          price_max_krw?: number | null;
          price_min_krw?: number | null;
          price_range?: string | null;
          rating?: number | null;
          review_count?: number | null;
          service_detail?: string | null;
          short_description?: string | null;
          slug?: string;
          updated_at?: string;
          website_url?: string | null;
          why_we_like_it?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "places_neighborhood_id_fkey";
            columns: ["neighborhood_id"];
            isOneToOne: false;
            referencedRelation: "neighborhoods";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          ai_review: Json | null;
          author: string | null;
          body: string | null;
          brief: Json | null;
          category: Database["public"]["Enums"]["post_category"];
          created_at: string;
          excerpt: string | null;
          featured_image: string | null;
          gallery_images: Json;
          id: string;
          instagram_caption: string | null;
          meta_description: string | null;
          pinterest_description: string | null;
          pinterest_title: string | null;
          published_at: string | null;
          related_places: string[];
          related_products: string[];
          research: Json | null;
          seo_title: string | null;
          slug: string;
          status: Database["public"]["Enums"]["post_status"];
          subtitle: string | null;
          tags: string[];
          threads_post: string | null;
          title: string;
          updated_at: string;
          x_post: string | null;
        };
        Insert: {
          ai_review?: Json | null;
          author?: string | null;
          body?: string | null;
          brief?: Json | null;
          category: Database["public"]["Enums"]["post_category"];
          created_at?: string;
          excerpt?: string | null;
          featured_image?: string | null;
          gallery_images?: Json;
          id?: string;
          instagram_caption?: string | null;
          meta_description?: string | null;
          pinterest_description?: string | null;
          pinterest_title?: string | null;
          published_at?: string | null;
          related_places?: string[];
          related_products?: string[];
          research?: Json | null;
          seo_title?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["post_status"];
          subtitle?: string | null;
          tags?: string[];
          threads_post?: string | null;
          title: string;
          updated_at?: string;
          x_post?: string | null;
        };
        Update: {
          ai_review?: Json | null;
          author?: string | null;
          body?: string | null;
          brief?: Json | null;
          category?: Database["public"]["Enums"]["post_category"];
          created_at?: string;
          excerpt?: string | null;
          featured_image?: string | null;
          gallery_images?: Json;
          id?: string;
          instagram_caption?: string | null;
          meta_description?: string | null;
          pinterest_description?: string | null;
          pinterest_title?: string | null;
          published_at?: string | null;
          related_places?: string[];
          related_products?: string[];
          research?: Json | null;
          seo_title?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["post_status"];
          subtitle?: string | null;
          tags?: string[];
          threads_post?: string | null;
          title?: string;
          updated_at?: string;
          x_post?: string | null;
        };
        Relationships: [];
      };
      product_ingredients: {
        Row: {
          ingredient_id: string;
          is_key: boolean;
          position: number | null;
          product_id: string;
        };
        Insert: {
          ingredient_id: string;
          is_key?: boolean;
          position?: number | null;
          product_id: string;
        };
        Update: {
          ingredient_id?: string;
          is_key?: boolean;
          position?: number | null;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey";
            columns: ["ingredient_id"];
            isOneToOne: false;
            referencedRelation: "ingredients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          affiliate_url: string | null;
          best_for: string | null;
          brand: string | null;
          category: string | null;
          created_at: string;
          description: string | null;
          disclosure_required: boolean;
          id: string;
          image: string | null;
          ingredients: string | null;
          is_published: boolean;
          name: string;
          price: string | null;
          rating: number | null;
          slug: string;
          updated_at: string;
          where_to_buy: string | null;
        };
        Insert: {
          affiliate_url?: string | null;
          best_for?: string | null;
          brand?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          disclosure_required?: boolean;
          id?: string;
          image?: string | null;
          ingredients?: string | null;
          is_published?: boolean;
          name: string;
          price?: string | null;
          rating?: number | null;
          slug: string;
          updated_at?: string;
          where_to_buy?: string | null;
        };
        Update: {
          affiliate_url?: string | null;
          best_for?: string | null;
          brand?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          disclosure_required?: boolean;
          id?: string;
          image?: string | null;
          ingredients?: string | null;
          is_published?: boolean;
          name?: string;
          price?: string | null;
          rating?: number | null;
          slug?: string;
          updated_at?: string;
          where_to_buy?: string | null;
        };
        Relationships: [];
      };
      profile_snapshots: {
        Row: {
          anonymous_identity_id: string | null;
          confidence_json: Json | null;
          created_at: string;
          goals_json: Json | null;
          id: string;
          preferences_json: Json | null;
          profile_code: string;
          profile_domain: Database["public"]["Enums"]["profile_domain"];
          profile_version: number;
          quiz_attempt_id: string;
          rule_set_version: string;
          summary_json: Json | null;
          superseded_at: string | null;
          traits_json: Json | null;
          user_id: string | null;
        };
        Insert: {
          anonymous_identity_id?: string | null;
          confidence_json?: Json | null;
          created_at?: string;
          goals_json?: Json | null;
          id?: string;
          preferences_json?: Json | null;
          profile_code: string;
          profile_domain: Database["public"]["Enums"]["profile_domain"];
          profile_version?: number;
          quiz_attempt_id: string;
          rule_set_version: string;
          summary_json?: Json | null;
          superseded_at?: string | null;
          traits_json?: Json | null;
          user_id?: string | null;
        };
        Update: {
          anonymous_identity_id?: string | null;
          confidence_json?: Json | null;
          created_at?: string;
          goals_json?: Json | null;
          id?: string;
          preferences_json?: Json | null;
          profile_code?: string;
          profile_domain?: Database["public"]["Enums"]["profile_domain"];
          profile_version?: number;
          quiz_attempt_id?: string;
          rule_set_version?: string;
          summary_json?: Json | null;
          superseded_at?: string | null;
          traits_json?: Json | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profile_snapshots_anonymous_identity_id_fkey";
            columns: ["anonymous_identity_id"];
            isOneToOne: false;
            referencedRelation: "anonymous_identities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_snapshots_quiz_attempt_id_fkey";
            columns: ["quiz_attempt_id"];
            isOneToOne: false;
            referencedRelation: "quiz_attempts";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_attempts: {
        Row: {
          anonymous_identity_id: string | null;
          completed_at: string | null;
          created_at: string;
          current_step: number | null;
          id: string;
          idempotency_key: string | null;
          last_saved_at: string;
          quiz_definition_id: string;
          source_context: string | null;
          started_at: string;
          status: Database["public"]["Enums"]["attempt_status"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          anonymous_identity_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          current_step?: number | null;
          id?: string;
          idempotency_key?: string | null;
          last_saved_at?: string;
          quiz_definition_id: string;
          source_context?: string | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["attempt_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          anonymous_identity_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          current_step?: number | null;
          id?: string;
          idempotency_key?: string | null;
          last_saved_at?: string;
          quiz_definition_id?: string;
          source_context?: string | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["attempt_status"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_anonymous_identity_id_fkey";
            columns: ["anonymous_identity_id"];
            isOneToOne: false;
            referencedRelation: "anonymous_identities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_attempts_quiz_definition_id_fkey";
            columns: ["quiz_definition_id"];
            isOneToOne: false;
            referencedRelation: "quiz_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_definitions: {
        Row: {
          created_at: string;
          description_key: string | null;
          id: string;
          locale_strategy: string;
          published_at: string | null;
          quiz_key: Database["public"]["Enums"]["profile_domain"];
          retired_at: string | null;
          status: Database["public"]["Enums"]["quiz_status"];
          title_key: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          description_key?: string | null;
          id?: string;
          locale_strategy?: string;
          published_at?: string | null;
          quiz_key: Database["public"]["Enums"]["profile_domain"];
          retired_at?: string | null;
          status?: Database["public"]["Enums"]["quiz_status"];
          title_key?: string | null;
          updated_at?: string;
          version: number;
        };
        Update: {
          created_at?: string;
          description_key?: string | null;
          id?: string;
          locale_strategy?: string;
          published_at?: string | null;
          quiz_key?: Database["public"]["Enums"]["profile_domain"];
          retired_at?: string | null;
          status?: Database["public"]["Enums"]["quiz_status"];
          title_key?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [];
      };
      quiz_options: {
        Row: {
          content_key: string | null;
          created_at: string;
          id: string;
          metadata_json: Json | null;
          option_key: string;
          position: number;
          question_id: string;
          updated_at: string;
          value_code: string;
        };
        Insert: {
          content_key?: string | null;
          created_at?: string;
          id?: string;
          metadata_json?: Json | null;
          option_key: string;
          position?: number;
          question_id: string;
          updated_at?: string;
          value_code: string;
        };
        Update: {
          content_key?: string | null;
          created_at?: string;
          id?: string;
          metadata_json?: Json | null;
          option_key?: string;
          position?: number;
          question_id?: string;
          updated_at?: string;
          value_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_options_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "quiz_questions";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_questions: {
        Row: {
          allows_multiple: boolean;
          content_key: string | null;
          created_at: string;
          display_logic_json: Json | null;
          help_text_key: string | null;
          id: string;
          is_required: boolean;
          position: number;
          question_key: string;
          question_type: Database["public"]["Enums"]["quiz_question_type"];
          quiz_definition_id: string;
          section_key: string | null;
          updated_at: string;
          validation_json: Json | null;
        };
        Insert: {
          allows_multiple?: boolean;
          content_key?: string | null;
          created_at?: string;
          display_logic_json?: Json | null;
          help_text_key?: string | null;
          id?: string;
          is_required?: boolean;
          position?: number;
          question_key: string;
          question_type: Database["public"]["Enums"]["quiz_question_type"];
          quiz_definition_id: string;
          section_key?: string | null;
          updated_at?: string;
          validation_json?: Json | null;
        };
        Update: {
          allows_multiple?: boolean;
          content_key?: string | null;
          created_at?: string;
          display_logic_json?: Json | null;
          help_text_key?: string | null;
          id?: string;
          is_required?: boolean;
          position?: number;
          question_key?: string;
          question_type?: Database["public"]["Enums"]["quiz_question_type"];
          quiz_definition_id?: string;
          section_key?: string | null;
          updated_at?: string;
          validation_json?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_definition_id_fkey";
            columns: ["quiz_definition_id"];
            isOneToOne: false;
            referencedRelation: "quiz_definitions";
            referencedColumns: ["id"];
          },
        ];
      };
      quiz_responses: {
        Row: {
          answered_at: string;
          created_at: string;
          id: string;
          question_id: string;
          quiz_attempt_id: string;
          response_json: Json;
          updated_at: string;
        };
        Insert: {
          answered_at?: string;
          created_at?: string;
          id?: string;
          question_id: string;
          quiz_attempt_id: string;
          response_json: Json;
          updated_at?: string;
        };
        Update: {
          answered_at?: string;
          created_at?: string;
          id?: string;
          question_id?: string;
          quiz_attempt_id?: string;
          response_json?: Json;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_responses_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "quiz_questions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quiz_responses_quiz_attempt_id_fkey";
            columns: ["quiz_attempt_id"];
            isOneToOne: false;
            referencedRelation: "quiz_attempts";
            referencedColumns: ["id"];
          },
        ];
      };
      research_runs: {
        Row: {
          agent: string;
          area: string;
          counts: Json | null;
          error: string | null;
          finished_at: string | null;
          id: string;
          prompt_version: string;
          source_config: Json | null;
          started_at: string;
          status: string;
          token_cost: number | null;
        };
        Insert: {
          agent: string;
          area: string;
          counts?: Json | null;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          prompt_version: string;
          source_config?: Json | null;
          started_at?: string;
          status?: string;
          token_cost?: number | null;
        };
        Update: {
          agent?: string;
          area?: string;
          counts?: Json | null;
          error?: string | null;
          finished_at?: string | null;
          id?: string;
          prompt_version?: string;
          source_config?: Json | null;
          started_at?: string;
          status?: string;
          token_cost?: number | null;
        };
        Relationships: [];
      };
      source_accounts: {
        Row: {
          category: string[];
          created_at: string;
          display_name: string;
          handle: string | null;
          id: string;
          language: string[];
          last_checked_at: string | null;
          market_scope: string | null;
          neighborhood_focus: string[];
          notes: string | null;
          platform: string;
          priority: number;
          raw_metadata: Json;
          signal_use: string | null;
          source_type: string | null;
          status: string;
          updated_at: string;
          url: string;
          verification_role: string | null;
        };
        Insert: {
          category?: string[];
          created_at?: string;
          display_name: string;
          handle?: string | null;
          id: string;
          language?: string[];
          last_checked_at?: string | null;
          market_scope?: string | null;
          neighborhood_focus?: string[];
          notes?: string | null;
          platform: string;
          priority?: number;
          raw_metadata?: Json;
          signal_use?: string | null;
          source_type?: string | null;
          status?: string;
          updated_at?: string;
          url: string;
          verification_role?: string | null;
        };
        Update: {
          category?: string[];
          created_at?: string;
          display_name?: string;
          handle?: string | null;
          id?: string;
          language?: string[];
          last_checked_at?: string | null;
          market_scope?: string | null;
          neighborhood_focus?: string[];
          notes?: string | null;
          platform?: string;
          priority?: number;
          raw_metadata?: Json;
          signal_use?: string | null;
          source_type?: string | null;
          status?: string;
          updated_at?: string;
          url?: string;
          verification_role?: string | null;
        };
        Relationships: [];
      };
      source_items: {
        Row: {
          captured_at: string;
          content_type: string | null;
          created_at: string;
          id: string;
          mentioned_neighborhoods: string[];
          mentioned_place_names: string[];
          platform_item_id: string | null;
          published_at: string | null;
          raw_metadata: Json;
          source_account_id: string | null;
          text_excerpt: string | null;
          updated_at: string;
          url: string;
        };
        Insert: {
          captured_at?: string;
          content_type?: string | null;
          created_at?: string;
          id?: string;
          mentioned_neighborhoods?: string[];
          mentioned_place_names?: string[];
          platform_item_id?: string | null;
          published_at?: string | null;
          raw_metadata?: Json;
          source_account_id?: string | null;
          text_excerpt?: string | null;
          updated_at?: string;
          url: string;
        };
        Update: {
          captured_at?: string;
          content_type?: string | null;
          created_at?: string;
          id?: string;
          mentioned_neighborhoods?: string[];
          mentioned_place_names?: string[];
          platform_item_id?: string | null;
          published_at?: string | null;
          raw_metadata?: Json;
          source_account_id?: string | null;
          text_excerpt?: string | null;
          updated_at?: string;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "source_items_source_account_id_fkey";
            columns: ["source_account_id"];
            isOneToOne: false;
            referencedRelation: "source_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      user_current_profiles: {
        Row: {
          profile_domain: Database["public"]["Enums"]["profile_domain"];
          profile_snapshot_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          profile_domain: Database["public"]["Enums"]["profile_domain"];
          profile_snapshot_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          profile_domain?: Database["public"]["Enums"]["profile_domain"];
          profile_snapshot_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_current_profiles_profile_snapshot_id_fkey";
            columns: ["profile_snapshot_id"];
            isOneToOne: false;
            referencedRelation: "profile_snapshots";
            referencedColumns: ["id"];
          },
        ];
      };
      waitlist_subscribers: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          source: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: string;
          source?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          source?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      attempt_status: "in_progress" | "completed" | "abandoned" | "invalidated";
      consent_status: "granted" | "withdrawn";
      consent_type: "terms" | "privacy" | "marketing";
      identity_link_status: "linked" | "conflict" | "reverted";
      partnership_status: "none" | "contacted" | "interested" | "partner";
      place_category:
        | "head_spa"
        | "salon"
        | "cafe"
        | "clinic"
        | "shop"
        | "wellness"
        | "personal_color"
        | "makeup"
        | "spa"
        | "facial"
        | "nail_lash"
        | "perfume"
        | "cooking_class"
        | "food_tour";
      place_entry_type: "place" | "experience";
      post_category:
        | "beauty"
        | "hair"
        | "head_spa"
        | "places"
        | "wellness"
        | "products"
        | "guides";
      post_status:
        "draft" | "published" | "research" | "ai_review" | "ready" | "archived";
      profile_domain: "skin" | "hair";
      quiz_question_type:
        "single_select" | "multi_select" | "scale" | "text" | "info";
      quiz_status: "draft" | "active" | "retired";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      attempt_status: ["in_progress", "completed", "abandoned", "invalidated"],
      consent_status: ["granted", "withdrawn"],
      consent_type: ["terms", "privacy", "marketing"],
      identity_link_status: ["linked", "conflict", "reverted"],
      partnership_status: ["none", "contacted", "interested", "partner"],
      place_category: [
        "head_spa",
        "salon",
        "cafe",
        "clinic",
        "shop",
        "wellness",
        "personal_color",
        "makeup",
        "spa",
        "facial",
        "nail_lash",
        "perfume",
        "cooking_class",
        "food_tour",
      ],
      place_entry_type: ["place", "experience"],
      post_category: [
        "beauty",
        "hair",
        "head_spa",
        "places",
        "wellness",
        "products",
        "guides",
      ],
      post_status: [
        "draft",
        "published",
        "research",
        "ai_review",
        "ready",
        "archived",
      ],
      profile_domain: ["skin", "hair"],
      quiz_question_type: [
        "single_select",
        "multi_select",
        "scale",
        "text",
        "info",
      ],
      quiz_status: ["draft", "active", "retired"],
    },
  },
} as const;
