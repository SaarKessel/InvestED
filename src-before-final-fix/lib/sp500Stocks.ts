// ---------------------------------------------------------------------------
// InvestED — S&P 500 Stock Database
//
// זיהוי מניות בשפה חופשית:
// Apple / אפל / AAPL → AAPL
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
    hebrewName: "אפל",
    keywords: [
      "apple",
      "אפל",
      "aapl"
    ],
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    hebrewName: "מיקרוסופט",
    keywords: [
      "microsoft",
      "מיקרוסופט",
      "msft"
    ],
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    hebrewName: "אנבידיה",
    keywords: [
      "nvidia",
      "אנבידיה",
      "nvda"
    ],
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    hebrewName: "טסלה",
    keywords: [
      "tesla",
      "טסלה",
      "tsla"
    ],
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    hebrewName: "אמזון",
    keywords: [
      "amazon",
      "אמזון",
      "amzn"
    ],
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Google",
    hebrewName: "גוגל",
    keywords: [
      "google",
      "גוגל",
      "alphabet",
      "googl"
    ],
  },
  {
    symbol: "META",
    name: "Meta",
    hebrewName: "מטא",
    keywords: [
      "meta",
      "מטא",
      "facebook",
      "פייסבוק",
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
