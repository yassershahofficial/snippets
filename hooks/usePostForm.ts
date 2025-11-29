"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, PostInput } from "@/lib/api/posts";
import { ApiError } from "@/lib/api";

interface UsePostFormOptions {
  initialData?: Partial<PostInput>;
  slug?: string;
  onSuccess?: () => void;
}

interface UsePostFormReturn {
  submit: (data: PostInput) => Promise<void>;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string[]>;
}

export function usePostForm(
  options: UsePostFormOptions = {}
): UsePostFormReturn {
  const { initialData, slug, onSuccess } = options;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const submit = async (data: PostInput) => {
    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      if (slug) {
        // Update existing post
        await updatePost(slug, data);
      } else {
        // Create new post
        await createPost(data);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        // Default: redirect to posts list
        router.push("/admin/posts");
      }
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) {
        // Field-level errors from validation
        setFieldErrors(apiError.errors);
      } else {
        setError(apiError.message || "Failed to save post");
      }
      throw err; // Re-throw so form can handle it
    } finally {
      setLoading(false);
    }
  };

  return {
    submit,
    loading,
    error,
    fieldErrors,
  };
}

