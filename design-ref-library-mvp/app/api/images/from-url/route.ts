import { NextResponse } from "next/server";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const THUMB_MAX_EDGE = 640;
const MAX_BYTES = 25 * 1024 * 1024; // 25MB

// 画像URLをサーバー側で取得してStorageへ保存する。
// ブラウザから直接fetchするとCORSで弾かれるサイトが多いため、ここを経由する。
// 将来のSTEP5(iOSショートカット連携)でも、このエンドポイントを流用・拡張する想定。
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const url: string | undefined = body?.url;
  const folderId: string | null = body?.folder_id ?? null;

  if (!url || !/^https?:\/\//.test(url)) {
    return NextResponse.json({ error: "有効な画像URLを指定してください" }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(url, { redirect: "follow" });
  } catch {
    return NextResponse.json({ error: "画像を取得できませんでした" }, { status: 400 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: `画像の取得に失敗しました (${res.status})` }, { status: 400 });
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "画像ではないURLのようです" }, { status: 400 });
  }

  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "画像サイズが大きすぎます(上限25MB)" }, { status: 400 });
  }
  const buffer = Buffer.from(arrayBuffer);

  let width = 0;
  let height = 0;
  let thumbBuffer: Buffer;
  try {
    const img = sharp(buffer, { failOn: "none" });
    const meta = await img.metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
    thumbBuffer = await img
      .clone()
      .resize({ width: THUMB_MAX_EDGE, height: THUMB_MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    return NextResponse.json({ error: "画像の処理に失敗しました" }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const ext = (contentType.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const originalPath = `${user.id}/${id}/original.${ext}`;
  const thumbPath = `${user.id}/${id}/thumb.webp`;

  const up1 = await supabase.storage.from("images").upload(originalPath, buffer, { contentType });
  if (up1.error) {
    return NextResponse.json({ error: up1.error.message }, { status: 500 });
  }
  const up2 = await supabase.storage
    .from("images")
    .upload(thumbPath, thumbBuffer, { contentType: "image/webp" });
  if (up2.error) {
    return NextResponse.json({ error: up2.error.message }, { status: 500 });
  }

  const filename = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "image");

  const { error: insertError } = await supabase.from("images").insert({
    id,
    user_id: user.id,
    folder_id: folderId,
    storage_path: originalPath,
    thumb_path: thumbPath,
    original_filename: filename,
    width,
    height,
    source_url: url,
    memo: "",
  });
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id });
}
