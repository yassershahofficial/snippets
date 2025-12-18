import mongoose, { Schema, Model } from "mongoose";
import { IFeaturedTags, FeaturedTagsDocument } from "@/types/featured-tags";

const FeaturedTagsSchema = new Schema<IFeaturedTags>(
  {
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 4,
        message: "Cannot have more than 4 featured tags",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Singleton pattern: ensure only one document exists
FeaturedTagsSchema.statics.getSingleton = async function () {
  const doc = await this.findOne();
  if (!doc) {
    return await this.create({ tags: [] });
  }
  return doc;
};

const FeaturedTags: Model<FeaturedTagsDocument> =
  mongoose.models.FeaturedTags ||
  mongoose.model<FeaturedTagsDocument>("FeaturedTags", FeaturedTagsSchema);

export default FeaturedTags;

