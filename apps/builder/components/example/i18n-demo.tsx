"use client";

import { useI18n } from "@/lib/i18n";
import { useSkemyaTheme } from "@/lib/theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeSwitcher } from "@/components/ui/theme-switcher";
import { useState } from "react";
import { z } from "zod";
import { createI18nErrorMap, createValidationSchemas } from "@/lib/i18n/validation";

export function I18nDemo() {
  const { t, locale, formatDate, formatCurrency, formatNumber, formatRelativeTime } = useI18n();
  const { theme } = useSkemyaTheme();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  // Set Zod error map with current translations
  z.setErrorMap(createI18nErrorMap(t));

  // Get validation schemas with current translations
  const schemas = createValidationSchemas(t);

  const handleValidate = () => {
    try {
      schemas.email.parse(email);
      setErrors([]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(error.errors.map((e) => e.message));
      }
    }
  };

  const now = new Date();
  const pastDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t.common.documentation}: i18n & Skemya Theme</h1>
        <div className="flex gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Language Demo */}
        <Card>
          <CardHeader>
            <CardTitle>{t.settings.language}</CardTitle>
            <CardDescription>
              {locale === "en" ? "Current language: English" : "Langue actuelle: Français"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">{t.navigation.dashboard}</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>{t.forms.createForm}</p>
                <p>{t.analytics.overview}</p>
                <p>{t.integrations.webhooks}</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">{t.common.success}</h4>
              <Alert>
                <AlertDescription>{t.success.saved}</AlertDescription>
              </Alert>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.auth.emailLabel}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.placeholders.enterEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button onClick={handleValidate} size="sm">
                {t.common.submit}
              </Button>
              {errors.length > 0 && <p className="text-sm text-destructive">{errors[0]}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Number Formatting Demo */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t.common.info}: {t.settings.dateFormat}
            </CardTitle>
            <CardDescription>
              {locale === "en" ? "Localized formatting examples" : "Exemples de formatage localisé"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">{t.analytics.dateRange}:</span>{" "}
                {formatDate(now, { dateStyle: "full" })}
              </p>
              <p className="text-sm">
                <span className="font-semibold">{t.time.days_ago.replace("{count}", "7")}:</span>{" "}
                {formatRelativeTime(pastDate)}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">{t.blocks.number}:</span>{" "}
                {formatNumber(123456.789, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm">
                <span className="font-semibold">{t.blocks.currency}:</span>{" "}
                {formatCurrency(1234.56, "EUR")}
              </p>
              <p className="text-sm">
                <span className="font-semibold">{t.analytics.conversionRate}:</span>{" "}
                {formatNumber(0.8542, { style: "percent", minimumFractionDigits: 1 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Theme Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Skemya Theme</CardTitle>
            <CardDescription>Current theme: {theme.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <div className="h-12 w-full rounded-md bg-primary" />
                  <p className="text-xs text-center">Primary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 w-full rounded-md bg-secondary" />
                  <p className="text-xs text-center">Secondary</p>
                </div>
                <div className="space-y-2">
                  <div className="h-12 w-full rounded-md bg-accent" />
                  <p className="text-xs text-center">Accent</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button className="w-full">{t.common.submit}</Button>
                <Button variant="secondary" className="w-full">
                  {t.common.save}
                </Button>
                <Button variant="outline" className="w-full">
                  {t.common.cancel}
                </Button>
                <Button variant="destructive" className="w-full">
                  {t.common.delete}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Demo */}
        <Card>
          <CardHeader>
            <CardTitle>{t.builder.typography}</CardTitle>
            <CardDescription>Skemya typography scale</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-bold">Heading 1</h1>
                <h2 className="text-3xl font-semibold">Heading 2</h2>
                <h3 className="text-2xl font-semibold">Heading 3</h3>
                <h4 className="text-xl font-semibold">Heading 4</h4>
              </div>
              <div className="space-y-2">
                <p className="text-base">
                  {locale === "en"
                    ? "This is a paragraph with normal text size. The Skemya theme provides a clean, professional aesthetic."
                    : "Ceci est un paragraphe avec une taille de texte normale. Le thème Skemya offre une esthétique propre et professionnelle."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locale === "en"
                    ? "Small text for secondary information"
                    : "Petit texte pour les informations secondaires"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
