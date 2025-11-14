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
    <header className="w-full bg-transparent">
      <div className="max-w-[1200px] mx-auto px-20 py-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/forms" className="flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Logo icon - orange form icon */}
            <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
              <svg
                width="20"
                height="20"
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
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            {/* YOUFORM text */}
            <span className="text-xl font-bold text-black tracking-tight">
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
        <div className="flex items-center gap-4">
          {/* Log In Button - Bright Yellow */}
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 text-base font-normal text-black bg-[#FFE711] border-2 border-black rounded-md hover:bg-[#FFD700] transition-colors"
          >
            Log In
          </button>

          {/* Sign Up Button - Teal */}
          <button
            onClick={() => router.push("/signup")}
            className="px-6 py-2 text-base font-normal text-black bg-[#45AD94] border-2 border-black rounded-md hover:bg-[#3D9A82] transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}
