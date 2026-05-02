import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

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
            <body>{children}</body>
        </html>
    );
}
