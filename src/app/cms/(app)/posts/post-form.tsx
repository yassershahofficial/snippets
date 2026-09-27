"use client";

import { useActionState } from "react";
import {
  LIMITS,
  POST_TYPES,
  slugify,
  type PostFormState,
  type PostFormValues,
} from "@/lib/cms/post-form";
import type { NextPostOption } from "@/lib/cms/posts";

type Props = {
  action: (state: PostFormState, formData: FormData) => Promise<PostFormState>;
  initialValues: PostFormValues;
  nextPostOptions: NextPostOption[];
  submitLabel: string;
  /** Shown above the submit button, e.g. the live-post warning. */
  note?: string;
};

export function PostForm({
  action,
  initialValues,
  nextPostOptions,
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
      <Field id="title" label="Title" error={errors.title}>
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
        hint="The short hook shown on the home page and in search results. Needed before review."
        error={errors.description}
      >
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          maxLength={LIMITS.description}
          rows={3}
          aria-invalid={errors.description ? true : undefined}
          aria-describedby={errors.description ? "description-error" : "description-hint"}
        />
      </Field>

      <div className="cms-form-row">
        <Field id="type" label="Type">
          <select id="type" name="type" defaultValue={values.type}>
            {POST_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          id="tags"
          label="Tags"
          hint={`Comma separated, up to ${LIMITS.tags}.`}
          error={errors.tags}
        >
          <input
            id="tags"
            name="tags"
            defaultValue={values.tags}
            autoCapitalize="none"
            aria-invalid={errors.tags ? true : undefined}
            aria-describedby={errors.tags ? "tags-error" : "tags-hint"}
          />
        </Field>
      </div>

      <Field
        id="nextPostId"
        label="Next post"
        hint="Suggested to readers at the end of this post."
        error={errors.nextPostId}
      >
        <select id="nextPostId" name="nextPostId" defaultValue={values.nextPostId}>
          <option value="">None</option>
          {nextPostOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
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
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cms-field">
      <label htmlFor={id}>{label}</label>
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
