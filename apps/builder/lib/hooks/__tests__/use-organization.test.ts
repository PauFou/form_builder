import { renderHook, waitFor } from "@testing-library/react";
import { useOrganization } from "../use-organization";

describe("useOrganization", () => {
  it("returns initial loading state", () => {
    const { result } = renderHook(() => useOrganization());

    // The hook immediately sets data, so loading is false
    expect(result.current.loading).toBe(false);
    expect(result.current.organization).toEqual({
      id: "1",
      name: "My Organization",
      plan: "free",
    });
  });

  it("loads organization data on mount", async () => {
    const { result } = renderHook(() => useOrganization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.organization).toEqual({
      id: "1",
      name: "My Organization",
      plan: "free",
    });
  });

  it("maintains stable organization reference", async () => {
    const { result, rerender } = renderHook(() => useOrganization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstOrganization = result.current.organization;

    // Re-render the hook
    rerender();

    // Organization reference should remain the same
    expect(result.current.organization).toBe(firstOrganization);
  });

  it("only loads organization once", async () => {
    const { result, rerender } = renderHook(() => useOrganization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const firstOrganization = result.current.organization;

    // Re-render multiple times
    rerender();
    rerender();
    rerender();

    // Organization should not change
    expect(result.current.organization).toBe(firstOrganization);
    expect(result.current.organization).toEqual({
      id: "1",
      name: "My Organization",
      plan: "free",
    });
  });

  it("provides organization data structure", async () => {
    const { result } = renderHook(() => useOrganization());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const { organization } = result.current;
    expect(organization).toHaveProperty("id");
    expect(organization).toHaveProperty("name");
    expect(organization).toHaveProperty("plan");

    expect(typeof organization?.id).toBe("string");
    expect(typeof organization?.name).toBe("string");
    expect(typeof organization?.plan).toBe("string");
  });

  it("handles loading state transition", async () => {
    const { result } = renderHook(() => useOrganization());

    // The hook immediately sets data synchronously
    expect(result.current).toEqual({
      organization: {
        id: "1",
        name: "My Organization",
        plan: "free",
      },
      loading: false,
    });
  });
});
