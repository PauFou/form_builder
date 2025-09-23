"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  Building,
  Users,
  CreditCard,
  Settings as SettingsIcon,
  Shield,
  FileText,
  Plus,
  Mail,
  MoreVertical,
  Crown,
  UserCheck,
  Edit,
  Trash2,
  Download,
  Upload,
  Camera,
  Globe,
  Lock,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Label,
  Separator,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Progress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@skemya/ui";

import {
  organizationApi,
  MOCK_ORGANIZATION,
  MOCK_MEMBERS,
  MOCK_INVOICES,
} from "../../lib/api/organization";
import { PLAN_FEATURES, ROLE_PERMISSIONS } from "../../lib/types/organization";
import type {
  Organization,
  OrganizationMember,
  InviteMemberRequest,
} from "../../lib/types/organization";
import { cn } from "../../lib/utils";

function OrganizationOverview({ organization }: { organization: Organization }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: organization.name,
    description: organization.description || "",
    website_url: organization.website_url || "",
    billing_email: organization.billing_email,
  });

  const handleSave = async () => {
    try {
      await organizationApi.update(formData);
      toast.success("Organization updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update organization");
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await organizationApi.uploadLogo(file);
      toast.success("Logo updated successfully");
    } catch (error) {
      toast.error("Failed to upload logo");
    }
  };

  const currentPlan = PLAN_FEATURES[organization.plan];
  const usagePercentages = {
    forms:
      organization.limits.forms > 0
        ? (organization.usage.forms_count / organization.limits.forms) * 100
        : 0,
    submissions:
      (organization.usage.submissions_this_month / organization.limits.submissions_per_month) * 100,
    members: (organization.usage.team_members_count / organization.limits.team_members) * 100,
    storage: (organization.usage.storage_used_mb / organization.limits.storage_mb) * 100,
  };

  return (
    <div className="space-y-6">
      {/* Organization Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organization Details
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            {isEditing ? "Save" : "Edit"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={organization.logo_url} alt={organization.name} />
                <AvatarFallback className="text-lg">
                  {organization.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <label className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold">{organization.name}</h3>
                <Badge className="capitalize bg-gradient-to-r from-primary to-primary/80 text-white">
                  {organization.plan}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Created {format(new Date(organization.created_at), "MMMM d, yyyy")}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="org_name">Organization Name</Label>
              <Input
                id="org_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_email">Billing Email</Label>
              <Input
                id="billing_email"
                type="email"
                value={formData.billing_email}
                onChange={(e) => setFormData({ ...formData, billing_email: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url">Website URL</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                disabled={!isEditing}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom_domain">Custom Domain</Label>
              <Input
                id="custom_domain"
                value={organization.settings.custom_domain || ""}
                disabled
                placeholder="forms.yourcompany.com"
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Contact support to configure custom domains
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={!isEditing}
              placeholder="Tell us about your organization..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Overview
          </CardTitle>
          <p className="text-sm text-muted-foreground">Your current usage across all plan limits</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Forms</Label>
                <span className="text-sm text-muted-foreground">
                  {organization.usage.forms_count} /{" "}
                  {organization.limits.forms > 0 ? organization.limits.forms : "∞"}
                </span>
              </div>
              <Progress value={usagePercentages.forms} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Submissions</Label>
                <span className="text-sm text-muted-foreground">
                  {organization.usage.submissions_this_month.toLocaleString()} /{" "}
                  {organization.limits.submissions_per_month.toLocaleString()}
                </span>
              </div>
              <Progress value={usagePercentages.submissions} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Team Members</Label>
                <span className="text-sm text-muted-foreground">
                  {organization.usage.team_members_count} / {organization.limits.team_members}
                </span>
              </div>
              <Progress value={usagePercentages.members} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Storage</Label>
                <span className="text-sm text-muted-foreground">
                  {organization.usage.storage_used_mb} MB / {organization.limits.storage_mb} MB
                </span>
              </div>
              <Progress value={usagePercentages.storage} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamManagement({ organization }: { organization: Organization }) {
  const { data: members = MOCK_MEMBERS } = useQuery({
    queryKey: ["organization-members"],
    queryFn: organizationApi.getMembers,
  });

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState<InviteMemberRequest>({
    email: "",
    role: "editor",
  });

  const handleInviteMember = async () => {
    try {
      await organizationApi.inviteMember(inviteData);
      toast.success("Invitation sent successfully");
      setShowInviteDialog(false);
      setInviteData({ email: "", role: "editor" });
    } catch (error) {
      toast.error("Failed to send invitation");
    }
  };

  const handleUpdateRole = async (memberId: string, role: OrganizationMember["role"]) => {
    try {
      await organizationApi.updateMember(memberId, { role });
      toast.success("Member role updated");
    } catch (error) {
      toast.error("Failed to update member role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await organizationApi.removeMember(memberId);
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "editor":
        return <Edit className="h-4 w-4 text-green-500" />;
      case "viewer":
        return <Users className="h-4 w-4 text-gray-500" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {members.length} of {organization.limits.team_members} members
            </p>
          </div>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>Send an invitation to join your organization</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invite_email">Email Address</Label>
                  <Input
                    id="invite_email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite_role">Role</Label>
                  <Select
                    value={inviteData.role}
                    onValueChange={(value: any) => setInviteData({ ...inviteData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">
                        Viewer - Can view forms and submissions
                      </SelectItem>
                      <SelectItem value="editor">Editor - Can create and edit forms</SelectItem>
                      <SelectItem value="admin">Admin - Full access except billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteMember} disabled={!inviteData.email}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={member.avatar_url} alt={member.first_name} />
                    <AvatarFallback>
                      {member.first_name?.[0]}
                      {member.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                      {member.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active: {format(new Date(member.last_active), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(member.role)}
                    <Badge variant="outline" className="capitalize">
                      {member.role}
                    </Badge>
                  </div>

                  {member.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "admin")}>
                          Change to Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "editor")}>
                          Change to Editor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateRole(member.id, "viewer")}>
                          Change to Viewer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingSettings({ organization }: { organization: Organization }) {
  const { data: invoices = MOCK_INVOICES } = useQuery({
    queryKey: ["organization-invoices"],
    queryFn: organizationApi.getInvoices,
  });

  const currentPlan = PLAN_FEATURES[organization.plan];

  const handleUpgrade = async (plan: Organization["plan"]) => {
    try {
      const result = await organizationApi.changePlan(plan);
      if (result.checkout_url) {
        window.open(result.checkout_url, "_blank");
      } else {
        toast.success("Plan changed successfully");
      }
    } catch (error) {
      toast.error("Failed to change plan");
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
              <p className="text-muted-foreground">
                {currentPlan.price ? `$${currentPlan.price}/month` : "Custom pricing"}
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white">
              Current Plan
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upgrade or downgrade your plan at any time
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(PLAN_FEATURES).map(([planKey, plan]) => (
              <div
                key={planKey}
                className={cn(
                  "p-4 border rounded-lg relative",
                  planKey === organization.plan && "border-primary bg-primary/5"
                )}
              >
                {planKey === organization.plan && (
                  <Badge className="absolute -top-2 left-4 bg-primary text-white">Current</Badge>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">{plan.name}</h4>
                    <p className="text-2xl font-bold">
                      {plan.price ? `$${plan.price}` : "Custom"}
                      {plan.price && (
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                      )}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs">{feature}</span>
                      </div>
                    ))}
                    {plan.features.length > 4 && (
                      <p className="text-xs text-muted-foreground">
                        +{plan.features.length - 4} more features
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant={planKey === organization.plan ? "outline" : "default"}
                    className="w-full"
                    disabled={planKey === organization.plan}
                    onClick={() => handleUpgrade(planKey as Organization["plan"])}
                  >
                    {planKey === organization.plan
                      ? "Current Plan"
                      : planKey === "enterprise"
                        ? "Contact Sales"
                        : "Upgrade"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Billing History</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.number}</TableCell>
                  <TableCell>{format(new Date(invoice.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={invoice.status === "paid" ? "default" : "secondary"}
                      className={cn(
                        invoice.status === "paid" && "bg-green-100 text-green-800",
                        invoice.status === "pending" && "bg-yellow-100 text-yellow-800",
                        invoice.status === "failed" && "bg-red-100 text-red-800"
                      )}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizationSettings({ organization }: { organization: Organization }) {
  const [settings, setSettings] = useState(organization.settings);

  const handleUpdateSettings = async (key: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    try {
      await organizationApi.update({ settings: newSettings });
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error("Failed to update settings");
      // Revert on error
      setSettings(settings);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          Organization Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Allow Public Forms</Label>
              <p className="text-xs text-muted-foreground">
                Allow team members to create publicly accessible forms
              </p>
            </div>
            <Switch
              checked={settings.allow_public_forms}
              onCheckedChange={(checked) => handleUpdateSettings("allow_public_forms", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Require Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">
                Require all team members to enable 2FA
              </p>
            </div>
            <Switch
              checked={settings.require_2fa}
              onCheckedChange={(checked) => handleUpdateSettings("require_2fa", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Remove Skemya Branding</Label>
              <p className="text-xs text-muted-foreground">Hide Skemya branding from your forms</p>
            </div>
            <Switch
              checked={settings.remove_branding}
              onCheckedChange={(checked) => handleUpdateSettings("remove_branding", checked)}
              disabled={organization.plan === "free"}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Single Sign-On (SSO)</Label>
              <p className="text-xs text-muted-foreground">Enable SAML-based single sign-on</p>
            </div>
            <Switch
              checked={settings.sso_enabled}
              onCheckedChange={(checked) => handleUpdateSettings("sso_enabled", checked)}
              disabled={!["scale", "enterprise"].includes(organization.plan)}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-sm font-medium">Data Retention</Label>
          <Select
            value={String(settings.data_retention_days)}
            onValueChange={(value) => handleUpdateSettings("data_retention_days", parseInt(value))}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
              <SelectItem value="365">1 year</SelectItem>
              <SelectItem value="1095">3 years</SelectItem>
              <SelectItem value="2555">7 years</SelectItem>
              <SelectItem value="-1">Forever</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            How long to keep form submissions before automatic deletion
          </p>
        </div>

        <Separator />

        <div className="space-y-4">
          <Label className="text-sm font-medium">Danger Zone</Label>
          <div className="border border-destructive/20 rounded-lg p-4 space-y-4">
            <div>
              <h4 className="font-medium text-destructive">Delete Organization</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this organization and all associated data. This action cannot be
                undone.
              </p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Organization
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { data: organization = MOCK_ORGANIZATION, isLoading } = useQuery({
    queryKey: ["organization"],
    queryFn: organizationApi.getCurrent,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Organization Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization, team, and billing settings
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <OrganizationOverview organization={organization} />
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <TeamManagement organization={organization} />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingSettings organization={organization} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <OrganizationSettings organization={organization} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
