"use client";

import type { UIImage } from "@/lib/data";
import ImageCard from "./ImageCard";

type Props = {
  images: UIImage[];
  onSelect: (image: UIImage) => void;
};

export default function ImageGrid({ images, onSelect }: Props) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-24 text-center text-faint">
        <div className="text-3xl">🖼️</div>
        <p className="text-sm">該当する画像がありません</p>
        <p className="text-xs">右下の「＋保存」から気になったデザインを追加しましょう</p>
      </div>
    );
  }

  return (
    <div className="masonry">
      {images.map((img) => (
        <ImageCard key={img.id} image={img} onClick={() => onSelect(img)} />
      ))}
    </div>
  );
}
