import { Metadata } from "next";
import { GDPRDashboard } from "@/components/gdpr/gdpr-dashboard";

export const metadata: Metadata = {
  title: "GDPR Compliance | Forms",
  description: "Manage data protection and privacy compliance",
};

export default function GDPRPage() {
  return (
    <div className="container mx-auto py-6">
      <GDPRDashboard />
    </div>
  );
}
