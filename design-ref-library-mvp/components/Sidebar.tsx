"use client";

import type { Folder, Tag } from "@/lib/types";

type Props = {
  folders: Folder[];
  tags: Tag[];
  selectedFolderId: string | null;
  selectedTagId: string | null;
  onSelectFolder: (id: string | null) => void;
  onSelectTag: (id: string | null) => void;
  onManageFolders: () => void;
  className?: string;
};

export default function Sidebar({
  folders,
  tags,
  selectedFolderId,
  selectedTagId,
  onSelectFolder,
  onSelectTag,
  onManageFolders,
  className = "",
}: Props) {
  return (
    <aside className={`flex flex-col gap-6 ${className}`}>
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wide text-faint">フォルダ</h2>
          <button
            onClick={onManageFolders}
            className="text-xs text-accent hover:underline"
          >
            編集
          </button>
        </div>
        <nav className="flex flex-col gap-0.5">
          <button
            onClick={() => onSelectFolder(null)}
            className={`rounded-lg px-3 py-1.5 text-left text-sm transition ${
              selectedFolderId === null
                ? "bg-accent-soft font-semibold text-accent-ink"
                : "text-ink hover:bg-surface-muted"
            }`}
          >
            すべて
          </button>
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => onSelectFolder(f.id)}
              className={`truncate rounded-lg px-3 py-1.5 text-left text-sm transition ${
                selectedFolderId === f.id
                  ? "bg-accent-soft font-semibold text-accent-ink"
                  : "text-ink hover:bg-surface-muted"
              }`}
            >
              {f.name}
            </button>
          ))}
        </nav>
      </div>

      {tags.length > 0 && (
        <div>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-faint">
            タグ
          </h2>
          <div className="flex flex-wrap gap-1.5 px-1">
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTag(selectedTagId === t.id ? null : t.id)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  selectedTagId === t.id
                    ? "border-transparent bg-accent text-white"
                    : "border-line bg-surface text-muted hover:border-accent hover:text-accent-ink"
                }`}
              >
                #{t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
