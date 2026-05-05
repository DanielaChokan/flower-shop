import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { orderStatusTemplate, StatusEmailData } from "@/lib/emailTemplates"

const STATUS_SUBJECTS: Record<string, string> = {
  confirmed: "Ваше замовлення підтверджено — Flower Shop",
  delivered: "Ваше замовлення доставлено — Flower Shop",
  cancelled: "Ваше замовлення скасовано — Flower Shop",
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[email/order-status] RESEND_API_KEY is not set")
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 })
  }
  const resend = new Resend(apiKey)
  try {
    const body: { to: string; data: StatusEmailData } = await req.json()

    if (!body.to || !body.data) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const html = orderStatusTemplate(body.data)
    const subject = STATUS_SUBJECTS[body.data.status] ?? "Оновлення статусу замовлення — Flower Shop"

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Flower Shop <onboarding@resend.dev>",
      to: body.to,
      subject,
      html,
    })

    if (error) {
      console.error("[email/order-status] Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[email/order-status] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
