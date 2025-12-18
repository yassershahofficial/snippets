/**
 * Map category/tag names to color codes
 * Returns a color class name for Tailwind
 */
export function getCategoryColor(category: string): string {
  const normalized = category.toUpperCase();
  
  // Color mapping based on common categories
  const colorMap: Record<string, string> = {
    // Hardware/SystemVerilog
    "HARDWARE": "text-deep-navy",
    "HARDWARE DESIGN": "text-deep-navy",
    "SYSTEMVERILOG": "text-deep-navy",
    "SV": "text-deep-navy",
    
    // Data/Python
    "DATA MINING": "text-forest-green",
    "PYTHON": "text-forest-green",
    "PY": "text-forest-green",
    "DATA": "text-forest-green",
    "NLP": "text-forest-green",
    
    // Web/React
    "REACT": "text-electric-blue",
    "REACTJS": "text-electric-blue",
    "WEB": "text-electric-blue",
    "FRONTEND": "text-electric-blue",
    
    // DevOps/Infrastructure
    "DEVOPS": "text-royal-purple",
    "INFRASTRUCTURE": "text-royal-purple",
    "DEPLOYMENT": "text-royal-purple",
    
    // Algorithm/General
    "ALGORITHM": "text-editorial-gray",
    "CODING": "text-editorial-gray",
    "TECH": "text-editorial-gray",
  };
  
  // Try exact match first
  if (colorMap[normalized]) {
    return colorMap[normalized];
  }
  
  // Try partial match
  for (const [key, color] of Object.entries(colorMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return color;
    }
  }
  
  // Default color
  return "text-editorial-gray";
}

/**
 * Get background color for category badge
 */
export function getCategoryBgColor(category: string): string {
  const normalized = category.toUpperCase();
  
  const bgColorMap: Record<string, string> = {
    "HARDWARE": "bg-blue-50",
    "HARDWARE DESIGN": "bg-blue-50",
    "SYSTEMVERILOG": "bg-blue-50",
    "SV": "bg-blue-50",
    
    "DATA MINING": "bg-green-50",
    "PYTHON": "bg-green-50",
    "PY": "bg-green-50",
    "DATA": "bg-green-50",
    "NLP": "bg-green-50",
    
    "REACT": "bg-blue-50",
    "REACTJS": "bg-blue-50",
    "WEB": "bg-blue-50",
    "FRONTEND": "bg-blue-50",
    
    "DEVOPS": "bg-purple-50",
    "INFRASTRUCTURE": "bg-purple-50",
    "DEPLOYMENT": "bg-purple-50",
    
    "ALGORITHM": "bg-gray-50",
    "CODING": "bg-gray-50",
    "TECH": "bg-gray-50",
  };
  
  if (bgColorMap[normalized]) {
    return bgColorMap[normalized];
  }
  
  for (const [key, color] of Object.entries(bgColorMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return color;
    }
  }
  
  return "bg-gray-50";
}

