/** One row of the `media` table (see supabase/schema.sql). */
export type MediaItem = {
  id: string;
  created_at: string;
  storage_path: string;
  thumb_path: string | null;
  media_type: "image" | "video";
  mime_type: string;
  size_bytes: number;
  guest_name: string | null;
  message: string | null;
};

/** What /api/upload/sign hands back for each file. */
export type SignedUpload = {
  path: string;
  mime: string;
  kind: "image" | "video";
  signedUrl: string;
  thumbPath: string | null;
  thumbSignedUrl: string | null;
};
