import { useEffect, useRef, useState } from "react";
import { Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

export interface WebVitalsMetrics {
  lcp?: Metric;
  cls?: Metric;
  fcp?: Metric;
  ttfb?: Metric;
  inp?: Metric;
}

export interface WebVitalsThresholds {
  lcp: { good: number; needsImprovement: number }; // LCP: <2.5s good, 2.5-4s needs improvement
  cls: { good: number; needsImprovement: number }; // CLS: <0.1 good, 0.1-0.25 needs improvement
  fcp: { good: number; needsImprovement: number }; // FCP: <1.8s good, 1.8-3s needs improvement
  ttfb: { good: number; needsImprovement: number }; // TTFB: <800ms good, 800-1800ms needs improvement
  inp: { good: number; needsImprovement: number }; // INP: <200ms good, 200-500ms needs improvement
}

export const DEFAULT_THRESHOLDS: WebVitalsThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
  inp: { good: 200, needsImprovement: 500 },
};

export type MetricRating = "good" | "needs-improvement" | "poor";

export function getMetricRating(metric: Metric, thresholds: WebVitalsThresholds): MetricRating {
  const threshold = thresholds[metric.name as keyof WebVitalsThresholds];
  if (!threshold) return "poor";

  if (metric.value <= threshold.good) return "good";
  if (metric.value <= threshold.needsImprovement) return "needs-improvement";
  return "poor";
}

export interface WebVitalsOptions {
  thresholds?: Partial<WebVitalsThresholds>;
  reportAllChanges?: boolean;
  onMetric?: (metric: Metric, rating: MetricRating) => void;
  debug?: boolean;
}

export function useWebVitals(options: WebVitalsOptions = {}) {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({});
  const [isSupported, setIsSupported] = useState(true);
  const thresholdsRef = useRef<WebVitalsThresholds>({
    ...DEFAULT_THRESHOLDS,
    ...options.thresholds,
  });

  const handleMetric = (metric: Metric) => {
    const rating = getMetricRating(metric, thresholdsRef.current);

    setMetrics((prev) => ({
      ...prev,
      [metric.name]: metric,
    }));

    // Optional callback for custom handling (e.g., analytics)
    options.onMetric?.(metric, rating);

    // Debug logging
    if (options.debug) {
      console.log(`[Web Vitals] ${metric.name}:`, {
        value: metric.value,
        rating,
        id: metric.id,
        delta: metric.delta,
      });
    }
  };

  useEffect(() => {
    // Check if Web Vitals is supported
    if (typeof window === "undefined") {
      setIsSupported(false);
      return;
    }

    try {
      // Set up Web Vitals observers
      onCLS(handleMetric, { reportAllChanges: options.reportAllChanges });
      onFCP(handleMetric, { reportAllChanges: options.reportAllChanges });
      // FID has been deprecated in favor of INP
      onINP(handleMetric, { reportAllChanges: options.reportAllChanges });
      onLCP(handleMetric, { reportAllChanges: options.reportAllChanges });
      onTTFB(handleMetric, { reportAllChanges: options.reportAllChanges });
    } catch (error) {
      console.error("[Web Vitals] Failed to initialize:", error);
      setIsSupported(false);
    }
  }, [options.reportAllChanges, options.onMetric, options.debug]);

  // Get ratings for all current metrics
  const ratings = Object.entries(metrics).reduce(
    (acc, [name, metric]) => {
      if (metric) {
        acc[name as keyof WebVitalsMetrics] = getMetricRating(metric, thresholdsRef.current);
      }
      return acc;
    },
    {} as Record<keyof WebVitalsMetrics, MetricRating>
  );

  // Calculate overall score (percentage of good metrics)
  const overallScore = (() => {
    const metricNames = Object.keys(metrics) as Array<keyof WebVitalsMetrics>;
    if (metricNames.length === 0) return null;

    const goodMetrics = metricNames.filter(
      (name) => metrics[name] && ratings[name] === "good"
    ).length;

    return Math.round((goodMetrics / metricNames.length) * 100);
  })();

  // Check if performance meets SKEMYA requirements
  const meetsSkemyaRequirements = {
    lcp: metrics.lcp ? metrics.lcp.value <= 2500 : null, // <2.5s
    inp: metrics.inp ? metrics.inp.value <= 200 : null, // <200ms
    bundleSize: null, // To be checked separately
    overall:
      metrics.lcp && metrics.inp ? metrics.lcp.value <= 2500 && metrics.inp.value <= 200 : null,
  };

  return {
    metrics,
    ratings,
    overallScore,
    isSupported,
    meetsSkemyaRequirements,
    thresholds: thresholdsRef.current,
  };
}

// Utility function to format metric values for display
export function formatMetricValue(metric: Metric): string {
  switch (metric.name) {
    case "CLS":
      return metric.value.toFixed(3);
    case "FCP":
    case "LCP":
    case "TTFB":
    case "INP":
      return `${Math.round(metric.value)}ms`;
    default:
      return metric.value.toString();
  }
}

// Utility function to get metric description
export function getMetricDescription(metricName: string): string {
  switch (metricName) {
    case "LCP":
      return "Largest Contentful Paint - measures loading performance";
    case "FID":
      return "First Input Delay - measures interactivity";
    case "CLS":
      return "Cumulative Layout Shift - measures visual stability";
    case "FCP":
      return "First Contentful Paint - measures perceived loading speed";
    case "TTFB":
      return "Time to First Byte - measures server response time";
    case "INP":
      return "Interaction to Next Paint - measures responsiveness";
    default:
      return "Unknown metric";
  }
}
