import { Document } from "mongoose";

// User Interface (matches Mongoose schema)
export interface IUser {
  email: string;
  name?: string;
  image?: string;
  provider: string;
  providerId: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Document (Mongoose document with IUser)
export interface UserDocument extends IUser, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

