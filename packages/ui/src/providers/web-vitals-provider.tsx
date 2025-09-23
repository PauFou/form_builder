import React, { createContext, useContext, useEffect, useState } from "react";
import { Metric } from "web-vitals";
import { type MetricRating } from "../hooks/use-web-vitals";

interface WebVitalsContextValue {
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  reportMetric: (metric: Metric, rating: MetricRating) => void;
  getPerformanceReport: () => PerformanceReport;
}

interface PerformanceReport {
  timestamp: string;
  metrics: Record<string, { value: number; rating: MetricRating }>;
  overallScore: number | null;
  meetsSkemyaRequirements: boolean;
  bundleSize?: number;
  url: string;
  userAgent: string;
}

const WebVitalsContext = createContext<WebVitalsContextValue | null>(null);

interface WebVitalsProviderProps {
  children: React.ReactNode;
  analyticsEndpoint?: string;
  enableLocalStorage?: boolean;
  onReport?: (report: PerformanceReport) => void;
}

export function WebVitalsProvider({
  children,
  analyticsEndpoint,
  enableLocalStorage = true,
  onReport,
}: WebVitalsProviderProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceReport[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState<
    Record<string, { value: number; rating: MetricRating }>
  >({});

  const generatePerformanceReport = (): PerformanceReport => {
    const metricValues = Object.values(currentMetrics);
    const goodMetrics = metricValues.filter((m) => m.rating === "good").length;
    const overallScore =
      metricValues.length > 0 ? Math.round((goodMetrics / metricValues.length) * 100) : null;

    const lcpMeetsReq = currentMetrics.lcp ? currentMetrics.lcp.value <= 2500 : null;
    const inpMeetsReq = currentMetrics.inp ? currentMetrics.inp.value <= 200 : null;
    const meetsSkemyaRequirements = lcpMeetsReq === true && inpMeetsReq === true;

    return {
      timestamp: new Date().toISOString(),
      metrics: currentMetrics,
      overallScore,
      meetsSkemyaRequirements,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };
  };

  const sendToAnalytics = async (endpoint: string, report: PerformanceReport) => {
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      });
    } catch (error) {
      console.error("[Web Vitals] Failed to send analytics:", error);
    }
  };

  const reportMetric = (metric: Metric, rating: MetricRating) => {
    if (!isEnabled) return;

    // Update current metrics
    setCurrentMetrics((prev) => ({
      ...prev,
      [metric.name.toLowerCase()]: { value: metric.value, rating },
    }));

    // Generate report
    const report = generatePerformanceReport();

    // Update local state
    setPerformanceData((prev) => {
      const updated = [...prev, report];
      return updated.slice(-10); // Keep only last 10 reports
    });

    // Save to localStorage if enabled
    if (enableLocalStorage) {
      try {
        localStorage.setItem("webVitalsData", JSON.stringify(report));
      } catch (error) {
        console.warn("[Web Vitals] Failed to save to localStorage:", error);
      }
    }

    // Send to analytics endpoint
    if (analyticsEndpoint) {
      sendToAnalytics(analyticsEndpoint, report);
    }

    // Custom report handler
    onReport?.(report);

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Web Vitals] ${metric.name}: ${metric.value} (${rating})`);
    }
  };

  const getPerformanceReport = (): PerformanceReport => {
    return generatePerformanceReport();
  };

  // Load saved data from localStorage on mount
  useEffect(() => {
    if (!enableLocalStorage) return;

    try {
      const saved = localStorage.getItem("webVitalsData");
      if (saved) {
        const data = JSON.parse(saved);
        setPerformanceData((prev) => [...prev, data]);
      }
    } catch (error) {
      console.warn("[Web Vitals] Failed to load from localStorage:", error);
    }
  }, [enableLocalStorage]);

  const contextValue: WebVitalsContextValue = {
    isEnabled,
    setEnabled: setIsEnabled,
    reportMetric,
    getPerformanceReport,
  };

  return <WebVitalsContext.Provider value={contextValue}>{children}</WebVitalsContext.Provider>;
}

export function useWebVitalsContext() {
  const context = useContext(WebVitalsContext);
  if (!context) {
    throw new Error("useWebVitalsContext must be used within a WebVitalsProvider");
  }
  return context;
}

// Utility component for performance debugging in development
export function WebVitalsDebugger() {
  const { getPerformanceReport } = useWebVitalsContext();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  const handleExportReport = () => {
    const report = getPerformanceReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `web-vitals-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleExportReport}
        className="bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
      >
        Export Vitals Report
      </button>
    </div>
  );
}
