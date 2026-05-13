"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FilterSidebar, { FilterState, CategoryOption } from "@/components/product/FilterSidebar";
import ProductCard from "@/components/product/ProductCard";
import CategorySlider from "@/components/product/CategorySlider";
import type { Product } from "@/lib/api";
import styles from "./page.module.css";

const ITEMS_PER_PAGE = 15;

const defaultFilters = (): FilterState => ({
    priceMin: 0,
    priceMax: 20000,
    categories: [],
    colors: [],
    types: [],
});

export default function CatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState<FilterState>(defaultFilters());
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [page, setPage] = useState(1);
    const [filterOpen, setFilterOpen] = useState(false);

    useEffect(() => {
        Promise.all([
            getDocs(collection(db, "products")),
            getDocs(collection(db, "categories")),
        ]).then(([productsSnap, categoriesSnap]) => {
            setProducts(
                productsSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Product, "id">) }))
            );
            setCategoryOptions(
                categoriesSnap.docs.map((doc) => ({ id: doc.id, name: (doc.data() as { name: string }).name }))
            );
            setLoading(false);
        });
    }, []);

    const navTabs = useMemo(() => [
        { label: "Каталог", categoryId: null },
        ...categoryOptions.map((c) => ({ label: c.name, categoryId: c.id })),
    ], [categoryOptions]);

    const tabLabels = useMemo(() => navTabs.map((t) => t.label), [navTabs]);

    const colorOptions = useMemo(() =>
        [...new Set(products.map((p) => p.color).filter(Boolean) as string[])],
        [products]
    );

    const typeOptions = useMemo(() =>
        [...new Set(
            products
                .filter((p) => p.categoryId === "bouquets")
                .map((p) => p.type)
                .filter(Boolean) as string[]
        )],
        [products]
    );

    const filtered = useMemo(() => {
        return products.filter((p) => {
            if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
            if (p.price < filters.priceMin || p.price > filters.priceMax) return false;
            if (filters.categories.length > 0 && !filters.categories.includes(p.categoryId ?? "")) return false;
            if (filters.colors.length > 0 && !filters.colors.includes(p.color ?? "")) return false;
            if (filters.types.length > 0 && !filters.types.includes(p.type ?? "")) return false;
            return true;
        });
    }, [products, search, filters]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    const handleTabSelect = (index: number) => {
        setActiveTabIndex(index);
        const categoryId = navTabs[index].categoryId;
        setFilters((f) => ({ ...f, categories: categoryId ? [categoryId] : [] }));
        setPage(1);
    };

    const handleFilterChange = (f: FilterState) => {
        setFilters(f);
        if (f.categories.length === 1) {
            const idx = navTabs.findIndex((t) => t.categoryId === f.categories[0]);
            setActiveTabIndex(idx !== -1 ? idx : 0);
        } else if (f.categories.length === 0) {
            setActiveTabIndex(0);
        }
        setPage(1);
    };

    const handleClear = () => {
        setFilters(defaultFilters());
        setActiveTabIndex(0);
        setPage(1);
    };

    const handleSearch = (v: string) => {
        setSearch(v);
        setPage(1);
    };

    return (
        <div className={styles.page}>
            <Header />

            <CategorySlider
                tabs={tabLabels}
                activeIndex={activeTabIndex}
                onSelect={handleTabSelect}
            />

            <main className={styles.main}>
                <h2 className={styles.heading}>Каталог</h2>

                <div className={styles.body}>
                    <div className={styles.searchWrap}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Пошук за назвою..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                        <button
                            type="button"
                            className={`${styles.filterToggleBtn}${filterOpen ? ` ${styles.filterToggleBtnActive}` : ""}`}
                            onClick={() => setFilterOpen((v) => !v)}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            Фільтри
                        </button>
                    </div>

                    {filterOpen && (
                        <div className={styles.filterDropdown}>
                            <FilterSidebar
                                value={filters}
                                onChange={handleFilterChange}
                                onClear={handleClear}
                                categoryOptions={categoryOptions}
                                colorOptions={colorOptions}
                                typeOptions={typeOptions}
                            />
                        </div>
                    )}

                    {loading ? (
                        <p className={styles.noResults}>Завантаження...</p>
                    ) : paginated.length === 0 ? (
                        <p className={styles.noResults}>Нічого не знайдено</p>
                    ) : (
                        <div className={styles.productGrid}>
                            {paginated.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    price={product.price}
                                    image={product.image}
                                    rating={product.rating}
                                    stock={product.stock}
                                />
                            ))}
                        </div>
                    )}

                    {!loading && totalPages > 1 && (
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
                </div>
            </main>

            <Footer />
        </div>
    );
}
