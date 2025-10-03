"use client";

import React from "react";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface ModernBadgeProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: "default" | "primary" | "accent" | "success";
  className?: string;
  animate?: boolean;
}

export function ModernBadge({
  children,
  icon: Icon,
  variant = "default",
  className = "",
  animate = true,
}: ModernBadgeProps) {
  const baseClasses =
    "inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border text-sm font-medium transition-all duration-200";

  const variantClasses = {
    default: "bg-muted/50 border-border/50 text-muted-foreground",
    primary: "bg-primary/10 border-primary/30 text-primary",
    accent: "bg-accent/10 border-accent/30 text-accent",
    success: "bg-green-500/10 border-green-500/30 text-green-600",
  };

  const BadgeContent = (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {Icon && <Icon className="h-4 w-4" />}
      <span>{children}</span>
    </div>
  );

  if (!animate) {
    return BadgeContent;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {BadgeContent}
    </motion.div>
  );
}
