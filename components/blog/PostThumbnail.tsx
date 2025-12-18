"use client";

import { useState } from "react";

interface PostThumbnailProps {
  imageUrl?: string;
  title: string;
  className?: string;
  size?: "default" | "large";
}

export function PostThumbnail({
  imageUrl,
  title,
  className = "",
  size = "default",
}: PostThumbnailProps) {
  const [imageError, setImageError] = useState(false);
  const sizeClasses = size === "large" ? "w-full h-64" : "w-24 h-24";
  
  // Get initials from title
  const getInitials = (text: string): string => {
    const words = text.split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  if (imageUrl && !imageError) {
    return (
      <div className={`relative ${sizeClasses} ${className} overflow-hidden bg-gray-100`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Default placeholder
  return (
    <div
      className={`${sizeClasses} ${className} bg-gray-100 flex items-center justify-center`}
    >
      {size === "large" ? (
        <div className="text-center">
          <div className="text-4xl text-gray-400 mb-2">&lt;/&gt;</div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">
            [ Visual Preview ]
          </div>
        </div>
      ) : (
        <span className="text-gray-400 font-semibold text-sm">
          {getInitials(title)}
        </span>
      )}
    </div>
  );
}

