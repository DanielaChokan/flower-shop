"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./Header.module.css";
import { useRouter } from "next/navigation";
import { useCart } from "@/modules/cart/CartContext";
import { useAuth } from "@/modules/auth/AuthContext";
import { useTheme } from "@/modules/theme/ThemeContext";
import { useAiChat } from "@/modules/ai/AiChatContext";
import { useState, useEffect, useRef } from "react";

export default function Header() {
  const { toggleCart, itemCount } = useCart();
  const { user, isAdmin, openAuth, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { openChat } = useAiChat();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleProfileClick = () => {
    if (!user) { openAuth(); return; }
    router.push("/profile");
  };

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
        <button type="button" className={styles.adminLogoutMobile} onClick={logout}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>Вихід</span>
        </button>
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

      {/* Desktop actions */}
      <div className={styles.actions}>
        <button type="button" className={styles.action} onClick={openChat}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/>
            <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
          </svg>
          <span>AI Букет</span>
        </button>
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
          <button type="button" className={styles.action} onClick={handleProfileClick}>
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName ?? "Профіль"} width={32} height={32} className={styles.avatar} />
            ) : (
              <div className={styles.avatarFallback}>
                {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <span className={styles.userName}>{user.displayName?.split(" ")[0] ?? "Профіль"}</span>
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

      {/* Mobile hamburger */}
      <div ref={menuRef}>
        <button
          type="button"
          className={styles.menuToggle}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Меню"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </>
            )}
          </svg>
        </button>
        {menuOpen && (
          <div className={styles.dropdown}>
            <button type="button" className={styles.dropdownItem} onClick={() => { openChat(); setMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/>
                <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/>
                <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>
              </svg>
              AI Букет
            </button>
            <button type="button" className={styles.dropdownItem} onClick={() => { toggleTheme(); setMenuOpen(false); }}>
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
              {theme === "dark" ? "Світла тема" : "Темна тема"}
            </button>
            <div className={styles.dropdownDivider} />
            <button type="button" className={styles.dropdownItem} onClick={() => { handleFavouritesClick(); setMenuOpen(false); }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Обране
            </button>
            <button type="button" className={styles.dropdownItem} onClick={() => { handleCartClick(); setMenuOpen(false); }}>
              <div className={styles.cartIconWrap} style={{ position: "relative" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                {itemCount > 0 && <span className={styles.cartBadge}>{itemCount}</span>}
              </div>
              Кошик{itemCount > 0 ? ` (${itemCount})` : ""}
            </button>
            <div className={styles.dropdownDivider} />
            {user ? (
              <>
                <button type="button" className={styles.dropdownItem} onClick={() => { handleProfileClick(); setMenuOpen(false); }}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" width={20} height={20} className={styles.avatar} />
                  ) : (
                    <div className={styles.avatarFallback} style={{ width: 20, height: 20, fontSize: 11 }}>
                      {(user.displayName ?? user.email ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  {user.displayName?.split(" ")[0] ?? "Профіль"}
                </button>
              </>
            ) : (
              <button type="button" className={styles.dropdownItem} onClick={() => { openAuth(); setMenuOpen(false); }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Вхід
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
