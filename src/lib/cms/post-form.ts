import type { PostType } from "@/lib/supabase/database.types";

export const POST_TYPES: { value: PostType; label: string }[] = [
  { value: "article", label: "Article" },
  { value: "code", label: "Code" },
  { value: "opinion", label: "Opinion" },
];

export const LIMITS = {
  title: 160,
  description: 300,
  slug: 80,
  tags: 10,
  tag: 30,
} as const;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type PostFormValues = {
  title: string;
  slug: string;
  description: string;
  type: PostType;
  tags: string;
  nextPostId: string;
};

export type PostFormErrors = Partial<Record<keyof PostFormValues, string>>;

export type PostFormState = {
  values?: PostFormValues;
  errors?: PostFormErrors;
  message?: string;
  ok?: boolean;
};

export type ValidPost = {
  title: string;
  slug: string;
  description: string;
  type: PostType;
  tags: string[];
  next_post_id: string | null;
};

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, LIMITS.slug)
    .replace(/-+$/g, "");
}

export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const tag = slugify(part).slice(0, LIMITS.tag).replace(/-+$/g, "");
    if (tag) seen.add(tag);
  }
  return [...seen];
}

export function readPostForm(formData: FormData): PostFormValues {
  const text = (key: string) => String(formData.get(key) ?? "");
  const type = text("type");
  return {
    title: text("title"),
    slug: text("slug"),
    description: text("description"),
    type: POST_TYPES.some((t) => t.value === type) ? (type as PostType) : "article",
    tags: text("tags"),
    nextPostId: text("nextPostId"),
  };
}

export function validatePostForm(
  values: PostFormValues,
  currentPostId: string | null,
): { data?: ValidPost; errors?: PostFormErrors } {
  const errors: PostFormErrors = {};

  const title = values.title.trim();
  if (!title) errors.title = "Give the post a title.";
  else if (title.length > LIMITS.title)
    errors.title = `Keep the title under ${LIMITS.title} characters.`;

  const slug = values.slug.trim() ? values.slug.trim().toLowerCase() : slugify(title);
  if (!slug) {
    if (title) errors.slug = "Add a slug using letters or numbers.";
  }
  else if (slug.length > LIMITS.slug)
    errors.slug = `Keep the slug under ${LIMITS.slug} characters.`;
  else if (!SLUG_PATTERN.test(slug))
    errors.slug = "Use lowercase letters, numbers and single hyphens only.";

  const description = values.description.trim();
  if (description.length > LIMITS.description)
    errors.description = `Keep the description under ${LIMITS.description} characters.`;

  const tags = parseTags(values.tags);
  if (tags.length > LIMITS.tags) errors.tags = `Use at most ${LIMITS.tags} tags.`;

  const nextPostId = values.nextPostId || null;
  if (nextPostId && nextPostId === currentPostId)
    errors.nextPostId = "A post can't point to itself.";

  if (Object.keys(errors).length > 0) return { errors };

  return {
    data: {
      title,
      slug,
      description,
      type: values.type,
      tags,
      next_post_id: nextPostId,
    },
  };
}

export const POST_ERROR_MESSAGES = {
  slug: "Another post already uses this slug.",
  description: "Add a description before submitting or publishing.",
  body: "Add some content to the body before submitting or publishing.",
  admin: "Only the admin can do that.",
  missing: "This post no longer exists or you can't edit it.",
  unknown: "Something went wrong. Please try again.",
} as const;

export type PostErrorCode = keyof typeof POST_ERROR_MESSAGES;

const ERROR_FIELDS: Partial<Record<PostErrorCode, keyof PostFormValues>> = {
  slug: "slug",
  description: "description",
};

/** Maps database rejections to a message code and, when known, a form field. */
export function describePostError(error: { code?: string; message: string }): {
  code: PostErrorCode;
  field?: keyof PostFormValues;
} {
  const msg = error.message;
  let code: PostErrorCode = "unknown";
  if (error.code === "23505" && msg.includes("posts_slug_unique")) code = "slug";
  else if (msg.includes("posts_description_required")) code = "description";
  else if (msg.includes("posts_body_required")) code = "body";
  else if (msg.includes("Only admins")) code = "admin";
  else console.error("post write", error.code, msg);
  return { code, field: ERROR_FIELDS[code] };
}

export function postErrorState(
  values: PostFormValues,
  error: { code?: string; message: string },
): PostFormState {
  const { code, field } = describePostError(error);
  const message = POST_ERROR_MESSAGES[code];
  return field ? { values, errors: { [field]: message } } : { values, message };
}

export function postToFormValues(post: {
  title: string;
  slug: string;
  description: string;
  type: PostType;
  tags: string[];
  next_post_id: string | null;
}): PostFormValues {
  return {
    title: post.title,
    slug: post.slug,
    description: post.description,
    type: post.type,
    tags: post.tags.join(", "),
    nextPostId: post.next_post_id ?? "",
  };
}
