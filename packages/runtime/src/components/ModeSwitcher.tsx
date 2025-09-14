import React from "react";

interface ModeSwitcherProps {
  currentMode: "one-question" | "grid";
  onModeChange: (mode: "one-question" | "grid") => void;
  disabled?: boolean;
}

export function ModeSwitcher({ currentMode, onModeChange, disabled = false }: ModeSwitcherProps) {
  return (
    <div className="fr-mode-switcher" role="group" aria-label="Display mode">
      <button
        type="button"
        className={`fr-mode-btn ${currentMode === "one-question" ? "fr-mode-btn-active" : ""}`}
        onClick={() => onModeChange("one-question")}
        disabled={disabled}
        aria-pressed={currentMode === "one-question"}
        aria-label="One question at a time mode"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <rect x="6" y="8" width="8" height="1" fill="currentColor" />
          <rect x="6" y="11" width="8" height="1" fill="currentColor" />
        </svg>
        <span>One at a time</span>
      </button>

      <button
        type="button"
        className={`fr-mode-btn ${currentMode === "grid" ? "fr-mode-btn-active" : ""}`}
        onClick={() => onModeChange("grid")}
        disabled={disabled}
        aria-pressed={currentMode === "grid"}
        aria-label="Grid mode - show all questions"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
          <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
          <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
          <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2" />
        </svg>
        <span>Grid view</span>
      </button>
    </div>
  );
}
