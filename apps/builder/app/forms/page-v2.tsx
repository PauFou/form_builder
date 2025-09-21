"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  Skeleton,
  Textarea,
  cn,
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
  Sparkles,
  Clock,
  Users,
  TrendingUp,
  FileText,
  Folder,
  Grid3X3,
  List,
} from "lucide-react";

import { ImportDialog } from "../../components/import/import-dialog";
import { formsApi } from "../../lib/api/forms";
import { useAuthStore } from "../../lib/stores/auth-store";

import type { Form } from "@skemya/contracts";

export default function FormsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { organization } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: forms, isLoading } = useQuery({
    queryKey: ["forms", searchQuery],
    queryFn: () => formsApi.list({ search: searchQuery }),
  });

  const createMutation = useMutation({
    mutationFn: formsApi.create,
    onSuccess: (form) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      setCreateDialogOpen(false);
      router.push(`/forms/${form.id}/edit`);
      toast.success("Form created successfully");
    },
    onError: () => {
      toast.error("Failed to create form");
    },
  });

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

  const handleCreateForm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!organization) {
      toast.error("Please log in to create forms");
      return;
    }

    createMutation.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      organization_id: organization.id,
    });
  };

  return (
    <div className="container mx-auto py-12">
      {/* Modern Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              Your Forms
            </h1>
            <p className="text-lg text-muted-foreground">Create, manage, and analyze your forms</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              className="rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all bg-gradient-to-r from-primary to-accent">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl">
                <form onSubmit={handleCreateForm}>
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Create New Form</DialogTitle>
                    <DialogDescription className="text-base">
                      Give your form a name and description to get started
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-6">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="text-base font-medium">
                        Form Title
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="Customer Feedback Survey"
                        required
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-base font-medium">
                        Description (optional)
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Help us improve our product by sharing your feedback"
                        rows={3}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      {createMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/20 border-t-primary-foreground" />
                          Creating...
                        </div>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create Form
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-6 md:grid-cols-4 mb-8"
        >
          {[
            {
              label: "Total Forms",
              value: forms?.forms.length || 0,
              icon: FileText,
              color: "from-blue-500 to-cyan-500",
            },
            {
              label: "Total Responses",
              value: "1,234",
              icon: Users,
              color: "from-purple-500 to-pink-500",
            },
            {
              label: "Completion Rate",
              value: "87%",
              icon: TrendingUp,
              color: "from-green-500 to-emerald-500",
            },
            {
              label: "Avg. Time",
              value: "3m 24s",
              icon: Clock,
              color: "from-orange-500 to-amber-500",
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className="rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className="relative">
                      <div
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br blur-lg opacity-50",
                          stat.color
                        )}
                      />
                      <div
                        className={cn(
                          "relative w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                          stat.color
                        )}
                      >
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Search and View Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search forms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 rounded-2xl text-base bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary/50 transition-all"
            />
          </div>
          <div className="flex gap-2 p-1 rounded-xl bg-muted/50 backdrop-blur-sm">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-lg"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-lg"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Forms Grid/List */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="rounded-2xl">
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4 rounded-lg" />
                  <Skeleton className="h-4 w-1/2 mt-2 rounded-lg" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 rounded-xl" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full rounded-xl" />
                </CardFooter>
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "grid gap-6",
              viewMode === "grid" ? "md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}
          >
            {forms?.forms.map((form: Form, index: number) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {form.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {form.description || "No description"}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem asChild className="rounded-lg">
                            <Link href={`/forms/${form.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-lg">
                            <Link href={`/forms/${form.id}/preview`} target="_blank">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => duplicateMutation.mutate(form.id)}
                            className="rounded-lg"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild className="rounded-lg">
                            <Link href={`/forms/${form.id}/responses`}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Responses
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="rounded-lg">
                            <FileDown className="h-4 w-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive rounded-lg"
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
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{(form as any).submission_count || 0} responses</span>
                          </div>
                          <Badge
                            variant={(form as any).status === "published" ? "default" : "secondary"}
                            className="rounded-full"
                          >
                            {(form as any).status || "draft"}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Updated{" "}
                        {format(
                          new Date((form as any).updated_at || form.updatedAt || Date.now()),
                          "MMM d, yyyy 'at' h:mm a"
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <Button
                      asChild
                      className="w-full rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
                    >
                      <Link href={`/forms/${form.id}/edit`}>
                        <Edit className="h-4 w-4 mr-2 group-hover:rotate-3 transition-transform" />
                        Edit Form
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {forms?.forms.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-24"
        >
          <div className="relative inline-flex mb-8">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/30 to-accent/30" />
            <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-border/50 flex items-center justify-center">
              <Folder className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-3">
            {searchQuery ? "No forms found" : "Create your first form"}
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {searchQuery
              ? "Try a different search query"
              : "Start collecting responses with a beautiful, modern form"}
          </p>
          {!searchQuery && (
            <Button
              size="lg"
              onClick={() => setCreateDialogOpen(true)}
              className="rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Form
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
