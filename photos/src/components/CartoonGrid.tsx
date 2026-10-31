"use client";

/** Decorative cartoon tiles shown while the gallery is still empty. */
import { useEffect, useState } from "react";
import { toon } from "@/lib/toon";

const ORDER = [0, 1, 2, 3, 4, 5, 6, 7];

export function CartoonGrid() {
  const [pics, setPics] = useState<string[]>([]);
  useEffect(() => {
    setPics(ORDER.map((i) => toon(i)));
  }, []);

  return (
    <ul aria-hidden className="grid grid-cols-2 gap-2.5 sm:gap-4">
      {ORDER.map((i, n) => (
        <li key={i}>
          <div
            className={`aspect-square w-full animate-fade-up overflow-hidden rounded-2xl shadow-[0_14px_30px_-18px_rgb(0_0_0/0.55)] ${
              pics[n] ? "" : "skeleton"
            }`}
            style={{ animationDelay: `${n * 45}ms` }}
          >
            {pics[n] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pics[n]} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
