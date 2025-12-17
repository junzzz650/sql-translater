export interface TranslationSet {
  en: string;
  cn: string;
  kh: string;
  id: string;
  vn: string;
  th: string;
  my: string;
  [key: string]: string;
}

export interface CmsEntry {
  id: string;
  key1: string;
  key2: string;
  translations: TranslationSet;
  timestamp: number;
}