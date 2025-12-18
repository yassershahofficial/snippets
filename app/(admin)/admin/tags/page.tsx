"use client";

import { useEffect, useState } from "react";
import { FeaturedTagsManager } from "@/components/admin/FeaturedTagsManager";
import { motion } from "framer-motion";
import { Tag } from "lucide-react";

export default function TagsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold">Featured Tags</h1>
          <p className="text-muted-foreground mt-1">
            Manage your featured tags (select up to 4)
          </p>
        </div>
      </motion.div>

      {/* Featured Tags Manager */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FeaturedTagsManager />
      </motion.div>
    </div>
  );
}

