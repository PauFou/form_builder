/**
 * Template-related types and interfaces
 */

export interface Template {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  thumbnail?: string;
  preview_images?: string[];

  // Metadata
  created_at: string;
  updated_at: string;
  created_by: string;
  organization_id?: string;

  // Stats
  use_count: number;
  rating: number;
  rating_count: number;

  // Form structure
  form_schema: any; // JSON schema of the form
  theme_config?: any; // Theme customizations

  // Template properties
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_time: number; // minutes to set up
  is_featured: boolean;
  is_public: boolean;

  // GDPR and compliance
  includes_pii: boolean;
  compliance_notes?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface TemplateFilters {
  category_id?: string;
  tags?: string[];
  difficulty?: Template["difficulty"];
  search?: string;
  is_featured?: boolean;
  sort_by?: "popular" | "newest" | "rating" | "alphabetical";
  sort_order?: "asc" | "desc";
}

export interface CreateTemplateRequest {
  title: string;
  description: string;
  category_id: string;
  tags: string[];
  form_id: string; // Source form to create template from
  difficulty: Template["difficulty"];
  estimated_time: number;
  is_public: boolean;
  includes_pii: boolean;
  compliance_notes?: string;
}

export interface UseTemplateRequest {
  template_id: string;
  title: string;
  description?: string;
  customizations?: {
    theme?: any;
    fields?: any;
  };
}

export interface TemplateUsage {
  id: string;
  template_id: string;
  user_id: string;
  form_id: string;
  used_at: string;
  customizations_applied?: any;
}

// Predefined template categories
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: "contact",
    name: "Contact Forms",
    description: "Get in touch forms for businesses",
    icon: "Mail",
    color: "blue",
    sort_order: 1,
  },
  {
    id: "survey",
    name: "Surveys & Polls",
    description: "Collect feedback and opinions",
    icon: "BarChart3",
    color: "green",
    sort_order: 2,
  },
  {
    id: "registration",
    name: "Registration",
    description: "Event and service registration",
    icon: "UserPlus",
    color: "purple",
    sort_order: 3,
  },
  {
    id: "feedback",
    name: "Feedback",
    description: "Customer and employee feedback",
    icon: "MessageSquare",
    color: "orange",
    sort_order: 4,
  },
  {
    id: "lead",
    name: "Lead Generation",
    description: "Capture prospects and leads",
    icon: "Target",
    color: "red",
    sort_order: 5,
  },
  {
    id: "application",
    name: "Applications",
    description: "Job and program applications",
    icon: "FileText",
    color: "indigo",
    sort_order: 6,
  },
  {
    id: "booking",
    name: "Booking & Scheduling",
    description: "Appointments and reservations",
    icon: "Calendar",
    color: "pink",
    sort_order: 7,
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Orders and payment forms",
    icon: "ShoppingCart",
    color: "yellow",
    sort_order: 8,
  },
];

// Common tags for templates
export const TEMPLATE_TAGS = [
  "business",
  "personal",
  "healthcare",
  "education",
  "non-profit",
  "government",
  "tech",
  "marketing",
  "hr",
  "finance",
  "legal",
  "real-estate",
  "hospitality",
  "retail",
  "simple",
  "advanced",
  "multi-step",
  "single-page",
  "payment",
  "file-upload",
  "conditional-logic",
  "calculations",
  "signature",
  "gdpr-compliant",
];

export type TemplateCardProps = {
  template: Template;
  onUse: (template: Template) => void;
  onPreview: (template: Template) => void;
  index?: number;
};

export type TemplateGridProps = {
  templates: Template[];
  loading?: boolean;
  onUse: (template: Template) => void;
  onPreview: (template: Template) => void;
};

export type TemplateFiltersProps = {
  filters: TemplateFilters;
  categories: TemplateCategory[];
  onFiltersChange: (filters: TemplateFilters) => void;
  onReset: () => void;
};
