import { useEffect, useState, useRef, useCallback } from "react";

interface UseInactivityRefreshProps {
  enabled: boolean;
  timeoutMinutes: number;
  onRefresh?: () => void;
}

export function useInactivityRefresh({
  enabled,
  timeoutMinutes,
  onRefresh,
}: UseInactivityRefreshProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetInactivityTimer = useCallback(() => {
    // Clear all existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    setShowWarning(false);
    setCountdown(10);

    if (!enabled || timeoutMinutes <= 0) return;

    // Convert minutes to milliseconds
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const warningMs = timeoutMs - 10000; // Show warning 10 seconds before refresh

    // Set warning timer (shows popup 10 seconds before refresh)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(10);

      // Start countdown
      let secondsLeft = 10;
      countdownTimerRef.current = setInterval(() => {
        secondsLeft--;
        setCountdown(secondsLeft);

        if (secondsLeft <= 0) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          handleRefresh();
        }
      }, 1000);
    }, warningMs);
  }, [enabled, timeoutMinutes]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  }, [onRefresh]);

  const handleContinue = useCallback(() => {
    setShowWarning(false);
    setCountdown(10);
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Track user activity
  useEffect(() => {
    if (!enabled || timeoutMinutes <= 0) return;

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      if (!showWarning) {
        resetInactivityTimer();
      }
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start initial timer
    resetInactivityTimer();

    return () => {
      // Cleanup
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });

      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [enabled, timeoutMinutes, showWarning, resetInactivityTimer]);

  return {
    showWarning,
    countdown,
    handleRefresh,
    handleContinue,
  };
}
