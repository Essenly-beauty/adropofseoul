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
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
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
      places: {
        Row: {
          address: string | null;
          area: string | null;
          best_for: string | null;
          booking_url: string | null;
          category: Database["public"]["Enums"]["place_category"];
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          google_map_url: string | null;
          id: string;
          images: Json;
          instagram_url: string | null;
          is_published: boolean;
          kakao_map_url: string | null;
          languages: string[];
          long_description: string | null;
          name: string;
          naver_map_url: string | null;
          notes: string | null;
          partnership_status: Database["public"]["Enums"]["partnership_status"];
          price_range: string | null;
          short_description: string | null;
          slug: string;
          updated_at: string;
          why_we_like_it: string | null;
        };
        Insert: {
          address?: string | null;
          area?: string | null;
          best_for?: string | null;
          booking_url?: string | null;
          category: Database["public"]["Enums"]["place_category"];
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          google_map_url?: string | null;
          id?: string;
          images?: Json;
          instagram_url?: string | null;
          is_published?: boolean;
          kakao_map_url?: string | null;
          languages?: string[];
          long_description?: string | null;
          name: string;
          naver_map_url?: string | null;
          notes?: string | null;
          partnership_status?: Database["public"]["Enums"]["partnership_status"];
          price_range?: string | null;
          short_description?: string | null;
          slug: string;
          updated_at?: string;
          why_we_like_it?: string | null;
        };
        Update: {
          address?: string | null;
          area?: string | null;
          best_for?: string | null;
          booking_url?: string | null;
          category?: Database["public"]["Enums"]["place_category"];
          contact_email?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          google_map_url?: string | null;
          id?: string;
          images?: Json;
          instagram_url?: string | null;
          is_published?: boolean;
          kakao_map_url?: string | null;
          languages?: string[];
          long_description?: string | null;
          name?: string;
          naver_map_url?: string | null;
          notes?: string | null;
          partnership_status?: Database["public"]["Enums"]["partnership_status"];
          price_range?: string | null;
          short_description?: string | null;
          slug?: string;
          updated_at?: string;
          why_we_like_it?: string | null;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          author: string | null;
          body: string | null;
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
          author?: string | null;
          body?: string | null;
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
          author?: string | null;
          body?: string | null;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      partnership_status: "none" | "contacted" | "interested" | "partner";
      place_category:
        "head_spa" | "salon" | "cafe" | "clinic" | "shop" | "wellness";
      post_category:
        | "beauty"
        | "hair"
        | "head_spa"
        | "places"
        | "wellness"
        | "products"
        | "guides";
      post_status: "draft" | "published";
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      partnership_status: ["none", "contacted", "interested", "partner"],
      place_category: [
        "head_spa",
        "salon",
        "cafe",
        "clinic",
        "shop",
        "wellness",
      ],
      post_category: [
        "beauty",
        "hair",
        "head_spa",
        "places",
        "wellness",
        "products",
        "guides",
      ],
      post_status: ["draft", "published"],
    },
  },
} as const;
