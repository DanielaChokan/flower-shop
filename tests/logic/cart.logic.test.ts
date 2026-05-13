import { describe, it, expect } from "vitest";
import type { CartItem } from "@/modules/cart/CartContext";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "1",
    name: "Троянда",
    price: 100,
    image: "/rose.jpg",
    rating: 4,
    quantity: 1,
    ...overrides,
  };
}

function addItem(items: CartItem[], product: Omit<CartItem, "quantity">): CartItem[] {
  const existing = items.find((i) => i.id === product.id);
  if (existing) {
    const newQty = existing.quantity + 1;
    const clamped = existing.stock !== undefined ? Math.min(newQty, existing.stock) : newQty;
    return items.map((i) => (i.id === product.id ? { ...i, quantity: clamped } : i));
  }
  return [...items, { ...product, quantity: 1 }];
}

function removeItem(items: CartItem[], id: string): CartItem[] {
  return items.filter((i) => i.id !== id);
}

function updateQuantity(items: CartItem[], id: string, quantity: number): CartItem[] {
  if (quantity <= 0) return items.filter((i) => i.id !== id);
  const item = items.find((i) => i.id === id);
  const clamped = item?.stock !== undefined ? Math.min(quantity, item.stock) : quantity;
  return items.map((i) => (i.id === id ? { ...i, quantity: clamped } : i));
}

function calcTotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

function calcItemCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}

describe("addItem", () => {
  it("adds a new item with quantity 1", () => {
    const result = addItem([], makeItem());
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(1);
  });

  it("increments quantity for existing item", () => {
    const existing = [makeItem({ quantity: 2 })];
    const result = addItem(existing, makeItem());
    expect(result[0].quantity).toBe(3);
  });

  it("clamps to stock limit when adding existing item", () => {
    const existing = [makeItem({ quantity: 5, stock: 5 })];
    const result = addItem(existing, makeItem({ stock: 5 }));
    expect(result[0].quantity).toBe(5);
  });

  it("does not clamp when no stock defined", () => {
    const existing = [makeItem({ quantity: 99 })];
    const result = addItem(existing, makeItem());
    expect(result[0].quantity).toBe(100);
  });
});

describe("removeItem", () => {
  it("removes the correct item", () => {
    const items = [makeItem({ id: "1" }), makeItem({ id: "2" })];
    const result = removeItem(items, "1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("returns the same array if item not found", () => {
    const items = [makeItem({ id: "1" })];
    const result = removeItem(items, "999");
    expect(result).toHaveLength(1);
  });
});

describe("updateQuantity", () => {
  it("updates quantity of an item", () => {
    const items = [makeItem({ id: "1", quantity: 1 })];
    const result = updateQuantity(items, "1", 4);
    expect(result[0].quantity).toBe(4);
  });

  it("removes item when quantity is 0", () => {
    const items = [makeItem({ id: "1", quantity: 3 })];
    const result = updateQuantity(items, "1", 0);
    expect(result).toHaveLength(0);
  });

  it("removes item when quantity is negative", () => {
    const items = [makeItem({ id: "1", quantity: 2 })];
    const result = updateQuantity(items, "1", -1);
    expect(result).toHaveLength(0);
  });

  it("clamps to stock limit", () => {
    const items = [makeItem({ id: "1", quantity: 1, stock: 3 })];
    const result = updateQuantity(items, "1", 10);
    expect(result[0].quantity).toBe(3);
  });
});

describe("calcTotal", () => {
  it("returns 0 for empty cart", () => {
    expect(calcTotal([])).toBe(0);
  });

  it("calculates total correctly", () => {
    const items = [
      makeItem({ id: "1", price: 100, quantity: 2 }),
      makeItem({ id: "2", price: 50, quantity: 3 }),
    ];
    expect(calcTotal(items)).toBe(350);
  });
});

describe("calcItemCount", () => {
  it("returns 0 for empty cart", () => {
    expect(calcItemCount([])).toBe(0);
  });

  it("sums all quantities", () => {
    const items = [
      makeItem({ id: "1", quantity: 3 }),
      makeItem({ id: "2", quantity: 2 }),
    ];
    expect(calcItemCount(items)).toBe(5);
  });
});
