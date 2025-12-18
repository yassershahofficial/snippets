"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PostWithId, toggleFeatured } from "@/lib/api/posts";
import { motion } from "framer-motion";
import { Edit, Trash2, Star } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PostListProps {
  posts: PostWithId[];
  onDelete: (slug: string) => void;
  isLoading?: boolean;
  onFeaturedToggle?: () => void;
}

export function PostList({ posts, onDelete, isLoading = false, onFeaturedToggle }: PostListProps) {
  const { toast } = useToast();
  const [loadingSlugs, setLoadingSlugs] = useState<Set<string>>(new Set());

  const handleToggleFeatured = async (slug: string, currentFeatured: boolean) => {
    setLoadingSlugs(prev => new Set(prev).add(slug));
    try {
      await toggleFeatured(slug, !currentFeatured);
      toast({
        title: "Success",
        description: currentFeatured ? "Post unfeatured" : "Post featured",
      });
      if (onFeaturedToggle) {
        onFeaturedToggle();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive",
      });
    } finally {
      setLoadingSlugs(prev => {
        const next = new Set(prev);
        next.delete(slug);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No posts found. Create your first post to get started!</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post, index) => (
            <motion.tr
              key={post._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-muted/50"
            >
              <TableCell className="font-medium">{post.title}</TableCell>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {post.slug}
                </code>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{post.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {post.createdAt
                  ? format(new Date(post.createdAt), "MMM d, yyyy")
                  : "—"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleFeatured(post.slug, post.featured || false)}
                    disabled={loadingSlugs.has(post.slug)}
                    className={`h-8 w-8 ${post.featured ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}`}
                    title={post.featured ? "Unfeature post" : "Feature post"}
                  >
                    <Star className={`h-4 w-4 ${post.featured ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    className="h-8 w-8"
                  >
                    <Link href={`/admin/posts/${post.slug}`} title="Edit post">
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(post.slug)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    title="Delete post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

