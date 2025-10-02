"use client";

// DEMO VERSION 2 - Forms Page avec Animations Premium et Interface Améliorée
// Version hypothétiquement plus avancée avec interactions fluides et design moderne

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
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
  Sparkles,
  Star,
  Rocket,
  MousePointer,
} from "lucide-react";

import { ImportDialog } from "../../../components/import/import-dialog";

// Enhanced mock data with more details
const mockForms = [
  {
    id: "1",
    title: "Customer Experience Survey 2024",
    description: "Comprehensive feedback collection with advanced logic and conditional branching",
    status: "published",
    submission_count: 892,
    view_count: 4521,
    completion_rate: 84,
    conversion_rate: 72,
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    last_submission_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    pages: [{ blocks: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }] }],
    tags: ["survey", "customer-feedback", "priority"],
    created_by: "Sarah Johnson",
    thumbnail: "gradient-blue"
  },
  {
    id: "2", 
    title: "Product Launch Feedback Form",
    description: "Collect user feedback on new product features and usability",
    status: "published",
    submission_count: 234,
    view_count: 1876,
    completion_rate: 91,
    conversion_rate: 88,
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    pages: [{ blocks: [{ id: "1" }, { id: "2" }, { id: "3" }] }],
    tags: ["product", "beta", "high-priority"],
    created_by: "Mike Chen",
    thumbnail: "gradient-purple"
  },
  {
    id: "3",
    title: "Employee Satisfaction Survey Q4",
    description: "Internal team satisfaction and engagement metrics collection",
    status: "draft",
    submission_count: 0,
    view_count: 45,
    completion_rate: 0,
    conversion_rate: 0,
    updated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    pages: [{ blocks: [{ id: "1" }, { id: "2" }] }],
    tags: ["internal", "hr", "quarterly"],
    created_by: "Lisa Park",
    thumbnail: "gradient-green"
  }
];

// Enhanced Dashboard Stats Component with animations
function EnhancedDashboardStats({ forms }: { forms: any[] }) {
  const stats = useMemo(() => {
    const published = forms.filter((f) => f.status === "published").length;
    const totalSubmissions = forms.reduce((acc, f) => acc + (f.submission_count || 0), 0);
    const totalViews = forms.reduce((acc, f) => acc + (f.view_count || 0), 0);
    const avgCompletionRate =
      forms.length > 0
        ? forms.reduce((acc, f) => acc + (f.completion_rate || 0), 0) / forms.length
        : 0;
    const avgConversionRate =
      forms.length > 0
        ? forms.reduce((acc, f) => acc + (f.conversion_rate || 0), 0) / forms.length
        : 0;

    return {
      totalForms: forms.length,
      publishedForms: published,
      totalSubmissions,
      totalViews,
      avgCompletionRate,
      avgConversionRate,
    };
  }, [forms]);

  const statCards = [
    {
      title: "Total Forms",
      value: stats.totalForms,
      subtitle: `${stats.publishedForms} published`,
      icon: FileText,
      gradient: "from-blue-500 via-blue-400 to-cyan-400",
      bgClass: "bg-gradient-to-br from-blue-50 to-cyan-50",
      delay: 0.1
    },
    {
      title: "Total Submissions",
      value: stats.totalSubmissions,
      subtitle: "All time responses",
      icon: Users,
      gradient: "from-emerald-500 via-green-400 to-teal-400",
      bgClass: "bg-gradient-to-br from-emerald-50 to-teal-50",
      delay: 0.2
    },
    {
      title: "Total Views",
      value: stats.totalViews,
      subtitle: "Form impressions",
      icon: Eye,
      gradient: "from-purple-500 via-violet-400 to-indigo-400",
      bgClass: "bg-gradient-to-br from-purple-50 to-indigo-50",
      delay: 0.3
    },
    {
      title: "Avg. Completion",
      value: `${stats.avgCompletionRate.toFixed(1)}%`,
      subtitle: "Success rate",
      icon: TrendingUp,
      gradient: "from-orange-500 via-amber-400 to-yellow-400",
      bgClass: "bg-gradient-to-br from-orange-50 to-yellow-50",
      delay: 0.4
    },
    {
      title: "Conversion Rate",
      value: `${stats.avgConversionRate.toFixed(1)}%`,
      subtitle: "Goal achievement",
      icon: Rocket,
      gradient: "from-pink-500 via-rose-400 to-red-400",
      bgClass: "bg-gradient-to-br from-pink-50 to-red-50",
      delay: 0.5
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-12">
      {statCards.map((stat) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: stat.delay }}
          whileHover={{ 
            y: -5, 
            scale: 1.02,
            boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.15)"
          }}
          className="group cursor-pointer"
        >
          <Card className={`${stat.bgClass} border-0 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}>
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"
            />
            
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">{stat.title}</CardTitle>
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
              >
                <stat.icon className="h-5 w-5 text-white" />
              </motion.div>
            </CardHeader>
            <CardContent>
              <motion.div 
                className="text-3xl font-bold text-gray-900 mb-1"
                whileHover={{ scale: 1.05 }}
              >
                {stat.value}
              </motion.div>
              <p className="text-xs text-gray-600 font-medium">{stat.subtitle}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Enhanced Form Card Component
function EnhancedFormCard({ form, index }: { form: any; index: number }) {
  const getThumbnailGradient = (type: string) => {
    switch (type) {
      case "gradient-blue": return "from-blue-500 via-cyan-400 to-teal-300";
      case "gradient-purple": return "from-purple-500 via-pink-400 to-rose-300";
      case "gradient-green": return "from-emerald-500 via-green-400 to-lime-300";
      default: return "from-gray-500 via-gray-400 to-gray-300";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 25
      }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
    >
      <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-b from-white to-gray-50/50 backdrop-blur-sm relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "20px 20px"
          }} />
        </div>

        {/* Thumbnail header */}
        <div className={`h-20 bg-gradient-to-r ${getThumbnailGradient(form.thumbnail)} relative overflow-hidden`}>
          <motion.div
            animate={{ 
              x: [-100, 300],
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              repeatType: "reverse",
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          />
          
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <Badge
              variant={form.status === "published" ? "default" : "secondary"}
              className={`${form.status === "published" 
                ? "bg-white/90 text-emerald-700 border-emerald-200" 
                : "bg-white/90 text-amber-700 border-amber-200"
              } backdrop-blur-sm font-medium`}
            >
              <Globe className="h-3 w-3 mr-1" />
              {form.status}
            </Badge>
          </div>
        </div>

        <CardHeader className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <CardTitle className="line-clamp-1 text-xl font-bold group-hover:text-blue-600 transition-colors">
                {form.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-gray-600 leading-relaxed">
                {form.description || "No description"}
              </CardDescription>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-2">
                {form.tags?.slice(0, 3).map((tag: string) => (
                  <motion.span
                    key={tag}
                    whileHover={{ scale: 1.05 }}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200"
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 backdrop-blur-sm bg-white/95">
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
          <div className="space-y-4">
            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Responses", value: form.submission_count || 0, color: "text-blue-600" },
                { label: "Views", value: form.view_count || 0, color: "text-purple-600" },
                { label: "Rate", value: form.completion_rate ? `${form.completion_rate}%` : "—", color: "text-emerald-600" },
                { label: "Conv", value: form.conversion_rate ? `${form.conversion_rate}%` : "—", color: "text-orange-600" }
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="text-center p-3 rounded-lg bg-gradient-to-b from-white to-gray-50 border border-gray-100 shadow-sm"
                >
                  <div className={`font-bold text-lg ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Updated {formatDistanceToNow(new Date(form.updated_at || Date.now()), { addSuffix: true })}
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {form.pages?.reduce((acc, p) => acc + (p.blocks?.length || 0), 0) || 0} questions
              </div>
            </div>

            {/* Last activity */}
            {form.last_submission_at && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
                <Activity className="h-4 w-4" />
                Last response {formatDistanceToNow(new Date(form.last_submission_at), { addSuffix: true })}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="grid grid-cols-2 gap-3 pt-4">
          <Button variant="outline" className="group">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
            <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Button>
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 group">
            <Edit className="h-4 w-4 mr-2" />
            Edit
            <Sparkles className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function FormsDemo2() {
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

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((f) =>
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
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
  }, [forms, statusFilter, sortBy, searchQuery]);

  return (
    <>
      {/* Demo Header */}
      <div className="fixed top-0 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white z-50 p-2 text-center text-sm font-bold">
        🚀 DEMO 2: Forms Page Premium avec Animations Fluides et Interface Ultra-Moderne
      </div>
      
      <div style={{ paddingTop: "40px" }}>
        {/* Enhanced Background */}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/20 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                x: [-200, 200, -200],
                y: [-100, 100, -100],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 -left-20 w-40 h-40 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [200, -200, 200],
                y: [100, -100, 100],
                rotate: [360, 180, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-10 -right-20 w-60 h-60 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"
            />
          </div>

          <div className="container mx-auto py-8 relative z-10">
            {/* Enhanced Header */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <motion.h1 
                    className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.02 }}
                  >
                    Forms Dashboard Pro
                  </motion.h1>
                  <motion.p 
                    className="text-xl text-gray-600 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Manage and monitor your high-performance forms
                  </motion.p>
                </div>
                
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="group">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Forms
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Button>
                  </motion.div>

                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="group bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0 shadow-lg">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Form
                          <Sparkles className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </motion.div>
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

              {/* Enhanced Dashboard Stats */}
              {!isLoading && forms.length > 0 && <EnhancedDashboardStats forms={forms} />}
            </motion.div>

            {/* Enhanced Filters and Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-8 bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 shadow-xl"
            >
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search forms, descriptions, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 text-lg bg-white/80 border-white/30 focus:bg-white transition-colors"
                  />
                </div>

                <div className="flex gap-4">
                  <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <TabsList className="bg-white/80 backdrop-blur-sm">
                      <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                        All ({forms.length})
                      </TabsTrigger>
                      <TabsTrigger value="published" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                        Published ({forms.filter(f => f.status === "published").length})
                      </TabsTrigger>
                      <TabsTrigger value="draft" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                        Drafts ({forms.filter(f => f.status === "draft").length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-[200px] bg-white/80 backdrop-blur-sm border-white/30">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-sm">
                      <SelectItem value="updated">Recently Updated</SelectItem>
                      <SelectItem value="created">Date Created</SelectItem>
                      <SelectItem value="submissions">Most Submissions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            {/* Enhanced Forms Grid */}
            <AnimatePresence mode="wait">
              {filteredForms.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">No forms found</h3>
                  <p className="text-gray-600 text-lg">Try adjusting your search or filters</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredForms.map((form, index) => (
                    <EnhancedFormCard key={form.id} form={form} index={index} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}