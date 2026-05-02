"use client";

import Image from "next/image";
import styles from "./Header.module.css";
import { useCart } from "@/modules/cart/CartContext";

export default function Header() {
  const { toggleCart, itemCount } = useCart();
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Image
          src="/icons/header-logo.png"
          alt="FloraSwift"
          width={44}
          height={44}
        />
        <span>FloraSwift</span>
      </div>
      <p className={styles.centerText}>Доставка свіжих квітів 24/7</p>
      <div className={styles.actions}>
        <button type="button" className={styles.action}>
          <Image src="/icons/header-search.png" alt="Пошук" width={22} height={22} />
          <span>Пошук</span>
        </button>
        <button type="button" className={styles.action}>
          <Image
            src="/icons/header-favourite.png"
            alt="Обране"
            width={22}
            height={22}
          />
          <span>Обране</span>
        </button>
        <button type="button" className={styles.action} onClick={toggleCart}>
          <div className={styles.cartIconWrap}>
            <Image src="/icons/header-cart.png" alt="Кошик" width={22} height={22} />
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount}</span>
            )}
          </div>
          <span>Кошик</span>
        </button>
                <button type="button" className={styles.action}>
          <Image
            src="/icons/header-profile.png"
            alt="Вхід"
            width={22}
            height={22}
          />
          <span>Вхід</span>
        </button>
      </div>
    </header>
  );
}
