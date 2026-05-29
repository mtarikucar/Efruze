import type { Metadata } from "next";
import { Cormorant_Garamond, Tenor_Sans, DM_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const tenor = Tenor_Sans({
  variable: "--font-tenor",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "efruze — su üstüne çizilen",
    template: "%s · efruze",
  },
  description:
    "Alanya'daki atölyemizden elle mermerlenmiş (ebru) ipekler, seramikler, kağıt ve cam ürünler. Her parça bir tepsi durgun suda, bir nefesle başlar.",
  openGraph: {
    type: "website",
    siteName: "efruze",
    locale: "tr_TR",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${tenor.variable} ${dmSans.variable} antialiased`}
    >
      <body className="min-h-full bg-bg text-ink font-sans">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
