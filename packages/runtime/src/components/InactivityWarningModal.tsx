import React from "react";

interface InactivityWarningModalProps {
  countdown: number;
  onRefresh: () => void;
  onContinue: () => void;
}

export function InactivityWarningModal({
  countdown,
  onRefresh,
  onContinue,
}: InactivityWarningModalProps) {
  return (
    <div
      className="fr-inactivity-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
    >
      <div className="fr-inactivity-modal">
        <div className="fr-inactivity-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 6v6l4 2" />
          </svg>
        </div>

        <h2 id="inactivity-title" className="fr-inactivity-title">
          Are you still there?
        </h2>

        <p className="fr-inactivity-message">
          Due to inactivity, this form will refresh in <strong>{countdown}</strong> seconds.
        </p>

        <div className="fr-inactivity-actions">
          <button type="button" onClick={onContinue} className="fr-btn fr-btn-primary" autoFocus>
            Continue Filling
          </button>
          <button type="button" onClick={onRefresh} className="fr-btn fr-btn-secondary">
            Refresh Now
          </button>
        </div>

        <div className="fr-inactivity-progress">
          <div
            className="fr-inactivity-progress-bar"
            style={{
              width: `${(countdown / 10) * 100}%`,
              transition: "width 1s linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}
