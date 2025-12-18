"use client";

import { useState } from "react";
import { PostList } from "@/components/admin/PostList";
import { DeletePostDialog } from "@/components/admin/DeletePostDialog";
import { Button } from "@/components/ui/button";
import { usePosts } from "@/hooks/usePosts";
import { motion } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function PostsPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<{
    slug: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [skip, setSkip] = useState(0);
  const limit = 10;

  const { posts, loading, pagination, removePost, setSkip: setSkipState, refetch } = usePosts({
    limit,
    skip,
    autoFetch: true,
  });

  const handleDeleteClick = (slug: string) => {
    const post = posts.find((p) => p.slug === slug);
    setPostToDelete({ slug, title: post?.title || "" });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      await removePost(postToDelete.slug);
      toast.success("Post deleted successfully");
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (newSkip: number) => {
    setSkip(newSkip);
    setSkipState(newSkip);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your blog posts
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </motion.div>

      {/* Posts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PostList
          posts={posts}
          onDelete={handleDeleteClick}
          isLoading={loading}
          onFeaturedToggle={refetch}
        />
      </motion.div>

      {/* Pagination */}
      {pagination.total > limit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between"
        >
          <p className="text-sm text-muted-foreground">
            Showing {skip + 1} to {Math.min(skip + limit, pagination.total)} of{" "}
            {pagination.total} posts
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(0, skip - limit))}
              disabled={skip === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(skip + limit)}
              disabled={!pagination.hasMore || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Delete Dialog */}
      <DeletePostDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        postTitle={postToDelete?.title}
        isLoading={isDeleting}
      />
    </div>
  );
}

