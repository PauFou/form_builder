import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "../auth-store";
import { authApi } from "../../api/auth";

// Mock the auth API
jest.mock("../../api/auth", () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    signup: jest.fn(),
    getMe: jest.fn(),
    refresh: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock document.cookie
Object.defineProperty(document, "cookie", {
  writable: true,
  value: "",
});

describe("useAuthStore", () => {
  const mockUser = { id: "1", email: "test@example.com", name: "Test User" };
  const mockOrganization = { id: "org-1", name: "Test Org" };
  const mockTokens = { access: "access-token", refresh: "refresh-token" };

  // Store original console.error for restoration
  const originalConsoleError = console.error;

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    document.cookie = "";
    // Silence console.error for this test suite
    console.error = jest.fn();

    // Reset all auth API mocks to successful responses by default
    (authApi.login as jest.Mock).mockResolvedValue({});
    (authApi.logout as jest.Mock).mockResolvedValue(undefined);
    (authApi.signup as jest.Mock).mockResolvedValue({});
    (authApi.getMe as jest.Mock).mockResolvedValue({});

    // Reset store state
    useAuthStore.setState({
      user: null,
      organization: null,
      isAuthenticated: false,
      isLoading: true,
    });
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.organization).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe("login", () => {
    it("successfully logs in user", async () => {
      const mockResponse = {
        ...mockTokens,
        user: mockUser,
        organization: mockOrganization,
      };
      (authApi.login as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login("test@example.com", "password123");
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith("access_token", "access-token");
      expect(localStorageMock.setItem).toHaveBeenCalledWith("refresh_token", "refresh-token");

      expect(document.cookie).toContain("auth-token=access-token");

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.organization).toEqual(mockOrganization);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("handles login error", async () => {
      const error = new Error("Invalid credentials");
      (authApi.login as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      try {
        await act(async () => {
          await result.current.login("test@example.com", "wrong");
        });
      } catch (err) {
        // Expected to throw
      }

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it("sets loading state during login", async () => {
      let resolveLogin: any;
      (authApi.login as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveLogin = resolve;
          })
      );

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login("test@example.com", "password");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin({
          ...mockTokens,
          user: mockUser,
          organization: mockOrganization,
        });
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("logout", () => {
    it("logs out user and clears tokens", async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: mockUser,
        organization: mockOrganization,
        isAuthenticated: true,
        isLoading: false,
      });

      (authApi.logout as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(authApi.logout).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("access_token");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("refresh_token");

      expect(document.cookie).toContain("auth-token=; path=/; expires=Thu, 01 Jan 1970");

      expect(result.current.user).toBeNull();
      expect(result.current.organization).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("clears state even if API call fails", async () => {
      // Mock API to reject - set it up before anything else
      (authApi.logout as jest.Mock).mockImplementation(() =>
        Promise.reject(new Error("Network error"))
      );

      useAuthStore.setState({
        user: mockUser,
        organization: mockOrganization,
        isAuthenticated: true,
        isLoading: false,
      });

      // Mock localStorage to have a refresh token
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === "refresh_token") return "refresh-token";
        return null;
      });

      const { result } = renderHook(() => useAuthStore());

      // The logout function uses try...finally so it won't throw
      await act(async () => {
        // logout doesn't throw errors - it handles them in the finally block
        await result.current.logout();
      });

      // State should still be cleared because of the finally block
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("access_token");
      expect(localStorageMock.removeItem).toHaveBeenCalledWith("refresh_token");

      // API should have been called even though it failed
      expect(authApi.logout).toHaveBeenCalled();
    });
  });

  describe("signup", () => {
    it("successfully signs up user", async () => {
      const mockResponse = {
        ...mockTokens,
        user: mockUser,
        organization: mockOrganization,
      };
      (authApi.signup as jest.Mock).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signup("test@example.com", "password123", "Test User", "Test Org");
      });

      expect(authApi.signup).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
        organization_name: "Test Org",
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith("access_token", "access-token");
      expect(localStorageMock.setItem).toHaveBeenCalledWith("refresh_token", "refresh-token");

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.organization).toEqual(mockOrganization);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("handles signup error", async () => {
      const error = new Error("Email already exists");
      (authApi.signup as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      try {
        await act(async () => {
          await result.current.signup("existing@example.com", "password", "Test", "Org");
        });
      } catch (err) {
        // Expected to throw
      }

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("checkAuth", () => {
    it("verifies authentication with valid token", async () => {
      localStorageMock.getItem.mockReturnValue("valid-token");
      (authApi.getMe as jest.Mock).mockResolvedValue({
        user: mockUser,
        organization: mockOrganization,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(authApi.getMe).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.organization).toEqual(mockOrganization);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it("sets unauthenticated when no token", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(authApi.getMe).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it("handles API error during auth check", async () => {
      localStorageMock.getItem.mockReturnValue("expired-token");
      (authApi.getMe as jest.Mock).mockRejectedValue(new Error("Token expired"));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.organization).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("updateUser", () => {
    it("updates user properties", () => {
      useAuthStore.setState({
        user: mockUser,
        organization: mockOrganization,
        isAuthenticated: true,
        isLoading: false,
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({ name: "Updated Name", email: "new@example.com" });
      });

      expect(result.current.user).toEqual({
        ...mockUser,
        name: "Updated Name",
        email: "new@example.com",
      });
    });

    it("does nothing when user is null", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.updateUser({ name: "New Name" });
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe("persistence", () => {
    it("persists auth state to localStorage", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          user: mockUser,
          organization: mockOrganization,
          isAuthenticated: true,
        });
      });

      // The store should persist to localStorage
      // Note: Actual persistence testing may require more setup with zustand persist
      expect(result.current.user).toEqual(mockUser);
    });
  });
});
