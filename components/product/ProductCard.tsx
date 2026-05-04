"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./ProductCard.module.css";
import { useCart } from "@/modules/cart/CartContext";
import { useAuth } from "@/modules/auth/AuthContext";

type ProductCardProps = {
    id: string;
    name: string;
    price: number;
    image: string;
    rating: number;
    inCart?: boolean;
    quantity?: number;
    onQuantityChange?: (quantity: number) => void;
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
}: ProductCardProps) {
    const { addItem } = useCart();
    const { user, openAuth } = useAuth();

    const handleAddToCart = () => {
        if (!user) { openAuth(); return; }
        addItem({ id, name, price, image, rating });
    };

    return (
        <article className={styles.card}>
            <Link href={`/product/${id}`} className={styles.cardLink}>
                <div className={styles.imageWrap}>
                    <Image
                        src={image}
                        alt={name}
                        fill
                        sizes="(max-width: 900px) 50vw, 240px"
                    />
                </div>
            </Link>
            <div className={styles.content}>
                <Link href={`/product/${id}`} className={styles.cardTitleLink}>
                    <h3>{name}</h3>
                </Link>
                <p className={styles.price}>{price} грн.</p>
                <p className={styles.rating}>{getStars(rating)}</p>
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
