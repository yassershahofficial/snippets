"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TipTapEditor } from "./TipTapEditor";
import { PostInput, TipTapContent } from "@/types/post";
import { generateSlug } from "@/utils/validation";
import { motion } from "framer-motion";
import { useState } from "react";

// Zod schema for post validation
const postSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title cannot exceed 200 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug cannot exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens"
    ),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
  tags: z
    .array(z.string().min(1, "Tags cannot be empty"))
    .max(10, "Cannot have more than 10 tags")
    .optional()
    .default([]),
  content: z.custom<TipTapContent | TipTapContent[]>(
    (val) => {
      if (!val) return false;
      if (typeof val === "object") {
        // Basic validation - check if it has a type property
        if (Array.isArray(val)) {
          return val.length > 0;
        }
        return "type" in val;
      }
      return false;
    },
    { message: "Content is required" }
  ),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
  initialData?: Partial<PostInput>;
  onSubmit: (data: PostInput) => Promise<void>;
  isLoading?: boolean;
  fieldErrors?: Record<string, string[]>;
}

export function PostForm({
  initialData,
  onSubmit,
  isLoading = false,
  fieldErrors = {},
}: PostFormProps) {
  const [tagInput, setTagInput] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      tags: initialData?.tags || [],
      content: initialData?.content || { type: "doc", content: [] },
    },
  });

  const content = watch("content");
  const tags = watch("tags") || [];

  // Handle server-side field errors
  if (Object.keys(fieldErrors).length > 0) {
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (messages && messages.length > 0) {
        setError(field as keyof PostFormData, {
          type: "server",
          message: messages[0],
        });
      }
    });
  }

  const handleContentChange = (newContent: TipTapContent | TipTapContent[]) => {
    setValue("content", newContent, { shouldValidate: true });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setValue("title", title);
    // Auto-generate slug if slug is empty or matches the old title
    const currentSlug = watch("slug");
    if (!currentSlug || currentSlug === generateSlug(initialData?.title || "")) {
      setValue("slug", generateSlug(title), { shouldValidate: true });
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setValue("tags", [...tags, trimmed], { shouldValidate: true });
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove),
      { shouldValidate: true }
    );
  };

  const onFormSubmit = async (data: PostFormData) => {
    try {
      await onSubmit(data as PostInput);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          {...register("title")}
          onChange={handleTitleChange}
          className="mt-1"
          placeholder="Enter post title"
        />
        {errors.title && (
          <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
        )}
      </motion.div>

      {/* Slug */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
      >
        <Label htmlFor="slug">
          Slug <span className="text-destructive">*</span>
        </Label>
        <Input
          id="slug"
          {...register("slug")}
          className="mt-1"
          placeholder="post-slug"
        />
        {errors.slug && (
          <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
        )}
      </motion.div>

      {/* Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          className="mt-1"
          placeholder="Brief description of the post"
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-destructive mt-1">
            {errors.description.message}
          </p>
        )}
      </motion.div>

      {/* Tags */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
      >
        <Label htmlFor="tags">Tags</Label>
        <div className="mt-1 flex gap-2">
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag and press Enter"
            disabled={tags.length >= 10}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={!tagInput.trim() || tags.length >= 10}
          >
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.tags && (
          <p className="text-sm text-destructive mt-1">{errors.tags.message}</p>
        )}
        {tags.length >= 10 && (
          <p className="text-sm text-muted-foreground mt-1">
            Maximum 10 tags allowed
          </p>
        )}
      </motion.div>

      {/* Content Editor */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        <Label>
          Content <span className="text-destructive">*</span>
        </Label>
        <div className="mt-1">
          <TipTapEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Start writing your post..."
          />
        </div>
        {errors.content && (
          <p className="text-sm text-destructive mt-1">
            {errors.content.message}
          </p>
        )}
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      >
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? "Saving..." : "Save Post"}
        </Button>
      </motion.div>
    </form>
  );
}

