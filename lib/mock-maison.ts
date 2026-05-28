import type { MaisonContentDTO, MaisonStepDTO, MaisonArtisanDTO } from "@/server/types/maison";
import type { AppLocale } from "@/i18n/routing";

type Loc<T> = { tr: T; en?: T };

const introTr = `Türkçede "ebrû" kelimesi Farsça'da bulut anlamına gelen kelimeyle aynı kökten gelir. Geleneksel olarak suyun üzerinde yapılan bu sanat, beş yüzyıldır Anadolu'da yaşıyor. Bir tepsi öd safrasıyla yoğunlaştırılmış su, pigment, bir tarak — ve sonra bir anda kumaş üzerine alınır. Hiçbir desen iki kez tekrar etmez.

efruze atölyesi 2025'te kuruldu. Üç ustayla çalışıyoruz: bir mermerleyici (Zehra Aydın), bir hattat (Hüseyin A.) ve bir çömlekçi (İrem Y.). Her parça atölyede el ile yapılır, imzalanır, numaralandırılır.

Alanya'daki atölyemiz iki pencereli, küçük bir oda — sabahları erken açar, akşam Alanya Kalesi'nin ışıkları üzerimize düşene kadar çalışırız. Hafta sonları randevuyla ziyaret edebilirsiniz.`;

const introEn = `In Turkish, ebrû shares a root with the Persian word for cloud. The art, made on the surface of water, has lived in Anatolia for five centuries. A tray of water thickened with ox-gall, pigment, a comb — and in one motion, the pattern is taken up onto fabric. No pattern repeats.

efruze was founded in 2025. We work with three masters: a marbler (Zehra Aydın), a calligrapher (Hüseyin A.) and a kilnsmith (İrem Y.). Each piece is hand-made, signed, and numbered in our atelier.

Our atelier in Alanya has two windows — we open early and work until the lights of Alanya Castle fall over us. Visits by appointment on weekends.`;

type StepSeed = {
  id: string;
  sortOrder: number;
  title: Loc<string>;
  description: Loc<string>;
};

const stepsSeed: StepSeed[] = [
  {
    id: "maison-step-01",
    sortOrder: 10,
    title: { tr: "Su hazırlanır.", en: "The water is prepared." },
    description: {
      tr: "Tepsiye öd safrasıyla yoğunlaştırılmış su konur. Bekletme süresi ısı ve nem ile değişir.",
      en: "Ox-gall-thickened water rests in the tray. Wait times shift with temperature and humidity.",
    },
  },
  {
    id: "maison-step-02",
    sortOrder: 20,
    title: { tr: "Pigment bırakılır.", en: "Pigment is floated." },
    description: {
      tr: "Doğal pigmentler suyun yüzeyine bırakılır — hava sıcaklığı, suyun yoğunluğu, ustanın nefesi belirleyici.",
      en: "Natural pigments are laid onto the surface. Temperature, viscosity, and the marbler's breath decide everything.",
    },
  },
  {
    id: "maison-step-03",
    sortOrder: 30,
    title: { tr: "Desen çizilir.", en: "The pattern is drawn." },
    description: {
      tr: "Taraklar ve kalemler ile desen yapılır. Burada her bir hareket geri alınamaz.",
      en: "Combs and styluses shape the figure. Every motion is irreversible.",
    },
  },
  {
    id: "maison-step-04",
    sortOrder: 40,
    title: { tr: "Kumaş alınır.", en: "The fabric is lifted." },
    description: {
      tr: "Kumaş bir kez konulup kaldırılır. Desen kumaşa geçer, su tekrar düzlenir, yeni bir parça başlar.",
      en: "Cloth is laid once and lifted. The pattern transfers; the water resets for the next piece.",
    },
  },
];

type ArtisanSeed = {
  id: string;
  sortOrder: number;
  imageUrl: string | null;
  name: Loc<string>;
  role: Loc<string>;
  bio: Loc<string>;
};

const artisansSeed: ArtisanSeed[] = [
  {
    id: "maison-artisan-selma",
    sortOrder: 10,
    imageUrl: null,
    name: { tr: "Zehra Aydın", en: "Zehra Aydın" },
    role: { tr: "Mermerleyici", en: "Marbler" },
    bio: {
      tr: "20 yıldır ebru ile çalışıyor. İpek ve kağıt üzerine uzmanlaşmıştır.",
      en: "Twenty years with ebru. Specialises in silk and paper.",
    },
  },
  {
    id: "maison-artisan-huseyin",
    sortOrder: 20,
    imageUrl: null,
    name: { tr: "Hüseyin A.", en: "Hüseyin A." },
    role: { tr: "Hattat", en: "Calligrapher" },
    bio: {
      tr: "Klasik İslam hat sanatı geleneğinde eğitildi. Yazı takımlarımızı imzalar.",
      en: "Trained in classical Islamic calligraphy. Signs the writing sets.",
    },
  },
  {
    id: "maison-artisan-irem",
    sortOrder: 30,
    imageUrl: null,
    name: { tr: "İrem Y.", en: "İrem Y." },
    role: { tr: "Çömlekçi", en: "Kilnsmith" },
    bio: {
      tr: "İznik seramik geleneğinden — kil, sırlama ve fırınlama.",
      en: "From the İznik ceramic tradition — clay, glaze, and kiln.",
    },
  },
];

export function mockMaisonIntro(_locale: AppLocale): string {
  return introTr;
}

export function mockMaisonSteps(locale: AppLocale): MaisonStepDTO[] {
  return stepsSeed.map((s) => ({
    id: s.id,
    sortOrder: s.sortOrder,
    isActive: true,
    title: s.title[locale],
    description: s.description[locale],
  }));
}

export function mockMaisonArtisans(locale: AppLocale): MaisonArtisanDTO[] {
  return artisansSeed.map((a) => ({
    id: a.id,
    sortOrder: a.sortOrder,
    isActive: true,
    imageUrl: a.imageUrl,
    name: a.name[locale],
    role: a.role[locale],
    bio: a.bio[locale],
  }));
}

export function mockMaison(locale: AppLocale): MaisonContentDTO {
  return {
    heroImageUrl: "/ebru-detail.png",
    intro: mockMaisonIntro(locale),
    steps: mockMaisonSteps(locale),
    artisans: mockMaisonArtisans(locale),
  };
}

export const mockMaisonStepsSeedData = stepsSeed;
export const mockMaisonArtisansSeedData = artisansSeed;
export const mockMaisonIntroSeedData = { tr: introTr, en: introEn };
