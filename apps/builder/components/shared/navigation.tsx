'use client';

import Link from 'next/link';
import { Button } from '@forms/ui';
import { Sparkles, LogIn } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  const isBuilder = pathname?.startsWith('/forms');

  return (
    <nav className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Sparkles className="h-6 w-6 text-primary" />
          Forms
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {isBuilder ? (
            <>
              <Link href="/forms">
                <Button variant="ghost" size="sm">
                  My Forms
                </Button>
              </Link>
              <Link href="/integrations">
                <Button variant="ghost" size="sm">
                  Integrations
                </Button>
              </Link>
              <Button variant="ghost" size="sm">
                Account
              </Button>
            </>
          ) : (
            <>
              <Link href="http://localhost:3000#features">
                <Button variant="ghost" size="sm">
                  Features
                </Button>
              </Link>
              <Link href="http://localhost:3000#templates">
                <Button variant="ghost" size="sm">
                  Templates
                </Button>
              </Link>
              <Link href="http://localhost:3000/pricing">
                <Button variant="ghost" size="sm">
                  Pricing
                </Button>
              </Link>
              <Link href="http://localhost:3001/forms">
                <Button variant="ghost" size="sm">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign in
                </Button>
              </Link>
              <Link href="http://localhost:3001">
                <Button size="sm">
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