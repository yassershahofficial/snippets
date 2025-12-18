"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TOCItem } from "@/utils/tiptap-render";

interface ArticleSidebarProps {
  toc: TOCItem[];
}

export function ArticleSidebar({ toc }: ArticleSidebarProps) {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - no functionality yet
    console.log("Subscribe:", email);
    setEmail("");
  };

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderTOCItems = (items: TOCItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.id} className={level > 0 ? "ml-4 mt-1" : ""}>
        <button
          onClick={() => scrollToHeading(item.id)}
          className="text-left text-sm text-ink-black hover:text-electric-blue transition-colors block w-full py-1"
        >
          {item.level === 2 ? (
            <span className="font-semibold">{item.text}</span>
          ) : (
            <span className="text-editorial-gray">- {item.text}</span>
          )}
        </button>
        {item.children && item.children.length > 0 && (
          <div className="mt-1">{renderTOCItems(item.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <aside className="space-y-8">
      {/* Table of Contents */}
      {toc.length > 0 && (
        <section className="bg-paper-gray p-6">
          <h3 className="text-xl font-bold text-jet-black mb-4 font-serif border-b border-ink-black pb-2">
            TABLE OF CONTENTS
          </h3>
          <nav className="mt-4 space-y-1">
            {renderTOCItems(toc)}
          </nav>
        </section>
      )}

      {/* Newsletter Subscription */}
      <section className="bg-paper-gray p-6">
        <h3 className="text-xl font-bold text-jet-black mb-4 font-serif border-b border-ink-black pb-2">
          GET UPDATES
        </h3>
        <p className="text-editorial-gray text-sm mb-4 mt-4">
          Join now 4,000+ people are reading SNIPPETS.
        </p>
        <form onSubmit={handleSubscribe} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Email..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white border-ink-black flex-1"
            />
            <Button
              type="submit"
              variant="default"
              className="!bg-ink-black !text-white hover:!bg-gray-800 px-4"
            >
              →
            </Button>
          </div>
        </form>
      </section>
    </aside>
  );
}

