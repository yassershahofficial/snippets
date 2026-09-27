"use client";

import { useActionState } from "react";
import { USERNAME_RULES } from "@/lib/cms/username";
import { updateUsername } from "./actions";

export function UsernameForm({ username }: { username: string }) {
  const [state, formAction, pending] = useActionState(updateUsername, {
    value: username,
  });

  return (
    <form action={formAction} className="cms-form" noValidate>
      <div className="cms-field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          name="username"
          defaultValue={state.value}
          minLength={3}
          maxLength={30}
          autoComplete="nickname"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "username-error" : "username-hint"}
        />
        <p id="username-hint" className="cms-field-hint">
          Shown on your posts. {USERNAME_RULES} Must be unique.
        </p>
        {state.error ? (
          <p id="username-error" className="cms-field-error">
            {state.error}
          </p>
        ) : null}
      </div>
      <div className="cms-form-actions">
        <button type="submit" className="cms-button" disabled={pending}>
          {pending ? "Saving…" : "Save username"}
        </button>
        <p className="cms-status-ok" role="status" aria-live="polite">
          {state.message ?? ""}
        </p>
      </div>
    </form>
  );
}
