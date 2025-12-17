export interface TranslationSet {
  en: string;
  cn: string;
  kh: string;
  id: string;
  vn: string;
  th: string;
  my: string;
  lo: string;
  hk: string;
  ar: string;
  fr: string;
  ja: string;
  es: string;
  pt: string;
  tr: string;
  ru: string;
  kr: string;
  mm: string;
  hi: string;
  mn: string;
  ph: string;
  bd: string;
  ne: string;
  pk: string;
  [key: string]: string; // Allow dynamic access
}

export interface CmsEntry {
  id: string; // Internal GUID
  key1: string; // Category (e.g., BANK)
  key2: string; // Short Code (e.g., MTC)
  translations: TranslationSet;
  timestamp: number;
}
