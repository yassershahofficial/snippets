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

export type ImageNode = {
  type: "image";
  attrs: {
    src: string;
    width?: number;
    height?: number;
    aspectRatio?: string;
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
