"use client";

import { useEffect, useState } from "react";
import { Button } from "@skemya/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@skemya/ui";
import { clearAuthStorage, validateAuthStorage } from "@/lib/utils/clear-auth-storage";

export default function AuthDebugPage() {
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [isValid, setIsValid] = useState(true);

  const checkStorage = () => {
    const data: Record<string, any> = {};

    // Check all auth-related items
    const keys = ["access_token", "refresh_token", "auth-storage"];

    keys.forEach((key) => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          // Try to parse if it looks like JSON
          if (value.startsWith("{") || value.startsWith("[")) {
            data[key] = JSON.parse(value);
          } else {
            data[key] = value;
          }
        } else {
          data[key] = null;
        }
      } catch (error) {
        data[key] = { error: String(error), raw: localStorage.getItem(key) };
      }
    });

    // Check cookies
    data.cookies = document.cookie;

    setStorageData(data);
    setIsValid(validateAuthStorage());
  };

  useEffect(() => {
    checkStorage();
  }, []);

  const handleClearStorage = () => {
    clearAuthStorage();
    checkStorage();
  };

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth Debug Tool</CardTitle>
            <CardDescription>
              Inspect and clear authentication storage to resolve issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <span>Storage Valid:</span>
              <span className={isValid ? "text-green-600" : "text-red-600"}>
                {isValid ? "Yes" : "No"}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Storage Contents:</h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(storageData, null, 2)}
              </pre>
            </div>

            <div className="flex gap-4">
              <Button onClick={checkStorage}>Refresh</Button>
              <Button onClick={handleClearStorage} variant="destructive">
                Clear Auth Storage
              </Button>
              <Button onClick={() => (window.location.href = "/auth/login")} variant="outline">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
