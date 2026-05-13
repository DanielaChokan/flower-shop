import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

const mockOpenAuth = vi.fn();
const mockRouterReplace = vi.fn();
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ replace: mockRouterReplace }),
}));

vi.mock("@/modules/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/modules/auth/AuthContext";
import AuthRequiredListener from "@/components/UI/AuthRequiredListener";

describe("AuthRequiredListener", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens auth modal and redirects when authRequired=1 and user is not logged in", () => {
    mockGet.mockReturnValue("1");
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
      openAuth: mockOpenAuth,
    });

    render(<AuthRequiredListener />);
    expect(mockOpenAuth).toHaveBeenCalled();
    expect(mockRouterReplace).toHaveBeenCalledWith("/");
  });

  it("does nothing when authRequired param is absent", () => {
    mockGet.mockReturnValue(null);
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
      openAuth: mockOpenAuth,
    });

    render(<AuthRequiredListener />);
    expect(mockOpenAuth).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("does nothing when user is authenticated even if param is set", () => {
    mockGet.mockReturnValue("1");
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { uid: "abc" },
      loading: false,
      openAuth: mockOpenAuth,
    });

    render(<AuthRequiredListener />);
    expect(mockOpenAuth).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("does nothing while auth is still loading", () => {
    mockGet.mockReturnValue("1");
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: true,
      openAuth: mockOpenAuth,
    });

    render(<AuthRequiredListener />);
    expect(mockOpenAuth).not.toHaveBeenCalled();
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  it("renders nothing (returns null)", () => {
    mockGet.mockReturnValue(null);
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      loading: false,
      openAuth: mockOpenAuth,
    });

    const { container } = render(<AuthRequiredListener />);
    expect(container.firstChild).toBeNull();
  });
});
