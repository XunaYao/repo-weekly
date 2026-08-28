import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoWeekly",
  description: "发现、研究并创作开源项目内容",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
