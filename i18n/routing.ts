import { defineRouting } from "next-intl/routing";

// Single-locale site (Turkish). The next-intl machinery is kept because
// translations strings still flow through useTranslations()/getTranslations(),
// but there's only one locale and no switcher.
export const routing = defineRouting({
  locales: ["tr"] as const,
  defaultLocale: "tr",
  localePrefix: "never",
});

export type AppLocale = (typeof routing.locales)[number];
