import type { HeadingLevel, InlineContent, PostBody } from "./body";

export type TocEntry = {
  id: string;
  level: HeadingLevel;
  text: string;
};

export function inlinePlainText(content?: InlineContent[]): string {
  if (!content?.length) return "";
  return content
    .filter((node) => node.type === "text")
    .map((node) => node.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyHeading(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "section";
}

function uniqueId(base: string, used: Set<string>): string {
  let id = base;
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

/** Title as h1, then body h1–h3 in document order. Ids stay unique across the page. */
export function buildPostToc(title: string, body: PostBody | null): TocEntry[] {
  const used = new Set<string>();
  const entries: TocEntry[] = [];

  const titleText = title.replace(/\s+/g, " ").trim();
  if (titleText) {
    entries.push({
      id: uniqueId(slugifyHeading(titleText), used),
      level: 1,
      text: titleText,
    });
  }

  if (!body?.content?.length) return entries;

  for (const block of body.content) {
    if (block.type !== "heading") continue;
    const text = inlinePlainText(block.content);
    if (!text) continue;
    const level = block.attrs.level === 3 ? 3 : block.attrs.level === 1 ? 1 : 2;
    entries.push({
      id: uniqueId(slugifyHeading(text), used),
      level,
      text,
    });
  }

  return entries;
}

/** Body heading ids only, in the same order `buildPostToc` assigns after the title. */
export function bodyHeadingIds(title: string, body: PostBody): string[] {
  const toc = buildPostToc(title, body);
  const titleText = title.replace(/\s+/g, " ").trim();
  return titleText ? toc.slice(1).map((entry) => entry.id) : toc.map((entry) => entry.id);
}
