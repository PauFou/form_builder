import { useState, useEffect } from "react";

export interface Organization {
  id: string;
  name: string;
  plan: string;
  // Add other org properties as needed
}

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock implementation - replace with actual API call
    setOrganization({
      id: "1",
      name: "My Organization",
      plan: "free",
    });
    setLoading(false);
  }, []);

  return { organization, loading };
}
