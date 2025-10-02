"use client";

// DEMO VERSION 1 - Forms Page Actuelle (Version Avancée Restaurée)
// Cette version utilise la page forms actuelle avec dashboard stats

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

import { ImportDialog } from "../../../components/import/import-dialog";
// Mock data for demo
const mockForms = [
  {
    id: "1",
    title: "Customer Satisfaction Survey",
    description: "Collect feedback from customers about their experience",
    status: "published",
    submission_count: 245,
    view_count: 1203,
    completion_rate: 78,
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    last_submission_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    pages: [{ blocks: [{ id: "1" }, { id: "2" }, { id: "3" }] }]
  },
  {
    id: "2", 
    title: "Employee Onboarding Form",
    description: "New employee information collection",
    status: "draft",
    submission_count: 12,
    view_count: 89,
    completion_rate: 92,
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    pages: [{ blocks: [{ id: "1" }, { id: "2" }] }]
  }
];

// Dashboard Stats Component
function DashboardStats({ forms }: { forms: any[] }) {
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
            <Button size="sm" className="flex-1">
              <Plus className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Upload className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function FormsDemo1() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "submissions">("updated");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Mock data
  const forms = mockForms;
  const isLoading = false;

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
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        case "updated":
        default:
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
      }
    });

    return filtered;
  }, [forms, statusFilter, sortBy]);

  return (
    <>
      {/* Demo Header */}
      <div className="fixed top-0 w-full bg-green-500 text-white z-50 p-2 text-center text-sm font-semibold">
        📊 DEMO 1: Forms Page Avancée avec Dashboard Stats (Version Restaurée)
      </div>
      
      <div style={{ paddingTop: "40px" }}>
        <div className="container mx-auto py-8">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Forms Dashboard</h1>
                <p className="text-muted-foreground mt-1">Manage and monitor your forms performance</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>

                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="group">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Form
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Form</DialogTitle>
                      <DialogDescription>Give your form a name and description</DialogDescription>
                    </DialogHeader>
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
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Form
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share Link
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Analytics
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="h-4 w-4 mr-2" />
                            Responses
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileDown className="h-4 w-4 mr-2" />
                            Export CSV
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
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
                          {form.status}
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
                            new Date(form.updated_at || Date.now()),
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
                    <Button variant="outline">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Analytics
                    </Button>
                    <Button>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
}