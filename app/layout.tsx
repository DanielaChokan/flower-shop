import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider } from "@/modules/cart/CartContext";
import { ThemeProvider } from "@/modules/theme/ThemeContext";
import { AuthProvider } from "@/modules/auth/AuthContext";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthModalHost from "@/modules/auth/components/AuthModalHost";
import LoadingGuard from "@/components/UI/LoadingGuard";
import AuthRequiredListener from "@/components/UI/AuthRequiredListener";

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
                <ThemeProvider>
                <AuthProvider>
                    <CartProvider>
                        <LoadingGuard>
                            {children}
                        </LoadingGuard>
                        <CartDrawer />
                        <AuthModalHost />
                        <Suspense>
                            <AuthRequiredListener />
                        </Suspense>
                    </CartProvider>
                </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
