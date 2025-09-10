"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Skeleton,
} from "@forms/ui";
import {
  AlertCircle,
  CheckCircle,
  CreditCard,
  Database,
  Link2,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sheet,
  Trash2,
  Webhook,
  Zap,
} from "lucide-react";

import { integrationsApi } from "../../lib/api/integrations";

import type { Integration } from "@forms/contracts";

const integrationIcons: Record<string, any> = {
  google_sheets: Sheet,
  slack: MessageSquare,
  notion: Database,
  stripe: CreditCard,
  webhook: Webhook,
  zapier: Zap,
  make: Link2,
  airtable: Database,
  hubspot: Database,
};

const integrationTypes = [
  { value: "google_sheets", label: "Google Sheets", icon: Sheet },
  { value: "slack", label: "Slack", icon: MessageSquare },
  { value: "notion", label: "Notion", icon: Database },
  { value: "airtable", label: "Airtable", icon: Database },
  { value: "hubspot", label: "HubSpot", icon: Database },
  { value: "stripe", label: "Stripe", icon: CreditCard },
  { value: "webhook", label: "Custom Webhook", icon: Webhook },
  { value: "zapier", label: "Zapier", icon: Zap },
  { value: "make", label: "Make", icon: Link2 },
];

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");

  const { data: integrations, isLoading } = useQuery({
    queryKey: ["integrations", searchQuery],
    queryFn: () => integrationsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: integrationsApi.create,
    onSuccess: (integration) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setCreateDialogOpen(false);
      setSelectedType("");

      // If OAuth integration, start OAuth flow
      if (["google_sheets", "slack", "notion"].includes(integration.type)) {
        window.location.href = `/integrations/${integration.id}/oauth`;
      } else {
        toast.success("Integration created successfully");
      }
    },
    onError: () => {
      toast.error("Failed to create integration");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete integration");
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => integrationsApi.sync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast.success("Integration synced successfully");
    },
    onError: () => {
      toast.error("Failed to sync integration");
    },
  });

  const handleCreateIntegration = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      type: selectedType,
      name: formData.get("name") as string,
      config: getInitialConfig(selectedType),
    });
  };

  const getInitialConfig = (type: string): any => {
    switch (type) {
      case "webhook":
        return {
          url: "",
          method: "POST",
          secret: "",
        };
      case "google_sheets":
        return {
          spreadsheet_id: "",
          sheet_name: "Sheet1",
        };
      case "slack":
        return {
          channel: "#general",
        };
      case "notion":
        return {
          database_id: "",
        };
      default:
        return {};
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground mt-1">Connect your forms to external services</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreateIntegration}>
              <DialogHeader>
                <DialogTitle>Add Integration</DialogTitle>
                <DialogDescription>Choose a service to connect with your forms</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!selectedType ? (
                  <div className="grid gap-3">
                    {integrationTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.value}
                          variant="outline"
                          className="justify-start h-auto py-4"
                          onClick={() => setSelectedType(type.value)}
                          type="button"
                        >
                          <Icon className="h-5 w-5 mr-3" />
                          <div className="text-left">
                            <div className="font-semibold">{type.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {getIntegrationDescription(type.value)}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      {(() => {
                        const Icon = integrationIcons[selectedType] || Webhook;
                        return <Icon className="h-5 w-5" />;
                      })()}
                      <div>
                        <div className="font-semibold">
                          {integrationTypes.find((t) => t.value === selectedType)?.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {getIntegrationDescription(selectedType)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Integration Name</Label>
                      <Input id="name" name="name" placeholder="e.g., Main Contact List" required />
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                {selectedType && (
                  <>
                    <Button type="button" variant="outline" onClick={() => setSelectedType("")}>
                      Back
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creating..." : "Create Integration"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Integrations Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations?.data.integrations.map((integration: Integration) => {
            const Icon = integrationIcons[integration.type] || Webhook;
            return (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription>
                          {(integration as any).type_display || integration.type}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={`/integrations/${integration.id}/settings`}>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => syncMutation.mutate(integration.id)}
                          disabled={syncMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this integration?")) {
                              deleteMutation.mutate(integration.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {integration.status === "active" ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Active</span>
                        </>
                      ) : integration.status === "error" ? (
                        <>
                          <AlertCircle className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">Error</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Inactive</span>
                        </>
                      )}
                    </div>

                    {integration.config_display && (
                      <div className="text-sm text-muted-foreground">
                        {Object.entries(integration.config_display).map(([key, value]) => (
                          <div key={key}>
                            <span className="capitalize">{key.replace("_", " ")}: </span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {integration.error_message && (
                      <div className="text-sm text-destructive">{integration.error_message}</div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <a href={`/integrations/${integration.id}/settings`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </a>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {integrations?.data.integrations.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No integrations found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "Try a different search query"
              : "Connect your forms to external services"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function getIntegrationDescription(type: string): string {
  const descriptions: Record<string, string> = {
    google_sheets: "Send form responses to Google Sheets",
    slack: "Get notified in Slack when forms are submitted",
    notion: "Create pages in Notion databases",
    airtable: "Add records to Airtable bases",
    hubspot: "Create contacts in HubSpot CRM",
    stripe: "Accept payments through your forms",
    webhook: "Send data to any URL",
    zapier: "Connect to 5,000+ apps with Zapier",
    make: "Automate workflows with Make",
  };

  return descriptions[type] || "Connect to external service";
}
