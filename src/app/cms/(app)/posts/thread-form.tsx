"use client";

import { useActionState } from "react";
import { MESSAGE_MAX } from "@/lib/cms/thread-limits";
import type { SendMessageState } from "./thread-actions";

type Props = {
  action: (prev: SendMessageState, formData: FormData) => Promise<SendMessageState>;
  hint: string;
};

export function ThreadForm({ action, hint }: Props) {
  const [state, formAction, pending] = useActionState(action, { body: "" });

  return (
    <form action={formAction} className="cms-thread-form" noValidate>
      <div className="cms-field">
        <label htmlFor="thread-body">Message</label>
        <textarea
          key={state.sentAt ?? "draft"}
          id="thread-body"
          name="body"
          rows={3}
          maxLength={MESSAGE_MAX}
          defaultValue={state.body}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "thread-error" : "thread-hint"}
        />
        <p id="thread-hint" className="cms-field-hint">
          {hint}
        </p>
        {state.error ? (
          <p id="thread-error" className="cms-field-error">
            {state.error}
          </p>
        ) : null}
      </div>
      <button type="submit" className="cms-button cms-button-quiet" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
