"use client";

import React, { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@skemya/ui";

interface LinkSettingsProps {
  formId: string;
}

export function LinkSettings({ formId }: LinkSettingsProps) {
  const [title, setTitle] = useState("My Form");
  const [description, setDescription] = useState("Fill out my Youform");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">Link Settings</h2>
        <Button variant="youform-primary" size="youform-default">
          Save
        </Button>
      </div>

      <p className="text-sm text-gray-600">
        Setup how your forms will appear in social media like Facebook, X etc.
      </p>

      <div className="grid grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Max characters 60.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">Max characters 110.</p>
          </div>

          {/* Social Preview Image */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">Social Preview Image</label>
              <span className="px-2 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded tracking-wide">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
              >
                Choisir un fichier
              </button>
              <span className="text-sm text-gray-500">Aucun fichier choisi</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recommended size 1200x630. Should be less than 5MB.
            </p>
          </div>

          {/* Favicon */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">Favicon</label>
              <span className="px-2 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded tracking-wide">
                PRO
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled
                className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-md bg-gray-100 text-gray-400 cursor-not-allowed"
              >
                Choisir un fichier
              </button>
              <span className="text-sm text-gray-500">Aucun fichier choisi</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recommended size 60x60. Ideally .ico or .png image.
            </p>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">Preview</h3>
          </div>

          {/* Social Preview Card */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Top decoration */}
            <svg viewBox="0 0 400 20" className="w-full h-5" preserveAspectRatio="none">
              <path
                d="M0,10 Q10,0 20,10 T40,10 T60,10 T80,10 T100,10 T120,10 T140,10 T160,10 T180,10 T200,10 T220,10 T240,10 T260,10 T280,10 T300,10 T320,10 T340,10 T360,10 T380,10 T400,10 L400,20 L0,20 Z"
                fill="#f472b6"
              />
            </svg>

            {/* Content */}
            <div
              className="p-8 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 50%, #dbeafe 100%)",
              }}
            >
              {/* Decorative elements */}
              <div className="absolute top-4 left-4 w-16 h-16 bg-yellow-300 rounded-full opacity-80" />
              <div className="absolute bottom-4 right-4 w-12 h-12 bg-yellow-400 rounded-full opacity-80" />
              <div className="absolute top-1/2 left-8 text-4xl opacity-60">⭐</div>
              <div className="absolute top-1/4 right-12 w-8 h-8 bg-orange-300 rounded-full opacity-60" />

              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-lg mb-4 mx-auto flex items-center justify-center shadow-lg">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                  {title.toUpperCase().substring(0, 30)}
                </h4>
                <button className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-md shadow-md transition-colors">
                  Let's Go
                </button>
              </div>
            </div>

            {/* Bottom decoration */}
            <svg viewBox="0 0 400 20" className="w-full h-5" preserveAspectRatio="none">
              <path
                d="M0,0 L0,10 Q10,20 20,10 T40,10 T60,10 T80,10 T100,10 T120,10 T140,10 T160,10 T180,10 T200,10 T220,10 T240,10 T260,10 T280,10 T300,10 T320,10 T340,10 T360,10 T380,10 T400,10 L400,0 Z"
                fill="#fbbf24"
              />
            </svg>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">YOUFORM.COM</p>
              <h5 className="text-base font-semibold text-gray-900 mb-1">{title}</h5>
              <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 text-center pt-4">
        Looking for custom domain setup?{" "}
        <a
          href={`/form/${formId}/share`}
          className="text-blue-600 hover:text-blue-700 underline font-medium"
        >
          Go here →
        </a>
      </p>
    </div>
  );
}
