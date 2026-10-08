/**
 * Browser-side memory of "which gallery items did I upload from this phone",
 * with the owner key for each (needed to delete them). Lives only in this
 * phone's browser storage — clearing the browser forgets it (the couple can
 * still delete anything from /admin).
 */
const KEY = "wedding-my-uploads";

export type MyUploads = Record<string, string>; // media id → owner key

export function readMyUploads(): MyUploads {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === "object" ? (parsed as MyUploads) : {};
  } catch {
    return {};
  }
}

function write(map: MyUploads) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* private mode / storage full — deletion just won't be offered later */
  }
  window.dispatchEvent(new Event("my-uploads-changed"));
}

export function rememberMyUploads(tokens: MyUploads) {
  write({ ...readMyUploads(), ...tokens });
}

export function forgetMyUploads(ids: string[]) {
  const map = readMyUploads();
  for (const id of ids) delete map[id];
  write(map);
}
