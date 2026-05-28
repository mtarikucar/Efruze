import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { StaticPageHeader } from "@/components/storefront/StaticPageHeader";
import { ContactForm } from "@/components/storefront/ContactForm";
import { safeGetContactInfo } from "@/server/services/catalog";
import type { AppLocale } from "@/i18n/routing";

export const metadata: Metadata = { title: "İletişim · efruze" };

const heading = {
  eyebrow: "İletişim",
  title: "Atölyeden",
  titleEm: "size.",
  sub: "Özel siparişler, atölye ziyareti veya basın için yazın. Aynı gün cevap yazmaya çalışıyoruz.",
  addressH: "Atölye",
  hoursH: "Saatler",
  emailH: "E-posta",
  whatsappH: "WhatsApp",
  instagramH: "Instagram",
} as const;

export default async function ContactPage() {
  const locale = (await getLocale()) as AppLocale;
  const h = heading;
  const info = await safeGetContactInfo(locale);

  return (
    <section
      className="section-frame relative z-[2]"
      style={{ paddingTop: "clamp(120px, 11vw, 180px)" }}
    >
      <StaticPageHeader eyebrow={h.eyebrow} title={h.title} titleEm={h.titleEm} sub={h.sub} />

      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1fr_1.2fr]">
        <aside className="flex flex-col gap-8">
          <Block h={h.addressH} body={info.address} />
          <Block h={h.hoursH} body={info.hours} />
          <Block h={h.emailH} body={info.email} link={`mailto:${info.email}`} />
          {info.whatsapp && (
            <Block
              h={h.whatsappH}
              body={info.whatsapp}
              link={`https://wa.me/${info.whatsapp.replace(/[^0-9]/g, "")}`}
            />
          )}
          {info.instagram && (
            <Block
              h={h.instagramH}
              body={info.instagram}
              link={`https://instagram.com/${info.instagram.replace(/^@/, "")}`}
            />
          )}
        </aside>
        <ContactForm locale={locale} />
      </div>
    </section>
  );
}

function Block({ h, body, link }: { h: string; body: string; link?: string }) {
  const inner = (
    <p className="m-0 whitespace-pre-line font-serif text-lg leading-relaxed text-ink">{body}</p>
  );
  return (
    <div className="flex flex-col gap-2">
      <div className="font-caps text-[10px] uppercase tracking-[0.28em] text-gold">{h}</div>
      {link ? (
        <a href={link} className="hover:text-blue-deep transition-colors">
          {inner}
        </a>
      ) : (
        inner
      )}
    </div>
  );
}
