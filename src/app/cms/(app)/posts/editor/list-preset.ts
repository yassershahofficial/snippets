import type { Editor } from "@tiptap/core";
import type { Node as ProseNode } from "@tiptap/pm/model";
import type { ListPreset } from "@/lib/posts/body";
import { LIST_PRESETS } from "@/lib/posts/editor-doc";

export { LIST_PRESETS };
export type { ListPreset };

export const LIST_PRESET_LABELS: Record<ListPreset, string> = {
  outline: "1. a. i.",
  legal: "1. 1.1. 1.1.1.",
  bullets: "• ◦ ▪",
  paren: "1) a) i)",
};

const PRESET_KIND: Record<ListPreset, "bullet" | "ordered"> = {
  outline: "ordered",
  legal: "ordered",
  paren: "ordered",
  bullets: "bullet",
};

type ListKind = "bulletList" | "orderedList";

type OuterList = {
  pos: number;
  node: ProseNode;
  kind: ListKind;
};

/** Topmost bullet/ordered list that wraps the caret. */
export function findOutermostList(editor: Editor): OuterList | null {
  const { $from } = editor.state.selection;
  for (let depth = 1; depth <= $from.depth; depth += 1) {
    const node = $from.node(depth);
    if (node.type.name === "bulletList" || node.type.name === "orderedList") {
      return {
        pos: $from.before(depth),
        node,
        kind: node.type.name,
      };
    }
  }
  return null;
}

function setListPresetAt(editor: Editor, pos: number, node: ProseNode, preset: ListPreset | null): boolean {
  const attrs = { ...node.attrs, preset };
  const { tr } = editor.state;
  tr.setNodeMarkup(pos, undefined, attrs);
  editor.view.dispatch(tr);
  return true;
}

/** Apply or clear a multilevel preset on the outermost list around the selection. */
export function applyListPreset(editor: Editor, preset: ListPreset | null): boolean {
  editor.commands.focus();

  if (preset === null) {
    const outer = findOutermostList(editor);
    if (!outer) return false;
    return setListPresetAt(editor, outer.pos, outer.node, null);
  }

  const want = PRESET_KIND[preset];
  const inBullet = editor.isActive("bulletList");
  const inOrdered = editor.isActive("orderedList");

  if (!inBullet && !inOrdered) {
    const turned =
      want === "bullet"
        ? editor.chain().focus().toggleBulletList().run()
        : editor.chain().focus().toggleOrderedList().run();
    if (!turned) return false;
  } else if (want === "bullet" && inOrdered) {
    if (!editor.chain().focus().toggleBulletList().run()) return false;
  } else if (want === "ordered" && inBullet) {
    if (!editor.chain().focus().toggleOrderedList().run()) return false;
  }

  const outer = findOutermostList(editor);
  if (!outer) return false;
  return setListPresetAt(editor, outer.pos, outer.node, preset);
}

/** Clear multilevel styling after a plain bullet/number toggle. */
export function clearListPreset(editor: Editor): void {
  const outer = findOutermostList(editor);
  if (!outer || outer.node.attrs.preset == null) return;
  setListPresetAt(editor, outer.pos, outer.node, null);
}

export function currentListPreset(editor: Editor): ListPreset | "" {
  const outer = findOutermostList(editor);
  const value = outer?.node.attrs.preset;
  return LIST_PRESETS.includes(value as ListPreset) ? (value as ListPreset) : "";
}
