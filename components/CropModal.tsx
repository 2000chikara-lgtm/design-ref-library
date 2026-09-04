"use client";

import { useRef } from "react";
import { Cropper, type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";

type Props = {
  imageSrc: string;
  onCancel: () => void;
  onApply: (blob: Blob) => void;
};

// スクリーンショットの余分な部分(ステータスバーやブラウザのUIなど)をカットするための
// シンプルなトリミング画面。回転・フィルターなどは持たせず、縦横の範囲指定だけに絞っている。
export default function CropModal({ imageSrc, onCancel, onApply }: Props) {
  const cropperRef = useRef<ReactCropperElement>(null);

  function apply() {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    cropper.getCroppedCanvas({ imageSmoothingQuality: "high" }).toBlob(
      (blob) => {
        if (blob) onApply(blob);
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={onCancel} className="text-sm text-white/80 hover:text-white">
          キャンセル
        </button>
        <span className="text-sm font-semibold text-white">トリミング</span>
        <button onClick={apply} className="text-sm font-semibold text-accent">
          適用する
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <Cropper
          ref={cropperRef}
          src={imageSrc}
          crossOrigin="anonymous"
          style={{ height: "100%", width: "100%" }}
          viewMode={1}
          dragMode="move"
          guides
          background={false}
          autoCropArea={0.95}
          checkOrientation={false}
          responsive
          restore={false}
        />
      </div>
      <p className="px-4 py-3 text-center text-xs text-white/60">
        四隅・辺のハンドルをドラッグして、不要な部分をカットしてください
      </p>
    </div>
  );
}
