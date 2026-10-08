/**
 * ✏️  EDIT ME — everything personal about your wedding lives in this file.
 * Change the text, save, and the whole site updates.
 */
export const WEDDING = {
  coupleNames: "ហ៊ី ម៉េងលី និង សុខ ច័ន្ទហេង",
  /** Shown under the names — any text works. */
  dateLabel: "ថ្ងៃអាទិត្យ ទី២០ ខែធ្នូ ឆ្នាំ២០២៦",
  venue: "សួនចម្ការចាស់",
  hashtag: "#MenglyAndChanheng",
  welcome:
    "សូមជួយយើងមើលថ្ងៃពិសេសនេះតាមរយៈភ្នែករបស់អ្នក។ សូមចែករំលែករូបថត និងវីដេអូទាំងអស់ដែលអ្នកបានថត ទោះធម្មជាតិ ព្រិល ឬស្រស់ស្អាត យើងចង់បានទាំងអស់។",
  /** Used as the name of the .zip when the couple downloads everything. */
  archiveName: "mengly-and-chanheng-wedding",
} as const;

/** Supabase Storage bucket name — must match supabase/schema.sql */
export const STORAGE_BUCKET = "wedding-media";

export const UPLOAD_LIMITS = {
  /** How many files a guest can send in one go. */
  maxFilesPerBatch: 50,
  maxImageBytes: 25 * 1024 * 1024, // 25 MB
  /**
   * Supabase's Free plan caps every single file at 50 MB (≈ 30–60 s of 1080p
   * phone video). After upgrading to Pro you can raise this AND the bucket's
   * file_size_limit in supabase/schema.sql.
   */
  maxVideoBytes: 50 * 1024 * 1024, // 50 MB
  maxNameLength: 60,
  maxMessageLength: 280,
} as const;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const;

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"] as const;

/** How many gallery items load at a time (more load as guests scroll). */
export const GALLERY_PAGE_SIZE = 48;
