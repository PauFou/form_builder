import React, { useState, useEffect } from "react";

interface SaveStatusProps {
  isSaving: boolean;
  hasUnsyncedData: boolean;
  isOnline: boolean;
  resumeUrl: string | null;
  lastSaveTime?: Date;
  className?: string;
}

export function SaveStatus({
  isSaving,
  hasUnsyncedData,
  isOnline,
  resumeUrl,
  lastSaveTime,
  className = "",
}: SaveStatusProps) {
  const [showResumeLink, setShowResumeLink] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleCopyLink = async () => {
    if (resumeUrl && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(resumeUrl);
        setCopied(true);
      } catch (error) {
        console.error("Failed to copy link:", error);
      }
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return "Offline - data saved locally";
    }
    if (isSaving) {
      return "Saving...";
    }
    if (hasUnsyncedData) {
      return "Changes saved locally";
    }
    if (lastSaveTime) {
      const timeSince = Date.now() - lastSaveTime.getTime();
      if (timeSince < 5000) {
        return "Saved";
      }
      if (timeSince < 60000) {
        return `Saved ${Math.floor(timeSince / 1000)}s ago`;
      }
      return `Saved ${Math.floor(timeSince / 60000)}m ago`;
    }
    return "All changes saved";
  };

  const getStatusColor = () => {
    if (!isOnline || hasUnsyncedData) {
      return "#F59E0B"; // Amber
    }
    if (isSaving) {
      return "#6B7280"; // Gray
    }
    return "#10B981"; // Green
  };

  return (
    <div className={`save-status ${className}`}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
          color: "#6B7280",
        }}
      >
        {/* Status indicator */}
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: getStatusColor(),
            transition: "background-color 0.3s ease",
          }}
        />

        {/* Status text */}
        <span>{getStatusText()}</span>

        {/* Resume link button */}
        {resumeUrl && (
          <button
            type="button"
            onClick={() => setShowResumeLink(!showResumeLink)}
            style={{
              marginLeft: "8px",
              padding: "2px 8px",
              fontSize: "12px",
              color: "#4F46E5",
              background: "transparent",
              border: "1px solid #E5E7EB",
              borderRadius: "4px",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#F3F4F6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Resume link
          </button>
        )}
      </div>

      {/* Resume link dropdown */}
      {showResumeLink && resumeUrl && (
        <div
          style={{
            marginTop: "8px",
            padding: "12px",
            backgroundColor: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: "6px",
            fontSize: "13px",
          }}
        >
          <div style={{ marginBottom: "8px", color: "#6B7280" }}>
            Save this link to continue where you left off:
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              value={resumeUrl}
              readOnly
              style={{
                flex: 1,
                padding: "6px 10px",
                border: "1px solid #D1D5DB",
                borderRadius: "4px",
                fontSize: "12px",
                backgroundColor: "white",
                color: "#374151",
              }}
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                padding: "6px 12px",
                backgroundColor: copied ? "#10B981" : "#4F46E5",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
