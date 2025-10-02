"use client";

// DEMO VERSION 3 - Login Page Ultra-Futuriste avec IA et Effets 3D
// Version ultime avec intelligence artificielle, effets holographiques, et interactions neurales

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@skemya/ui";
import { 
  Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Zap, Shield, CheckCircle, User,
  Brain, Cpu, Bot, Magic, Fingerprint, Scan, Waves, MousePointer, Stars
} from "lucide-react";
import Link from "next/link";

export default function LoginDemo3() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [aiScanActive, setAiScanActive] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 700 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);
  
  const rotateX = useTransform(mouseYSpring, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseXSpring, [-300, 300], [-15, 15]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        mouseX.set(x);
        mouseY.set(y);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAiScanActive(true);
    
    // Mock AI-powered authentication
    setTimeout(() => {
      setIsLoading(false);
      setAiScanActive(false);
    }, 2500);
  };

  const handleAIAutoFill = () => {
    setEmail("demo@skemya.com");
    setPassword("demo123");
    setAiScanActive(true);
    setTimeout(() => setAiScanActive(false), 1000);
  };

  const handleBiometricAuth = () => {
    setBiometricAuth(true);
    setTimeout(() => {
      setBiometricAuth(false);
      setEmail("demo@skemya.com");
      setPassword("demo123");
    }, 1500);
  };

  return (
    <>
      {/* Demo Header */}
      <div className="fixed top-0 w-full bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white z-50 p-2 text-center text-sm font-bold">
        🧠 DEMO 3: Login Ultra-Futuriste avec IA, Biométrie, et Effets Holographiques 3D
      </div>
      
      {/* Custom Cursor */}
      <motion.div
        className="fixed w-8 h-8 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full pointer-events-none z-50 mix-blend-difference opacity-70"
        animate={{ x: mousePosition.x - 16, y: mousePosition.y - 16 }}
        transition={{ type: "spring", stiffness: 1000, damping: 35 }}
      />
      
      <div style={{ paddingTop: "40px", cursor: "none" }}>
        {/* Neural Network Background */}
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900/20 to-blue-900/20">
          
          {/* Ultra-Enhanced Background with AI patterns */}
          <div className="absolute inset-0 -z-10">
            {/* Neural network grid */}
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(59, 130, 246, 0.3) 1px, transparent 0)`,
                backgroundSize: "50px 50px",
                opacity: 0.4
              }}
            />

            {/* Holographic aurora layers */}
            <motion.div 
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(800px circle at 30% 20%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(600px circle at 70% 80%, rgba(139, 92, 246, 0.2), transparent 50%), radial-gradient(1000px circle at 50% 50%, rgba(168, 85, 247, 0.1), transparent 60%)",
                  "radial-gradient(800px circle at 70% 30%, rgba(59, 130, 246, 0.2), transparent 50%), radial-gradient(600px circle at 30% 70%, rgba(139, 92, 246, 0.25), transparent 50%), radial-gradient(1000px circle at 50% 50%, rgba(168, 85, 247, 0.15), transparent 60%)",
                  "radial-gradient(800px circle at 30% 20%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(600px circle at 70% 80%, rgba(139, 92, 246, 0.2), transparent 50%), radial-gradient(1000px circle at 50% 50%, rgba(168, 85, 247, 0.1), transparent 60%)"
                ]
              }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* AI brain nodes */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 rounded-full"
                style={{
                  background: `radial-gradient(circle, rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.4))`,
                  left: `${10 + (i % 4) * 25}%`,
                  top: `${15 + Math.floor(i / 4) * 35}%`,
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.8, 0.4],
                  boxShadow: [
                    "0 0 10px rgba(59, 130, 246, 0.5)",
                    "0 0 30px rgba(139, 92, 246, 0.8)",
                    "0 0 10px rgba(59, 130, 246, 0.5)"
                  ]
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Connecting neural pathways */}
            <svg className="absolute inset-0 w-full h-full opacity-20" style={{ pointerEvents: "none" }}>
              {[...Array(6)].map((_, i) => (
                <motion.line
                  key={i}
                  x1={`${20 + i * 15}%`}
                  y1={`${25 + (i % 2) * 30}%`}
                  x2={`${60 + i * 10}%`}
                  y2={`${45 + (i % 3) * 20}%`}
                  stroke="url(#neural-gradient)"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: [0, 1, 0] }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
              <defs>
                <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                  <stop offset="50%" stopColor="rgba(139, 92, 246, 0.8)" />
                  <stop offset="100%" stopColor="rgba(168, 85, 247, 0.8)" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="w-full max-w-md px-6 relative z-10">
            {/* Ultra-Advanced AI Dev Helper */}
            <motion.div
              initial={{ opacity: 0, y: -30, scale: 0.9, rotateX: -15 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="mb-10 p-6 bg-gradient-to-r from-purple-900/80 via-blue-900/80 to-indigo-900/80 border border-purple-500/30 rounded-3xl text-white shadow-2xl backdrop-blur-xl relative overflow-hidden"
            >
              {/* Holographic shine effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                animate={{ x: [-300, 300] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              />
              
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    boxShadow: [
                      "0 0 20px rgba(59, 130, 246, 0.5)",
                      "0 0 40px rgba(139, 92, 246, 0.8)",
                      "0 0 20px rgba(59, 130, 246, 0.5)"
                    ]
                  }}
                  transition={{ 
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    boxShadow: { duration: 2, repeat: Infinity }
                  }}
                  className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center"
                >
                  <Brain className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <div className="font-black text-xl">🧠 Neural Auth Assistant</div>
                  <div className="text-blue-200 text-sm">AI-powered credential management</div>
                </div>
              </div>
              
              <div className="space-y-4 relative z-10">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                    <div className="text-sm text-blue-200">Neural Email</div>
                    <div className="font-mono text-sm">demo@skemya.com</div>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
                    <div className="text-sm text-purple-200">Quantum Pass</div>
                    <div className="font-mono text-sm">demo123</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05, rotateY: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAIAutoFill}
                    className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl font-bold hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg relative overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/20"
                      animate={{ x: [-100, 100] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                    <div className="flex items-center gap-2 relative z-10">
                      <Cpu className="h-4 w-4" />
                      AI Fill
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05, rotateY: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBiometricAuth}
                    className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <Fingerprint className="h-4 w-4" />
                      Biometric
                    </div>
                    <AnimatePresence>
                      {biometricAuth && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center"
                        >
                          <CheckCircle className="h-6 w-6 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Ultra-Futuristic Login Card */}
            <motion.div
              ref={cardRef}
              initial={{ opacity: 0, y: 40, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              style={{ rotateX, rotateY, transformPerspective: 1000 }}
              className="transform-gpu"
            >
              <Card className="backdrop-blur-2xl bg-white/10 border border-white/20 shadow-3xl hover:shadow-4xl transition-all duration-700 relative overflow-hidden">
                {/* Holographic border animation */}
                <motion.div
                  className="absolute inset-0 rounded-lg opacity-50"
                  style={{
                    background: `conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.5), transparent, rgba(139, 92, 246, 0.5), transparent)`
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />
                
                {/* Inner card content */}
                <div className="absolute inset-[1px] bg-gradient-to-b from-white/5 to-white/10 rounded-lg backdrop-blur-2xl">
                  <CardHeader className="text-center relative z-10">
                    <motion.div
                      initial={{ scale: 0, rotateY: -180 }}
                      animate={{ scale: 1, rotateY: 0 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
                      className="w-24 h-24 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl relative overflow-hidden"
                    >
                      {/* Holographic center effect */}
                      <motion.div
                        animate={{
                          background: [
                            "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)",
                            "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)",
                            "radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)"
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 rounded-full"
                      />
                      
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="relative z-10"
                      >
                        <Bot className="h-12 w-12 text-white" />
                      </motion.div>
                      
                      {/* AI scanning ring */}
                      <AnimatePresence>
                        {aiScanActive && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 border-2 border-green-400 rounded-full"
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <CardTitle className="text-4xl font-black text-white mb-3">
                        Neural Gateway
                      </CardTitle>
                      <CardDescription className="text-xl text-blue-100">
                        AI-secured authentication portal
                      </CardDescription>
                    </motion.div>
                  </CardHeader>
                  
                  <CardContent className="relative z-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                      {/* Quantum Email Field */}
                      <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="space-y-3"
                      >
                        <Label htmlFor="email" className="text-lg font-bold text-white flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          Neural Email Address
                        </Label>
                        <div className="relative">
                          <motion.div
                            animate={{
                              scale: focusedField === "email" ? 1.02 : 1,
                              boxShadow: focusedField === "email" 
                                ? "0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 20px rgba(59, 130, 246, 0.1)" 
                                : "0 0 10px rgba(59, 130, 246, 0.2)"
                            }}
                            transition={{ duration: 0.3 }}
                            className="relative"
                          >
                            <Scan className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-blue-300" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="Enter your neural ID"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={() => setFocusedField("email")}
                              onBlur={() => setFocusedField(null)}
                              className="pl-14 h-14 bg-white/5 border-white/30 text-white placeholder:text-white/60 focus:border-blue-400 focus:bg-white/10 transition-all rounded-2xl text-lg backdrop-blur-sm"
                              required
                            />
                            
                            {/* Neural scan animation */}
                            <AnimatePresence>
                              {focusedField === "email" && (
                                <motion.div
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  exit={{ scaleX: 0 }}
                                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                                  style={{ width: "100%" }}
                                />
                              )}
                            </AnimatePresence>
                          </motion.div>
                          
                          <AnimatePresence>
                            {email && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0, rotate: 180 }}
                                className="absolute right-4 top-1/2 -translate-y-1/2"
                              >
                                <CheckCircle className="h-6 w-6 text-green-400" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                      
                      {/* Quantum Security Field */}
                      <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.1 }}
                        className="space-y-3"
                      >
                        <Label htmlFor="password" className="text-lg font-bold text-white flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          Quantum Security Key
                        </Label>
                        <div className="relative">
                          <motion.div
                            animate={{
                              scale: focusedField === "password" ? 1.02 : 1,
                              boxShadow: focusedField === "password" 
                                ? "0 0 30px rgba(139, 92, 246, 0.5), inset 0 0 20px rgba(139, 92, 246, 0.1)" 
                                : "0 0 10px rgba(139, 92, 246, 0.2)"
                            }}
                            transition={{ duration: 0.3 }}
                            className="relative"
                          >
                            <Waves className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-purple-300" />
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter quantum key"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onFocus={() => setFocusedField("password")}
                              onBlur={() => setFocusedField(null)}
                              className="pl-14 pr-14 h-14 bg-white/5 border-white/30 text-white placeholder:text-white/60 focus:border-purple-400 focus:bg-white/10 transition-all rounded-2xl text-lg backdrop-blur-sm"
                              required
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 hover:text-purple-100 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                            </motion.button>
                            
                            <AnimatePresence>
                              {focusedField === "password" && (
                                <motion.div
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: 1 }}
                                  exit={{ scaleX: 0 }}
                                  className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"
                                  style={{ width: "100%" }}
                                />
                              )}
                            </AnimatePresence>
                          </motion.div>
                          
                          <AnimatePresence>
                            {password && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0, rotate: 180 }}
                                className="absolute right-14 top-1/2 -translate-y-1/2"
                              >
                                <Shield className="h-6 w-6 text-green-400" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex items-center justify-between text-lg"
                      >
                        <Link 
                          href="/auth/forgot-password" 
                          className="text-blue-300 font-semibold hover:text-blue-100 hover:underline transition-colors"
                        >
                          Neural Recovery?
                        </Link>
                      </motion.div>

                      {/* Ultimate Neural Auth Button */}
                      <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.3 }}
                      >
                        <Button 
                          type="submit" 
                          className="w-full h-16 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 hover:from-blue-500 hover:via-purple-400 hover:to-pink-400 text-white font-black text-xl shadow-2xl hover:shadow-3xl transition-all duration-500 rounded-2xl relative overflow-hidden group border-0 backdrop-blur-sm" 
                          disabled={isLoading}
                        >
                          {/* Holographic shine effect */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
                            animate={{ x: isLoading ? [-200, 200] : -200 }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: isLoading ? Infinity : 0,
                              ease: "easeInOut"
                            }}
                          />
                          
                          <AnimatePresence mode="wait">
                            {isLoading ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-4 relative z-10"
                              >
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full"
                                />
                                <span>Neural Authentication...</span>
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ duration: 0.5, repeat: Infinity }}
                                >
                                  <Brain className="h-6 w-6" />
                                </motion.div>
                              </motion.div>
                            ) : (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-4 relative z-10"
                              >
                                <Magic className="h-6 w-6" />
                                <span>Initialize Neural Link</span>
                                <motion.div
                                  animate={{ x: [0, 5, 0] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                >
                                  <ArrowRight className="h-6 w-6" />
                                </motion.div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>
                      </motion.div>
                    </form>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.4 }}
                      className="mt-10 text-center"
                    >
                      <div className="text-white/80 text-lg">
                        Need neural interface setup?{" "}
                        <Link 
                          href="/auth/signup" 
                          className="text-blue-300 font-bold hover:text-blue-100 hover:underline transition-colors"
                        >
                          Initialize Account
                        </Link>
                      </div>
                    </motion.div>
                  </CardContent>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}