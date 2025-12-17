"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PostForm } from "@/components/admin/PostForm";
import { usePostForm } from "@/hooks/usePostForm";
import { getPost } from "@/lib/api/posts";
import { PostInput, PostWithId } from "@/types/post";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [post, setPost] = useState<PostWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { submit, loading: isSubmitting, fieldErrors } = usePostForm({
    slug,
    onSuccess: () => {
      toast.success("Post updated successfully!");
      router.push("/admin/posts");
    },
  });

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const data = await getPost(slug);
        setPost(data as PostWithId);
      } catch {
        setError("Failed to load post");
        toast.error("Failed to load post");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const handleSubmit = async (data: PostInput) => {
    try {
      await submit(data);
    } catch {
      toast.error("Failed to update post");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Post</h1>
          <p className="text-destructive mt-1">
            {error || "Post not found"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Edit Post</h1>
        <p className="text-muted-foreground mt-1">
          Update the details below to modify your blog post
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PostForm
          initialData={{
            title: post.title,
            slug: post.slug,
            description: post.description,
            tags: post.tags,
            content: post.content,
          }}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          fieldErrors={fieldErrors}
        />
      </motion.div>
    </div>
  );
}

