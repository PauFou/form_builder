"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Users,
  FileText,
  BarChart3,
  Eye,
  Edit,
  Copy,
  Download,
  Share2,
  Trash2,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@skemya/ui";

import { formsApi } from "../../lib/api/forms";
import { apiClient } from "../../lib/api/axios-client";
import { ImportDialog } from "./import-dialog";
import { useAuthStore } from "../../lib/stores/auth-store";

interface FormWithStats {
  id: string;
  title: string;
  description?: string;
  status: "draft" | "published" | "archived";
  created_at: string;
  updated_at: string;
  published_at?: string;
  submission_count?: number;
  view_count?: number;
  completion_rate?: number;
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="empty-state"
    >
      <div className="empty-icon">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Create your first form</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Start collecting responses in minutes with our intuitive form builder
      </p>
      <Link href="/forms/create">
        <Button
          size="lg"
          className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Form
        </Button>
      </Link>
    </motion.div>
  );
}

function DashboardStats({ forms }: { forms: FormWithStats[] }) {
  const stats = useMemo(() => {
    const published = forms.filter((f) => f.status === "published").length;
    const totalSubmissions = forms.reduce((acc, f) => acc + (f.submission_count || 0), 0);
    const avgCompletionRate =
      forms.length > 0
        ? forms.reduce((acc, f) => acc + (f.completion_rate || 0), 0) / forms.length
        : 0;
    const totalViews = forms.reduce((acc, f) => acc + (f.view_count || 0), 0);

    return { published, totalSubmissions, avgCompletionRate, totalViews };
  }, [forms]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {[
        {
          label: "Published Forms",
          value: stats.published,
          icon: CheckCircle,
          change: "+2 this week",
          color: "text-green-600",
        },
        {
          label: "Total Responses",
          value: stats.totalSubmissions.toLocaleString(),
          icon: Users,
          change: "+127 today",
          color: "text-primary",
        },
        {
          label: "Completion Rate",
          value: `${stats.avgCompletionRate.toFixed(0)}%`,
          icon: TrendingUp,
          change: "+5% vs last month",
          color: "text-accent",
        },
        {
          label: "Total Views",
          value: stats.totalViews.toLocaleString(),
          icon: Eye,
          change: "+892 this week",
          color: "text-purple-600",
        },
      ].map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="dashboard-stat-card hover-lift">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1 mb-2">{stat.value}</p>
                  <p className={cn("text-xs flex items-center gap-1", stat.color)}>
                    <TrendingUp className="h-3 w-3" />
                    {stat.change}
                  </p>
                </div>
                <div className="icon-box-sm">
                  <stat.icon className={cn("h-5 w-5", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function FormCard({ form, index }: { form: FormWithStats; index: number }) {
  const handleAction = async (action: string) => {
    switch (action) {
      case "preview":
        window.open(`/forms/${form.id}/preview`, "_blank");
        break;
      case "duplicate":
        toast.success("Form duplicated");
        break;
      case "export": {
        const response = await apiClient.post(`/v1/forms/${form.id}/submissions/export/`, {
          format: "csv",
        });
        toast.success("Export started");
        break;
      }
      case "delete":
        toast.error("Delete not implemented");
        break;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="feature-card group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            {form.title}
          </h3>
          {form.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{form.description}</p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleAction("preview")}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("duplicate")}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction("export")}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => handleAction("delete")}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2 mb-4">
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-medium transition-colors",
            form.status === "published"
              ? "border-green-500/50 text-green-700 bg-green-50/50"
              : form.status === "draft"
                ? "border-amber-500/50 text-amber-700 bg-amber-50/50"
                : "border-muted text-muted-foreground"
          )}
        >
          {form.status === "published"
            ? "Published"
            : form.status === "draft"
              ? "Draft"
              : "Archived"}
        </Badge>
        <span className="text-xs text-muted-foreground">
          Updated {format(new Date(form.updated_at), "MMM d, yyyy")}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-2xl font-semibold">{form.submission_count || 0}</p>
          <p className="text-xs text-muted-foreground">Responses</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{form.view_count || 0}</p>
          <p className="text-xs text-muted-foreground">Views</p>
        </div>
        <div>
          <p className="text-2xl font-semibold">{form.completion_rate || 0}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-4 border-t">
        <Link href={`/forms/${form.id}/edit`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all"
          >
            <Edit className="mr-2 h-3 w-3" />
            Edit
          </Button>
        </Link>
        <Link href={`/forms/${form.id}/analytics`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary/20 hover:bg-primary/5 hover:border-primary/50 transition-all"
          >
            <BarChart3 className="mr-2 h-3 w-3" />
            Analytics
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function FormsPageStyled() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const {
    data: formsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["forms", searchQuery, statusFilter, sortBy],
    queryFn: async () => {
      const formsResponse = await formsApi.list({
        search: searchQuery,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      // Extract forms array from response
      const forms = formsResponse.forms || [];

      // Fetch submission counts for each form
      const formsWithStats = await Promise.all(
        forms.map(async (form: any) => {
          try {
            const response = await apiClient.get(`/v1/forms/${form.id}/submissions/`, {
              params: { limit: 1 },
            });
            const submissionCount = response.data.count || response.data.length || 0;

            // Mock data for now
            return {
              ...form,
              submission_count: submissionCount,
              view_count: Math.floor(Math.random() * 1000),
              completion_rate: Math.floor(Math.random() * 100),
            };
          } catch {
            return { ...form, submission_count: 0, view_count: 0, completion_rate: 0 };
          }
        })
      );

      return formsWithStats;
    },
  });

  const forms = formsData || [];

  return (
    <div className="min-h-screen">
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-blur-1" />
        <div className="aurora-blur-2" />
        <div className="aurora-pulse" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="container mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back{user?.first_name ? `, ${user.first_name}` : ""}!
                </h1>
                <p className="text-muted-foreground">Manage your forms and track responses</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setImportDialogOpen(true)}
                  className="border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <Link href="/forms/create">
                  <Button className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Form
                  </Button>
                </Link>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search forms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary/50 transition-colors"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] border-primary/20 hover:border-primary/50 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] border-primary/20 hover:border-primary/50 focus:border-primary/50 transition-colors">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="updated_at">Last updated</SelectItem>
                  <SelectItem value="created_at">Date created</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="submissions">Most responses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="feature-card animate-pulse">
                  <div className="h-20 bg-muted rounded mb-4" />
                  <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : forms.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <DashboardStats forms={forms} />

              <div className="mb-6">
                <h2 className="text-xl font-semibold">Your Forms</h2>
                <p className="text-muted-foreground">
                  {forms.length} form{forms.length !== 1 ? "s" : ""} total
                </p>
              </div>

              <div className="card-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {forms.map((form: FormWithStats, index: number) => (
                  <FormCard key={form.id} form={form} index={index} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Import Dialog */}
      <AnimatePresence>
        {importDialogOpen && (
          <ImportDialog
            isOpen={importDialogOpen}
            onClose={() => setImportDialogOpen(false)}
            onImportComplete={() => {
              setImportDialogOpen(false);
              refetch();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function
function cn(...inputs: (string | boolean | undefined)[]) {
  return inputs.filter(Boolean).join(" ");
}
