import { describe, it, expect } from "vitest";
import { productSchema } from "@/schemas/product.schema";

describe("productSchema", () => {
  const valid = {
    name: "Троянда",
    price: 250,
    image: "https://example.com/rose.jpg",
    stock: 10,
    categoryId: "cat-1",
    color: "red",
  };

  it("passes with all required fields", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it("passes with optional fields filled", () => {
    const result = productSchema.safeParse({
      ...valid,
      rating: 4.5,
      type: "Зрізані",
      description: "Свіжа троянда",
    });
    expect(result.success).toBe(true);
  });

  it("fails when name is empty", () => {
    expect(productSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("fails when price is zero", () => {
    expect(productSchema.safeParse({ ...valid, price: 0 }).success).toBe(false);
  });

  it("fails when price is negative", () => {
    expect(productSchema.safeParse({ ...valid, price: -10 }).success).toBe(false);
  });

  it("fails when image is not a URL", () => {
    expect(productSchema.safeParse({ ...valid, image: "not-a-url" }).success).toBe(false);
  });

  it("fails when stock is negative", () => {
    expect(productSchema.safeParse({ ...valid, stock: -1 }).success).toBe(false);
  });

  it("fails when rating is out of range", () => {
    expect(productSchema.safeParse({ ...valid, rating: 6 }).success).toBe(false);
  });

  it("passes when stock is zero (out of stock)", () => {
    expect(productSchema.safeParse({ ...valid, stock: 0 }).success).toBe(true);
  });
});
