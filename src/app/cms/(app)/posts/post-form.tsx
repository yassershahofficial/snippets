"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  LIMITS,
  slugify,
  type PostFormState,
  type PostFormValues,
} from "@/lib/cms/post-form";
import type { NextPostOption, TagOption } from "@/lib/cms/posts";
import { BodyEditor } from "./editor/body-editor";
import { NextPostPicker } from "./next-post-picker";
import { TagPicker } from "./tag-picker";

type Props = {
  action: (state: PostFormState, formData: FormData) => Promise<PostFormState>;
  initialValues: PostFormValues;
  nextPostOptions: NextPostOption[];
  tagOptions: TagOption[];
  submitLabel: string;
  /** Shown above the submit button, e.g. the live-post warning. */
  note?: string;
};

export function PostForm({
  action,
  initialValues,
  nextPostOptions,
  tagOptions,
  submitLabel,
  note,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [dirty, setDirty] = useState(false);
  const markDirty = () => setDirty(true);

  const [state, formAction, pending] = useActionState(
    async (prev: PostFormState, formData: FormData) => {
      const result = await action(prev, formData);
      if (result.ok) setDirty(false);
      return result;
    },
    { values: initialValues },
  );
  const values = state.values ?? initialValues;
  const errors = state.errors ?? {};

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const failed = !state.ok && Boolean(state.message);
  const statusText = failed
    ? state.message
    : dirty
      ? "Unsaved changes"
      : (state.message ?? "");

  return (
    <form
      ref={formRef}
      action={formAction}
      className="cms-form"
      noValidate
      onInput={markDirty}
      onKeyDown={(event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
          event.preventDefault();
          if (!pending) formRef.current?.requestSubmit();
        }
      }}
    >
      <p className="cms-form-legend">
        Fields marked * are required. A draft only needs a title to save.
      </p>

      <Field id="title" label="Title" required error={errors.title}>
        <input
          id="title"
          name="title"
          defaultValue={values.title}
          maxLength={LIMITS.title}
          required
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? "title-error" : undefined}
        />
      </Field>

      <Field
        id="slug"
        label="Slug"
        hint={`Web address: /posts/${values.slug || slugify(values.title) || "your-post"}. Leave empty to build it from the title.`}
        error={errors.slug}
      >
        <input
          id="slug"
          name="slug"
          defaultValue={values.slug}
          maxLength={LIMITS.slug}
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={errors.slug ? true : undefined}
          aria-describedby={errors.slug ? "slug-error" : "slug-hint"}
        />
      </Field>

      <Field
        id="description"
        label="Description"
        required
        hint="The short hook shown on the home page and in search results."
        error={errors.description}
      >
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          maxLength={LIMITS.description}
          rows={3}
          aria-required
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "description-error" : "description-hint"}
        />
      </Field>

      <Field
        id="body"
        label="Body"
        required
        labelIsText
        hint="Markdown shortcuts work: ## heading, - list, 1. numbered list, > quote, ``` code block, --- divider."
        error={errors.body}
      >
        <BodyEditor
          id="body"
          name="body"
          defaultValue={values.body}
          labelledBy="body-label"
          describedBy={errors.body ? "body-error" : "body-hint"}
          invalid={Boolean(errors.body)}
          onChange={markDirty}
        />
      </Field>

      <Field
        id="tags"
        label="Tags"
        hint={`Up to ${LIMITS.tags}. Pick an existing tag to keep spellings consistent. Enter adds the highlighted tag, a comma adds exactly what you typed.`}
        error={errors.tags}
      >
        <TagPicker
          id="tags"
          name="tags"
          options={tagOptions}
          defaultValue={values.tags}
          invalid={Boolean(errors.tags)}
          describedBy={errors.tags ? "tags-error" : "tags-hint"}
          onChange={markDirty}
        />
      </Field>

      <Field
        id="nextPostId"
        label="Next post"
        hint="Suggested to readers at the end of this post. Type to search by title."
        error={errors.nextPostId}
      >
        <NextPostPicker
          id="nextPostId"
          name="nextPostId"
          options={nextPostOptions}
          defaultValue={values.nextPostId}
          invalid={Boolean(errors.nextPostId)}
          describedBy={errors.nextPostId ? "nextPostId-error" : "nextPostId-hint"}
          onChange={markDirty}
        />
      </Field>

      {note ? <p className="cms-form-note">{note}</p> : null}

      <div className="cms-form-actions">
        <button type="submit" className="cms-button" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <p className={failed ? "cms-status-error" : "cms-status-ok"} role="status" aria-live="polite">
          {statusText}
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  labelIsText,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  /** For controls that aren't form elements (the rich text editor). */
  labelIsText?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const text = (
    <>
      {label}
      {required ? (
        <span className="cms-required" aria-hidden="true">
          {" "}*
        </span>
      ) : null}
    </>
  );
  return (
    <div className="cms-field">
      {labelIsText ? (
        <span id={`${id}-label`} className="cms-field-label">
          {text}
        </span>
      ) : (
        <label htmlFor={id} className="cms-field-label">
          {text}
        </label>
      )}
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="cms-field-hint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="cms-field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
