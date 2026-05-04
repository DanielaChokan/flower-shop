export type Product = {
  id: string
  name: string
  price: number
  image: string
  rating: number
  categoryId?: string
  color?: string
  type?: string
  recipient?: string
  description?: string
}

export type Category = {
  id: string
  name: string
}

export type OrderItem = {
  productId: string
  quantity: number
  price: number
}

export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled"

export type Order = {
  id: string
  userId: string
  items: OrderItem[]
  totalPrice: number
  status: OrderStatus
  deliveryTime?: string
  deliveryAddress?: string
  createdAt: unknown
}

export type Review = {
  id: string
  userId: string
  text: string
  rating: number
  createdAt: unknown
}

export type CustomerType = "oneTimePurchase" | "giftOrder" | "regularCustomer";

export type AppUser = {
  uid: string
  firstName?: string
  lastName?: string
  displayName?: string
  email: string
  phone?: string
  role: "admin" | "user"
  createdAt: unknown
  photoURL?: string | null
  address?: string
  customerType?: CustomerType
}
