"use client";

import { useEffect, useState, useCallback, Fragment } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  orderBy,
  query,
  runTransaction,
  increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus, AppUser, Product } from "@/lib/api";
import { classifyCustomer, buildCustomerFeatures } from "@/lib/naiveBayes";
import styles from "./page.module.css";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Очікує",
  confirmed: "Підтверджено",
  delivered: "Доставлено",
  cancelled: "Скасовано",
};

const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: styles.badgePending,
  confirmed: styles.badgeConfirmed,
  delivered: styles.badgeDelivered,
  cancelled: styles.badgeCancelled,
};

const SENDABLE_STATUSES: OrderStatus[] = ["confirmed", "delivered", "cancelled"];

type OrderWithEmail = Order & { userEmail?: string };

function formatDate(ts: unknown): string {
  if (!ts) return "—";
  try {
    const d = (ts as { toDate: () => Date }).toDate?.() ?? new Date(ts as string);
    return d.toLocaleDateString("uk-UA", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return "—";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithEmail[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<Record<string, OrderStatus>>({});
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [snap, prodSnap] = await Promise.all([
        getDocs(query(collection(db, "orders"), orderBy("createdAt", "desc"))),
        getDocs(collection(db, "products")),
      ]);
      const names: Record<string, string> = {};
      prodSnap.docs.forEach((d) => { names[d.id] = (d.data() as Product).name; });
      setProductNames(names);
      const raw = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));

      const withEmails = await Promise.all(
        raw.map(async (order) => {
          try {
            const userSnap = await getDoc(doc(db, "users", order.userId));
            const userData = userSnap.data() as AppUser | undefined;
            return { ...order, userEmail: userData?.email };
          } catch {
            return { ...order };
          }
        })
      );

      setOrders(withEmails);
      const initStatus: Record<string, OrderStatus> = {};
      withEmails.forEach((o) => { initStatus[o.id] = o.status; });
      setSelectedStatus(initStatus);
      setLoading(false);
    };
    load();
  }, []);

  const handleUpdate = async (order: OrderWithEmail) => {
    const newStatus = selectedStatus[order.id];
    if (!newStatus || newStatus === order.status) return;
    setUpdating((p) => ({ ...p, [order.id]: true }));
    try {
      const shouldRestoreStock =
        newStatus === "cancelled" &&
        order.stockReserved === true &&
        order.status !== "cancelled";

      if (shouldRestoreStock) {
        const nonCustomItems = order.items.filter((i) => !i.customName);
        await runTransaction(db, async (transaction) => {
          nonCustomItems.forEach((i) => {
            transaction.update(doc(db, "products", i.productId), {
              stock: increment(i.quantity),
            });
          });
          transaction.update(doc(db, "orders", order.id), {
            status: newStatus,
            stockReserved: false,
          });
        });
      } else {
        await updateDoc(doc(db, "orders", order.id), { status: newStatus });
      }

      const updatedOrders = orders.map((o) =>
        o.id === order.id
          ? { ...o, status: newStatus, stockReserved: shouldRestoreStock ? false : o.stockReserved }
          : o
      );
      setOrders(updatedOrders);

      const userOrders = updatedOrders.filter(
        (o) => o.userId === order.userId && o.status !== "cancelled"
      );
      const features = buildCustomerFeatures(userOrders.map((o) => ({ totalPrice: o.totalPrice })));
      const { customerType } = classifyCustomer(features);
      await updateDoc(doc(db, "users", order.userId), { customerType });

      if (order.userEmail && SENDABLE_STATUSES.includes(newStatus)) {
        await fetch("/api/email/order-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: order.userEmail,
            data: {
              orderId: order.id,
              recipient: order.recipient ?? "Клієнт",
              status: newStatus,
              deliveryAddress: order.deliveryAddress,
              deliveryTime: order.deliveryTime,
            },
          }),
        });
        showToast(`Статус оновлено. Email надіслано на ${order.userEmail}`);
      } else {
        showToast("Статус оновлено");
      }
    } catch {
      showToast("Помилка оновлення статусу");
    } finally {
      setUpdating((p) => ({ ...p, [order.id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "orders", id));
      setOrders((prev) => prev.filter((o) => o.id !== id));
      showToast("Замовлення видалено");
    } catch {
      showToast("Помилка видалення");
    } finally {
      setConfirmDelete(null);
    }
  };

  const filtered = orders
    .filter((o) => filter === "all" || o.status === filter)
    .filter((o) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        (o.recipient ?? "").toLowerCase().includes(q) ||
        (o.userEmail ?? "").toLowerCase().includes(q)
      );
    });

  if (loading) {
    return <div className={styles.emptyState}>Завантаження замовлень...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>Список замовлень</h1>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.searchIcon}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            placeholder="Пошук за ID, клієнтом або email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value as OrderStatus | "all")}
        >
          <option value="all">Всі</option>
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.emptyState}>Немає замовлень за цим фільтром</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "30%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "25%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Клієнт</th>
                <th>Дата</th>
                <th>Сума</th>
                <th>Статус</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <Fragment key={order.id}>
                  <tr>
                    <td>
                      <span className={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td>
                      <div className={styles.clientName}>{order.recipient ?? "—"}</div>
                      <div className={styles.clientSub}>{order.userEmail ?? order.phone ?? "—"}</div>
                    </td>
                    <td className={styles.dateCell}>{formatDate(order.createdAt)}</td>
                    <td className={styles.priceCell}>{order.totalPrice} грн</td>
                    <td>
                      <span className={`${styles.badge} ${STATUS_BADGE[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <div className={styles.statusChangeWrap}>
                          <select
                            className={styles.statusSelect}
                            value={selectedStatus[order.id] ?? order.status}
                            onChange={(e) =>
                              setSelectedStatus((p) => ({ ...p, [order.id]: e.target.value as OrderStatus }))
                            }
                            title="Змінити статус"
                          >
                            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                          <button
                            className={styles.iconBtn}
                            title="Зберегти статус"
                            disabled={updating[order.id] || selectedStatus[order.id] === order.status}
                            onClick={() => handleUpdate(order)}
                          >
                            {updating[order.id] ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </button>
                        </div>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                          title="Видалити"
                          onClick={() => setConfirmDelete(order.id)}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                        <button
                          className={`${styles.iconBtn} ${styles.iconBtnView}`}
                          title={expanded[order.id] ? "Приховати товари" : "Переглянути товари"}
                          onClick={() => setExpanded((p) => ({ ...p, [order.id]: !p[order.id] }))}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded[order.id] && (
                    <tr key={`${order.id}-detail`} className={styles.detailRow}>
                      <td colSpan={6}>
                        <div className={styles.detailBox}>
                          <div className={styles.detailGrid}>
                            <div>
                              <strong>Адреса:</strong> {order.deliveryAddress ?? "—"}
                            </div>
                            <div>
                              <strong>Час доставки:</strong> {order.deliveryTime ?? "—"}
                            </div>
                            <div>
                              <strong>Телефон:</strong> {order.phone ?? "—"}
                            </div>
                            {order.comment && (
                              <div>
                                <strong>Коментар:</strong> {order.comment}
                              </div>
                            )}
                          </div>
                          <table className={styles.itemsTable}>
                            <thead>
                              <tr>
                                <th>Товар</th>
                                <th>Ціна</th>
                                <th>Кількість</th>
                                <th>Сума</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item, i) => (
                                <Fragment key={i}>
                                  <tr>
                                    <td>
                                      {item.customName ? (
                                        <span>
                                          🤖 {item.customName}
                                        </span>
                                      ) : (
                                        productNames[item.productId] ?? item.productId
                                      )}
                                    </td>
                                    <td>{item.price} грн</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.price * item.quantity} грн</td>
                                  </tr>
                                  {item.customName && item.flowers && item.flowers.length > 0 && (
                                    <tr className={styles.bouquetCompositionRow}>
                                      <td colSpan={4}>
                                        <div className={styles.bouquetComposition}>
                                          <span className={styles.bouquetCompositionLabel}>Склад букету</span>
                                          <table className={styles.bouquetTable}>
                                            <colgroup>
                                              <col style={{ width: "55%" }} />
                                              <col style={{ width: "15%" }} />
                                              <col style={{ width: "15%" }} />
                                              <col style={{ width: "15%" }} />
                                            </colgroup>
                                            <thead>
                                              <tr>
                                                <th>Квітка</th>
                                                <th>Ціна/шт</th>
                                                <th>Кількість</th>
                                                <th>Сума</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {item.flowers.map((f, fi) => (
                                                <tr key={fi}>
                                                  <td>{f.name}</td>
                                                  <td>{f.price} грн</td>
                                                  <td>{f.quantity} шт</td>
                                                  <td>{f.price * f.quantity} грн</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.orderCards}>
        {filtered.map((order) => (
          <div key={order.id} className={styles.orderCard}>
            <div className={styles.orderCardTop}>
              <div className={styles.orderCardInfo}>
                <span className={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</span>
                <div className={styles.clientName}>{order.recipient ?? "—"}</div>
                <div className={styles.clientSub}>{order.userEmail ?? order.phone ?? "—"}</div>
              </div>
              <span className={`${styles.badge} ${STATUS_BADGE[order.status]}`}>
                {STATUS_LABELS[order.status]}
              </span>
            </div>
            <div className={styles.orderCardMeta}>
              <span>{formatDate(order.createdAt)}</span>
              <span className={styles.priceCell}>{order.totalPrice} грн</span>
            </div>
            <div className={styles.orderCardActions}>
              <div className={styles.orderCardStatusRow}>
                <select
                  className={styles.statusSelect}
                  value={selectedStatus[order.id] ?? order.status}
                  onChange={(e) =>
                    setSelectedStatus((p) => ({ ...p, [order.id]: e.target.value as OrderStatus }))
                  }
                >
                  {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
                <button
                  className={styles.iconBtn}
                  title="Зберегти статус"
                  disabled={updating[order.id] || selectedStatus[order.id] === order.status}
                  onClick={() => handleUpdate(order)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
              <div className={styles.orderCardBtns}>
                <button
                  className={`${styles.iconBtn} ${styles.iconBtnView}`}
                  title={expanded[order.id] ? "Приховати" : "Деталі"}
                  onClick={() => setExpanded((p) => ({ ...p, [order.id]: !p[order.id] }))}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                </button>
                <button
                  className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                  title="Видалити"
                  onClick={() => setConfirmDelete(order.id)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>
            {expanded[order.id] && (
              <div className={styles.orderCardDetail}>
                <div className={styles.detailGrid}>
                  <div><strong>Адреса:</strong> {order.deliveryAddress ?? "—"}</div>
                  <div><strong>Час доставки:</strong> {order.deliveryTime ?? "—"}</div>
                  <div><strong>Телефон:</strong> {order.phone ?? "—"}</div>
                  {order.comment && <div><strong>Коментар:</strong> {order.comment}</div>}
                </div>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Товар</th>
                      <th>Ціна</th>
                      <th>К-сть</th>
                      <th>Сума</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, i) => (
                      <tr key={i}>
                        <td>{item.customName ? `🤖 ${item.customName}` : (productNames[item.productId] ?? item.productId)}</td>
                        <td>{item.price} грн</td>
                        <td>{item.quantity}</td>
                        <td>{item.price * item.quantity} грн</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Видалити замовлення?</h3>
            <p>Цю дію не можна відмінити.</p>
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={() => setConfirmDelete(null)}>Скасувати</button>
              <button className={styles.btnDanger} onClick={() => handleDelete(confirmDelete)}>Видалити</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
