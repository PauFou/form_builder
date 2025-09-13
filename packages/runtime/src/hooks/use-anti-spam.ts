import { useEffect, useRef, useCallback } from "react";
import { antiSpamService } from "../services/anti-spam-service";

interface AntiSpamOptions {
  honeypotField?: string;
  minCompletionTime?: number; // milliseconds
  enabled?: boolean;
  formId?: string;
  skipRateLimit?: boolean;
}

export function useAntiSpam(options: AntiSpamOptions = {}) {
  const {
    honeypotField = "_website_url",
    minCompletionTime = 3000, // 3 seconds minimum
    enabled = true,
    formId,
    skipRateLimit = false,
  } = options;

  const sessionIdRef = useRef<string>(`session_${Date.now()}_${Math.random()}`);
  const honeypotFieldRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const sessionId = sessionIdRef.current;

    // Initialize session in anti-spam service
    antiSpamService.initializeFormSession(sessionId);

    // Update config if custom values provided
    if (honeypotField !== "_website_url" || minCompletionTime !== 3000) {
      antiSpamService.updateConfig({
        honeypot: {
          enabled: true,
          fieldName: honeypotField,
        },
        timeTrap: {
          enabled: true,
          minCompletionTimeMs: minCompletionTime,
        },
      });
    }

    // Add honeypot to first form found
    const timer = setTimeout(() => {
      const form = document.querySelector(".fr-form");
      if (form && !form.querySelector(`#${honeypotField}`)) {
        const honeypotInput = antiSpamService.createHoneypotField();
        honeypotFieldRef.current = honeypotInput;

        // Monitor honeypot value changes
        honeypotInput.addEventListener("input", (e) => {
          const value = (e.target as HTMLInputElement).value;
          antiSpamService.updateHoneypotValue(sessionId, value);
        });

        form.appendChild(honeypotInput);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      // Clean up session on unmount
      antiSpamService.clearSession(sessionId);

      // Remove honeypot field
      if (honeypotFieldRef.current) {
        honeypotFieldRef.current.remove();
      }
    };
  }, [enabled, honeypotField, minCompletionTime]);

  const validateAntiSpam = useCallback(
    async (options?: {
      ip?: string;
    }): Promise<{ isValid: boolean; reason?: string; details?: any }> => {
      if (!enabled) return { isValid: true };

      return await antiSpamService.validate(sessionIdRef.current, {
        ip: options?.ip,
        formId,
        skipRateLimit,
      });
    },
    [enabled, formId, skipRateLimit]
  );

  const getCompletionTime = useCallback((): number => {
    const startTime = (antiSpamService as any).startTimes?.get(sessionIdRef.current);
    return startTime ? Date.now() - startTime : 0;
  }, []);

  const getStatistics = useCallback(() => {
    return antiSpamService.getStatistics();
  }, []);

  return {
    validateAntiSpam,
    getCompletionTime,
    getStatistics,
    sessionId: sessionIdRef.current,
  };
}
