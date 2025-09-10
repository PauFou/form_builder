import { useEffect, useRef } from "react";

interface AntiSpamOptions {
  honeypotField?: string;
  minCompletionTime?: number; // milliseconds
  enabled?: boolean;
}

export function useAntiSpam(options: AntiSpamOptions = {}) {
  const {
    honeypotField = "website_url",
    minCompletionTime = 3000, // 3 seconds minimum
    enabled = true,
  } = options;

  const startTimeRef = useRef<number>(Date.now());
  const honeypotRef = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;

    // Reset start time on mount
    startTimeRef.current = Date.now();

    // Create hidden honeypot field
    const createHoneypot = () => {
      const input = document.createElement("input");
      input.type = "text";
      input.name = honeypotField;
      input.tabIndex = -1;
      input.style.position = "absolute";
      input.style.left = "-9999px";
      input.style.top = "-9999px";
      input.setAttribute("aria-hidden", "true");
      input.setAttribute("autocomplete", "off");

      // Monitor honeypot
      input.addEventListener("change", (e) => {
        honeypotRef.current = (e.target as HTMLInputElement).value;
      });

      return input;
    };

    // Add honeypot to first form found
    const timer = setTimeout(() => {
      const form = document.querySelector(".fr-form");
      if (form) {
        const honeypot = createHoneypot();
        form.appendChild(honeypot);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [enabled, honeypotField]);

  const validateAntiSpam = (): { isValid: boolean; reason?: string } => {
    if (!enabled) return { isValid: true };

    // Check honeypot
    if (honeypotRef.current) {
      return {
        isValid: false,
        reason: "honeypot_filled",
      };
    }

    // Check time trap
    const completionTime = Date.now() - startTimeRef.current;
    if (completionTime < minCompletionTime) {
      return {
        isValid: false,
        reason: "too_fast",
      };
    }

    return { isValid: true };
  };

  return {
    validateAntiSpam,
    getCompletionTime: () => Date.now() - startTimeRef.current,
  };
}
