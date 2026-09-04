import type { SupabaseClient } from "@supabase/supabase-js";
import type { Folder, Tag, ImageRow } from "@/lib/types";

export type UIImage = ImageRow & {
  folder: Folder | null;
  tags: Tag[];
  thumbUrl: string | null;
};

const SIGN_TTL = 60 * 60; // 1時間

// 画像メタデータ一式(フォルダ・タグ込み)を取得し、サムネイルの署名URLをまとめて発行する。
// 個人利用・数千枚規模を想定し、フィルタや検索はクライアント側で行う前提で全件取得する。
export async function loadImages(supabase: SupabaseClient): Promise<UIImage[]> {
  const { data, error } = await supabase
    .from("images")
    .select("*, folder:folders(*), image_tags(tag:tags(*))")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as any[];
  const thumbPaths = rows.map((r) => r.thumb_path).filter(Boolean);

  let signedMap = new Map<string, string>();
  if (thumbPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("images")
      .createSignedUrls(thumbPaths, SIGN_TTL);
    (signed ?? []).forEach((s) => {
      if (s.signedUrl && s.path) signedMap.set(s.path, s.signedUrl);
    });
  }

  return rows.map((r) => ({
    ...r,
    tags: (r.image_tags ?? []).map((it: any) => it.tag).filter(Boolean),
    thumbUrl: signedMap.get(r.thumb_path) ?? null,
  }));
}

export async function loadFolders(supabase: SupabaseClient): Promise<Folder[]> {
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function loadTags(supabase: SupabaseClient): Promise<Tag[]> {
  const { data, error } = await supabase.from("tags").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function signOriginal(supabase: SupabaseClient, path: string) {
  const { data } = await supabase.storage.from("images").createSignedUrl(path, SIGN_TTL);
  return data?.signedUrl ?? null;
}
