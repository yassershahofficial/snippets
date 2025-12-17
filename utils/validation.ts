import { PostInput, TipTapContent } from "@/types/post";
import Post from "@/models/Post";
import { generateSlug, validateSlugFormat } from "@/utils/slug";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Check if slug is unique (excluding current post)
export async function isSlugUnique(
  slug: string,
  excludeId?: string
): Promise<boolean> {
  const query: { slug: string; _id?: { $ne: string } } = { slug };
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  const existing = await Post.findOne(query);
  return !existing;
}

// Validate TipTap content structure
export function validateTipTapContent(
  content: TipTapContent | TipTapContent[]
): boolean {
  if (Array.isArray(content)) {
    return content.length > 0 && content.every(validateTipTapContent);
  }
  return (
    typeof content === "object" &&
    content !== null &&
    typeof content.type === "string"
  );
}

// Validate post input
export async function validatePostInput(
  input: Partial<PostInput>,
  isUpdate = false,
  excludeId?: string
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // Title validation
  if (!isUpdate || input.title !== undefined) {
    if (!input.title || input.title.trim().length === 0) {
      errors.push({ field: "title", message: "Title is required" });
    } else if (input.title.length > 200) {
      errors.push({
        field: "title",
        message: "Title cannot exceed 200 characters",
      });
    }
  }

  // Slug validation
  if (!isUpdate || input.slug !== undefined) {
    const slug = input.slug || (input.title ? generateSlug(input.title) : "");
    if (!slug || slug.trim().length === 0) {
      errors.push({ field: "slug", message: "Slug is required" });
    } else if (!validateSlugFormat(slug)) {
      errors.push({
        field: "slug",
        message: "Slug must be lowercase alphanumeric with hyphens",
      });
    } else {
      // Check uniqueness
      const unique = await isSlugUnique(slug, excludeId);
      if (!unique) {
        errors.push({
          field: "slug",
          message: "Slug already exists",
        });
      }
    }
  }

  // Content validation
  if (!isUpdate || input.content !== undefined) {
    if (!input.content) {
      errors.push({ field: "content", message: "Content is required" });
    } else if (!validateTipTapContent(input.content)) {
      errors.push({
        field: "content",
        message: "Invalid content structure",
      });
    }
  }

  // Description validation
  if (input.description && input.description.length > 500) {
    errors.push({
      field: "description",
      message: "Description cannot exceed 500 characters",
    });
  }

  // Tags validation
  if (input.tags) {
    if (!Array.isArray(input.tags)) {
      errors.push({ field: "tags", message: "Tags must be an array" });
    } else if (input.tags.length > 10) {
      errors.push({
        field: "tags",
        message: "Cannot have more than 10 tags",
      });
    } else if (input.tags.some((tag) => typeof tag !== "string" || tag.length === 0)) {
      errors.push({
        field: "tags",
        message: "All tags must be non-empty strings",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

