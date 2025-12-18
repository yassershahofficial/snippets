"use client";

import Link from "next/link";
import { formatArticleDate } from "@/utils/date";
import { PostThumbnail } from "./PostThumbnail";
import { PostWithId } from "@/types/post";

interface FeaturedArticleProps {
  post: PostWithId;
  adminName: string;
}

export function FeaturedArticle({ post, adminName }: FeaturedArticleProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 hover:bg-gray-50 transition-colors p-4 -mx-4 rounded">
      {/* Left Column - Content */}
      <div className="flex flex-col justify-between">
        <div>
          {/* Featured Badge */}
          <div className="mb-4">
            <span className="inline-block bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
              Featured
            </span>
          </div>

          {/* Headline */}
          <Link href={`/posts/${post.slug}`}>
            <h2 className="text-4xl md:text-5xl font-bold text-jet-black mb-4 font-serif leading-tight hover:text-electric-blue transition-colors">
              {post.title}
            </h2>
          </Link>

          {/* Description */}
          {post.description && (
            <p className="text-lg text-gray-500 mb-6 leading-relaxed">
              {post.description}
            </p>
          )}

          {/* Author and Date */}
          <div className="text-sm text-gray-500">
            <span className="font-semibold">BY {adminName.toUpperCase()}</span>
            <span className="mx-2">•</span>
            <span>{formatArticleDate(post.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Right Column - Image */}
      <div className="flex items-center">
        <PostThumbnail
          imageUrl={post.image_url}
          title={post.title}
          size="large"
          className="w-full"
        />
      </div>
    </section>
  );
}

