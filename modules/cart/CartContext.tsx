"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/modules/auth/AuthContext";

export type CartFlower = { id: string; name: string; quantity: number; price: number };

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  quantity: number;
  stock?: number;
  isCustom?: boolean;
  flowers?: CartFlower[];
};

type StoredCartItem =
  | { id: string; quantity: number; isCustom?: false }
  | { id: string; quantity: number; isCustom: true; name: string; price: number; image: string; rating: number; flowers?: CartFlower[] };

type CartContextType = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (product: Omit<CartItem, "quantity">) => void;
  addBouquet: (bouquet: Omit<CartItem, "quantity" | "isCustom">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    isSyncing.current = true;
    getDoc(doc(db, "users", user.uid)).then(async (snap) => {
      const stored: StoredCartItem[] = Array.isArray(snap.data()?.cart) ? snap.data()!.cart : [];
      if (stored.length === 0) {
        setItems([]);
        isSyncing.current = false;
        return;
      }
      const enriched = await Promise.all(
        stored.map(async (s) => {
          if (s.isCustom) {
            return { id: s.id, name: s.name, price: s.price, image: s.image, rating: s.rating, quantity: s.quantity, isCustom: true, flowers: s.flowers };
          }
          const productSnap = await getDoc(doc(db, "products", s.id));
          if (!productSnap.exists()) return null;
          const p = productSnap.data() as { name: string; price: number; image: string; rating: number; stock?: number };
          return { id: s.id, name: p.name, price: p.price, image: p.image, rating: p.rating, stock: p.stock, quantity: s.quantity };
        })
      );
      setItems(enriched.filter(Boolean) as CartItem[]);
      isSyncing.current = false;
    });
  }, [user]);

  const saveToFirestore = useCallback((nextItems: CartItem[], uid: string) => {
    const stored: StoredCartItem[] = nextItems.map((item) => {
      if (item.isCustom) {
        return { id: item.id, quantity: item.quantity, isCustom: true as const, name: item.name, price: item.price, image: item.image, rating: item.rating, flowers: item.flowers };
      }
      return { id: item.id, quantity: item.quantity };
    });
    updateDoc(doc(db, "users", uid), { cart: stored }).catch(() => {});
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const addBouquet = useCallback((bouquet: Omit<CartItem, "quantity" | "isCustom">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === bouquet.id);
      let next: CartItem[];
      if (existing) {
        next = prev.map((i) =>
          i.id === bouquet.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        next = [...prev, { ...bouquet, quantity: 1, isCustom: true as const }];
      }
      if (user) saveToFirestore(next, user.uid);
      return next;
    });
    setIsOpen(true);
  }, [user, saveToFirestore]);

  const addItem = useCallback((product: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      let next: CartItem[];
      if (existing) {
        const newQty = existing.quantity + 1;
        const clamped = existing.stock !== undefined ? Math.min(newQty, existing.stock) : newQty;
        next = prev.map((i) =>
          i.id === product.id ? { ...i, quantity: clamped } : i
        );
      } else {
        next = [...prev, { ...product, quantity: 1 }];
      }
      if (user) saveToFirestore(next, user.uid);
      return next;
    });
    setIsOpen(true);
  }, [user, saveToFirestore]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      if (user) saveToFirestore(next, user.uid);
      return next;
    });
  }, [user, saveToFirestore]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    setItems((prev) => {
      let next: CartItem[];
      if (quantity <= 0) {
        next = prev.filter((i) => i.id !== id);
      } else {
        const item = prev.find((i) => i.id === id);
        const clamped = item?.stock !== undefined ? Math.min(quantity, item.stock) : quantity;
        next = prev.map((i) => (i.id === id ? { ...i, quantity: clamped } : i));
      }
      if (user) saveToFirestore(next, user.uid);
      return next;
    });
  }, [user, saveToFirestore]);

  const clearCart = useCallback(() => {
    setItems([]);
    if (user) saveToFirestore([], user.uid);
  }, [user, saveToFirestore]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        addItem,
        addBouquet,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
