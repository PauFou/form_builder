import React from "react";

interface SkemyaLogoProps {
  className?: string;
}

export function SkemyaLogo({ className = "" }: SkemyaLogoProps) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document outline */}
      <rect
        x="6"
        y="3"
        width="20"
        height="26"
        rx="2"
        fill="#4F46E5"
        stroke="#4F46E5"
        strokeWidth="2"
      />

      {/* Document lines */}
      <rect x="10" y="8" width="12" height="2" rx="1" fill="white" />
      <rect x="10" y="13" width="8" height="2" rx="1" fill="white" />
      <rect x="10" y="18" width="10" height="2" rx="1" fill="white" />
      <rect x="10" y="23" width="6" height="2" rx="1" fill="white" />

      {/* Checkbox */}
      <rect x="20" y="12" width="4" height="4" rx="0.5" fill="white" />
      <path
        d="M21 14 l0.5 0.5 l1.5 -1.5"
        stroke="#4F46E5"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
