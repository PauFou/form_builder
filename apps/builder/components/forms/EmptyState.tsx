import React from "react";
import { Button } from "@skemya/ui";
import { Plus, UserPlus, Info } from "lucide-react";

interface EmptyStateProps {
  onCreateForm: () => void;
  onInviteTeam: () => void;
}

export function EmptyState({ onCreateForm, onInviteTeam }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-full border-2 border-gray-300 flex items-center justify-center">
          <Info className="h-8 w-8 text-gray-400" />
        </div>

        {/* Message */}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No forms created in this workspace yet.
        </h3>
        <p className="text-sm text-gray-600 mb-8">What would you like to do?</p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={onCreateForm}
            className="h-10 px-6 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-md shadow-sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Form
          </Button>
          <Button
            onClick={onInviteTeam}
            className="h-10 px-6 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium rounded-md shadow-sm"
            variant="outline"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team
          </Button>
        </div>
      </div>
    </div>
  );
}
