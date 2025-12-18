"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SidebarProps {
  featuredTags: string[];
  allTags: string[];
}

export function Sidebar({ featuredTags, allTags }: SidebarProps) {
  const [email, setEmail] = useState("");

  // Combine featured tags first, then other tags
  const displayTags = [
    ...featuredTags,
    ...allTags.filter((tag) => !featuredTags.includes(tag)),
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - no functionality yet
    console.log("Subscribe:", email);
  };

  return (
    <aside className="space-y-8">
      {/* Subscription Section */}
      <section className="bg-paper-gray p-6">
        <h3 className="text-xl font-bold text-jet-black mb-4 font-serif border-b border-ink-black pb-2">
          The Daily Snippet
        </h3>
        <p className="text-editorial-gray text-sm mb-4 mt-4">
          Get the latest code thoughts delivered straight to your inbox. No spam, just logic.
        </p>
        <form onSubmit={handleSubscribe} className="space-y-3">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white border-ink-black"
          />
          <Button
            type="submit"
            className="w-full bg-ink-black text-white hover:bg-jet-black uppercase tracking-wider text-sm font-semibold"
          >
            Subscribe
          </Button>
        </form>
      </section>

      {/* Tags Section */}
      <section className="bg-paper-gray p-6">
        <h3 className="text-xl font-bold text-jet-black mb-4 font-serif border-b border-ink-black pb-2">
          Explore Tags
        </h3>
        <div className="flex flex-wrap gap-2 mt-4">
          {displayTags.map((tag) => (
            <button
              key={tag}
              className="px-3 py-1.5 border border-gray-300 text-sm text-ink-black hover:bg-white hover:border-ink-black transition-colors uppercase tracking-wide"
            >
              {tag.toUpperCase()}
            </button>
          ))}
        </div>
      </section>
    </aside>
  );
}

