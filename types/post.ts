import { Document } from "mongoose";

// TipTap JSON Content Structure
export interface TipTapContent {
  type: string;
  content?: TipTapContent[];
  attrs?: Record<string, unknown>;
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
  }>;
  text?: string;
}

// Post Interface (matches Mongoose schema)
export interface IPost {
  title: string;
  slug: string;
  content: TipTapContent | TipTapContent[];
  description?: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Post Document (Mongoose document with IPost)
export interface PostDocument extends IPost, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Post Input (for creating/updating posts, without auto-generated fields)
export interface PostInput {
  title: string;
  slug: string;
  content: TipTapContent | TipTapContent[];
  description?: string;
  tags?: string[];
}

// Post with ID (for API responses)
export interface PostWithId extends IPost {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

