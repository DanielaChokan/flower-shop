"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import styles from "./ReviewsSlider.module.css";

interface Review {
  id: string;
  userName: string;
  text: string;
  rating: number;
  avatar: string;
  createdAt?: number;
}

export default function ReviewsSlider() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(10));
    getDocs(q).then((snapshot) => {
      setReviews(
        snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Review, "id">) }))
      );
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
                  src={review.avatar}
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
              <span className={styles.stars}>{"★".repeat(review.rating)}</span>
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
