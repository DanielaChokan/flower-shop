import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import products from "@/modules/mock/products.json";
import styles from "./page.module.css";

type ProductPageProps = {
	params: {
		id: string;
	};
};

const getStars = (rating: number) => {
	const rounded = Math.round(rating);
	return "★".repeat(rounded).padEnd(5, "☆");
};

export default function ProductPage({ params }: ProductPageProps) {
	const product = products.find((item) => item.id === params.id) ?? products[0];
	const related = products.filter((item) => item.id !== product.id).slice(0, 4);

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
								{getStars(product.rating)}
							</span>
							<span className={styles.reviews}>(12 відгуків)</span>
						</div>
						<p className={styles.price}>{product.price} грн.</p>
						<div className={styles.controls}>
							<div className={styles.counter}>
								<button type="button" aria-label="Зменшити">
									−
								</button>
								<span>1</span>
								<button type="button" aria-label="Збільшити">
									+
								</button>
							</div>
							<button type="button" className={styles.cartButton}>
								В кошик
							</button>
						</div>

						<div className={styles.features}>
							<div>
								<span className={styles.featureIcon}>+</span>
								<p>Доставка 24/7</p>
							</div>
							<div>
								<span className={styles.featureIcon}>+</span>
								<p>Гарантія свіжості</p>
							</div>
						</div>
					</div>
				</section>

				<section className={styles.related}>
					<h2>Вас також може зацікавити</h2>
					<div className={styles.relatedGrid}>
						{related.map((item) => (
							<article key={item.id} className={styles.relatedCard}>
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
										{getStars(item.rating)}
									</p>
									<button type="button">Додати до обраного</button>
								</div>
							</article>
						))}
					</div>
				</section>
			</main>

			<Footer />
		</div>
	);
}
