export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
  currency: string;
}

export const CURRENCIES: Currency[] = [
  {
    code: "ILS",
    symbol: "₪",
    name: "Israeli Shekel",
    locale: "he-IL",
    currency: "ILS",
  },
  {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    locale: "en-US",
    currency: "USD",
  },
  {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    locale: "en-IE",
    currency: "EUR",
  },
  {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    locale: "en-GB",
    currency: "GBP",
  },
  {
    code: "CAD",
    symbol: "CA$",
    name: "Canadian Dollar",
    locale: "en-CA",
    currency: "CAD",
  },
  {
    code: "AUD",
    symbol: "A$",
    name: "Australian Dollar",
    locale: "en-AU",
    currency: "AUD",
  },
  {
    code: "CHF",
    symbol: "CHF",
    name: "Swiss Franc",
    locale: "de-CH",
    currency: "CHF",
  },
  {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
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
