"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { Navigation } from "../components/shared/navigation";

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth/");
  const isFormEditPage = pathname?.includes("/edit");
  const isPreviewPage = pathname?.includes("/preview/");

  useEffect(() => {
    // Remove browser extension attributes that cause React warnings
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
          const target = mutation.target as HTMLElement;
          // Remove Grammarly attributes
          if (target.hasAttribute("data-new-gr-c-s-check-loaded")) {
            target.removeAttribute("data-new-gr-c-s-check-loaded");
          }
          if (target.hasAttribute("data-gr-ext-installed")) {
            target.removeAttribute("data-gr-ext-installed");
          }
          // Remove other extension attributes
          if (target.hasAttribute("cz-shortcut-listen")) {
            target.removeAttribute("cz-shortcut-listen");
          }
        }
      });
    });

    // Start observing the body for attribute changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: [
        "data-new-gr-c-s-check-loaded",
        "data-gr-ext-installed",
        "cz-shortcut-listen",
      ],
    });

    // Clean up existing attributes on mount
    document.body.removeAttribute("data-new-gr-c-s-check-loaded");
    document.body.removeAttribute("data-gr-ext-installed");
    document.body.removeAttribute("cz-shortcut-listen");

    return () => {
      observer.disconnect();
    };
  }, []);

  // Don't show navigation on auth pages, form edit pages, or preview pages
  if (isAuthPage || isFormEditPage || isPreviewPage) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Main Content with navigation spacing */}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
