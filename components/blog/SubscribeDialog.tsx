"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubscribeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscribeDialog({ open, onOpenChange }: SubscribeDialogProps) {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - no functionality yet
    console.log("Subscribe:", email);
    // Optionally close dialog after submission
    // onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-white border-ink-black">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-jet-black mb-4 font-serif border-b border-ink-black pb-2">
            The Daily Snippet
          </DialogTitle>
          <DialogDescription className="text-editorial-gray text-sm mb-4 mt-4">
            Get the latest snippets thoughts delivered straight to your inbox. No spam, just facts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubscribe} className="space-y-3">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white border-ink-black"
            required
          />
          <Button
            type="submit"
            variant="default"
            className="w-full !bg-red-600 !text-white hover:!bg-red-700 uppercase tracking-wider text-sm font-semibold"
          >
            Subscribe
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

