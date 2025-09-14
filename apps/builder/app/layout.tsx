"use client";

import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Inter } from "next/font/google";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n";
import { SkemyaThemeProvider } from "@/lib/theme";
import { useState, useEffect } from "react";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  // Set document title and lang attribute
  useEffect(() => {
    document.title = "Form Builder - Skemya Forms Platform";

    // Update lang attribute based on detected locale
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get("lang");
    if (langParam) {
      document.documentElement.lang = langParam;
    } else if (window.navigator.language.startsWith("fr")) {
      document.documentElement.lang = "fr";
    }
  }, []);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${inter.variable} ${GeistMono.variable}`}
      style={
        {
          "--font-geist": GeistSans.style.fontFamily,
          "--font-inter": inter.style.fontFamily,
          "--font-geist-mono": GeistMono.style.fontFamily,
        } as React.CSSProperties
      }
    >
      <body className={GeistSans.className}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SkemyaThemeProvider>
              <I18nProvider>
                {children}
                <Toaster
                  position="top-center"
                  toastOptions={{
                    className: "",
                    style: {
                      borderRadius: "var(--radius)",
                      background: "hsl(var(--card))",
                      color: "hsl(var(--card-foreground))",
                      border: "1px solid hsl(var(--border))",
                    },
                  }}
                />
              </I18nProvider>
            </SkemyaThemeProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
