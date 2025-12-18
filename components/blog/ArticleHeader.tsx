import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface ArticleHeaderProps {
  firstTag: string | null;
}

export function ArticleHeader({ firstTag }: ArticleHeaderProps) {
  return (
    <header className="w-full border-b border-ink-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Left: Back to Home */}
          <Link
            href="/"
            className="flex items-center gap-2 text-ink-black hover:text-electric-blue transition-colors font-medium uppercase tracking-wide text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            BACK TO HOME
          </Link>

          {/* Center: SNIPPETS. */}
          <h1 className="text-3xl md:text-4xl font-bold text-jet-black font-serif">
            SNIPPETS.
          </h1>

          {/* Right: First Tag */}
          {firstTag ? (
            <span className="text-ink-black font-medium uppercase tracking-wider text-sm">
              {firstTag.toUpperCase()}
            </span>
          ) : (
            <div className="w-24" />
          )}
        </div>
      </div>
    </header>
  );
}

