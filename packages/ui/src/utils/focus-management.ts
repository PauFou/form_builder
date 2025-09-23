/**
 * Focus management utilities for accessibility
 * Provides keyboard navigation and focus trapping capabilities
 */

import * as React from "react";

/**
 * Gets all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(",");

  return Array.from(container.querySelectorAll(focusableSelectors)).filter((element) => {
    const htmlElement = element as HTMLElement;
    return (
      htmlElement.offsetParent !== null &&
      !htmlElement.hasAttribute("aria-hidden") &&
      htmlElement.tabIndex !== -1
    );
  }) as HTMLElement[];
}

/**
 * Moves focus to the first focusable element in a container
 */
export function focusFirst(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[0].focus();
    return true;
  }
  return false;
}

/**
 * Moves focus to the last focusable element in a container
 */
export function focusLast(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);
  if (focusableElements.length > 0) {
    focusableElements[focusableElements.length - 1].focus();
    return true;
  }
  return false;
}

/**
 * Creates a focus trap within a container
 */
export function createFocusTrap(container: HTMLElement) {
  let isActive = false;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isActive || event.key !== "Tab") return;

    const focusableElements = getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  };

  const activate = () => {
    isActive = true;
    document.addEventListener("keydown", handleKeyDown);
    focusFirst(container);
  };

  const deactivate = () => {
    isActive = false;
    document.removeEventListener("keydown", handleKeyDown);
  };

  return { activate, deactivate };
}

/**
 * Hook for managing focus trap
 */
export function useFocusTrap(isActive: boolean = false) {
  const containerRef = React.useRef<HTMLElement>(null);
  const focusTrapRef = React.useRef<ReturnType<typeof createFocusTrap> | null>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isActive) {
      // Store current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Create and activate focus trap
      focusTrapRef.current = createFocusTrap(container);
      focusTrapRef.current.activate();
    } else {
      // Deactivate focus trap
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
        focusTrapRef.current = null;
      }

      // Restore previous focus
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }

    return () => {
      if (focusTrapRef.current) {
        focusTrapRef.current.deactivate();
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing roving tabindex (keyboard navigation within lists)
 */
export function useRovingTabindex<T extends HTMLElement>() {
  const itemsRef = React.useRef<T[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const registerItem = React.useCallback(
    (item: T | null, index: number) => {
      if (item) {
        itemsRef.current[index] = item;
        item.tabIndex = index === currentIndex ? 0 : -1;
      }
    },
    [currentIndex]
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      const items = itemsRef.current.filter(Boolean);
      if (items.length === 0) return;

      let newIndex = currentIndex;

      switch (event.key) {
        case "ArrowDown":
        case "ArrowRight":
          event.preventDefault();
          newIndex = (currentIndex + 1) % items.length;
          break;
        case "ArrowUp":
        case "ArrowLeft":
          event.preventDefault();
          newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
          break;
        case "Home":
          event.preventDefault();
          newIndex = 0;
          break;
        case "End":
          event.preventDefault();
          newIndex = items.length - 1;
          break;
        default:
          return;
      }

      setCurrentIndex(newIndex);
      items[newIndex]?.focus();
    },
    [currentIndex]
  );

  React.useEffect(() => {
    itemsRef.current.forEach((item, index) => {
      if (item) {
        item.tabIndex = index === currentIndex ? 0 : -1;
      }
    });
  }, [currentIndex]);

  return {
    registerItem,
    handleKeyDown,
    currentIndex,
    setCurrentIndex,
  };
}

/**
 * Hook for managing focus restoration
 */
export function useFocusRestore() {
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  const saveFocus = React.useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = React.useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      restoreFocus();
    };
  }, [restoreFocus]);

  return { saveFocus, restoreFocus };
}

/**
 * Hook for managing announcement to screen readers
 */
export function useAnnouncement() {
  const [announcement, setAnnouncement] = React.useState("");

  const announce = React.useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      setAnnouncement(""); // Clear first to ensure re-announcement
      setTimeout(() => {
        setAnnouncement(message);
      }, 10);
    },
    []
  );

  const AnnouncementRegion = React.useCallback(
    ({ priority = "polite" }: { priority?: "polite" | "assertive" }) =>
      React.createElement(
        "div",
        {
          className: "sr-only",
          "aria-live": priority,
          "aria-atomic": "true",
          role: "status",
        },
        announcement
      ),
    [announcement]
  );

  return { announce, AnnouncementRegion };
}

/**
 * Utility to create skip links for keyboard navigation
 */
export interface SkipLink {
  id: string;
  label: string;
  target: string;
}

export function createSkipLinks(links: SkipLink[]): React.ReactElement[] {
  return links.map((link) =>
    React.createElement(
      "a",
      {
        key: link.id,
        href: `#${link.target}`,
        className:
          "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring",
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            const target = document.getElementById(link.target);
            if (target) {
              target.focus();
              target.scrollIntoView({ behavior: "smooth" });
            }
          }
        },
      },
      link.label
    )
  );
}
