import { formatArticleDate } from "@/utils/date";
import { PostWithId } from "@/types/post";
import { PostThumbnail } from "./PostThumbnail";
import { renderTipTapContent } from "@/utils/tiptap-render";

interface ArticleContentProps {
  post: PostWithId;
  adminName: string;
}

export function ArticleContent({ post, adminName }: ArticleContentProps) {
  const renderedContent = renderTipTapContent(post.content);

  return (
    <article className="space-y-6">
      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1.5 border border-gray-300 text-sm text-ink-black hover:bg-gray-50 transition-colors uppercase tracking-wide"
            >
              {tag.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-jet-black font-serif leading-tight">
        {post.title}
      </h1>

      {/* Author and Date */}
      <div className="flex items-center gap-2 text-sm text-editorial-gray">
        <span className="font-semibold">BY {adminName.toUpperCase()}</span>
        <span>•</span>
        <span>{formatArticleDate(post.createdAt)}</span>
      </div>

      {/* Image */}
      {post.image_url && (
        <div className="w-full my-8">
          <PostThumbnail
            imageUrl={post.image_url}
            title={post.title}
            size="large"
            className="w-full"
          />
        </div>
      )}

      {/* Content */}
      <div
        className="ProseMirror max-w-none"
        dangerouslySetInnerHTML={{ __html: renderedContent }}
      />
    </article>
  );
}

