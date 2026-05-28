import type { JournalEntryDTO } from "@/server/types/journal";
import type { AppLocale } from "@/i18n/routing";

type Loc<T> = { tr: T; en?: T };
type MockSeed = {
  id: string;
  slug: string;
  date: string;
  featured: boolean;
  readMinutes: number;
  category: Loc<string>;
  title: Loc<string>;
  excerpt: Loc<string>;
  body: Loc<string>;
};

const mock: MockSeed[] = [
  {
    id: "mock-su-ustune",
    slug: "su-ustune-besyuz-yil-ebru",
    date: "2026-05-20T00:00:00Z",
    featured: true,
    readMinutes: 6,
    category: { tr: "Atölyeden", en: "From the atelier" },
    title: {
      tr: "Su üstüne — ebrunun beş yüzyıllık tarihi",
      en: "Drawn upon water — five centuries of ebru",
    },
    excerpt: {
      tr: "Selçuklu medreselerinden Topkapı sarayına, ebru ustası eline aldığı kamış kalemle bir okyanus çizer. Aynı suyun üzerinde iki kez aynı desen oluşmaz. Bu yüzden hatip ebrusunun her örneği imzalıdır — tekil olduğu için.",
      en: "From Seljuk madrasahs to Topkapı Palace, the ebru master draws an ocean with their reed pen. The same pattern never forms twice on the same water. Every hatip ebru is signed — because it is singular.",
    },
    body: {
      tr: "Ebru sanatı, kağıt üzerinde yapılan en eski sanatlardan biri. Selçuklu döneminden bugüne, ustadan çırağa aktarılan bir bilgi. Her ustanın kendi suyu, kendi pigment karışımı, kendi nefesi vardır.\n\nAlanya atölyemizde günümüzde Zehra Aydın ile çalışıyoruz. Yirmi yıllık deneyimi ile her tepsi yeni bir dünya açıyor.",
      en: "Ebru is among the oldest arts on paper. From the Seljuk period to today, knowledge passed from master to apprentice. Each master has their own water, their own pigment mix, their own breath.\n\nAt our Alanya atelier we work today with Zehra Aydın. With twenty years of experience, every tray opens a new world.",
    },
  },
  {
    id: "mock-selma-h",
    slug: "selma-h-portre",
    date: "2026-05-12T00:00:00Z",
    featured: false,
    readMinutes: 8,
    category: { tr: "Zanaatkâr portresi", en: "Artisan portrait" },
    title: {
      tr: "Zehra Aydın — yirmi yıl bir tepsi başında",
      en: "Zehra Aydın — twenty years at the tray",
    },
    excerpt: {
      tr: "Alanya'daki atölyemizin mermerleyici ustası Zehra Aydın, Anadolu Süsleme Sanatları geleneğinde yetişti. Üç çocuk büyüttü, on yedi sergi açtı, sayısız ipeği imzaladı. Bu hafta tepsi başında yarım gün geçirdik.",
      en: "Zehra Aydın, the marbler at our Alanya atelier, trained in the Anatolian ornamental arts tradition. She has raised three children, exhibited seventeen times, and signed countless silks. We spent a half-day with her at the tray this week.",
    },
    body: {
      tr: "Bir tepsiyi nasıl seçeceğini, suyu nasıl yoğunlaştıracağını, pigment damlasını ne zaman bırakacağını yıllar boyunca öğrendi. Bugün her bir hareketinin arkasında binlerce tekrar var.",
      en: "She learned over years how to choose a tray, how to thicken water, when to release a pigment drop. Today, behind each gesture, lie thousands of repetitions.",
    },
  },
  {
    id: "mock-iznik-mavi",
    slug: "iznik-mavisi",
    date: "2026-05-03T00:00:00Z",
    featured: false,
    readMinutes: 5,
    category: { tr: "Renkler", en: "Pigments" },
    title: { tr: "İznik mavisi — bir rengin coğrafyası", en: "İznik blue — the geography of a colour" },
    excerpt: {
      tr: "Kobalt değil, lapis değil, ama biraz ikisinden de. İznik çinilerinin o derin mavisi, 16. yüzyılda bulundu ve hiçbir başka yerde tekrarlanamadı. Çömlekçimiz İrem ile İznik'te bir gün.",
      en: "Not cobalt, not lapis, but a little of both. The deep blue of İznik tiles was found in the 16th century and could never be repeated elsewhere. A day in İznik with our kilnsmith İrem.",
    },
    body: {
      tr: "İznik mavisinin sırrı sadece pigmentte değil, fırının nasıl ısıtıldığında, sırın hangi mineralden olduğunda. Bugün hala tam olarak çözülememiş.",
      en: "The secret of İznik blue is not only in the pigment but in how the kiln is heated, in which minerals the glaze contains. Even today it is not fully solved.",
    },
  },
  {
    id: "mock-hattat",
    slug: "hattat-kamis-kalem",
    date: "2026-04-22T00:00:00Z",
    featured: false,
    readMinutes: 7,
    category: { tr: "Hat sanatı", en: "Calligraphy" },
    title: { tr: "Hattat — bir kamış kalemin doğuşu", en: "Hattat — the birth of a reed pen" },
    excerpt: {
      tr: "İyi bir kamış kalem üç yılda yetişir. Şişli'deki dükkândan ödünç aldığımız kamışları, Hüseyin A. ustamızın elinden geçiriyoruz. Eğri kesim, yumuşak bir hareket — sonra bir mürekkep damlası, ve harf doğar.",
      en: "A good reed pen takes three years to grow. We borrow reeds from a shop in Şişli, then pass them through Hüseyin A.'s hands. An oblique cut, a soft motion — then a drop of ink, and a letter is born.",
    },
    body: {
      tr: "Kamışın kesim açısı, harfin nasıl akacağını belirler. Her hattat kendi kamışını keser. Hüseyin A. ile yirmi dakika bir kamışı keserken geçen vakitten daha kıymetli bir öğretim yok.",
      en: "The angle of the reed's cut determines how the letter will flow. Every calligrapher cuts their own reed. There is no teaching more valuable than twenty minutes with Hüseyin A. as he cuts one.",
    },
  },
  {
    id: "mock-ipek-kumas",
    slug: "ipek-bursadan-tepsiye",
    date: "2026-04-10T00:00:00Z",
    featured: false,
    readMinutes: 4,
    category: { tr: "Malzeme", en: "Materials" },
    title: { tr: "İpek kumaş — Bursa'dan tepsiye", en: "Silk fabric — from Bursa to the tray" },
    excerpt: {
      tr: "Habotai ipeğimizi Bursa'da küçük bir aile dokuyor. Hafif, akışkan, suyu kabul ediyor. Renk almaya hazır olduğunda elimize geliyor — geri kalanı su, pigment ve nefes.",
      en: "Our habotai silk is woven by a small family in Bursa. Light, fluid, accepts water. By the time it reaches us, it is ready to take colour — the rest is water, pigment, and breath.",
    },
    body: {
      tr: "Bursa atölyesi 1923'te kurulmuş, üçüncü kuşak doku ustaları çalışıyor. Her metre kumaş için 4-5 saatlik bir dokuma var.",
      en: "The Bursa atelier was founded in 1923, third-generation weavers work there. Each meter of fabric takes 4-5 hours of weaving.",
    },
  },
  {
    id: "mock-mart-ayi",
    slug: "mart-bogazici-baslangiclar",
    date: "2026-03-15T00:00:00Z",
    featured: false,
    readMinutes: 3,
    category: { tr: "Mektup", en: "Letter" },
    title: {
      tr: "Mart — denizde bir rüzgâr ve yeni başlangıçlar",
      en: "March — a wind on the sea and new beginnings",
    },
    excerpt: {
      tr: "Atölyenin penceresinden bakınca, mart'ta deniz başka türlü görünüyor. Su soğuk ama renkler ısınıyor. Bu ay tepsiye ne koyduk, ne çıktı — ve bahara nasıl hazırlanıyoruz.",
      en: "Looking from the atelier window, the sea looks different in March. The water is cold, the colours warming. What we put on the tray this month, what came off — and how we prepare for spring.",
    },
    body: {
      tr: "Mart, atölye için sessiz bir başlangıç. Yaz koleksiyonu için pigmentleri seçiyoruz, yeni desenler deniyoruz. Soğuk su, sıcak renkler.",
      en: "March is a quiet beginning for the atelier. We choose pigments for the summer collection, try new patterns. Cold water, warm colours.",
    },
  },
];

export function mockJournal(locale: AppLocale): JournalEntryDTO[] {
  return mock.map((m) => ({
    id: m.id,
    slug: m.slug,
    date: new Date(m.date).toISOString(),
    imageUrl: null,
    featured: m.featured,
    readMinutes: m.readMinutes,
    isPublished: true,
    category: m.category[locale],
    title: m.title[locale],
    excerpt: m.excerpt[locale],
    body: m.body[locale],
  }));
}

export const mockJournalSeedData = mock; // Used by prisma/seed.ts
