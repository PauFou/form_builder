"use client";

// DEMO VERSION 2 - Login Page Premium avec Animations Avancées
// Version améliorée avec micro-interactions et design moderne

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@skemya/ui";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, Zap, Shield, CheckCircle, User } from "lucide-react";
import Link from "next/link";

export default function LoginDemo2() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock submission with enhanced loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleDevLogin = () => {
    setEmail("demo@skemya.com");
    setPassword("demo123");
  };

  return (
    <>
      {/* Demo Header */}
      <div className="fixed top-0 w-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white z-50 p-2 text-center text-sm font-bold">
        ✨ DEMO 2: Login Page Premium avec Animations Avancées et Micro-Interactions
      </div>
      
      <div style={{ paddingTop: "40px" }}>
        {/* Enhanced Aurora Background */}
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60">
          {/* Animated background elements */}
          <div className="absolute inset-0 -z-10">
            <motion.div 
              className="absolute inset-0"
              animate={{
                background: [
                  "radial-gradient(600px circle at 20% 40%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(800px circle at 80% 60%, rgba(139, 92, 246, 0.15), transparent 50%)",
                  "radial-gradient(600px circle at 60% 20%, rgba(59, 130, 246, 0.2), transparent 50%), radial-gradient(800px circle at 40% 80%, rgba(139, 92, 246, 0.2), transparent 50%)",
                  "radial-gradient(600px circle at 20% 40%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(800px circle at 80% 60%, rgba(139, 92, 246, 0.15), transparent 50%)"
                ]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            
            {/* Floating geometric shapes */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-16 h-16 rounded-full opacity-10"
                style={{
                  background: `linear-gradient(${45 + i * 72}deg, rgb(59, 130, 246), rgb(139, 92, 246))`,
                  left: `${15 + i * 20}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [-20, 20, -20],
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 5 + i * 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          <div className="w-full max-w-md px-6 relative z-10">
            {/* Enhanced Dev Helper */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="mb-8 p-5 bg-gradient-to-r from-blue-100 via-purple-50 to-blue-100 border-2 border-blue-200/50 rounded-2xl text-blue-800 shadow-lg backdrop-blur-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center"
                >
                  <Zap className="h-4 w-4 text-white" />
                </motion.div>
                <div className="font-bold text-lg">⚡ Quick Dev Access</div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                  <span><strong>Email:</strong> demo@skemya.com</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                  <span><strong>Password:</strong> demo123</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDevLogin}
                  className="w-full mt-3 p-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Auto-fill credentials
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <Card className="backdrop-blur-xl bg-white/85 border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500">
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0, rotateY: -90 }}
                    animate={{ scale: 1, rotateY: 0 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-1 bg-gradient-to-r from-white/30 to-white/10 rounded-3xl"
                    />
                    <User className="h-10 w-10 text-white relative z-10" />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <CardTitle className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      Welcome back
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600 mt-2">
                      Sign in to continue your journey
                    </CardDescription>
                  </motion.div>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Enhanced Email Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                        Email Address
                      </Label>
                      <div className="relative">
                        <motion.div
                          animate={{
                            scale: focusedField === "email" ? 1.05 : 1,
                            boxShadow: focusedField === "email" 
                              ? "0 0 20px rgba(59, 130, 246, 0.3)" 
                              : "0 0 0px rgba(59, 130, 246, 0)"
                          }}
                          transition={{ duration: 0.2 }}
                          className="relative"
                        >
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            className="pl-12 h-12 bg-white/80 border-gray-200 focus:border-blue-400 focus:bg-white transition-all rounded-xl"
                            required
                          />
                        </motion.div>
                        <AnimatePresence>
                          {email && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                    
                    {/* Enhanced Password Field */}
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                        Password
                      </Label>
                      <div className="relative">
                        <motion.div
                          animate={{
                            scale: focusedField === "password" ? 1.05 : 1,
                            boxShadow: focusedField === "password" 
                              ? "0 0 20px rgba(139, 92, 246, 0.3)" 
                              : "0 0 0px rgba(139, 92, 246, 0)"
                          }}
                          transition={{ duration: 0.2 }}
                          className="relative"
                        >
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedField("password")}
                            onBlur={() => setFocusedField(null)}
                            className="pl-12 pr-12 h-12 bg-white/80 border-gray-200 focus:border-purple-400 focus:bg-white transition-all rounded-xl"
                            required
                          />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </motion.button>
                        </motion.div>
                        <AnimatePresence>
                          {password && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0 }}
                              className="absolute right-12 top-1/2 -translate-y-1/2"
                            >
                              <Shield className="h-5 w-5 text-green-500" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                      className="flex items-center justify-between text-sm"
                    >
                      <Link 
                        href="/auth/forgot-password" 
                        className="text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </motion.div>

                    {/* Enhanced Submit Button */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      <Button 
                        type="submit" 
                        className="w-full h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl relative overflow-hidden group" 
                        disabled={isLoading}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/20"
                          animate={{ x: isLoading ? [-100, 300] : -100 }}
                          transition={{ duration: 1.5, repeat: isLoading ? Infinity : 0 }}
                        />
                        <AnimatePresence mode="wait">
                          {isLoading ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-3"
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                              />
                              <span>Signing you in...</span>
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-3"
                            >
                              <Sparkles className="h-5 w-5" />
                              <span>Sign in to continue</span>
                              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Button>
                    </motion.div>
                  </form>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="mt-8 text-center"
                  >
                    <div className="text-gray-600">
                      Don't have an account?{" "}
                      <Link 
                        href="/auth/signup" 
                        className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
                      >
                        Create one now
                      </Link>
                    </div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}