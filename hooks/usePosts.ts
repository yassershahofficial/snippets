"use client";

import { useState, useEffect, useCallback } from "react";
import { getPosts, deletePost, PostWithId } from "@/lib/api/posts";
import { ApiError } from "@/lib/api";

interface UsePostsOptions {
  limit?: number;
  skip?: number;
  autoFetch?: boolean;
}

interface UsePostsReturn {
  posts: PostWithId[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
  refetch: () => Promise<void>;
  removePost: (slug: string) => Promise<void>;
  setSkip: (skip: number) => void;
}

export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
  const { limit = 10, skip: initialSkip = 0, autoFetch = true } = options;
  const [posts, setPosts] = useState<PostWithId[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skip, setSkip] = useState(initialSkip);
  const [pagination, setPagination] = useState({
    total: 0,
    limit,
    skip: initialSkip,
    hasMore: false,
  });

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getPosts(limit, skip);
      setPosts(response.posts);
      setPagination(response.pagination);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to fetch posts");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [limit, skip]);

  const removePost = useCallback(
    async (slug: string) => {
      try {
        await deletePost(slug);
        // Refetch posts after deletion
        await fetchPosts();
      } catch (err) {
        const apiError = err as ApiError;
        throw new Error(apiError.message || "Failed to delete post");
      }
    },
    [fetchPosts]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchPosts();
    }
  }, [autoFetch, fetchPosts]);

  return {
    posts,
    loading,
    error,
    pagination,
    refetch: fetchPosts,
    removePost,
    setSkip,
  };
}

