import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import FeaturedTags from "@/models/FeaturedTags";
import { ArticleHeader } from "@/components/blog/ArticleHeader";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { ArticleSidebar } from "@/components/blog/ArticleSidebar";
import { PostWithId } from "@/types/post";
import { extractTOC } from "@/utils/tiptap-render";

async function getPost(slug: string): Promise<PostWithId | null> {
  try {
    await connectDB();
    const post = await Post.findOne({ slug }).lean();
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

async function getAdminName(): Promise<string> {
  try {
    await connectDB();
    const admin = await User.findOne({ role: "admin" }).lean();
    return admin?.name || "ADMIN";
  } catch {
    return "ADMIN";
  }
}

function getFirstTag(post: PostWithId, featuredTags: string[]): string | null {
  // Check if any of the post's tags are featured tags
  const featuredTagInPost = post.tags.find((tag) =>
    featuredTags.includes(tag)
  );
  if (featuredTagInPost) {
    return featuredTagInPost;
  }
  // Otherwise, return the first tag
  return post.tags.length > 0 ? post.tags[0] : null;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const [post, featuredTags, adminName] = await Promise.all([
    getPost(slug),
    getFeaturedTags(),
    getAdminName(),
  ]);

  if (!post) {
    notFound();
  }

  const firstTag = getFirstTag(post, featuredTags);
  const toc = extractTOC(post.content);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ArticleHeader firstTag={firstTag} />

        <div className="py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <ArticleContent post={post} adminName={adminName} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-0 lg:self-start">
                <ArticleSidebar toc={toc} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

