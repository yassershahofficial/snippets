/** Post body document AST. Stored in snippets.posts.body as jsonb. */

export type CalloutVariant = "info" | "tip" | "warning" | "danger";

export type HeadingLevel = 1 | 2 | 3;

export type Mark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "underline" }
  | { type: "strike" }
  | { type: "code" }
  | { type: "link"; href: string };

export type TextNode = {
  type: "text";
  text: string;
  marks?: Mark[];
};

export type InlineContent = TextNode;

export type ParagraphNode = {
  type: "paragraph";
  content?: InlineContent[];
};

export type TitleNode = {
  type: "title";
  content?: InlineContent[];
};

export type DescriptionNode = {
  type: "description";
  content?: InlineContent[];
};

export type HeadingNode = {
  type: "heading";
  attrs: { level: HeadingLevel };
  content?: InlineContent[];
};

export type BlockquoteNode = {
  type: "blockquote";
  content?: ParagraphNode[];
};

export type CodeBlockNode = {
  type: "code_block";
  content?: TextNode[];
};

export type HorizontalRuleNode = {
  type: "horizontal_rule";
};

export type ListItemNode = {
  type: "list_item";
  content?: (ParagraphNode | BulletListNode | OrderedListNode)[];
};

export type BulletListNode = {
  type: "bullet_list";
  content?: ListItemNode[];
};

export type OrderedListNode = {
  type: "ordered_list";
  content?: ListItemNode[];
};

export type ImageSize = "full" | "medium" | "small";

export type ImageRatio = "original" | "16:9" | "4:3" | "1:1" | "3:4";

/** Visible part of the stored image, as fractions (0 to 1) of its width and height. */
export type ImageCrop = { x: number; y: number; w: number; h: number };

/**
 * An uploaded image. The stored file is never cropped; crop is applied when
 * shown, so the shape can change later without uploading again.
 */
export type ImageNode = {
  type: "image";
  attrs: {
    media: string;
    width: number;
    height: number;
    size: ImageSize;
    ratio: ImageRatio;
    crop: ImageCrop | null;
    alt: string;
    decorative: boolean;
    caption: string;
  };
};

export type CalloutNode = {
  type: "callout";
  attrs: { variant: CalloutVariant };
  content?: ParagraphNode[];
};

export type Block =
  | TitleNode
  | DescriptionNode
  | HeadingNode
  | ParagraphNode
  | BlockquoteNode
  | CodeBlockNode
  | HorizontalRuleNode
  | BulletListNode
  | OrderedListNode
  | ImageNode
  | CalloutNode;

export type PostBody = {
  type: "doc";
  content: Block[];
};
