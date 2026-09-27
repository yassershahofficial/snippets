"use client";

import "@/app/posts/[slug]/post.css";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { useState } from "react";
import type { CalloutVariant } from "@/lib/posts/body";
import { CALLOUT_VARIANTS, isSafeHref } from "@/lib/posts/editor-doc";
import { postEditorExtensions } from "./extensions";

type Props = {
  id: string;
  name: string;
  defaultValue: string;
  labelledBy: string;
  describedBy?: string;
  invalid?: boolean;
  onChange?: () => void;
};

const PLACEHOLDER = "Write the post. Type ## for a heading, - for a list, > for a quote.";

const VARIANT_LABELS: Record<CalloutVariant, string> = {
  info: "Info",
  tip: "Tip",
  warning: "Warning",
  danger: "Danger",
};

export function BodyEditor({
  id,
  name,
  defaultValue,
  labelledBy,
  describedBy,
  invalid,
  onChange,
}: Props) {
  const [initialContent] = useState(() => JSON.parse(defaultValue));
  const [json, setJson] = useState(defaultValue);

  const editor = useEditor({
    extensions: postEditorExtensions(PLACEHOLDER),
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id,
        class: "post-body cms-body-content",
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelledBy,
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
      },
    },
    onUpdate: ({ editor: current }) => {
      setJson(JSON.stringify(current.getJSON()));
      onChange?.();
    },
  });

  return (
    <div className="cms-body-editor" data-invalid={invalid ? "" : undefined}>
      <input type="hidden" name={name} value={json} />
      {editor ? (
        <>
          <Toolbar editor={editor} controls={id} />
          <EditorContent editor={editor} />
          <WordCount editor={editor} />
        </>
      ) : (
        <div className="cms-body-loading" aria-hidden="true" />
      )}
    </div>
  );
}

function WordCount({ editor }: { editor: Editor }) {
  const words = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e.state.doc.textBetween(0, e.state.doc.content.size, " ", " ").split(/\s+/).filter(Boolean)
        .length,
  });
  return (
    <p className="cms-body-count">
      {words} {words === 1 ? "word" : "words"}
    </p>
  );
}

function Toolbar({ editor, controls }: { editor: Editor; controls: string }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive("heading", { level: 2 })
        ? "h2"
        : e.isActive("heading", { level: 3 })
          ? "h3"
          : "p",
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      callout: e.isActive("callout"),
      calloutVariant: (e.getAttributes("callout").variant ?? "info") as CalloutVariant,
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const [linkOpen, setLinkOpen] = useState(false);
  const [href, setHref] = useState("");
  const [linkError, setLinkError] = useState("");

  const chain = () => editor.chain().focus();

  function openLink() {
    setHref(state.link ? (editor.getAttributes("link").href ?? "") : "");
    setLinkError("");
    setLinkOpen(true);
  }

  function applyLink() {
    let url = href.trim();
    if (url && !/^[a-z][a-z0-9+.-]*:/i.test(url)) url = `https://${url}`;
    if (!isSafeHref(url)) {
      setLinkError("Use a full web address, like https://example.com.");
      return;
    }
    if (editor.state.selection.empty && !state.link) {
      chain()
        .insertContent({ type: "text", text: url, marks: [{ type: "link", attrs: { href: url } }] })
        .run();
    } else {
      chain().extendMarkRange("link").setLink({ href: url }).run();
    }
    setLinkOpen(false);
  }

  function removeLink() {
    chain().extendMarkRange("link").unsetLink().run();
    setLinkOpen(false);
  }

  return (
    <div className="cms-toolbar-wrap">
      <div className="cms-toolbar" role="toolbar" aria-label="Formatting" aria-controls={controls}>
        <select
          aria-label="Text style"
          value={state.block}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "p") chain().setParagraph().run();
            else chain().setHeading({ level: value === "h2" ? 2 : 3 }).run();
          }}
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
        </select>

        <span className="cms-toolbar-group">
          <ToolButton label="Bold" shortcut="Ctrl+B" pressed={state.bold} onClick={() => chain().toggleBold().run()}>
            <strong>B</strong>
          </ToolButton>
          <ToolButton label="Italic" shortcut="Ctrl+I" pressed={state.italic} onClick={() => chain().toggleItalic().run()}>
            <em>I</em>
          </ToolButton>
          <ToolButton label="Underline" shortcut="Ctrl+U" pressed={state.underline} onClick={() => chain().toggleUnderline().run()}>
            <u>U</u>
          </ToolButton>
          <ToolButton label="Strikethrough" pressed={state.strike} onClick={() => chain().toggleStrike().run()}>
            <s>S</s>
          </ToolButton>
          <ToolButton label="Inline code" pressed={state.code} onClick={() => chain().toggleCode().run()}>
            Code
          </ToolButton>
          <ToolButton label="Link" pressed={state.link} onClick={openLink}>
            Link
          </ToolButton>
        </span>

        <span className="cms-toolbar-group">
          <ToolButton label="Bulleted list" pressed={state.bulletList} onClick={() => chain().toggleBulletList().run()}>
            • List
          </ToolButton>
          <ToolButton label="Numbered list" pressed={state.orderedList} onClick={() => chain().toggleOrderedList().run()}>
            1. List
          </ToolButton>
          <ToolButton label="Quote" pressed={state.blockquote} onClick={() => chain().toggleBlockquote().run()}>
            Quote
          </ToolButton>
          <ToolButton label="Code block" pressed={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
            Code block
          </ToolButton>
          <ToolButton label="Callout" pressed={state.callout} onClick={() => chain().toggleCallout().run()}>
            Callout
          </ToolButton>
          {state.callout ? (
            <select
              aria-label="Callout style"
              value={state.calloutVariant}
              onChange={(event) =>
                chain().setCalloutVariant(event.target.value as CalloutVariant).run()
              }
            >
              {CALLOUT_VARIANTS.map((variant) => (
                <option key={variant} value={variant}>
                  {VARIANT_LABELS[variant]}
                </option>
              ))}
            </select>
          ) : null}
          <ToolButton label="Divider" onClick={() => chain().setHorizontalRule().run()}>
            Divider
          </ToolButton>
        </span>

        <span className="cms-toolbar-group">
          <ToolButton label="Undo" shortcut="Ctrl+Z" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
            Undo
          </ToolButton>
          <ToolButton label="Redo" shortcut="Ctrl+Shift+Z" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
            Redo
          </ToolButton>
        </span>
      </div>

      {linkOpen ? (
        <div className="cms-link-row">
          <label htmlFor={`${controls}-link`}>Link address</label>
          <input
            id={`${controls}-link`}
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder="https://"
            value={href}
            autoFocus
            aria-invalid={linkError ? true : undefined}
            aria-describedby={linkError ? `${controls}-link-error` : undefined}
            onChange={(event) => setHref(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              } else if (event.key === "Escape") {
                event.preventDefault();
                setLinkOpen(false);
                editor.commands.focus();
              }
            }}
          />
          <button type="button" className="cms-button cms-button-quiet" onClick={applyLink}>
            Apply
          </button>
          {state.link ? (
            <button type="button" className="cms-button cms-button-quiet" onClick={removeLink}>
              Remove link
            </button>
          ) : null}
          <button
            type="button"
            className="cms-button cms-button-quiet"
            onClick={() => {
              setLinkOpen(false);
              editor.commands.focus();
            }}
          >
            Cancel
          </button>
          {linkError ? (
            <p id={`${controls}-link-error`} className="cms-field-error">
              {linkError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ToolButton({
  label,
  shortcut,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="cms-tool"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={pressed === undefined ? undefined : pressed}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
