/**
 * Browser-side upload helpers.
 *
 * We use XMLHttpRequest instead of fetch() because only XHR reports upload
 * progress — which is what drives the progress ring guests see.
 */

/** Upload one file to a Supabase signed upload URL, reporting bytes sent. */
export function putWithProgress(
  signedUrl: string,
  body: Blob,
  contentType: string,
  onProgress: (loadedBytes: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("content-type", contentType);
    xhr.setRequestHeader("cache-control", "max-age=31536000"); // files never change → cache for a year
    xhr.setRequestHeader("x-upsert", "false");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.min(e.loaded, body.size));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(body.size);
        resolve();
      } else {
        reject(new Error(readStorageError(xhr.responseText) ?? `បង្ហោះមិនបានសម្រេច (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("បណ្តាញមានបញ្ហា — សូមពិនិត្យសញ្ញា ហើយព្យាយាមម្តងទៀត។"));
    xhr.ontimeout = () => reject(new Error("ការបង្ហោះអស់ពេល។"));
    xhr.send(body);
  });
}

function readStorageError(text: string): string | null {
  try {
    const json = JSON.parse(text) as { message?: string; error?: string };
    return json.message ?? json.error ?? null;
  } catch {
    return null;
  }
}

/** Run `worker` over `items` with at most `limit` running at once. */
export async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

/**
 * Make a small JPEG preview (max 640px) so the gallery grid loads fast even
 * when guests upload 12 MB photos. Returns null if the browser can't decode
 * the image (e.g. HEIC on Chrome) — the gallery then just uses the original.
 */
export async function makeImageThumbnail(file: Blob, maxSize = 640): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.82),
    );
  } catch {
    return null;
  }
}

/** Keep the phone screen awake during a long upload (where supported). */
export async function requestWakeLock(): Promise<WakeLockSentinel | null> {
  try {
    if ("wakeLock" in navigator) return await navigator.wakeLock.request("screen");
  } catch {
    /* not supported or denied — that's fine */
  }
  return null;
}
