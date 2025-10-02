"use client";

import React from "react";

interface AuroraBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function AuroraBackground({ children, className = "" }: AuroraBackgroundProps) {
  return (
    <div className={`relative ${className}`} style={{
      background: "linear-gradient(135deg, hsl(231, 100%, 60%, 0.08), hsl(192, 95%, 43%, 0.05))"
    }}>
      {/* Aurora Background Effects - Made visible with proper z-index */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
        <div className="absolute top-0 -left-48 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl animate-pulse" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}