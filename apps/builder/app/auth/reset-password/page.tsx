"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@skemya/ui";
import { Lock, ArrowLeft, KeySquare, CheckCircle, Eye, EyeOff, Shield } from "lucide-react";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get("token");

  const validatePassword = (password: string) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  };

  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword(password) || !passwordsMatch) {
      return;
    }
    setIsLoading(true);
    // Mock submission
    setTimeout(() => {
      setIsLoading(false);
      router.push("/auth/login");
    }, 1500);
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60">
        <div className="absolute inset-0 -z-10">
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "radial-gradient(600px circle at 20% 40%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(800px circle at 80% 60%, rgba(139, 92, 246, 0.15), transparent 50%)",
                "radial-gradient(600px circle at 60% 20%, rgba(59, 130, 246, 0.2), transparent 50%), radial-gradient(800px circle at 40% 80%, rgba(139, 92, 246, 0.2), transparent 50%)",
                "radial-gradient(600px circle at 20% 40%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(800px circle at 80% 60%, rgba(139, 92, 246, 0.15), transparent 50%)",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <Card className="w-full max-w-md backdrop-blur-xl bg-white/85 border-white/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Invalid reset link</CardTitle>
            <CardDescription className="text-center">
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/auth/forgot-password" className="block">
              <Button variant="outline" className="w-full">
                Request new link
              </Button>
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center font-medium"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-100/60">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              "radial-gradient(600px circle at 20% 40%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(800px circle at 80% 60%, rgba(139, 92, 246, 0.15), transparent 50%)",
              "radial-gradient(600px circle at 60% 20%, rgba(59, 130, 246, 0.2), transparent 50%), radial-gradient(800px circle at 40% 80%, rgba(139, 92, 246, 0.2), transparent 50%)",
              "radial-gradient(600px circle at 20% 40%, rgba(59, 130, 246, 0.15), transparent 50%), radial-gradient(800px circle at 80% 60%, rgba(139, 92, 246, 0.15), transparent 50%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="w-full max-w-md px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Card className="backdrop-blur-xl bg-white/85 border-white/30 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0, rotateY: -90 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <Shield className="h-8 w-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Reset your password
              </CardTitle>
              <CardDescription className="text-lg">Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-12 bg-white/80 border-gray-200 focus:border-purple-400 focus:bg-white transition-all rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {password && (
                    <p className="text-xs text-muted-foreground">
                      Password strength:{" "}
                      {validatePassword(password) ? (
                        <span className="text-green-600 font-medium">Strong</span>
                      ) : (
                        <span className="text-orange-600 font-medium">
                          Needs uppercase, lowercase, and numbers (min 8 chars)
                        </span>
                      )}
                    </p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2"
                >
                  <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-12 pr-12 h-12 bg-white/80 border-gray-200 focus:border-purple-400 focus:bg-white transition-all rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                    {confirmPassword &&
                      (passwordsMatch ? (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                      ) : (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-orange-500" />
                      ))}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-4"
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                    disabled={isLoading || !validatePassword(password) || !passwordsMatch}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Resetting password...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Reset password
                      </div>
                    )}
                  </Button>

                  <Link
                    href="/auth/login"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center font-medium"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Link>
                </motion.div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
