import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { orderConfirmedTemplate, OrderEmailData } from "@/lib/emailTemplates"

export async function POST(req: NextRequest) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error("[email/order-confirmed] RESEND_API_KEY is not set")
    return NextResponse.json({ error: "Email service not configured" }, { status: 503 })
  }
  const resend = new Resend(apiKey)
  try {
    const body: { to: string; data: OrderEmailData } = await req.json()

    if (!body.to || !body.data) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const html = orderConfirmedTemplate(body.data)

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Flower Shop <onboarding@resend.dev>",
      to: body.to,
      subject: `Замовлення #${body.data.orderId.slice(-8).toUpperCase()} прийнято — Flower Shop`,
      html,
    })

    if (error) {
      console.error("[email/order-confirmed] Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[email/order-confirmed] Unexpected error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
