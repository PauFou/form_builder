"use client";

import React from "react";

export default function LandingDemo3() {
  return (
    <div>
      <div className="fixed top-0 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white z-50 p-2 text-center text-sm font-semibold">
        ✨ DEMO 3: Landing Interactive Ultra-Moderne avec Effets 3D et Curseur Magique
      </div>

      <div style={{ paddingTop: "40px" }}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.5) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* Animated Dots */}
          <div className="absolute top-20 left-20 w-4 h-4 bg-blue-400 rounded-full animate-pulse" />
          <div className="absolute top-32 right-32 w-3 h-3 bg-purple-400 rounded-full animate-bounce" />
          <div className="absolute bottom-40 left-40 w-5 h-5 bg-pink-400 rounded-full animate-ping" />
          <div className="absolute bottom-20 right-20 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />

          <div className="relative z-10 container mx-auto px-6 py-24">
            <div className="max-w-6xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-purple-500/20 border border-purple-400/40 backdrop-blur-md font-bold text-lg mb-12 shadow-lg">
                <span className="text-2xl animate-spin">⭐</span>
                #1 Interactive Form Builder in Europe
                <span className="text-2xl animate-pulse">✨</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-7xl md:text-9xl font-black mb-12 leading-none">
                <span className="hover:scale-105 inline-block transition-transform cursor-pointer">
                  Build
                </span>{" "}
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent hover:scale-110 inline-block transition-transform cursor-pointer">
                  forms
                </span>
                <br />
                <span className="hover:scale-105 inline-block transition-transform cursor-pointer">
                  Ship{" "}
                </span>
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent hover:scale-110 inline-block transition-transform cursor-pointer">
                  answers
                </span>
                <span className="inline-block ml-6 text-6xl animate-bounce">🚀</span>
              </h1>

              {/* Subheading */}
              <p className="text-2xl md:text-3xl text-blue-100 mb-10 max-w-4xl mx-auto leading-relaxed font-medium">
                The most{" "}
                <span className="text-blue-400 font-bold hover:text-blue-300 cursor-pointer transition-colors">
                  advanced
                </span>{" "}
                form builder with{" "}
                <span className="text-purple-400 font-bold hover:text-purple-300 cursor-pointer transition-colors">
                  AI-powered
                </span>{" "}
                logic, real-time collaboration, and lightning-fast performance.
              </p>

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 mb-16 text-lg font-bold">
                <div className="flex items-center gap-2 text-blue-400 hover:scale-110 transition-transform cursor-pointer">
                  <span>👥</span> 50k+ users
                </div>
                <div className="flex items-center gap-2 text-green-400 hover:scale-110 transition-transform cursor-pointer">
                  <span>📈</span> 99.99% uptime
                </div>
                <div className="flex items-center gap-2 text-yellow-400 hover:scale-110 transition-transform cursor-pointer">
                  <span>⚡</span> &lt;200ms response
                </div>
                <div className="flex items-center gap-2 text-purple-400 hover:scale-110 transition-transform cursor-pointer">
                  <span>🛡️</span> SOC2 certified
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
                <button className="text-2xl px-12 py-8 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all relative overflow-hidden group">
                  <span className="relative z-10 flex items-center gap-3">
                    ✨ Start building magic 🚀
                  </span>
                </button>

                <button className="text-2xl px-12 py-8 rounded-2xl border-2 border-purple-500/50 hover:border-purple-400 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white hover:scale-105 hover:-translate-y-2 transition-all font-bold">
                  <span className="flex items-center gap-3">▶️ Experience the future</span>
                </button>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <section className="py-20 bg-black/20 backdrop-blur-sm">
            <div className="container px-6 mx-auto relative z-10">
              <div className="text-center mb-16">
                <h2 className="text-5xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Superpowers included
                </h2>
                <p className="text-xl text-blue-100 max-w-3xl mx-auto">
                  Every feature you need to build, deploy, and scale forms that convert
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-blue-400/50 hover:scale-105 hover:-translate-y-2 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all">
                    <span className="text-2xl">💻</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-blue-400 transition-colors">
                    No-Code Builder
                  </h3>
                  <p className="text-blue-100 leading-relaxed">
                    Drag, drop, customize. Build complex forms without writing code.
                  </p>
                </div>

                <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-purple-400/50 hover:scale-105 hover:-translate-y-2 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-400 transition-colors">
                    Smart Analytics
                  </h3>
                  <p className="text-blue-100 leading-relaxed">
                    Real-time insights with AI-powered recommendations.
                  </p>
                </div>

                <div className="text-center p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hover:border-green-400/50 hover:scale-105 hover:-translate-y-2 transition-all cursor-pointer group">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 group-hover:text-green-400 transition-colors">
                    1000+ Integrations
                  </h3>
                  <p className="text-blue-100 leading-relaxed">
                    Connect with every tool in your stack instantly.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
