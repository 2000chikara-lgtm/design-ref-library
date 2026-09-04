// アップロード時にブラウザ上でサムネイル(WebP, 長辺 640px)を生成する。
// Supabase Storage の無料枠(1GB)を長持ちさせるための最小限の処理。

export type PreparedImage = {
  original: Blob;
  thumb: Blob;
  width: number;
  height: number;
};

const THUMB_MAX_EDGE = 640;

export async function prepareImage(file: File | Blob): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const scale = Math.min(1, THUMB_MAX_EDGE / Math.max(width, height));
  const thumbW = Math.round(width * scale);
  const thumbH = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = thumbW;
  canvas.height = thumbH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context を取得できませんでした");
  ctx.drawImage(bitmap, 0, 0, thumbW, thumbH);

  const thumb = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("サムネイル生成に失敗しました"))),
      "image/webp",
      0.82
    );
  });

  return { original: file, thumb, width, height };
}

export function guessExt(file: File | Blob, fallback = "jpg") {
  if ("name" in file && file.name.includes(".")) {
    return file.name.split(".").pop()!.toLowerCase();
  }
  if (file.type) {
    const t = file.type.split("/")[1];
    if (t) return t === "jpeg" ? "jpg" : t;
  }
  return fallback;
}
