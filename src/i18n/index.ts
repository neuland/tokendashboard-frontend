import { de } from './de';
import { en } from './en';

export type Locale = 'de' | 'en';
export const DEFAULT_LOCALE: Locale = 'de';
export const LOCALES: Locale[] = ['de', 'en'];

const dictionaries = { de, en };

export function dict(locale: Locale): typeof de {
  return dictionaries[locale];
}
