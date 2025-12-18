import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { TipTapContent } from "@/types/post";
import { generateSlug } from "@/utils/slug";

export interface TOCItem {
  id: string;
  text: string;
  level: number;
  children?: TOCItem[];
}

/**
 * Extract text content from a TipTap node recursively
 */
function extractText(node: TipTapContent): string {
  if (node.text) {
    return node.text;
  }
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractText).join("");
  }
  return "";
}

/**
 * Extract table of contents from TipTap content (H2 and H3 headings)
 */
export function extractTOC(content: TipTapContent | TipTapContent[]): TOCItem[] {
  const toc: TOCItem[] = [];
  const stack: TOCItem[] = []; // Stack to track parent H2 items

  function traverse(node: TipTapContent | TipTapContent[]) {
    const nodes = Array.isArray(node) ? node : [node];

    for (const item of nodes) {
      if (item.type === "heading" && item.attrs?.level) {
        const level = item.attrs.level as number;
        if (level === 2 || level === 3) {
          const text = extractText(item);
          if (text) {
            const id = generateSlug(text);
            const tocItem: TOCItem = {
              id,
              text,
              level,
            };

            if (level === 2) {
              // H2 - new top-level item
              toc.push(tocItem);
              stack.length = 0; // Clear stack, new H2
              stack.push(tocItem);
            } else if (level === 3) {
              // H3 - child of current H2
              const parent = stack[stack.length - 1];
              if (parent) {
                if (!parent.children) {
                  parent.children = [];
                }
                parent.children.push(tocItem);
              } else {
                // No H2 parent, add as top-level
                toc.push(tocItem);
              }
            }
          }
        }
      }

      // Recursively traverse children
      if (item.content) {
        traverse(item.content);
      }
    }
  }

  traverse(content);
  return toc;
}

/**
 * Generate HTML from TipTap JSON content with heading IDs for TOC
 */
export function renderTipTapContent(content: TipTapContent | TipTapContent[]): string {
  // Generate HTML using TipTap
  let html = generateHTML(content, [StarterKit]);

  // Add IDs to h2 and h3 headings for anchor links
  // This ensures headings can be linked to from the TOC
  html = html.replace(/<h2>([^<]+)<\/h2>/gi, (match, text) => {
    const id = generateSlug(text.trim());
    return `<h2 id="${id}">${text}</h2>`;
  });
  html = html.replace(/<h3>([^<]+)<\/h3>/gi, (match, text) => {
    const id = generateSlug(text.trim());
    return `<h3 id="${id}">${text}</h3>`;
  });

  return html;
}


