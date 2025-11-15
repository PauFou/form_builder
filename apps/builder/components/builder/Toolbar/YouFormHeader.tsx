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
    <header className="w-full bg-white/60 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-20 py-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/forms" className="flex-shrink-0 group">
          <div className="flex items-center gap-3">
            {/* Logo icon - modern gradient */}
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            {/* YOUFORM text */}
            <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent tracking-tight">
              YOUFORM
            </span>
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
          {/* Log In Button - Modern Yellow */}
          <button
            onClick={() => router.push("/login")}
            className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Log In
          </button>

          {/* Sign Up Button - Modern Teal */}
          <button
            onClick={() => router.push("/signup")}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}
