"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadFolders, loadImages, loadTags, type UIImage } from "@/lib/data";
import type { Folder, Tag } from "@/lib/types";
import Sidebar from "./Sidebar";
import SearchBar from "./SearchBar";
import ImageGrid from "./ImageGrid";
import ImageDetailModal from "./ImageDetailModal";
import UploadSheet from "./UploadSheet";
import FolderManagerModal from "./FolderManagerModal";
import BottomNav from "./BottomNav";

export default function GalleryClient() {
  const supabase = createClient();
  const router = useRouter();

  const [images, setImages] = useState<UIImage[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [detailId, setDetailId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[] | undefined>(undefined);
  const [folderManagerOpen, setFolderManagerOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);

  const refreshAll = useCallback(async () => {
    const [imgs, flds, tgs] = await Promise.all([
      loadImages(supabase),
      loadFolders(supabase),
      loadTags(supabase),
    ]);
    setImages(imgs);
    setFolders(flds);
    setTags(tgs);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // 画面内でのクリップボード貼り付けから、そのままアップロードシートを開く
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (uploadOpen) return;
      const files: File[] = [];
      for (const item of e.clipboardData?.items ?? []) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        setUploadFiles(files);
        setUploadOpen(true);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [uploadOpen]);

  const filtered = useMemo(() => {
    const keywords = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return images.filter((img) => {
      if (selectedFolderId && img.folder_id !== selectedFolderId) return false;
      if (selectedTagId && !img.tags.some((t) => t.id === selectedTagId)) return false;
      if (keywords.length === 0) return true;
      const haystack = [
        img.original_filename ?? "",
        img.folder?.name ?? "",
        img.memo ?? "",
        ...img.tags.map((t) => t.name),
      ]
        .join(" ")
        .toLowerCase();
      return keywords.every((k) => haystack.includes(k));
    });
  }, [images, selectedFolderId, selectedTagId, query]);

  const detailImage = images.find((i) => i.id === detailId) ?? null;
  const detailIndex = detailImage ? filtered.findIndex((i) => i.id === detailImage.id) : -1;

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 md:px-6">
          <span className="hidden text-lg font-bold md:inline">🖼️ 参考画像</span>
          <div className="flex-1">
            <SearchBar id="global-search" value={query} onChange={setQuery} />
          </div>
          <button
            onClick={() => {
              setUploadFiles(undefined);
              setUploadOpen(true);
            }}
            className="hidden flex-shrink-0 items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white md:flex"
          >
            ＋ 保存
          </button>
          <button
            onClick={handleSignOut}
            className="hidden flex-shrink-0 text-xs text-faint hover:text-ink md:block"
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 md:px-6">
        <Sidebar
          className="sticky top-[72px] hidden h-fit w-52 flex-shrink-0 md:flex"
          folders={folders}
          tags={tags}
          selectedFolderId={selectedFolderId}
          selectedTagId={selectedTagId}
          onSelectFolder={setSelectedFolderId}
          onSelectTag={setSelectedTagId}
          onManageFolders={() => setFolderManagerOpen(true)}
        />

        <main className="min-w-0 flex-1">
          {loading ? (
            <div className="py-24 text-center text-sm text-faint">読み込み中…</div>
          ) : (
            <ImageGrid images={filtered} onSelect={(img) => setDetailId(img.id)} />
          )}
        </main>
      </div>

      <div id="tag-cloud" className="mx-auto max-w-[1400px] px-4 pb-10 md:hidden">
        <Sidebar
          folders={folders}
          tags={tags}
          selectedFolderId={selectedFolderId}
          selectedTagId={selectedTagId}
          onSelectFolder={setSelectedFolderId}
          onSelectTag={setSelectedTagId}
          onManageFolders={() => setFolderManagerOpen(true)}
        />
      </div>

      <BottomNav
        onSave={() => {
          setUploadFiles(undefined);
          setUploadOpen(true);
        }}
        onFolders={() => setFolderManagerOpen(true)}
        onSearchFocus={() => searchRef.current?.focus()}
      />

      {detailImage && (
        <ImageDetailModal
          image={detailImage}
          folders={folders}
          allTags={tags}
          onClose={() => setDetailId(null)}
          onChanged={refreshAll}
          onPrev={
            detailIndex > 0 ? () => setDetailId(filtered[detailIndex - 1].id) : undefined
          }
          onNext={
            detailIndex >= 0 && detailIndex < filtered.length - 1
              ? () => setDetailId(filtered[detailIndex + 1].id)
              : undefined
          }
        />
      )}

      {uploadOpen && (
        <UploadSheet
          folders={folders}
          initialFiles={uploadFiles}
          onClose={() => setUploadOpen(false)}
          onUploaded={refreshAll}
        />
      )}

      {folderManagerOpen && (
        <FolderManagerModal
          folders={folders}
          onClose={() => setFolderManagerOpen(false)}
          onChanged={refreshAll}
        />
      )}
    </div>
  );
}
