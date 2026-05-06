import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { CartProvider } from "@/modules/cart/CartContext";
import { FavouritesProvider } from "@/modules/favourites/FavouritesContext";
import { ThemeProvider } from "@/modules/theme/ThemeContext";
import { AuthProvider } from "@/modules/auth/AuthContext";
import CartDrawer from "@/components/cart/CartDrawer";
import AuthModalHost from "@/modules/auth/components/AuthModalHost";
import LoadingGuard from "@/components/UI/LoadingGuard";
import AuthRequiredListener from "@/components/UI/AuthRequiredListener";
import { AiChatProvider } from "@/modules/ai/AiChatContext";
import AiChatDrawer from "@/components/ai/AiChatDrawer";

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
                    <FavouritesProvider>
                    <CartProvider>
                    <AiChatProvider>
                        <LoadingGuard>
                            {children}
                        </LoadingGuard>
                        <CartDrawer />
                        <AiChatDrawer />
                        <AuthModalHost />
                        <Suspense>
                            <AuthRequiredListener />
                        </Suspense>
                    </AiChatProvider>
                    </CartProvider>
                    </FavouritesProvider>
                </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
