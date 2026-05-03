"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import { useCart } from "@/modules/cart/CartContext";
import { useAuth } from "@/modules/auth/AuthContext";

export default function Header() {
  const { toggleCart, itemCount } = useCart();
  const { user, openAuth, logout } = useAuth();

  const handleCartClick = () => {
    if (!user) { openAuth(); return; }
    toggleCart();
  };

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <Image
          src="/icons/header-logo.png"
          alt="FloraSwift"
          width={44}
          height={44}
        />
        <span>FloraSwift</span>
      </Link>
      <p className={styles.centerText}>Доставка свіжих квітів 24/7</p>
      <div className={styles.actions}>
        <button type="button" className={styles.action}>
          <Image
            src="/icons/header-favourite.png"
            alt="Обране"
            width={22}
            height={22}
          />
          <span>Обране</span>
        </button>
        <button type="button" className={styles.action} onClick={handleCartClick}>
          <div className={styles.cartIconWrap}>
            <Image src="/icons/header-cart.png" alt="Кошик" width={22} height={22} />
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount}</span>
            )}
          </div>
          <span>Кошик</span>
        </button>
        {user ? (
          <button type="button" className={styles.action} onClick={logout}>
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={user.displayName ?? "Профіль"}
                width={32}
                height={32}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarFallback}>
                {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <span className={styles.userName}>
              {user.displayName?.split(" ")[0] ?? "Профіль"}
            </span>
          </button>
        ) : (
          <button type="button" className={styles.action} onClick={openAuth}>
            <Image
              src="/icons/header-profile.png"
              alt="Вхід"
              width={22}
              height={22}
            />
            <span>Вхід</span>
          </button>
        )}
      </div>
    </header>
  );
}
