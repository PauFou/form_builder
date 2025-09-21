"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Checkbox,
  Label,
} from "@skemya/ui";
import { Trash2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { useGDPRStore } from "../../lib/stores/gdpr-store";

interface DataDeletionProps {
  userId: string;
}

export function DataDeletion({ userId }: DataDeletionProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [open, setOpen] = useState(false);
  const { deleteData, deletionStatus, deletionError } = useGDPRStore();

  const handleDelete = async () => {
    await deleteData(userId);
    setOpen(false);
    setConfirmed(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete Personal Data</CardTitle>
        <CardDescription>
          Permanently delete all your personal data from our systems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> This action cannot be undone. All your data will be
            permanently deleted, including:
            <ul className="mt-2 list-disc list-inside">
              <li>Form submissions</li>
              <li>Personal information</li>
              <li>Account data</li>
            </ul>
          </AlertDescription>
        </Alert>

        {deletionStatus === "success" && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Your data has been deleted successfully.</AlertDescription>
          </Alert>
        )}

        {deletionStatus === "error" && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>Failed to delete data. {deletionError}</AlertDescription>
          </Alert>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={deletionStatus === "loading"}
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deletionStatus === "loading" ? "Deleting..." : "Delete All Data"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This will permanently delete all your personal data from our systems. This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                />
                <Label htmlFor="confirm" className="text-sm">
                  I understand that this action is permanent and cannot be undone
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={!confirmed}>
                Delete Everything
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
