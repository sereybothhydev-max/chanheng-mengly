"use client";

/** Connects the upload panel to the live gallery so a guest's own uploads appear instantly. */
import { useLiveMedia } from "@/hooks/useLiveMedia";
import { Gallery } from "./Gallery";
import { UploadPanel } from "./UploadPanel";

export function GuestApp() {
  const feed = useLiveMedia();

  return (
    <>
      <section className="mx-auto mt-10 max-w-2xl px-4 sm:px-6">
        <UploadPanel onUploaded={feed.addItems} />
      </section>

      <section id="gallery" className="mx-auto mt-16 max-w-3xl px-4 sm:px-6">
        <Gallery
          items={feed.items}
          status={feed.status}
          hasMore={feed.hasMore}
          loadingMore={feed.loadingMore}
          onLoadMore={feed.loadMore}
          onDeleted={feed.removeItems}
        />
      </section>
    </>
  );
}
