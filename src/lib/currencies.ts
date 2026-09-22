export interface Currency {
  code: string;
  symbol: string;
  name: string;
  nameHe: string;
  locale: string;
  currency: string;
}

export const CURRENCIES: Currency[] = [
  {
    code: "ILS",
    symbol: "₪",
    name: "Israeli Shekel",
    nameHe: "שקל ישראלי",
    locale: "he-IL",
    currency: "ILS",
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    nameHe: "דולר אמריקאי",
    locale: "en-US",
    currency: "USD",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    nameHe: "יורו",
    locale: "en-IE",
    currency: "EUR",
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    nameHe: "לירה שטרלינג",
    locale: "en-GB",
    currency: "GBP",
  },
  {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar",
    nameHe: "דולר קנדי",
    locale: "en-CA",
    currency: "CAD",
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    nameHe: "דולר אוסטרלי",
    locale: "en-AU",
    currency: "AUD",
  },
  {
    code: "CHF",
    symbol: "CHF",
    name: "Swiss Franc",
    nameHe: "פרנק שוויצרי",
    locale: "de-CH",
    currency: "CHF",
  },
  {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    nameHe: "ין יפני",
    locale: "ja-JP",
    currency: "JPY",
  },
];

export const DEFAULT_CURRENCY = "ILS";

export function getCurrencyByCode(code: string): Currency {
  return (
    CURRENCIES.find(c => c.code === code) ?? CURRENCIES.find(c => c.code === DEFAULT_CURRENCY)!
  );
}
