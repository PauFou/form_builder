"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@skemya/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@skemya/ui";
import { LogIn, User, LogOut, Settings } from "lucide-react";
import { useAuthStore } from "../../lib/stores/auth-store";

export function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <nav className="fixed top-0 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container flex h-16 items-center px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg group">
          <img
            src="/favicon.svg"
            alt="Skemya"
            className="h-6 w-6 group-hover:scale-110 transition-transform"
          />
          <span className="text-foreground group-hover:text-primary transition-colors">Skemya</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 hover:bg-transparent group">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="max-w-[150px] truncate text-muted-foreground group-hover:text-foreground transition-colors">
                      {user?.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/profile">
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/settings">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Organization Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/auth/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button
                  size="sm"
                  className="bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
                >
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
