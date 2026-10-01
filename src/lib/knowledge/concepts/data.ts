// Generated from the existing explanation library plus registry-only entries.
// `explain` points at the existing concept answer (by its English label); null = no explanation text yet.
import type { ConceptEntry } from "./types";

export const CONCEPT_DATA: ConceptEntry[] = [
 {
  "id": "mutual-fund",
  "en": "Mutual fund",
  "he": "קרן נאמנות",
  "category": "investments",
  "explain": "Mutual fund",
  "aliases": [
   "קרן נאמנות",
   "קרנות נאמנות"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "etf",
  "en": "ETF",
  "he": "קרן סל (ETF)",
  "category": "investments",
  "explain": "ETF",
  "aliases": [
   "exchange traded fund",
   "קרן סל",
   "תעודת סל"
  ],
  "related": [
   "index-fund",
   "expense-ratio",
   "sp-500"
  ],
  "tools": [
   "/research"
  ]
 },
 {
  "id": "index-fund",
  "en": "Index fund",
  "he": "קרן מדד",
  "category": "investments",
  "explain": "Index fund",
  "aliases": [
   "קרן מחקה",
   "קרן מחקה מדד"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "bond",
  "en": "Bond",
  "he": "איגרת חוב",
  "category": "investments",
  "explain": "Bond",
  "aliases": [
   "אג״ח",
   "אגח",
   "איגרת חוב",
   "אגרות חוב"
  ],
  "related": [
   "coupon",
   "maturity",
   "credit-rating",
   "interest-rate",
   "duration"
  ],
  "tools": []
 },
 {
  "id": "compound-interest",
  "en": "Compound interest",
  "he": "ריבית דריבית",
  "category": "personal",
  "explain": "Compound interest",
  "aliases": [
   "ריבית דריבית",
   "compounding",
   "compound growth"
  ],
  "related": [
   "rule-of-72",
   "dollar-cost-averaging",
   "inflation"
  ],
  "tools": [
   "/calculator"
  ]
 },
 {
  "id": "market-cap",
  "en": "Market cap",
  "he": "שווי שוק",
  "category": "analysis",
  "explain": "Market cap",
  "aliases": [
   "שווי שוק",
   "market capitalization"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "dividend-yield",
  "en": "Dividend yield",
  "he": "תשואת דיבידנד",
  "category": "investments",
  "explain": "Dividend yield",
  "aliases": [
   "תשואת דיבידנד"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "dividend",
  "en": "Dividend",
  "he": "דיבידנד",
  "category": "investments",
  "explain": "Dividend",
  "aliases": [
   "דיבידנד",
   "דיבידנדים"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "p-e-ratio",
  "en": "P/E ratio",
  "he": "מכפיל רווח",
  "category": "analysis",
  "explain": "P/E ratio",
  "aliases": [
   "PE",
   "P/E",
   "price earnings",
   "price-to-earnings",
   "מכפיל רווח",
   "מכפיל רווחיות"
  ],
  "related": [
   "eps",
   "market-cap",
   "valuation",
   "dcf"
  ],
  "tools": [
   "/research"
  ]
 },
 {
  "id": "eps",
  "en": "EPS",
  "he": "רווח למניה (EPS)",
  "category": "analysis",
  "explain": "EPS",
  "aliases": [
   "רווח למניה",
   "earnings per share"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "expense-ratio",
  "en": "Expense ratio",
  "he": "דמי ניהול",
  "category": "personal",
  "explain": "Expense ratio",
  "aliases": [
   "דמי ניהול",
   "management fee",
   "ter"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "volatility",
  "en": "Volatility",
  "he": "תנודתיות",
  "category": "portfolio",
  "explain": "Volatility",
  "aliases": [
   "תנודתיות",
   "standard deviation",
   "סטיית תקן",
   "std dev"
  ],
  "related": [
   "beta",
   "drawdown",
   "diversification",
   "sharpe-ratio"
  ],
  "tools": [
   "/research"
  ]
 },
 {
  "id": "rsi",
  "en": "RSI",
  "he": "RSI",
  "category": "markets",
  "explain": "RSI",
  "aliases": [
   "relative strength index",
   "מדד עוצמה יחסית"
  ],
  "related": [],
  "tools": [
   "/research"
  ]
 },
 {
  "id": "diversification",
  "en": "Diversification",
  "he": "פיזור",
  "category": "portfolio",
  "explain": "Diversification",
  "aliases": [
   "פיזור",
   "פיזור תיק",
   "פיזור השקעות"
  ],
  "related": [
   "asset-allocation",
   "rebalancing",
   "correlation",
   "volatility"
  ],
  "tools": [
   "/simulation"
  ]
 },
 {
  "id": "stock-split",
  "en": "Stock split",
  "he": "פיצול מניה",
  "category": "investments",
  "explain": "Stock split",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "stock-market",
  "en": "Stock market",
  "he": "שוק ההון",
  "category": "investments",
  "explain": "Stock market",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "stock",
  "en": "Stock",
  "he": "מניה",
  "category": "investments",
  "explain": "Stock",
  "aliases": [
   "מניה",
   "מניות",
   "equity",
   "equities"
  ],
  "related": [],
  "tools": [
   "/research"
  ]
 },
 {
  "id": "index",
  "en": "Index",
  "he": "מדד",
  "category": "investments",
  "explain": "Index",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "ipo",
  "en": "IPO",
  "he": "הנפקה (IPO)",
  "category": "investments",
  "explain": "IPO",
  "aliases": [
   "הנפקה",
   "הנפקה ראשונה"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "inflation",
  "en": "Inflation",
  "he": "אינפלציה",
  "category": "markets",
  "explain": "Inflation",
  "aliases": [
   "אינפלציה",
   "מדד המחירים",
   "cpi"
  ],
  "related": [],
  "tools": [
   "/news"
  ]
 },
 {
  "id": "interest-rate",
  "en": "Interest rate",
  "he": "ריבית",
  "category": "markets",
  "explain": "Interest rate",
  "aliases": [],
  "related": [
   "bond",
   "inflation",
   "mortgage",
   "duration"
  ],
  "tools": []
 },
 {
  "id": "liquidity",
  "en": "Liquidity",
  "he": "נזילות",
  "category": "markets",
  "explain": "Liquidity",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "bull-market",
  "en": "Bull market",
  "he": "שוק שורי",
  "category": "markets",
  "explain": "Bull market",
  "aliases": [
   "שוק שור"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "bear-market",
  "en": "Bear market",
  "he": "שוק דובי",
  "category": "markets",
  "explain": "Bear market",
  "aliases": [
   "שוק דוב"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "leverage",
  "en": "Leverage",
  "he": "מינוף",
  "category": "portfolio",
  "explain": "Leverage",
  "aliases": [
   "מינוף"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "short-selling",
  "en": "Short selling",
  "he": "מכירה בחסר (שורט)",
  "category": "portfolio",
  "explain": "Short selling",
  "aliases": [
   "שורט",
   "מכירה בחסר"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "market-order",
  "en": "Market order",
  "he": "פקודת שוק",
  "category": "markets",
  "explain": "Market order",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "limit-order",
  "en": "Limit order",
  "he": "פקודת לימיט",
  "category": "markets",
  "explain": "Limit order",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "spread",
  "en": "Spread",
  "he": "מרווח (ספרד)",
  "category": "markets",
  "explain": "Spread",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "broker",
  "en": "Broker",
  "he": "ברוקר",
  "category": "markets",
  "explain": "Broker",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "fractional-shares",
  "en": "Fractional shares",
  "he": "מניות חלקיות",
  "category": "investments",
  "explain": "Fractional shares",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "drip",
  "en": "DRIP",
  "he": "השקעת דיבידנד מחדש (DRIP)",
  "category": "investments",
  "explain": "DRIP",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "ex-dividend-date",
  "en": "Ex-dividend date",
  "he": "יום האקס",
  "category": "investments",
  "explain": "Ex-dividend date",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "total-return",
  "en": "Total return",
  "he": "תשואה כוללת",
  "category": "portfolio",
  "explain": "Total return",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "nominal-vs-real-return",
  "en": "Nominal vs real return",
  "he": "תשואה נומינלית מול ריאלית",
  "category": "portfolio",
  "explain": "Nominal vs real return",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "capital-gains-tax",
  "en": "Capital gains tax",
  "he": "מס רווחי הון",
  "category": "personal",
  "explain": "Capital gains tax",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "capital-gain",
  "en": "Capital gain",
  "he": "רווח הון",
  "category": "personal",
  "explain": "Capital gain",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "pension",
  "en": "Pension",
  "he": "פנסיה",
  "category": "personal",
  "explain": "Pension",
  "aliases": [
   "פנסיה",
   "קרן פנסיה"
  ],
  "related": [],
  "tools": [
   "/learn"
  ]
 },
 {
  "id": "keren-hishtalmut",
  "en": "Keren Hishtalmut",
  "he": "קרן השתלמות",
  "category": "personal",
  "explain": "Keren Hishtalmut",
  "aliases": [
   "קרן השתלמות"
  ],
  "related": [],
  "tools": [
   "/learn"
  ]
 },
 {
  "id": "kupat-gemel",
  "en": "Kupat Gemel",
  "he": "קופת גמל",
  "category": "personal",
  "explain": "Kupat Gemel",
  "aliases": [
   "קופת גמל",
   "קופות גמל"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "emergency-fund",
  "en": "Emergency fund",
  "he": "קרן חירום",
  "category": "personal",
  "explain": "Emergency fund",
  "aliases": [
   "קרן חירום"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "asset-allocation",
  "en": "Asset allocation",
  "he": "הקצאת נכסים",
  "category": "portfolio",
  "explain": "Asset allocation",
  "aliases": [
   "הקצאת נכסים",
   "חלוקת נכסים"
  ],
  "related": [
   "diversification",
   "rebalancing",
   "risk-tolerance",
   "time-horizon"
  ],
  "tools": [
   "/strategy-lab"
  ]
 },
 {
  "id": "rebalancing",
  "en": "Rebalancing",
  "he": "איזון תיק",
  "category": "portfolio",
  "explain": "Rebalancing",
  "aliases": [
   "איזון מחדש",
   "איזון תיק"
  ],
  "related": [],
  "tools": [
   "/strategy-lab"
  ]
 },
 {
  "id": "dollar-cost-averaging",
  "en": "Dollar-cost averaging",
  "he": "מיצוע עלויות (DCA)",
  "category": "portfolio",
  "explain": "Dollar-cost averaging",
  "aliases": [
   "dca",
   "הוראת קבע להשקעה",
   "השקעה חודשית קבועה"
  ],
  "related": [],
  "tools": [
   "/calculator"
  ]
 },
 {
  "id": "buy-and-hold",
  "en": "Buy and hold",
  "he": "קנה והחזק",
  "category": "portfolio",
  "explain": "Buy and hold",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "lump-sum",
  "en": "Lump sum",
  "he": "השקעה חד-פעמית",
  "category": "portfolio",
  "explain": "Lump sum",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "passive-vs-active",
  "en": "Passive vs active",
  "he": "פסיבי מול אקטיבי",
  "category": "portfolio",
  "explain": "Passive vs active",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "hedge-fund",
  "en": "Hedge fund",
  "he": "קרן גידור",
  "category": "investments",
  "explain": "Hedge fund",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "reit",
  "en": "REIT",
  "he": "קרן ריט (REIT)",
  "category": "investments",
  "explain": "REIT",
  "aliases": [
   "ריט",
   "קרן ריט"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "options",
  "en": "Options",
  "he": "אופציות",
  "category": "investments",
  "explain": "Options",
  "aliases": [
   "אופציות",
   "אופציה"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "futures",
  "en": "Futures",
  "he": "חוזים עתידיים",
  "category": "investments",
  "explain": "Futures",
  "aliases": [
   "חוזים עתידיים"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "coupon",
  "en": "Coupon",
  "he": "קופון",
  "category": "investments",
  "explain": "Coupon",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "maturity",
  "en": "Maturity",
  "he": "פדיון",
  "category": "investments",
  "explain": "Maturity",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "credit-rating",
  "en": "Credit rating",
  "he": "דירוג אשראי",
  "category": "investments",
  "explain": "Credit rating",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "beta",
  "en": "Beta",
  "he": "בטא",
  "category": "portfolio",
  "explain": "Beta",
  "aliases": [
   "בטא"
  ],
  "related": [
   "volatility",
   "capm",
   "correlation"
  ],
  "tools": []
 },
 {
  "id": "drawdown",
  "en": "Drawdown",
  "he": "ירידה מהשיא (Drawdown)",
  "category": "portfolio",
  "explain": "Drawdown",
  "aliases": [
   "ירידה מהשיא",
   "max drawdown",
   "משיכה מקסימלית"
  ],
  "related": [
   "volatility",
   "risk",
   "sharpe-ratio"
  ],
  "tools": []
 },
 {
  "id": "buyback",
  "en": "Buyback",
  "he": "רכישה עצמית",
  "category": "investments",
  "explain": "Buyback",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "risk-tolerance",
  "en": "Risk tolerance",
  "he": "סיבולת סיכון",
  "category": "portfolio",
  "explain": "Risk tolerance",
  "aliases": [
   "סובלנות לסיכון",
   "סיבולת סיכון"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "time-horizon",
  "en": "Time horizon",
  "he": "אופק השקעה",
  "category": "portfolio",
  "explain": "Time horizon",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "the-4-rule",
  "en": "The 4% rule",
  "he": "כלל ה-4%",
  "category": "personal",
  "explain": "The 4% rule",
  "aliases": [
   "כלל ה-4%",
   "4% rule"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "rule-of-72",
  "en": "Rule of 72",
  "he": "כלל ה-72",
  "category": "personal",
  "explain": "Rule of 72",
  "aliases": [
   "כלל ה-72",
   "כלל 72"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "mortgage",
  "en": "Mortgage",
  "he": "משכנתא",
  "category": "personal",
  "explain": "Mortgage",
  "aliases": [
   "משכנתא",
   "משכנתאות"
  ],
  "related": [
   "amortization",
   "interest-rate"
  ],
  "tools": [
   "/loans"
  ]
 },
 {
  "id": "amortization",
  "en": "Amortization",
  "he": "לוח שפיצר",
  "category": "personal",
  "explain": "Amortization",
  "aliases": [
   "לוח שפיצר",
   "שפיצר",
   "amortization schedule",
   "loan schedule"
  ],
  "related": [
   "mortgage",
   "interest-rate"
  ],
  "tools": [
   "/loans"
  ]
 },
 {
  "id": "exchange-rate",
  "en": "Exchange rate",
  "he": "שער חליפין",
  "category": "markets",
  "explain": "Exchange rate",
  "aliases": [
   "שער חליפין",
   "שער דולר",
   "usd",
   "dollar",
   "דולר",
   "fx"
  ],
  "related": [],
  "tools": []
 },
 {
  "id": "hedging",
  "en": "Hedging",
  "he": "גידור",
  "category": "portfolio",
  "explain": "Hedging",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "inflation-linked",
  "en": "Inflation-linked",
  "he": "צמוד מדד",
  "category": "investments",
  "explain": "Inflation-linked",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "blue-chip",
  "en": "Blue chip",
  "he": "מניות צ'יפ כחול",
  "category": "investments",
  "explain": "Blue chip",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "growth-stock",
  "en": "Growth stock",
  "he": "מניית צמיחה",
  "category": "investments",
  "explain": "Growth stock",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "value-stock",
  "en": "Value stock",
  "he": "מניית ערך",
  "category": "investments",
  "explain": "Value stock",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "nav",
  "en": "NAV",
  "he": "שווי נכסי (NAV)",
  "category": "investments",
  "explain": "NAV",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "sector",
  "en": "Sector",
  "he": "סקטור",
  "category": "investments",
  "explain": "Sector",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "deposit-cd",
  "en": "Deposit / CD",
  "he": "פיקדון",
  "category": "investments",
  "explain": "Deposit / CD",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "sp-500",
  "en": "S&P 500",
  "he": "S&P 500",
  "category": "investments",
  "explain": "S&P 500",
  "aliases": ["S&P","SP500","SPX","S&P500","אס אנד פי","מדד S&P 500","מדד אס אנד פי"],
  "related": [],
  "tools": []
 },
 {
  "id": "robo-advisor",
  "en": "Robo-advisor",
  "he": "יועץ השקעות אוטומטי",
  "category": "investments",
  "explain": "Robo-advisor",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "where-to-start",
  "en": "Where to start",
  "he": "איך מתחילים",
  "category": "personal",
  "explain": "Where to start",
  "aliases": [],
  "related": [],
  "tools": []
 },
 {
  "id": "risk",
  "en": "Risk",
  "he": "סיכון",
  "category": "portfolio",
  "explain": "Risk",
  "aliases": [
   "סיכון",
   "investment risk"
  ],
  "related": [
   "volatility",
   "diversification",
   "risk-tolerance",
   "time-horizon"
  ],
  "tools": []
 },
 {
  "id": "sharpe-ratio",
  "en": "Sharpe Ratio",
  "he": "יחס שארפ",
  "aliases": [
   "Sharpe",
   "risk adjusted return",
   "תשואה מתואמת סיכון",
   "יחס תשואה לסיכון"
  ],
  "category": "portfolio",
  "related": [
   "volatility",
   "drawdown",
   "sortino-ratio",
   "alpha"
  ],
  "tools": [],
  "explain": "Sharpe Ratio"
 },
 {
  "id": "sortino-ratio",
  "en": "Sortino Ratio",
  "he": "יחס סורטינו",
  "aliases": [
   "Sortino"
  ],
  "category": "portfolio",
  "related": [
   "sharpe-ratio",
   "drawdown"
  ],
  "tools": [],
  "explain": "Sortino Ratio"
 },
 {
  "id": "alpha",
  "en": "Alpha",
  "he": "אלפא",
  "aliases": [
   "Jensen alpha"
  ],
  "category": "portfolio",
  "related": [
   "beta",
   "benchmark",
   "sharpe-ratio"
  ],
  "tools": [],
  "explain": "Alpha"
 },
 {
  "id": "correlation",
  "en": "Correlation",
  "he": "מתאם",
  "aliases": [
   "קורלציה"
  ],
  "category": "portfolio",
  "related": [
   "diversification",
   "beta"
  ],
  "tools": [],
  "explain": "Correlation"
 },
 {
  "id": "benchmark",
  "en": "Benchmark",
  "he": "מדד ייחוס",
  "aliases": [
   "benchmark index",
   "מדד השוואה"
  ],
  "category": "portfolio",
  "related": [
   "alpha",
   "sp-500"
  ],
  "tools": [],
  "explain": "Benchmark"
 },
 {
  "id": "portfolio-optimization",
  "en": "Portfolio Optimization",
  "he": "אופטימיזציית תיק",
  "aliases": [
   "efficient frontier",
   "הגבול היעיל",
   "mean variance"
  ],
  "category": "portfolio",
  "related": [
   "diversification",
   "sharpe-ratio",
   "asset-allocation"
  ],
  "tools": [],
  "explain": "Portfolio Optimization"
 },
 {
  "id": "capm",
  "en": "CAPM",
  "he": "מודל CAPM",
  "aliases": [
   "capital asset pricing model",
   "מודל תמחור נכסי הון"
  ],
  "category": "analysis",
  "related": [
   "beta",
   "alpha",
   "discount-rate"
  ],
  "tools": [],
  "explain": "CAPM"
 },
 {
  "id": "valuation",
  "en": "Valuation",
  "he": "הערכת שווי",
  "aliases": [
   "שווי הוגן",
   "fair value",
   "intrinsic value"
  ],
  "category": "analysis",
  "related": [
   "p-e-ratio",
   "dcf",
   "ev-ebitda"
  ],
  "tools": [],
  "explain": "Valuation"
 },
 {
  "id": "dcf",
  "en": "DCF",
  "he": "תזרים מהוון",
  "aliases": [
   "discounted cash flow",
   "היוון תזרימים",
   "דיסקאונט קאש פלו"
  ],
  "category": "analysis",
  "related": [
   "valuation",
   "discount-rate"
  ],
  "tools": [],
  "explain": "DCF"
 },
 {
  "id": "ev-ebitda",
  "en": "EV/EBITDA",
  "he": "מכפיל EV/EBITDA",
  "aliases": [
   "enterprise value",
   "שווי מפעל"
  ],
  "category": "analysis",
  "related": [
   "valuation",
   "p-e-ratio"
  ],
  "tools": [],
  "explain": "EV/EBITDA"
 },
 {
  "id": "discount-rate",
  "en": "Discount Rate",
  "he": "שיעור היוון",
  "aliases": [
   "שיעור ניכיון"
  ],
  "category": "analysis",
  "related": [
   "dcf",
   "interest-rate"
  ],
  "tools": [],
  "explain": "Discount Rate"
 },
 {
  "id": "duration",
  "en": "Duration",
  "he": "מח״מ",
  "aliases": [
   "מח\"מ",
   "משך חיים ממוצע",
   "bond duration"
  ],
  "category": "investments",
  "related": [
   "bond",
   "interest-rate"
  ],
  "tools": [],
  "explain": "Duration"
 },
 {
  "id": "yield",
  "en": "Yield",
  "he": "תשואה לפדיון",
  "aliases": [
   "ytm",
   "yield to maturity",
   "תשואה לפדיון"
  ],
  "category": "investments",
  "related": [
   "bond",
   "coupon"
  ],
  "tools": [],
  "explain": "Yield"
 },
 {
  "id": "aml",
  "en": "AML",
  "he": "איסור הלבנת הון",
  "aliases": [
   "anti money laundering",
   "הלבנת הון"
  ],
  "category": "regulation",
  "related": [
   "kyc",
   "compliance"
  ],
  "tools": [],
  "explain": "AML"
 },
 {
  "id": "kyc",
  "en": "KYC",
  "he": "הכר את הלקוח",
  "aliases": [
   "know your customer"
  ],
  "category": "regulation",
  "related": [
   "aml",
   "suitability"
  ],
  "tools": [],
  "explain": "KYC"
 },
 {
  "id": "suitability",
  "en": "Suitability",
  "he": "התאמה ללקוח",
  "aliases": [
   "התאמת השקעה"
  ],
  "category": "regulation",
  "related": [
   "kyc",
   "risk-tolerance"
  ],
  "tools": [],
  "explain": "Suitability"
 },
 {
  "id": "conflict-of-interest",
  "en": "Conflict of Interest",
  "he": "ניגוד עניינים",
  "aliases": [
   "conflicts of interest"
  ],
  "category": "regulation",
  "related": [
   "suitability",
   "compliance"
  ],
  "tools": [],
  "explain": "Conflict of Interest"
 },
 {
  "id": "market-abuse",
  "en": "Market Abuse",
  "he": "ניצול לרעה של שוק",
  "aliases": [
   "insider trading",
   "מסחר פנים",
   "מניפולציה בשוק"
  ],
  "category": "regulation",
  "related": [
   "compliance"
  ],
  "tools": [],
  "explain": "Market Abuse"
 },
 {
  "id": "compliance",
  "en": "Compliance",
  "he": "ציות ואכיפה",
  "aliases": [
   "רגולציה",
   "regtech"
  ],
  "category": "regulation",
  "related": [
   "aml",
   "kyc",
   "market-abuse"
  ],
  "tools": [],
  "explain": "Compliance"
 },
 {
  "id": "fundamental-analysis",
  "en": "Fundamental Analysis",
  "he": "ניתוח פונדמנטלי",
  "aliases": [
   "ניתוח בסיסי"
  ],
  "category": "analysis",
  "related": [
   "valuation",
   "eps",
   "p-e-ratio"
  ],
  "tools": [],
  "explain": "Fundamental Analysis"
 },
 {
  "id": "technical-analysis",
  "en": "Technical Analysis",
  "he": "ניתוח טכני",
  "aliases": [
   "טכני",
   "charts analysis"
  ],
  "category": "analysis",
  "related": [
   "rsi",
   "volatility"
  ],
  "tools": [],
  "explain": "Technical Analysis"
 },
 {
  "id": "financial-statements",
  "en": "Financial Statements",
  "he": "דוחות כספיים",
  "aliases": [
   "דוח רווח והפסד",
   "מאזן",
   "balance sheet",
   "income statement"
  ],
  "category": "finance",
  "related": [
   "eps",
   "valuation"
  ],
  "tools": [],
  "explain": "Financial Statements"
 },
 {
  "id": "portfolio-manager",
  "en": "Portfolio Manager",
  "he": "מנהל תיק",
  "aliases": [
   "מנהלת תיק",
   "pm"
  ],
  "category": "careers",
  "related": [
   "asset-allocation",
   "sharpe-ratio"
  ],
  "tools": [
   "/career-lab"
  ],
  "explain": "Portfolio Manager"
 },
 {
  "id": "investment-analyst",
  "en": "Investment Analyst",
  "he": "אנליסט השקעות",
  "aliases": [
   "אנליסט",
   "equity research",
   "מחקר מניות"
  ],
  "category": "careers",
  "related": [
   "valuation",
   "fundamental-analysis"
  ],
  "tools": [
   "/career-lab"
  ],
  "explain": "Investment Analyst"
 },
 {"id":"t-bill","en":"T-bill","he":"אג״ח קצרה ממשלתית","aliases":["treasury bill","מק״מ","מקמ","שטר חוב ממשלתי"],"category":"investments","related":["bond","maturity","interest-rate"],"tools":[],"explain":"T-bill"},
 {"id":"insurance","en":"Insurance","he":"ביטוח","aliases":["insurance", "ביטוח", "ביטוחים"],"category":"personal","related":["risk", "emergency-fund"],"tools":[],"explain":"Insurance"},
 {"id":"premium","en":"Premium","he":"פרמיה","aliases":["insurance premium", "premium", "פרמיה", "פרמיית ביטוח"],"category":"personal","related":["insurance", "deductible"],"tools":[],"explain":"Premium"},
 {"id":"deductible","en":"Deductible","he":"השתתפות עצמית","aliases":["deductible", "excess", "השתתפות עצמית"],"category":"personal","related":["insurance", "premium"],"tools":[],"explain":"Deductible"},
 {"id":"life-insurance","en":"Life insurance","he":"ביטוח חיים","aliases":["life insurance", "ביטוח חיים"],"category":"personal","related":["insurance", "premium", "mortgage"],"tools":[],"explain":"Life insurance"},
 {"id":"health-insurance","en":"Health insurance","he":"ביטוח בריאות","aliases":["health insurance", "medical insurance", "ביטוח בריאות", "ביטוח רפואי"],"category":"personal","related":["insurance", "premium", "deductible"],"tools":[],"explain":"Health insurance"},
 {"id":"car-insurance","en":"Car insurance","he":"ביטוח רכב","aliases":["car insurance", "auto insurance", "ביטוח רכב"],"category":"personal","related":["insurance", "premium", "deductible"],"tools":[],"explain":"Car insurance"},
 {"id":"credit-score","en":"Credit score","he":"דירוג אשראי","aliases":["credit score", "credit rating of a person", "דירוג אשראי", "ציון אשראי"],"category":"personal","related":["interest-rate", "mortgage"],"tools":[],"explain":"Credit score"},
 {"id":"apr","en":"APR (annual percentage rate)","he":"ריבית שנתית אפקטיבית","aliases":["apr", "annual percentage rate", "effective interest rate", "ריבית אפקטיבית"],"category":"personal","related":["interest-rate", "mortgage", "compound-interest"],"tools":[],"explain":"APR (annual percentage rate)"},
 {"id":"fixed-vs-variable-rate","en":"Fixed vs variable rate","he":"ריבית קבועה מול משתנה","aliases":["fixed rate", "variable rate", "fixed vs variable", "ריבית קבועה", "ריבית משתנה", "פריים"],"category":"personal","related":["interest-rate", "mortgage", "apr"],"tools":[],"explain":"Fixed vs variable rate"},
 {"id":"refinancing","en":"Refinancing","he":"מחזור הלוואה","aliases":["refinance", "refinancing", "מחזור", "מחזור משכנתא", "מחזור הלוואה"],"category":"personal","related":["mortgage", "interest-rate", "apr"],"tools":[],"explain":"Refinancing"},
 {"id":"budget","en":"Budget","he":"תקציב","aliases":["budget", "household budget", "תקציב", "תקציב משק בית"],"category":"personal","related":["emergency-fund", "pension"],"tools":[],"explain":"Budget"},
 {"id":"net-worth","en":"Net worth","he":"שווי נטו","aliases":["net worth", "שווי נטו", "הון נטו"],"category":"personal","related":["emergency-fund", "budget"],"tools":[],"explain":"Net worth"},
 {"id":"credit-card","en":"Credit card","he":"כרטיס אשראי","aliases":["credit card", "כרטיס אשראי", "אשראי בכרטיס"],"category":"personal","related":["apr", "credit-score", "budget"],"tools":[],"explain":"Credit card"},
 {"id":"overdraft","en":"Overdraft","he":"משיכת יתר","aliases":["overdraft", "משיכת יתר", "מינוס בחשבון", "אוברדרפט"],"category":"personal","related":["apr", "budget"],"tools":[],"explain":"Overdraft"},
 {"id":"stop-loss","en":"Stop-loss","he":"פקודת סטופ לוס","aliases":["stop loss", "stop-loss", "סטופ לוס", "סטופ-לוס"],"category":"personal","related":["market-order", "limit-order", "risk"],"tools":[],"explain":"Stop-loss"},
 {"id":"recession","en":"Recession","he":"מיתון","aliases":["recession", "מיתון", "האטה כלכלית"],"category":"personal","related":["inflation", "interest-rate", "gdp"],"tools":[],"explain":"Recession"},
 {"id":"gdp","en":"GDP","he":"תוצר מקומי גולמי","aliases":["gdp", "gross domestic product", "תמ\"ג", "תוצר מקומי גולמי", "תוצר"],"category":"personal","related":["inflation", "recession"],"tools":[],"explain":"GDP"},
 {"id":"investment-scam","en":"Investment scam","he":"הונאת השקעות","aliases":["investment scam", "scam", "fraud", "ponzi", "פירמידה", "הונאה", "הונאת השקעות", "נוכל"],"category":"personal","related":["risk", "kyc"],"tools":[],"explain":"Investment scam"},
 {"id":"annuity","en":"Annuity","he":"קצבה","aliases":["annuity", "קצבה", "קצבת פנסיה"],"category":"personal","related":["pension", "kupat-gemel"],"tools":[],"explain":"Annuity"}
];
