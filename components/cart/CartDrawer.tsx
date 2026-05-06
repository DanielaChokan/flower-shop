"use client";

import { useState } from "react";
import { useCart } from "@/modules/cart/CartContext";
import ProductCard from "@/components/product/ProductCard";
import CheckoutModal from "./CheckoutModal";
import styles from "./CartDrawer.module.css";

export default function CartDrawer() {
  const { isOpen, closeCart, items, updateQuantity, total } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={closeCart} />
      <aside className={styles.drawer}>
        <div className={styles.header}>
          <h2>Ваш Кошик</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeCart}
            aria-label="Закрити кошик"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🛒</span>
              <span>Кошик порожній</span>
            </div>
          ) : (
            items.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                price={item.price}
                image={item.image}
                rating={item.rating}
                inCart
                quantity={item.quantity}
                onQuantityChange={(qty: number) => updateQuantity(item.id, qty)}
                isCustom={item.isCustom}
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className={styles.footer}>
            <div className={styles.totalRow}>
              <span>До сплати:</span>
              <span className={styles.totalAmount}>{total} грн.</span>
            </div>
            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={() => setCheckoutOpen(true)}
            >
              Перейти до оформлення замовлення
            </button>
            <button
              type="button"
              className={styles.continueBtn}
              onClick={closeCart}
            >
              Продовжити покупки
            </button>
          </div>
        )}
      </aside>
      {checkoutOpen && <CheckoutModal onClose={() => setCheckoutOpen(false)} />}
    </>
  );
}
