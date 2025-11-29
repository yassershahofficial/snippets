import { TipTapContent } from "@/types/post";

/**
 * Check if content has an H1 heading
 */
function hasH1Heading(content: TipTapContent | TipTapContent[]): boolean {
  if (Array.isArray(content)) {
    return content.some((node) => {
      if (node.type === "heading" && node.attrs?.level === 1) {
        return true;
      }
      if (node.content) {
        return hasH1Heading(node.content);
      }
      return false;
    });
  }

  if (content.type === "heading" && content.attrs?.level === 1) {
    return true;
  }

  if (content.content) {
    return hasH1Heading(content.content);
  }

  return false;
}

/**
 * Extract first text content from TipTap structure
 */
function getFirstTextContent(
  content: TipTapContent | TipTapContent[]
): string | null {
  if (Array.isArray(content)) {
    for (const node of content) {
      const text = getFirstTextContent(node);
      if (text) return text;
    }
    return null;
  }

  if (content.text) {
    return content.text;
  }

  if (content.content) {
    return getFirstTextContent(content.content);
  }

  return null;
}

/**
 * Auto-detect first line as H1 if not marked
 * If the first content node is not an H1, convert it to H1
 */
export function autoDetectH1(
  content: TipTapContent | TipTapContent[]
): TipTapContent | TipTapContent[] {
  // If already has H1, return as is
  if (hasH1Heading(content)) {
    return content;
  }

  // If content is an array, check first node
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return content;
    }

    const firstNode = content[0];

    // If first node is already a heading, upgrade to H1
    if (firstNode.type === "heading") {
      return [
        {
          ...firstNode,
          attrs: {
            ...firstNode.attrs,
            level: 1,
          },
        },
        ...content.slice(1),
      ];
    }

    // If first node is a paragraph, convert to H1
    if (firstNode.type === "paragraph") {
      const firstText = getFirstTextContent(firstNode);
      if (firstText) {
        return [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [
              {
                type: "text",
                text: firstText,
              },
            ],
          },
          ...content.slice(1),
        ];
      }
    }

    // If first node has text content, wrap in H1
    const firstText = getFirstTextContent(firstNode);
    if (firstText) {
      return [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [
            {
              type: "text",
              text: firstText,
            },
          ],
        },
        ...content.slice(1),
      ];
    }

    return content;
  }

  // Single content node
  // If it's already a heading, upgrade to H1
  if (content.type === "heading") {
    return {
      ...content,
      attrs: {
        ...content.attrs,
        level: 1,
      },
    };
  }

  // If it's a paragraph, convert to H1
  if (content.type === "paragraph") {
    const firstText = getFirstTextContent(content);
    if (firstText) {
      return {
        type: "heading",
        attrs: { level: 1 },
        content: [
          {
            type: "text",
            text: firstText,
          },
        ],
      };
    }
  }

  // If it has text, wrap in H1
  const firstText = getFirstTextContent(content);
  if (firstText) {
    return {
      type: "heading",
      attrs: { level: 1 },
      content: [
        {
          type: "text",
          text: firstText,
        },
      ],
    };
  }

  // Default: wrap in doc with H1
  return {
    type: "doc",
    content: [
      {
        type: "heading",
        attrs: { level: 1 },
        content: [
          {
            type: "text",
            text: "Untitled",
          },
        ],
      },
      ...(content.content || [content]),
    ],
  };
}

/**
 * Process TipTap content: ensure proper structure and auto-detect H1
 */
export function processTipTapContent(
  content: TipTapContent | TipTapContent[]
): TipTapContent | TipTapContent[] {
  // Auto-detect H1 if needed
  const processed = autoDetectH1(content);

  // Ensure content is wrapped in doc if it's an array at root
  if (Array.isArray(processed)) {
    return {
      type: "doc",
      content: processed,
    };
  }

  // If single node is not a doc, wrap it
  if (processed.type !== "doc") {
    return {
      type: "doc",
      content: [processed],
    };
  }

  return processed;
}

