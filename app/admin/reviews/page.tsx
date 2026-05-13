"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Review } from "@/lib/api";
import styles from "../admin.module.css";

type ReviewRow = Review & {
  userName: string;
  productName: string;
};

const getStars = (rating: number) =>
  "★".repeat(Math.round(rating)).padEnd(5, "☆");

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const raw = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }));

    const enriched = await Promise.all(
      raw.map(async (r) => {
        let userName = "Клієнт";
        let productName = "—";
        try {
          const userSnap = await getDoc(doc(db, "users", r.userId));
          if (userSnap.exists()) {
            const u = userSnap.data() as { displayName?: string };
            userName = u.displayName ?? userName;
          }
        } catch {}
        try {
          const productSnap = await getDoc(doc(db, "products", r.productId));
          if (productSnap.exists()) {
            const p = productSnap.data() as { name?: string };
            productName = p.name ?? productName;
          }
        } catch {}
        return { ...r, userName, productName };
      })
    );

    setReviews(enriched);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleDelete = async () => {
    if (!confirmId) return;
    setDeleting(true);
    try {
      const review = reviews.find((r) => r.id === confirmId);
      await deleteDoc(doc(db, "reviews", confirmId));

      if (review) {
        const remaining = reviews.filter(
          (r) => r.id !== confirmId && r.productId === review.productId
        );
        if (remaining.length > 0) {
          const avg =
            remaining.reduce((sum, r) => sum + r.rating, 0) / remaining.length;
          await updateDoc(doc(db, "products", review.productId), {
            rating: Math.round(avg * 10) / 10,
          });
        } else {
          await updateDoc(doc(db, "products", review.productId), { rating: 0 });
        }
      }

      setReviews((prev) => prev.filter((r) => r.id !== confirmId));
      showToast("Відгук видалено");
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  };

  const filtered = reviews.filter(
    (r) =>
      r.userName.toLowerCase().includes(search.toLowerCase()) ||
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.text.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (ts: unknown): string => {
    if (!ts) return "—";
    try {
      const d = (ts as { toDate: () => Date }).toDate();
      return d.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Відгуки</h1>
        <span className={styles.reviewsCount}>
          {reviews.length} відгуків
        </span>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg
            className={styles.searchIcon}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Пошук за автором, товаром або текстом..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className={styles.emptyState}>Завантаження...</p>
      ) : filtered.length === 0 ? (
        <p className={styles.emptyState}>Відгуків не знайдено</p>
      ) : (
        <div className={styles.reviewsList}>
          {filtered.map((r) => (
            <div className={styles.reviewCard} key={r.id}>
              <div className={styles.reviewHeader}>
                <div>
                  <div className={styles.reviewAuthor}>{r.userName}</div>
                  <div className={styles.reviewProduct}>{r.productName}</div>
                </div>
                <div className={styles.reviewRating}>
                  <span className={styles.reviewStars}>{getStars(r.rating)}</span>
                  <span className={styles.reviewScore}>{r.rating.toFixed(1)}</span>
                </div>
              </div>

              <p className={styles.reviewText}>{r.text}</p>

              <div className={styles.reviewFooter}>
                <span className={styles.reviewDate}>{formatDate(r.createdAt)}</span>
                <div className={styles.actions}>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    title="Видалити відгук"
                    onClick={() => setConfirmId(r.id)}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmId && (
        <div className={styles.modalOverlay} onClick={() => setConfirmId(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Видалити відгук?</h3>
            <p className={styles.modalNote}>
              Відгук буде видалено безповоротно. Рейтинг товару перерахується автоматично.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.btnSecondary}
                onClick={() => setConfirmId(null)}
                disabled={deleting}
              >
                Скасувати
              </button>
              <button
                className={styles.btnDanger}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Видалення..." : "Видалити"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
