import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Form Runtime Demo",
  description: "Demo of the ultra-light form runtime",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
