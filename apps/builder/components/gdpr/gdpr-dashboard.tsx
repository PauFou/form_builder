"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Trash2,
  FileText,
  Lock,
  Globe,
  Clock,
} from "lucide-react";
import { useOrganization } from "@/lib/hooks/use-organization";
import { api } from "@/lib/api";

interface ComplianceStatus {
  compliant: boolean;
  checks: {
    data_residency: boolean;
    retention_policy: boolean;
    pii_encryption: boolean;
    dpa_signed: boolean;
    privacy_policy: boolean;
  };
  issues: string[];
  last_audit: string;
}

export function GDPRDashboard() {
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (organization) {
      loadComplianceStatus();
    }
  }, [organization]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadComplianceStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/gdpr/compliance/status/?organization=${organization?.id}`);
      setComplianceStatus(response.data as unknown as ComplianceStatus);
    } catch (error) {
      console.error("Failed to load compliance status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading GDPR compliance status...</div>;
  }

  if (!complianceStatus) {
    return <Alert>Failed to load compliance status</Alert>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GDPR Compliance</h1>
          <p className="text-muted-foreground">Manage data protection and privacy compliance</p>
        </div>
        <Badge
          variant={complianceStatus.compliant ? "success" : "destructive"}
          className="text-lg px-4 py-2"
        >
          <Shield className="mr-2 h-5 w-5" />
          {complianceStatus.compliant ? "Compliant" : "Action Required"}
        </Badge>
      </div>

      {complianceStatus.issues.length > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Compliance Issues:</strong>
            <ul className="list-disc ml-5 mt-2">
              {complianceStatus.issues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <ComplianceCard
          title="Data Residency"
          status={complianceStatus.checks.data_residency}
          icon={<Globe className="h-5 w-5" />}
        />
        <ComplianceCard
          title="Retention Policy"
          status={complianceStatus.checks.retention_policy}
          icon={<Clock className="h-5 w-5" />}
        />
        <ComplianceCard
          title="PII Encryption"
          status={complianceStatus.checks.pii_encryption}
          icon={<Lock className="h-5 w-5" />}
        />
        <ComplianceCard
          title="DPA Signed"
          status={complianceStatus.checks.dpa_signed}
          icon={<FileText className="h-5 w-5" />}
        />
        <ComplianceCard
          title="Privacy Policy"
          status={complianceStatus.checks.privacy_policy}
          icon={<Shield className="h-5 w-5" />}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="residency">Data Residency</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="pii">PII Management</TabsTrigger>
          <TabsTrigger value="requests">Data Requests</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="dpa">DPA</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="residency">
          <DataResidencyTab organizationId={organization?.id} />
        </TabsContent>

        <TabsContent value="retention">
          <RetentionPolicyTab organizationId={organization?.id} />
        </TabsContent>

        <TabsContent value="pii">
          <PIIManagementTab />
        </TabsContent>

        <TabsContent value="requests">
          <DataRequestsTab />
        </TabsContent>

        <TabsContent value="consent">
          <ConsentManagementTab />
        </TabsContent>

        <TabsContent value="dpa">
          <DPAManagementTab organizationId={organization?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComplianceCard({
  title,
  status,
  icon,
}: {
  title: string;
  status: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          <div className={status ? "text-green-600" : "text-red-600"}>{icon}</div>
          <span className="font-medium">{title}</span>
        </div>
        {status ? (
          <CheckCircle className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
      </CardContent>
    </Card>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GDPR Compliance Overview</CardTitle>
          <CardDescription>Your organization's data protection and privacy status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Key Metrics</h4>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Active Forms</dt>
                  <dd className="font-mono">24</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">PII Fields</dt>
                  <dd className="font-mono">156</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Data Subjects</dt>
                  <dd className="font-mono">12,458</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Retention Policies</dt>
                  <dd className="font-mono">5</dd>
                </div>
              </dl>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Recent Activity</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-20">
                    Export
                  </Badge>
                  <span>Data export completed for user@example.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-20">
                    Deletion
                  </Badge>
                  <span>Deletion request processed (ID: 4821)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-20">
                    Consent
                  </Badge>
                  <span>Marketing consent withdrawn by 3 users</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Generate Audit Report
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              View Documentation
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DataResidencyTab({ organizationId }: { organizationId?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Residency Configuration</CardTitle>
        <CardDescription>Configure where your data is stored and processed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Primary Region</label>
            <Badge variant="secondary" className="mt-1">
              EU-WEST-1 (Ireland)
            </Badge>
          </div>
          <div>
            <label className="text-sm font-medium">Backup Regions</label>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">EU-CENTRAL-1</Badge>
              <Badge variant="outline">EU-NORTH-1</Badge>
            </div>
          </div>
        </div>

        <Alert>
          <AlertDescription>
            All data is stored exclusively in EU regions to ensure GDPR compliance. Non-EU data
            transfers are blocked by default.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between pt-4">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Enforce EU Residency</label>
            <p className="text-sm text-muted-foreground">
              Block all non-EU webhooks and integrations
            </p>
          </div>
          <Badge variant="success">Enabled</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function RetentionPolicyTab({ organizationId }: { organizationId?: string }) {
  const policies = [
    { type: "Submissions", days: 365, status: "active" },
    { type: "Partial Submissions", days: 30, status: "active" },
    { type: "File Uploads", days: 365, status: "active" },
    { type: "Analytics Events", days: 730, status: "active" },
    { type: "Audit Logs", days: 2555, status: "locked" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Retention Policies</CardTitle>
        <CardDescription>Configure how long different types of data are retained</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {policies.map((policy) => (
            <div
              key={policy.type}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h4 className="font-medium">{policy.type}</h4>
                <p className="text-sm text-muted-foreground">Retained for {policy.days} days</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={policy.status === "locked" ? "secondary" : "default"}>
                  {policy.status}
                </Badge>
                {policy.status !== "locked" && (
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Alert className="mt-4">
          <AlertDescription>
            Data is automatically deleted after the retention period expires. You can configure
            notifications before deletion.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

function PIIManagementTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PII Field Management</CardTitle>
        <CardDescription>Configure encryption and masking for personal data fields</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              All PII fields are automatically encrypted at rest using AES-256 encryption. Data is
              masked when exported unless explicitly requested.
            </AlertDescription>
          </Alert>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">Form</th>
                  <th className="text-left p-3">Field</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Encryption</th>
                  <th className="text-left p-3">Masking</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">Contact Form</td>
                  <td className="p-3">email</td>
                  <td className="p-3">
                    <Badge variant="outline">Email</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="success">Enabled</Badge>
                  </td>
                  <td className="p-3 font-mono text-sm">****@****.***</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">Survey 2024</td>
                  <td className="p-3">phone</td>
                  <td className="p-3">
                    <Badge variant="outline">Phone</Badge>
                  </td>
                  <td className="p-3">
                    <Badge variant="success">Enabled</Badge>
                  </td>
                  <td className="p-3 font-mono text-sm">+** *** *** **89</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataRequestsTab() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Deletion Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-mono">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Processing</span>
                <span className="font-mono">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed (30d)</span>
                <span className="font-mono">28</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              View All Requests
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-mono">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Processing</span>
                <span className="font-mono">1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Completed (7d)</span>
                <span className="font-mono">12</span>
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline">
              View All Requests
            </Button>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertDescription>
          All data requests are processed within 30 days as required by GDPR. Users receive email
          notifications at each step of the process.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function ConsentManagementTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Consent Management</CardTitle>
        <CardDescription>Track and manage user consent for data processing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">8,432</div>
                <p className="text-sm text-muted-foreground">Total Consents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">423</div>
                <p className="text-sm text-muted-foreground">Withdrawn (30d)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">94.8%</div>
                <p className="text-sm text-muted-foreground">Active Rate</p>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Active</th>
                  <th className="text-left p-3">Withdrawn</th>
                  <th className="text-left p-3">Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3">Data Processing</td>
                  <td className="p-3 font-mono">8,432</td>
                  <td className="p-3 font-mono">0</td>
                  <td className="p-3">
                    <Badge variant="success">100%</Badge>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">Marketing</td>
                  <td className="p-3 font-mono">6,234</td>
                  <td className="p-3 font-mono">312</td>
                  <td className="p-3">
                    <Badge>95.2%</Badge>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="p-3">Analytics</td>
                  <td className="p-3 font-mono">7,891</td>
                  <td className="p-3 font-mono">89</td>
                  <td className="p-3">
                    <Badge>98.9%</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DPAManagementTab({ organizationId }: { organizationId?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Processing Agreement</CardTitle>
        <CardDescription>Manage your organization's Data Processing Agreement</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="success">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your DPA is signed and up to date. Last signed on September 1, 2024.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <p className="text-sm text-muted-foreground mt-1">Acme Corporation</p>
          </div>
          <div>
            <label className="text-sm font-medium">Signatory</label>
            <p className="text-sm text-muted-foreground mt-1">John Doe (CEO)</p>
          </div>
          <div>
            <label className="text-sm font-medium">Signed Date</label>
            <p className="text-sm text-muted-foreground mt-1">September 1, 2024</p>
          </div>
          <div>
            <label className="text-sm font-medium">Version</label>
            <p className="text-sm text-muted-foreground mt-1">2.3</p>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download DPA
          </Button>
          <Button variant="outline">View Signature Certificate</Button>
        </div>
      </CardContent>
    </Card>
  );
}
