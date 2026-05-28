import { ParallaxBg } from "@/components/storefront/ParallaxBg";
import { Footer } from "@/components/storefront/Footer";
import { Link } from "@/i18n/navigation";
import { BrandWordmark } from "@/components/storefront/BrandWordmark";

/**
 * Auth route group layout — lightweight wrapper without the storefront nav so
 * the sign-in / sign-up pages feel like a focused entry point. We keep the
 * parallax bed + footer so the brand voice stays present.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ParallaxBg />
      <header
        className="relative z-50 flex items-center justify-center pt-10"
        style={{ paddingLeft: "var(--pad)", paddingRight: "var(--pad)" }}
      >
        <Link href="/" aria-label="efruze, home">
          <BrandWordmark size="md" />
        </Link>
      </header>
      <main className="relative z-[2]">{children}</main>
      <Footer />
    </>
  );
}
