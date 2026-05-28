import type { FaqItemDTO } from "@/server/types/faq";
import type { AppLocale } from "@/i18n/routing";

type Loc<T> = { tr: T; en?: T };
type MockSeed = {
  id: string;
  sortOrder: number;
  question: Loc<string>;
  answer: Loc<string>;
};

const mock: MockSeed[] = [
  {
    id: "faq-shipping",
    sortOrder: 10,
    question: {
      tr: "Siparişim ne zaman gelir?",
      en: "When will my order arrive?",
    },
    answer: {
      tr: "Türkiye içi siparişler havale onayından sonra 2–4 iş gününde kargoya verilir. Yurt dışı 7–14 iş günü sürer.",
      en: "Domestic orders ship within 2–4 business days of payment confirmation. International orders take 7–14 business days.",
    },
  },
  {
    id: "faq-shipping-free",
    sortOrder: 20,
    question: {
      tr: "Kargo ücretsiz mi?",
      en: "Is shipping free?",
    },
    answer: {
      tr: "2.500 ₺ üzerindeki siparişlerde Türkiye içi kargo ücretsizdir. Altındaki siparişlerde sabit ücret eklenir.",
      en: "Domestic orders over ₺2,500 ship free. Below that, a flat rate is added at checkout.",
    },
  },
  {
    id: "faq-payment",
    sortOrder: 30,
    question: {
      tr: "Havale dışında ödeme seçeneği var mı?",
      en: "Are there payment options other than bank transfer?",
    },
    answer: {
      tr: "Şimdilik yalnızca banka havalesi / EFT kabul ediyoruz. Kart ödeme (PayTR) yakında devreye girecek.",
      en: "For now we accept bank transfer (havale/EFT) only. Card payment (PayTR) launches soon.",
    },
  },
  {
    id: "faq-returns",
    sortOrder: 40,
    question: {
      tr: "İade ve değişim?",
      en: "Returns and exchanges?",
    },
    answer: {
      tr: "Mermerleme süreci her parçayı tekil yaptığı için iade kabul etmiyoruz. Üretim hatası durumunda 14 gün içinde değişim yapılır.",
      en: "Because marbling makes each piece unique, we don't accept returns. Exchanges within 14 days for production defects.",
    },
  },
  {
    id: "faq-visit",
    sortOrder: 50,
    question: {
      tr: "Atölyeyi ziyaret edebilir miyim?",
      en: "Can I visit the atelier?",
    },
    answer: {
      tr: "Hafta sonları randevu ile mümkündür. atelier@efruze.com adresinden yazın.",
      en: "Weekends by appointment. Write to atelier@efruze.com.",
    },
  },
  {
    id: "faq-custom",
    sortOrder: 60,
    question: {
      tr: "Özel sipariş kabul ediyor musunuz?",
      en: "Do you take custom orders?",
    },
    answer: {
      tr: "Evet. Renk paleti, ölçü veya hediye paketleme için bize yazın — uygunluk durumuna göre 2–6 hafta içinde teslim ederiz.",
      en: "Yes. For colour palette, size, or gift packaging — write to us, and depending on availability we deliver in 2–6 weeks.",
    },
  },
  {
    id: "faq-gift",
    sortOrder: 70,
    question: {
      tr: "Hediye paketi var mı?",
      en: "Gift wrapping?",
    },
    answer: {
      tr: "Tüm siparişler keten katlı zarif paketle gönderilir. Not eklemek isterseniz sipariş notlarına yazın.",
      en: "All orders ship in linen-folded packaging. Add a note at checkout to include a message.",
    },
  },
  {
    id: "faq-care",
    sortOrder: 80,
    question: {
      tr: "Ebru bakımı nasıl yapılır?",
      en: "How do I care for ebru pieces?",
    },
    answer: {
      tr: "İpekler kuru temizleme ile yıkanmalı. Kağıt baskılar doğrudan güneşten uzak tutulmalı. Seramikler bulaşık makinesinde değil, elde yıkanmalıdır.",
      en: "Silks should be dry-cleaned. Paper prints kept out of direct sunlight. Ceramics hand-washed, not dishwasher.",
    },
  },
];

export function mockFaq(locale: AppLocale): FaqItemDTO[] {
  return mock.map((m) => ({
    id: m.id,
    sortOrder: m.sortOrder,
    isActive: true,
    question: m.question[locale],
    answer: m.answer[locale],
  }));
}

export const mockFaqSeedData = mock;
