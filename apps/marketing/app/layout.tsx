import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Build forms. Ship answers.",
  description: "Professional form platform with EU hosting, advanced logic, and blazing fast performance. A powerful alternative to Typeform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en"
      className={`${GeistSans.variable} ${inter.variable} ${GeistMono.variable}`}
      style={{
        '--font-geist': GeistSans.style.fontFamily,
        '--font-inter': inter.style.fontFamily,
        '--font-geist-mono': GeistMono.style.fontFamily,
      } as React.CSSProperties}
    >
      <body className={GeistSans.className}>{children}</body>
    </html>
  );
}