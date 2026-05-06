"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./ProductCard.module.css";
import { useCart } from "@/modules/cart/CartContext";
import { useAuth } from "@/modules/auth/AuthContext";
import { useFavourites } from "@/modules/favourites/FavouritesContext";

type ProductCardProps = {
    id: string;
    name: string;
    price: number;
    image: string;
    rating: number;
    inCart?: boolean;
    quantity?: number;
    onQuantityChange?: (quantity: number) => void;
    isCustom?: boolean;
};

const getStars = (rating: number) => {
    const rounded = Math.round(rating);
    return "★".repeat(rounded).padEnd(5, "☆");
};

export default function ProductCard({
    id,
    name,
    price,
    image,
    rating,
    inCart = false,
    quantity = 1,
    onQuantityChange,
    isCustom = false,
}: ProductCardProps) {
    const { addItem } = useCart();
    const { user, openAuth } = useAuth();
    const { isFavourite, toggleFavourite } = useFavourites();
    const fav = isFavourite(id);

    const handleFavouriteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!user) { openAuth(); return; }
        toggleFavourite(id);
    };

    const handleAddToCart = () => {
        if (!user) { openAuth(); return; }
        addItem({ id, name, price, image, rating });
    };

    return (
        <article className={styles.card}>
            <Link href={isCustom ? "/" : `/product/${id}`} className={styles.cardLink}>
                <div className={styles.imageWrap}>
                    {isCustom && image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt={name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                        <Image
                            src={image}
                            alt={name}
                            fill
                            sizes="(max-width: 900px) 50vw, 240px"
                        />
                    )}
                    {!inCart && !isCustom && (
                        <button
                            type="button"
                            className={`${styles.heartBtn}${fav ? ` ${styles.heartBtnActive}` : ""}`}
                            onClick={handleFavouriteClick}
                            aria-label={fav ? "Видалити з обраного" : "Додати до обраного"}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                <path d="M12 21C12 21 3 13.5 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 13-9 13z" />
                            </svg>
                        </button>
                    )}
                </div>
            </Link>
            <div className={styles.content}>
                {isCustom && <span className={styles.customBadge}>AI Букет</span>}
                <Link href={isCustom ? "/" : `/product/${id}`} className={styles.cardTitleLink}>
                    <h3>{name}</h3>
                </Link>
                <p className={styles.price}>{price} грн.</p>
                {!isCustom && <p className={styles.rating}>{getStars(rating)}</p>}
                {inCart ? (
                    <div className={styles.quantityRow}>
                        <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() => onQuantityChange?.(quantity - 1)}
                            aria-label="Зменшити кількість"
                        >
                            −
                        </button>
                        <span className={styles.qtyValue}>{quantity}</span>
                        <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() => onQuantityChange?.(quantity + 1)}
                            aria-label="Збільшити кількість"
                        >
                            +
                        </button>
                    </div>
                ) : (
                    <button type="button" onClick={handleAddToCart}>Додати до кошика</button>
                )}
            </div>
        </article>
    );
}
