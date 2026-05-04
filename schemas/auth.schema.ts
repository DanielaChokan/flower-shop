import { z } from "zod"

export const loginSchema = z.object({
  email: z.string()
    .min(1, "E-mail є обов'язковим")
    .email("Введіть коректний e-mail"),
  password: z.string()
    .min(1, "Пароль є обов'язковим")
    .min(6, "Пароль має містити щонайменше 6 символів"),
})

export const registerSchema = z.object({
  lastName: z.string()
    .min(1, "Прізвище є обов'язковим")
    .regex(/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ'\- ]+$/, "Прізвище містить недопустимі символи"),
  firstName: z.string()
    .min(1, "Ім'я є обов'язковим")
    .regex(/^[a-zA-Zа-яА-ЯіІїЇєЄґҐ'\- ]+$/, "Ім'я містить недопустимі символи"),
  email: z.string()
    .min(1, "E-mail є обов'язковим")
    .email("Введіть коректний e-mail"),
  password: z.string()
    .min(1, "Пароль є обов'язковим")
    .min(6, "Пароль має містити щонайменше 6 символів"),
})

export const userProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  photoURL: z.string().url().nullable().optional(),
  customerType: z.string().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type RegisterFormData = z.infer<typeof registerSchema>
export type UserProfileFormData = z.infer<typeof userProfileSchema>
