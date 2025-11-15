"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface YouFormHeaderProps {
  showNavigation?: boolean;
}

/**
 * YouForm-style header with exact styling
 * Based on analysis of https://youform.com header
 */
export function YouFormHeader({ showNavigation = false }: YouFormHeaderProps) {
  const router = useRouter();

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/forms" className="flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Logo icon - simple indigo */}
            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            {/* Text */}
            <span className="text-lg font-semibold text-gray-900">Forms</span>
          </div>
        </Link>

        {/* Center Navigation (optional - shown on homepage) */}
        {showNavigation && (
          <nav className="flex items-center gap-6">
            <Link
              href="/forms"
              className="px-2 py-2 text-base font-semibold text-black hover:bg-gray-100 rounded-md transition-colors"
            >
              Home
            </Link>
            <Link
              href="/templates"
              className="px-2 py-2 text-base font-semibold text-black hover:bg-gray-100 rounded-md transition-colors"
            >
              Templates
            </Link>
            <Link
              href="/pricing"
              className="px-2 py-2 text-base font-semibold text-black hover:bg-gray-100 rounded-md transition-colors"
            >
              Pricing
            </Link>
          </nav>
        )}

        {/* Right Section - Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Settings/Profile */}
          <button className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            Settings
          </button>

          {/* Upgrade Button */}
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">
            Upgrade
          </button>
        </div>
      </div>
    </header>
  );
}
