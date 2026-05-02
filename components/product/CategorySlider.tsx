"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CategorySlider.module.css";

type CategorySliderProps = {
  tabs: string[];
  initialActive?: number;
};

export default function CategorySlider({
  tabs,
  initialActive = 0,
}: CategorySliderProps) {
  const [activeIndex, setActiveIndex] = useState(initialActive);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const updateControls = () => {
    const track = trackRef.current;
    if (!track) return;
    const maxScrollLeft = track.scrollWidth - track.clientWidth;
    setCanPrev(track.scrollLeft > 0);
    setCanNext(track.scrollLeft < maxScrollLeft - 1);
  };

  const scrollByAmount = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const amount = Math.max(180, Math.round(track.clientWidth * 0.6));
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateControls();
    const handleScroll = () => updateControls();

    track.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      track.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.navArrow} ${styles.navArrowLeft}`}
        onClick={() => scrollByAmount(-1)}
        disabled={!canPrev}
        aria-label="Прокрутити вліво"
      >
        ‹
      </button>

      <div
        className={styles.track}
        ref={trackRef}
        role="tablist"
        aria-label="Категорії каталогу"
      >
        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={`${tab}-${index}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? styles.tabActive : styles.tab}
              onClick={() => setActiveIndex(index)}
            >
              {tab}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={`${styles.navArrow} ${styles.navArrowRight}`}
        onClick={() => scrollByAmount(1)}
        disabled={!canNext}
        aria-label="Прокрутити вправо"
      >
        ›
      </button>
    </div>
  );
}
