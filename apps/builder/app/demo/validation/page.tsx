"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, RefreshCw, Key } from "lucide-react";
import {
  validateUniqueKeys,
  generateUniqueKey,
  detectLogicCycles,
  getFieldReferences,
} from "@/lib/validators/form-validators";
import type { Form } from "@skemya/contracts";

export default function ValidationDemoPage() {
  const [demoForm, setDemoForm] = useState<Form>({
    id: "demo-form",
    version: 1,
    title: "Validation Demo Form",
    pages: [
      {
        id: "page1",
        blocks: [
          { id: "field1", type: "text", title: "Name", question: "Name", key: "email" },
          { id: "field2", type: "email", title: "Email", question: "Email", key: "email" },
          { id: "field3", type: "text", title: "Phone", question: "Phone", key: "phone" },
        ],
      },
    ],
    logic: {
      rules: [
        {
          id: "rule1",
          conditions: [{ id: "cond1", field: "field1", operator: "equals", value: "yes" }],
          actions: [{ id: "act1", type: "jump", target: "field2" }],
        },
        {
          id: "rule2",
          conditions: [{ id: "cond2", field: "field2", operator: "equals", value: "no" }],
          actions: [{ id: "act2", type: "jump", target: "field3" }],
        },
        {
          id: "rule3",
          conditions: [{ id: "cond3", field: "field3", operator: "equals", value: "maybe" }],
          actions: [{ id: "act3", type: "jump", target: "field1" }],
        },
      ],
    },
  });

  const [newKey, setNewKey] = useState("");
  const [existingKeys] = useState(new Set(["email", "phone", "name", "address"]));

  const duplicateKeyErrors = validateUniqueKeys(demoForm);
  const logicCycleErrors = detectLogicCycles(demoForm);
  const field1References = getFieldReferences("field1", demoForm);

  const generateKey = () => {
    const uniqueKey = generateUniqueKey(newKey, existingKeys);
    setNewKey(uniqueKey);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Form Validation Demo</h1>
        <p className="text-muted-foreground">
          Demonstrates duplicate key detection, logic cycle detection, and field reference checking
        </p>
      </div>

      {/* Duplicate Key Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Duplicate Key Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Current form has fields with these keys:
            </p>
            <div className="flex flex-wrap gap-2">
              {demoForm.pages[0].blocks.map((block) => (
                <Badge key={block.id} variant="outline">
                  {block.title}: {block.key || block.id}
                </Badge>
              ))}
            </div>
          </div>

          {duplicateKeyErrors.length > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {duplicateKeyErrors.map((error, idx) => (
                  <div key={idx}>{error.message}</div>
                ))}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>All field keys are unique!</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Key Generation */}
      <Card>
        <CardHeader>
          <CardTitle>Unique Key Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Enter a base key</Label>
            <div className="flex gap-2">
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="e.g., email"
              />
              <Button onClick={generateKey}>Generate Unique</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Existing keys: {Array.from(existingKeys).join(", ")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logic Cycle Detection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Logic Cycle Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Current logic rules create this flow:</p>
            <div className="flex items-center gap-2 text-sm font-mono">
              <Badge>field1</Badge>
              <span>→</span>
              <Badge>field2</Badge>
              <span>→</span>
              <Badge>field3</Badge>
              <span>→</span>
              <Badge variant="destructive">field1</Badge>
              <span className="text-red-500">(cycle!)</span>
            </div>
          </div>

          {logicCycleErrors.length > 0 ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {logicCycleErrors.map((error, idx) => (
                  <div key={idx}>{error.message}</div>
                ))}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>No logic cycles detected!</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Field References */}
      <Card>
        <CardHeader>
          <CardTitle>Field Reference Detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Checking references for field1 (Name):</p>
            {field1References.isReferenced ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold">
                    This field is referenced in {field1References.rules.length} logic rule(s)
                  </p>
                  <p className="text-sm mt-1">
                    Reference types: {field1References.referenceTypes.join(", ")}
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>This field is not referenced in any logic rules</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
