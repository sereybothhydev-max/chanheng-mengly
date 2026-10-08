/**
 * "Download all" for the couple — builds a .zip IN THE BROWSER.
 *
 * Why in the browser? A wedding can easily produce 10–30 GB of media. A
 * serverless function on Vercel can't hold that much or run that long. Instead
 * we stream every original file from Supabase's CDN straight into a zip.
 *
 * On desktop Chrome / Edge the zip is written directly to disk as it's built
 * (File System Access API), so size is effectively unlimited. Other browsers
 * fall back to building it in memory — fine for a few GB.
 */
import { downloadZip } from "client-zip";
import { publicUrl } from "./supabase-browser";
import type { MediaItem } from "./types";
import { extensionFor } from "./validation";

function safeName(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/[^\w\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 40) || "guest"
  );
}

/** e.g. photos/2026-12-12_18-42-05_Aunt-Mary_0042.jpg */
export function archiveEntryName(item: MediaItem, index: number): string {
  const stamp = new Date(item.created_at).toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "-");
  const ext = item.storage_path.split(".").pop() || extensionFor(item.mime_type);
  const folder = item.media_type === "video" ? "videos" : "photos";
  return `${folder}/${stamp}_${safeName(item.guest_name ?? "guest")}_${String(index + 1).padStart(4, "0")}.${ext}`;
}

type SaveFilePicker = (options: {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}) => Promise<FileSystemFileHandle>;

export async function downloadAsZip(
  items: MediaItem[],
  zipName: string,
  onProgress: (done: number, total: number) => void,
): Promise<"saved" | "cancelled"> {
  // Oldest first inside the zip, so files read like a story of the day.
  const ordered = [...items].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
  let done = 0;
  onProgress(0, ordered.length);

  async function* entries() {
    for (const [i, item] of ordered.entries()) {
      const res = await fetch(publicUrl(item.storage_path));
      done++;
      onProgress(done, ordered.length);
      if (!res.ok) {
        console.warn("Skipping missing file", item.storage_path);
        continue;
      }
      yield { name: archiveEntryName(item, i), lastModified: new Date(item.created_at), input: res };
    }
  }

  const picker = (window as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

  if (picker) {
    let handle: FileSystemFileHandle;
    try {
      handle = await picker.call(window, {
        suggestedName: zipName,
        types: [{ description: "Zip archive", accept: { "application/zip": [".zip"] } }],
      });
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return "cancelled";
      throw err;
    }
    const writable = await handle.createWritable();
    const body = downloadZip(entries()).body;
    if (!body) throw new Error("កម្មវិធីរុករករបស់អ្នកមិនអាចបង្កើតឯកសារ zip បានទេ។");
    await body.pipeTo(writable);
    return "saved";
  }

  // Fallback: build in memory, then trigger a normal download.
  const blob = await downloadZip(entries()).blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "saved";
}
