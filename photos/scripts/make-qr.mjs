/**
 * Generate print-ready QR codes for your table cards.
 *
 *   npm run qr -- https://your-site.vercel.app
 *
 * Creates (in the qr/ folder):
 *   qr-code.png  — 2000×2000 px, perfect for printing at any size
 *   qr-code.svg  — vector version for Canva / Illustrator / print shops
 *
 * Uses error-correction level "H" (30%), so the code still scans even if a
 * corner gets a wine splash or you place a small monogram in the middle.
 */
import { mkdir } from "node:fs/promises";
import QRCode from "qrcode";

const url = process.argv[2];
if (!url || !/^https:\/\//.test(url)) {
  console.error("\n  Usage: npm run qr -- https://your-site.vercel.app\n");
  process.exit(1);
}

const options = {
  errorCorrectionLevel: "H",
  margin: 2, // the quiet border scanners need — don't crop it off
  color: { dark: "#3b3330", light: "#ffffff" }, // warm near-black on white scans best
};

await mkdir("qr", { recursive: true });
await QRCode.toFile("qr/qr-code.png", url, { ...options, width: 2000 });
await QRCode.toFile("qr/qr-code.svg", url, { ...options, type: "svg" });

console.log(`\n  ✓ QR codes for ${url}`);
console.log("    qr/qr-code.png  (print)");
console.log("    qr/qr-code.svg  (vector)\n");
console.log("  Test it with 2–3 different phones before you print!\n");
