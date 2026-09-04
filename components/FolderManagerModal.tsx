"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Folder } from "@/lib/types";

type Props = {
  folders: Folder[];
  onClose: () => void;
  onChanged: () => void;
};

export default function FolderManagerModal({ folders, onClose, onChanged }: Props) {
  const supabase = createClient();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [busy, setBusy] = useState(false);

  async function addFolder() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from("folders").insert({
      name,
      user_id: userData.user!.id,
      sort_order: folders.length,
    });
    setNewName("");
    setBusy(false);
    onChanged();
  }

  async function renameFolder(id: string) {
    const name = editingName.trim();
    if (!name) return;
    setBusy(true);
    await supabase.from("folders").update({ name }).eq("id", id);
    setEditingId(null);
    setBusy(false);
    onChanged();
  }

  async function deleteFolder(f: Folder) {
    if (f.name === "未分類") {
      alert("「未分類」フォルダは削除できません");
      return;
    }
    if (!confirm(`「${f.name}」を削除しますか？中の画像は「未分類」に移動します。`)) return;
    setBusy(true);

    const unsorted = folders.find((x) => x.name === "未分類");
    if (unsorted) {
      await supabase.from("images").update({ folder_id: unsorted.id }).eq("folder_id", f.id);
    }
    await supabase.from("folders").delete().eq("id", f.id);
    setBusy(false);
    onChanged();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-surface p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold">フォルダを編集</h2>
          <button onClick={onClose} className="text-faint hover:text-ink">
            ×
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {folders.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
              {editingId === f.id ? (
                <>
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 rounded border border-line px-2 py-1 text-sm outline-none focus:border-accent"
                  />
                  <button
                    disabled={busy}
                    onClick={() => renameFolder(f.id)}
                    className="text-xs font-semibold text-accent"
                  >
                    保存
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm">{f.name}</span>
                  <button
                    onClick={() => {
                      setEditingId(f.id);
                      setEditingName(f.name);
                    }}
                    className="text-xs text-muted hover:text-ink"
                  >
                    名前変更
                  </button>
                  {f.name !== "未分類" && (
                    <button
                      disabled={busy}
                      onClick={() => deleteFolder(f)}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      削除
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFolder()}
            placeholder="新しいフォルダ名"
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            disabled={busy || !newName.trim()}
            onClick={addFolder}
            className="rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
