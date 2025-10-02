"use client";

// DEMO VERSION 3 - Forms Page Ultra-Futuriste avec IA et Interactions 3D
// Version ultime avec intelligence artificielle, effets 3D, et micro-interactions avancées

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

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
  Brain,
  Cpu,
  Wand2,
  Target,
  LineChart,
  PieChart,
  Bot,
  Magic,
  Layers,
  Palette,
  Code2,
  Database,
} from "lucide-react";

import { ImportDialog } from "../../../components/import/import-dialog";

// Ultra-Enhanced mock data with AI insights
const mockForms = [
  {
    id: "1",
    title: "Customer Experience Survey 2024",
    description: "AI-powered feedback collection with predictive analytics and sentiment analysis",
    status: "published",
    submission_count: 1847,
    view_count: 9234,
    completion_rate: 89,
    conversion_rate: 86,
    ai_score: 94,
    performance_trend: "up",
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    last_submission_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    pages: [{ blocks: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }, { id: "5" }, { id: "6" }] }],
    tags: ["ai-powered", "sentiment-analysis", "high-performance", "premium"],
    created_by: "Sarah Johnson",
    thumbnail: "gradient-ai-blue",
    ai_insights: {
      optimization_suggestion: "Add conditional logic to question 3",
      predicted_completion: 92,
      sentiment_score: 4.2,
      conversion_potential: "High"
    }
  },
  {
    id: "2", 
    title: "Product Beta Feedback Neural Form",
    description: "Next-gen feedback collection with real-time ML processing and adaptive questioning",
    status: "published",
    submission_count: 756,
    view_count: 3421,
    completion_rate: 94,
    conversion_rate: 91,
    ai_score: 97,
    performance_trend: "up",
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    pages: [{ blocks: [{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }] }],
    tags: ["neural-network", "adaptive", "beta", "ml-powered"],
    created_by: "Mike Chen",
    thumbnail: "gradient-ai-purple",
    ai_insights: {
      optimization_suggestion: "Perfect optimization achieved",
      predicted_completion: 96,
      sentiment_score: 4.7,
      conversion_potential: "Exceptional"
    }
  },
  {
    id: "3",
    title: "Employee Satisfaction AI Assistant",
    description: "Intelligent HR form with predictive analytics and automated insights generation",
    status: "draft",
    submission_count: 0,
    view_count: 127,
    completion_rate: 0,
    conversion_rate: 0,
    ai_score: 85,
    performance_trend: "stable",
    updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    pages: [{ blocks: [{ id: "1" }, { id: "2" }, { id: "3" }] }],
    tags: ["ai-assistant", "hr-tech", "predictive", "beta"],
    created_by: "Lisa Park",
    thumbnail: "gradient-ai-green",
    ai_insights: {
      optimization_suggestion: "Add personality-based routing",
      predicted_completion: 88,
      sentiment_score: 0,
      conversion_potential: "High"
    }
  }
];

// AI-Powered Dashboard Stats with Neural Network Visualization
function AIDashboardStats({ forms }: { forms: any[] }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const published = forms.filter((f) => f.status === "published").length;
    const totalSubmissions = forms.reduce((acc, f) => acc + (f.submission_count || 0), 0);
    const totalViews = forms.reduce((acc, f) => acc + (f.view_count || 0), 0);
    const avgCompletionRate =
      forms.length > 0
        ? forms.reduce((acc, f) => acc + (f.completion_rate || 0), 0) / forms.length
        : 0;
    const avgAIScore = 
      forms.length > 0
        ? forms.reduce((acc, f) => acc + (f.ai_score || 0), 0) / forms.length
        : 0;
    const upTrendCount = forms.filter(f => f.performance_trend === "up").length;

    return {
      totalForms: forms.length,
      publishedForms: published,
      totalSubmissions,
      totalViews,
      avgCompletionRate,
      avgAIScore,
      upTrendCount,
      aiPrediction: "96% conversion boost predicted"
    };
  }, [forms]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    const container = containerRef.current;
    container?.addEventListener("mousemove", handleMouseMove);
    return () => container?.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const statCards = [
    {
      title: "Neural Forms",
      value: stats.totalForms,
      subtitle: `${stats.publishedForms} active`,
      icon: Brain,
      gradient: "from-blue-600 via-cyan-500 to-teal-400",
      bgClass: "bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50",
      delay: 0.1,
      aiFeature: "AI-Optimized"
    },
    {
      title: "Total Responses",
      value: stats.totalSubmissions,
      subtitle: "ML-processed",
      icon: Database,
      gradient: "from-emerald-600 via-green-500 to-lime-400",
      bgClass: "bg-gradient-to-br from-emerald-50 to-lime-50",
      delay: 0.2,
      aiFeature: "Real-time Analysis"
    },
    {
      title: "AI Performance",
      value: `${stats.avgAIScore.toFixed(0)}%`,
      subtitle: "Neural score",
      icon: Cpu,
      gradient: "from-purple-600 via-violet-500 to-indigo-400",
      bgClass: "bg-gradient-to-br from-purple-50 to-indigo-50",
      delay: 0.3,
      aiFeature: "Deep Learning"
    },
    {
      title: "Completion Rate",
      value: `${stats.avgCompletionRate.toFixed(1)}%`,
      subtitle: "AI-optimized",
      icon: Target,
      gradient: "from-orange-600 via-amber-500 to-yellow-400",
      bgClass: "bg-gradient-to-br from-orange-50 to-yellow-50",
      delay: 0.4,
      aiFeature: "Predictive"
    },
    {
      title: "Growth Trends",
      value: stats.upTrendCount,
      subtitle: "Accelerating",
      icon: LineChart,
      gradient: "from-pink-600 via-rose-500 to-red-400",
      bgClass: "bg-gradient-to-br from-pink-50 to-red-50",
      delay: 0.5,
      aiFeature: "Forecasting"
    }
  ];

  return (
    <div className="mb-16">
      {/* AI Insights Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden"
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(255,255,255,0.15), transparent 40%)"
            ]
          }}
          style={{
            "--mouse-x": `${mousePosition.x}px`,
            "--mouse-y": `${mousePosition.y}px`
          } as React.CSSProperties}
        />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center"
            >
              <Bot className="h-6 w-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold">AI Assistant Active</h3>
              <p className="text-blue-200">{stats.aiPrediction}</p>
            </div>
          </div>
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Magic className="h-4 w-4 mr-2" />
            View AI Insights
          </Button>
        </div>
      </motion.div>

      {/* Enhanced Stats Grid */}
      <div ref={containerRef} className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 30, scale: 0.9, rotateX: -15 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: stat.delay,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            whileHover={{ 
              y: -12, 
              scale: 1.05,
              rotateY: 5,
              boxShadow: "0 30px 60px -12px rgba(0, 0, 0, 0.3)"
            }}
            className="group cursor-pointer transform-gpu perspective-1000"
          >
            <Card className={`${stat.bgClass} border-0 shadow-2xl hover:shadow-3xl transition-all duration-700 relative overflow-hidden backdrop-blur-sm`}>
              {/* Neural network background pattern */}
              <motion.div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 20%, currentColor 2px, transparent 2px), radial-gradient(circle at 80% 80%, currentColor 1px, transparent 1px)`,
                  backgroundSize: "30px 30px, 20px 20px"
                }}
                animate={{
                  backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              />

              {/* Holographic shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                style={{
                  backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)"
                }}
              />
              
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-bold text-gray-700">{stat.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs px-2 py-0.5 bg-white/60">
                      <Sparkles className="h-3 w-3 mr-1" />
                      {stat.aiFeature}
                    </Badge>
                  </div>
                </div>
                
                <motion.div
                  whileHover={{ 
                    rotate: 15, 
                    scale: 1.2,
                    filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))"
                  }}
                  transition={{ duration: 0.3 }}
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-xl relative overflow-hidden`}
                >
                  <motion.div
                    animate={{
                      background: [
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%)",
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 70%)",
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 70%)"
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0"
                  />
                  <stat.icon className="h-6 w-6 text-white relative z-10" />
                </motion.div>
              </CardHeader>
              
              <CardContent className="relative z-10">
                <motion.div 
                  className="text-4xl font-black text-gray-900 mb-2"
                  whileHover={{ scale: 1.1, color: "#2563eb" }}
                  transition={{ duration: 0.2 }}
                >
                  {stat.value}
                </motion.div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-semibold">{stat.subtitle}</p>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-green-400 rounded-full"
                  />
                </div>
                
                {/* AI visualization */}
                <motion.div
                  className="mt-3 h-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1, delay: stat.delay + 0.5 }}
                >
                  <motion.div
                    className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full`}
                    initial={{ width: "0%" }}
                    animate={{ width: "85%" }}
                    transition={{ duration: 1.5, delay: stat.delay + 1 }}
                  />
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Ultimate Enhanced Form Card with 3D Effects
function UltimateFormCard({ form, index }: { form: any; index: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 700 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);
  const rotateX = useTransform(mouseYSpring, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseXSpring, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const getThumbnailGradient = (type: string) => {
    switch (type) {
      case "gradient-ai-blue": return "from-blue-600 via-cyan-400 to-teal-300";
      case "gradient-ai-purple": return "from-purple-600 via-pink-400 to-rose-300";
      case "gradient-ai-green": return "from-emerald-600 via-green-400 to-lime-300";
      default: return "from-gray-600 via-gray-400 to-gray-300";
    }
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 95) return "text-emerald-600 bg-emerald-50";
    if (score >= 85) return "text-blue-600 bg-blue-50";
    return "text-orange-600 bg-orange-50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9, rotateX: -30 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ 
        duration: 0.8, 
        delay: index * 0.15,
        type: "spring",
        stiffness: 200,
        damping: 25
      }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        mouseX.set(0);
        mouseY.set(0);
      }}
      whileHover={{ 
        y: -15, 
        scale: 1.03,
        boxShadow: "0 40px 80px -12px rgba(0, 0, 0, 0.35)"
      }}
      className="transform-gpu cursor-pointer"
    >
      <Card className="group hover:shadow-3xl transition-all duration-700 border-0 bg-gradient-to-b from-white via-white to-gray-50/80 backdrop-blur-xl relative overflow-hidden">
        {/* Neural network background */}
        <motion.div
          className="absolute inset-0 opacity-5"
          animate={{
            backgroundPosition: isHovered ? ["0% 0%", "100% 100%"] : ["0% 0%", "50% 50%", "0% 0%"]
          }}
          transition={{ duration: isHovered ? 2 : 8, repeat: Infinity }}
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: "25px 25px"
          }}
        />

        {/* Holographic border effect */}
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${isHovered ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.1)'}, transparent)`
          }}
          animate={{ rotate: isHovered ? 360 : 0 }}
          transition={{ duration: isHovered ? 3 : 0, ease: "linear", repeat: isHovered ? Infinity : 0 }}
        />
        <div className="absolute inset-[1px] bg-gradient-to-b from-white to-gray-50 rounded-lg" />

        {/* Enhanced thumbnail with AI visualization */}
        <div className={`h-24 bg-gradient-to-r ${getThumbnailGradient(form.thumbnail)} relative overflow-hidden`}>
          {/* Neural network animation */}
          <motion.div
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 2px, transparent 2px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: "40px 40px, 20px 20px"
            }}
          />

          {/* AI indicator */}
          <motion.div
            className="absolute top-3 left-3 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Brain className="h-4 w-4 text-purple-600" />
            </motion.div>
            <span className={`text-sm font-bold px-2 py-1 rounded-full ${getAIScoreColor(form.ai_score)}`}>
              AI: {form.ai_score}%
            </span>
          </motion.div>
          
          {/* Status badge */}
          <div className="absolute top-3 right-3">
            <Badge
              variant={form.status === "published" ? "default" : "secondary"}
              className={`${form.status === "published" 
                ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                : "bg-amber-100 text-amber-800 border-amber-200"
              } backdrop-blur-sm font-semibold`}
            >
              <Globe className="h-3 w-3 mr-1" />
              {form.status}
            </Badge>
          </div>

          {/* Performance trend indicator */}
          <motion.div
            className="absolute bottom-2 right-2"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {form.performance_trend === "up" && (
              <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                <TrendingUp className="h-3 w-3" />
                Trending
              </div>
            )}
          </motion.div>
        </div>

        <CardHeader className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <CardTitle className="line-clamp-2 text-xl font-black group-hover:text-blue-600 transition-colors leading-tight">
                {form.title}
              </CardTitle>
              <CardDescription className="line-clamp-2 text-gray-600 leading-relaxed text-base">
                {form.description || "No description"}
              </CardDescription>
              
              {/* Enhanced tags with AI features */}
              <div className="flex flex-wrap gap-2">
                {form.tags?.slice(0, 3).map((tag: string) => (
                  <motion.span
                    key={tag}
                    whileHover={{ scale: 1.1, y: -2 }}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                      tag.includes("ai") || tag.includes("neural") || tag.includes("ml")
                        ? "bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200"
                        : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {tag.includes("ai") || tag.includes("neural") || tag.includes("ml") && (
                      <Sparkles className="h-3 w-3 mr-1" />
                    )}
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
              <DropdownMenuContent align="end" className="w-56 backdrop-blur-xl bg-white/90 border-white/20">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Wand2 className="h-4 w-4 mr-2" />
                  AI Optimize
                </DropdownMenuItem>
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
                  Clone with AI
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="relative z-10">
          <div className="space-y-6">
            {/* Ultra-Enhanced Stats Grid with 3D effect */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Responses", value: form.submission_count || 0, color: "blue", icon: Users },
                { label: "Views", value: form.view_count || 0, color: "purple", icon: Eye },
                { label: "Rate", value: form.completion_rate ? `${form.completion_rate}%` : "—", color: "emerald", icon: Target },
                { label: "Conv", value: form.conversion_rate ? `${form.conversion_rate}%` : "—", color: "orange", icon: TrendingUp }
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ 
                    scale: 1.08, 
                    y: -4,
                    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.2)"
                  }}
                  className="text-center p-4 rounded-xl bg-gradient-to-b from-white via-white to-gray-50 border border-gray-100/50 shadow-lg backdrop-blur-sm relative overflow-hidden group/stat"
                >
                  <motion.div
                    className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${stat.color}-500 to-${stat.color}-400 flex items-center justify-center mx-auto mb-2 shadow-md`}
                    whileHover={{ rotate: 12 }}
                  >
                    <stat.icon className="h-4 w-4 text-white" />
                  </motion.div>
                  <div className={`font-black text-lg text-${stat.color}-600`}>{stat.value}</div>
                  <div className="text-xs text-gray-500 font-semibold">{stat.label}</div>
                  
                  {/* Shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover/stat:translate-x-full transition-transform duration-500"
                  />
                </motion.div>
              ))}
            </div>

            {/* AI Insights Panel */}
            {form.ai_insights && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-blue-50 to-cyan-50 border border-purple-100"
              >
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Cpu className="h-4 w-4 text-purple-600" />
                  </motion.div>
                  <h4 className="font-bold text-purple-800">AI Insights</h4>
                </div>
                <p className="text-sm text-purple-700 mb-2">{form.ai_insights.optimization_suggestion}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-600">Predicted: {form.ai_insights.predicted_completion}%</span>
                  <span className="text-emerald-600">Sentiment: {form.ai_insights.sentiment_score}/5</span>
                </div>
              </motion.div>
            )}

            {/* Meta Info with enhanced styling */}
            <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Updated {formatDistanceToNow(new Date(form.updated_at || Date.now()), { addSuffix: true })}
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                {form.pages?.reduce((acc, p) => acc + (p.blocks?.length || 0), 0) || 0} AI blocks
              </div>
            </div>

            {/* Recent activity with pulse */}
            {form.last_submission_at && (
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex items-center gap-2 text-sm text-emerald-600 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 rounded-xl border border-emerald-100"
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 bg-emerald-400 rounded-full"
                />
                <Activity className="h-4 w-4" />
                Latest response {formatDistanceToNow(new Date(form.last_submission_at), { addSuffix: true })}
              </motion.div>
            )}
          </div>
        </CardContent>

        <CardFooter className="grid grid-cols-2 gap-4 pt-6">
          <Button variant="outline" className="group bg-white/60 backdrop-blur-sm hover:bg-white/80">
            <BarChart3 className="h-4 w-4 mr-2" />
            AI Analytics
            <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 hover:from-blue-700 hover:via-purple-600 hover:to-pink-600 text-white border-0 group relative overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/20"
              animate={{ x: [-100, 300] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            />
            <Edit className="h-4 w-4 mr-2 relative z-10" />
            <span className="relative z-10">Edit with AI</span>
            <Wand2 className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default function FormsDemo3() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "submissions" | "ai_score">("ai_score");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse for 3D effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Mock data
  const forms = mockForms;
  const isLoading = false;

  // Enhanced filter and sort
  const filteredForms = useMemo(() => {
    let filtered = forms;

    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((f) =>
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "ai_score":
          return (b.ai_score || 0) - (a.ai_score || 0);
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
      <div className="fixed top-0 w-full bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white z-50 p-2 text-center text-sm font-bold">
        🧠 DEMO 3: Forms Page Ultra-Futuriste avec IA, Effets 3D et Interactions Neurales
      </div>
      
      <div style={{ paddingTop: "40px" }}>
        {/* Ultimate Enhanced Background */}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-100/30 relative overflow-hidden">
          {/* 3D animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                x: [-300, 300, -300],
                y: [-150, 150, -150],
                rotate: [0, 180, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 -left-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 via-purple-400/15 to-pink-400/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                x: [300, -300, 300],
                y: [150, -150, 150],
                rotate: [360, 180, 0],
                scale: [1.2, 1, 1.2]
              }}
              transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-20 -right-40 w-96 h-96 bg-gradient-to-r from-purple-400/10 via-pink-400/15 to-indigo-400/10 rounded-full blur-3xl"
            />
            
            {/* Neural network grid */}
            <motion.div
              className="absolute inset-0 opacity-5"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, #3b82f6 1px, transparent 0)`,
                backgroundSize: "60px 60px"
              }}
            />
          </div>

          <div className="container mx-auto py-12 relative z-10">
            {/* Ultra-Enhanced Header */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 1 }}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <motion.h1 
                    className="text-5xl md:text-7xl font-black mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent"
                    whileHover={{ scale: 1.02 }}
                    style={{
                      filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.1))"
                    }}
                  >
                    Neural Forms Hub
                  </motion.h1>
                  <motion.p 
                    className="text-2xl text-gray-600 font-semibold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    AI-powered form management with predictive analytics
                  </motion.p>
                </div>
                
                <div className="flex items-center gap-6">
                  <motion.div
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button variant="outline" onClick={() => setImportDialogOpen(true)} className="group bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80">
                      <Upload className="h-4 w-4 mr-2" />
                      AI Import
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Button>
                  </motion.div>

                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.08, y: -4, rotateY: -5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="group bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 hover:from-blue-700 hover:via-purple-600 hover:to-pink-600 text-white border-0 shadow-2xl px-8 py-6 text-lg relative overflow-hidden">
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/20"
                            animate={{ x: [-100, 300] }}
                            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                          />
                          <Brain className="h-5 w-5 mr-3 relative z-10" />
                          <span className="relative z-10">Create AI Form</span>
                          <Wand2 className="h-5 w-5 ml-3 opacity-0 group-hover:opacity-100 transition-opacity relative z-10" />
                        </Button>
                      </motion.div>
                    </DialogTrigger>
                  </Dialog>
                </div>
              </div>

              {/* AI-Powered Dashboard Stats */}
              {!isLoading && forms.length > 0 && <AIDashboardStats forms={forms} />}
            </motion.div>

            {/* Ultimate Enhanced Filters */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mb-12 bg-white/70 backdrop-blur-xl p-8 rounded-3xl border border-white/30 shadow-2xl relative overflow-hidden"
            >
              {/* Holographic background */}
              <motion.div
                className="absolute inset-0 bg-gradient-conic from-blue-500/10 via-purple-500/10 to-pink-500/10"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              
              <div className="flex flex-col xl:flex-row gap-8 items-center relative z-10">
                <div className="relative flex-1 max-w-lg">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <Input
                    placeholder="Search with AI assistance..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 h-14 text-lg bg-white/90 border-white/40 focus:bg-white transition-colors rounded-2xl shadow-lg"
                  />
                  <motion.div
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Brain className="h-5 w-5 text-purple-500" />
                  </motion.div>
                </div>

                <div className="flex gap-6">
                  <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <TabsList className="bg-white/90 backdrop-blur-sm shadow-lg">
                      <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                        All Neural Forms ({forms.length})
                      </TabsTrigger>
                      <TabsTrigger value="published" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
                        Live AI ({forms.filter(f => f.status === "published").length})
                      </TabsTrigger>
                      <TabsTrigger value="draft" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                        Training ({forms.filter(f => f.status === "draft").length})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-[220px] bg-white/90 backdrop-blur-sm border-white/40 shadow-lg">
                      <SelectValue placeholder="AI Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-xl">
                      <SelectItem value="ai_score">AI Performance Score</SelectItem>
                      <SelectItem value="updated">Recently Updated</SelectItem>
                      <SelectItem value="submissions">Neural Activity</SelectItem>
                      <SelectItem value="created">Creation Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>

            {/* Ultimate Enhanced Forms Grid */}
            <AnimatePresence mode="wait">
              {filteredForms.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-24"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="w-32 h-32 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
                  >
                    <Brain className="h-16 w-16 text-purple-500" />
                  </motion.div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4">No Neural Forms Found</h3>
                  <p className="text-gray-600 text-xl">The AI is still learning your preferences</p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="grid gap-10 md:grid-cols-2 xl:grid-cols-3"
                >
                  {filteredForms.map((form, index) => (
                    <UltimateFormCard key={form.id} form={form} index={index} />
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