import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Image
              src="/icons/header-logo.png"
              alt="FloraSwift"
              width={44}
              height={44}
              className={styles.logoImage}
            />
            <span>FloraSwift</span>
          </div>
          <div className={styles.contacts}>
            <div className={styles.contactRow}>
              <Image src="/icons/footer-location.png" alt="" width={16} height={16} />
              <span>м. Суми вул. Ковпака 4</span>
            </div>
            <div className={styles.contactRow}>
              <Image src="/icons/footer-call.png" alt="" width={16} height={16} />
              <span>+380 99 000 0000</span>
            </div>
          </div>
          <button type="button" className={styles.callButton}>
            Замовити дзвінок
          </button>
        </div>

        <div className={styles.centerCol}>
          <ul className={styles.linkList}>
            <li>Статті</li>
            <li>Юр. особам</li>
            <li>Допомога</li>
            <li>Доставка</li>
          </ul>
          <Link href="/catalog" className={styles.catalogButton}>
            Каталог
          </Link>
        </div>

        <div className={styles.rightCol}>
          <ul className={styles.linkList}>
            <li>Оплата</li>
            <li>Умови повернення</li>
            <li>Робота у нас</li>
            <li>Політика конфіденційності</li>
          </ul>
          <div className={styles.social}>
            <span>Ми в соцмережах</span>
            <div className={styles.socialIcons}>
              <Image src="/icons/footer-pinterest.png" alt="Pinterest" width={24} height={24} />
              <Image src="/icons/footer-telegram.png" alt="Telegram" width={24} height={24} />
              <Image src="/icons/footer-tik-tok.png" alt="TikTok" width={24} height={24} />
              <Image src="/icons/footer-instagram.png" alt="Instagram" width={24} height={24} />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>© Copyright 2026</div>
    </footer>
  );
}
