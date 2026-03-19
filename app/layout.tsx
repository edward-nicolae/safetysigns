import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SafetySigns",
  description: "Your platform for safety and compliance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={[geistSans.variable, geistMono.variable, "h-full antialiased"].join(" ")}
    >
      <body className="min-h-full bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
              SafetySigns
            </Link>
            <div className="flex w-full flex-wrap items-center gap-2 text-sm font-medium text-slate-600 sm:w-auto sm:gap-4">
              <Link
                href="/"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Home
              </Link>
              <Link
                href="/signs"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Signs
              </Link>
              <Link
                href="/about"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="rounded-md px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Contact
              </Link>
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
