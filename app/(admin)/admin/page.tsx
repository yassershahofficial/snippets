"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatsCards } from "@/components/admin/StatsCards";
import { PostList } from "@/components/admin/PostList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePosts } from "@/hooks/usePosts";
import { motion } from "framer-motion";
import { Plus, FileText } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const { posts, loading, pagination, refetch } = usePosts({ limit: 5 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const recentPosts = posts.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your admin dashboard
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Link>
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <StatsCards
        totalPosts={pagination.total}
        recentPostsCount={recentPosts.length}
      />

      {/* Recent Posts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Posts
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/posts">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <PostList
              posts={recentPosts}
              onDelete={async (slug) => {
                // This will be handled by the posts page
                router.push("/admin/posts");
              }}
              isLoading={loading}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

