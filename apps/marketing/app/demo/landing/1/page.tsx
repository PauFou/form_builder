"use client";

import React from "react";

export default function LandingDemo1() {
  return (
    <div>
      <div className="fixed top-0 w-full bg-red-500 text-white z-50 p-2 text-center text-sm">
        🎯 DEMO 1: Landing Page Actuelle avec Header et Navigation
      </div>

      <div style={{ paddingTop: "40px" }}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h1 className="text-6xl font-bold mb-8">
              Build forms. <span className="text-blue-600">Ship answers.</span>
            </h1>

            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Create beautiful, blazing-fast forms with advanced logic, EU data residency, and
              powerful integrations.
            </p>

            <div className="flex gap-4 justify-center">
              <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors">
                Start building free
              </button>
              <button className="border border-gray-300 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors">
                View demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
