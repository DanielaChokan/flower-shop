"use client";

import styles from "./FilterSidebar.module.css";

export type FilterState = {
    priceMin: number;
    priceMax: number;
    categories: string[];
    colors: string[];
    types: string[];
};

export type CategoryOption = { id: string; name: string };

type FilterSidebarProps = {
    value: FilterState;
    onChange: (filters: FilterState) => void;
    onClear: () => void;
    categoryOptions: CategoryOption[];
    colorOptions: string[];
    typeOptions: string[];
};

const PRICE_MAX = 20000;

const defaultFilters = (): FilterState => ({
    priceMin: 0,
    priceMax: PRICE_MAX,
    categories: [],
    colors: [],
    types: [],
});

function toggleItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export default function FilterSidebar({ value: filters, onChange, onClear, categoryOptions, colorOptions, typeOptions }: FilterSidebarProps) {
    const handleCategory = (id: string) =>
        onChange({ ...filters, categories: toggleItem(filters.categories, id) });

    const handleColor = (color: string) =>
        onChange({ ...filters, colors: toggleItem(filters.colors, color) });

    const handleType = (type: string) =>
        onChange({ ...filters, types: toggleItem(filters.types, type) });

    const handlePriceMin = (v: number) =>
        onChange({ ...filters, priceMin: Math.min(v, filters.priceMax - 1) });

    const handlePriceMax = (v: number) =>
        onChange({ ...filters, priceMax: Math.max(v, filters.priceMin + 1) });

    const handleClear = () => onClear();

    const minPct = (filters.priceMin / PRICE_MAX) * 100;
    const maxPct = (filters.priceMax / PRICE_MAX) * 100;

    return (
        <aside className={styles.sidebar}>
            <div className={styles.section}>
                <h3>Ціна</h3>
                <div className={styles.priceLabels}>
                    <span>{filters.priceMin} ₴</span>
                    <span>{filters.priceMax} ₴</span>
                </div>
                <div className={styles.rangeWrap}>
                    <div className={styles.rangeTrack}>
                        <div
                            className={styles.rangeFill}
                            style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }}
                        />
                    </div>
                    <input
                        type="range"
                        className={styles.rangeInput}
                        min={0}
                        max={PRICE_MAX}
                        value={filters.priceMin}
                        onChange={(e) => handlePriceMin(Number(e.target.value))}
                    />
                    <input
                        type="range"
                        className={styles.rangeInput}
                        min={0}
                        max={PRICE_MAX}
                        value={filters.priceMax}
                        onChange={(e) => handlePriceMax(Number(e.target.value))}
                    />
                </div>
            </div>

            <details className={styles.details}>
                <summary>
                    Квіти <span className={styles.chevron}></span>
                </summary>
                <ul>
                    {categoryOptions.map((category) => (
                        <li key={category.id}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={filters.categories.includes(category.id)}
                                    onChange={() => handleCategory(category.id)}
                                />
                                {category.name}
                            </label>
                        </li>
                    ))}
                </ul>
            </details>

            <details className={styles.details}>
                <summary>
                    Колір <span className={styles.chevron}></span>
                </summary>
                <ul>
                    {colorOptions.map((item) => (
                        <li key={item}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={filters.colors.includes(item)}
                                    onChange={() => handleColor(item)}
                                />
                                {item}
                            </label>
                        </li>
                    ))}
                </ul>
            </details>

            {typeOptions.length > 0 && (
            <details className={styles.details}>
                <summary>
                    Тип букета <span className={styles.chevron}></span>
                </summary>
                <ul>
                    {typeOptions.map((item) => (
                        <li key={item}>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={filters.types.includes(item)}
                                    onChange={() => handleType(item)}
                                />
                                {item}
                            </label>
                        </li>
                    ))}
                </ul>
            </details>
            )}

            <button type="button" className={styles.applyButton} onClick={() => onChange(filters)}>
                Застосувати зміни
            </button>
            <button type="button" className={styles.clearButton} onClick={handleClear}>
                Очистити фільтр
            </button>
        </aside>
    );
}
