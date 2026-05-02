import styles from "./FilterSidebar.module.css";
import categories from "@/modules/mock/categories.json";

export default function FilterSidebar() {
    return (
        <aside className={styles.sidebar}>
            <div className={styles.section}>
                <h3>Ціна</h3>
                <div className={styles.priceInputs}>
                    <input type="number" defaultValue="0" />
                    <input type="number" defaultValue="20000" />
                </div>
                <div className={styles.rangeVisual}>
                    <div className={styles.rangeTrack}></div>
                    <div
                        className={styles.rangeThumb}
                        style={{ left: "0%" }}
                    ></div>
                    <div
                        className={styles.rangeThumb}
                        style={{ right: "0%" }}
                    ></div>
                </div>
            </div>

            <details className={styles.details}>
                <summary>
                    Квіти <span className={styles.chevron}></span>
                </summary>
                <ul>
                    {categories.map((category) => (
                        <li key={category.id}>
                            <label>
                                <input type="checkbox" />
                                {category.name}
                            </label>
                        </li>
                    ))}
                </ul>
            </details>

            <details className={styles.details}>
                <summary>
                    Кому <span className={styles.chevron}></span>
                </summary>
                <ul>
                    {["Рідним", "Коханій", "Колегам", "Друзям"].map((item) => (
                        <li key={item}>
                            <label>
                                <input type="checkbox" />
                                {item}
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
                    {["Рожевий", "Білий", "Червоний", "Мікс"].map((item) => (
                        <li key={item}>
                            <label>
                                <input type="checkbox" />
                                {item}
                            </label>
                        </li>
                    ))}
                </ul>
            </details>

            <details className={styles.details}>
                <summary>
                    Тип букета <span className={styles.chevron}></span>
                </summary>
                <ul>
                    {[
                        "Класичний",
                        "Романтичний",
                        "Екзотичний",
                        "Весільний",
                    ].map((item) => (
                        <li key={item}>
                            <label>
                                <input type="checkbox" />
                                {item}
                            </label>
                        </li>
                    ))}
                </ul>
            </details>

            <button type="button" className={styles.applyButton}>
                Застосувати зміни
            </button>
            <button type="button" className={styles.clearButton}>
                Очистити фільтр
            </button>
        </aside>
    );
}
