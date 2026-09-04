"use client";

type Props = {
  value: string;
  onChange: (v: string) => void;
  id?: string;
};

export default function SearchBar({ value, onChange, id }: Props) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
        ⌕
      </span>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ファイル名・フォルダ・タグ・メモを検索（例: 医療 赤 権威）"
        className="w-full rounded-full border border-line bg-surface py-2.5 pl-9 pr-9 text-sm outline-none focus:border-accent"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          aria-label="検索をクリア"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
        >
          ×
        </button>
      )}
    </div>
  );
}
