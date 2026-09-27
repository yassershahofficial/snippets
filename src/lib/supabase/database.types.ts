export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PostStatus = "draft" | "in_review" | "published";

export type PostType = "code" | "article" | "opinion";

export type ProfileRole = "admin" | "author";

export type Database = {
  snippets: {
    Tables: {
      posts: {
        Row: {
          id: string;
          slug: string;
          status: PostStatus;
          title: string;
          description: string;
          body: Json;
          featured: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          author_id: string | null;
          type: PostType;
          tags: string[];
          next_post_id: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          status?: PostStatus;
          title: string;
          description: string;
          body: Json;
          featured?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          author_id?: string | null;
          type?: PostType;
          tags?: string[];
          next_post_id?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          status?: PostStatus;
          title?: string;
          description?: string;
          body?: Json;
          featured?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          author_id?: string | null;
          type?: PostType;
          tags?: string[];
          next_post_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_next_post_id_fkey";
            columns: ["next_post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          google_name: string;
          username: string;
          avatar_url: string | null;
          role: ProfileRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          google_name: string;
          username: string;
          avatar_url?: string | null;
          role?: ProfileRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          google_name?: string;
          username?: string;
          avatar_url?: string | null;
          role?: ProfileRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      sync_profile: {
        Args: Record<string, never>;
        Returns: Database["snippets"]["Tables"]["profiles"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
