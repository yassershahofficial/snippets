"use client";

import { useActionState } from "react";
import { APPEAL_MAX } from "@/lib/cms/appeal-limits";
import { submitAppeal } from "./actions";

export function AppealForm() {
  const [state, formAction, pending] = useActionState(submitAppeal, { message: "" });

  return (
    <form action={formAction} className="cms-form" noValidate>
      <div className="cms-field">
        <label htmlFor="appeal-message">Your appeal</label>
        <textarea
          id="appeal-message"
          name="message"
          rows={5}
          maxLength={APPEAL_MAX}
          defaultValue={state.message}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "appeal-error" : "appeal-hint"}
        />
        <p id="appeal-hint" className="cms-field-hint">
          Only the admin reads this. Up to {APPEAL_MAX} characters, one appeal at a time.
        </p>
        {state.error ? (
          <p id="appeal-error" className="cms-field-error">
            {state.error}
          </p>
        ) : null}
      </div>
      <button type="submit" className="cms-button" disabled={pending}>
        {pending ? "Sending…" : "Send appeal"}
      </button>
    </form>
  );
}
