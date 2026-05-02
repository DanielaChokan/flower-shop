import Image from "next/image";
import styles from "./ProductCard.module.css";

type ProductCardProps = {
    name: string;
    price: number;
    image: string;
    rating: number;
};

const getStars = (rating: number) => {
    const rounded = Math.round(rating);
    return "★".repeat(rounded).padEnd(5, "☆");
};

export default function ProductCard({
    name,
    price,
    image,
    rating,
}: ProductCardProps) {
    return (
        <article className={styles.card}>
            <div className={styles.imageWrap}>
                <Image
                    src={image}
                    alt={name}
                    fill
                    sizes="(max-width: 900px) 50vw, 240px"
                />
            </div>
            <div className={styles.content}>
                <h3>{name}</h3>
                <p className={styles.price}>{price} грн.</p>
                <p className={styles.rating}>{getStars(rating)}</p>
                <button type="button">Додати до кошика</button>
            </div>
        </article>
    );
}
