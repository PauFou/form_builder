"use client";

// DEMO VERSION 2 - Landing Page avec Animations Avancées et Nouveaux Boutons
// Version hypothétiquement améliorée avec plus d'animations et boutons modernes

import React from "react";
import { Button } from "@skemya/ui";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Check,
  FileText,
  BarChart3,
  Webhook,
  Lock,
  Globe,
  Play,
  Star,
  Users,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function LandingDemo2() {
  return (
    <>
      {/* Demo Header */}
      <div className="fixed top-0 w-full bg-blue-500 text-white z-50 p-2 text-center text-sm">
        🚀 DEMO 2: Landing avec Animations Avancées et Boutons Modernes
      </div>
      
      <div style={{ paddingTop: "40px" }}>
        <div className="flex min-h-screen flex-col">
          {/* Hero Section */}
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Enhanced Aurora Background */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/15 to-background" />
              <motion.div 
                animate={{ 
                  x: [-200, 200, -200],
                  y: [-100, 100, -100],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 -left-48 h-96 w-96 rounded-full bg-primary/40 blur-3xl" 
              />
              <motion.div 
                animate={{ 
                  x: [200, -200, 200],
                  y: [100, -100, 100],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent/40 blur-3xl" 
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-gradient-to-r from-primary/30 to-accent/30 blur-3xl" 
              />
            </div>

            {/* Content */}
            <div className="container relative z-10 px-6 py-24 mx-auto">
              <div className="max-w-5xl mx-auto text-center">
                {/* Enhanced Badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 backdrop-blur-sm text-primary font-semibold text-base mb-10 shadow-lg"
                >
                  <Star className="w-5 h-5 text-yellow-500" />
                  #1 EU-hosted alternative to Typeform
                  <Sparkles className="w-5 h-5" />
                </motion.div>

                {/* Enhanced Main Heading */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="text-6xl md:text-8xl font-black mb-10 tracking-tight leading-tight"
                >
                  Build forms.{" "}
                  <motion.span 
                    className="bg-gradient-to-r from-primary via-accent to-purple-500 bg-clip-text text-transparent"
                    animate={{ 
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                    style={{ backgroundSize: "200% 200%" }}
                  >
                    Ship answers.
                  </motion.span>
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    className="inline-block ml-4"
                  >
                    🚀
                  </motion.span>
                </motion.h1>

                {/* Enhanced Subheading */}
                <motion.p
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-2xl md:text-3xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed font-medium"
                >
                  Create <span className="text-primary font-semibold">beautiful</span>, 
                  <span className="text-accent font-semibold"> blazing-fast</span> forms with advanced logic, 
                  EU data residency, and powerful integrations.
                </motion.p>

                {/* Stats Row */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="flex flex-wrap justify-center gap-8 mb-12 text-sm font-semibold"
                >
                  <div className="flex items-center gap-2 text-primary">
                    <Users className="w-4 h-4" />
                    10k+ users
                  </div>
                  <div className="flex items-center gap-2 text-accent">
                    <TrendingUp className="w-4 h-4" />
                    99.9% uptime
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Shield className="w-4 h-4" />
                    GDPR compliant
                  </div>
                </motion.div>

                {/* Enhanced CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20"
                >
                  <Link href="http://localhost:3301">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        size="lg" 
                        className="text-xl px-12 py-8 rounded-2xl shadow-2xl hover:shadow-3xl transition-all bg-gradient-to-r from-primary to-accent border-0 relative overflow-hidden group"
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/20"
                          animate={{ x: [-100, 300] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        />
                        <Sparkles className="mr-3 w-6 h-6" />
                        Start building free
                        <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/demo">
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outline" 
                        size="lg" 
                        className="text-xl px-12 py-8 rounded-2xl border-2 border-primary/30 hover:border-primary/50 backdrop-blur-sm bg-background/50 hover:bg-background/80 transition-all"
                      >
                        <Play className="mr-3 w-6 h-6" />
                        Watch demo
                      </Button>
                    </motion.div>
                  </Link>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Enhanced Features Grid */}
          <section className="py-32 bg-gradient-to-b from-muted/30 to-background">
            <div className="container px-6 mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-20"
              >
                <h2 className="text-4xl md:text-5xl font-bold mb-6">Why developers choose us</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Built for performance, designed for scale, optimized for conversion
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                {[
                  {
                    icon: Zap,
                    title: "Lightning Fast",
                    description: "Sub-30KB bundle with <400ms response times. Built for speed from the ground up.",
                    gradient: "from-yellow-500 to-orange-500"
                  },
                  {
                    icon: Shield,
                    title: "EU Hosted",
                    description: "100% EU data residency with GDPR compliance. Your data never leaves Europe.",
                    gradient: "from-blue-500 to-purple-500"
                  },
                  {
                    icon: Webhook,
                    title: "Smart Integrations",
                    description: "Native connections with signed webhooks. Connect to 100+ tools instantly.",
                    gradient: "from-green-500 to-teal-500"
                  }
                ].map((feature, index) => (
                  <motion.div 
                    key={feature.title}
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center p-8 rounded-3xl bg-background/50 backdrop-blur-sm border border-border/50 hover:border-border shadow-lg hover:shadow-xl transition-all"
                  >
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className={`w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}
                    >
                      <feature.icon className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}