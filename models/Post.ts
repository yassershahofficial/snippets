import mongoose, { Schema, Model } from "mongoose";
import { IPost, PostDocument } from "@/types/post";

const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format"],
      index: true,
    },
    content: {
      type: Schema.Types.Mixed,
      required: [true, "Content is required"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 10,
        message: "Cannot have more than 10 tags",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ tags: 1 });

const Post: Model<PostDocument> =
  mongoose.models.Post || mongoose.model<PostDocument>("Post", PostSchema);

export default Post;

