import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FilterSidebar from "@/components/product/FilterSidebar";
import ProductCard from "@/components/product/ProductCard";
import CategorySlider from "@/components/product/CategorySlider";
import products from "@/modules/mock/products.json";
import styles from "./page.module.css";

const navTabs = [
    "Каталог",
    "тюльпани",
    "півоні",
    "троянди",
    "хризантеми",
    "червоні",
    "гіпсофілі",
    "орхідеї",
    "білі",
    "букети",
    "альстромерії",
    "ромашки",
    "рожеві",
    "червоні",
    "гортензії",
    "іриси",
];

const allProducts = [
    ...products,
    ...products.map((p) => ({ ...p, id: p.id + "_b" })),
    ...products.map((p) => ({ ...p, id: p.id + "_c" })),
];

export default function CatalogPage() {
    return (
        <div className={styles.page}>
            <Header />

            <CategorySlider tabs={navTabs} initialActive={0} />

            <main className={styles.main}>
                <h2 className={styles.heading}>Каталог</h2>

                <div className={styles.body}>
                    <FilterSidebar />

                    <div>
                        <div className={styles.productGrid}>
                            {allProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    name={product.name}
                                    price={product.price}
                                    image={product.image}
                                    rating={product.rating}
                                />
                            ))}
                        </div>

                        <div className={styles.pagination}>
                            <button type="button" className={styles.paginationBtn}>
                                ←
                            </button>
                            <span className={styles.paginationCurrent}>1</span>
                            <button type="button" className={styles.paginationBtn}>
                                →
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
