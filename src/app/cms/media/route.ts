import sharp from "sharp";
import { getCmsSession } from "@/lib/cms/auth";
import { isUuid } from "@/lib/cms/posts";
import { createStorageAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  MEDIA_ACCEPTED_TYPES,
  MEDIA_MAX_HEIGHT,
  MEDIA_MAX_WIDTH,
  MEDIA_PRIVATE_BUCKET,
  MEDIA_UPLOAD_MAX_BYTES,
  mediaPath,
} from "@/lib/media/limits";
import { cleanupStaleMedia } from "@/lib/cms/media";

const SIGNED_URL_SECONDS = 60 * 60;

function fail(status: number, error: string) {
  return Response.json({ error }, { status });
}

/** Upright, inside 1280x1600, WebP. sharp drops all metadata (EXIF, GPS, ICC) by default. */
function reencode(input: Buffer) {
  return sharp(input, { limitInputPixels: 50_000_000, failOn: "error", animated: false })
    .rotate()
    .resize({
      width: MEDIA_MAX_WIDTH,
      height: MEDIA_MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer({ resolveWithObject: true });
}

export async function POST(request: Request) {
  const { profile } = await getCmsSession();
  if (!profile) return fail(401, "Sign in again to upload images.");
  if (profile.banned_at) return fail(403, "Banned accounts can't upload images.");

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MEDIA_UPLOAD_MAX_BYTES + 64 * 1024) {
    return fail(413, "That image is too large. Try a smaller one.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "The upload didn't arrive. Please try again.");
  }

  const file = form.get("file");
  const rawPost = form.get("postId");
  const postId = typeof rawPost === "string" && rawPost ? rawPost : null;
  if (postId && !isUuid(postId)) return fail(400, "Unknown post.");
  if (!(file instanceof File)) return fail(400, "Choose an image first.");
  if (file.size > MEDIA_UPLOAD_MAX_BYTES) {
    return fail(413, "That image is too large. Try a smaller one.");
  }
  if (!(MEDIA_ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return fail(415, "Use a JPEG, PNG or WebP image.");
  }

  const output = await reencode(Buffer.from(await file.arrayBuffer())).catch(() => null);
  if (!output) return fail(415, "That file couldn't be read as an image.");

  const supabase = await createClient();
  await cleanupStaleMedia(profile.id);

  const { data: mediaId, error: reserveError } = await supabase.rpc("reserve_media", {
    target_post: postId,
    file_bytes: output.info.size,
    file_width: output.info.width,
    file_height: output.info.height,
  });
  if (reserveError || !mediaId) {
    const msg = reserveError?.message ?? "";
    if (msg.includes("5 per post")) {
      return fail(409, "This post already has 5 images. Removed images are freed when you save.");
    }
    if (msg.includes("10 MB")) {
      return fail(409, "You've used your 10 MB of image storage. Remove images from other posts first.");
    }
    if (msg.includes("own posts")) return fail(403, "You can only add images to your own posts.");
    console.error("reserve_media", reserveError?.message);
    return fail(500, "Couldn't save the image. Please try again.");
  }

  const storage = createStorageAdmin();
  const path = mediaPath(mediaId);
  const upload = await storage
    .from(MEDIA_PRIVATE_BUCKET)
    .upload(path, output.data, { contentType: "image/webp", upsert: false });
  if (upload.error) {
    console.error("media upload", upload.error.message);
    await supabase.from("media").delete().eq("id", mediaId);
    return fail(500, "Couldn't save the image. Please try again.");
  }

  const signed = await storage.from(MEDIA_PRIVATE_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);

  return Response.json({
    id: mediaId,
    width: output.info.width,
    height: output.info.height,
    bytes: output.info.size,
    url: signed.data?.signedUrl ?? null,
  });
}
