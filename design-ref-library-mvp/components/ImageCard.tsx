"use client";

import type { UIImage } from "@/lib/data";

type Props = {
  image: UIImage;
  onClick: () => void;
};

export default function ImageCard({ image, onClick }: Props) {
  const ratio =
    image.width && image.height ? image.width / image.height : 4 / 3;

  return (
    <button
      onClick={onClick}
      className="group relative block w-full overflow-hidden rounded-xl2 border border-line bg-surface text-left shadow-sm transition hover:shadow-md"
    >
      <div style={{ aspectRatio: ratio }} className="w-full bg-surface-muted">
        {image.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.thumbUrl}
            alt={image.memo || image.original_filename || "参考画像"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-faint">
            読み込み中…
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/55 via-black/0 to-transparent p-2 pt-6 opacity-0 transition group-hover:opacity-100">
        {image.folder && (
          <span className="w-fit rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium text-ink">
            {image.folder.name}
          </span>
        )}
        {image.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {image.tags.slice(0, 3).map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] text-white"
              >
                #{t.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
