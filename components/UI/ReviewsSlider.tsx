"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { collection, getDocs, orderBy, query, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import styles from "./ReviewsSlider.module.css";

interface Review {
  id: string;
  userId: string;
  userName: string;
  text: string;
  rating: number;
  avatar: string | null;
}

export default function ReviewsSlider() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(10));
    getDocs(q).then(async (snapshot) => {
      const raw = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as { userId: string; text: string; rating: number }),
      }));

      const enriched = await Promise.all(
        raw.map(async (r) => {
          let userName = "Клієнт";
          let avatar: string | null = null;
          try {
            const userSnap = await getDoc(doc(db, "users", r.userId));
            if (userSnap.exists()) {
              const u = userSnap.data() as { displayName?: string; photoURL?: string | null };
              userName = u.displayName ?? userName;
              avatar = u.photoURL ?? null;
            }
          } catch {
          }
          return { ...r, userName, avatar };
        })
      );

      setReviews(enriched);
    });
  }, []);

  const updateControls = () => {
    const track = trackRef.current;
    if (!track) return;
    setCanPrev(track.scrollLeft > 0);
    setCanNext(track.scrollLeft < track.scrollWidth - track.clientWidth - 1);
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    updateControls();
    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);
    return () => {
      track.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, [reviews]);

  const scrollByAmount = (dir: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const amount = Math.max(280, Math.round(track.clientWidth * 0.6));
    track.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.navArrow} ${styles.navArrowLeft}`}
        onClick={() => scrollByAmount(-1)}
        disabled={!canPrev}
        aria-label="Попередній"
      >
        ‹
      </button>

      <div className={styles.track} ref={trackRef}>
        {reviews.map((review) => (
          <article key={review.id} className={styles.card}>
            <p>{review.text}</p>
            <div className={styles.footer}>
              <div className={styles.user}>
                <Image
                  src={review.avatar ?? "/icons/avatar-placeholder.png"}
                  alt={review.userName}
                  width={36}
                  height={36}
                  className={styles.avatar}
                />
                <div>
                  <strong>{review.userName}</strong>
                  <span>клієнт</span>
                </div>
              </div>
              <span className={styles.stars}>{"★".repeat(Math.round(review.rating)).padEnd(5, "☆")}</span>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        className={`${styles.navArrow} ${styles.navArrowRight}`}
        onClick={() => scrollByAmount(1)}
        disabled={!canNext}
        aria-label="Наступний"
      >
        ›
      </button>
    </div>
  );
}
