// Development utilities
export const setupDevAuth = () => {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") {
    return;
  }

  // Set a fake token to bypass auth checks
  localStorage.setItem("access_token", "dev-token-123");
  localStorage.setItem("refresh_token", "dev-refresh-123");

  // Set fake user data
  const devUser = {
    id: "dev-user-id",
    email: "dev@example.com",
    name: "Dev User",
  };

  const devOrg = {
    id: "dev-org-id",
    name: "Dev Organization",
    slug: "dev-org",
  };

  // Store in auth store format
  const authData = {
    state: {
      user: devUser,
      organization: devOrg,
      isAuthenticated: true,
      isLoading: false,
    },
    version: 0,
  };

  localStorage.setItem("auth-store", JSON.stringify(authData));

  console.log("Dev auth setup complete");

  // Force reload to apply changes
  window.location.reload();
};

// Auto-setup in development if no auth
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const hasAuth = localStorage.getItem("access_token");
  if (!hasAuth) {
    console.log("No auth detected, setting up dev auth...");
    // Give React time to mount
    setTimeout(setupDevAuth, 100);
  }
}
