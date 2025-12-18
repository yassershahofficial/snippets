import connectDB from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import FeaturedTags from "@/models/FeaturedTags";
import { Header } from "@/components/blog/Header";
import { FeaturedArticle } from "@/components/blog/FeaturedArticle";
import { LatestStories } from "@/components/blog/LatestStories";
import { Sidebar } from "@/components/blog/Sidebar";
import { PostWithId } from "@/types/post";

async function getFeaturedPost(): Promise<PostWithId | null> {
  try {
    await connectDB();
    const post = await Post.findOne({ featured: true }).lean();
    if (!post) return null;
    return {
      _id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      content: post.content,
      description: post.description,
      tags: post.tags || [],
      featured: post.featured || false,
      image_url: post.image_url,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  } catch {
    return null;
  }
}

async function getLatestPosts(): Promise<PostWithId[]> {
  try {
    await connectDB();
    const posts = await Post.find({ featured: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    return posts.map((post) => ({
      _id: post._id.toString(),
      title: post.title,
      slug: post.slug,
      content: post.content,
      description: post.description,
      tags: post.tags || [],
      featured: post.featured || false,
      image_url: post.image_url,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));
  } catch {
    return [];
  }
}

async function getFeaturedTags(): Promise<string[]> {
  try {
    await connectDB();
    let featuredTags = await FeaturedTags.findOne();
    if (!featuredTags) {
      featuredTags = await FeaturedTags.create({ tags: [] });
    }
    return featuredTags.tags || [];
  } catch {
    return [];
  }
}

async function getAllTags(): Promise<string[]> {
  try {
    await connectDB();
    const tagsWithCounts = await Post.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags" } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, tag: "$_id" } },
    ]);
    return tagsWithCounts.map((item: { tag: string }) => item.tag);
  } catch {
    return [];
  }
}

async function getAdminName(): Promise<string> {
  try {
    await connectDB();
    const admin = await User.findOne({ role: "admin" }).lean();
    return admin?.name || "ADMIN";
  } catch {
    return "ADMIN";
  }
}

export default async function Home() {
  const [featuredPost, latestPosts, featuredTags, allTags, adminName] =
    await Promise.all([
      getFeaturedPost(),
      getLatestPosts(),
      getFeaturedTags(),
      getAllTags(),
      getAdminName(),
    ]);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header
          featuredTags={featuredTags}
          allTags={allTags}
          currentDate={new Date()}
        />

        <div className="py-12 space-y-12">
          {/* Featured Article - Full Width */}
          {featuredPost && (
            <FeaturedArticle post={featuredPost} adminName={adminName} />
          )}

          {/* Latest Stories and Sidebar - Shared Width */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Latest Stories */}
            <div className="lg:col-span-2">
              <LatestStories posts={latestPosts} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Sidebar featuredTags={featuredTags} allTags={allTags} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
