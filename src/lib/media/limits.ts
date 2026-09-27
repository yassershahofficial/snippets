export const MEDIA_MAX_WIDTH = 1280;
export const MEDIA_MAX_HEIGHT = 1600;
export const MEDIA_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const MEDIA_ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MEDIA_PER_POST = 5;
export const MEDIA_QUOTA_BYTES = 10 * 1024 * 1024;

export const MEDIA_PRIVATE_BUCKET = "snippets-media-private";
export const MEDIA_PUBLIC_BUCKET = "snippets-media";

export function mediaPath(id: string): string {
  return `${id}.webp`;
}

export function publicMediaUrl(id: string): string {
  return `${process.env.NEXT_PUBLIC_SNIPPETS_SUPABASE_URL}/storage/v1/object/public/${MEDIA_PUBLIC_BUCKET}/${mediaPath(id)}`;
}
