// api/market-quote.js
//
// פונקציית Vercel Serverless שמשמשת כ-proxy מול Yahoo Finance.
// חייבים לעשות את הקריאה מהשרת (ולא ישירות מהדפדפן), כי Yahoo Finance
// חוסם בקשות CORS מהדפדפן. כאן, לעומת זאת, זו קריאת שרת-לשרת שעובדת בלי בעיה.
//
// שימוש: GET /api/market-quote?symbols=VOO,AAPL,MSFT
//
// הערה: זהו endpoint לא רשמי של Yahoo Finance (אין API רשמי בחינם).
// הוא נמצא בשימוש נרחב בקהילה, אך יכול להשתנות ללא הודעה מוקדמת.
// אם הוא מפסיק לעבוד, האפליקציה נופלת אוטומטית לנתונים מדומים
// (ראו src/lib/marketData.ts).

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  const symbolsParam = req.query?.symbols;
  if (!symbolsParam || typeof symbolsParam !== "string") {
    res.status(400).json({ error: "חסר פרמטר symbols, לדוגמה: ?symbols=VOO,AAPL" });
    return;
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8);

  if (symbols.length === 0) {
    res.status(400).json({ error: "לא סופקו סמלים תקינים" });
    return;
  }

  try {
    const assets = await Promise.all(symbols.map(fetchYahooSymbol));
    res.status(200).json({ assets });
  } catch (err) {
    res.status(502).json({
      error: "שליפת נתונים מ-Yahoo Finance נכשלה",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}

async function fetchYahooSymbol(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?range=3mo&interval=1d`;

  const response = await fetch(url, {
    headers: {
      // חלק מהבקשות ל-Yahoo נחסמות ללא User-Agent תקין של דפדפן.
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Yahoo Finance החזיר שגיאה עבור ${symbol}: ${response.status}`);
  }

  const data = await response.json();
  const result = data?.chart?.result?.[0];
  if (!result) {
    throw new Error(`אין נתונים עבור ${symbol}`);
  }

  const meta = result.meta ?? {};
  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0] ?? {};
  const closes = quote.close ?? [];
  const opens = quote.open ?? [];
  const highs = quote.high ?? [];
  const lows = quote.low ?? [];

  const history = timestamps
    .map((t, i) => ({
      date: new Date(t * 1000).toISOString().slice(0, 10),
      price: typeof closes[i] === "number" ? Math.round(closes[i] * 100) / 100 : null,
      open: typeof opens[i] === "number" ? Math.round(opens[i] * 100) / 100 : null,
      high: typeof highs[i] === "number" ? Math.round(highs[i] * 100) / 100 : null,
      low: typeof lows[i] === "number" ? Math.round(lows[i] * 100) / 100 : null,
      close: typeof closes[i] === "number" ? Math.round(closes[i] * 100) / 100 : null,
    }))
    .filter((point) => typeof point.price === "number");

  const price = meta.regularMarketPrice ?? history[history.length - 1]?.price ?? 0;
  const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

  return {
    symbol: meta.symbol ?? symbol,
    name: meta.longName ?? meta.shortName ?? symbol,
    price: Math.round(price * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    history,
  };
}
