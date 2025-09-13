export interface SkemyaTheme {
  name: string;
  mode: 'light' | 'dark';
  colors: {
    // Brand Colors
    primary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string; // Main brand color
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    secondary: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    accent: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    // Neutral Colors
    neutral: {
      0: string;   // Pure white
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
      1000: string; // Pure black
    };
    // Semantic Colors
    success: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    warning: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    error: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
    info: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
      950: string;
    };
  };
  typography: {
    fonts: {
      sans: string;
      serif: string;
      mono: string;
    };
    sizes: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
      '5xl': string;
      '6xl': string;
      '7xl': string;
      '8xl': string;
      '9xl': string;
    };
    weights: {
      thin: number;
      extralight: number;
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
      extrabold: number;
      black: number;
    };
    lineHeights: {
      none: string;
      tight: string;
      snug: string;
      normal: string;
      relaxed: string;
      loose: string;
    };
    letterSpacing: {
      tighter: string;
      tight: string;
      normal: string;
      wide: string;
      wider: string;
      widest: string;
    };
  };
  spacing: {
    px: string;
    0: string;
    0.5: string;
    1: string;
    1.5: string;
    2: string;
    2.5: string;
    3: string;
    3.5: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
    9: string;
    10: string;
    11: string;
    12: string;
    14: string;
    16: string;
    20: string;
    24: string;
    28: string;
    32: string;
    36: string;
    40: string;
    44: string;
    48: string;
    52: string;
    56: string;
    60: string;
    64: string;
    72: string;
    80: string;
    96: string;
  };
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  shadows: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
  };
  transitions: {
    durations: {
      fast: string;
      base: string;
      slow: string;
      slower: string;
    };
    easings: {
      linear: string;
      in: string;
      out: string;
      inOut: string;
      bounce: string;
    };
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  zIndices: {
    auto: string;
    0: number;
    10: number;
    20: number;
    30: number;
    40: number;
    50: number;
    60: number;
    70: number;
    80: number;
    90: number;
    100: number;
  };
}

// Skemya Light Theme
export const skemyaLightTheme: SkemyaTheme = {
  name: 'Skemya Light',
  mode: 'light',
  colors: {
    // Electric Blue - Primary Brand Color
    primary: {
      50: '#eef7ff',
      100: '#d9ecff',
      200: '#bcdeff',
      300: '#8ec9ff',
      400: '#59a9ff',
      500: '#3385ff', // Main Skemya Blue
      600: '#1e68f5',
      700: '#1651e1',
      800: '#1941b6',
      900: '#193a8f',
      950: '#142456',
    },
    // Deep Purple - Secondary
    secondary: {
      50: '#f6f5ff',
      100: '#eeecfe',
      200: '#dfdcfe',
      300: '#c7c0fc',
      400: '#aa9af8',
      500: '#8e6ff3',
      600: '#7b4dea',
      700: '#6b39d6',
      800: '#5a30b3',
      900: '#4b2993',
      950: '#2f1864',
    },
    // Cyan - Accent
    accent: {
      50: '#ecfeff',
      100: '#cff9fe',
      200: '#a4f2fd',
      300: '#67e8f9',
      400: '#22d3ee',
      500: '#06b6d4', // Cyan accent
      600: '#0891b2',
      700: '#0e7490',
      800: '#155e75',
      900: '#164e63',
      950: '#083344',
    },
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
      1000: '#000000',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },
  typography: {
    fonts: {
      sans: 'var(--font-geist), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
      mono: 'var(--font-geist-mono), Menlo, Monaco, Consolas, monospace',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
      '7xl': '4.5rem',
      '8xl': '6rem',
      '9xl': '8rem',
    },
    weights: {
      thin: 100,
      extralight: 200,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeights: {
      none: '1',
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
      loose: '2',
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },
  spacing: {
    px: '1px',
    0: '0px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  transitions: {
    durations: {
      fast: '150ms',
      base: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easings: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndices: {
    auto: 'auto',
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    60: 60,
    70: 70,
    80: 80,
    90: 90,
    100: 100,
  },
};

// Skemya Dark Theme
export const skemyaDarkTheme: SkemyaTheme = {
  ...skemyaLightTheme,
  name: 'Skemya Dark',
  mode: 'dark',
  colors: {
    ...skemyaLightTheme.colors,
    // In dark mode, we invert the scale usage
    neutral: {
      0: '#000000',
      50: '#030712',
      100: '#111827',
      200: '#1f2937',
      300: '#374151',
      400: '#4b5563',
      500: '#6b7280',
      600: '#9ca3af',
      700: '#d1d5db',
      800: '#e5e7eb',
      900: '#f3f4f6',
      950: '#f9fafb',
      1000: '#ffffff',
    },
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.25)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.25)',
  },
};

// Helper function to convert theme to CSS variables
export function themeToCSS(theme: SkemyaTheme): string {
  const cssVars: string[] = [];

  // Colors
  Object.entries(theme.colors).forEach(([colorName, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      // Convert hex to HSL for better theme manipulation
      const hsl = hexToHSL(value);
      cssVars.push(`--color-${colorName}-${shade}: ${hsl};`);
      // Also provide the hex value
      cssVars.push(`--color-${colorName}-${shade}-hex: ${value};`);
    });
  });

  // Typography
  Object.entries(theme.typography.fonts).forEach(([name, value]) => {
    cssVars.push(`--font-${name}: ${value};`);
  });

  Object.entries(theme.typography.sizes).forEach(([name, value]) => {
    cssVars.push(`--text-${name}: ${value};`);
  });

  Object.entries(theme.typography.weights).forEach(([name, value]) => {
    cssVars.push(`--font-weight-${name}: ${value};`);
  });

  Object.entries(theme.typography.lineHeights).forEach(([name, value]) => {
    cssVars.push(`--leading-${name}: ${value};`);
  });

  Object.entries(theme.typography.letterSpacing).forEach(([name, value]) => {
    cssVars.push(`--tracking-${name}: ${value};`);
  });

  // Spacing
  Object.entries(theme.spacing).forEach(([name, value]) => {
    const key = name.replace('.', '-');
    cssVars.push(`--space-${key}: ${value};`);
  });

  // Border Radius
  Object.entries(theme.borderRadius).forEach(([name, value]) => {
    cssVars.push(`--radius-${name}: ${value};`);
  });

  // Shadows
  Object.entries(theme.shadows).forEach(([name, value]) => {
    cssVars.push(`--shadow-${name}: ${value};`);
  });

  // Transitions
  Object.entries(theme.transitions.durations).forEach(([name, value]) => {
    cssVars.push(`--duration-${name}: ${value};`);
  });

  Object.entries(theme.transitions.easings).forEach(([name, value]) => {
    cssVars.push(`--ease-${name}: ${value};`);
  });

  // Breakpoints
  Object.entries(theme.breakpoints).forEach(([name, value]) => {
    cssVars.push(`--screen-${name}: ${value};`);
  });

  // Z-indices
  Object.entries(theme.zIndices).forEach(([name, value]) => {
    cssVars.push(`--z-${name}: ${value};`);
  });

  return cssVars.join('\n  ');
}

// Helper function to convert hex to HSL
function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0 0% 0%';

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}