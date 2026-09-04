import type { Metadata, Viewport } from "next";
import "./globals.css";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "参考画像ライブラリ",
  description: "自分専用のデザイン参考画像ライブラリ",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "参考画像",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f7f6f3",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-canvas text-ink font-sans antialiased">
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
