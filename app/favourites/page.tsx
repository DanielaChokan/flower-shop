"use client";

import { useEffect, useState, useMemo } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/product/ProductCard";
import { useFavourites } from "@/modules/favourites/FavouritesContext";
import type { Product } from "@/lib/api";
import styles from "./page.module.css";

function getItemsPerPage() {
    if (typeof window !== "undefined" && window.innerWidth <= 640) return 12;
    return 15;
}

export default function FavouritesPage() {
    const { favouriteIds } = useFavourites();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage);

    useEffect(() => {
        const update = () => setItemsPerPage(getItemsPerPage());
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    useEffect(() => {
        if (favouriteIds.length === 0) {
            setProducts([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all(
            favouriteIds.map((id) =>
                getDoc(doc(db, "products", id)).then((snap) =>
                    snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Product, "id">) } as Product) : null
                )
            )
        ).then((results) => {
            setProducts(results.filter(Boolean) as Product[]);
            setLoading(false);
        });
    }, [favouriteIds]);

    const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
    const paginated = useMemo(
        () => products.slice((page - 1) * itemsPerPage, page * itemsPerPage),
        [products, page, itemsPerPage]
    );

    return (
        <div className={styles.page}>
            <Header />
            <main className={styles.main}>
                <h1 className={styles.heading}>Обране</h1>
                {loading ? (
                    <p className={styles.empty}>Завантаження...</p>
                ) : products.length === 0 ? (
                    <p className={styles.empty}>Ви ще не додали жодного товару до обраного.</p>
                ) : (
                    <>
                        <div className={styles.grid}>
                            {paginated.map((p) => (
                                <ProductCard
                                    key={p.id}
                                    id={p.id}
                                    name={p.name}
                                    price={p.price}
                                    image={p.image}
                                    rating={p.rating}
                                    stock={p.stock}
                                />
                            ))}
                        </div>
                        {totalPages > 1 && (
                            <div className={styles.pagination}>
                                <button
                                    type="button"
                                    className={styles.paginationArrow}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    aria-label="Попередня сторінка"
                                >
                                    ‹
                                </button>
                                <span className={styles.paginationCurrent}>{page}</span>
                                <button
                                    type="button"
                                    className={styles.paginationArrow}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    aria-label="Наступна сторінка"
                                >
                                    ›
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
