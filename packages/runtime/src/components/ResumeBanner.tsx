import React from "react";

interface ResumeBannerProps {
  onResume: () => void;
  onStartFresh: () => void;
  lastUpdated?: Date;
  progress?: number;
}

export function ResumeBanner({
  onResume,
  onStartFresh,
  lastUpdated,
  progress = 0,
}: ResumeBannerProps) {
  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      style={{
        backgroundColor: "#EEF2FF",
        border: "1px solid #C7D2FE",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
        >
          <path
            d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2Z"
            stroke="#4F46E5"
            strokeWidth="1.5"
          />
          <path
            d="M10 6V10L13 13"
            stroke="#4F46E5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 500, color: "#1F2937", marginBottom: "4px" }}>
            Welcome back! You have an incomplete form
          </div>
          <div style={{ fontSize: "14px", color: "#6B7280" }}>
            {lastUpdated && `Last saved ${getTimeAgo(lastUpdated)} • `}
            {progress > 0 && `${Math.round(progress)}% complete`}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {progress > 0 && (
        <div
          style={{
            height: "4px",
            backgroundColor: "#E5E7EB",
            borderRadius: "2px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: "#4F46E5",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "12px" }}>
        <button
          type="button"
          onClick={onResume}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4F46E5",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "background-color 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#4338CA";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#4F46E5";
          }}
        >
          Continue where you left off
        </button>
        <button
          type="button"
          onClick={onStartFresh}
          style={{
            padding: "8px 16px",
            backgroundColor: "transparent",
            color: "#6B7280",
            border: "1px solid #E5E7EB",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#F9FAFB";
            e.currentTarget.style.borderColor = "#D1D5DB";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "#E5E7EB";
          }}
        >
          Start fresh
        </button>
      </div>
    </div>
  );
}