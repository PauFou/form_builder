"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  Image as ImageIcon,
  Tag,
  Clock,
  Users,
  Shield,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Globe,
  Lock,
  Building,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Label,
  Separator,
  Alert,
  AlertDescription,
} from "@skemya/ui";

import { templatesApi } from "../../../lib/api/templates";
import { formsApi } from "../../../lib/api/forms";
import { TEMPLATE_CATEGORIES, TEMPLATE_TAGS } from "../../../lib/types/templates";
import type { CreateTemplateRequest } from "../../../lib/types/templates";
import { cn } from "../../../lib/utils";

interface FormOption {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
}

function FormSelector({
  selectedFormId,
  onFormSelect,
}: {
  selectedFormId: string;
  onFormSelect: (formId: string) => void;
}) {
  const { data: forms, isLoading } = useQuery({
    queryKey: ["forms"],
    queryFn: async () => {
      const response = await formsApi.list();
      return response.forms || [];
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse bg-muted rounded-lg p-4 h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {forms?.map((form: any) => (
        <motion.div
          key={form.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 border-2 rounded-lg cursor-pointer transition-all",
            selectedFormId === form.id
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
          onClick={() => onFormSelect(form.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{form.title}</h3>
              {form.description && (
                <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={form.status === "published" ? "default" : "secondary"}
                className="capitalize"
              >
                {form.status}
              </Badge>
              {selectedFormId === form.id && <CheckCircle className="h-5 w-5 text-primary" />}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TagInput({
  tags,
  onTagsChange,
}: {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      handleAddTag(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={() => handleRemoveTag(tag)}
          >
            {tag} ×
          </Badge>
        ))}
      </div>

      <Input
        placeholder="Type a tag and press Enter"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      <div className="flex flex-wrap gap-2">
        <p className="text-sm text-muted-foreground w-full mb-2">Popular tags:</p>
        {TEMPLATE_TAGS.slice(0, 10).map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
            onClick={() => handleAddTag(tag)}
          >
            + {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<CreateTemplateRequest>>({
    title: "",
    description: "",
    category_id: "",
    tags: [],
    form_id: "",
    difficulty: "beginner",
    estimated_time: 5,
    is_public: true,
    includes_pii: false,
    compliance_notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid =
    formData.title && formData.description && formData.category_id && formData.form_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const template = await templatesApi.create(formData as CreateTemplateRequest);
      toast.success("Template created successfully!");
      router.push(`/templates`);
    } catch (error) {
      toast.error("Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreview = () => {
    toast("Preview feature coming soon!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="hover:bg-transparent hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Create Template</h1>
                <p className="text-sm text-muted-foreground">
                  Share your form design with the community
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handlePreview}
                className="border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
              <Button
                type="submit"
                form="template-form"
                disabled={!isValid || isSubmitting}
                className="bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <form id="template-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Source Form Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Source Form
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Choose the form you want to turn into a template
                </p>
              </CardHeader>
              <CardContent>
                <FormSelector
                  selectedFormId={formData.form_id || ""}
                  onFormSelect={(formId) => setFormData({ ...formData, form_id: formId })}
                />
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Template Information</CardTitle>
                <p className="text-sm text-muted-foreground">Provide details about your template</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Template Title <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="title"
                      placeholder="e.g., Customer Feedback Survey"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-medium">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_CATEGORIES.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this template is for and when to use it..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tags</Label>
                  <TagInput
                    tags={formData.tags || []}
                    onTagsChange={(tags) => setFormData({ ...formData, tags })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Template Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Template Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-sm font-medium">
                      Difficulty Level
                    </Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, difficulty: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner - Simple setup</SelectItem>
                        <SelectItem value="intermediate">
                          Intermediate - Some customization
                        </SelectItem>
                        <SelectItem value="advanced">Advanced - Complex features</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated_time" className="text-sm font-medium">
                      Setup Time (minutes)
                    </Label>
                    <Input
                      id="estimated_time"
                      type="number"
                      min="1"
                      max="120"
                      value={formData.estimated_time}
                      onChange={(e) =>
                        setFormData({ ...formData, estimated_time: parseInt(e.target.value) || 5 })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Public Template
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Make this template available to all users
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_public}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_public: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Contains Personal Information
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        This template collects personally identifiable information
                      </p>
                    </div>
                    <Switch
                      checked={formData.includes_pii}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, includes_pii: checked })
                      }
                    />
                  </div>
                </div>

                {formData.includes_pii && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-2"
                  >
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Please provide details about what personal information is collected and any
                        compliance considerations.
                      </AlertDescription>
                    </Alert>

                    <Label htmlFor="compliance_notes" className="text-sm font-medium">
                      Compliance Notes
                    </Label>
                    <Textarea
                      id="compliance_notes"
                      placeholder="Describe what PII is collected and any GDPR/privacy considerations..."
                      rows={2}
                      value={formData.compliance_notes}
                      onChange={(e) =>
                        setFormData({ ...formData, compliance_notes: e.target.value })
                      }
                    />
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Preview Card */}
            {formData.title && formData.description && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Template Preview
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      This is how your template will appear to users
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="feature-card">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{formData.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {TEMPLATE_CATEGORIES.find((c) => c.id === formData.category_id)?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={formData.is_public ? "default" : "secondary"}>
                            {formData.is_public ? (
                              <Globe className="h-3 w-3 mr-1" />
                            ) : (
                              <Lock className="h-3 w-3 mr-1" />
                            )}
                            {formData.is_public ? "Public" : "Private"}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{formData.description}</p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />0 uses
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formData.estimated_time}m
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs capitalize",
                            formData.difficulty === "beginner" &&
                              "border-green-500/50 text-green-700 bg-green-50/50",
                            formData.difficulty === "intermediate" &&
                              "border-yellow-500/50 text-yellow-700 bg-yellow-50/50",
                            formData.difficulty === "advanced" &&
                              "border-red-500/50 text-red-700 bg-red-50/50"
                          )}
                        >
                          {formData.difficulty}
                        </Badge>
                      </div>

                      {formData.tags && formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {formData.tags.slice(0, 4).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {formData.tags.length > 4 && (
                            <Badge variant="secondary" className="text-xs">
                              +{formData.tags.length - 4}
                            </Badge>
                          )}
                        </div>
                      )}

                      <Button size="sm" className="w-full bg-primary text-white" disabled>
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
