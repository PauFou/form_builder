"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Import dev utils in development
if (process.env.NODE_ENV === 'development') {
  import('../../lib/dev-utils');
}
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";

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
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Skeleton,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@skemya/ui";
import {
  BarChart3,
  Copy,
  Edit,
  Eye,
  FileDown,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Upload,
  Clock,
  Users,
  ArrowRight,
  Globe,
  FileText,
  TrendingUp,
  Zap,
  Filter,
  CheckCircle,
  AlertCircle,
  Share2,
  Activity,
} from "lucide-react";

import { formsApi } from "../../lib/api/forms";
import { apiClient } from "../../lib/api/axios-client";
import { useAuthStore } from "../../lib/stores/auth-store";

import type { Form, User, Organization } from "@skemya/contracts";

// Extended Form interface with stats
interface FormWithStats extends Form {
  status?: "published" | "draft";
  submission_count?: number;
  view_count?: number;
  completion_rate?: number;
  last_submission_at?: string;
  updated_at?: string;
  created_at?: string;
}

// Dashboard Stats Component
function DashboardStats({ forms }: { forms: FormWithStats[] }) {
  const stats = useMemo(() => {
    const published = forms.filter((f) => f.status === "published").length;
    const totalSubmissions = forms.reduce((acc, f) => acc + (f.submission_count || 0), 0);
    const totalViews = forms.reduce((acc, f) => acc + (f.view_count || 0), 0);
    const avgCompletionRate =
      forms.length > 0
        ? forms.reduce((acc, f) => acc + (f.completion_rate || 0), 0) / forms.length
        : 0;

    return {
      totalForms: forms.length,
      publishedForms: published,
      totalSubmissions,
      totalViews,
      avgCompletionRate,
    };
  }, [forms]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalForms}</div>
          <p className="text-xs text-muted-foreground">{stats.publishedForms} published</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
          <p className="text-xs text-muted-foreground">All time responses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalViews}</div>
          <p className="text-xs text-muted-foreground">Form impressions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgCompletionRate.toFixed(0)}%</div>
          <p className="text-xs text-muted-foreground">Success rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={() => window.location.href = '#create-form'}>
              <Plus className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => window.location.href = '#import-form'}>
              <Upload className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Create Form Dialog Content
function CreateFormDialog({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authStore = useAuthStore();
  const organization = authStore.organization;

  const createMutation = useMutation({
    mutationFn: formsApi.create,
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form created successfully");
      if (onSuccess) {
        onSuccess();
      }
      router.push(`/forms/${form.id}/edit`);
    },
    onError: () => {
      toast.error("Failed to create form");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    console.log("handleSubmit called, organization:", organization);

    // Use dev organization if not logged in (development mode)
    const orgId = organization?.id || 'eaee0d9b-9065-42c4-a915-356f1c1f7a84'; // Using the existing org ID from database
    
    if (!organization && process.env.NODE_ENV === 'production') {
      toast.error("Please log in to create forms");
      return;
    }

    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      organization_id: orgId,
    };
    
    console.log("Creating form with data:", data);
    createMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="title">Form Title</Label>
          <Input id="title" name="title" placeholder="Customer Feedback Survey" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Help us improve our product"
            rows={3}
          />
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button 
          type="submit" 
          disabled={createMutation.isPending}
          className="h-10 px-5 font-medium"
        >
          {createMutation.isPending ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent inline-block" />
              Creating...
            </>
          ) : (
            "Create Form"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function FormsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authStore = useAuthStore();
  const { organization } = authStore;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "submissions">("updated");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  
  // Debug effect
  React.useEffect(() => {
    console.log('Dialog states:', { createDialogOpen, importDialogOpen });
  }, [createDialogOpen, importDialogOpen]);

  // Development bypass - set a mock organization if not logged in
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !organization && !authStore.isLoading) {
      console.log('Dev mode: Setting mock organization');
      const mockUser = {
        id: 'dev-user-id',
        email: 'demo@example.com',
        name: 'Demo User'
      } as User;
      const mockOrg = {
        id: 'dev-org-id',
        name: 'Demo Organization',
        slug: 'demo-org'
      } as Organization;
      authStore.setDevAuth(mockUser, mockOrg);
    }
  }, [organization, authStore]);

  // Fetch forms with enhanced data
  const { data: formsData, isLoading } = useQuery({
    queryKey: ["forms", searchQuery, statusFilter],
    queryFn: async () => {
      const baseData = await formsApi.list({ search: searchQuery });

      // Enhance forms with submission counts (if available from API)
      const enhancedForms = await Promise.all(
        baseData.forms.map(async (form) => {
          try {
            // Fetch submission count for each form
            const submissionsResponse = await apiClient.get(`/v1/forms/${form.id}/submissions/`, {
              params: { limit: 1 }, // Just get count
            });

            const submissionCount =
              submissionsResponse.data.count || submissionsResponse.data.length || 0;

            return {
              ...form,
              submission_count: submissionCount,
              view_count: 0, // TODO: Implement view tracking
              completion_rate: 0, // TODO: Calculate from analytics
            } as FormWithStats;
          } catch (error) {
            // If fetching stats fails, return form without stats
            return form as FormWithStats;
          }
        })
      );

      return { forms: enhancedForms };
    },
  });

  const forms = formsData?.forms || [];

  // Filter and sort forms
  const filteredForms = useMemo(() => {
    let filtered = forms;

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "submissions":
          return (b.submission_count || 0) - (a.submission_count || 0);
        case "created":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "updated":
        default:
          return (
            new Date(b.updated_at || b.updatedAt || 0).getTime() -
            new Date(a.updated_at || a.updatedAt || 0).getTime()
          );
      }
    });

    return filtered;
  }, [forms, statusFilter, sortBy]);

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => formsApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form duplicated successfully");
    },
    onError: () => {
      toast.error("Failed to duplicate form");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => formsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      toast.success("Form deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete form");
    },
  });

  const handleExport = async (formId: string) => {
    try {
      const response = await apiClient.post(`/v1/forms/${formId}/submissions/export/`, {
        format: "csv",
      });

      // If the API returns a URL, redirect to it
      if (response.data.url) {
        window.open(response.data.url, "_blank");
      } else {
        // Otherwise, create a blob and download
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `form-${formId}-submissions.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast.success("Export started");
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const handleShare = (form: FormWithStats) => {
    if (form.status !== "published") {
      toast.error("Publish the form first to share it");
      return;
    }

    const shareUrl = `${window.location.origin}/f/${form.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Form link copied to clipboard!");
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Forms Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage and monitor your forms performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('Import button clicked');
                setImportDialogOpen(true);
              }}
              className="h-10 px-5 font-medium"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            
            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Form</DialogTitle>
                </DialogHeader>
                <p className="mb-4">Import functionality is coming soon!</p>
                <p className="text-sm text-gray-600">You'll be able to import forms from Typeform, Google Forms, and Tally.</p>
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setImportDialogOpen(false)}>Close</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              className="btn-gradient h-10 px-5 font-medium"
              onClick={() => {
                console.log('Create Form button clicked - opening dialog');
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
            
            {/* Create Form Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Form</DialogTitle>
                </DialogHeader>
                <CreateFormDialog onSuccess={() => setCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Dashboard Stats */}
        {!isLoading && forms.length > 0 && <DashboardStats forms={forms} />}
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="published">Published</TabsTrigger>
              <TabsTrigger value="draft">Drafts</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated">Last Updated</SelectItem>
              <SelectItem value="created">Date Created</SelectItem>
              <SelectItem value="submissions">Most Submissions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Forms Grid */}
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
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredForms.map((form, index) => (
            <motion.div
              key={form.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="line-clamp-1">{form.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {form.description || "No description"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/forms/${form.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Form
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/preview/${form.id}`} target="_blank">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateMutation.mutate(form.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(form)}>
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/forms/${form.id}/analytics`}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/forms/${form.id}/responses`}>
                            <Users className="h-4 w-4 mr-2" />
                            Responses
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExport(form.id)}>
                          <FileDown className="h-4 w-4 mr-2" />
                          Export CSV
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this form?")) {
                              deleteMutation.mutate(form.id);
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
                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={form.status === "published" ? "default" : "secondary"}
                        className={form.status === "published" ? "bg-green-100 text-green-800" : ""}
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        {form.status || "draft"}
                      </Badge>
                      {form.last_submission_at && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Activity className="h-3 w-3" />
                          Last response{" "}
                          {formatDistanceToNow(new Date(form.last_submission_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 rounded-md bg-muted/50">
                        <div className="font-semibold">{form.submission_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Responses</div>
                      </div>
                      <div className="text-center p-2 rounded-md bg-muted/50">
                        <div className="font-semibold">{form.view_count || 0}</div>
                        <div className="text-xs text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center p-2 rounded-md bg-muted/50">
                        <div className="font-semibold">
                          {form.completion_rate ? `${form.completion_rate}%` : "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">Rate</div>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Updated{" "}
                        {formatDistanceToNow(
                          new Date(form.updated_at || form.updatedAt || Date.now()),
                          { addSuffix: true }
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {form.pages?.reduce((acc, p) => acc + (p.blocks?.length || 0), 0) || 0}{" "}
                        questions
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="grid grid-cols-2 gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`/forms/${form.id}/analytics`}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href={`/forms/${form.id}/edit`}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Empty State */}
      {filteredForms.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          {forms.length === 0 && searchQuery === "" && statusFilter === "all" ? (
            // No forms at all
            <>
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Create your first form</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start collecting responses with beautiful, responsive forms that work on any device
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="btn-gradient h-12 px-6 text-base font-medium"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setImportDialogOpen(true)}
                  className="h-12 px-6 text-base font-medium"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import from Typeform
                </Button>
              </div>
            </>
          ) : (
            // No results for filter/search
            <>
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-6">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No forms found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search query
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
