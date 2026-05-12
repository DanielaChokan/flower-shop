export type OrderEmailData = {
  orderId: string
  recipient: string
  phone: string
  deliveryAddress: string
  deliveryDate?: string | null
  deliveryTime?: string | null
  comment?: string | null
  items: { name: string; quantity: number; price: number }[]
  totalPrice: number
}

export type StatusEmailData = {
  orderId: string
  recipient: string
  status: "confirmed" | "delivered" | "cancelled"
  deliveryAddress?: string
  deliveryTime?: string | null
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Підтверджено",
  delivered: "Доставлено",
  cancelled: "Скасовано",
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "#4caf50",
  delivered: "#2196f3",
  cancelled: "#f44336",
}

const SVG = {
  flower: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="3" fill="#c8a97e"/><ellipse cx="12" cy="6" rx="2.5" ry="4" fill="#e8b4b8"/><ellipse cx="12" cy="18" rx="2.5" ry="4" fill="#e8b4b8"/><ellipse cx="6" cy="12" rx="4" ry="2.5" fill="#f0c4c8"/><ellipse cx="18" cy="12" rx="4" ry="2.5" fill="#f0c4c8"/><ellipse cx="7.76" cy="7.76" rx="2.5" ry="4" transform="rotate(45 7.76 7.76)" fill="#e8b4b8"/><ellipse cx="16.24" cy="16.24" rx="2.5" ry="4" transform="rotate(45 16.24 16.24)" fill="#e8b4b8"/><ellipse cx="16.24" cy="7.76" rx="2.5" ry="4" transform="rotate(-45 16.24 7.76)" fill="#f0c4c8"/><ellipse cx="7.76" cy="16.24" rx="2.5" ry="4" transform="rotate(-45 7.76 16.24)" fill="#f0c4c8"/></svg>`,
  check: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#4caf50"/><path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  delivery: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="7" width="15" height="10" rx="1.5" fill="#2196f3"/><path d="M16 10h4l3 4v3h-7V10z" fill="#1565c0"/><circle cx="5.5" cy="18.5" r="1.5" fill="#fff"/><circle cx="18.5" cy="18.5" r="1.5" fill="#fff"/></svg>`,
  cancel: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#f44336"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  pin: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#b0a090"/></svg>`,
  phone: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.01l-2.2 2.21z" fill="#b0a090"/></svg>`,
  clock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="#b0a090" stroke-width="2"/><path d="M12 7v5l3 3" stroke="#b0a090" stroke-width="2" stroke-linecap="round"/></svg>`,
  comment: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="#b0a090"/></svg>`,
}

const STATUS_ICONS: Record<string, string> = {
  confirmed: SVG.check,
  delivered: SVG.delivery,
  cancelled: SVG.cancel,
}

const baseStyle = `
  font-family: 'Segoe UI', Arial, sans-serif;
  background: #f9f6f0;
  padding: 0;
  margin: 0;
`

function wrapper(content: string) {
  return `
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="${baseStyle}">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f6f0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.07); max-width:600px; width:100%;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #c8a97e 0%, #e8c9a0 100%); padding: 32px 40px; text-align:center;">
              <div style="margin-bottom:8px;">${SVG.flower}</div>
              <h1 style="margin:0; color:#fff; font-size:24px; font-weight:700; letter-spacing:0.5px;">Flower Shop</h1>
              <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;">Квіти з душею</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 36px 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9f6f0; padding: 20px 40px; text-align:center; border-top:1px solid #e8e0d5;">
              <p style="margin:0; color:#b0a090; font-size:12px;">© ${new Date().getFullYear()} Flower Shop. Всі права захищені.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

export function orderConfirmedTemplate(data: OrderEmailData): string {
  const itemsRows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0ebe3; color:#444; font-size:14px;">${item.name}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0ebe3; color:#888; font-size:14px; text-align:center;">${item.quantity} шт.</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0ebe3; color:#c8a97e; font-size:14px; text-align:right; font-weight:600;">${item.price * item.quantity} грн.</td>
      </tr>`
    )
    .join("")

  const content = `
    <h2 style="margin: 0 0 8px; color:#3d2c1e; font-size:22px;">Замовлення прийнято!</h2>
    <p style="margin: 0 0 24px; color:#888; font-size:14px;">Дякуємо за замовлення, <strong style="color:#3d2c1e;">${data.recipient}</strong>!</p>

    <div style="background:#f9f6f0; border-radius:8px; padding:20px 24px; margin-bottom:24px;">
      <p style="margin:0 0 8px; color:#b0a090; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Номер замовлення</p>
      <p style="margin:0; color:#c8a97e; font-size:18px; font-weight:700; font-family: monospace;">#${data.orderId.slice(-8).toUpperCase()}</p>
    </div>

    <h3 style="margin: 0 0 12px; color:#3d2c1e; font-size:15px; font-weight:600;">Склад замовлення</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${itemsRows}
      <tr>
        <td colspan="2" style="padding-top:14px; color:#3d2c1e; font-size:15px; font-weight:600;">Разом</td>
        <td style="padding-top:14px; color:#c8a97e; font-size:18px; font-weight:700; text-align:right;">${data.totalPrice} грн.</td>
      </tr>
    </table>

    <h3 style="margin: 0 0 12px; color:#3d2c1e; font-size:15px; font-weight:600;">Деталі доставки</h3>
    <table cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:24px;">
      <tr>
        <td style="padding:6px 0; color:#888; font-size:13px; width:140px;">${SVG.pin} Адреса</td>
        <td style="padding:6px 0; color:#3d2c1e; font-size:13px; font-weight:500;">${data.deliveryAddress}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; color:#888; font-size:13px;">${SVG.phone} Телефон</td>
        <td style="padding:6px 0; color:#3d2c1e; font-size:13px; font-weight:500;">${data.phone}</td>
      </tr>
      ${data.deliveryDate ? `
      <tr>
        <td style="padding:6px 0; color:#888; font-size:13px;">${SVG.clock} Дата доставки</td>
        <td style="padding:6px 0; color:#3d2c1e; font-size:13px; font-weight:500;">${data.deliveryDate}</td>
      </tr>` : ""}
      ${data.deliveryTime ? `
      <tr>
        <td style="padding:6px 0; color:#888; font-size:13px;">${SVG.clock} Час доставки</td>
        <td style="padding:6px 0; color:#3d2c1e; font-size:13px; font-weight:500;">${data.deliveryTime}</td>
      </tr>` : ""}
      ${data.comment ? `
      <tr>
        <td style="padding:6px 0; color:#888; font-size:13px;">${SVG.comment} Коментар</td>
        <td style="padding:6px 0; color:#3d2c1e; font-size:13px; font-weight:500;">${data.comment}</td>
      </tr>` : ""}
    </table>

    <div style="background: linear-gradient(135deg, #fff8f0 0%, #fdf3e7 100%); border-left: 4px solid #c8a97e; border-radius:0 8px 8px 0; padding:16px 20px;">
      <p style="margin:0; color:#7a5c3a; font-size:13px; line-height:1.6;">
        Ми вже обробляємо ваше замовлення. Кур'єр зв'яжеться з отримувачем для підтвердження часу доставки.
      </p>
    </div>
  `

  return wrapper(content)
}

export function orderStatusTemplate(data: StatusEmailData): string {
  const label = STATUS_LABELS[data.status] ?? data.status
  const color = STATUS_COLORS[data.status] ?? "#888"
  const infoIcon = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="11" fill="#888"/><rect x="11" y="10" width="2" height="7" rx="1" fill="#fff"/><circle cx="12" cy="7.5" r="1.2" fill="#fff"/></svg>`
  const icon = STATUS_ICONS[data.status] ?? infoIcon

  const statusMessages: Record<string, string> = {
    confirmed: "Ваше замовлення підтверджено нашим менеджером! Кур'єр доставить квіти в узгоджений час.",
    delivered: "Ваше замовлення успішно доставлено! Сподіваємось, що квіти принесли радість.",
    cancelled: "На жаль, ваше замовлення було скасовано. Зв'яжіться з нами, якщо у вас є питання.",
  }

  const content = `
    <div style="text-align:center; margin-bottom:28px;">
      <div style="margin-bottom:12px;">${icon}</div>
      <h2 style="margin: 0 0 8px; color:#3d2c1e; font-size:22px;">Статус замовлення змінено</h2>
      <p style="margin: 0; color:#888; font-size:14px;">Замовлення <strong style="color:#c8a97e; font-family:monospace;">#${data.orderId.slice(-8).toUpperCase()}</strong></p>
    </div>

    <div style="text-align:center; margin-bottom:28px;">
      <span style="display:inline-block; background:${color}; color:#fff; font-size:16px; font-weight:700; padding:10px 28px; border-radius:24px; letter-spacing:0.5px;">
        ${label}
      </span>
    </div>

    <div style="background:#f9f6f0; border-radius:8px; padding:20px 24px; margin-bottom:24px;">
      <p style="margin:0 0 4px; color:#b0a090; font-size:12px; text-transform:uppercase; letter-spacing:0.5px;">Отримувач</p>
      <p style="margin:0; color:#3d2c1e; font-size:15px; font-weight:600;">${data.recipient}</p>
    </div>

    ${data.deliveryAddress ? `
    <table cellpadding="0" cellspacing="0" style="width:100%; margin-bottom:24px;">
      <tr>
        <td style="padding:6px 0; color:#888; font-size:13px; width:140px;">${SVG.pin} Адреса</td>
        <td style="padding:6px 0; color:#3d2c1e; font-size:13px; font-weight:500;">${data.deliveryAddress}</td>
      </tr>
      ${data.deliveryTime ? `
      <tr>
        <td style="padding:6px 0; color:#888; font-size:13px;">${SVG.clock} Час доставки</td>
        <td style="padding:6px 0; color:#3d2c1e; font-size:13px; font-weight:500;">${data.deliveryTime}</td>
      </tr>` : ""}
    </table>` : ""}

    <div style="background: linear-gradient(135deg, #fff8f0 0%, #fdf3e7 100%); border-left: 4px solid #c8a97e; border-radius:0 8px 8px 0; padding:16px 20px;">
      <p style="margin:0; color:#7a5c3a; font-size:13px; line-height:1.6;">
        ${statusMessages[data.status] ?? ""}
      </p>
    </div>
  `

  return wrapper(content)
}
