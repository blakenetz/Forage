import type { Metadata } from "next";
import { EB_Garamond, News_Cycle } from "next/font/google";

import "./globals.css";

const serif = EB_Garamond({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

const caption = News_Cycle({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-caption",
});

export const metadata: Metadata = {
  title: "Forage",
  description: "A field guide to recipes from four kitchens",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${caption.variable}`}>
      <body>{children}</body>
    </html>
  );
}
