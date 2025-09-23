"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";
import {
  Webhook as WebhookIcon,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Play,
  MoreVertical,
  Eye,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Shield,
  X,
  Calendar,
  BarChart3,
  Users,
  Settings,
  Plus,
  ArrowRight,
  Download,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Progress,
  Alert,
  AlertDescription,
  Separator,
} from "@skemya/ui";

import {
  webhooksApi,
  MOCK_WEBHOOKS,
  MOCK_DELIVERIES,
  MOCK_WEBHOOK_STATS,
} from "../../lib/api/webhooks";
import { HTTP_STATUS_CODES, WEBHOOK_EVENTS } from "../../lib/types/webhooks";
import type {
  Webhook,
  WebhookDelivery,
  WebhookFilters,
  RedriveJob,
} from "../../lib/types/webhooks";
import { cn } from "../../lib/utils";

function WebhookStatsCards({ stats }: { stats: typeof MOCK_WEBHOOK_STATS }) {
  const successRate =
    stats.total_deliveries_today > 0
      ? (stats.successful_deliveries_today / stats.total_deliveries_today) * 100
      : 0;

  const statsData = [
    {
      label: "Total Deliveries Today",
      value: stats.total_deliveries_today,
      change: "+12% vs yesterday",
      trend: "up" as const,
      icon: Activity,
      color: "text-blue-600",
    },
    {
      label: "Success Rate",
      value: `${successRate.toFixed(1)}%`,
      change: "+2.3% vs yesterday",
      trend: "up" as const,
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      label: "Failed Deliveries",
      value: stats.failed_deliveries_today,
      change: "-15% vs yesterday",
      trend: "down" as const,
      icon: AlertTriangle,
      color: "text-red-600",
    },
    {
      label: "Avg Response Time",
      value: `${stats.avg_response_time_today}ms`,
      change: "-8ms vs yesterday",
      trend: "down" as const,
      icon: Zap,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="hover-lift">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 mb-2">{stat.value}</p>
                  <p
                    className={cn(
                      "text-xs flex items-center gap-1",
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {stat.change}
                  </p>
                </div>
                <div className="icon-box-sm">
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function WebhookDeliveriesTable() {
  const [selectedDeliveries, setSelectedDeliveries] = useState<string[]>([]);
  const [filters, setFilters] = useState<WebhookFilters>({});
  const [selectedDelivery, setSelectedDelivery] = useState<WebhookDelivery | null>(null);
  const [redriveJobId, setRedriveJobId] = useState<string | null>(null);
  const [showRedriveDialog, setShowRedriveDialog] = useState(false);

  const {
    data: deliveries = MOCK_DELIVERIES,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["webhook-deliveries", filters],
    queryFn: async () => {
      const response = await webhooksApi.getDeliveries(filters);
      return response.results;
    },
  });

  const { data: webhooks = MOCK_WEBHOOKS } = useQuery({
    queryKey: ["webhooks"],
    queryFn: webhooksApi.list,
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDeliveries(deliveries.filter((d) => d.status === "failed").map((d) => d.id));
    } else {
      setSelectedDeliveries([]);
    }
  };

  const handleSelectDelivery = (deliveryId: string, checked: boolean) => {
    if (checked) {
      setSelectedDeliveries([...selectedDeliveries, deliveryId]);
    } else {
      setSelectedDeliveries(selectedDeliveries.filter((id) => id !== deliveryId));
    }
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    try {
      await webhooksApi.retryDelivery(deliveryId);
      toast.success("Delivery queued for retry");
      refetch();
    } catch (error) {
      toast.error("Failed to retry delivery");
    }
  };

  const handleBulkRedrive = async () => {
    if (selectedDeliveries.length === 0) return;

    try {
      const response = await webhooksApi.redriveDeliveries({
        delivery_ids: selectedDeliveries,
        reason: "Manual bulk redrive from webhook management interface",
      });

      setRedriveJobId(response.job_id);
      setShowRedriveDialog(false);
      setSelectedDeliveries([]);
      toast.success(`Redrive job started for ${response.total_requested} deliveries`);
    } catch (error) {
      toast.error("Failed to start redrive job");
    }
  };

  const getStatusBadge = (status: WebhookDelivery["status"]) => {
    const config = {
      success: {
        variant: "default" as const,
        className: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      failed: { variant: "destructive" as const, className: "", icon: AlertTriangle },
      pending: {
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-800",
        icon: Clock,
      },
      retrying: {
        variant: "secondary" as const,
        className: "bg-yellow-100 text-yellow-800",
        icon: RefreshCw,
      },
    };

    const { variant, className, icon: Icon } = config[status];

    return (
      <Badge variant={variant} className={cn("flex items-center gap-1", className)}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getResponseStatusBadge = (status?: number) => {
    if (!status) return null;

    const isSuccess = status >= 200 && status < 300;
    const isClientError = status >= 400 && status < 500;
    const isServerError = status >= 500;

    return (
      <Badge
        variant="outline"
        className={cn(
          "text-xs",
          isSuccess && "border-green-500/50 text-green-700 bg-green-50/50",
          isClientError && "border-yellow-500/50 text-yellow-700 bg-yellow-50/50",
          isServerError && "border-red-500/50 text-red-700 bg-red-50/50"
        )}
      >
        {status}
      </Badge>
    );
  };

  const failedDeliveries = deliveries.filter((d) => d.status === "failed");
  const canSelectAll = failedDeliveries.length > 0;
  const allFailedSelected =
    failedDeliveries.length > 0 && failedDeliveries.every((d) => selectedDeliveries.includes(d.id));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deliveries..."
                  value={filters.search || ""}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Webhook</label>
              <Select
                value={filters.webhook_id || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    webhook_id: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All webhooks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All webhooks</SelectItem>
                  {webhooks.map((webhook) => (
                    <SelectItem key={webhook.id} value={webhook.id}>
                      {webhook.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    status: value === "all" ? undefined : (value as WebhookDelivery["status"]),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="retrying">Retrying</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Event Type</label>
              <Select
                value={filters.event_type || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    event_type: value === "all" ? undefined : (value as any),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All events</SelectItem>
                  {WEBHOOK_EVENTS.map((event) => (
                    <SelectItem key={event.value} value={event.value}>
                      {event.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedDeliveries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {selectedDeliveries.length} deliveries selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setShowRedriveDialog(true)}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Redrive Selected
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedDeliveries([])}>
              Clear Selection
            </Button>
          </div>
        </motion.div>
      )}

      {/* Deliveries Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Webhook Deliveries
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-muted rounded-lg h-16" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allFailedSelected}
                      onCheckedChange={handleSelectAll}
                      disabled={!canSelectAll}
                    />
                  </TableHead>
                  <TableHead>Webhook</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((delivery) => (
                  <TableRow
                    key={delivery.id}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50",
                      selectedDeliveries.includes(delivery.id) && "bg-primary/5"
                    )}
                    onClick={() => setSelectedDelivery(delivery)}
                  >
                    <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedDeliveries.includes(delivery.id)}
                        onCheckedChange={(checked) =>
                          handleSelectDelivery(delivery.id, checked as boolean)
                        }
                        disabled={delivery.status !== "failed"}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{delivery.webhook_name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {delivery.webhook_url}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {delivery.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                    <TableCell>{getResponseStatusBadge(delivery.response_status)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {delivery.attempt_number}/{delivery.max_attempts}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {format(new Date(delivery.created_at), "MMM d, HH:mm")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(delivery.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedDelivery(delivery)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {delivery.status === "failed" && (
                            <DropdownMenuItem onClick={() => handleRetryDelivery(delivery.id)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Retry
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(delivery.id)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy ID
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <a
                              href={delivery.webhook_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Open Webhook URL
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delivery Details Sheet */}
      <Sheet open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
        <SheetContent className="w-full sm:max-w-2xl">
          {selectedDelivery && (
            <DeliveryDetailsPanel
              delivery={selectedDelivery}
              onRetry={handleRetryDelivery}
              onClose={() => setSelectedDelivery(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Bulk Redrive Dialog */}
      <Dialog open={showRedriveDialog} onOpenChange={setShowRedriveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redrive Selected Deliveries</DialogTitle>
            <DialogDescription>
              This will retry {selectedDeliveries.length} failed webhook deliveries. The retries
              will be queued and processed in the background.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Make sure the webhook endpoints are ready to receive these requests. Duplicate
              deliveries may occur if the original requests succeeded after failing.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRedriveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkRedrive}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Start Redrive Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redrive Job Progress */}
      {redriveJobId && (
        <RedriveJobProgress
          jobId={redriveJobId}
          onComplete={() => {
            setRedriveJobId(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function DeliveryDetailsPanel({
  delivery,
  onRetry,
  onClose,
}: {
  delivery: WebhookDelivery;
  onRetry: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>Delivery Details</SheetTitle>
        <SheetDescription>Webhook delivery #{delivery.id.slice(-8)}</SheetDescription>
      </SheetHeader>

      <div className="space-y-4">
        {/* Status and Basic Info */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <div className="mt-1">
                  {delivery.status === "success" && (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  )}
                  {delivery.status === "failed" && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  {delivery.status === "pending" && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  )}
                  {delivery.status === "retrying" && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retrying
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Response Status</label>
                <div className="mt-1">
                  {delivery.response_status ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        delivery.response_status >= 200 &&
                          delivery.response_status < 300 &&
                          "border-green-500/50 text-green-700 bg-green-50/50",
                        delivery.response_status >= 400 &&
                          delivery.response_status < 500 &&
                          "border-yellow-500/50 text-yellow-700 bg-yellow-50/50",
                        delivery.response_status >= 500 &&
                          "border-red-500/50 text-red-700 bg-red-50/50"
                      )}
                    >
                      {delivery.response_status}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Attempt</label>
                <p className="text-sm mt-1">
                  {delivery.attempt_number} of {delivery.max_attempts}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Response Time</label>
                <p className="text-sm mt-1">
                  {delivery.response_time_ms ? `${delivery.response_time_ms}ms` : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Webhook Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <p className="text-sm mt-1">{delivery.webhook_name}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">URL</label>
              <p className="text-sm mt-1 font-mono bg-muted p-2 rounded break-all">
                {delivery.webhook_url}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Event Type</label>
              <p className="text-sm mt-1">{delivery.event_type}</p>
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {delivery.error_message && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-destructive">Error Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-mono text-sm">
                  {delivery.error_message}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Request/Response Details */}
        <Tabs defaultValue="request" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="request">Request</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request Headers</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                  {JSON.stringify(delivery.request_headers, null, 2)}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request Payload</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                  {JSON.stringify(delivery.request_payload, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="response" className="space-y-4">
            {delivery.response_headers && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Response Headers</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                    {JSON.stringify(delivery.response_headers, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {delivery.response_body && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Response Body</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                    {delivery.response_body}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          {delivery.status === "failed" && (
            <Button
              onClick={() => {
                onRetry(delivery.id);
                onClose();
              }}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Delivery
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigator.clipboard.writeText(JSON.stringify(delivery, null, 2))}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Details
          </Button>
        </div>
      </div>
    </div>
  );
}

function RedriveJobProgress({ jobId, onComplete }: { jobId: string; onComplete: () => void }) {
  const { data: job } = useQuery({
    queryKey: ["redrive-job", jobId],
    queryFn: () => webhooksApi.getRedriveJob(jobId),
    refetchInterval: (query) => {
      const job = query.state.data;
      return job?.status === "completed" ? false : 2000;
    },
  });

  if (!job) return null;

  if (job.status === "completed") {
    setTimeout(onComplete, 3000); // Auto-close after 3 seconds
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <Card className="w-80 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className={cn("h-4 w-4", job.status === "processing" && "animate-spin")} />
            Redrive Job {job.status === "completed" ? "Complete" : "In Progress"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{job.progress_percentage}%</span>
            </div>
            <Progress value={job.progress_percentage} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-medium">{job.total_deliveries}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Success</p>
              <p className="font-medium text-green-600">{job.successful_redrives}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Failed</p>
              <p className="font-medium text-red-600">{job.failed_redrives}</p>
            </div>
          </div>

          {job.status === "completed" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Redrive job completed successfully
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function WebhooksPage() {
  const { data: stats = MOCK_WEBHOOK_STATS } = useQuery({
    queryKey: ["webhook-stats"],
    queryFn: () => webhooksApi.getStats(),
  });

  return (
    <div className="min-h-screen">
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-blur-1" />
        <div className="aurora-blur-2" />
        <div className="aurora-pulse" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <WebhookIcon className="h-8 w-8 text-primary" />
                  Webhook Management
                </h1>
                <p className="text-muted-foreground">
                  Monitor deliveries, manage failures, and redrive webhook requests
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="outline" asChild>
                  <a href="/integrations">
                    <Settings className="mr-2 h-4 w-4" />
                    Webhook Settings
                  </a>
                </Button>
                <Button asChild>
                  <a href="/integrations">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Webhook
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          <WebhookStatsCards stats={stats} />
          <WebhookDeliveriesTable />
        </div>
      </div>
    </div>
  );
}
