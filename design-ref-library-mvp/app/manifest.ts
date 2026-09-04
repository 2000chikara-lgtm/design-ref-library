import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "参考画像ライブラリ",
    short_name: "参考画像",
    description: "自分専用のデザイン参考画像ライブラリ",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f6f3",
    theme_color: "#17181c",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
