"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the forms page which is now the main dashboard
    router.replace("/forms");
  }, [router]);

  return null;
}
