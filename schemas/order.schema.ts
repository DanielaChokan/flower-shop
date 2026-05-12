import { z } from "zod"

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
})

export const orderStatusSchema = z.enum(["pending", "confirmed", "delivered", "cancelled"])

export const orderSchema = z.object({
  userId: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  totalPrice: z.number().positive(),
  status: orderStatusSchema,
  deliveryAddress: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryTime: z.string().optional(),
  recipient: z.string().optional(),
  phone: z.string().optional(),
  comment: z.string().optional(),
})

export const checkoutFormSchema = z.object({
  recipient: z.string().min(2, "Введіть ім'я та прізвище (мін. 2 символи)"),
  phone: z
    .string()
    .min(1, "Введіть номер телефону")
    .regex(/^\+?3?8?(0\d{9})$/, "Невірний формат номера (наприклад: +380XXXXXXXXX)"),
  address: z.string().min(5, "Введіть повну адресу доставки (мін. 5 символів)"),
  deliveryDate: z.string().min(1, "Оберіть дату доставки"),
  deliveryTime: z.string().min(1, "Оберіть час доставки"),
  comment: z.string().optional(),
})

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>
export type OrderFormData = z.infer<typeof orderSchema>
