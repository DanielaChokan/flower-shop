import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ReviewsSlider from "@/components/UI/ReviewsSlider";
import ProductsSection from "@/components/product/ProductsSection";
import styles from "./page.module.css";

const featureItems = [
  {
    title: "Авторські букети",
    subtitle: "унікальні композиції для особливих моментів",
    image: "/images/home-line1.png",
  },
  {
    title: "Тільки свіжі квіти",
    subtitle: "щоденні поставки від перевірених постачальників",
    image: "/images/home-line2.png",
  },
  {
    title: "Доставка квітів 24/7",
    subtitle: "привеземо букет вчасно, коли це найважливіше",
    image: "/images/home-line3.png",
  },
  {
    title: "Власні квітники",
    subtitle: "контроль якості від вирощування до вручення",
    image: "/images/home-line4.png",
  },
];

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroMain}>
            <Image
              src="/images/home-section1.png"
              alt="Квіти з доставкою"
              fill
              sizes="(max-width: 900px) 100vw, 60vw"
              priority
            />
            <div className={styles.heroText}>
              <h1>Квіти з доставкою — подаруйте щастя близьким</h1>
            </div>
          </div>
          <div className={styles.heroSide}>
            <div className={styles.sideCard}>
              <Image
                src="/images/home-section2.png"
                alt="Букет мрії"
                fill
                sizes="(max-width: 900px) 100vw, 30vw"
              />
              <div>
                <h3>Букет мрії для будь-якого випадку</h3>
              </div>
            </div>
            <div className={styles.sideCard}>
              <Image
                src="/images/home-section3.png"
                alt="Даруйте радість"
                fill
                sizes="(max-width: 900px) 100vw, 30vw"
              />
              <div>
                <h3>Даруйте радість з нашими квітами</h3>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.features}>
          {featureItems.map((item) => (
            <article key={item.title} className={styles.featureCard}>
              <div className={styles.featureImage}>
                <Image src={item.image} alt={item.title} fill sizes="64px" />
              </div>
              <div>
                <h4>{item.title}</h4>
                <p>{item.subtitle}</p>
              </div>
            </article>
          ))}
        </section>

        <div className={styles.featuresSlider}>
          {featureItems.map((item) => (
            <article key={item.title} className={styles.featureCard}>
              <div className={styles.featureImage}>
                <Image src={item.image} alt={item.title} fill sizes="64px" />
              </div>
              <div>
                <h4>{item.title}</h4>
                <p>{item.subtitle}</p>
              </div>
            </article>
          ))}
        </div>

        <section className={styles.products}>
          <div className={styles.productsHeader}>
            <h2>Найбажаніші</h2>
            <a href="/catalog" className={styles.catalogLink}>
              Перейти до каталогу →
            </a>
          </div>
          <ProductsSection />
        </section>

        <section className={styles.loyalty}>
          <div className={styles.loyaltyInfo}>
            <Image
              src="/images/home-discount-left.png"
              alt="Клуб"
              width={90}
              height={90}
            />
            <div>
              <h3>Тільки для постійних клієнтів</h3>
              <p>Квіти на всі свята у році</p>
            </div>
          </div>
          <div className={styles.loyaltyBenefits}>
            <div>
              <Image
                src="/images/home-discount-checkbox.png"
                alt="Знижка"
                width={18}
                height={18}
              />
              <span>Знижка на товар — 10%</span>
            </div>
            <div>
              <Image
                src="/images/home-discount-checkbox.png"
                alt="Доставка"
                width={18}
                height={18}
              />
              <span>Безкоштовна доставка</span>
            </div>
            <div>
              <Image
                src="/images/home-discount-checkbox.png"
                alt="Інформація"
                width={18}
                height={18}
              />
              <span>Інформація про акції</span>
            </div>
          </div>
          <Image
            className={styles.loyaltyRight}
            src="/images/home-discount-right.png"
            alt="Квіти"
            width={90}
            height={90}
          />
        </section>

        <section className={styles.reviews}>
          <h2>Відгуки наших клієнтів</h2>
          <ReviewsSlider />
        </section>
      </main>
      <Footer />
    </div>
  );
}
