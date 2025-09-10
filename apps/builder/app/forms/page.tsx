"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "react-hot-toast";

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
} from "@forms/ui";
import {
  BarChart,
  Copy,
  Edit,
  Eye,
  FileDown,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import { ImportDialog } from "../../components/import/import-dialog";
import { formsApi } from "../../lib/api/forms";

import type { Form } from "@forms/contracts";

export default function FormsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
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
    createMutation.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
    });
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-muted-foreground mt-1">Create and manage your forms</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateForm}>
                <DialogHeader>
                  <DialogTitle>Create New Form</DialogTitle>
                  <DialogDescription>
                    Give your form a name and description to get started
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Form Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Customer Feedback Survey"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Help us improve our product by sharing your feedback"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Form"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms?.forms.map((form: Form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{form.title}</CardTitle>
                    <CardDescription>{form.description || "No description"}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/forms/${form.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/forms/${form.id}/preview`} target="_blank">
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateMutation.mutate(form.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/forms/${form.id}/responses`}>
                          <BarChart className="h-4 w-4 mr-2" />
                          Responses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
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
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{(form as any).submission_count || 0} responses</span>
                    <Badge variant={(form as any).status === "published" ? "default" : "secondary"}>
                      {(form as any).status || "draft"}
                    </Badge>
                  </div>
                  <div className="text-xs">
                    Updated{" "}
                    {format(
                      new Date((form as any).updated_at || form.updatedAt || Date.now()),
                      "MMM d, yyyy"
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/forms/${form.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Form
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {forms?.forms.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">No forms found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery
              ? "Try a different search query"
              : "Get started by creating your first form"}
          </p>
          {!searchQuery && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
