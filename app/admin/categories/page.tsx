"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Category } from "@/lib/api";
import styles from "../admin.module.css";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [blockDelete, setBlockDelete] = useState<{ categoryName: string; count: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const snap = await getDocs(query(collection(db, "categories"), orderBy("name")));
    setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditTarget(null);
    setFormName("");
    setNameError("");
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditTarget(c);
    setFormName(c.name);
    setNameError("");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) { setNameError("Назва обов'язкова"); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await updateDoc(doc(db, "categories", editTarget.id), { name: formName.trim() });
        showToast("Категорію оновлено");
      } else {
        await addDoc(collection(db, "categories"), { name: formName.trim() });
        showToast("Категорію створено");
      }
      setModalOpen(false);
      await load();
    } catch {
      showToast("Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = async (id: string) => {
    const productsSnap = await getDocs(query(collection(db, "products"), where("categoryId", "==", id)));
    if (!productsSnap.empty) {
      const cat = categories.find((c) => c.id === id);
      setBlockDelete({ categoryName: cat?.name ?? id, count: productsSnap.size });
      return;
    }
    setConfirmDelete(id);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast("Категорію видалено");
    } catch {
      showToast("Помилка видалення");
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = categories.filter((c) =>
    !search.trim() || c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className={styles.emptyState}>Завантаження категорій...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Категорії</h1>
        <button className={styles.btnPrimary} onClick={openCreate}>Додати категорію</button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Пошук категорії..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>Категорії не знайдено</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Назва категорії</th>
                <th>ID</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr key={c.id}>
                  <td style={{ color: "var(--muted)", fontSize: 13 }}>{idx + 1}</td>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>{c.id}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} title="Редагувати" onClick={() => openEdit(c)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Видалити" onClick={() => requestDelete(c.id)}>
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

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{editTarget ? "Редагувати категорію" : "Нова категорія"}</h3>
            <div className={styles.formGroup}>
              <label>Назва *</label>
              <input
                className={styles.formInput}
                value={formName}
                onChange={(e) => { setFormName(e.target.value); setNameError(""); }}
                placeholder="Наприклад: Троянди"
                autoFocus
              />
              {nameError && <span className={styles.fieldError}>{nameError}</span>}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setModalOpen(false)}>Скасувати</button>
              <button className={styles.btnPrimary} onClick={handleSave} disabled={saving}>
                {saving ? "Збереження..." : "Зберегти"}
              </button>
            </div>
          </div>
        </div>
      )}

      {blockDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Неможливо видалити категорію</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px" }}>
              Категорія <strong>«{blockDelete.categoryName}»</strong> містить {blockDelete.count} {blockDelete.count === 1 ? "товар" : blockDelete.count < 5 ? "товари" : "товарів"}. Спочатку перепризначте або видаліть ці товари.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={() => setBlockDelete(null)}>Зрозуміло</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Видалити категорію?</h3>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 20px" }}>Цю дію не можна відмінити.</p>
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
