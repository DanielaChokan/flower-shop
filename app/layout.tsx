import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/modules/cart/CartContext";
import { AuthProvider } from "@/modules/auth/AuthContext";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthModal from "@/components/UI/AuthModal";
import AuthGuard from "@/components/UI/AuthGuard";

const inter = Inter({
    variable: "--font-body",
    subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
    title: "FloraSwift",
    description: "Квіти з доставкою 24/7",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="uk" className={inter.variable}>
            <body>
                <AuthProvider>
                    <CartProvider>
                        <AuthGuard>
                            {children}
                        </AuthGuard>
                        <CartDrawer />
                        <AuthModal />
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
