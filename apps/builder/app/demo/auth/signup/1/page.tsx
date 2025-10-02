"use client";

// DEMO VERSION 1 - Signup Page Ultra-Moderne avec Animations Premium
// Version sophistiquée avec étapes guidées et validation en temps réel

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Checkbox } from "@skemya/ui";
import { 
  Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, User, Building, 
  CheckCircle, AlertCircle, Shield, Zap, Crown, Star
} from "lucide-react";
import Link from "next/link";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

export default function SignupDemo1() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    agreeToMarketing: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock submission
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";

  const getStepValidation = (step: number) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && validateEmail(formData.email);
      case 2:
        return formData.password && validatePassword(formData.password) && passwordsMatch;
      case 3:
        return formData.agreeToTerms;
      default:
        return false;
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Tell us about yourself</h3>
        <p className="text-gray-600">Let's get your account set up</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              onFocus={() => setFocusedField("firstName")}
              onBlur={() => setFocusedField(null)}
              className="pl-10"
            />
            {formData.firstName && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              onFocus={() => setFocusedField("lastName")}
              onBlur={() => setFocusedField(null)}
              className="pl-10"
            />
            {formData.lastName && (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="john@company.com"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onFocus={() => setFocusedField("email")}
            onBlur={() => setFocusedField(null)}
            className="pl-10"
          />
          {formData.email && (
            validateEmail(formData.email) ? (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
            )
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company (Optional)</Label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="company"
            placeholder="Acme Inc."
            value={formData.company}
            onChange={(e) => handleInputChange("company", e.target.value)}
            onFocus={() => setFocusedField("company")}
            onBlur={() => setFocusedField(null)}
            className="pl-10"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Secure your account</h3>
        <p className="text-gray-600">Create a strong password</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {formData.password && (
          <div className="text-xs text-gray-500 mt-1">
            Password strength: {validatePassword(formData.password) ? (
              <span className="text-green-600 font-medium">Strong</span>
            ) : (
              <span className="text-orange-600 font-medium">Weak (min 8 characters)</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            onFocus={() => setFocusedField("confirmPassword")}
            onBlur={() => setFocusedField(null)}
            className="pl-10 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {formData.confirmPassword && (
            passwordsMatch ? (
              <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Almost there!</h3>
        <p className="text-gray-600">Review and accept our terms</p>
      </div>

      <div className="space-y-6">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms"
            checked={formData.agreeToTerms}
            onCheckedChange={(checked) => handleInputChange("agreeToTerms", !!checked)}
            className="mt-1"
          />
          <div className="text-sm">
            <label htmlFor="terms" className="font-medium text-gray-900 cursor-pointer">
              I agree to the{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Checkbox
            id="marketing"
            checked={formData.agreeToMarketing}
            onCheckedChange={(checked) => handleInputChange("agreeToMarketing", !!checked)}
            className="mt-1"
          />
          <div className="text-sm">
            <label htmlFor="marketing" className="text-gray-700 cursor-pointer">
              I'd like to receive product updates and marketing emails
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Welcome to the Premium Experience!</h4>
            <p className="text-gray-600 text-sm">Start your free trial today</p>
          </div>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Unlimited forms and responses
          </li>
          <li className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Advanced analytics and insights
          </li>
          <li className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Priority support and onboarding
          </li>
        </ul>
      </div>
    </motion.div>
  );

  return (
    <>
      {/* Demo Header */}
      <div className="fixed top-0 w-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 text-white z-50 p-2 text-center text-sm font-bold">
        🚀 DEMO 1: Signup Ultra-Moderne avec Étapes Guidées et Validation Temps Réel
      </div>
      
      <div style={{ paddingTop: "40px" }}>
        {/* Enhanced Background */}
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-100/30">
          
          {/* Animated background elements */}
          <div className="absolute inset-0 -z-10">
            <motion.div 
              animate={{
                background: [
                  "radial-gradient(600px circle at 25% 25%, rgba(59, 130, 246, 0.12), transparent 50%), radial-gradient(800px circle at 75% 75%, rgba(139, 92, 246, 0.12), transparent 50%)",
                  "radial-gradient(600px circle at 75% 25%, rgba(59, 130, 246, 0.18), transparent 50%), radial-gradient(800px circle at 25% 75%, rgba(139, 92, 246, 0.18), transparent 50%)",
                  "radial-gradient(600px circle at 25% 25%, rgba(59, 130, 246, 0.12), transparent 50%), radial-gradient(800px circle at 75% 75%, rgba(139, 92, 246, 0.12), transparent 50%)"
                ]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0"
            />
          </div>

          <div className="w-full max-w-lg px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card className="backdrop-blur-xl bg-white/90 border-white/30 shadow-2xl">
                <CardHeader className="text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                  >
                    <Sparkles className="h-8 w-8 text-white" />
                  </motion.div>
                  
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Join Skemya
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    Create your account in {currentStep}/3 steps
                  </CardDescription>

                  {/* Progress Indicator */}
                  <div className="flex justify-center mt-6 space-x-2">
                    {[1, 2, 3].map((step) => (
                      <motion.div
                        key={step}
                        className={`w-3 h-3 rounded-full ${
                          step <= currentStep 
                            ? "bg-gradient-to-r from-blue-500 to-purple-500" 
                            : "bg-gray-200"
                        }`}
                        animate={{
                          scale: step === currentStep ? 1.2 : 1,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">
                      {currentStep === 1 && renderStep1()}
                      {currentStep === 2 && renderStep2()}
                      {currentStep === 3 && renderStep3()}
                    </AnimatePresence>

                    <div className="flex justify-between mt-8 space-x-4">
                      {currentStep > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCurrentStep(currentStep - 1)}
                          className="flex-1"
                        >
                          Back
                        </Button>
                      )}
                      
                      {currentStep < 3 ? (
                        <Button
                          type="button"
                          onClick={() => setCurrentStep(currentStep + 1)}
                          disabled={!getStepValidation(currentStep)}
                          className={`${currentStep === 1 ? "w-full" : "flex-1"} bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600`}
                        >
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={!getStepValidation(currentStep) || isLoading}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Creating account...
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Create Account
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  </form>

                  <div className="mt-8 text-center">
                    <div className="text-gray-600">
                      Already have an account?{" "}
                      <Link href="/auth/login" className="text-blue-600 font-semibold hover:underline">
                        Sign in
                      </Link>
                    </div>
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