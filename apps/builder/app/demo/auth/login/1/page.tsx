"use client";

// DEMO VERSION 1 - Login Page Actuelle avec Background Bleu
// Version de base avec background aurora et dev helper

import { useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@skemya/ui";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function LoginDemo1() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock submission
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <>
      {/* Demo Header */}
      <div className="fixed top-0 w-full bg-blue-500 text-white z-50 p-2 text-center text-sm font-semibold">
        🔐 DEMO 1: Login Page Actuelle avec Background Aurora et Dev Helper
      </div>
      
      <div style={{ paddingTop: "40px" }}>
        {/* Aurora Background */}
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
            <div className="absolute top-0 -left-48 h-96 w-96 rounded-full bg-blue-400/30 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-purple-400/30 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-r from-blue-300/20 to-purple-300/20 blur-3xl animate-pulse" />
          </div>

          <div className="w-full max-w-md px-6 relative z-10">
            {/* Dev Helper */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-blue-100 border border-blue-200 rounded-lg text-blue-800 text-sm"
            >
              <div className="font-semibold mb-2">🚀 Dev Helper</div>
              <div className="text-xs space-y-1">
                <div><strong>Email:</strong> demo@skemya.com</div>
                <div><strong>Password:</strong> demo123</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="backdrop-blur-sm bg-white/80 border-white/20 shadow-xl">
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  >
                    <Sparkles className="h-8 w-8 text-white" />
                  </motion.div>
                  <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                  <CardDescription>Sign in to your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <Link href="/auth/forgot-password" className="text-primary hover:underline">
                        Forgot password?
                      </Link>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Sign in
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </Button>
                  </form>

                  <div className="mt-6 text-center text-sm">
                    Don't have an account?{" "}
                    <Link href="/auth/signup" className="text-primary font-medium hover:underline">
                      Sign up
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}