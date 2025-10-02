/**
 * Webhook-specific commands for the Command Palette
 */

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { webhooksApi } from "../api/webhooks";
import type { Command } from "../types/command-palette";

export function useWebhookCommands() {
  const router = useRouter();

  // Get webhook stats for quick actions
  const { data: stats } = useQuery({
    queryKey: ["webhook-stats"],
    queryFn: () => webhooksApi.getStats().catch(() => null),
    staleTime: 30000, // 30 seconds
    retry: false, // Don't retry on failure
    enabled: typeof window !== 'undefined', // Only run in browser
    throwOnError: false, // Don't throw errors
  });

  // Get recent failed deliveries for quick redrive
  const { data: recentFailures } = useQuery({
    queryKey: ["webhook-deliveries", { status: "failed", limit: 5 }],
    queryFn: async () => {
      try {
        const response = await webhooksApi.getDeliveries({
          status: "failed",
        });
        return response.results.slice(0, 5);
      } catch {
        return []; // Return empty array on error
      }
    },
    staleTime: 10000, // 10 seconds
    retry: false, // Don't retry on failure
    enabled: typeof window !== 'undefined', // Only run in browser
    throwOnError: false, // Don't throw errors
  });

  const webhookCommands: Command[] = [
    // Main webhook navigation
    {
      id: "webhook-dashboard",
      title: "Webhook Dashboard",
      description: "View webhook delivery statistics and monitoring",
      icon: "Activity",
      category: "webhooks",
      keywords: ["webhook", "dashboard", "stats", "monitoring"],
      action: () => {
        router.push("/webhooks");
      },
    },

    // Quick stats
    {
      id: "webhook-failed-today",
      title: `Failed Deliveries Today (${stats?.failed_deliveries_today || 0})`,
      description: "View and redrive today's failed webhook deliveries",
      icon: "AlertTriangle",
      category: "webhooks",
      keywords: ["failed", "deliveries", "today", "error"],
      badge: stats?.failed_deliveries_today ? String(stats.failed_deliveries_today) : undefined,
      action: () => {
        router.push("/webhooks?filter=failed&period=today");
      },
    },

    {
      id: "webhook-success-rate",
      title: `Success Rate: ${stats ? ((stats.successful_deliveries_today / (stats.total_deliveries_today || 1)) * 100).toFixed(1) : "0"}%`,
      description: "View webhook delivery success metrics",
      icon: "TrendingUp",
      category: "webhooks",
      keywords: ["success", "rate", "metrics", "performance"],
      action: () => {
        router.push("/webhooks?view=stats");
      },
    },

    // Bulk actions
    {
      id: "webhook-bulk-redrive",
      title: "Bulk Redrive Failed Deliveries",
      description: "Retry multiple failed webhook deliveries at once",
      icon: "RefreshCw",
      category: "webhooks",
      keywords: ["bulk", "redrive", "retry", "failed", "multiple"],
      disabled: !recentFailures || recentFailures.length === 0,
      action: async () => {
        if (!recentFailures || recentFailures.length === 0) {
          toast.error("No failed deliveries to redrive");
          return;
        }

        try {
          const deliveryIds = recentFailures.map((d) => d.id);
          await webhooksApi.redriveDeliveries({
            delivery_ids: deliveryIds,
            reason: "Bulk redrive from command palette",
          });

          toast.success(`Started redrive job for ${deliveryIds.length} deliveries`);
          router.push("/webhooks?view=redrive-progress");
        } catch (error) {
          toast.error("Failed to start bulk redrive");
        }
      },
    },

    // Quick navigation to integrations
    {
      id: "webhook-settings",
      title: "Webhook Settings",
      description: "Configure webhook endpoints and settings",
      icon: "Settings",
      category: "webhooks",
      keywords: ["webhook", "settings", "configure", "endpoints"],
      action: () => {
        router.push("/integrations?tab=webhooks");
      },
    },

    // Health check
    {
      id: "webhook-health",
      title: "Webhook Health Check",
      description: "Test webhook endpoints and view health status",
      icon: "Shield",
      category: "webhooks",
      keywords: ["health", "check", "test", "status"],
      action: () => {
        router.push("/webhooks?view=health");
      },
    },
  ];

  // Add individual recent failures as quick actions
  if (recentFailures && recentFailures.length > 0) {
    const recentFailureCommands = recentFailures.map((delivery) => ({
      id: `retry-delivery-${delivery.id}`,
      title: `Retry: ${delivery.webhook_name}`,
      description: `Retry failed delivery to ${delivery.webhook_url}`,
      icon: "RotateCcw",
      category: "webhooks" as const,
      keywords: ["retry", "failed", delivery.webhook_name.toLowerCase()],
      badge: "Failed",
      action: async () => {
        try {
          await webhooksApi.retryDelivery(delivery.id);
          toast.success(`Retrying delivery to ${delivery.webhook_name}`);
          router.push(`/webhooks?delivery=${delivery.id}`);
        } catch (error) {
          toast.error("Failed to retry delivery");
        }
      },
    }));

    webhookCommands.push(...recentFailureCommands);
  }

  return webhookCommands;
}
