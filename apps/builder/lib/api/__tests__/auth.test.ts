import { authApi } from "../auth";
import { apiClient } from "../axios-client";

// Mock the axios client
jest.mock("../axios-client");

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("authApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("sends login credentials and returns auth response", async () => {
      const mockResponse = {
        data: {
          access: "access-token",
          refresh: "refresh-token",
          user: { id: "1", email: "test@example.com" },
          organization: { id: "org-1", name: "Test Org" },
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const credentials = { email: "test@example.com", password: "password123" };
      const result = await authApi.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith("/v1/auth/login/", credentials);
      expect(result).toEqual(mockResponse.data);
    });

    it("handles login errors", async () => {
      const error = new Error("Invalid credentials");
      (apiClient.post as jest.Mock).mockRejectedValue(error);

      const credentials = { email: "test@example.com", password: "wrong" };

      await expect(authApi.login(credentials)).rejects.toThrow("Invalid credentials");
    });
  });

  describe("signup", () => {
    it("sends signup data and returns auth response", async () => {
      const mockResponse = {
        data: {
          access: "access-token",
          refresh: "refresh-token",
          user: { id: "2", email: "new@example.com" },
          organization: { id: "org-2", name: "New Org" },
        },
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const signupData = {
        name: "New User",
        email: "new@example.com",
        password: "password123",
        organization_name: "New Org",
      };
      const result = await authApi.signup(signupData);

      expect(apiClient.post).toHaveBeenCalledWith("/v1/auth/signup/", signupData);
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("logout", () => {
    it("calls logout endpoint with refresh token", async () => {
      localStorageMock.getItem.mockReturnValue("refresh-token");
      (apiClient.post as jest.Mock).mockResolvedValue({ data: {} });

      await authApi.logout();

      expect(localStorageMock.getItem).toHaveBeenCalledWith("refresh_token");
      expect(apiClient.post).toHaveBeenCalledWith("/v1/auth/logout/", {
        refresh: "refresh-token",
      });
    });

    it("skips API call if no refresh token", async () => {
      localStorageMock.getItem.mockReturnValue(null);

      await authApi.logout();

      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe("getMe", () => {
    it("fetches current user information", async () => {
      const mockResponse = {
        data: {
          user: { id: "1", email: "user@example.com" },
          organization: { id: "org-1", name: "Test Org" },
        },
      };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.getMe();

      expect(apiClient.get).toHaveBeenCalledWith("/v1/auth/me/");
      expect(result).toEqual(mockResponse.data);
    });

    it("returns empty user data if response is invalid", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: null });

      const result = await authApi.getMe();

      expect(result).toEqual({
        user: { id: "", email: "" },
        organization: { id: "", name: "" },
      });
    });

    it("returns empty user data if no user in response", async () => {
      (apiClient.get as jest.Mock).mockResolvedValue({ data: {} });

      const result = await authApi.getMe();

      expect(result).toEqual({
        user: { id: "", email: "" },
        organization: { id: "", name: "" },
      });
    });
  });

  describe("refresh", () => {
    it("refreshes access token", async () => {
      const mockResponse = {
        data: { access: "new-access-token" },
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.refresh("refresh-token");

      expect(apiClient.post).toHaveBeenCalledWith("/v1/auth/refresh/", {
        refresh: "refresh-token",
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("requestPasswordReset", () => {
    it("sends password reset request", async () => {
      const mockResponse = {
        data: { success: true, message: "Reset link sent" },
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.requestPasswordReset("user@example.com");

      expect(apiClient.post).toHaveBeenCalledWith("/v1/auth/password-reset/request/", {
        email: "user@example.com",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("handles password reset request errors", async () => {
      const mockResponse = {
        data: { success: false, message: "User not found" },
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.requestPasswordReset("unknown@example.com");

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("resetPassword", () => {
    it("resets password with token", async () => {
      const mockResponse = {
        data: { success: true, message: "Password reset successful" },
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.resetPassword("reset-token", "newpassword123");

      expect(apiClient.post).toHaveBeenCalledWith("/v1/auth/password-reset/confirm/", {
        token: "reset-token",
        password: "newpassword123",
      });
      expect(result).toEqual(mockResponse.data);
    });

    it("handles invalid reset token", async () => {
      const mockResponse = {
        data: { success: false, message: "Invalid or expired token" },
      };
      (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const result = await authApi.resetPassword("invalid-token", "newpassword123");

      expect(result).toEqual(mockResponse.data);
    });
  });
});
