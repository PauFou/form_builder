"use client";

// DEMO NAVIGATION HUB - Centre de Navigation pour Toutes les Démos
// Page centrale pour accéder à toutes les versions de démos créées

import { motion } from "framer-motion";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@skemya/ui";
import {
  ExternalLink,
  Sparkles,
  Zap,
  Crown,
  Palette,
  Brain,
  User,
  Lock,
  FileText,
  BarChart3,
  Layers,
  Code,
  Rocket,
  Star,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface DemoSection {
  title: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
  demos: {
    title: string;
    description: string;
    url: string;
    level: "Basic" | "Premium" | "Ultimate";
    features: string[];
  }[];
}

const demoSections: DemoSection[] = [
  {
    title: "Marketing Landing Pages",
    description: "Différentes versions de la page d'accueil marketing",
    icon: Rocket,
    gradient: "from-blue-500 to-cyan-400",
    demos: [
      {
        title: "Landing V1 - Actuelle",
        description: "Version actuelle avec header et navigation",
        url: "http://localhost:3300/demo/landing/1",
        level: "Basic",
        features: ["Aurora Background", "Basic Animations", "CTA Buttons"],
      },
      {
        title: "Landing V2 - Améliorée",
        description: "Version avec animations avancées et boutons modernes",
        url: "http://localhost:3300/demo/landing/2",
        level: "Premium",
        features: ["Advanced Animations", "Enhanced Buttons", "Interactive Stats"],
      },
      {
        title: "Landing V3 - Ultra-Moderne",
        description: "Version interactive avec effets 3D et curseur magique",
        url: "http://localhost:3300/demo/landing/3",
        level: "Ultimate",
        features: ["3D Effects", "Custom Cursor", "Interactive Elements", "Neural Patterns"],
      },
    ],
  },
  {
    title: "Forms Dashboard",
    description: "Différentes versions de la page de gestion des formulaires",
    icon: FileText,
    gradient: "from-emerald-500 to-teal-400",
    demos: [
      {
        title: "Forms V1 - Dashboard Stats",
        description: "Version avancée restaurée avec statistiques complètes",
        url: "/demo/forms/1",
        level: "Basic",
        features: ["Dashboard Stats", "Form Cards", "Basic Filtering"],
      },
      {
        title: "Forms V2 - Interface Premium",
        description: "Version premium avec animations fluides et design moderne",
        url: "/demo/forms/2",
        level: "Premium",
        features: ["Enhanced Cards", "Premium Stats", "Advanced Filtering", "Smooth Animations"],
      },
      {
        title: "Forms V3 - IA Futuriste",
        description: "Version ultra-futuriste avec IA et interactions neurales",
        url: "/demo/forms/3",
        level: "Ultimate",
        features: ["AI Insights", "Neural Network", "3D Cards", "Predictive Analytics"],
      },
    ],
  },
  {
    title: "Authentication Pages",
    description: "Différentes versions des pages de connexion et inscription",
    icon: Lock,
    gradient: "from-purple-500 to-pink-400",
    demos: [
      {
        title: "Login V1 - Aurora",
        description: "Version de base avec background aurora et dev helper",
        url: "/demo/auth/login/1",
        level: "Basic",
        features: ["Aurora Background", "Dev Helper", "Basic Form"],
      },
      {
        title: "Login V2 - Premium",
        description: "Version premium avec micro-interactions avancées",
        url: "/demo/auth/login/2",
        level: "Premium",
        features: ["Micro-interactions", "Enhanced Animations", "Smart Validation"],
      },
      {
        title: "Login V3 - Neural",
        description: "Version ultra-futuriste avec IA et biométrie",
        url: "/demo/auth/login/3",
        level: "Ultimate",
        features: ["AI Authentication", "Biometric", "3D Effects", "Neural Interface"],
      },
      {
        title: "Signup V1 - Multi-étapes",
        description: "Version sophistiquée avec étapes guidées",
        url: "/demo/auth/signup/1",
        level: "Premium",
        features: ["Multi-step Process", "Real-time Validation", "Premium Onboarding"],
      },
    ],
  },
  {
    title: "Form Builders",
    description: "Différentes versions de l'interface de construction de formulaires",
    icon: Layers,
    gradient: "from-orange-500 to-red-400",
    demos: [
      {
        title: "Builder Enhanced",
        description: "Version avec drag & drop avancé et effets aurora",
        url: "/demo/builder/enhanced",
        level: "Premium",
        features: ["Advanced Drag & Drop", "Aurora Effects", "Block Library", "Live Preview"],
      },
      {
        title: "Builder Clean",
        description: "Version minimaliste avec interface épurée",
        url: "/demo/builder/clean",
        level: "Basic",
        features: ["Clean Interface", "Essential Features", "Minimal Design"],
      },
      {
        title: "Builder Professional",
        description: "Version enterprise avec fonctionnalités avancées",
        url: "/demo/builder/professional",
        level: "Ultimate",
        features: ["Enterprise Features", "Advanced Logic", "Professional UI", "Analytics"],
      },
    ],
  },
];

const getLevelBadge = (level: string) => {
  switch (level) {
    case "Basic":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "Premium":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Ultimate":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const getLevelIcon = (level: string) => {
  switch (level) {
    case "Basic":
      return <Zap className="h-3 w-3" />;
    case "Premium":
      return <Sparkles className="h-3 w-3" />;
    case "Ultimate":
      return <Crown className="h-3 w-3" />;
    default:
      return <Zap className="h-3 w-3" />;
  }
};

export default function DemoNavigationHub() {
  return (
    <>
      {/* Demo Header */}
      <div className="fixed top-0 w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white z-50 p-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <Brain className="h-5 w-5" />
          <span className="text-lg font-bold">
            🎯 CENTRE DE NAVIGATION DÉMO - Toutes les Versions Disponibles
          </span>
          <Brain className="h-5 w-5" />
        </div>
      </div>

      <div style={{ paddingTop: "60px" }}>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/30 py-16">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="flex items-center justify-center gap-4 mb-8">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl"
                >
                  <Star className="h-8 w-8 text-white" />
                </motion.div>
                <h1 className="text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Demo Center
                </h1>
              </div>

              <p className="text-2xl text-gray-600 font-medium mb-8">
                Comparez toutes les versions pour identifier les versions ultimes à conserver
              </p>

              <div className="flex items-center justify-center gap-6 text-lg">
                <div className="flex items-center gap-2 text-blue-600">
                  <FileText className="h-5 w-5" />
                  <span>
                    {demoSections.reduce((acc, section) => acc + section.demos.length, 0)} versions
                    créées
                  </span>
                </div>
                <div className="flex items-center gap-2 text-emerald-600">
                  <BarChart3 className="h-5 w-5" />
                  <span>{demoSections.length} catégories</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Demo Sections */}
        <div className="py-16">
          <div className="container mx-auto px-6">
            <div className="space-y-16">
              {demoSections.map((section, sectionIndex) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: sectionIndex * 0.2 }}
                >
                  {/* Section Header */}
                  <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${section.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
                      >
                        <section.icon className="h-6 w-6 text-white" />
                      </div>
                      <h2 className="text-3xl font-black text-gray-900">{section.title}</h2>
                    </div>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">{section.description}</p>
                  </div>

                  {/* Demo Cards */}
                  <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                    {section.demos.map((demo, demoIndex) => (
                      <motion.div
                        key={demo.title}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: sectionIndex * 0.1 + demoIndex * 0.1 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="group"
                      >
                        <Card className="h-full border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-b from-white to-gray-50/80 relative overflow-hidden">
                          {/* Shimmer effect */}
                          <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                          <CardHeader className="relative z-10">
                            <div className="flex items-start justify-between mb-3">
                              <div
                                className={`px-3 py-1 rounded-full text-sm font-bold border ${getLevelBadge(demo.level)} flex items-center gap-1`}
                              >
                                {getLevelIcon(demo.level)}
                                {demo.level}
                              </div>
                            </div>

                            <CardTitle className="text-xl font-bold group-hover:text-blue-600 transition-colors">
                              {demo.title}
                            </CardTitle>
                            <CardDescription className="text-gray-600 leading-relaxed">
                              {demo.description}
                            </CardDescription>
                          </CardHeader>

                          <CardContent className="pt-0 relative z-10">
                            <div className="space-y-4">
                              {/* Features */}
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-gray-700">
                                  Fonctionnalités clés:
                                </h4>
                                <div className="flex flex-wrap gap-1">
                                  {demo.features.map((feature, featureIndex) => (
                                    <motion.span
                                      key={feature}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{
                                        delay:
                                          sectionIndex * 0.1 +
                                          demoIndex * 0.1 +
                                          featureIndex * 0.05,
                                      }}
                                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-100"
                                    >
                                      {feature}
                                    </motion.span>
                                  ))}
                                </div>
                              </div>

                              {/* Demo Link */}
                              <Link href={demo.url} target="_blank" className="block">
                                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white group/btn relative overflow-hidden">
                                  <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/20"
                                    animate={{ x: [-100, 100] }}
                                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                                  />
                                  <ExternalLink className="h-4 w-4 mr-2 relative z-10" />
                                  <span className="relative z-10">Voir la démo</span>
                                  <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover/btn:opacity-100 group-hover/btn:translate-x-1 transition-all relative z-10" />
                                </Button>
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 py-12">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-white"
            >
              <h3 className="text-2xl font-bold mb-4">🎯 Instructions</h3>
              <div className="max-w-3xl mx-auto space-y-4 text-lg">
                <p>
                  <strong>1.</strong> Parcourez toutes les démos en cliquant sur les boutons "Voir
                  la démo"
                </p>
                <p>
                  <strong>2.</strong> Identifiez les versions que vous préférez pour chaque
                  catégorie
                </p>
                <p>
                  <strong>3.</strong> Notez-moi quelles sont les versions "ultimes" à conserver
                </p>
                <p>
                  <strong>4.</strong> Je supprimerai les autres versions et garderai seulement les
                  bonnes
                </p>
              </div>

              <div className="mt-8 p-4 bg-white/10 rounded-2xl backdrop-blur-sm inline-block">
                <div className="flex items-center gap-3">
                  <Brain className="h-6 w-6" />
                  <span className="text-xl font-bold">
                    Total: {demoSections.reduce((acc, section) => acc + section.demos.length, 0)}{" "}
                    versions à tester
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
