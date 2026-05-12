"use client";

import { useState, useEffect } from "react";
import { addDoc, collection, serverTimestamp, doc, getDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/modules/auth/AuthContext";
import { useCart } from "@/modules/cart/CartContext";
import { checkoutFormSchema } from "@/schemas/order.schema";
import { classifyCustomer, buildCustomerFeatures, REGULAR_CUSTOMER_DISCOUNT } from "@/lib/naiveBayes";
import { CustomerType } from "@/lib/api";
import styles from "./CheckoutModal.module.css";

type Props = {
  onClose: () => void;
};

type Step = "form" | "confirm" | "success";

export default function CheckoutModal({ onClose }: Props) {
  const { user } = useAuth();
  const { items, total, clearCart, closeCart } = useCart();

  const [step, setStep] = useState<Step>("form");
  const [recipient, setRecipient] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [comment, setComment] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"recipient" | "phone" | "address", string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [savedAddresses, setSavedAddresses] = useState<string[]>([]);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<string | null>(null);
  const [customerType, setCustomerType] = useState<CustomerType | null>(null);
  const [isRegular, setIsRegular] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const addrs: string[] = snap.data().addresses ?? [];
        setSavedAddresses(addrs);
      }
    });

    getDocs(query(collection(db, "orders"), where("userId", "==", user.uid))).then((snap) => {
      const orders = snap.docs.map((d) => ({
        totalPrice: (d.data().totalPrice as number) ?? 0,
        comment: d.data().comment as string | null,
      }));
      const features = buildCustomerFeatures(orders);
      const result = classifyCustomer(features);
      setCustomerType(result.customerType);
      setIsRegular(result.customerType === "regularCustomer");
    });
  }, [user]);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = checkoutFormSchema.safeParse({ recipient, phone, address, deliveryTime, comment });
    if (!parsed.success) {
      const errs: Partial<Record<"recipient" | "phone" | "address", string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as "recipient" | "phone" | "address";
        if (!errs[field]) errs[field] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setStep("confirm");
  };

  const discount = isRegular ? REGULAR_CUSTOMER_DISCOUNT : 0;
  const discountedTotal = Math.round(total * (1 - discount));

  const handleConfirm = async () => {
    if (!user) return;
    setLoading(true);
    setSubmitError("");
    try {
      const orderRef = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        items: items.map((i) => ({
          productId: i.id,
          quantity: i.quantity,
          price: i.price,
          ...(i.isCustom ? { customName: i.name, flowers: i.flowers ?? [] } : {}),
        })),
        totalPrice: discountedTotal,
        status: "pending",
        recipient: recipient.trim(),
        phone: phone.trim(),
        deliveryAddress: address.trim(),
        deliveryTime: deliveryTime.trim() || null,
        comment: comment.trim() || null,
        createdAt: serverTimestamp(),
      });

      const ordersSnap = await getDocs(query(collection(db, "orders"), where("userId", "==", user.uid)));
      const allOrders = ordersSnap.docs.map((d) => ({
        totalPrice: (d.data().totalPrice as number) ?? 0,
        comment: d.data().comment as string | null,
      }));
      const updatedFeatures = buildCustomerFeatures([...allOrders, { totalPrice: discountedTotal, comment: comment.trim() || null }]);
      const updatedResult = classifyCustomer(updatedFeatures);
      await updateDoc(doc(db, "users", user.uid), { customerType: updatedResult.customerType });
      void orderRef;

      if (user.email) {
        fetch("/api/email/order-confirmed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: user.email,
            data: {
              orderId: orderRef.id,
              recipient: recipient.trim(),
              phone: phone.trim(),
              deliveryAddress: address.trim(),
              deliveryTime: deliveryTime.trim() || null,
              comment: comment.trim() || null,
              items: items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
              totalPrice: total,
            },
          }),
        }).catch(() => {});
      }

      clearCart();
      setStep("success");
    } catch {
      setSubmitError("Помилка при оформленні замовлення. Спробуйте ще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    closeCart();
    onClose();
  };

  return (
    <div className={styles.backdrop} onClick={step === "form" ? onClose : undefined}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {step !== "success" && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрити"
          >
            ✕
          </button>
        )}

        {step === "success" && (
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h2>Замовлення прийнято!</h2>
            <p>Кур'єр зв'яжеться з отримувачем для підтвердження доставки.</p>
            <button type="button" className={styles.doneBtn} onClick={handleDone}>
              Продовжити покупки
            </button>
          </div>
        )}

        {step === "confirm" && (
          <div className={styles.confirmState}>
            <div className={styles.paidBadge}>Сплачено</div>
            <h2 className={styles.title}>Підтвердження замовлення</h2>
            <ul className={styles.confirmList}>
              <li><span>Отримувач</span><strong>{recipient}</strong></li>
              <li><span>Телефон</span><strong>{phone}</strong></li>
              <li><span>Адреса</span><strong>{address}</strong></li>
              {deliveryTime && <li><span>Час доставки</span><strong>{deliveryTime}</strong></li>}
              {comment && <li><span>Коментар</span><strong>{comment}</strong></li>}
              {isRegular && (
                <li><span>Знижка (постійний клієнт)</span><strong style={{ color: "#1a7a4a" }}>−{Math.round(total * discount)} грн.</strong></li>
              )}
              <li className={styles.confirmTotal}><span>Сума замовлення</span><strong>{discountedTotal} грн.</strong></li>
            </ul>
            {submitError && <p className={styles.error}>{submitError}</p>}
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading ? "Обробка..." : "Підтвердити замовлення"}
            </button>
          </div>
        )}

        {step === "form" && (
          <>
            <h2 className={styles.title}>Оформлення замовлення</h2>

            <form onSubmit={handlePay} className={styles.form} noValidate>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label htmlFor="co-recipient">Отримувач *</label>
                  <input
                    id="co-recipient"
                    type="text"
                    placeholder="Ім'я та прізвище"
                    value={recipient}
                    onChange={(e) => { setRecipient(e.target.value); setFieldErrors((p) => ({ ...p, recipient: undefined })); }}
                    className={fieldErrors.recipient ? styles.inputError : ""}
                  />
                  {fieldErrors.recipient && <span className={styles.fieldError}>{fieldErrors.recipient}</span>}
                </div>
                <div className={styles.field}>
                  <label htmlFor="co-phone">Номер телефону *</label>
                  <input
                    id="co-phone"
                    type="tel"
                    placeholder="+380XXXXXXXXX"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setFieldErrors((p) => ({ ...p, phone: undefined })); }}
                    className={fieldErrors.phone ? styles.inputError : ""}
                  />
                  {fieldErrors.phone && <span className={styles.fieldError}>{fieldErrors.phone}</span>}
                </div>
              </div>
              <div className={styles.field}>
                <label htmlFor="co-address">Адреса доставки *</label>
                {savedAddresses.length > 0 && (
                  <div className={styles.savedAddresses}>
                    {savedAddresses.map((addr, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`${styles.savedAddressChip} ${
                          selectedSavedAddress === addr ? styles.savedAddressChipActive : ""
                        }`}
                        onClick={() => {
                          const next = selectedSavedAddress === addr ? null : addr;
                          setSelectedSavedAddress(next);
                          setAddress(next ?? "");
                          setFieldErrors((p) => ({ ...p, address: undefined }));
                        }}
                      >
                        {addr}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  id="co-address"
                  type="text"
                  placeholder="м. Київ, вул. Хрещатик, 1, кв. 5"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setSelectedSavedAddress(null);
                    setFieldErrors((p) => ({ ...p, address: undefined }));
                  }}
                  className={fieldErrors.address ? styles.inputError : ""}
                />
                {fieldErrors.address && <span className={styles.fieldError}>{fieldErrors.address}</span>}
              </div>

              <div className={styles.field}>
                <label htmlFor="co-time">Зручний час доставки</label>
                <input
                  id="co-time"
                  type="text"
                  placeholder="наприклад: 14:00 – 16:00"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="co-comment">Коментар до замовлення</label>
                <textarea
                  id="co-comment"
                  rows={3}
                  placeholder="Побажання щодо букету, упаковки тощо"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <div className={styles.payRow}>
                <div className={styles.payTotal}>
                  {isRegular && (
                    <span className={styles.discountBadge}>−10% знижка для постійних клієнтів</span>
                  )}
                  <span>До сплати</span>
                  {isRegular ? (
                    <strong>
                      <s style={{ fontWeight: 400, fontSize: 13, color: "var(--muted)", marginRight: 6 }}>{total} грн.</s>
                      {discountedTotal} грн.
                    </strong>
                  ) : (
                    <strong>{total} грн.</strong>
                  )}
                </div>
                <button type="submit" className={styles.submitBtn}>
                  Сплатити {discountedTotal} грн.
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
