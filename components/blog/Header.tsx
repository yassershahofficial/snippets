"use client";

import Link from "next/link";
import { formatEditorialDate } from "@/utils/date";

interface HeaderProps {
  featuredTags: string[];
  allTags: string[];
  currentDate: Date;
}

export function Header({ featuredTags, allTags, currentDate }: HeaderProps) {
  // Combine featured tags first, then other tags
  const navigationTags = [
    ...featuredTags,
    ...allTags.filter((tag) => !featuredTags.includes(tag)),
  ].slice(0, 5); // Limit to 5 for navigation

  return (
    <header className="w-full">
      {/* Top bar */}
      <div className="border-b border-ink-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 text-sm">
            <div className="text-editorial-gray font-medium">
              {formatEditorialDate(currentDate)}
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="text-ink-black hover:text-electric-blue hover:bg-gray-50 transition-colors font-medium uppercase tracking-wide px-2 py-1 rounded"
              >
                Sign In
              </Link>
              <div className="h-4 w-px bg-ink-black" />
              <button className="text-ink-black hover:text-electric-blue hover:bg-gray-50 transition-colors font-medium uppercase tracking-wide px-2 py-1 rounded">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logo */}
      <div className="border-b border-ink-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-[4.5rem] md:text-[5.625rem] font-bold text-jet-black text-center font-serif">
            SNIPPETS.
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-ink-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="flex flex-wrap justify-center items-center gap-6 py-4">
            {navigationTags.map((tag) => (
              <li key={tag}>
                <button className="text-ink-black hover:text-electric-blue hover:bg-gray-50 transition-colors font-medium uppercase tracking-wider text-sm px-3 py-1 rounded">
                  {tag.toUpperCase()}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}

