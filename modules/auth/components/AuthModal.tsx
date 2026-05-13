"use client";

import { useState } from "react";
import { useAuth } from "@/modules/auth/AuthContext";
import { loginSchema, registerSchema } from "@/schemas/auth.schema";
import styles from "./AuthModal.module.css";

type Mode = "login" | "register";

export default function AuthModal() {
  const { isAuthOpen, closeAuth, login, register, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentError, setConsentError] = useState(false);

  if (!isAuthOpen) return null;

  const clearForm = () => {
    setEmail(""); setPassword(""); setFirstName(""); setLastName("");
    setError(""); setFieldErrors({}); setResetSent(false);
    setConsentChecked(false); setConsentError(false);
  };

  const switchMode = (m: Mode) => { setMode(m); clearForm(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (mode === "login") {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const flat = result.error.flatten().fieldErrors;
        const errs: Record<string, string> = {};
        Object.entries(flat).forEach(([k, v]) => { if (v?.[0]) errs[k] = v[0]; });
        setFieldErrors(errs);
        return;
      }
    } else {
      const result = registerSchema.safeParse({ lastName, firstName, email, password });
      if (!result.success) {
        const flat = result.error.flatten().fieldErrors;
        const errs: Record<string, string> = {};
        Object.entries(flat).forEach(([k, v]) => { if (v?.[0]) errs[k] = v[0]; });
        setFieldErrors(errs);
        return;
      }
      if (!consentChecked) {
        setConsentError(true);
        return;
      }
      setConsentError(false);
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, firstName, lastName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        setError("Невірний e-mail або пароль");
      } else if (msg.includes("email-already-in-use")) {
        setError("Цей e-mail вже використовується");
      } else if (msg.includes("weak-password")) {
        setError("Пароль має містити щонайменше 6 символів");
      } else {
        setError("Сталася помилка. Спробуйте ще раз.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      setError("Не вдалося увійти через Google");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) { setError("Введіть e-mail для скидання пароля"); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      setError("");
    } catch {
      setError("Не вдалося надіслати лист. Перевірте e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeAuth(); }}>
      <div className={styles.modal}>
        <button type="button" className={styles.close} onClick={closeAuth} aria-label="Закрити">×</button>

        {mode === "login" ? (
          <>
            <h2 className={styles.title}>Увійдіть до свого облікового запису</h2>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.field}>
                <label className={styles.label}>E-mail</label>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                {fieldErrors.email && <p className={styles.fieldError}>{fieldErrors.email}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Пароль</label>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                {fieldErrors.password && <p className={styles.fieldError}>{fieldErrors.password}</p>}
              </div>

              <button type="button" className={styles.forgotLink} onClick={handleReset}>
                Забули пароль?
              </button>
              {resetSent && <p className={styles.successMsg}>Лист надіслано на {email}</p>}

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Завантаження..." : "Увійти"}
              </button>
            </form>

            <div className={styles.divider}><span>Або</span></div>

            <button type="button" className={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              Продовжити з Google
            </button>

            <p className={styles.switchText}>
              Новий користувач?{" "}
              <button type="button" className={styles.switchLink} onClick={() => switchMode("register")}>
                ЗАРЕЄСТРУЙТЕСЬ ТУТ
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 className={styles.title}>Створіть свій обліковий запис</h2>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.field}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Прізвище"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                />
                {fieldErrors.lastName && <p className={styles.fieldError}>{fieldErrors.lastName}</p>}
              </div>
              <div className={styles.field}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Ім'я"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                />
                {fieldErrors.firstName && <p className={styles.fieldError}>{fieldErrors.firstName}</p>}
              </div>
              <div className={styles.field}>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                {fieldErrors.email && <p className={styles.fieldError}>{fieldErrors.email}</p>}
              </div>
              <div className={styles.field}>
                <input
                  type="password"
                  className={styles.input}
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                {fieldErrors.password && <p className={styles.fieldError}>{fieldErrors.password}</p>}
              </div>

              <div className={styles.consentRow}>
                <label className={consentError ? styles.consentLabelError : styles.consentLabel}>
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => { setConsentChecked(e.target.checked); if (e.target.checked) setConsentError(false); }}
                  />
                  Я погоджуюся на обробку моїх персональних даних
                </label>
                {consentError && <p className={styles.fieldError}>Необхідно надати згоду на обробку персональних даних</p>}
              </div>

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? "Завантаження..." : "Створити"}
              </button>
            </form>

            <div className={styles.divider}><span>Або</span></div>

            <button type="button" className={styles.googleBtn} onClick={handleGoogle} disabled={loading}>
              <GoogleIcon />
              Продовжити з Google
            </button>

            <p className={styles.switchText}>
              Вже є акаунт?{" "}
              <button type="button" className={styles.switchLink} onClick={() => switchMode("login")}>
                УВІЙДІТЬ ТУТ
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
