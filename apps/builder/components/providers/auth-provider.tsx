"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "../../lib/stores/auth-store";

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<{
  isAuthenticated: boolean;
  isLoading: boolean;
}>({
  isAuthenticated: false,
  isLoading: true,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, checkAuth, isAuthenticated } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Give Zustand time to rehydrate from localStorage
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    // Check for existing token
    const token = localStorage.getItem("access_token");

    // If we have a token but no user data, verify it
    if (token && !user) {
      checkAuth();
    } else if (!token && !isAuthenticated && !pathname?.startsWith("/auth/")) {
      // No token, not authenticated, and not on auth page - redirect to login
      router.push("/auth/login");
    }
  }, [isInitialized, user, isAuthenticated, pathname, checkAuth, router]);

  // Show nothing while initializing to prevent flash
  if (!isInitialized) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading }}>{children}</AuthContext.Provider>
  );
}
