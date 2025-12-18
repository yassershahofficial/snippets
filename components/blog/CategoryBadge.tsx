import { getCategoryColor } from "@/utils/categoryColors";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className = "" }: CategoryBadgeProps) {
  return (
    <span
      className={`text-xs font-semibold tracking-wider uppercase text-gray-500 ${className}`}
    >
      {category.toUpperCase()}
    </span>
  );
}

