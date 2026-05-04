"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import { useRouter } from "next/navigation";
import { useCart } from "@/modules/cart/CartContext";
import { useAuth } from "@/modules/auth/AuthContext";
import { useTheme } from "@/modules/theme/ThemeContext";

export default function Header() {
  const { toggleCart, itemCount } = useCart();
  const { user, isAdmin, openAuth, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleFavouritesClick = () => {
    if (!user) { openAuth(); return; }
    router.push("/favourites");
  };

  const handleCartClick = () => {
    if (!user) { openAuth(); return; }
    toggleCart();
  };

  if (isAdmin) {
    return (
      <header className={styles.header}>
        <Link href="/admin" className={styles.logo}>
          <Image
            src="/icons/header-logo.png"
            alt="FloraSwift"
            width={44}
            height={44}
          />
          <span>FloraSwift</span>
        </Link>
        <p className={styles.centerText}>Панель адміністратора</p>
        <div className={styles.actions}>
          <button type="button" className={styles.action} onClick={logout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Вихід</span>
          </button>
        </div>
      </header>
    );
  }

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
        <button
          type="button"
          className={styles.action}
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Світла тема" : "Темна тема"}
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
          <span>Тема</span>
        </button>
        <button type="button" className={styles.action} onClick={handleFavouritesClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>Обране</span>
        </button>
        <button type="button" className={styles.action} onClick={handleCartClick}>
          <div className={styles.cartIconWrap}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount}</span>
            )}
          </div>
          <span>Кошик</span>
        </button>
        {user ? (
          <button type="button" className={styles.action} onClick={logout}>
            {user.photoURL ? (
              <img
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
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Вхід</span>
          </button>
        )}
      </div>
    </header>
  );
}
