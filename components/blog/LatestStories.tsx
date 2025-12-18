"use client";

import Link from "next/link";
import { formatArticleDate } from "@/utils/date";
import { PostThumbnail } from "./PostThumbnail";
import { CategoryBadge } from "./CategoryBadge";
import { PostWithId } from "@/types/post";

interface LatestStoriesProps {
  posts: PostWithId[];
}

export function LatestStories({ posts }: LatestStoriesProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-jet-black mb-6 font-serif border-b border-ink-black pb-2">
        Latest Stories
      </h2>

      <div className="space-y-8">
        {posts.map((post) => {
          const firstTag = post.tags && post.tags.length > 0 ? post.tags[0] : "TECH";
          
          return (
            <article
              key={post._id}
              className="flex gap-6 items-center hover:bg-gray-50 transition-colors p-4 -mx-4 rounded"
            >
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="mb-2">
                  <CategoryBadge category={firstTag} />
                </div>

                <Link href={`/posts/${post.slug}`}>
                  <h3 className="text-2xl font-bold text-jet-black mb-2 font-serif hover:text-electric-blue transition-colors">
                    {post.title}
                  </h3>
                </Link>

                {post.description && (
                  <p className="text-gray-500 mb-3 line-clamp-2">
                    {post.description}
                  </p>
                )}

                <div className="text-sm text-gray-500">
                  {formatArticleDate(post.createdAt)}
                </div>
              </div>

              {/* Thumbnail - Right side with 1200×630 aspect ratio */}
              <Link href={`/posts/${post.slug}`} className="flex-shrink-0">
                <div 
                  className="relative overflow-hidden bg-gray-100"
                  style={{ 
                    aspectRatio: '1200/630',
                    width: '250px'
                  }}
                >
                  {post.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          const words = post.title.split(" ");
                          const initials = words.length >= 2 
                            ? (words[0][0] + words[1][0]).toUpperCase()
                            : post.title.substring(0, 2).toUpperCase();
                          parent.innerHTML = `
                            <div class="w-full h-full flex items-center justify-center">
                              <span class="text-gray-400 font-semibold text-sm">${initials}</span>
                            </div>
                          `;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-400 font-semibold text-sm">
                        {post.title.split(" ").length >= 2
                          ? (post.title.split(" ")[0][0] + post.title.split(" ")[1][0]).toUpperCase()
                          : post.title.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

