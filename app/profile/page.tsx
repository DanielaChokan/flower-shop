"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/modules/auth/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { AppUser, Order, OrderItem } from "@/lib/api";
import styles from "./page.module.css";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: "В обробці",  color: "#E8A020" },
  confirmed: { label: "Підтверджено", color: "#4A90D9" },
  delivered: { label: "Доставлено", color: "#27AE60" },
  cancelled: { label: "Скасовано",  color: "#E74C3C" },
};

function formatDate(raw: unknown): string {
  if (!raw) return "—";
  const ts = raw as { toDate?: () => Date };
  const date = ts.toDate ? ts.toDate() : new Date(raw as string);
  return date.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<AppUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [addresses, setAddresses] = useState<string[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderProductNames, setOrderProductNames] = useState<Record<string, string>>({});
  const [orderNamesLoading, setOrderNamesLoading] = useState(false);

  useEffect(() => {
    if (authLoading || !user) return;

    const load = async () => {
      setDataLoading(true);
      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));
        if (userSnap.exists()) {
          const data = userSnap.data() as AppUser;
          setProfile(data);
          setFirstName(data.firstName ?? "");
          setLastName(data.lastName ?? "");
          setPhone(data.phone ?? "");
          setAddresses(data.addresses ?? []);
        }

        const q = query(
          collection(db, "orders"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })));
      } finally {
        setDataLoading(false);
      }
    };

    load();
  }, [user, authLoading]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: phone.trim(),
      });
      setProfile((prev) =>
        prev
          ? { ...prev, firstName: firstName.trim(), lastName: lastName.trim(), phone: phone.trim() }
          : prev
      );
      setSaveSuccess(true);
      setEditing(false);
    } catch {
      setSaveError("Помилка збереження. Спробуйте ще раз.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(profile?.firstName ?? "");
    setLastName(profile?.lastName ?? "");
    setPhone(profile?.phone ?? "");
    setSaveError("");
    setEditing(false);
  };

  const handleAddAddress = async () => {
    if (!user) return;
    const trimmed = newAddress.trim();
    if (!trimmed) return;
    setAddressSaving(true);
    setAddressError("");
    try {
      const updated = [...addresses, trimmed];
      await updateDoc(doc(db, "users", user.uid), { addresses: updated });
      setAddresses(updated);
      setProfile((prev) => (prev ? { ...prev, addresses: updated } : prev));
      setNewAddress("");
      setAddingAddress(false);
    } catch {
      setAddressError("Помилка збереження. Спробуйте ще раз.");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleRemoveAddress = async (idx: number) => {
    if (!user) return;
    const updated = addresses.filter((_, i) => i !== idx);
    try {
      await updateDoc(doc(db, "users", user.uid), { addresses: updated });
      setAddresses(updated);
      setProfile((prev) => (prev ? { ...prev, addresses: updated } : prev));
    } catch {
    }
  };

  const handleOpenOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    const missingIds = order.items
      .map((it: OrderItem) => it.productId)
      .filter((id: string) => !orderProductNames[id]);
    if (missingIds.length === 0) return;
    setOrderNamesLoading(true);
    try {
      const results = await Promise.all(
        missingIds.map((id: string) =>
          getDoc(doc(db, "products", id)).then((snap) => ({
            id,
            name: snap.exists() ? (snap.data().name as string) : id,
          }))
        )
      );
      setOrderProductNames((prev) => {
        const next = { ...prev };
        for (const r of results) next[r.id] = r.name;
        return next;
      });
    } finally {
      setOrderNamesLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (authLoading || dataLoading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <p className={styles.loading}>Завантаження...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.headingRow}>
          <h1 className={styles.heading}>Мій профіль</h1>
          <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Вийти з акаунту
          </button>
        </div>

        <div className={styles.grid}>
          <div className={styles.column}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Персональна інформація</h2>

              <div className={styles.field}>
                <label className={styles.label}>Прізвище</label>
                {editing ? (
                  <input
                    className={styles.input}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Введіть прізвище"
                  />
                ) : (
                  <div className={styles.inputDisplay}>{profile?.lastName || "—"}</div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Ім&apos;я</label>
                {editing ? (
                  <input
                    className={styles.input}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Введіть ім'я"
                  />
                ) : (
                  <div className={styles.inputDisplay}>{profile?.firstName || "—"}</div>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Електронна пошта</label>
                <div className={styles.inputDisplay}>{user?.email || "—"}</div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Мобільний телефон</label>
                {editing ? (
                  <input
                    className={styles.input}
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+380XXXXXXXXX"
                  />
                ) : (
                  <div className={styles.inputDisplay}>{profile?.phone || "—"}</div>
                )}
              </div>

              {saveError && <p className={styles.errorMsg}>{saveError}</p>}
              {saveSuccess && <p className={styles.successMsg}>Зміни збережено!</p>}

              {editing ? (
                <div className={styles.editActions}>
                  <button
                    type="button"
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Збереження..." : "Зберегти"}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Скасувати
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => { setEditing(true); setSaveSuccess(false); }}
                >
                  Редагувати
                </button>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Адреси доставки</h2>

              {addresses.length === 0 && !addingAddress && (
                <p className={styles.empty}>Немає збережених адрес</p>
              )}

              {addresses.length > 0 && (
                <ul className={styles.addressList}>
                  {addresses.map((addr, idx) => (
                    <li key={idx} className={styles.addressListItem}>
                      <span className={styles.addressListText}>{addr}</span>
                      <button
                        type="button"
                        className={styles.removeAddressBtn}
                        onClick={() => handleRemoveAddress(idx)}
                        aria-label="Видалити адресу"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {addingAddress ? (
                <>
                  <div className={styles.field}>
                    <input
                      className={styles.input}
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="вул. Назва, буд., кв., місто, індекс"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleAddAddress()}
                    />
                  </div>
                  {addressError && <p className={styles.errorMsg}>{addressError}</p>}
                  <div className={styles.editActions}>
                    <button
                      type="button"
                      className={styles.saveBtn}
                      onClick={handleAddAddress}
                      disabled={addressSaving || !newAddress.trim()}
                    >
                      {addressSaving ? "Збереження..." : "Зберегти"}
                    </button>
                    <button
                      type="button"
                      className={styles.cancelBtn}
                      onClick={() => { setAddingAddress(false); setNewAddress(""); setAddressError(""); }}
                      disabled={addressSaving}
                    >
                      Скасувати
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.addressActions}>
                  <button
                    type="button"
                    className={styles.outlineBtn}
                    onClick={() => setAddingAddress(true)}
                  >
                    Додати адресу
                  </button>
                </div>
              )}
            </section>
          </div>

          <div className={styles.column}>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Історія замовлень</h2>
              {orders.length === 0 ? (
                <p className={styles.empty}>У вас ще немає замовлень.</p>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>№ замовлення</th>
                        <th>Дата</th>
                        <th>Сума</th>
                        <th>Статус</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const status = STATUS_LABEL[order.status] ?? { label: order.status, color: "#888" };
                        return (
                          <tr key={order.id}>
                            <td className={styles.orderId}>{order.id.slice(0, 8).toUpperCase()}</td>
                            <td>{formatDate(order.createdAt)}</td>
                            <td>{order.totalPrice} грн</td>
                            <td>
                              <span
                                className={styles.statusBadge}
                                style={{ color: status.color }}
                              >
                                <span
                                  className={styles.statusDot}
                                  style={{ background: status.color }}
                                />
                                {status.label}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className={styles.detailsBtn}
                                onClick={() => handleOpenOrderDetails(order)}
                              >
                                Деталі
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />

      {selectedOrder && (
        <div className={styles.modalBackdrop} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Замовлення #{selectedOrder.id.slice(0, 8).toUpperCase()}
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setSelectedOrder(null)}
                aria-label="Закрити"
              >
                ✕
              </button>
            </div>

            <div className={styles.modalMeta}>
              <div className={styles.modalMetaRow}>
                <span className={styles.modalMetaLabel}>Дата</span>
                <span>{formatDate(selectedOrder.createdAt)}</span>
              </div>
              <div className={styles.modalMetaRow}>
                <span className={styles.modalMetaLabel}>Статус</span>
                <span
                  className={styles.statusBadge}
                  style={{ color: (STATUS_LABEL[selectedOrder.status] ?? { color: "#888" }).color }}
                >
                  <span
                    className={styles.statusDot}
                    style={{ background: (STATUS_LABEL[selectedOrder.status] ?? { color: "#888" }).color }}
                  />
                  {(STATUS_LABEL[selectedOrder.status] ?? { label: selectedOrder.status }).label}
                </span>
              </div>
              {selectedOrder.recipient && (
                <div className={styles.modalMetaRow}>
                  <span className={styles.modalMetaLabel}>Отримувач</span>
                  <span>{selectedOrder.recipient}</span>
                </div>
              )}
              {selectedOrder.deliveryAddress && (
                <div className={styles.modalMetaRow}>
                  <span className={styles.modalMetaLabel}>Адреса</span>
                  <span>{selectedOrder.deliveryAddress}</span>
                </div>
              )}
              {selectedOrder.deliveryTime && (
                <div className={styles.modalMetaRow}>
                  <span className={styles.modalMetaLabel}>Час доставки</span>
                  <span>{selectedOrder.deliveryTime}</span>
                </div>
              )}
            </div>

            <h4 className={styles.modalSectionTitle}>Склад замовлення</h4>
            <ul className={styles.orderItems}>
              {selectedOrder.items.map((item, i) => (
                <li key={i} className={styles.orderItem}>
                  <span className={styles.orderItemName}>
                    {orderNamesLoading && !orderProductNames[item.productId]
                      ? "..."
                      : (orderProductNames[item.productId] ?? item.productId)}
                  </span>
                  <span className={styles.orderItemQty}>× {item.quantity}</span>
                  <span className={styles.orderItemPrice}>{item.price * item.quantity} грн</span>
                </li>
              ))}
            </ul>

            <div className={styles.modalTotal}>
              <span>Загальна сума</span>
              <strong>{selectedOrder.totalPrice} грн</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
