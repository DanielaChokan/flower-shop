import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  image: z.string().url(),
  rating: z.number().min(0).max(5),
  stock: z.number().int().min(0).optional(),
  categoryId: z.string().optional(),
  color: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
})

export type ProductFormData = z.infer<typeof productSchema>
