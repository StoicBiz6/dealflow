import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DealFlow – Sales Pipeline",
  description: "Track and manage your sales deals from lead to close.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
