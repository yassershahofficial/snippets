import type {
  Block,
  BulletListNode,
  CalloutVariant,
  HeadingLevel,
  ImageCrop,
  ImageNode,
  ImageRatio,
  ImageSize,
  ListItemNode,
  Mark,
  OrderedListNode,
  ParagraphNode,
  PostBody,
  TextNode,
} from "./body";
import { IMAGE_RATIOS, IMAGE_SIZES, IMAGE_TEXT_MAX, MIN_CROP, ratioValue } from "./image";
import { MEDIA_MAX_HEIGHT, MEDIA_MAX_WIDTH } from "@/lib/media/limits";

/**
 * Converts between the stored post body (snake_case AST in body.ts) and the
 * Tiptap editor JSON (camelCase). The editor side is untrusted input: every
 * node, mark and attribute is checked against what the renderer can show.
 */

export type EditorMark = { type: string; attrs?: Record<string, unknown> };

export type EditorNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: EditorNode[];
  marks?: EditorMark[];
  text?: string;
};

export const BODY_LIMITS = {
  jsonLength: 300_000,
  nodes: 5_000,
  listDepth: 4,
  hrefLength: 2_048,
} as const;

export const CALLOUT_VARIANTS: CalloutVariant[] = ["info", "tip", "warning", "danger"];

const SIMPLE_MARKS = new Set(["bold", "italic", "underline", "strike", "code"]);

export function isSafeHref(value: unknown): value is string {
  if (typeof value !== "string" || value.length > BODY_LIMITS.hrefLength) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

// Stored body to editor ---------------------------------------------------------

function marksToEditor(marks: Mark[] | undefined): EditorMark[] | undefined {
  if (!marks?.length) return undefined;
  return marks.map((m) => (m.type === "link" ? { type: "link", attrs: { href: m.href } } : { type: m.type }));
}

function inlineToEditor(content: TextNode[] | undefined): EditorNode[] | undefined {
  const nodes = (content ?? [])
    .filter((n) => n.type === "text" && n.text)
    .map((n) => {
      const marks = marksToEditor(n.marks);
      return marks ? { type: "text", text: n.text, marks } : { type: "text", text: n.text };
    });
  return nodes.length ? nodes : undefined;
}

function withContent(type: string, content: EditorNode[] | undefined, attrs?: EditorNode["attrs"]) {
  const node: EditorNode = { type };
  if (attrs) node.attrs = attrs;
  if (content?.length) node.content = content;
  return node;
}

function paragraphsToEditor(paragraphs: ParagraphNode[] | undefined): EditorNode[] {
  const nodes = (paragraphs ?? []).map((p) => withContent("paragraph", inlineToEditor(p.content)));
  return nodes.length ? nodes : [{ type: "paragraph" }];
}

function listToEditor(list: BulletListNode | OrderedListNode): EditorNode {
  const items = (list.content ?? []).map((item) => {
    const children: EditorNode[] = [];
    for (const child of item.content ?? []) {
      if (child.type === "paragraph") children.push(withContent("paragraph", inlineToEditor(child.content)));
      else children.push(listToEditor(child));
    }
    if (children[0]?.type !== "paragraph") children.unshift({ type: "paragraph" });
    return { type: "listItem", content: children };
  });
  return {
    type: list.type === "bullet_list" ? "bulletList" : "orderedList",
    content: items.length ? items : [{ type: "listItem", content: [{ type: "paragraph" }] }],
  };
}

function blockToEditor(block: Block): EditorNode | null {
  switch (block.type) {
    case "paragraph":
      return withContent("paragraph", inlineToEditor(block.content));
    case "heading":
      return withContent("heading", inlineToEditor(block.content), {
        level: block.attrs.level === 3 ? 3 : 2,
      });
    case "blockquote":
      return { type: "blockquote", content: paragraphsToEditor(block.content) };
    case "code_block":
      return withContent("codeBlock", inlineToEditor(block.content));
    case "horizontal_rule":
      return { type: "horizontalRule" };
    case "bullet_list":
    case "ordered_list":
      return listToEditor(block);
    case "image":
      return { type: "image", attrs: { ...block.attrs } };
    case "callout":
      return {
        type: "callout",
        attrs: { variant: block.attrs.variant },
        content: paragraphsToEditor(block.content),
      };
    // Title and description live in their own fields and are never rendered from the body.
    case "title":
    case "description":
      return null;
    default:
      return null;
  }
}

export function bodyToEditorDoc(body: PostBody | null): EditorNode {
  const content = (body?.content ?? [])
    .map(blockToEditor)
    .filter((n): n is EditorNode => n !== null);
  // The editor keeps an empty paragraph at the end; adding it up front stops
  // the first click from counting as an unsaved change. Saving trims it.
  if (content.at(-1)?.type !== "paragraph") content.push({ type: "paragraph" });
  return { type: "doc", content };
}

// Editor to stored body -----------------------------------------------------------

class BodyError extends Error {}

function reject(message: string): never {
  throw new BodyError(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type Context = { nodes: number };

function childrenOf(node: Record<string, unknown>, ctx: Context): Record<string, unknown>[] {
  if (node.content === undefined) return [];
  if (!Array.isArray(node.content)) reject("The body is malformed.");
  ctx.nodes += node.content.length;
  if (ctx.nodes > BODY_LIMITS.nodes) reject("The body is too long. Split it into more than one post.");
  return node.content.map((child) => (isRecord(child) ? child : reject("The body is malformed.")));
}

function readMarks(raw: unknown): Mark[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) reject("The body is malformed.");
  const marks: Mark[] = [];
  const seen = new Set<string>();
  for (const mark of raw) {
    if (!isRecord(mark) || typeof mark.type !== "string") reject("The body is malformed.");
    if (seen.has(mark.type)) continue;
    seen.add(mark.type);
    if (SIMPLE_MARKS.has(mark.type)) {
      marks.push({ type: mark.type } as Mark);
    } else if (mark.type === "link") {
      const href = isRecord(mark.attrs) ? mark.attrs.href : undefined;
      if (!isSafeHref(href)) reject("Links must be full web addresses starting with http:// or https://.");
      marks.push({ type: "link", href: href.trim() });
    } else {
      reject(`"${mark.type}" formatting isn't supported.`);
    }
  }
  return marks.length ? marks : undefined;
}

function readInline(
  node: Record<string, unknown>,
  ctx: Context,
  allowMarks: boolean,
): TextNode[] | undefined {
  const out: TextNode[] = [];
  for (const child of childrenOf(node, ctx)) {
    if (child.type !== "text" || typeof child.text !== "string") {
      reject("The body contains content the site can't show.");
    }
    if (!child.text) continue;
    const marks = readMarks(child.marks);
    if (marks && !allowMarks) reject("Code blocks can't contain formatting.");
    out.push(marks ? { type: "text", text: child.text, marks } : { type: "text", text: child.text });
  }
  return out.length ? out : undefined;
}

function readParagraph(node: Record<string, unknown>, ctx: Context): ParagraphNode {
  const content = readInline(node, ctx, true);
  return content ? { type: "paragraph", content } : { type: "paragraph" };
}

function readParagraphs(node: Record<string, unknown>, ctx: Context, where: string): ParagraphNode[] {
  return childrenOf(node, ctx).map((child) =>
    child.type === "paragraph" ? readParagraph(child, ctx) : reject(`${where} can only contain plain paragraphs.`),
  );
}

function readList(node: Record<string, unknown>, ctx: Context, depth: number): BulletListNode | OrderedListNode {
  if (depth > BODY_LIMITS.listDepth) reject(`Lists can be nested at most ${BODY_LIMITS.listDepth} levels deep.`);
  const items: ListItemNode[] = childrenOf(node, ctx).map((item) => {
    if (item.type !== "listItem") reject("The body contains a malformed list.");
    const content = childrenOf(item, ctx).map((child) => {
      if (child.type === "paragraph") return readParagraph(child, ctx);
      if (child.type === "bulletList" || child.type === "orderedList") return readList(child, ctx, depth + 1);
      return reject("List items can only contain paragraphs and nested lists.");
    });
    return { type: "list_item", content };
  });
  return node.type === "bulletList"
    ? { type: "bullet_list", content: items }
    : { type: "ordered_list", content: items };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readDimension(value: unknown, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > max) {
    reject("An image has an invalid size. Upload it again.");
  }
  return value;
}

function readImageText(value: unknown, what: string): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") reject("The body is malformed.");
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length > IMAGE_TEXT_MAX) reject(`Image ${what} can be at most ${IMAGE_TEXT_MAX} characters.`);
  return text;
}

function readCrop(value: unknown, width: number, height: number, ratio: number): ImageCrop {
  if (!isRecord(value)) reject("An image crop is missing. Edit the image and pick its shape again.");
  const parts = [value.x, value.y, value.w, value.h];
  if (!parts.every((n) => typeof n === "number" && Number.isFinite(n))) reject("An image crop is invalid.");
  const [x, y, w, h] = parts as number[];
  const edge = 0.001;
  if (x < 0 || y < 0 || w < MIN_CROP - edge || h < MIN_CROP - edge || x + w > 1 + edge || y + h > 1 + edge) {
    reject("An image crop is outside the image.");
  }
  const shape = (w * width) / (h * height);
  if (Math.abs(shape - ratio) / ratio > 0.02) reject("An image crop doesn't match its shape.");
  return { x, y, w, h };
}

function readImage(node: Record<string, unknown>): ImageNode {
  const attrs = isRecord(node.attrs) ? node.attrs : {};
  if (typeof attrs.media !== "string" || !UUID.test(attrs.media)) {
    reject("An image is missing its upload. Remove it and add it again.");
  }
  const width = readDimension(attrs.width, MEDIA_MAX_WIDTH);
  const height = readDimension(attrs.height, MEDIA_MAX_HEIGHT);
  const size = IMAGE_SIZES.includes(attrs.size as ImageSize) ? (attrs.size as ImageSize) : reject("An image has an unknown size.");
  const ratio = IMAGE_RATIOS.includes(attrs.ratio as ImageRatio)
    ? (attrs.ratio as ImageRatio)
    : reject("An image has an unknown shape.");
  const value = ratioValue(ratio);
  const crop = value === null ? null : readCrop(attrs.crop, width, height, value);
  const decorative = attrs.decorative === true;
  const alt = decorative ? "" : readImageText(attrs.alt, "alt text");
  if (!decorative && !alt) reject("Every image needs alt text, or mark it as decorative.");
  const caption = readImageText(attrs.caption, "captions");
  return {
    type: "image",
    attrs: { media: attrs.media.toLowerCase(), width, height, size, ratio, crop, alt, decorative, caption },
  };
}

function readBlock(node: Record<string, unknown>, ctx: Context): Block {
  switch (node.type) {
    case "paragraph":
      return readParagraph(node, ctx);
    case "heading": {
      const level = isRecord(node.attrs) ? node.attrs.level : undefined;
      if (level !== 1 && level !== 2 && level !== 3) reject("Headings must be level 2 or 3.");
      const content = readInline(node, ctx, true);
      return { type: "heading", attrs: { level: level as HeadingLevel }, ...(content ? { content } : {}) };
    }
    case "blockquote":
      return { type: "blockquote", content: readParagraphs(node, ctx, "Quotes") };
    case "codeBlock": {
      const content = readInline(node, ctx, false);
      return content ? { type: "code_block", content } : { type: "code_block" };
    }
    case "horizontalRule":
      return { type: "horizontal_rule" };
    case "bulletList":
    case "orderedList":
      return readList(node, ctx, 1);
    case "image":
      return readImage(node);
    case "callout": {
      const variant = isRecord(node.attrs) ? node.attrs.variant : undefined;
      if (!CALLOUT_VARIANTS.includes(variant as CalloutVariant)) reject("A callout has an unknown style.");
      return {
        type: "callout",
        attrs: { variant: variant as CalloutVariant },
        content: readParagraphs(node, ctx, "Callouts"),
      };
    }
    default:
      return reject("The body contains content the site can't show.");
  }
}

function isEmptyParagraph(block: Block): boolean {
  return block.type === "paragraph" && !block.content?.length;
}

/** Validates editor JSON and converts it to the stored body. */
export function editorJsonToBody(json: string): { body: PostBody } | { error: string } {
  if (json.length > BODY_LIMITS.jsonLength) {
    return { error: "The body is too long. Split it into more than one post." };
  }
  let doc: unknown;
  try {
    doc = JSON.parse(json);
  } catch {
    return { error: "The body couldn't be read. Reload the page and try again." };
  }

  try {
    if (!isRecord(doc) || doc.type !== "doc") reject("The body is malformed.");
    const ctx: Context = { nodes: 0 };
    const blocks = childrenOf(doc, ctx).map((child) => readBlock(child, ctx));
    while (blocks.length && isEmptyParagraph(blocks[0])) blocks.shift();
    while (blocks.length && isEmptyParagraph(blocks[blocks.length - 1])) blocks.pop();
    return { body: { type: "doc", content: blocks } };
  } catch (error) {
    if (error instanceof BodyError) return { error: error.message };
    throw error;
  }
}

export function countWords(body: PostBody | null): number {
  let words = 0;
  const visit = (nodes: unknown[] | undefined) => {
    for (const node of nodes ?? []) {
      if (!isRecord(node)) continue;
      if (node.type === "title" || node.type === "description") continue;
      if (node.type === "text" && typeof node.text === "string") {
        words += node.text.split(/\s+/).filter(Boolean).length;
      }
      if (Array.isArray(node.content)) visit(node.content);
    }
  };
  visit(body?.content);
  return words;
}
