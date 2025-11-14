import React from "react";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@skemya/ui";
import { cn } from "../../../lib/utils";

export type IntegrationStatus = "not_connected" | "connecting" | "connected" | "error";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  status: IntegrationStatus;
  proBadge?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onConfigure?: () => void;
  setupGuideUrl?: string;
  children?: React.ReactNode;
  isExpanded?: boolean;
}

export function IntegrationCard({
  name,
  description,
  icon,
  status,
  proBadge = false,
  onConnect,
  onDisconnect,
  onConfigure,
  setupGuideUrl,
  children,
  isExpanded = false,
}: IntegrationCardProps) {
  const [isOpen, setIsOpen] = React.useState(isExpanded);

  const getStatusBadge = () => {
    switch (status) {
      case "connected":
        return (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">Connected</span>
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Error</span>
          </div>
        );
      case "connecting":
        return (
          <div className="flex items-center gap-1.5 text-sm text-blue-600">
            <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <span className="font-medium">Connecting...</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getActionButton = () => {
    if (status === "connected") {
      return (
        <div className="flex items-center gap-2">
          {onConfigure && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure();
              }}
            >
              Configure
            </Button>
          )}
          {onDisconnect && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onDisconnect();
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Disconnect
            </Button>
          )}
        </div>
      );
    }

    if (status === "connecting") {
      return (
        <Button size="sm" disabled>
          Connecting...
        </Button>
      );
    }

    return (
      <Button
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          if (onConnect) {
            onConnect();
          } else {
            setIsOpen(!isOpen);
          }
        }}
      >
        {onConnect ? "Authorize" : "Connect"}
      </Button>
    );
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-gray-300 transition-colors">
      {/* Header */}
      <button
        onClick={() => status === "not_connected" && setIsOpen(!isOpen)}
        className={cn(
          "w-full p-4 flex items-center gap-4 text-left",
          status === "not_connected" && "cursor-pointer hover:bg-gray-50"
        )}
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-medium text-gray-900">{name}</h3>
            {proBadge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700">
                PRO
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-1">{description}</p>
        </div>

        {/* Status & Action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {getStatusBadge()}
          {getActionButton()}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && status === "not_connected" && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          {children || (
            <div className="text-sm text-gray-600">
              <p className="mb-3">{description}</p>
              {setupGuideUrl && (
                <a
                  href={setupGuideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  Check setup guide
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Connected Configuration */}
      {status === "connected" && children && (
        <div className="p-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
}
