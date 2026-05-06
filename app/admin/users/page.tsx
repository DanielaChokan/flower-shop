"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser } from "@/lib/api";
import { CUSTOMER_TYPE_LABELS } from "@/lib/naiveBayes";
import styles from "../admin.module.css";

function formatDate(ts: unknown): string {
  if (!ts) return "—";
  try {
    const d = (ts as { toDate: () => Date }).toDate?.() ?? new Date(ts as string);
    return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
    setUsers(snap.docs.map((d) => ({ ...d.data() } as AppUser)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRole = async (user: AppUser) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    setUpdatingRole(user.uid);
    try {
      await updateDoc(doc(db, "users", user.uid), { role: newRole });
      setUsers((prev) => prev.map((u) => u.uid === user.uid ? { ...u, role: newRole } : u));
      showToast(`Роль змінено на "${newRole}"`);
    } catch {
      showToast("Помилка зміни ролі");
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleDelete = async (uid: string) => {
    try {
      await deleteDoc(doc(db, "users", uid));
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
      showToast("Користувача видалено");
    } catch {
      showToast("Помилка видалення");
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = users
    .filter((u) => roleFilter === "all" || u.role === roleFilter)
    .filter((u) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (u.email ?? "").toLowerCase().includes(q) ||
        (u.displayName ?? "").toLowerCase().includes(q) ||
        (u.firstName ?? "").toLowerCase().includes(q) ||
        (u.lastName ?? "").toLowerCase().includes(q)
      );
    });

  if (loading) return <div className={styles.emptyState}>Завантаження користувачів...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Користувачі</h1>
        <span style={{ fontSize: 14, color: "var(--muted)" }}>Всього: {users.length}</span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Пошук за ім'ям або email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          style={{ padding: "9px 14px", border: "1.5px solid #e8e0e4", borderRadius: 10, fontSize: 14, background: "#fff", outline: "none", cursor: "pointer", minWidth: 150 }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as "all" | "admin" | "user")}
        >
          <option value="all">Всі ролі</option>
          <option value="admin">Адміни</option>
          <option value="user">Користувачі</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>Користувачів не знайдено</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Користувач</th>
                <th>Email</th>
                <th>Телефон</th>
                <th>Роль</th>
                <th>Тип клієнта</th>
                <th>Зареєстрований</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.uid}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" width={32} height={32} style={{ borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: "var(--neutral-light, #F9EAF0)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "var(--primary, #6C1A35)",
                          flexShrink: 0,
                        }}>
                          {(u.displayName ?? u.email ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>
                          {u.displayName ?? (`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—")}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                          {u.uid.slice(0, 12)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td style={{ fontSize: 13, color: "var(--muted)" }}>{u.phone ?? "—"}</td>
                  <td>
                    <span className={`${styles.badge} ${u.role === "admin" ? styles.badgeAdmin : styles.badgeUser}`}>
                      {u.role === "admin" ? "Адмін" : "Користувач"}
                    </span>
                  </td>
                  <td>
                    {u.customerType ? (
                      <span className={`${styles.badge} ${
                        u.customerType === "regularCustomer" ? styles.badgeConfirmed
                        : u.customerType === "giftOrder" ? styles.badgePending
                        : styles.badgeCancelled
                      }`}>
                        {CUSTOMER_TYPE_LABELS[u.customerType]}
                      </span>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: 13, color: "var(--muted-warm)" }}>{formatDate(u.createdAt)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.iconBtn}
                        title={u.role === "admin" ? "Зняти права адміна" : "Призначити адміном"}
                        onClick={() => toggleRole(u)}
                        disabled={updatingRole === u.uid}
                      >
                        {u.role === "admin" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <line x1="23" y1="11" x2="17" y2="11"/>
                          </svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <line x1="20" y1="8" x2="20" y2="14"/>
                            <line x1="23" y1="11" x2="17" y2="11"/>
                          </svg>
                        )}
                      </button>
                      <button
                        className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                        title="Видалити користувача"
                        onClick={() => setConfirmDelete(u.uid)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Видалити користувача?</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px" }}>
              Буде видалено лише запис у Firestore. Акаунт у Firebase Auth залишиться.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setConfirmDelete(null)}>Скасувати</button>
              <button className={styles.btnDanger} onClick={() => handleDelete(confirmDelete)}>Видалити</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
