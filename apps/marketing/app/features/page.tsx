"use client";

import React from "react";
import { Button } from "@skemya/ui";
import { Badge } from "@skemya/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@skemya/ui";
import { motion } from "framer-motion";
import {
  Check,
  X,
  Zap,
  Shield,
  Globe,
  Lock,
  ArrowRight,
  Star,
  TrendingUp,
  Users,
  BarChart3,
  FileText,
  Clock,
  CreditCard,
  Webhook,
  Activity,
  Sparkles,
  Calculator,
  Database,
  Settings,
  Brain,
  Layers,
  MousePointer,
  Eye,
  Code,
  ChevronRight,
  Download,
  Upload,
  Palette,
  Gauge,
  Server,
  Award,
} from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  const features = [
    {
      icon: MousePointer,
      title: "Visual Form Builder",
      description: "Drag-and-drop interface with real-time preview. No coding required.",
      details: [
        "20+ field types",
        "Real-time preview",
        "Intuitive drag-and-drop",
        "Template library",
      ],
    },
    {
      icon: Brain,
      title: "Advanced Logic",
      description: "Smart conditional logic, calculations, and dynamic outcomes.",
      details: [
        "If/then conditions",
        "Mathematical expressions",
        "Dynamic branching",
        "Score calculations",
      ],
    },
    {
      icon: Zap,
      title: "Lightning Performance",
      description: "Sub-30KB bundle size with <400ms P95 response times.",
      details: ["<30KB bundle", "<400ms P95", "Edge optimization", "Instant loading"],
    },
    {
      icon: Shield,
      title: "EU Data Residency",
      description: "100% EU hosting with GDPR compliance and DPA available.",
      details: ["EU-only storage", "GDPR compliant", "DPA available", "SOC 2 certified"],
    },
    {
      icon: Database,
      title: "Smart Integrations",
      description: "Native connections to your favorite tools with signed webhooks.",
      details: ["Google Sheets", "Slack & Teams", "Notion & Airtable", "HMAC webhooks"],
    },
    {
      icon: BarChart3,
      title: "Real-time Analytics",
      description: "Comprehensive insights with funnel analysis and drop-off detection.",
      details: [
        "Real-time dashboards",
        "Funnel analysis",
        "Drop-off insights",
        "Conversion tracking",
      ],
    },
    {
      icon: Lock,
      title: "Enterprise Security",
      description: "SSO, audit logs, and enterprise-grade security features.",
      details: ["SSO & SAML", "Audit logs", "Role-based access", "API security"],
    },
    {
      icon: Upload,
      title: "Import & Export",
      description: "Seamless migration from Typeform and Google Forms with parity reports.",
      details: ["Typeform import", "Google Forms import", "Parity reports", "Bulk export"],
    },
  ];

  const comparisons = [
    {
      feature: "Bundle size",
      skemya: "<30KB",
      typeform: "~180KB",
      advantage: "6x smaller",
    },
    {
      feature: "Load time (P95)",
      skemya: "<400ms",
      typeform: "~2.1s",
      advantage: "5x faster",
    },
    {
      feature: "EU data residency",
      skemya: "✓ Always",
      typeform: "✗ US-based",
      advantage: "GDPR native",
    },
    {
      feature: "Partial submissions",
      skemya: "✓ Included",
      typeform: "✗ Not available",
      advantage: "Zero data loss",
    },
    {
      feature: "Advanced logic",
      skemya: "✓ Visual graph",
      typeform: "Basic only",
      advantage: "More powerful",
    },
    {
      feature: "Google Forms import",
      skemya: "✓ Full support",
      typeform: "✗ Not available",
      advantage: "Easy migration",
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Aurora Background */}
      <div className="aurora-bg fixed inset-0 -z-10">
        <div className="aurora-blur-1" />
        <div className="aurora-blur-2" />
        <div className="aurora-pulse" />
      </div>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="container px-6 mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20" variant="outline">
              <Sparkles className="h-3 w-3 mr-1" />
              Everything you need
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Collect data{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                professionally
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Advanced form builder with EU hosting, lightning performance, and enterprise-grade
              features. The complete platform for modern data collection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="http://localhost:3001/auth/signup">
                <Button size="lg" className="group">
                  Try it free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="http://localhost:3001/demo">
                <Button size="lg" variant="outline">
                  Watch demo
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative z-10">
        <div className="container px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built for{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                modern teams
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to make data collection faster, more reliable, and more
              insightful.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover-lift bg-background/80 backdrop-blur-sm border-border/50">
                  <CardHeader className="pb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Deep Dive: Form Builder */}
      <section className="py-24 bg-muted/20 relative z-10">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Badge
                className="mb-4 bg-primary/10 text-primary border-primary/20"
                variant="outline"
              >
                Visual Builder
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Build forms like a{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  designer
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our intuitive drag-and-drop builder makes creating professional forms effortless.
                Real-time preview, smart validation, and beautiful templates get you started in
                seconds.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">20+ Field Types</h4>
                    <p className="text-sm text-muted-foreground">
                      From basic text to signatures and payments
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Smart Validation</h4>
                    <p className="text-sm text-muted-foreground">
                      Built-in validation with custom rules
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Real-time Preview</h4>
                    <p className="text-sm text-muted-foreground">
                      See changes instantly as you build
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Multi-step Forms</h4>
                    <p className="text-sm text-muted-foreground">
                      Organize complex forms into steps
                    </p>
                  </div>
                </div>
              </div>

              <Link href="http://localhost:3001/demo">
                <Button size="lg" className="group">
                  Try the builder
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl" />
              <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className="aspect-video bg-muted/20 flex items-center justify-center">
                  <span className="text-muted-foreground">Form Builder Interface</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Deep Dive: Performance */}
      <section className="py-24 relative z-10">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 blur-3xl" />
                <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
                  <div className="aspect-video bg-muted/20 flex items-center justify-center">
                    <span className="text-muted-foreground">Performance Metrics</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <Badge
                className="mb-4 bg-primary/10 text-primary border-primary/20"
                variant="outline"
              >
                Lightning Fast
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Speed that{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  converts
                </span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Every millisecond matters. Our optimized runtime delivers forms that load instantly,
                respond immediately, and work flawlessly on any device.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200">
                  <div className="text-2xl font-bold text-green-600 mb-1">&lt;30KB</div>
                  <div className="text-sm text-green-700">Bundle size</div>
                  <div className="text-xs text-green-600 mt-1">6x smaller than Typeform</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600 mb-1">&lt;400ms</div>
                  <div className="text-sm text-blue-700">P95 response</div>
                  <div className="text-xs text-blue-600 mt-1">5x faster loading</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600 mb-1">99.95%</div>
                  <div className="text-sm text-purple-700">Uptime SLA</div>
                  <div className="text-xs text-purple-600 mt-1">Enterprise grade</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600 mb-1">Edge</div>
                  <div className="text-sm text-orange-700">Global CDN</div>
                  <div className="text-xs text-orange-600 mt-1">150+ locations</div>
                </div>
              </div>

              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  View performance details
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-muted/20 relative z-10">
        <div className="container px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How we compare to{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                the competition
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See why teams choose Skemya for better performance, more features, and superior value.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="overflow-hidden bg-background/80 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold min-w-[140px]">
                        <div className="flex items-center justify-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          <span>Skemya</span>
                        </div>
                      </th>
                      <th className="text-center p-4 font-semibold min-w-[140px]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-[#262626]" />
                          <span>Typeform</span>
                        </div>
                      </th>
                      <th className="text-center p-4 font-semibold min-w-[140px]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-[#4285f4]" />
                          <span>Google Forms</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {comparisons.map((comparison, index) => (
                      <tr
                        key={comparison.feature}
                        className={index % 2 === 0 ? "bg-background/50" : ""}
                      >
                        <td className="p-4 font-medium">{comparison.feature}</td>
                        <td className="p-4 text-center">
                          <div className="font-bold text-green-600">{comparison.skemya}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="text-muted-foreground">{comparison.typeform}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="text-muted-foreground">Basic</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-t">
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-800 mb-2">
                    Better performance, more features, lower cost
                  </p>
                  <p className="text-sm text-green-700 mb-4">
                    Plus EU data residency and enterprise-grade security built-in
                  </p>
                  <Link href="http://localhost:3001/auth/signup">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700">
                      Start building forms
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-24 relative z-10">
        <div className="container px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Enterprise-grade{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                security
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your data is protected with industry-leading security standards and EU residency by
              default.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Globe,
                title: "EU Data Residency",
                description:
                  "All data stored exclusively in EU data centers with GDPR compliance built-in.",
                features: [
                  "100% EU hosting",
                  "GDPR compliant",
                  "DPA available",
                  "No data transfers",
                ],
              },
              {
                icon: Lock,
                title: "Advanced Security",
                description:
                  "Enterprise security features including SSO, audit logs, and encryption.",
                features: ["SSO & SAML", "256-bit encryption", "Audit logs", "Role-based access"],
              },
              {
                icon: Award,
                title: "Certifications",
                description: "Industry-standard certifications and compliance frameworks.",
                features: ["SOC 2 Type II", "ISO 27001", "GDPR certified", "99.95% SLA"],
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover-lift bg-background/80 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <p className="text-muted-foreground">{item.description}</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {item.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary to-accent relative z-10">
        <div className="container px-6 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to experience the difference?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join thousands of teams building better forms with Skemya. Start free, no credit card
              required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="http://localhost:3001/auth/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="group bg-white text-primary hover:bg-white/90"
                >
                  Start building forms
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/templates">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:text-white/90 hover:bg-white/20 border-white/30 border"
                >
                  Browse templates
                </Button>
              </Link>
            </div>
            <p className="text-sm text-white/70 mt-6">
              Free forever plan • No credit card required • Start in 2 minutes
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
