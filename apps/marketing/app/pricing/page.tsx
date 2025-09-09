'use client';

import { useState } from 'react';
import { Button } from '@forms/ui';
import { motion } from 'framer-motion';
import { Check, X, Sparkles } from 'lucide-react';

type Feature = {
  name: string;
  free: boolean;
  pro: boolean;
  category?: string;
  details?: string;
};

const features: Feature[] = [
  { name: 'Unlimited Forms', free: true, pro: true, category: 'Core' },
  { name: 'Unlimited Responses', free: true, pro: true, category: 'Core' },
  { name: 'Unlimited Questions per form', free: true, pro: true, category: 'Core' },
  { name: 'Add Image to Forms', free: true, pro: true, category: 'Core' },
  { name: 'Custom colors and fonts', free: true, pro: true, category: 'Design' },
  { name: 'Logic builder', free: true, pro: true, category: 'Logic' },
  { name: 'Score & calculations', free: true, pro: true, category: 'Logic' },
  { name: 'Hidden fields', free: true, pro: true, category: 'Logic' },
  { name: 'Embed forms', free: true, pro: true, category: 'Publishing' },
  { name: 'Google Sheets integration', free: true, pro: true, category: 'Integrations' },
  { name: 'Slack integration', free: true, pro: true, category: 'Integrations' },
  { name: 'Zapier integration', free: true, pro: true, category: 'Integrations' },
  { name: 'Email notification to self', free: true, pro: true, category: 'Notifications' },
  { name: 'Multiple endings per form', free: true, pro: true, category: 'Logic' },
  { name: 'Webhooks', free: true, pro: true, category: 'Developer' },
  { name: 'Collect Signatures', free: true, pro: true, category: 'Fields' },
  { name: 'Calendly integration', free: true, pro: true, category: 'Integrations' },
  { name: 'Cal.com integration', free: true, pro: true, category: 'Integrations' },
  { name: 'SavvyCal integration', free: true, pro: true, category: 'Integrations' },
  { name: 'Workspaces (or folders)', free: true, pro: true, category: 'Organization' },
  { name: 'Non English language support', free: true, pro: true, category: 'Languages' },
  { name: 'Multiple language support', free: false, pro: true, category: 'Languages' },
  { name: 'Custom fonts', free: false, pro: true, category: 'Design' },
  { name: 'Redirect to a URL', free: false, pro: true, category: 'Publishing' },
  { name: 'Add your brand logo', free: false, pro: true, category: 'Branding' },
  { name: 'Customize form meta data', free: false, pro: true, category: 'SEO' },
  { name: 'Remove Forms branding', free: false, pro: true, category: 'Branding' },
  { name: 'Partial Submissions', free: false, pro: true, category: 'Data' },
  { name: 'Refill link', free: false, pro: true, category: 'Data' },
  { name: 'Custom Domains', free: false, pro: true, category: 'Publishing' },
  { name: 'File Uploads', free: true, pro: true, details: 'Up to 10MB|Unlimited (FUP)' },
  { name: 'Invite team members', free: false, pro: true, category: 'Team' },
  { name: 'Collect Payments', free: false, pro: true, category: 'Commerce' },
  { name: 'Google Tag Manager', free: false, pro: true, category: 'Analytics', details: 'For FB, TikTok Pixel etc.' },
  { name: 'Form Analytics & Drop-off Rate', free: true, pro: true, details: 'Basic|Advanced' },
];

const competitorPricing = [
  { submissions: 100, typeform: 25, us: 0 },
  { submissions: 1000, typeform: 50, us: 0 },
  { submissions: 5000, typeform: 99, us: 0 },
  { submissions: 10000, typeform: 159, us: 0 },
  { submissions: 25000, typeform: 299, us: 0 },
  { submissions: 50000, typeform: 499, us: 0 },
  { submissions: 100000, typeform: 899, us: 0 },
];

export default function PricingPage() {
  const [submissions, setSubmissions] = useState(5000);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const currentPricing = competitorPricing.find(p => p.submissions >= submissions) || competitorPricing[competitorPricing.length - 1];
  const savings = currentPricing.typeform - currentPricing.us;

  const displayedFeatures = showAllFeatures ? features : features.slice(0, 20);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to create professional forms. No surprises, no hidden fees.
          </p>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-6 mb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-3xl border shadow-lg p-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Free</h2>
              <p className="text-muted-foreground mb-6">Perfect for getting started</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">€0</span>
                <span className="text-muted-foreground"> / month</span>
              </div>
              <Button size="lg" variant="outline" className="w-full">
                Start free
              </Button>
            </div>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-3xl border-2 border-primary shadow-xl p-8 relative"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
              Coming Soon
            </div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Pro</h2>
              <p className="text-muted-foreground mb-6">For growing teams</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">€0</span>
                <span className="text-muted-foreground"> / month</span>
                <p className="text-sm text-muted-foreground mt-2">Free during beta!</p>
              </div>
              <Button size="lg" className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Join waitlist
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="container mx-auto px-6 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Compare plans</h2>
          
          <div className="bg-card rounded-3xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-3 bg-muted/50 p-6">
              <div className="font-semibold">Feature</div>
              <div className="text-center font-semibold">FREE</div>
              <div className="text-center font-semibold">PRO</div>
            </div>
            
            <div className="divide-y">
              {displayedFeatures.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="grid grid-cols-3 p-4 hover:bg-muted/20 transition-colors"
                >
                  <div>
                    <div className="font-medium">{feature.name}</div>
                    {feature.category && (
                      <span className="text-xs text-muted-foreground">{feature.category}</span>
                    )}
                  </div>
                  <div className="text-center">
                    {feature.details && feature.free ? (
                      <span className="text-sm">{feature.details.split('|')[0]}</span>
                    ) : feature.free ? (
                      <Check className="h-5 w-5 text-success mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </div>
                  <div className="text-center">
                    {feature.details && feature.pro ? (
                      <span className="text-sm">{feature.details.split('|')[1] || feature.details.split('|')[0]}</span>
                    ) : feature.pro ? (
                      <Check className="h-5 w-5 text-success mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mx-auto" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            
            {!showAllFeatures && (
              <div className="p-6 text-center border-t">
                <Button variant="ghost" onClick={() => setShowAllFeatures(true)}>
                  Show all features
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Competitor Comparison */}
      <div className="bg-primary/5 py-24">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-4">Forms vs Typeform pricing</h2>
            <p className="text-center text-muted-foreground mb-12">
              See how much you can save with our transparent pricing
            </p>

            <div className="bg-card rounded-3xl shadow-lg p-8">
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4">
                  Your expected number of submissions per month?
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="100"
                    max="100000"
                    value={submissions}
                    onChange={(e) => setSubmissions(Number(e.target.value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(Math.log(submissions) - Math.log(100)) / (Math.log(100000) - Math.log(100)) * 100}%, hsl(var(--muted)) ${(Math.log(submissions) - Math.log(100)) / (Math.log(100000) - Math.log(100)) * 100}%, hsl(var(--muted)) 100%)`
                    }}
                  />
                  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>100</span>
                    <span>100K</span>
                  </div>
                </div>
                <div className="text-center mt-6 text-3xl font-bold">
                  {submissions.toLocaleString()} submissions per month
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-success/10 rounded-2xl p-6 text-center">
                  <h3 className="font-semibold mb-2">Forms</h3>
                  <div className="text-4xl font-bold mb-2">€{currentPricing.us}</div>
                  <div className="text-2xl">😁</div>
                </div>
                <div className="bg-destructive/10 rounded-2xl p-6 text-center">
                  <h3 className="font-semibold mb-2">Typeform</h3>
                  <div className="text-4xl font-bold mb-2">${currentPricing.typeform}</div>
                  <div className="text-2xl">😟</div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 bg-success/10 text-success px-4 py-2 rounded-full text-lg font-medium mb-6">
                  You save ${savings} per month ✌️
                </div>
                <div>
                  <Button size="lg" className="px-8">
                    Create free account
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-6 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-12">Questions?</h2>
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold mb-2">When will Pro features be available?</h3>
              <p className="text-muted-foreground">
                We're currently in beta. Pro features will be available soon, and early adopters will get special pricing!
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do I need a credit card to start?</h3>
              <p className="text-muted-foreground">
                No! You can start using Forms completely free. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can upgrade or downgrade your plan anytime. Changes take effect immediately.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}