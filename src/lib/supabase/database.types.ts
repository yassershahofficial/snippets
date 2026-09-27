export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PostStatus = "draft" | "in_review" | "published";

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
      post_messages: {
        Row: {
          id: string;
          post_id: string;
          sender_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          sender_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          sender_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_messages_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      post_thread_reads: {
        Row: {
          post_id: string;
          user_id: string;
          last_read_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          last_read_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          last_read_at?: string;
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
      unread_thread_posts: {
        Args: Record<string, never>;
        Returns: string[];
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
