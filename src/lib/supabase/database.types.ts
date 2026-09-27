export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PostStatus = "draft" | "in_review" | "published";

export type ProfileRole = "admin" | "author";

export type AppealStatus = "pending" | "accepted" | "rejected";

export type BanContentAction = "hide" | "unpublish" | "delete";

export type BanLiftedBy = "admin" | "appeal";

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
          banned_at: string | null;
          ban_reason: string | null;
        };
        Insert: {
          id: string;
          google_name: string;
          username: string;
          avatar_url?: string | null;
          role?: ProfileRole;
          created_at?: string;
          updated_at?: string;
          banned_at?: string | null;
          ban_reason?: string | null;
        };
        Update: {
          id?: string;
          google_name?: string;
          username?: string;
          avatar_url?: string | null;
          role?: ProfileRole;
          created_at?: string;
          updated_at?: string;
          banned_at?: string | null;
          ban_reason?: string | null;
        };
        Relationships: [];
      };
      appeals: {
        Row: {
          id: string;
          user_id: string;
          message: string;
          status: AppealStatus;
          created_at: string;
          decided_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          message: string;
          status?: AppealStatus;
          created_at?: string;
          decided_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          message?: string;
          status?: AppealStatus;
          created_at?: string;
          decided_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appeals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bans: {
        Row: {
          id: string;
          user_id: string;
          reason: string | null;
          content_action: BanContentAction | null;
          banned_at: string;
          lifted_at: string | null;
          lifted_by: BanLiftedBy | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          reason?: string | null;
          content_action?: BanContentAction | null;
          banned_at?: string;
          lifted_at?: string | null;
          lifted_by?: BanLiftedBy | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          reason?: string | null;
          content_action?: BanContentAction | null;
          banned_at?: string;
          lifted_at?: string | null;
          lifted_by?: BanLiftedBy | null;
        };
        Relationships: [
          {
            foreignKeyName: "bans_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
      media: {
        Row: {
          id: string;
          owner_id: string;
          post_id: string | null;
          bytes: number;
          width: number;
          height: number;
          published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          post_id?: string | null;
          bytes: number;
          width: number;
          height: number;
          published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          post_id?: string | null;
          bytes?: number;
          width?: number;
          height?: number;
          published?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
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
      ban_author: {
        Args: { target: string; reason?: string | null; content_action?: BanContentAction };
        Returns: undefined;
      };
      unban_author: {
        Args: { target: string };
        Returns: undefined;
      };
      reserve_media: {
        Args: {
          target_post: string | null;
          file_bytes: number;
          file_width: number;
          file_height: number;
        };
        Returns: string;
      };
      attach_media: {
        Args: { target_post: string; media_ids: string[] };
        Returns: number;
      };
      decide_appeal: {
        Args: { appeal: string; accept: boolean };
        Returns: undefined;
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
