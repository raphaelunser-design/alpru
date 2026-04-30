export const supportedLocales = [
  { code: "de", label: "Deutsch", shortLabel: "DE" },
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "fr", label: "Français", shortLabel: "FR" },
  { code: "nl", label: "Nederlands", shortLabel: "NL" },
] as const;

export type SupportedLocale = (typeof supportedLocales)[number]["code"];

export const defaultLocale: SupportedLocale = "de";

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return supportedLocales.some((locale) => locale.code === value);
}
