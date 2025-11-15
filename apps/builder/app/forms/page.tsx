"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import {
  Button,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
} from "@skemya/ui";
import {
  Copy,
  Edit,
  Eye,
  FileDown,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Share2,
  BarChart3,
  Users,
  Folder,
  ChevronDown,
  Info,
  UserPlus,
} from "lucide-react";

import { formsApi } from "../../lib/api/forms";
import { apiClient } from "../../lib/api/axios-client";
import { useAuthStore } from "../../lib/stores/auth-store";
import { TemplateSelectionModal } from "../../components/templates/TemplateSelectionModal";
import { YouFormHeader } from "../../components/builder/Toolbar/YouFormHeader";

import type { Form, User, Organization } from "@skemya/contracts";

interface FormWithStats extends Form {
  submission_count?: number;
}

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
    const orgId = organization?.id || "eaee0d9b-9065-42c4-a915-356f1c1f7a84";

    if (!organization && process.env.NODE_ENV === "production") {
      toast.error("Please log in to create forms");
      return;
    }

    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      organization_id: orgId,
    };

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
        <Button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create Form"}
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
  const [sortBy, setSortBy] = useState("created");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  React.useEffect(() => {
    if (process.env.NODE_ENV === "development" && !organization && !authStore.isLoading) {
      const mockUser = {
        id: "dev-user-id",
        email: "demo@example.com",
        name: "Demo User",
      } as User;
      const mockOrg = {
        id: "dev-org-id",
        name: "test",
        slug: "test",
      } as Organization;
      authStore.setDevAuth(mockUser, mockOrg);
    }
  }, [organization, authStore]);

  const { data: formsData, isLoading } = useQuery({
    queryKey: ["forms", searchQuery],
    queryFn: async () => {
      const baseData = await formsApi.list({ search: searchQuery });
      const enhancedForms = await Promise.all(
        baseData.forms.map(async (form) => {
          try {
            const submissionsResponse = await apiClient.get(`/v1/forms/${form.id}/submissions/`, {
              params: { limit: 1 },
            });
            const submissionCount =
              submissionsResponse.data.count || submissionsResponse.data.length || 0;
            return {
              ...form,
              submission_count: submissionCount,
            } as FormWithStats;
          } catch (error) {
            return form as FormWithStats;
          }
        })
      );
      return { forms: enhancedForms };
    },
  });

  const forms = formsData?.forms || [];

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
      if (response.data.url) {
        window.open(response.data.url, "_blank");
      } else {
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
    const shareUrl = `${window.location.origin}/f/${form.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Form link copied to clipboard!");
  };

  // Empty state
  if (!isLoading && forms.length === 0 && searchQuery === "") {
    return (
      <div className="min-h-screen bg-gray-50">
        <YouFormHeader showNavigation={false} />
        <div className="max-w-7xl mx-auto px-8 py-6">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                    <Folder className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{organization?.name || "test"}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <span className="font-medium">{organization?.name || "test"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => setInviteDialogOpen(true)}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Invite Team
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem>Workspace Settings</DropdownMenuItem>
                  <DropdownMenuItem>Manage Members</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Leave Workspace</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCreateDialogOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#475569] hover:bg-[#334155] text-white text-sm font-medium rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Form
              </button>
            </div>
          </div>

          {/* Empty state content */}
          <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 200px)" }}>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-6 border-2 border-gray-400 rounded-full">
                <Info className="w-7 h-7 text-gray-600" />
              </div>
              <h3 className="text-base font-medium text-gray-800 mb-2">
                No forms created in this workspace yet.
              </h3>
              <p className="text-sm text-gray-600 mb-8">What would you like to do?</p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  onClick={() => setCreateDialogOpen(true)}
                  variant="youform-secondary"
                  size="youform-default"
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Form
                </Button>
                <Button
                  onClick={() => setInviteDialogOpen(true)}
                  variant="youform-secondary"
                  size="youform-default"
                  className="gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Team
                </Button>
              </div>
            </div>
          </div>

          {/* Dialogs */}
          <TemplateSelectionModal
            isOpen={createDialogOpen}
            onClose={() => setCreateDialogOpen(false)}
            onSelectTemplate={(templateId) => {
              const orgId = organization?.id || "eaee0d9b-9065-42c4-a915-356f1c1f7a84";
              formsApi.create({
                title: "New Form",
                description: "",
                organization_id: orgId,
              }).then((form) => {
                queryClient.invalidateQueries({ queryKey: ["forms"] });
                toast.success("Form created successfully");
                router.push(`/forms/${form.id}/edit`);
              }).catch(() => {
                toast.error("Failed to create form");
              });
            }}
          />

          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Members</DialogTitle>
              </DialogHeader>
              <p className="mb-4 text-sm text-gray-600">Team invitation functionality coming soon!</p>
              <div className="flex justify-end">
                <Button onClick={() => setInviteDialogOpen(false)}>Close</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Forms list view
  return (
    <div className="min-h-screen bg-gray-50">
      <YouFormHeader showNavigation={false} />
      <div className="max-w-7xl mx-auto px-8 py-6">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  <Folder className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">{organization?.name || "test"}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span className="font-medium">{organization?.name || "test"}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              onClick={() => setInviteDialogOpen(true)}
              className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Invite Team
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Workspace Settings</DropdownMenuItem>
                <DropdownMenuItem>Manage Members</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Leave Workspace</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search your form..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-72 bg-white border border-gray-300 rounded-md text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
              />
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-52 bg-white border-gray-300 rounded-md text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Created (old → new)</SelectItem>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setCreateDialogOpen(true)}
              variant="youform-primary"
              size="youform-default"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Form
            </Button>
          </div>
        </div>

        {/* Forms grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-6 bg-white border border-gray-200 rounded-xl">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="group bg-white border border-gray-200 rounded-xl p-6 shadow-youform-card hover:shadow-youform-card-hover hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                onClick={() => router.push(`/forms/${form.id}/edit`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-normal text-gray-900 flex-1 line-clamp-2 leading-snug group-hover:text-gray-700 transition-colors">
                    {form.title}
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors -mt-1 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/forms/${form.id}/edit`}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Form
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/preview/${form.id}`} target="_blank">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicateMutation.mutate(form.id)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(form)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Link
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/forms/${form.id}/analytics`}>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/forms/${form.id}/responses`}>
                          <Users className="w-4 h-4 mr-2" />
                          Responses
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(form.id)}>
                        <FileDown className="w-4 h-4 mr-2" />
                        Export CSV
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this form?")) {
                            deleteMutation.mutate(form.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                  {form.submission_count === 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      No responses
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {form.submission_count} response{form.submission_count !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {forms.length === 0 && !isLoading && searchQuery !== "" && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 border-2 border-gray-300 rounded-full">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
            <p className="text-sm text-gray-600 mb-6">Try adjusting your search query</p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </div>
        )}

        {/* Dialogs */}
        <TemplateSelectionModal
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onSelectTemplate={(templateId) => {
            const orgId = organization?.id || "eaee0d9b-9065-42c4-a915-356f1c1f7a84";
            formsApi.create({
              title: "New Form",
              description: "",
              organization_id: orgId,
            }).then((form) => {
              queryClient.invalidateQueries({ queryKey: ["forms"] });
              toast.success("Form created successfully");
              router.push(`/forms/${form.id}/edit`);
            }).catch(() => {
              toast.error("Failed to create form");
            });
          }}
        />

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Members</DialogTitle>
            </DialogHeader>
            <p className="mb-4 text-sm text-gray-600">Team invitation functionality coming soon!</p>
            <div className="flex justify-end">
              <Button onClick={() => setInviteDialogOpen(false)}>Close</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
