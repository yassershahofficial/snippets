"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./EditorToolbar";
import { TipTapContent } from "@/types/post";
import { useEffect } from "react";

interface TipTapEditorProps {
  content?: TipTapContent | TipTapContent[];
  onChange: (content: TipTapContent | TipTapContent[]) => void;
  placeholder?: string;
  className?: string;
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className = "",
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(json);
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[300px] p-4",
        "data-placeholder": placeholder,
      },
    },
  });

  // Update editor content when content prop changes (for edit mode)
  useEffect(() => {
    if (editor && content) {
      const currentContent = editor.getJSON();
      // Only update if content is actually different to avoid infinite loops
      if (JSON.stringify(currentContent) !== JSON.stringify(content)) {
        editor.commands.setContent(content);
      }
    }
  }, [editor, content]);

  if (!editor) {
    return (
      <div className="border border-border rounded-md min-h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading editor...</p>
      </div>
    );
  }

  return (
    <div className={`border border-border rounded-md bg-background ${className}`}>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

