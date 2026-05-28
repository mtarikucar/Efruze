import type { StaticPageDTO } from "@/server/types/static-page";
import type { AppLocale } from "@/i18n/routing";

type Loc<T> = { tr: T; en?: T };
type MockSeed = {
  slug: string;
  title: Loc<string>;
  intro: Loc<string>;
  body: Loc<string>;
};

const termsBodyTr = `1. Genel hükümler

efruze atölyesi ("efruze", "biz") tarafından işletilen bu site üzerinden yapılan tüm satışlar Türkiye Cumhuriyeti yasaları uyarınca gerçekleştirilir. Siteyi kullanarak bu şartları kabul etmiş sayılırsınız.

2. Ürünler ve sipariş

Her ürün, el yapımı mermerleme süreci nedeniyle tekildir. Site üzerinde gösterilen görseller temsilidir; gerçek ürünün rengi ve deseni hafif farklılık gösterebilir. Sipariş, ödemenin teyit edilmesinden sonra kesinleşir.

3. Fiyatlandırma ve ödeme

Fiyatlar Türk Lirası cinsindendir ve KDV dahildir. Şu anda yalnızca banka havalesi / EFT kabul edilmektedir. Sipariş 72 saat içinde ödenmediği takdirde iptal edilir.

4. Kargo

Yurt içi siparişler ödeme onayını takip eden 2–4 iş günü içinde kargoya verilir. 2.500 ₺ üzerindeki siparişlerde kargo ücretsizdir.

5. İade ve değişim

El yapımı ve tekil olmaları sebebiyle ürünler iade edilemez. Üretim hatası durumunda 14 gün içinde değişim talep edilebilir.

6. Telif hakları

Sitede yer alan tüm içerik (görseller, metinler, desenler) efruze atölyesine aittir. İzin almadan kopyalanması veya yeniden basımı yasaktır.

7. İletişim

Sorular için atelier@efruze.com adresine yazabilirsiniz.`;

const termsBodyEn = `1. General provisions

All sales through this site, operated by efruze atelier ("efruze", "we"), are governed by the laws of the Republic of Türkiye. By using the site you accept these terms.

2. Products and orders

Each piece is unique due to the hand-marbling process. Product photography is representative; the actual colour and pattern may vary slightly. Orders are confirmed once payment is verified.

3. Pricing and payment

Prices are in Turkish Lira and include VAT. At present we only accept bank transfer (havale/EFT). Orders not paid within 72 hours are cancelled.

4. Shipping

Domestic orders ship within 2–4 business days of payment confirmation. Domestic shipping is free on orders over ₺2,500.

5. Returns and exchanges

Because pieces are unique and hand-made, returns are not accepted. Exchanges may be requested within 14 days for production defects.

6. Copyright

All content on this site (imagery, text, patterns) belongs to efruze atelier. Reproduction without permission is prohibited.

7. Contact

For questions, please write to atelier@efruze.com.`;

const privacyBodyTr = `1. Topladığımız veriler

Sipariş verirken bize sağladığınız ad, e-posta, telefon ve adres bilgilerini saklarız. Site ziyaretlerinde teknik veriler (IP, tarayıcı bilgileri) günlüklenir.

2. Veri kullanımı

Verilerinizi yalnızca siparişinizi işlemek, kargo göndermek ve atölyemizden gelen güncellemeleri (yalnızca onayınızla) iletmek için kullanırız. Verilerinizi üçüncü taraflarla paylaşmayız; istisnalar yasal yükümlülükler ve kargo şirketi gibi hizmet sağlayıcılardır.

3. Çerezler

Site, sepet işlevselliği için yalnızca temel çerezleri kullanır. İzleme veya reklam çerezi kullanmıyoruz.

4. Haklarınız (KVKK 11. madde)

Sahip olduğumuz kişisel verileriniz hakkında bilgi alma, düzeltme, silinmesini isteme ve veri taşınabilirliği talep etme hakkına sahipsiniz. Bu talepler için atelier@efruze.com adresine yazın.

5. Veri güvenliği

Verileriniz şifreli bağlantılar üzerinden iletilir ve gerekli teknik ve idari önlemlerle korunur.

6. İletişim

Gizlilik ile ilgili sorularınız için atelier@efruze.com adresine yazın.`;

const privacyBodyEn = `1. What we collect

When you place an order, we keep the name, email, phone and address you provide. We log basic technical data (IP, browser) on site visits.

2. How we use it

We use your data only to fulfil your order, dispatch shipments, and send atelier updates (only with your consent). We do not share your data with third parties beyond service providers (e.g. shipping carriers) and legal obligations.

3. Cookies

The site uses essential cookies only (cart functionality). We do not use tracking or advertising cookies.

4. Your rights (KVKK / GDPR)

You may request access, rectification, erasure, or portability of your personal data. Write to atelier@efruze.com for any such request.

5. Security

Your data is transmitted over encrypted connections and protected by technical and administrative safeguards.

6. Contact

For privacy questions, write to atelier@efruze.com.`;

const mock: MockSeed[] = [
  {
    slug: "terms",
    title: { tr: "Şartlar ve koşullar", en: "Terms and conditions" },
    intro: {
      tr: "Bu sayfa şablon niteliğindedir — yayına almadan önce hukuk danışmanınızla gözden geçirin.",
      en: "This page is a template — review with your legal counsel before going live.",
    },
    body: { tr: termsBodyTr, en: termsBodyEn },
  },
  {
    slug: "privacy",
    title: { tr: "Gizlilik politikası", en: "Privacy policy" },
    intro: {
      tr: "Bu sayfa şablon niteliğindedir — KVKK Aydınlatma Metni için bir hukukçuyla birlikte gözden geçirin.",
      en: "This page is a template — review with a privacy specialist (GDPR / KVKK) before going live.",
    },
    body: { tr: privacyBodyTr, en: privacyBodyEn },
  },
];

export function mockStaticPage(slug: string, locale: AppLocale): StaticPageDTO | null {
  const m = mock.find((p) => p.slug === slug);
  if (!m) return null;
  return {
    id: `mock-${m.slug}`,
    slug: m.slug,
    isActive: true,
    title: m.title[locale],
    intro: m.intro[locale] || null,
    body: m.body[locale],
  };
}

export const mockPagesSeedData = mock;
