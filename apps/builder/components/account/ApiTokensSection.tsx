"use client";

import React, { useState } from "react";
import { Plus, Copy, Trash2, Key, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
} from "@skemya/ui";
import { cn } from "../../lib/utils";

interface ApiToken {
  id: string;
  name: string;
  token: string;
  created_at: string;
  last_used?: string;
}

interface CreateTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<{ token: string; id: string }>;
}

function CreateTokenModal({ isOpen, onClose, onCreate }: CreateTokenModalProps) {
  const [tokenName, setTokenName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!tokenName.trim()) return;

    setIsCreating(true);
    try {
      const result = await onCreate(tokenName);
      setCreatedToken(result.token);
    } catch (error) {
      console.error("Failed to create token:", error);
      alert("Failed to create API token");
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopy = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setTokenName("");
    setCreatedToken(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {createdToken ? "API Token Created" : "Create API Token"}
          </DialogTitle>
        </DialogHeader>

        {!createdToken ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="token-name">Token Name</Label>
              <Input
                id="token-name"
                placeholder="My API Token"
                value={tokenName}
                onChange={(e) => setTokenName(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-gray-500">
                Give your token a descriptive name to identify its purpose
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                Make sure to copy your API token now. You won't be able to see it again!
              </p>
            </div>

            <div className="space-y-2">
              <Label>Your API Token</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={createdToken}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className={cn(
                    "flex-shrink-0",
                    copied && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                API Documentation
              </h4>
              <p className="text-sm text-blue-800 mb-2">
                Use this token in your API requests:
              </p>
              <code className="block p-2 bg-blue-100 rounded text-xs font-mono">
                Authorization: Bearer {"{"}your_token{"}"}
              </code>
            </div>
          </div>
        )}

        <DialogFooter>
          {!createdToken ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isCreating || !tokenName.trim()}>
                {isCreating ? "Creating..." : "Create Token"}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApiTokensSection() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());

  const handleCreateToken = async (name: string): Promise<{ token: string; id: string }> => {
    // TODO: Call actual API
    const mockToken = {
      id: crypto.randomUUID(),
      name,
      token: `yfm_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      created_at: new Date().toISOString(),
    };

    setTokens((prev) => [...prev, mockToken]);
    return { token: mockToken.token, id: mockToken.id };
  };

  const handleDeleteToken = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API token? This action cannot be undone.")) {
      return;
    }

    // TODO: Call actual API
    setTokens((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTokenVisibility = (id: string) => {
    setVisibleTokens((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">API Tokens</h3>
          <p className="text-sm text-gray-600">
            All your API tokens below. Use these to access the API programmatically.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create New Token
        </Button>
      </div>

      {tokens.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-base font-medium text-gray-900 mb-2">No tokens created yet</h4>
          <p className="text-sm text-gray-600 mb-6">
            Create your first API token to start using the API
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create New Token
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.map((token) => {
            const isVisible = visibleTokens.has(token.id);
            const displayToken = isVisible
              ? token.token
              : `${token.token.substring(0, 10)}${"•".repeat(30)}`;

            return (
              <div
                key={token.id}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                      {token.name}
                    </h4>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        {displayToken}
                      </code>
                      <button
                        onClick={() => toggleTokenVisibility(token.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title={isVisible ? "Hide token" : "Show token"}
                      >
                        {isVisible ? (
                          <EyeOff className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopyToken(token.token)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Copy token"
                      >
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        Created:{" "}
                        {new Date(token.created_at).toLocaleDateString()}
                      </span>
                      {token.last_used && (
                        <span>
                          Last used:{" "}
                          {new Date(token.last_used).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteToken(token.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete token"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateTokenModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateToken}
      />
    </div>
  );
}
