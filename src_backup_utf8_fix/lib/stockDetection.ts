 import { SP500_STOCKS } from "./sp500Stocks";

export function detectStock(text: string) {
  const normalized = text.toLowerCase();

  return SP500_STOCKS.find((stock) =>
    stock.keywords.some((keyword) =>
      normalized.includes(keyword.toLowerCase())
    )
  );
}


