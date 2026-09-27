import type { ReactNode } from "react";
import { publicMediaUrl } from "@/lib/media/limits";
import { PostFigure } from "@/lib/posts/figure";
import type {
  Block,
  BlockquoteNode,
  BulletListNode,
  CalloutNode,
  CodeBlockNode,
  DescriptionNode,
  HeadingNode,
  ImageNode,
  InlineContent,
  ListItemNode,
  Mark,
  OrderedListNode,
  ParagraphNode,
  PostBody,
  TextNode,
  TitleNode,
} from "@/lib/posts/body";

type RenderOptions = {
  /** When true, title/description blocks are omitted (page shows columns). */
  skipTitleDescription?: boolean;
  mediaUrl?: (id: string) => string | null;
};

function safeHref(href: string): string | null {
  try {
    const url = new URL(href);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return null;
  }
  return null;
}

function applyMarks(text: string, marks: Mark[] | undefined, key: string): ReactNode {
  let node: ReactNode = text;
  if (!marks?.length) {
    return <span key={key}>{node}</span>;
  }

  for (const mark of marks) {
    switch (mark.type) {
      case "bold":
        node = <strong key={`${key}-b`}>{node}</strong>;
        break;
      case "italic":
        node = <em key={`${key}-i`}>{node}</em>;
        break;
      case "underline":
        node = <u key={`${key}-u`}>{node}</u>;
        break;
      case "strike":
        node = <s key={`${key}-s`}>{node}</s>;
        break;
      case "code":
        node = (
          <code key={`${key}-c`} className="post-inline-code">
            {node}
          </code>
        );
        break;
      case "link": {
        const href = safeHref(mark.href);
        node = href ? (
          <a key={`${key}-a`} href={href} rel="noopener noreferrer">
            {node}
          </a>
        ) : (
          node
        );
        break;
      }
      default:
        break;
    }
  }

  return <span key={key}>{node}</span>;
}

function renderInline(content: InlineContent[] | undefined, keyPrefix: string): ReactNode[] {
  if (!content?.length) return [];
  return content.map((node, i) => {
    if (node.type !== "text") return null;
    return applyMarks(node.text, node.marks, `${keyPrefix}-${i}`);
  });
}

function renderParagraph(node: ParagraphNode, key: string): ReactNode {
  return (
    <p key={key} className="post-p">
      {renderInline(node.content, key)}
    </p>
  );
}

function renderTitle(node: TitleNode, key: string): ReactNode {
  return (
    <h1 key={key} className="post-title-block">
      {renderInline(node.content, key)}
    </h1>
  );
}

function renderDescription(node: DescriptionNode, key: string): ReactNode {
  return (
    <p key={key} className="post-description-block">
      {renderInline(node.content, key)}
    </p>
  );
}

function renderHeading(node: HeadingNode, key: string): ReactNode {
  const level = node.attrs.level;
  const className = `post-h post-h${level}`;
  const children = renderInline(node.content, key);
  if (level === 1) return <h1 key={key} className={className}>{children}</h1>;
  if (level === 2) return <h2 key={key} className={className}>{children}</h2>;
  return <h3 key={key} className={className}>{children}</h3>;
}

function renderBlockquote(node: BlockquoteNode, key: string): ReactNode {
  return (
    <blockquote key={key} className="post-quote">
      {node.content?.map((p, i) => renderParagraph(p, `${key}-p${i}`))}
    </blockquote>
  );
}

function renderCodeBlock(node: CodeBlockNode, key: string): ReactNode {
  const text =
    node.content
      ?.filter((n): n is TextNode => n.type === "text")
      .map((n) => n.text)
      .join("") ?? "";
  return (
    <pre key={key} className="post-code">
      <code>{text}</code>
    </pre>
  );
}

function renderListItem(node: ListItemNode, key: string): ReactNode {
  return (
    <li key={key}>
      {node.content?.map((child, i) => {
        const childKey = `${key}-${i}`;
        if (child.type === "paragraph") return renderParagraph(child, childKey);
        if (child.type === "bullet_list") return renderBulletList(child, childKey);
        if (child.type === "ordered_list") return renderOrderedList(child, childKey);
        return null;
      })}
    </li>
  );
}

function renderBulletList(node: BulletListNode, key: string): ReactNode {
  return (
    <ul key={key} className="post-ul">
      {node.content?.map((item, i) => renderListItem(item, `${key}-li${i}`))}
    </ul>
  );
}

function renderOrderedList(node: OrderedListNode, key: string): ReactNode {
  return (
    <ol key={key} className="post-ol">
      {node.content?.map((item, i) => renderListItem(item, `${key}-li${i}`))}
    </ol>
  );
}

function renderImage(node: ImageNode, key: string, options: RenderOptions): ReactNode {
  const attrs = node.attrs;
  if (typeof attrs?.media !== "string" || !(attrs.width > 0) || !(attrs.height > 0)) return null;
  const src = options.mediaUrl ? options.mediaUrl(attrs.media) : publicMediaUrl(attrs.media);
  if (!src) return null;
  return <PostFigure key={key} attrs={attrs} src={src} />;
}

function renderCallout(node: CalloutNode, key: string): ReactNode {
  const variant = node.attrs.variant;
  return (
    <aside
      key={key}
      className={`post-callout post-callout-${variant}`}
      data-variant={variant}
    >
      {node.content?.map((p, i) => renderParagraph(p, `${key}-p${i}`))}
    </aside>
  );
}

function renderBlock(block: Block, key: string, options: RenderOptions): ReactNode {
  switch (block.type) {
    case "title":
      return options.skipTitleDescription ? null : renderTitle(block, key);
    case "description":
      return options.skipTitleDescription ? null : renderDescription(block, key);
    case "heading":
      return renderHeading(block, key);
    case "paragraph":
      return renderParagraph(block, key);
    case "blockquote":
      return renderBlockquote(block, key);
    case "code_block":
      return renderCodeBlock(block, key);
    case "horizontal_rule":
      return <hr key={key} className="post-hr" />;
    case "bullet_list":
      return renderBulletList(block, key);
    case "ordered_list":
      return renderOrderedList(block, key);
    case "image":
      return renderImage(block, key, options);
    case "callout":
      return renderCallout(block, key);
    default:
      return null;
  }
}

export function PostBodyView({
  body,
  skipTitleDescription = true,
  mediaUrls,
}: {
  body: PostBody;
  skipTitleDescription?: boolean;
  /** Signed URLs for private images (CMS preview and review). Public copies are used otherwise. */
  mediaUrls?: Record<string, string>;
}) {
  const mediaUrl = mediaUrls ? (id: string) => mediaUrls[id] ?? null : undefined;
  return (
    <div className="post-body">
      {body.content.map((block, i) =>
        renderBlock(block, `b${i}`, { skipTitleDescription, mediaUrl }),
      )}
    </div>
  );
}
