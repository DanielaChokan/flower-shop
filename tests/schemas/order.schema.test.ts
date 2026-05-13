import { describe, it, expect } from "vitest";
import { orderSchema, orderStatusSchema, checkoutFormSchema } from "@/schemas/order.schema";

describe("orderStatusSchema", () => {
  it("accepts valid statuses", () => {
    for (const s of ["pending", "confirmed", "delivered", "cancelled"]) {
      expect(orderStatusSchema.safeParse(s).success).toBe(true);
    }
  });

  it("rejects unknown status", () => {
    expect(orderStatusSchema.safeParse("shipped").success).toBe(false);
  });
});

describe("orderSchema", () => {
  const valid = {
    userId: "user-1",
    items: [{ productId: "prod-1", quantity: 2, price: 150 }],
    totalPrice: 300,
    status: "pending",
  };

  it("passes with valid data", () => {
    expect(orderSchema.safeParse(valid).success).toBe(true);
  });

  it("fails with empty items array", () => {
    expect(orderSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
  });

  it("fails with zero totalPrice", () => {
    expect(orderSchema.safeParse({ ...valid, totalPrice: 0 }).success).toBe(false);
  });

  it("fails with negative item quantity", () => {
    const result = orderSchema.safeParse({
      ...valid,
      items: [{ productId: "prod-1", quantity: -1, price: 100 }],
    });
    expect(result.success).toBe(false);
  });

  it("passes with optional delivery fields", () => {
    const result = orderSchema.safeParse({
      ...valid,
      deliveryAddress: "вул. Хрещатик, 1",
      comment: "Подзвоніть перед доставкою",
    });
    expect(result.success).toBe(true);
  });
});

describe("checkoutFormSchema", () => {
  const valid = {
    recipient: "Іван Коваль",
    phone: "+380991234567",
    address: "вул. Хрещатик, 1, Київ",
    deliveryDate: "2025-01-01",
    deliveryTime: "10:00",
  };

  it("passes with valid data", () => {
    expect(checkoutFormSchema.safeParse(valid).success).toBe(true);
  });

  it("fails when recipient is too short", () => {
    expect(checkoutFormSchema.safeParse({ ...valid, recipient: "І" }).success).toBe(false);
  });

  it("fails with invalid phone format", () => {
    expect(checkoutFormSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });

  it("fails when address is too short", () => {
    expect(checkoutFormSchema.safeParse({ ...valid, address: "abc" }).success).toBe(false);
  });

  it("fails when deliveryDate is empty", () => {
    expect(checkoutFormSchema.safeParse({ ...valid, deliveryDate: "" }).success).toBe(false);
  });

  it("accepts optional comment", () => {
    const result = checkoutFormSchema.safeParse({ ...valid, comment: "Залиште біля дверей" });
    expect(result.success).toBe(true);
  });
});
