"use client";

import { useActionState } from "react";
import {
  LIMITS,
  slugify,
  type PostFormState,
  type PostFormValues,
} from "@/lib/cms/post-form";
import type { NextPostOption, TagOption } from "@/lib/cms/posts";
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
  const [state, formAction, pending] = useActionState(action, {
    values: initialValues,
  });
  const values = state.values ?? initialValues;
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="cms-form" noValidate>
      <p className="cms-form-legend">Fields marked * are required. A draft only needs a title to save.</p>

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
        />
      </Field>

      {note ? <p className="cms-form-note">{note}</p> : null}

      <div className="cms-form-actions">
        <button type="submit" className="cms-button" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </button>
        <p
          className={state.ok ? "cms-status-ok" : "cms-status-error"}
          role="status"
          aria-live="polite"
        >
          {state.message ?? ""}
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cms-field">
      <label htmlFor={id}>
        {label}
        {required ? (
          <span className="cms-required" aria-hidden="true">
            {" "}*
          </span>
        ) : null}
      </label>
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
