"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getAllTags, getFeaturedTags, updateFeaturedTags } from "@/lib/api/tags";
import { TagWithCount } from "@/types/featured-tags";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { motion } from "framer-motion";
import { Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeaturedTagsManager() {
  const { toast } = useToast();
  const [allTags, setAllTags] = useState<TagWithCount[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch all tags and current featured tags
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tags, featured] = await Promise.all([
          getAllTags(),
          getFeaturedTags(),
        ]);
        setAllTags(tags);
        setSelectedTags(featured.tags || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load tags",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        // Deselect tag
        return prev.filter((t) => t !== tag);
      } else {
        // Select tag (max 4)
        if (prev.length >= 4) {
          toast({
            title: "Limit reached",
            description: "You can only select up to 4 featured tags",
            variant: "destructive",
          });
          return prev;
        }
        return [...prev, tag];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFeaturedTags(selectedTags);
      sonnerToast.success("Featured tags saved successfully!", {
        description: `${selectedTags.length} tag${selectedTags.length !== 1 ? 's' : ''} ${selectedTags.length === 0 ? 'removed' : 'selected'} as featured.`,
        duration: 4000,
      });
    } catch (error) {
      sonnerToast.error("Failed to save featured tags", {
        description: "Please try again later.",
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Tags</CardTitle>
          <CardDescription>
            Select up to 4 tags to feature. Currently selected: {selectedTags.length} / 4
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag, index) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Badge
                    variant="default"
                    className="text-sm px-3 py-1.5 cursor-pointer hover:opacity-80"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No featured tags selected. Click on tags below to select them.
            </p>
          )}
        </CardContent>
      </Card>

      {/* All Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
          <CardDescription>
            Click on tags to add or remove them from featured tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allTags.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No tags found in the database.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tagData, index) => {
                const isSelected = selectedTags.includes(tagData.tag);
                const canSelect = !isSelected && selectedTags.length < 4;

                return (
                  <motion.div
                    key={tagData.tag}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "text-sm px-3 py-1.5 transition-all",
                        isSelected
                          ? "cursor-pointer hover:opacity-80"
                          : canSelect
                          ? "cursor-pointer hover:bg-accent"
                          : "cursor-not-allowed opacity-50"
                      )}
                      onClick={() => canSelect || isSelected ? handleTagToggle(tagData.tag) : undefined}
                    >
                      {tagData.tag}
                      <span className="ml-2 text-xs opacity-70">
                        ({tagData.count})
                      </span>
                    </Badge>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Featured Tags
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

