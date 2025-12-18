"use client";

import { PostForm } from "@/components/admin/PostForm";
import { usePostForm } from "@/hooks/usePostForm";
import { PostInput } from "@/types/post";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NewPostPage() {
  const router = useRouter();
  const { submit, loading, fieldErrors } = usePostForm({
    onSuccess: () => {
      toast.success("Post created successfully!");
      router.push("/admin/posts");
    },
  });

  const handleSubmit = async (data: PostInput) => {
    try {
      await submit(data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : null;
      toast.error(message || "Failed to create post");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold">Create New Post</h1>
        <p className="text-muted-foreground mt-1">
          Fill in the details below to create a new blog post
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PostForm
          onSubmit={handleSubmit}
          isLoading={loading}
          fieldErrors={fieldErrors}
        />
      </motion.div>
    </div>
  );
}

