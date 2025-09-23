import type { Meta, StoryObj } from "@storybook/react";
import { WebVitalsMonitor, WebVitalsCompact } from "./web-vitals-monitor";
import { WebVitalsProvider } from "../../providers/web-vitals-provider";

const meta: Meta<typeof WebVitalsMonitor> = {
  title: "Monitoring/WebVitalsMonitor",
  component: WebVitalsMonitor,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <WebVitalsProvider>
        <div className="w-[800px]">
          <Story />
        </div>
      </WebVitalsProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showDetailedMetrics: true,
    showSkemyaCompliance: true,
  },
};

export const BasicView: Story = {
  args: {
    showDetailedMetrics: false,
    showSkemyaCompliance: false,
  },
};

export const SkemyaFocused: Story = {
  args: {
    showDetailedMetrics: true,
    showSkemyaCompliance: true,
  },
};

export const WithDebugMode: Story = {
  args: {
    showDetailedMetrics: true,
    showSkemyaCompliance: true,
    debug: true,
  },
};

export const CustomThresholds: Story = {
  args: {
    showDetailedMetrics: true,
    showSkemyaCompliance: true,
    thresholds: {
      lcp: { good: 2000, needsImprovement: 3000 }, // Stricter LCP
      inp: { good: 150, needsImprovement: 300 }, // Stricter INP
    },
  },
};

export const CompactVersion: Story = {
  render: () => (
    <WebVitalsProvider>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Compact Web Vitals Monitor</h3>
        <WebVitalsCompact />
        <p className="text-sm text-muted-foreground">
          This compact version is perfect for dashboards and headers
        </p>
      </div>
    </WebVitalsProvider>
  ),
};

export const DashboardIntegration: Story = {
  render: () => (
    <WebVitalsProvider>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
            <WebVitalsCompact />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">98%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </div>
              <div className="p-3 border rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">1.2s</div>
                <div className="text-sm text-muted-foreground">Avg Load</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
          <WebVitalsMonitor showDetailedMetrics={true} showSkemyaCompliance={true} />
        </div>
      </div>
    </WebVitalsProvider>
  ),
};

export const PerformanceReport: Story = {
  render: () => (
    <WebVitalsProvider
      onReport={(report) => {
        console.log("Performance Report:", report);
      }}
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Performance Monitoring with Reporting</h3>
        <WebVitalsMonitor
          showDetailedMetrics={true}
          showSkemyaCompliance={true}
          onMetric={(metric, rating) => {
            console.log(`Metric received: ${metric.name} = ${metric.value} (${rating})`);
          }}
        />
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Open your browser's developer console to see real-time metric reports. In a real
            application, these would be sent to your analytics endpoint.
          </p>
        </div>
      </div>
    </WebVitalsProvider>
  ),
};

export const SkemyaComplianceCheck: Story = {
  render: () => (
    <WebVitalsProvider>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">SKEMYA Performance Requirements</h3>
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Target Metrics:</h4>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• LCP (Largest Contentful Paint) &lt; 2.5s</li>
            <li>• INP (Interaction to Next Paint) &lt; 200ms</li>
            <li>• Bundle Size &lt; 30KB gzipped</li>
            <li>• Overall Score ≥ 90%</li>
          </ul>
        </div>
        <WebVitalsMonitor
          showSkemyaCompliance={true}
          thresholds={{
            lcp: { good: 2500, needsImprovement: 4000 },
            inp: { good: 200, needsImprovement: 500 },
          }}
        />
      </div>
    </WebVitalsProvider>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <WebVitalsProvider>
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-4">Full Monitor</h3>
          <WebVitalsMonitor showDetailedMetrics={true} showSkemyaCompliance={true} />
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Compact Monitor</h3>
          <WebVitalsCompact />
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">Basic Monitor</h3>
          <WebVitalsMonitor showDetailedMetrics={false} showSkemyaCompliance={false} />
        </div>
      </div>
    </WebVitalsProvider>
  ),
};
