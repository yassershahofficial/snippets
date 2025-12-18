import { Document } from "mongoose";

// Featured Tags Interface (matches Mongoose schema)
export interface IFeaturedTags {
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Featured Tags Document (Mongoose document with IFeaturedTags)
export interface FeaturedTagsDocument extends IFeaturedTags, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tag with count (for displaying all available tags)
export interface TagWithCount {
  tag: string;
  count: number;
}

// Featured Tags API Response
export interface FeaturedTagsResponse {
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Tags List API Response
export interface TagsListResponse {
  tags: TagWithCount[];
}

