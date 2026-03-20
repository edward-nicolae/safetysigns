import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/providers/cart-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "SafetySigns",
  description: "Safety signs ordering platform for construction sites",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="container-page flex-1 py-10">{children}</main>
            <SiteFooter />
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
