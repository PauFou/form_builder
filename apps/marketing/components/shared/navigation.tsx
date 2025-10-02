"use client";

import Link from "next/link";
import { Button } from "@skemya/ui";
import { LogIn, Sparkles, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export function Navigation() {
  const pathname = usePathname();
  const isBuilder = pathname?.startsWith("/forms");

  return (
    <nav className="fixed top-0 w-full border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container flex h-20 items-center px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            S
          </div>
          <span>Skemya</span>
        </Link>

        <div className="ml-auto flex items-center gap-4">
          <Link href="/features">
            <Button variant="ghost" size="sm">
              Features
            </Button>
          </Link>
          <Link href="/templates">
            <Button variant="ghost" size="sm">
              Templates
            </Button>
          </Link>
          <Link href="/pricing">
            <Button variant="ghost" size="sm">
              Pricing
            </Button>
          </Link>
          
          <div className="h-8 w-px bg-border/50 mx-2" />
          
          <Link href="http://localhost:3301/auth/login">
            <Button
              variant="outline"
              className="font-medium h-10 px-6"
            >
              Sign in
            </Button>
          </Link>
          <Link href="http://localhost:3301/auth/signup">
            <Button 
              className="btn-gradient font-medium h-10 px-6"
            >
              Get started free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}