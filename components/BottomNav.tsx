"use client";

type Props = {
  onSave: () => void;
  onFolders: () => void;
  onSearchFocus: () => void;
};

export default function BottomNav({ onSave, onFolders, onSearchFocus }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted"
      >
        <span className="text-lg">⌂</span>
        ホーム
      </button>
      <button
        onClick={onFolders}
        className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted"
      >
        <span className="text-lg">▤</span>
        フォルダ
      </button>
      <button
        onClick={onSave}
        aria-label="保存"
        className="-mt-6 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-accent text-2xl font-bold text-white shadow-lg"
      >
        ＋
      </button>
      <button
        onClick={onSearchFocus}
        className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted"
      >
        <span className="text-lg">⌕</span>
        検索
      </button>
      <button
        className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] text-muted"
        onClick={() => document.getElementById("tag-cloud")?.scrollIntoView({ behavior: "smooth" })}
      >
        <span className="text-lg">#</span>
        タグ
      </button>
    </nav>
  );
}
