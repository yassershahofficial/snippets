import { mergeAttributes, Node } from "@tiptap/core";
import { Blockquote } from "@tiptap/extension-blockquote";
import { Heading } from "@tiptap/extension-heading";
import { Link } from "@tiptap/extension-link";
import { BulletList, ListItem, OrderedList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extensions";
import { ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { CalloutVariant } from "@/lib/posts/body";
import { CALLOUT_VARIANTS, isListPreset, isSafeHref } from "@/lib/posts/editor-doc";
import { ImageView } from "./image-view";
import { VideoView } from "./video-view";

const listPresetAttribute = {
  preset: {
    default: null as string | null,
    parseHTML: (el: HTMLElement) => {
      const value = el.getAttribute("data-preset");
      return isListPreset(value) ? value : null;
    },
    renderHTML: (attrs: Record<string, unknown>) =>
      isListPreset(attrs.preset) ? { "data-preset": attrs.preset } : {},
  },
};

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

/** YouTube videos by id. Like images, only the Video button adds them. */
const YouTube = Node.create({
  name: "youtube",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      id: { default: null, rendered: false },
      start: { default: 0, rendered: false },
      caption: { default: "", rendered: false },
    };
  },

  parseHTML() {
    return [];
  },

  renderHTML({ node }) {
    return ["figure", { class: "post-video", "data-youtube": node.attrs.id }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoView);
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
      bulletList: false,
      orderedList: false,
      paragraph: { HTMLAttributes: { class: "post-p" } },
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
    BulletList.extend({
      addAttributes() {
        return { ...this.parent?.(), ...listPresetAttribute };
      },
    }).configure({ HTMLAttributes: { class: "post-ul" } }),
    OrderedList.extend({
      addAttributes() {
        return { ...this.parent?.(), ...listPresetAttribute };
      },
    }).configure({ HTMLAttributes: { class: "post-ol" } }),
    ListItem.extend({
      content: "paragraph (bulletList | orderedList)*",
      addKeyboardShortcuts() {
        return {
          Enter: () => this.editor.commands.splitListItem(this.name),
          Tab: () => {
            if (this.editor.commands.sinkListItem(this.name)) return true;
            // Keep focus in the editor instead of jumping to the next form control.
            return this.editor.isActive(this.name);
          },
          "Shift-Tab": () => {
            if (this.editor.commands.liftListItem(this.name)) return true;
            return this.editor.isActive(this.name);
          },
        };
      },
    }),
    Callout,
    Image,
    YouTube,
    Placeholder.configure({ placeholder }),
  ];
}
