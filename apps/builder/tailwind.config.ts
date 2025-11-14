import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // YouForm Brand Colors
        youform: {
          orange: {
            DEFAULT: '#FF6B35',
            hover: '#E55A2B',
            light: '#FFE5DC',
          },
          slate: {
            DEFAULT: '#475569',
            dark: '#334155',
            light: '#64748B',
          },
          // Block Type Colors (matching YouForm exactly)
          blocks: {
            contact: '#E9D5FF',      // Lavender/Purple
            'contact-dark': '#C084FC',
            text: '#BFDBFE',          // Light Blue
            'text-dark': '#60A5FA',
            longtext: '#FEF08A',      // Yellow
            'longtext-dark': '#FDE047',
            phone: '#E9D5FF',         // Lavender (same as contact)
            'phone-dark': '#C084FC',
            statement: '#FBCFE8',     // Pink
            'statement-dark': '#F472B6',
            number: '#FECACA',        // Light Red/Pink
            'number-dark': '#FCA5A5',
            url: '#A5F3FC',           // Cyan
            'url-dark': '#22D3EE',
            select: '#86EFAC',        // Green
            'select-dark': '#4ADE80',
            multiselect: '#FED7AA',   // Orange/Peach
            'multiselect-dark': '#FDBA74',
            dropdown: '#E0E7FF',      // Indigo
            'dropdown-dark': '#A5B4FC',
          },
          // Gray Scale (YouForm specific)
          gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist)"],
        inter: ["var(--font-inter)"],
        mono: ["var(--font-geist-mono)"],
      },
      boxShadow: {
        // YouForm specific shadows
        'youform-card': '0 1px 3px rgba(0, 0, 0, 0.08)',
        'youform-card-hover': '0 8px 24px rgba(0, 0, 0, 0.08)',
        'youform-dropdown': '0 4px 12px rgba(0, 0, 0, 0.10)',
        'youform-modal': '0 20px 60px rgba(0, 0, 0, 0.15)',
        // Brutalist shadow for PRO button
        'youform-brutalist': '2px 2px 0 0 rgba(0, 0, 0, 1)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // YouForm specific animations
        "slide-up": {
          from: { transform: "translateY(10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          from: { transform: "translateY(-10px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-up": "slide-up 0.2s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
      transitionDuration: {
        '200': '200ms', // YouForm standard transition
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Plugin pour supporter les data-state variants de Radix UI
    function ({ matchVariant }: any) {
      matchVariant('data-state', (value: string) => {
        return `&[data-state="${value}"]`;
      });
    },
  ],
};

export default config;
