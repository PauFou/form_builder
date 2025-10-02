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
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="min-h-screen">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50 text-sm mb-6">
              <Star className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Simple, transparent pricing</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Choose your{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                plan
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Start free forever with unlimited forms and responses. Upgrade only when you need
              advanced features like custom domains, team collaboration, and priority support.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 mb-12">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                Cancel anytime
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-500" />
                14-day money-back guarantee
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 relative z-10">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="h-full hover-lift bg-background/80 backdrop-blur-sm border-border/50">
                <CardHeader className="text-center pb-8">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl mb-2">Free</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground">
                    Perfect for individuals and small projects
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">3 active forms</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">1,000 responses/month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">All field types</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Basic logic & calculations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Email notifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">File uploads (10MB max)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Basic integrations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs">
                        Skemya branding
                      </Badge>
                    </li>
                  </ul>
                  <Link href="http://localhost:3301/auth/signup" className="w-full">
                    <Button className="w-full" size="lg">
                      Get started free
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* Pro Plan - Most Popular */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <Badge variant="default" className="shadow-sm">
                  <Star className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
              <Card className="h-full hover-lift bg-background/90 backdrop-blur-sm border-primary/50 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="relative z-10">
                  <CardHeader className="text-center pb-8">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Pro</CardTitle>
                    <div className="mb-4">
                      <span className="text-4xl font-bold">$29</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <p className="text-muted-foreground">For growing businesses and teams</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Unlimited forms</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">10,000 responses/month</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Advanced logic & calculations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Custom domains</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Remove branding</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">File uploads (100MB max)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Priority integrations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Webhooks & partial data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Multi-language support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">Analytics dashboard</span>
                      </li>
                    </ul>
                    <Link href="http://localhost:3301/auth/signup" className="w-full">
                      <Button className="w-full" size="lg">
                        Start 14-day trial
                      </Button>
                    </Link>
                  </CardContent>
                </div>
              </Card>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative"
            >
              <Card className="h-full hover-lift bg-background/80 backdrop-blur-sm border-border/50">
                <CardHeader className="text-center pb-8">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl mb-2">Enterprise</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">$99</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground">
                    For large organizations with compliance needs
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Unlimited everything</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">100,000+ responses/month</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">SSO & SAML authentication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Advanced team permissions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Audit logs & compliance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Unlimited file uploads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Priority support (24/7)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Custom SLA & uptime guarantee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">Dedicated account manager</span>
                    </li>
                  </ul>
                  <Link href="mailto:sales@skemya.com" className="w-full">
                    <Button className="w-full" variant="outline" size="lg">
                      Contact sales
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Comparison Grid */}
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
              Feature{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                comparison
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what's included in each plan and find the perfect fit for your needs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto"
          >
            <Card className="overflow-hidden bg-background/80 backdrop-blur-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-6 font-semibold min-w-[250px]">Features</th>
                      <th className="text-center p-6 font-semibold min-w-[120px]">
                        <div className="flex flex-col items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          <span>Free</span>
                        </div>
                      </th>
                      <th className="text-center p-6 font-semibold min-w-[120px]">
                        <div className="flex flex-col items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <span>Pro</span>
                        </div>
                      </th>
                      <th className="text-center p-6 font-semibold min-w-[120px]">
                        <div className="flex flex-col items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          <span>Enterprise</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      {
                        category: "Forms & Responses",
                        features: [
                          {
                            name: "Active forms",
                            free: "3",
                            pro: "Unlimited",
                            enterprise: "Unlimited",
                          },
                          {
                            name: "Responses per month",
                            free: "1,000",
                            pro: "10,000",
                            enterprise: "100,000+",
                          },
                          {
                            name: "File upload size",
                            free: "10MB",
                            pro: "100MB",
                            enterprise: "1GB",
                          },
                        ],
                      },
                      {
                        category: "Features",
                        features: [
                          { name: "All field types", free: true, pro: true, enterprise: true },
                          {
                            name: "Logic & calculations",
                            free: "Basic",
                            pro: "Advanced",
                            enterprise: "Advanced",
                          },
                          { name: "Multi-language", free: false, pro: true, enterprise: true },
                          { name: "Custom domains", free: false, pro: true, enterprise: true },
                          { name: "Remove branding", free: false, pro: true, enterprise: true },
                        ],
                      },
                      {
                        category: "Integrations",
                        features: [
                          { name: "Basic integrations", free: true, pro: true, enterprise: true },
                          { name: "Webhooks", free: false, pro: true, enterprise: true },
                          { name: "Partial submissions", free: false, pro: true, enterprise: true },
                          {
                            name: "API access",
                            free: "Read only",
                            pro: "Full",
                            enterprise: "Full",
                          },
                        ],
                      },
                      {
                        category: "Team & Support",
                        features: [
                          { name: "Team members", free: "1", pro: "5", enterprise: "Unlimited" },
                          {
                            name: "Support",
                            free: "Community",
                            pro: "Email",
                            enterprise: "24/7 Phone",
                          },
                          { name: "SLA", free: false, pro: false, enterprise: "99.95%" },
                        ],
                      },
                    ].map((category, categoryIndex) => (
                      <React.Fragment key={category.category}>
                        <tr className="bg-muted/30">
                          <td colSpan={4} className="p-4 font-semibold text-sm text-primary">
                            {category.category}
                          </td>
                        </tr>
                        {category.features.map((feature, featureIndex) => (
                          <tr
                            key={feature.name}
                            className={featureIndex % 2 === 0 ? "bg-background/50" : ""}
                          >
                            <td className="p-4 font-medium">{feature.name}</td>
                            <td className="p-4 text-center">
                              {typeof feature.free === "boolean" ? (
                                feature.free ? (
                                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="text-sm">{feature.free}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feature.pro === "boolean" ? (
                                feature.pro ? (
                                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="text-sm font-medium">{feature.pro}</span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              {typeof feature.enterprise === "boolean" ? (
                                feature.enterprise ? (
                                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-muted-foreground mx-auto" />
                                )
                              ) : (
                                <span className="text-sm font-medium">{feature.enterprise}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Typeform Comparison */}
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
              Why choose Skemya over{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Typeform?
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get more features for less money, with better performance and EU data residency.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto mb-16"
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
                          <span>Skemya Pro</span>
                        </div>
                      </th>
                      <th className="text-center p-4 font-semibold min-w-[140px]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-5 w-5 rounded-full bg-[#262626]" />
                          <span>Typeform Pro</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="p-4 font-medium">Monthly price</td>
                      <td className="p-4 text-center">
                        <div className="font-bold text-green-600 text-lg">$29</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-bold text-red-600 text-lg">$50</div>
                      </td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-4 font-medium">Responses included</td>
                      <td className="p-4 text-center">
                        <div className="font-bold text-green-600">10,000</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-medium">1,000</div>
                        <div className="text-xs text-muted-foreground">+$0.15 per extra</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Form bundle size</td>
                      <td className="p-4 text-center">
                        <div className="font-bold text-green-600">&lt;30KB</div>
                        <div className="text-xs text-green-600">6x faster</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="text-red-600">~180KB</div>
                        <div className="text-xs text-red-600">Slower loading</div>
                      </td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-4 font-medium">EU data residency</td>
                      <td className="p-4 text-center">
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="p-4 text-center">
                        <X className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Partial submissions</td>
                      <td className="p-4 text-center">
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="p-4 text-center">
                        <X className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-4 font-medium">Advanced logic editor</td>
                      <td className="p-4 text-center">
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                        <div className="text-xs text-green-600">Visual graph</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="text-yellow-600 text-xs">Basic only</div>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Signed webhooks</td>
                      <td className="p-4 text-center">
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="p-4 text-center">
                        <X className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                    </tr>
                    <tr className="bg-muted/30">
                      <td className="p-4 font-medium">Google Forms import</td>
                      <td className="p-4 text-center">
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      </td>
                      <td className="p-4 text-center">
                        <X className="h-5 w-5 text-red-500 mx-auto" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-6 bg-gradient-to-r from-green-50 to-green-100 border-t">
                <div className="text-center">
                  <p className="text-lg font-semibold text-green-800 mb-2">
                    Save $252/year + get 10x more responses
                  </p>
                  <p className="text-sm text-green-700 mb-4">
                    Plus 6x faster loading, EU data residency, and advanced features
                  </p>
                  <Link href="http://localhost:3301/auth/signup">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                      Switch to Skemya
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Cost Calculator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto"
          >
            <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Annual Savings Calculator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      Typeform Pro (10K responses)
                    </div>
                    <div className="text-2xl font-bold mb-1">$1,848</div>
                    <div className="text-xs text-muted-foreground">
                      $50/month + $0.15 × 9,000 extras
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-2">
                      Skemya Pro (10K responses)
                    </div>
                    <div className="text-2xl font-bold text-green-600 mb-1">$348</div>
                    <div className="text-xs text-muted-foreground">$29/month × 12</div>
                  </div>
                </div>
                <div className="text-center mt-6 pt-6 border-t">
                  <div className="text-3xl font-bold text-green-600 mb-2">Save $1,500/year</div>
                  <p className="text-sm text-muted-foreground">
                    Plus get better performance, EU data residency, and more features
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/20 relative z-10">
        <div className="container px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently asked questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                question: "Can I change plans anytime?",
                answer:
                  "Yes! You can upgrade or downgrade your plan anytime. When you upgrade, you'll be charged the prorated difference. When you downgrade, you'll receive account credit for your next billing cycle.",
              },
              {
                question: "What happens if I exceed my response limit?",
                answer:
                  "We'll notify you when you're approaching your limit. You can upgrade your plan or purchase additional responses. We never stop collecting responses - we just notify you to ensure uninterrupted service.",
              },
              {
                question: "Do you offer discounts for nonprofits or education?",
                answer:
                  "Yes! We offer 50% discounts for verified nonprofits and educational institutions. Contact us with your organization details to apply for a discount.",
              },
              {
                question: "Is my data safe and GDPR compliant?",
                answer:
                  "Absolutely. All data is stored in EU data centers, we're fully GDPR compliant, and we offer Data Processing Agreements (DPA) for all customers. Your data is encrypted at rest and in transit.",
              },
              {
                question: "Can I export my data?",
                answer:
                  "Yes, you can export your form data anytime in CSV, Excel, or Parquet formats. You own your data completely and can export or delete it whenever you want.",
              },
              {
                question: "What's included in the 14-day trial?",
                answer:
                  "The trial includes all Pro features with no restrictions. No credit card required to start, and you can cancel anytime during the trial period.",
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="bg-background/80 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-3 text-lg">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
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
              Ready to build better forms?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Join thousands of teams who switched to Skemya for better performance, EU data
              residency, and more features for less money.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="http://localhost:3301/auth/signup">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  Start free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="mailto:sales@skemya.com">
                <Button size="lg" variant="outline" className="text-white border-white/50 hover:bg-white/10">
                  Talk to sales
                </Button>
              </Link>
            </div>
            <p className="text-sm text-white/70 mt-6">
              No credit card required • 14-day money-back guarantee • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
