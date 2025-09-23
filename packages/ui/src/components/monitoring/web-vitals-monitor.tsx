import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Alert, AlertDescription } from "../ui/alert";
import {
  useWebVitals,
  formatMetricValue,
  getMetricDescription,
  type MetricRating,
  type WebVitalsOptions,
} from "../../hooks/use-web-vitals";
import { Activity, AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";

interface WebVitalsMonitorProps extends WebVitalsOptions {
  className?: string;
  showDetailedMetrics?: boolean;
  showSkemyaCompliance?: boolean;
}

function getRatingColor(rating: MetricRating): string {
  switch (rating) {
    case "good":
      return "bg-green-500";
    case "needs-improvement":
      return "bg-yellow-500";
    case "poor":
      return "bg-red-500";
    default:
      return "bg-gray-400";
  }
}

function getRatingIcon(rating: MetricRating) {
  switch (rating) {
    case "good":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "needs-improvement":
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case "poor":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Info className="h-4 w-4 text-gray-600" />;
  }
}

function getRatingBadgeVariant(
  rating: MetricRating
): "default" | "secondary" | "destructive" | "warning" | "success" {
  switch (rating) {
    case "good":
      return "success";
    case "needs-improvement":
      return "warning";
    case "poor":
      return "destructive";
    default:
      return "secondary";
  }
}

export function WebVitalsMonitor({
  className,
  showDetailedMetrics = true,
  showSkemyaCompliance = true,
  ...webVitalsOptions
}: WebVitalsMonitorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { metrics, ratings, overallScore, isSupported, meetsSkemyaRequirements } =
    useWebVitals(webVitalsOptions);

  if (!isSupported) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Web Vitals monitoring is not supported in this environment.
        </AlertDescription>
      </Alert>
    );
  }

  const coreMetrics = ["LCP", "FID", "CLS", "INP"] as const;
  const additionalMetrics = ["FCP", "TTFB"] as const;
  const displayedMetrics = isExpanded ? [...coreMetrics, ...additionalMetrics] : coreMetrics;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Web Vitals Monitor</CardTitle>
            </div>
            {overallScore !== null && (
              <Badge
                variant={
                  overallScore >= 75 ? "success" : overallScore >= 50 ? "warning" : "destructive"
                }
              >
                {overallScore}% Good
              </Badge>
            )}
          </div>
          <CardDescription>Real-time Core Web Vitals performance monitoring</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* SKEMYA Compliance Check */}
          {showSkemyaCompliance && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">SKEMYA Performance Requirements</div>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>LCP &lt; 2.5s:</span>
                    <span
                      className={`font-medium ${
                        meetsSkemyaRequirements.lcp === true
                          ? "text-green-600"
                          : meetsSkemyaRequirements.lcp === false
                            ? "text-red-600"
                            : "text-gray-500"
                      }`}
                    >
                      {meetsSkemyaRequirements.lcp === null
                        ? "Measuring..."
                        : meetsSkemyaRequirements.lcp
                          ? "✓ Pass"
                          : "✗ Fail"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>INP &lt; 200ms:</span>
                    <span
                      className={`font-medium ${
                        meetsSkemyaRequirements.inp === true
                          ? "text-green-600"
                          : meetsSkemyaRequirements.inp === false
                            ? "text-red-600"
                            : "text-gray-500"
                      }`}
                    >
                      {meetsSkemyaRequirements.inp === null
                        ? "Measuring..."
                        : meetsSkemyaRequirements.inp
                          ? "✓ Pass"
                          : "✗ Fail"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bundle &lt; 30KB:</span>
                    <span className="text-gray-500 font-medium">Check build output</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Core Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedMetrics.map((metricName) => {
              const metric = metrics[metricName.toLowerCase() as keyof typeof metrics];
              const rating = ratings[metricName.toLowerCase() as keyof typeof ratings];

              return (
                <div key={metricName} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{metricName}</span>
                      {rating && getRatingIcon(rating)}
                    </div>
                    {rating && (
                      <Badge variant={getRatingBadgeVariant(rating)}>
                        {rating.replace("-", " ")}
                      </Badge>
                    )}
                  </div>

                  <div className="text-2xl font-bold mb-1">
                    {metric ? formatMetricValue(metric) : "Measuring..."}
                  </div>

                  {showDetailedMetrics && (
                    <div className="text-sm text-muted-foreground">
                      {getMetricDescription(metricName)}
                    </div>
                  )}

                  {/* Progress bar showing performance against thresholds */}
                  {metric && rating && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Good</span>
                        <span>Poor</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getRatingColor(rating)}`}
                          style={{
                            width:
                              rating === "good"
                                ? "33%"
                                : rating === "needs-improvement"
                                  ? "66%"
                                  : "100%",
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Toggle for additional metrics */}
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? "Show Less" : "Show All Metrics"}
            </Button>
          </div>

          {/* Overall Performance Score */}
          {overallScore !== null && (
            <div className="text-center p-4 border rounded-lg bg-muted/30">
              <div className="text-lg font-semibold mb-2">Performance Score</div>
              <div className="flex items-center justify-center gap-4">
                <Progress value={overallScore} className="flex-1" />
                <span className="text-2xl font-bold">{overallScore}%</span>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {overallScore >= 90
                  ? "Excellent performance! 🎉"
                  : overallScore >= 75
                    ? "Good performance 👍"
                    : overallScore >= 50
                      ? "Needs improvement ⚠️"
                      : "Poor performance - optimization needed 🚨"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Compact version for dashboards
export function WebVitalsCompact() {
  const { metrics, ratings, overallScore } = useWebVitals();

  const coreMetrics = ["lcp", "inp", "cls"] as const;

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4" />
        <span className="font-medium">Vitals</span>
      </div>

      <div className="flex items-center gap-3">
        {coreMetrics.map((metricName) => {
          const metric = metrics[metricName];
          const rating = ratings[metricName];

          return (
            <div key={metricName} className="flex items-center gap-1">
              <span className="text-xs uppercase font-medium">{metricName}</span>
              <div
                className={`w-2 h-2 rounded-full ${
                  rating ? getRatingColor(rating) : "bg-gray-300"
                }`}
              />
              <span className="text-sm">{metric ? formatMetricValue(metric) : "..."}</span>
            </div>
          );
        })}
      </div>

      {overallScore !== null && (
        <Badge variant={overallScore >= 75 ? "success" : "warning"}>{overallScore}%</Badge>
      )}
    </div>
  );
}
