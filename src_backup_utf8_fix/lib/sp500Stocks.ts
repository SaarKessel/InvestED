// ---------------------------------------------------------------------------
// InvestED ג€” S&P 500 Stock Database
//
// ׳–׳™׳”׳•׳™ ׳׳ ׳™׳•׳× ׳‘׳©׳₪׳” ׳—׳•׳₪׳©׳™׳×:
// Apple / ׳׳₪׳ / AAPL ג†’ AAPL
// ---------------------------------------------------------------------------

export interface StockOption {
  symbol: string;
  name: string;
  hebrewName: string;
  keywords: string[];
}

export const SP500_STOCKS: StockOption[] = [
  {
    symbol: "AAPL",
    name: "Apple",
    hebrewName: "׳׳₪׳",
    keywords: [
      "apple",
      "׳׳₪׳",
      "aapl"
    ],
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    hebrewName: "׳׳™׳§׳¨׳•׳¡׳•׳₪׳˜",
    keywords: [
      "microsoft",
      "׳׳™׳§׳¨׳•׳¡׳•׳₪׳˜",
      "msft"
    ],
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    hebrewName: "׳׳ ׳‘׳™׳“׳™׳”",
    keywords: [
      "nvidia",
      "׳׳ ׳‘׳™׳“׳™׳”",
      "nvda"
    ],
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    hebrewName: "׳˜׳¡׳׳”",
    keywords: [
      "tesla",
      "׳˜׳¡׳׳”",
      "tsla"
    ],
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    hebrewName: "׳׳׳–׳•׳",
    keywords: [
      "amazon",
      "׳׳׳–׳•׳",
      "amzn"
    ],
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Google",
    hebrewName: "׳’׳•׳’׳",
    keywords: [
      "google",
      "׳’׳•׳’׳",
      "alphabet",
      "googl"
    ],
  },
  {
    symbol: "META",
    name: "Meta",
    hebrewName: "׳׳˜׳",
    keywords: [
      "meta",
      "׳׳˜׳",
      "facebook",
      "׳₪׳™׳™׳¡׳‘׳•׳§",
      "meta"
    ],
  },
];

export function detectStock(text: string): StockOption | null {
  const normalized = text.toLowerCase();

  return (
    SP500_STOCKS.find((stock) =>
      stock.keywords.some((keyword) =>
        normalized.includes(keyword.toLowerCase())
      )
    ) ?? null
  );
}

