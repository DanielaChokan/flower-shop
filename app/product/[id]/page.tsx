"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import {
	doc, getDoc, collection, getDocs, query, where, limit,
	addDoc, serverTimestamp, updateDoc, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/modules/cart/CartContext";
import { useAuth } from "@/modules/auth/AuthContext";
import type { Product, Review } from "@/lib/api";
import { useFavourites } from "@/modules/favourites/FavouritesContext";
import styles from "./page.module.css";

type ProductPageProps = {
	params: Promise<{ id: string }>;
};

const getStars = (rating: number) => {
	const rounded = Math.round(rating);
	return "★".repeat(rounded).padEnd(5, "☆");
};

type ReviewWithUser = Review & { userName: string; avatar: string | null };

export default function ProductPage({ params }: ProductPageProps) {
	const { id } = use(params);
	const [product, setProduct] = useState<Product | null>(null);
	const [related, setRelated] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [quantity, setQuantity] = useState(1);
	const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
	const [reviewText, setReviewText] = useState("");
	const [reviewRating, setReviewRating] = useState(5);
	const [submitting, setSubmitting] = useState(false)
	const { addItem, updateQuantity } = useCart();
	const { user, openAuth } = useAuth();
	const { isFavourite, toggleFavourite } = useFavourites();

	const loadReviews = async () => {
		const q = query(
			collection(db, "reviews"),
			where("productId", "==", id),
			orderBy("createdAt", "desc")
		);
		const snap = await getDocs(q);
		const raw = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Review, "id">) }));
		const enriched = await Promise.all(
			raw.map(async (r) => {
				let userName = "Клієнт";
				let avatar: string | null = null;
				try {
					const userSnap = await getDoc(doc(db, "users", r.userId));
					if (userSnap.exists()) {
						const u = userSnap.data() as { displayName?: string; photoURL?: string | null };
						userName = u.displayName ?? userName;
						avatar = u.photoURL ?? null;
					}
				} catch { }
				return { ...r, userName, avatar };
			})
		);
		setReviews(enriched);
	};

	useEffect(() => {
		setLoading(true);
		(async () => {
			const docSnap = await getDoc(doc(db, "products", id));
			if (!docSnap.exists()) {
				setLoading(false);
				return;
			}
			const current = { id: docSnap.id, ...(docSnap.data() as Omit<Product, "id">) };
			setProduct(current);

			const recommendedItems: Product[] = [];

			if (user) {
				const ordersSnap = await getDocs(
					query(collection(db, "orders"), where("userId", "==", user.uid))
				);

				const orderedProductIds = ordersSnap.docs.flatMap((d) => {
					const items = (d.data().items ?? []) as { productId: string }[];
					return items.map((i) => i.productId).filter((pid) => pid && pid !== id);
				});

				if (orderedProductIds.length > 0) {
					const uniqueOrderedIds = Array.from(new Set(orderedProductIds));
					const orderedProductSnaps = await Promise.all(
						uniqueOrderedIds.slice(0, 20).map((pid) => getDoc(doc(db, "products", pid)))
					);

					const categoryCount: Record<string, number> = {};
					for (const pid of orderedProductIds) {
						const snap = orderedProductSnaps.find((s) => s.id === pid);
						if (snap?.exists()) {
							const cat = (snap.data() as { categoryId?: string }).categoryId ?? "";
							if (cat) categoryCount[cat] = (categoryCount[cat] ?? 0) + 1;
						}
					}

					const topCategories = Object.entries(categoryCount)
						.sort((a, b) => b[1] - a[1])
						.map(([catId]) => catId);

					for (const catId of topCategories) {
						if (recommendedItems.length >= 4) break;
						const needed = 4 - recommendedItems.length;
						const existingIds = new Set([id, ...recommendedItems.map((p) => p.id)]);
						const catSnap = await getDocs(
							query(collection(db, "products"), where("categoryId", "==", catId), limit(needed * 3 + existingIds.size))
						);
						const candidates = catSnap.docs
							.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }))
							.filter((p) => !existingIds.has(p.id));
						for (let i = candidates.length - 1; i > 0; i--) {
							const j = Math.floor(Math.random() * (i + 1));
							[candidates[i], candidates[j]] = [candidates[j], candidates[i]];
						}
						recommendedItems.push(...candidates.slice(0, needed));
					}
				}
			}

			if (recommendedItems.length < 4) {
				const needed = 4 - recommendedItems.length;
				const existingIds = new Set([id, ...recommendedItems.map((p) => p.id)]);
				const relatedSnap = await getDocs(
					query(collection(db, "products"), where("categoryId", "==", current.categoryId ?? ""), limit(needed * 3 + existingIds.size))
				);
				const candidates = relatedSnap.docs
					.map((d) => ({ id: d.id, ...(d.data() as Omit<Product, "id">) }))
					.filter((p) => !existingIds.has(p.id));
				for (let i = candidates.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[candidates[i], candidates[j]] = [candidates[j], candidates[i]];
				}
				recommendedItems.push(...candidates.slice(0, needed));
			}

			setRelated(recommendedItems);

			await loadReviews();
			setLoading(false);
		})();
	}, [id, user]);

	const handleSubmitReview = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!user) { openAuth(); return; }
		if (!reviewText.trim()) return;
		setSubmitting(true);
		try {
			await addDoc(collection(db, "reviews"), {
				productId: id,
				userId: user.uid,
				text: reviewText.trim(),
				rating: reviewRating,
				createdAt: serverTimestamp(),
			});

			const reviewsSnap = await getDocs(
				query(collection(db, "reviews"), where("productId", "==", id))
			);
			const allRatings = reviewsSnap.docs.map((d) => (d.data() as { rating: number }).rating);
			const avg = allRatings.reduce((a, b) => a + b, 0) / allRatings.length;
			await updateDoc(doc(db, "products", id), { rating: Math.round(avg * 10) / 10 });

			setProduct((prev) => prev ? { ...prev, rating: Math.round(avg * 10) / 10 } : prev);
			setReviewText("");
			setReviewRating(5);
			await loadReviews();
		} finally {
			setSubmitting(false);
		}
	};

	const handleAddToCart = () => {
		if (!user) { openAuth(); return; }
		if (!product) return;
		if (product.stock !== undefined && product.stock <= 0) return;
		const clampedQty = product.stock !== undefined ? Math.min(quantity, product.stock) : quantity;
		addItem({ id: product.id, name: product.name, price: product.price, image: product.image, rating: product.rating ?? 0, stock: product.stock });
		if (clampedQty > 1) updateQuantity(product.id, clampedQty);
	};

	if (loading) {
		return (
			<div className={styles.page}>
				<Header />
				<main className={styles.main}>
					<p style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>Завантаження...</p>
				</main>
				<Footer />
			</div>
		);
	}

	if (!product) {
		return (
			<div className={styles.page}>
				<Header />
				<main className={styles.main}>
					<p style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)" }}>Товар не знайдено</p>
				</main>
				<Footer />
			</div>
		);
	}

	return (
		<div className={styles.page}>
			<Header />

			<main className={styles.main}>
				<section className={styles.productSection}>
					<div className={styles.mediaBlock}>
						<div className={styles.imageCard}>
							<Image
								src={product.image}
								alt={product.name}
								fill
								sizes="(max-width: 900px) 100vw, 45vw"
								priority
							/>
						</div>
					</div>

					<div className={styles.infoBlock}>
						<h1 className={styles.title}>{product.name}</h1>
						<div className={styles.ratingRow}>
							<span className={styles.stars}>
								{getStars(product.rating ?? 0)}
							</span>
							<span className={styles.reviews}>
								({reviews.length} {reviews.length === 1 ? "відгук" : reviews.length >= 2 && reviews.length <= 4 ? "відгуки" : "відгуків"})
							</span>
						</div>
						<span className={product.stock === undefined || product.stock > 0 ? styles.inStock : styles.outOfStock}>
							{product.stock === undefined || product.stock > 0 ? "В наявності" : "Немає в наявності"}
						</span>
						{product.description && (
							<p className={styles.description}>{product.description}</p>
						)}
						<p className={styles.price}>{product.price} грн.</p>
						<div className={styles.controls}>
							<div className={styles.counterCartRow}>
								<div className={styles.counter}>
									<button
										type="button"
										aria-label="Зменшити"
										className={styles.counterBtn}
										onClick={() => setQuantity((q) => Math.max(1, q - 1))}
									>
										−
									</button>
									<span className={styles.counterVal}>{quantity}</span>
									<button
										type="button"
										aria-label="Збільшити"
										className={styles.counterBtn}
										disabled={product.stock !== undefined && quantity >= product.stock}
										onClick={() => setQuantity((q) => product.stock !== undefined ? Math.min(product.stock, q + 1) : q + 1)}
									>
										+
									</button>
								</div>
								<button type="button" className={styles.cartButton} onClick={handleAddToCart} disabled={product.stock !== undefined && product.stock <= 0}>
									В кошик
								</button>
							</div>
							{product.stock !== undefined && quantity == product.stock && product.stock > 0 && (
								<p className={styles.stockLimit}>Це максимальна кількість в наявності</p>
							)}
							<button
								type="button"
								className={`${styles.favourite}${isFavourite(id) ? ` ${styles.favouriteActive}` : ""}`}
								onClick={() => { if (!user) { openAuth(); return; } toggleFavourite(id); }}
								aria-label={isFavourite(id) ? "Видалити з обраного" : "Додати до обраного"}
							>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path d="M12 21C12 21 3 13.5 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 13-9 13z" />
								</svg>
								{isFavourite(id) ? "Видалити з обраного" : "Додати до обраного"}
							</button>
						</div>
					</div>
				</section>

				{related.length > 0 && (
					<section className={styles.related}>
						<h2>Вас також може зацікавити</h2>
						<div className={styles.relatedGrid}>
							{related.map((item) => (
								<Link key={item.id} href={`/product/${item.id}`} className={styles.relatedCardLink}>
									<article className={styles.relatedCard}>
										<div className={styles.relatedImage}>
											<Image
												src={item.image}
												alt={item.name}
												fill
												sizes="(max-width: 900px) 45vw, 200px"
											/>
										</div>
										<div className={styles.relatedBody}>
											<h3>{item.name}</h3>
											<p className={styles.relatedPrice}>
												{item.price} грн.
											</p>
											<p className={styles.relatedStars}>
												{getStars(item.rating ?? 0)}
											</p>
										</div>
									</article>
								</Link>
							))}
						</div>
					</section>
				)}

				<section className={styles.reviewsSection}>
					<h2>Відгуки</h2>

					{reviews.length === 0 && (
						<p className={styles.noReviews}>Поки немає відгуків. Будьте першим!</p>
					)}

					{reviews.length > 0 && (
						<div className={styles.reviewsList}>
							{reviews.map((r) => (
								<div key={r.id} className={styles.reviewCard}>
									<div className={styles.reviewHeader}>
										<Image
											src={r.avatar ?? "/icons/avatar-placeholder.png"}
											alt={r.userName}
											width={36}
											height={36}
											className={styles.reviewAvatar}
										/>
										<div>
											<strong className={styles.reviewAuthor}>{r.userName}</strong>
											<span className={styles.reviewStars}>{getStars(r.rating)}</span>
										</div>
									</div>
									<p className={styles.reviewText}>{r.text}</p>
								</div>
							))}
						</div>
					)}

					{!user && (
						<p className={styles.loginPrompt}>
							<button type="button" className={styles.loginLink} onClick={openAuth}>
								Увійдіть
							</button>{" "}
							щоб залишити відгук
						</p>
					)}

					{user && (
						<form className={styles.reviewForm} onSubmit={handleSubmitReview}>
							<h3>Залишити відгук</h3>
							<div className={styles.ratingSelect}>
								<span>Оцінка:</span>
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										className={`${styles.starBtn}${reviewRating >= star ? ` ${styles.starActive}` : ""}`}
										onClick={() => setReviewRating(star)}
										aria-label={`${star} зірок`}
									>
										★
									</button>
								))}
							</div>
							<textarea
								className={styles.reviewTextarea}
								value={reviewText}
								onChange={(e) => setReviewText(e.target.value)}
								placeholder="Ваш відгук..."
								rows={4}
								required
							/>
							<button type="submit" className={styles.reviewSubmit} disabled={submitting}>
								{submitting ? "Надсилання..." : "Надіслати відгук"}
							</button>
						</form>
					)}
				</section>
			</main>

			<Footer />
		</div>
	);
}
