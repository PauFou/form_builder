"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Building,
  GraduationCap,
  Heart as HeartIcon,
  Briefcase,
  Calendar,
  UserCheck,
  FileText,
  BarChart3,
  Settings,
  Upload,
  CheckCircle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@skemya/ui";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: React.ComponentType<any>;
  featured: boolean;
  usageCount: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  previewImage?: string;
}

const mockTemplates: Template[] = [
  {
    id: "contact-form",
    name: "Contact Form",
    description: "Simple contact form with name, email, and message fields",
    category: "Business",
    tags: ["contact", "lead-generation", "basic"],
    icon: FileText,
    featured: true,
    usageCount: 15420,
    difficulty: "beginner",
    estimatedTime: "2 min",
  },
  {
    id: "customer-feedback",
    name: "Customer Feedback Survey",
    description: "Comprehensive survey to gather customer satisfaction insights",
    category: "Research",
    tags: ["feedback", "satisfaction", "survey"],
    icon: BarChart3,
    featured: true,
    usageCount: 8965,
    difficulty: "intermediate",
    estimatedTime: "5 min",
  },
  {
    id: "event-registration",
    name: "Event Registration",
    description: "Registration form for events with payment integration",
    category: "Events",
    tags: ["registration", "events", "payment"],
    icon: Calendar,
    featured: true,
    usageCount: 12340,
    difficulty: "intermediate",
    estimatedTime: "4 min",
  },
  {
    id: "job-application",
    name: "Job Application Form",
    description: "Comprehensive job application with file uploads and screening questions",
    category: "HR",
    tags: ["jobs", "applications", "hr"],
    icon: Briefcase,
    featured: false,
    usageCount: 5670,
    difficulty: "advanced",
    estimatedTime: "8 min",
  },
  {
    id: "newsletter-signup",
    name: "Newsletter Signup",
    description: "Simple email collection form with preferences",
    category: "Marketing",
    tags: ["newsletter", "email", "marketing"],
    icon: Zap,
    featured: false,
    usageCount: 9876,
    difficulty: "beginner",
    estimatedTime: "1 min",
  },
  {
    id: "patient-intake",
    name: "Patient Intake Form",
    description: "Medical intake form with health history and contact information",
    category: "Healthcare",
    tags: ["medical", "intake", "health"],
    icon: HeartIcon,
    featured: false,
    usageCount: 3421,
    difficulty: "advanced",
    estimatedTime: "10 min",
  },
  {
    id: "course-evaluation",
    name: "Course Evaluation",
    description: "Student feedback form for course and instructor evaluation",
    category: "Education",
    tags: ["education", "evaluation", "feedback"],
    icon: GraduationCap,
    featured: false,
    usageCount: 6789,
    difficulty: "intermediate",
    estimatedTime: "6 min",
  },
  {
    id: "lead-qualification",
    name: "Lead Qualification",
    description: "Sales qualification form with scoring and routing logic",
    category: "Sales",
    tags: ["sales", "leads", "qualification"],
    icon: TrendingUp,
    featured: true,
    usageCount: 4523,
    difficulty: "advanced",
    estimatedTime: "7 min",
  },
];

const categories = [
  { id: "all", name: "All Templates", icon: Grid3X3, count: mockTemplates.length },
  {
    id: "Business",
    name: "Business",
    icon: Building,
    count: mockTemplates.filter((t) => t.category === "Business").length,
  },
  {
    id: "Research",
    name: "Research",
    icon: BarChart3,
    count: mockTemplates.filter((t) => t.category === "Research").length,
  },
  {
    id: "Events",
    name: "Events",
    icon: Calendar,
    count: mockTemplates.filter((t) => t.category === "Events").length,
  },
  {
    id: "HR",
    name: "HR",
    icon: UserCheck,
    count: mockTemplates.filter((t) => t.category === "HR").length,
  },
  {
    id: "Marketing",
    name: "Marketing",
    icon: Zap,
    count: mockTemplates.filter((t) => t.category === "Marketing").length,
  },
  {
    id: "Healthcare",
    name: "Healthcare",
    icon: HeartIcon,
    count: mockTemplates.filter((t) => t.category === "Healthcare").length,
  },
  {
    id: "Education",
    name: "Education",
    icon: GraduationCap,
    count: mockTemplates.filter((t) => t.category === "Education").length,
  },
  {
    id: "Sales",
    name: "Sales",
    icon: TrendingUp,
    count: mockTemplates.filter((t) => t.category === "Sales").length,
  },
];

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const filteredTemplates = useMemo(() => {
    let filtered = mockTemplates;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((template) => template.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter((template) => template.difficulty === selectedDifficulty);
    }

    // Sort templates
    switch (sortBy) {
      case "popular":
        filtered.sort((a, b) => b.usageCount - a.usageCount);
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "difficulty": {
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
        filtered.sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
        break;
      }
    }

    return filtered;
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const featuredTemplates = mockTemplates.filter((t) => t.featured);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-50/50 border-green-200/50 text-green-700";
      case "intermediate":
        return "bg-yellow-50/50 border-yellow-200/50 text-yellow-700";
      case "advanced":
        return "bg-red-50/50 border-red-200/50 text-red-700";
      default:
        return "bg-gray-50/50 border-gray-200/50 text-gray-700";
    }
  };

  return (
    <main className="min-h-screen">
      {/* Aurora Background */}
      <div className="aurora-bg fixed inset-0 -z-10">
        <div className="aurora-blur-1" />
        <div className="aurora-blur-2" />
        <div className="aurora-pulse" />
      </div>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="container px-6 mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm border border-border/50 text-sm mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">50+ Professional Templates</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Start with a{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                template
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Choose from professionally designed templates or import your existing forms from
              Typeform and Google Forms. Get started in minutes, not hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="http://localhost:3301/auth/signup">
                <Button size="lg" className="group">
                  Browse templates
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="http://localhost:3301/import">
                <Button size="lg" variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Import existing form
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Templates */}
      <section className="py-16 relative z-10">
        <div className="container px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-8">
              <Star className="h-6 w-6 text-primary" />
              <h2 className="text-3xl font-bold">Featured Templates</h2>
            </div>
            <p className="text-lg text-muted-foreground">
              Popular templates loved by thousands of teams worldwide.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {featuredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card
                  className="h-full hover-lift bg-background/80 backdrop-blur-sm border-border/50 group cursor-pointer"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <template.icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {template.estimatedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {template.usageCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        className={`${getDifficultyColor(template.difficulty)} shadow-sm border`}
                        variant="secondary"
                      >
                        {template.difficulty === "beginner" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {template.difficulty === "intermediate" && <TrendingUp className="h-3 w-3 mr-1" />}
                        {template.difficulty === "advanced" && <Award className="h-3 w-3 mr-1" />}
                        {template.difficulty}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-primary hover:text-primary/80"
                      >
                        Use template
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Import Section */}
      <section className="py-16 bg-muted/20 relative z-10">
        <div className="container px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Import your existing forms</h3>
                    <p className="text-muted-foreground mb-6">
                      Migrate from Typeform or Google Forms with full feature parity reports. We'll
                      show you exactly what transfers and suggest alternatives for unsupported
                      features.
                    </p>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">1-click Typeform import</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">Native Google Forms support</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">Feature parity reports</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm">Auto-suggestion for upgrades</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button>
                        <Upload className="mr-2 h-4 w-4" />
                        Import from Typeform
                      </Button>
                      <Button variant="outline">Import from Google Forms</Button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl" />
                    <div className="relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-xl overflow-hidden">
                      <div className="aspect-square bg-muted/20 flex items-center justify-center">
                        <span className="text-muted-foreground">Import Preview</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* All Templates */}
      <section className="py-16 relative z-10">
        <div className="container px-6 mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold mb-4">All Templates</h2>
            <p className="text-lg text-muted-foreground">
              Browse our complete collection of professional form templates.
            </p>
          </motion.div>

          {/* Filters and Search */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <category.icon className="h-4 w-4" />
                        {category.name} ({category.count})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? "s" : ""} found
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Templates Grid/List */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewMode}-${filteredTemplates.length}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card
                        className="h-full hover-lift bg-background/80 backdrop-blur-sm border-border/50 group cursor-pointer"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <template.icon className="h-6 w-6 text-primary" />
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-xs bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20"
                            >
                              {template.category}
                            </Badge>
                          </div>
                          <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                            {template.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {template.estimatedTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {template.usageCount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge
                              className={`${getDifficultyColor(template.difficulty)} shadow-sm border`}
                              variant="secondary"
                            >
                              {template.difficulty === "beginner" && <CheckCircle className="h-3 w-3 mr-1" />}
                              {template.difficulty === "intermediate" && <TrendingUp className="h-3 w-3 mr-1" />}
                              {template.difficulty === "advanced" && <Award className="h-3 w-3 mr-1" />}
                              {template.difficulty}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary hover:text-primary/80"
                            >
                              Use template
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card
                        className="hover-lift bg-background/80 backdrop-blur-sm border-border/50 group cursor-pointer"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <template.icon className="h-8 w-8 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                                  {template.name}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className="text-xs bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20"
                                  >
                                    {template.category}
                                  </Badge>
                                  <Badge
                                    className={`${getDifficultyColor(template.difficulty)} shadow-sm border`}
                                    variant="secondary"
                                  >
                                    {template.difficulty === "beginner" && <CheckCircle className="h-3 w-3 mr-1" />}
                                    {template.difficulty === "intermediate" && <TrendingUp className="h-3 w-3 mr-1" />}
                                    {template.difficulty === "advanced" && <Award className="h-3 w-3 mr-1" />}
                                    {template.difficulty}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-muted-foreground mb-4">{template.description}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {template.estimatedTime}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {template.usageCount.toLocaleString()} uses
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  className="text-primary hover:text-primary/80"
                                >
                                  Use template
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {filteredTemplates.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No templates found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search criteria or browse all templates.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedDifficulty("all");
                }}
              >
                Clear filters
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* Template Preview Modal */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          {previewTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <previewTemplate.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{previewTemplate.name}</DialogTitle>
                    <DialogDescription className="mt-2">
                      {previewTemplate.description}
                    </DialogDescription>
                    <div className="flex items-center gap-4 mt-4">
                      <Badge variant="outline">{previewTemplate.category}</Badge>
                      <Badge
                        className={getDifficultyColor(previewTemplate.difficulty)}
                        variant="secondary"
                      >
                        {previewTemplate.difficulty}
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {previewTemplate.estimatedTime}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {previewTemplate.usageCount.toLocaleString()} uses
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 relative overflow-hidden rounded-lg border bg-muted/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-muted-foreground">Template Preview</span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
                <Link href={`http://localhost:3301/builder?template=${previewTemplate.id}`}>
                  <Button>
                    Use this template
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary to-accent relative z-10">
        <div className="container px-6 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to create your form?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Start with a template or build from scratch. Either way, you'll have a professional
              form in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="http://localhost:3301/auth/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="group bg-white text-primary hover:bg-white/90"
                >
                  Start with template
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="http://localhost:3301/builder">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white hover:text-white/90 hover:bg-white/20 border-white/30 border"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Build from scratch
                </Button>
              </Link>
            </div>
            <p className="text-sm text-white/70 mt-6">
              Free forever plan • No credit card required • 50+ templates
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
