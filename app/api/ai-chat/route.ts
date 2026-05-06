import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

async function fetchProducts() {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID not set");

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/products?pageSize=100${apiKey ? `&key=${apiKey}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Firestore REST error ${res.status}: ${text}`);
    }
    const data = await res.json();
    if (!data.documents) return [];

    return data.documents.map((doc: { name: string; fields: Record<string, { stringValue?: string; integerValue?: string; doubleValue?: number }> }) => {
        const id = doc.name.split("/").pop() as string;
        const f = doc.fields ?? {};
        const name = f.name?.stringValue ?? "";
        const price = f.price?.integerValue
            ? parseInt(f.price.integerValue)
            : (f.price?.doubleValue ?? 0);
        const image = f.image?.stringValue ?? "";
        const rating = f.rating?.doubleValue ?? (f.rating?.integerValue ? parseFloat(f.rating.integerValue) : 0);
        const categoryId = f.categoryId?.stringValue ?? "";
        return { id, name, price, image, rating, categoryId };
    });
}

async function generateBouquetImage(description: string): Promise<string | null> {
    const imagePrompt = `Realistic professional floral photography, studio soft lighting, clean white background, sharp focus, 8k resolution. EXACT composition: ${description}. Do not add extra flowers or change colors.`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=800&height=800&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        return `data:image/jpeg;base64,${buf.toString("base64")}`;
    } catch {
        return null;
    }
}

export async function POST(req: NextRequest) {
    const session = req.cookies.get("__session")?.value;
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
    }

    try {
        const body: { preferences: Record<string, string> } = await req.json();
        const { preferences } = body;

        console.log("[ai-chat] Step 1: fetching products...");
        let products: { id: string; name: string; price: number; image: string; rating: number; categoryId: string }[];
        try {
            products = await fetchProducts();
        } catch (e) {
            console.error("[ai-chat] fetchProducts failed:", e);
            return NextResponse.json({ error: `fetchProducts: ${String(e)}` }, { status: 500 });
        }
        console.log("[ai-chat] Step 1 done, products count:", products.length);

        if (products.length === 0) {
            return NextResponse.json({ error: "No products in database" }, { status: 500 });
        }

        const flowers = products
            .filter((p) => p.categoryId !== "bouquets")
            .map(({ id, name, price }) => ({ id, name, price }));

        const textPrompt = `
Ти — досвідчений флорист. Створи 2 різних варіанти букету.
Привід: ${preferences.occasion ?? "Не вказано"}.
Кому: ${preferences.recipient ?? "Не вказано"}.
Кольори: ${preferences.colors ?? "Будь-які"}.
Бюджет: до ${preferences.budget ?? "1500"} грн.
Додатково: ${preferences.extra ?? "Немає"}.

Використовуй ТІЛЬКИ квіти з цього списку (id — це рядок Firestore document id):
${JSON.stringify(flowers)}

ВАЖЛИВО:
- Кольори "${preferences.colors ?? "будь-які"}" — це СУВОРА вимога. Вибирай ЛИШЕ квіти, які відповідають цьому кольору. НЕ додавай квіти інших кольорів.
- Точно вказуй кількість кожної квітки у полі quantity (реалістичні числа: 3-15 штук).
- У полі imagePrompt ТОЧНО описуй: кількість кожної квітки (наприклад "7 red roses, 5 white tulips"), ЛИШЕ колір "${preferences.colors ?? "any"}", стиль аранжування. Пиши ТІЛЬКИ англійською. НЕ додавай квіти або кольори, яких немає у вимогах.
- totalPrice = сума (price × quantity) по всіх квітках, не перевищуй бюджет.

Відповідь надай суворо у форматі JSON-масиву без маркдауну:
[{"title": "Назва букету", "description": "Короткий опис для картки (1-2 речення)", "imagePrompt": "Детальний опис для генерації зображення англійською (квіти, кольори, форма)", "flowers": [{"id": "firestore_id", "quantity": 3}], "totalPrice": 450}]
`;

        console.log("[ai-chat] Step 2: calling Gemini...");
        const textUrl = `${BASE_URL}/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const geminiRes = await fetch(textUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: textPrompt }] }],
            }),
        });

        const geminiData = await geminiRes.json();
        if (!geminiRes.ok) {
            console.error("[ai-chat] Gemini error:", JSON.stringify(geminiData));
            return NextResponse.json({ error: `Gemini API error: ${JSON.stringify(geminiData)}` }, { status: 500 });
        }
        console.log("[ai-chat] Step 2 done. Parsing JSON...");

        const candidate = geminiData.candidates?.[0];
        if (!candidate?.content?.parts) {
            console.error("[ai-chat] Unexpected Gemini response:", JSON.stringify(geminiData));
            return NextResponse.json({ error: `Gemini bad response: ${JSON.stringify(geminiData)}` }, { status: 500 });
        }
        const rawText: string = candidate.content.parts
            .map((p: { text?: string }) => p.text ?? "")
            .join("");
        const cleanJson = rawText.replace(/```json\n?|```/g, "").trim();
        console.log("[ai-chat] Raw Gemini text:", cleanJson.substring(0, 300));
        const bouquets: Array<{
            title: string;
            description: string;
            imagePrompt: string;
            flowers: Array<{ id: string; quantity: number }>;
            totalPrice: number;
        }> = JSON.parse(cleanJson);

        const results = [];
        for (const b of bouquets) {
            const imageData = await generateBouquetImage(b.imagePrompt ?? b.description);
            const flowerDetails = b.flowers.map((f) => {
                const product = products.find((p) => p.id === f.id);
                return {
                    ...f,
                    name: product?.name ?? "Невідома квітка",
                    price: product?.price ?? 0,
                    image: product?.image ?? "",
                    rating: product?.rating ?? 0,
                };
            });
            results.push({
                title: b.title,
                description: b.description,
                flowers: flowerDetails,
                totalPrice: b.totalPrice,
                image: imageData,
            });
        }

        return NextResponse.json({ bouquets: results });
    } catch (err) {
        console.error("[ai-chat] Unexpected error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
