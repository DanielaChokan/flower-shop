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
        </div>

        <div className={styles.centerCol}>
          <ul className={styles.linkList}>
            <li>
              <Link href="#" className={styles.footerLink}>
                Статті
              </Link>
            </li>
            <li>
              <Link href="#" className={styles.footerLink}>
                Юр. особам
              </Link>
            </li>
            <li>
              <Link href="#" className={styles.footerLink}>
                Допомога
              </Link>
            </li>
            <li>
              <Link href="#" className={styles.footerLink}>
                Доставка
              </Link>
            </li>
          </ul>
          <Link href="/catalog" className={styles.catalogButton}>
            Каталог
          </Link>
        </div>

        <div className={styles.rightCol}>
          <ul className={styles.linkList}>
            <li>
              <Link href="#" className={styles.footerLink}>
                Оплата
              </Link>
            </li>
            <li>
              <Link href="#" className={styles.footerLink}>
                Умови повернення
              </Link>
            </li>
            <li>
              <Link href="#" className={styles.footerLink}>
                Робота у нас
              </Link>
            </li>
            <li>
              <Link href="#" className={styles.footerLink}>
                Політика конфіденційності
              </Link>
            </li>
          </ul>
          <div className={styles.social}>
            <Link href="#" className={styles.footerLink}>
              Ми в соцмережах
            </Link>
            <div className={styles.socialIcons}>
              <Link href="#" className={styles.socialLink} aria-label="Pinterest">
                <Image src="/icons/footer-pinterest.png" alt="Pinterest" width={24} height={24} />
              </Link>
              <Link href="#" className={styles.socialLink} aria-label="Telegram">
                <Image src="/icons/footer-telegram.png" alt="Telegram" width={24} height={24} />
              </Link>
              <Link href="#" className={styles.socialLink} aria-label="TikTok">
                <Image src="/icons/footer-tik-tok.png" alt="TikTok" width={24} height={24} />
              </Link>
              <Link href="#" className={styles.socialLink} aria-label="Instagram">
                <Image src="/icons/footer-instagram.png" alt="Instagram" width={24} height={24} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.bottom}>© 2026 FloraSwift</div>
    </footer>
  );
}
