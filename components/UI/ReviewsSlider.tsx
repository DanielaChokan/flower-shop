"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./ReviewsSlider.module.css";

interface Review {
  id: string;
  userName: string;
  text: string;
  rating: number;
  avatar: string;
}

interface ReviewsSliderProps {
  reviews: Review[];
  visibleCount?: number;
}

export default function ReviewsSlider({ reviews, visibleCount = 4 }: ReviewsSliderProps) {
  const [index, setIndex] = useState(0);

  const maxIndex = reviews.length - visibleCount;
  const canPrev = index > 0;
  const canNext = index < maxIndex;

  const visible = reviews.slice(index, index + visibleCount);

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => setIndex((i) => Math.max(0, i - 1))}
        disabled={!canPrev}
        aria-label="Попередній"
      >
        ‹
      </button>

      <div className={styles.track}>
        {visible.map((review) => (
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
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
        disabled={!canNext}
        aria-label="Наступний"
      >
        ›
      </button>
    </div>
  );
}
