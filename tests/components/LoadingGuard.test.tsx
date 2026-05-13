import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("@/modules/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/modules/auth/AuthContext";
import LoadingGuard from "@/components/UI/LoadingGuard";

describe("LoadingGuard", () => {
  it("renders children when not loading", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ loading: false });
    render(<LoadingGuard><span>Content</span></LoadingGuard>);
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders spinner and hides children when loading", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({ loading: true });
    render(<LoadingGuard><span>Content</span></LoadingGuard>);
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });
});
