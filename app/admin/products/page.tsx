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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, Category } from "@/lib/api";
import styles from "../admin.module.css";

type ProductForm = {
  name: string;
  price: string;
  image: string;
  rating: string;
  stock: string;
  categoryId: string;
  color: string;
  description: string;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  price: "",
  image: "",
  rating: "0",
  stock: "",
  categoryId: "",
  color: "",
  description: "",
};

function formToProduct(f: ProductForm): Omit<Product, "id"> {
  const data: Omit<Product, "id"> = {
    name: f.name.trim(),
    price: parseFloat(f.price) || 0,
    image: f.image.trim(),
    stock: parseInt(f.stock),
    categoryId: f.categoryId,
    color: f.color.trim(),
  };
  if (f.rating !== "" && !isNaN(parseFloat(f.rating))) data.rating = parseFloat(f.rating);
  if (f.description.trim()) data.description = f.description.trim();
  return data;
}

function productToForm(p: Product): ProductForm {
  return {
    name: p.name,
    price: String(p.price),
    image: p.image,
    rating: String(p.rating),
    stock: p.stock !== undefined ? String(p.stock) : "",
    categoryId: p.categoryId ?? "",
    color: p.color ?? "",
    description: p.description ?? "",
  };
}

function validate(
  f: ProductForm,
  extra?: { newCategoryName?: string; newColorName?: string }
): Partial<Record<keyof ProductForm, string>> {
  const errors: Partial<Record<keyof ProductForm, string>> = {};
  if (!f.name.trim()) errors.name = "Назва обов'язкова";
  if (!f.price || isNaN(parseFloat(f.price)) || parseFloat(f.price) <= 0)
    errors.price = "Введіть коректну ціну";
  if (!f.image.trim()) errors.image = "URL зображення обов'язковий";
  if (f.stock === "" || isNaN(parseInt(f.stock))) errors.stock = "Залишок обов'язковий";
  if (f.categoryId === "__new__" || !f.categoryId) {
    if (!extra?.newCategoryName?.trim()) errors.categoryId = "Введіть назву нової категорії";
  }
  if (!f.color.trim() || f.color === "__new__") {
    if (!extra?.newColorName?.trim()) errors.color = "Колір обов'язковий";
  }
  return errors;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newColorInput, setNewColorInput] = useState("");
  const [showNewColorInput, setShowNewColorInput] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const [pSnap, cSnap] = await Promise.all([
      getDocs(query(collection(db, "products"), orderBy("name"))),
      getDocs(collection(db, "categories")),
    ]);
    setProducts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    setCategories(cSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const colorOptions = [...new Set(products.map((p) => p.color).filter(Boolean))].sort();

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setNewColorInput("");
    setShowNewColorInput(false);
    setNewCategoryInput("");
    setShowNewCategoryInput(false);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditTarget(p);
    setForm(productToForm(p));
    setErrors({});
    setNewColorInput("");
    setShowNewColorInput(false);
    setNewCategoryInput("");
    setShowNewCategoryInput(false);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const errs = validate(form, {
      newCategoryName: showNewCategoryInput ? newCategoryInput : undefined,
      newColorName: showNewColorInput ? newColorInput : undefined,
    });
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSaving(true);
    try {
      let resolvedCategoryId = form.categoryId;
      if (showNewCategoryInput && newCategoryInput.trim()) {
        const existing = categories.find(
          (c) => c.name.toLowerCase() === newCategoryInput.trim().toLowerCase()
        );
        if (existing) {
          resolvedCategoryId = existing.id;
        } else {
          const newCatRef = await addDoc(collection(db, "categories"), { name: newCategoryInput.trim() });
          resolvedCategoryId = newCatRef.id;
        }
      }
      const data = formToProduct({ ...form, categoryId: resolvedCategoryId });
      if (editTarget) {
        await updateDoc(doc(db, "products", editTarget.id), data as Record<string, unknown>);
        showToast("Товар оновлено");
      } else {
        await addDoc(collection(db, "products"), data);
        showToast("Товар створено");
      }
      setModalOpen(false);
      await load();
    } catch {
      showToast("Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast("Товар видалено");
    } catch {
      showToast("Помилка видалення");
    } finally {
      setConfirmDelete(null);
    }
  };

  const outOfStockCount = products.filter((p) => (p.stock ?? 0) === 0).length;

  const filtered = products.filter((p) => {
    if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterOutOfStock && (p.stock ?? 0) !== 0) return false;
    return true;
  });

  const getCategoryName = (id?: string) =>
    id ? (categories.find((c) => c.id === id)?.name ?? id) : "—";

  const set = (key: keyof ProductForm, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  if (loading) return <div className={styles.emptyState}>Завантаження товарів...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Товари</h1>
        <button className={styles.btnPrimary} onClick={openCreate}>Додати товар</button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Пошук за назвою..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          className={`${styles.filterBtn} ${filterOutOfStock ? styles.filterBtnActive : ""}`}
          onClick={() => setFilterOutOfStock((v) => !v)}
        >
          Немає в наявності{outOfStockCount > 0 && <span className={styles.filterBtnBadge}>{outOfStockCount}</span>}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>Товари не знайдено</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Фото</th>
                <th>Назва</th>
                <th>Ціна</th>
                <th>Категорія</th>
                <th>Залишок</th>
                <th>Рейтинг</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <img
                      src={p.image}
                      alt={p.name}
                      width={44}
                      height={44}
                      style={{ objectFit: "cover", borderRadius: 8, display: "block" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td style={{ fontWeight: 600, color: "var(--primary, #6C1A35)" }}>{p.price} грн</td>
                  <td style={{ color: "var(--muted, #7A6B6F)", fontSize: 13 }}>{getCategoryName(p.categoryId)}</td>
                  <td style={{ fontSize: 13 }}>
                    {(p.stock ?? 0) === 0
                      ? <span className={styles.badgeOutOfStock}>Немає</span>
                      : p.stock}
                  </td>
                  <td style={{ fontSize: 13 }}>{p.rating !== undefined ? `${"★".repeat(Math.round(p.rating))} ${p.rating}` : "—"}</td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.iconBtn} title="Редагувати" onClick={() => openEdit(p)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Видалити" onClick={() => setConfirmDelete(p.id)}>
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
            <h3>{editTarget ? "Редагувати товар" : "Новий товар"}</h3>

            <div className={styles.formGroup}>
              <label>Назва *</label>
              <input className={styles.formInput} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Назва товару" />
              {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Ціна (грн) *</label>
                <input className={styles.formInput} type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0" />
                {errors.price && <span className={styles.fieldError}>{errors.price}</span>}
              </div>
              <div className={styles.formGroup}>
                <label>Залишок *</label>
                <input className={styles.formInput} type="number" min="0" value={form.stock} onChange={(e) => set("stock", e.target.value)} placeholder="0" />
                {errors.stock && <span className={styles.fieldError}>{errors.stock}</span>}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>URL зображення *</label>
              <input className={styles.formInput} value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." />
              {errors.image && <span className={styles.fieldError}>{errors.image}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Категорія *</label>
              <select
                className={styles.formSelect}
                value={showNewCategoryInput ? "__new__" : form.categoryId}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setShowNewCategoryInput(true);
                    set("categoryId", "");
                  } else {
                    setShowNewCategoryInput(false);
                    set("categoryId", e.target.value);
                  }
                }}
              >
                <option value="">— оберіть категорію —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="__new__">+ Додати нову категорію</option>
              </select>
              {showNewCategoryInput && (
                <input
                  className={styles.formInput}
                  style={{ marginTop: 6 }}
                  placeholder="Назва категорії"
                  value={newCategoryInput}
                  onChange={(e) => {
                    setNewCategoryInput(e.target.value);
                    set("categoryId", "__new__");
                  }}
                  autoFocus
                />
              )}
              {errors.categoryId && <span className={styles.fieldError}>{errors.categoryId}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Колір *</label>
              <select
                className={styles.formSelect}
                value={showNewColorInput ? "__new__" : form.color}
                onChange={(e) => {
                  if (e.target.value === "__new__") {
                    setShowNewColorInput(true);
                    set("color", "");
                  } else {
                    setShowNewColorInput(false);
                    set("color", e.target.value);
                  }
                }}
              >
                <option value="">— оберіть колір —</option>
                {colorOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__new__">+ Додати новий колір</option>
              </select>
              {showNewColorInput && (
                <input
                  className={styles.formInput}
                  style={{ marginTop: 6 }}
                  placeholder="Назва кольору"
                  value={newColorInput}
                  onChange={(e) => {
                    setNewColorInput(e.target.value);
                    set("color", e.target.value);
                  }}
                  autoFocus
                />
              )}
              {errors.color && <span className={styles.fieldError}>{errors.color}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Рейтинг (0–5)</label>
              <input className={styles.formInput} type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => set("rating", e.target.value)} />
            </div>

            <div className={styles.formGroup}>
              <label>Опис</label>
              <textarea className={styles.formTextarea} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Короткий опис товару..." />
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

      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Видалити товар?</h3>
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
