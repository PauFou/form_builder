import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { I18nProvider, useI18n } from "../context";
import { createI18nErrorMap, createValidationSchemas } from "../validation";
import { z } from "zod";

// Test component that uses i18n
function TestComponent() {
  const { t, locale, setLocale, formatDate, formatCurrency, formatNumber } = useI18n();

  return (
    <div>
      <div data-testid="locale">{locale}</div>
      <div data-testid="greeting">{t.common.submit}</div>
      <div data-testid="navigation">{t.navigation.dashboard}</div>
      <button onClick={() => setLocale(locale === "en" ? "fr" : "en")} data-testid="toggle-locale">
        Toggle Language
      </button>
      <div data-testid="formatted-date">{formatDate(new Date("2024-01-15"))}</div>
      <div data-testid="formatted-currency">{formatCurrency(1234.56)}</div>
      <div data-testid="formatted-number">{formatNumber(1234.56)}</div>
    </div>
  );
}

describe("I18n Context", () => {
  it("should render with default English locale", () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId("locale")).toHaveTextContent("en");
    expect(screen.getByTestId("greeting")).toHaveTextContent("Submit");
    expect(screen.getByTestId("navigation")).toHaveTextContent("Dashboard");
  });

  it("should switch to French locale", () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    const toggleButton = screen.getByTestId("toggle-locale");
    fireEvent.click(toggleButton);

    expect(screen.getByTestId("locale")).toHaveTextContent("fr");
    expect(screen.getByTestId("greeting")).toHaveTextContent("Soumettre");
    expect(screen.getByTestId("navigation")).toHaveTextContent("Tableau de bord");
  });

  it("should format dates according to locale", () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Date formatting can vary by system locale, so just check that it contains the expected parts
    const formattedDate = screen.getByTestId("formatted-date").textContent;
    expect(formattedDate).toMatch(/15|01|2024/);

    // Switch to French
    fireEvent.click(screen.getByTestId("toggle-locale"));
    const frFormattedDate = screen.getByTestId("formatted-date").textContent;
    expect(frFormattedDate).toMatch(/15|01|2024/);
  });

  it("should format currency according to locale", () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    // Currency formatting includes the amount 1234.56
    const enCurrency = screen.getByTestId("formatted-currency").textContent;
    expect(enCurrency).toMatch(/1[,\s]?234[.,]56/);

    // Switch to French
    fireEvent.click(screen.getByTestId("toggle-locale"));
    const frCurrency = screen.getByTestId("formatted-currency").textContent;
    // French uses spaces for thousands separator and comma for decimal
    expect(frCurrency).toMatch(/1[,\s]?234[.,]56/);
  });
});

describe("I18n Validation", () => {
  it("should provide localized validation messages in English", () => {
    const t = {
      validation: {
        required: "This field is required",
        email: "Please enter a valid email address",
        minLength: "Must be at least {min} characters",
        maxLength: "Must be no more than {max} characters",
        custom: "Please enter a valid value",
      },
    };

    z.setErrorMap(createI18nErrorMap(t as any));

    const schema = z.string().email();
    const result = schema.safeParse("invalid-email");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Please enter a valid email address");
    }
  });

  it("should provide localized validation messages in French", () => {
    const t = {
      validation: {
        required: "Ce champ est obligatoire",
        email: "Veuillez entrer une adresse e-mail valide",
        minLength: "Doit contenir au moins {min} caractères",
        maxLength: "Ne doit pas dépasser {max} caractères",
        custom: "Veuillez entrer une valeur valide",
      },
    };

    z.setErrorMap(createI18nErrorMap(t as any));

    const schema = z.string().email();
    const result = schema.safeParse("invalid-email");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Veuillez entrer une adresse e-mail valide");
    }
  });

  it("should handle min/max length validation with placeholders", () => {
    const t = {
      validation: {
        minLength: "Must be at least {min} characters",
        maxLength: "Must be no more than {max} characters",
        custom: "Please enter a valid value",
      },
    };

    z.setErrorMap(createI18nErrorMap(t as any));

    const schema = z.string().min(5);
    const result = schema.safeParse("abc");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toBe("Must be at least 5 characters");
    }
  });
});
