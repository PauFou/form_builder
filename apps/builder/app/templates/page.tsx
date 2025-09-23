"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Clock,
  Users,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Plus,
  Eye,
  Download,
  Heart,
  Zap,
  Award,
  TrendingUp,
} from "lucide-react";
import {
  Button,
  Input,
  Badge,
  Card,
  CardContent,
  CardHeader,
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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@skemya/ui";

import { templatesApi, MOCK_TEMPLATES } from "../../lib/api/templates";
import { TEMPLATE_CATEGORIES } from "../../lib/types/templates";
import type { Template, TemplateFilters } from "../../lib/types/templates";
import { cn } from "../../lib/utils";

// Icon mapping for categories
const categoryIcons = {
  Mail: (props: any) => <Mail {...props} />,
  BarChart3: (props: any) => <BarChart3 {...props} />,
  UserPlus: (props: any) => <UserPlus {...props} />,
  MessageSquare: (props: any) => <MessageSquare {...props} />,
  Target: (props: any) => <Target {...props} />,
  FileText: (props: any) => <FileText {...props} />,
  Calendar: (props: any) => <Calendar {...props} />,
  ShoppingCart: (props: any) => <ShoppingCart {...props} />,
};

import {
  Mail,
  BarChart3,
  UserPlus,
  MessageSquare,
  Target,
  FileText,
  Calendar,
  ShoppingCart,
} from "lucide-react";

function HeroSection() {
  return (
    <div className="relative overflow-hidden">
      {/* Aurora Background */}
      <div className="aurora-bg">
        <div className="aurora-blur-1" />
        <div className="aurora-blur-2" />
        <div className="aurora-pulse" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            Over 100 professional templates
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Start with a Template
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Save time with professionally designed form templates. Choose from our collection and
            customize to match your needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <Button
              size="lg"
              className="flex-1 bg-primary text-white hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
            >
              Browse Templates
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Custom
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeaturedTemplates({ templates }: { templates: Template[] }) {
  const featured = templates.filter((t) => t.is_featured).slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="container mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Featured Templates
          </h2>
          <p className="text-muted-foreground">Hand-picked templates to get you started quickly</p>
        </div>
        <Button variant="ghost" className="text-primary hover:text-primary/80">
          View All <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featured.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <FeaturedTemplateCard template={template} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FeaturedTemplateCard({ template }: { template: Template }) {
  const router = useRouter();

  const handleUse = async () => {
    try {
      const result = await templatesApi.use({
        template_id: template.id,
        title: `${template.title} - Copy`,
      });
      router.push(`/forms/${result.form_id}/edit`);
      toast.success("Template applied successfully!");
    } catch (error) {
      toast.error("Failed to use template");
    }
  };

  return (
    <Card className="feature-card group cursor-pointer overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/10 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-primary/20 scale-150">
            {categoryIcons[template.category.icon as keyof typeof categoryIcons]?.({
              className: "h-16 w-16",
            })}
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">Featured</Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {template.title}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-3 w-3 fill-current text-yellow-500" />
            {template.rating}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {template.use_count.toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {template.estimated_time}m
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              template.difficulty === "beginner" &&
                "border-green-500/50 text-green-700 bg-green-50/50",
              template.difficulty === "intermediate" &&
                "border-yellow-500/50 text-yellow-700 bg-yellow-50/50",
              template.difficulty === "advanced" && "border-red-500/50 text-red-700 bg-red-50/50"
            )}
          >
            {template.difficulty}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-primary text-white hover:bg-primary/90"
            onClick={handleUse}
          >
            Use Template
          </Button>
          <Button size="sm" variant="outline" className="aspect-square p-0">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryTabs({
  selectedCategory,
  onCategoryChange,
}: {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}) {
  return (
    <Tabs value={selectedCategory} onValueChange={onCategoryChange} className="w-full">
      <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto p-1 bg-muted/50">
        <TabsTrigger
          value="all"
          className="data-[state=active]:bg-primary data-[state=active]:text-white"
        >
          All
        </TabsTrigger>
        {TEMPLATE_CATEGORIES.slice(0, 7).map((category) => {
          const IconComponent = categoryIcons[category.icon as keyof typeof categoryIcons];
          return (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-white flex items-center gap-2"
            >
              {IconComponent && <IconComponent className="h-4 w-4" />}
              <span className="hidden lg:inline">{category.name}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}

function TemplateCard({ template, index }: { template: Template; index: number }) {
  const router = useRouter();

  const handleUse = async () => {
    try {
      const result = await templatesApi.use({
        template_id: template.id,
        title: `${template.title} - Copy`,
      });
      router.push(`/forms/${result.form_id}/edit`);
      toast.success("Template applied successfully!");
    } catch (error) {
      toast.error("Failed to use template");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="feature-card group hover-lift cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-lg",
                  `bg-${template.category.color}-500/10 text-${template.category.color}-600`
                )}
              >
                {categoryIcons[template.category.icon as keyof typeof categoryIcons]?.({
                  className: "h-5 w-5",
                })}
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">
                  {template.title}
                </h3>
                <p className="text-sm text-muted-foreground">{template.category.name}</p>
              </div>
            </div>

            {template.is_featured && (
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.description}</p>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-yellow-500" />
                {template.rating}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {template.use_count.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {template.estimated_time}m
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                template.difficulty === "beginner" &&
                  "border-green-500/50 text-green-700 bg-green-50/50",
                template.difficulty === "intermediate" &&
                  "border-yellow-500/50 text-yellow-700 bg-yellow-50/50",
                template.difficulty === "advanced" && "border-red-500/50 text-red-700 bg-red-50/50"
              )}
            >
              {template.difficulty}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
              onClick={handleUse}
            >
              <Zap className="mr-2 h-3 w-3" />
              Use Template
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-primary/20 hover:border-primary/50 hover:bg-primary/5"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ searchQuery }: { searchQuery: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
        <Search className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {searchQuery ? "No templates found" : "No templates available"}
      </h3>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {searchQuery
          ? `We couldn't find any templates matching "${searchQuery}". Try adjusting your search terms.`
          : "There are no templates available at the moment. Check back later."}
      </p>
      {searchQuery && (
        <Button variant="outline" onClick={() => window.location.reload()}>
          Clear search
        </Button>
      )}
    </motion.div>
  );
}

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "rating">("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Mock data for now - replace with real API call
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ["templates", searchQuery, selectedCategory, sortBy],
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      let filtered = MOCK_TEMPLATES;

      if (searchQuery) {
        filtered = filtered.filter(
          (t) =>
            t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      if (selectedCategory !== "all") {
        filtered = filtered.filter((t) => t.category.id === selectedCategory);
      }

      // Sort
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "popular":
            return b.use_count - a.use_count;
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "rating":
            return b.rating - a.rating;
          default:
            return 0;
        }
      });

      return filtered;
    },
  });

  const templates = templatesData || [];

  return (
    <div className="min-h-screen">
      <HeroSection />

      <FeaturedTemplates templates={MOCK_TEMPLATES} />

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">All Templates</h2>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[140px] border-primary/20 hover:border-primary/50 focus:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border border-primary/20 rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <CategoryTabs
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="feature-card animate-pulse">
                <div className="h-40 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded w-2/3 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <EmptyState searchQuery={searchQuery} />
        ) : (
          <div
            className={cn(
              "grid gap-6",
              viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
            )}
          >
            {templates.map((template, index) => (
              <TemplateCard key={template.id} template={template} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
