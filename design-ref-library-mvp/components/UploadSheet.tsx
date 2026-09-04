"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { prepareImage, guessExt } from "@/lib/image";
import type { Folder } from "@/lib/types";

type PendingItem = {
  id: string;
  file: File;
  previewUrl: string;
  folderId: string;
  status: "pending" | "uploading" | "done" | "error";
};

type Props = {
  folders: Folder[];
  initialFiles?: File[];
  onClose: () => void;
  onUploaded: () => void;
};

export default function UploadSheet({ folders, initialFiles, onClose, onUploaded }: Props) {
  const supabase = createClient();
  const unsortedId = folders.find((f) => f.name === "未分類")?.id ?? folders[0]?.id ?? "";
  const [items, setItems] = useState<PendingItem[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [urlBusy, setUrlBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) addFiles(initialFiles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const files: File[] = [];
      for (const item of e.clipboardData?.items ?? []) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) addFiles(files);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unsortedId]);

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setItems((prev) => [
      ...prev,
      ...list.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        folderId: unsortedId,
        status: "pending" as const,
      })),
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function setItemFolder(id: string, folderId: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, folderId } : i)));
  }

  async function uploadOne(item: PendingItem) {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user!.id;
    const prepared = await prepareImage(item.file);
    const id = crypto.randomUUID();
    const ext = guessExt(item.file);
    const originalPath = `${userId}/${id}/original.${ext}`;
    const thumbPath = `${userId}/${id}/thumb.webp`;

    const up1 = await supabase.storage
      .from("images")
      .upload(originalPath, prepared.original, { contentType: item.file.type || undefined });
    if (up1.error) throw up1.error;

    const up2 = await supabase.storage
      .from("images")
      .upload(thumbPath, prepared.thumb, { contentType: "image/webp" });
    if (up2.error) throw up2.error;

    const { error: insertError } = await supabase.from("images").insert({
      id,
      user_id: userId,
      folder_id: item.folderId || null,
      storage_path: originalPath,
      thumb_path: thumbPath,
      original_filename: item.file.name || null,
      width: prepared.width,
      height: prepared.height,
      memo: "",
    });
    if (insertError) throw insertError;
  }

  async function saveAll() {
    if (items.length === 0) return;
    setSaving(true);
    for (const item of items) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "uploading" } : i)));
      try {
        await uploadOne(item);
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "done" } : i)));
      } catch (e) {
        console.error(e);
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "error" } : i)));
      }
    }
    setSaving(false);
    onUploaded();
    onClose();
  }

  async function saveUrl() {
    const url = urlInput.trim();
    if (!url) return;
    setUrlBusy(true);
    try {
      const res = await fetch("/api/images/from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, folder_id: unsortedId || null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "保存に失敗しました");
      }
      setUrlInput("");
      onUploaded();
    } catch (e: any) {
      alert(e.message || "画像URLの保存に失敗しました");
    } finally {
      setUrlBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-surface sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-bold">画像を保存</h2>
          <button onClick={onClose} className="text-faint hover:text-ink">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl2 border-2 border-dashed px-4 py-8 text-center transition ${
              dragOver ? "border-accent bg-accent-soft" : "border-line hover:border-accent"
            }`}
          >
            <div className="text-2xl">＋</div>
            <p className="text-sm font-medium">
              タップして写真を選択
              <span className="hidden sm:inline">／ドラッグ&ドロップ</span>
            </p>
            <p className="text-xs text-faint">複数選択可・スクリーンショットもOK</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveUrl()}
              placeholder="画像URLを貼り付け"
              className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={saveUrl}
              disabled={urlBusy || !urlInput.trim()}
              className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              {urlBusy ? "取得中…" : "URLから保存"}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-faint">画面内でそのまま Ctrl/Cmd+V も使えます</p>

          {items.length > 0 && (
            <div className="mt-5 flex flex-col gap-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-line p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs text-muted">{item.file.name}</p>
                    <select
                      value={item.folderId}
                      onChange={(e) => setItemFolder(item.id, e.target.value)}
                      className="mt-1 w-full rounded border border-line px-1.5 py-1 text-xs"
                    >
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="w-14 flex-shrink-0 text-center text-[11px] text-faint">
                    {item.status === "pending" && "待機中"}
                    {item.status === "uploading" && "保存中…"}
                    {item.status === "done" && "✓ 完了"}
                    {item.status === "error" && "✕ 失敗"}
                  </span>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="flex-shrink-0 text-faint hover:text-ink"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-line p-4">
          <button
            onClick={saveAll}
            disabled={saving || items.length === 0}
            className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {saving ? "保存中…" : `${items.length}件を保存する`}
          </button>
        </div>
      </div>
    </div>
  );
}
