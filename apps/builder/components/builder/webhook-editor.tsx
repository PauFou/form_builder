"use client";

import { useState } from "react";
import { Button, Input, Label, Card, CardContent, Switch, Badge } from "@forms/ui";
import { Plus, Trash2, ExternalLink, Key, Globe } from "lucide-react";
import type { Form } from "@forms/contracts";

interface Webhook {
  id: string;
  url: string;
  secret: string;
  active: boolean;
  headers?: Record<string, string>;
  includePartials?: boolean;
}

interface WebhookEditorProps {
  form: Form | null;
  onUpdate: (webhooks: Webhook[]) => void;
}

export function WebhookEditor({ form, onUpdate }: WebhookEditorProps) {
  const webhooks: Webhook[] = form?.webhooks || [];
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const addWebhook = () => {
    const newWebhook: Webhook = {
      id: `webhook-${Date.now()}`,
      url: "",
      secret: generateSecret(),
      active: true,
      includePartials: false,
    };
    onUpdate([...webhooks, newWebhook]);
  };

  const updateWebhook = (webhookId: string, updates: Partial<Webhook>) => {
    const updated = webhooks.map((webhook) =>
      webhook.id === webhookId ? { ...webhook, ...updates } : webhook
    );
    onUpdate(updated);
  };

  const deleteWebhook = (webhookId: string) => {
    onUpdate(webhooks.filter((webhook) => webhook.id !== webhookId));
  };

  const generateSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let secret = "whsec_";
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const toggleShowSecret = (webhookId: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [webhookId]: !prev[webhookId],
    }));
  };

  return (
    <div className="space-y-3">
      {webhooks.map((webhook) => (
        <Card key={webhook.id}>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* URL */}
                <div className="space-y-2">
                  <Label htmlFor={`url-${webhook.id}`} className="flex items-center gap-2">
                    <Globe className="h-3 w-3" />
                    Webhook URL
                  </Label>
                  <Input
                    id={`url-${webhook.id}`}
                    type="url"
                    value={webhook.url}
                    onChange={(e) => updateWebhook(webhook.id, { url: e.target.value })}
                    placeholder="https://example.com/webhook"
                  />
                </div>

                {/* Secret */}
                <div className="space-y-2">
                  <Label htmlFor={`secret-${webhook.id}`} className="flex items-center gap-2">
                    <Key className="h-3 w-3" />
                    Signing Secret
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={`secret-${webhook.id}`}
                      type={showSecrets[webhook.id] ? "text" : "password"}
                      value={webhook.secret}
                      onChange={(e) => updateWebhook(webhook.id, { secret: e.target.value })}
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleShowSecret(webhook.id)}
                    >
                      {showSecrets[webhook.id] ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateWebhook(webhook.id, { secret: generateSecret() })}
                    >
                      Regenerate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use this secret to verify webhook signatures
                  </p>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={`active-${webhook.id}`} className="text-sm">
                        Active
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Enable or disable this webhook
                      </p>
                    </div>
                    <Switch
                      id={`active-${webhook.id}`}
                      checked={webhook.active}
                      onCheckedChange={(checked) => updateWebhook(webhook.id, { active: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={`partials-${webhook.id}`} className="text-sm">
                        Include partial submissions
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Send webhook for incomplete responses
                      </p>
                    </div>
                    <Switch
                      id={`partials-${webhook.id}`}
                      checked={webhook.includePartials || false}
                      onCheckedChange={(checked) =>
                        updateWebhook(webhook.id, { includePartials: checked })
                      }
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge variant={webhook.active ? "default" : "secondary"}>
                    {webhook.active ? "Active" : "Inactive"}
                  </Badge>
                  {webhook.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(webhook.url, "_blank")}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteWebhook(webhook.id)}
                className="ml-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" size="sm" onClick={addWebhook} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Webhook
      </Button>

      {webhooks.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground">No webhooks configured</div>
      )}

      {webhooks.length > 0 && (
        <div className="mt-4 p-3 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Webhook payload includes:</strong> form data, submission ID, timestamp,
            respondent info, and metadata. Webhooks are signed with HMAC-SHA256 for security.
          </p>
        </div>
      )}
    </div>
  );
}
