import { mergeAttributes, Node } from "@tiptap/core";
import { Blockquote } from "@tiptap/extension-blockquote";
import { Heading } from "@tiptap/extension-heading";
import { Link } from "@tiptap/extension-link";
import { ListItem } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { CalloutVariant } from "@/lib/posts/body";
import { CALLOUT_VARIANTS, isSafeHref } from "@/lib/posts/editor-doc";
import { ImageView } from "./image-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      toggleCallout: (variant?: CalloutVariant) => ReturnType;
      setCalloutVariant: (variant: CalloutVariant) => ReturnType;
    };
  }
}

/** Mirrors the public renderer: an aside holding plain paragraphs. */
const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "info",
        parseHTML: (el) => {
          const value = el.getAttribute("data-variant");
          return CALLOUT_VARIANTS.includes(value as CalloutVariant) ? value : "info";
        },
        renderHTML: (attrs) => ({ "data-variant": attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "aside[data-variant]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, {
        class: `post-callout post-callout-${node.attrs.variant}`,
      }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleCallout:
        (variant = "info") =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { variant }),
      setCalloutVariant:
        (variant) =>
        ({ commands }) =>
          commands.updateAttributes(this.name, { variant }),
    };
  },
});

/**
 * Uploaded images only. Nothing is parsed from pasted or dropped HTML, so
 * the Image button is the one way in.
 */
const Image = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      media: { default: null, rendered: false },
      width: { default: null, rendered: false },
      height: { default: null, rendered: false },
      size: { default: "full", rendered: false },
      ratio: { default: "original", rendered: false },
      crop: { default: null, rendered: false },
      alt: { default: "", rendered: false },
      decorative: { default: false, rendered: false },
      caption: { default: "", rendered: false },
    };
  },

  parseHTML() {
    return [];
  },

  renderHTML({ node }) {
    return ["figure", { class: "post-figure", "data-media": node.attrs.media }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});

const PostHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.level === 3 ? 3 : 2;
    return [
      `h${level}`,
      mergeAttributes(HTMLAttributes, { class: `post-h post-h${level}` }),
      0,
    ];
  },
}).configure({ levels: [2, 3] });

/** Not inclusive, so typing right after a link doesn't extend it. */
const PostLink = Link.extend({ inclusive: false }).configure({
  openOnClick: false,
  autolink: true,
  defaultProtocol: "https",
  isAllowedUri: (url) => isSafeHref(url),
  HTMLAttributes: { rel: "noopener noreferrer", target: null },
});

export function postEditorExtensions(placeholder: string) {
  return [
    StarterKit.configure({
      hardBreak: false,
      heading: false,
      blockquote: false,
      listItem: false,
      paragraph: { HTMLAttributes: { class: "post-p" } },
      bulletList: { HTMLAttributes: { class: "post-ul" } },
      orderedList: { HTMLAttributes: { class: "post-ol" } },
      codeBlock: { HTMLAttributes: { class: "post-code" } },
      code: { HTMLAttributes: { class: "post-inline-code" } },
      horizontalRule: { HTMLAttributes: { class: "post-hr" } },
      link: false,
    }),
    PostLink,
    PostHeading,
    Blockquote.extend({ content: "paragraph+" }).configure({
      HTMLAttributes: { class: "post-quote" },
    }),
    ListItem.extend({ content: "paragraph (bulletList | orderedList)*" }),
    Callout,
    Image,
    Placeholder.configure({ placeholder }),
  ];
}
