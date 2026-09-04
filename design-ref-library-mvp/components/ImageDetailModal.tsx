"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signOriginal } from "@/lib/data";
import type { UIImage } from "@/lib/data";
import type { Folder, Tag } from "@/lib/types";

type Props = {
  image: UIImage;
  folders: Folder[];
  allTags: Tag[];
  onClose: () => void;
  onChanged: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

export default function ImageDetailModal({
  image,
  folders,
  allTags,
  onClose,
  onChanged,
  onPrev,
  onNext,
}: Props) {
  const supabase = createClient();
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);
  const [memo, setMemo] = useState(image.memo ?? "");
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMemo(image.memo ?? "");
    setTagInput("");
    signOriginal(supabase, image.storage_path).then(setOriginalUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && onPrev) onPrev();
      if (e.key === "ArrowRight" && onNext) onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  async function changeFolder(folderId: string) {
    setBusy(true);
    await supabase.from("images").update({ folder_id: folderId }).eq("id", image.id);
    setBusy(false);
    onChanged();
  }

  async function saveMemoIfChanged() {
    if (memo === image.memo) return;
    await supabase.from("images").update({ memo }).eq("id", image.id);
    onChanged();
  }

  async function addTag() {
    const name = tagInput.trim().replace(/^#/, "");
    if (!name) return;
    setBusy(true);

    let tag = allTags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (!tag) {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("tags")
        .insert({ name, user_id: userData.user!.id })
        .select()
        .single();
      if (error) {
        // 既に同名タグが存在する場合など。読み直して継続。
        const { data: existing } = await supabase
          .from("tags")
          .select("*")
          .ilike("name", name)
          .maybeSingle();
        tag = existing ?? undefined;
      } else {
        tag = data;
      }
    }

    if (tag) {
      await supabase.from("image_tags").upsert({ image_id: image.id, tag_id: tag.id });
    }
    setTagInput("");
    setBusy(false);
    onChanged();
  }

  async function removeTag(tagId: string) {
    setBusy(true);
    await supabase.from("image_tags").delete().eq("image_id", image.id).eq("tag_id", tagId);
    setBusy(false);
    onChanged();
  }

  async function deleteImage() {
    if (!confirm("この画像を削除しますか？元に戻せません。")) return;
    setBusy(true);
    await supabase.storage.from("images").remove([image.storage_path, image.thumb_path]);
    await supabase.from("images").delete().eq("id", image.id);
    setBusy(false);
    onChanged();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/70 sm:items-center sm:justify-center sm:p-6" onClick={onClose}>
      <div
        className="flex h-full w-full flex-col overflow-hidden bg-surface sm:h-[85vh] sm:max-w-4xl sm:flex-row sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex flex-1 items-center justify-center bg-ink/95 p-2 sm:p-6">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white"
          >
            ×
          </button>
          {onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white sm:flex"
            >
              ‹
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white sm:flex"
            >
              ›
            </button>
          )}
          {originalUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={originalUrl}
              alt={image.memo || image.original_filename || "参考画像"}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-sm text-white/60">読み込み中…</div>
          )}
        </div>

        <div className="flex w-full flex-col gap-5 overflow-y-auto p-5 sm:w-80">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-faint">
              フォルダ
            </label>
            <select
              value={image.folder_id ?? ""}
              onChange={(e) => changeFolder(e.target.value)}
              disabled={busy}
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-faint">
              タグ
            </label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {image.tags.map((t) => (
                <span
                  key={t.id}
                  className="flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs text-accent-ink"
                >
                  #{t.name}
                  <button onClick={() => removeTag(t.id)} className="text-accent-ink/60 hover:text-accent-ink">
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTag()}
                placeholder="タグを追加してEnter"
                list="all-tags"
                className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
              />
              <datalist id="all-tags">
                {allTags.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
              <button
                onClick={addTag}
                disabled={busy || !tagInput.trim()}
                className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                追加
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-faint">
              メモ（なぜ保存したか）
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              onBlur={saveMemoIfChanged}
              rows={4}
              placeholder="例）割引率が最初に目に入る"
              className="w-full resize-none rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>

          {image.source_url && (
            <a
              href={image.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent hover:underline"
            >
              保存元のURLを開く ↗
            </a>
          )}

          <div className="mt-auto flex gap-2 border-t border-line pt-4">
            {originalUrl && (
              <a
                href={originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border border-line px-3 py-2 text-center text-sm font-medium hover:bg-surface-muted"
              >
                元画像を表示
              </a>
            )}
            <button
              onClick={deleteImage}
              disabled={busy}
              className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
