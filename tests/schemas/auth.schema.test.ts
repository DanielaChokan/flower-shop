import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";

describe("loginSchema", () => {
  it("passes with valid credentials", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "secret123" });
    expect(result.success).toBe(true);
  });

  it("fails when email is missing", () => {
    const result = loginSchema.safeParse({ email: "", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("fails with invalid email format", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "secret123" });
    expect(result.success).toBe(false);
  });

  it("fails when password is shorter than 6 characters", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    lastName: "Коваль",
    firstName: "Іван",
    email: "ivan@example.com",
    password: "password1",
  };

  it("passes with valid data", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("fails when firstName is empty", () => {
    const result = registerSchema.safeParse({ ...valid, firstName: "" });
    expect(result.success).toBe(false);
  });

  it("fails when lastName contains digits", () => {
    const result = registerSchema.safeParse({ ...valid, lastName: "Коваль123" });
    expect(result.success).toBe(false);
  });

  it("fails when email is invalid", () => {
    const result = registerSchema.safeParse({ ...valid, email: "bad" });
    expect(result.success).toBe(false);
  });

  it("fails when password is too short", () => {
    const result = registerSchema.safeParse({ ...valid, password: "12345" });
    expect(result.success).toBe(false);
  });
});
