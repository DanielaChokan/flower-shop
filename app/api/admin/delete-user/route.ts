import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function DELETE(req: NextRequest) {
  const session = req.cookies.get("__session")?.value;
  const role = req.cookies.get("__role")?.value;

  if (!session || role !== "admin") {
    return NextResponse.json({ error: "Недостатньо прав" }, { status: 403 });
  }

  const { uid } = await req.json();
  if (!uid) {
    return NextResponse.json({ error: "uid обов'язковий" }, { status: 400 });
  }

  await adminAuth.deleteUser(uid);
  return NextResponse.json({ success: true });
}
