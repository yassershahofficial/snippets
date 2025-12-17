import mongoose, { Schema, Model } from "mongoose";
import { IUser, UserDocument } from "@/types/user";

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    name: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      required: [true, "Provider is required"],
      enum: ["google", "credentials"],
      default: "google",
    },
    providerId: {
      type: String,
      required: [true, "Provider ID is required"],
      index: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for provider + providerId (for OAuth lookups)
UserSchema.index({ provider: 1, providerId: 1 }, { unique: true });

const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;

