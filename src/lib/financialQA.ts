// ---------------------------------------------------------------------------
// InvestED — Deterministic Financial Q&A Engine
//
// Answers financial questions and calculations directly and deterministically,
// in Hebrew and English. Market-dependent answers (holdings value, buying
// power, currency conversion) load real data through the injected asset
// loader and refuse to use simulated values. Missing inputs produce a
// focused clarification instead of a guess. Educational only, never advice.
// ---------------------------------------------------------------------------

import type { AssetAnalysis } from "@/types";
import { extractAssets } from "./conversationContext";
import {
  calculatePurchasePower,
  fxSymbolFor,
  parseHoldingRequest,
  parsePurchasePowerRequest,
  valueHolding,
  type HoldingRequest,
  type HoldingValuation,
  type PurchasePowerRequest,
  type PurchasePowerResult,
} from "./financialEducation";
import { computeSchpitzer, parseLoanQuery } from "./loanEngine";

export type QALanguage = "he" | "en";

export type AssetLoader = (symbol: string) => Promise<AssetAnalysis | null>;

export interface QAToolResult {
  tool: string;
  values: Record<string, string | number | boolean | null>;
  formula?: string;
  assumptions: string[];
  provenanceSymbols: string[];
}

export interface QAOutcome {
  kind: string;
  text: string;
  /** True when the answer is a focused clarification question. */
  clarifying: boolean;
  assets: AssetAnalysis[];
  holdingValuation: HoldingValuation | null;
  purchasePower: PurchasePowerResult | null;
  toolResult: QAToolResult | null;
  monetaryResult: { amount: number; currency: QACurrency } | null;
}

export interface QAPlan {
  kind: string;
  execute(load: AssetLoader): Promise<QAOutcome>;
}

/** Follow-up memory so "ועם 500 אלף?" can reuse the previous question. */
export interface QAMemory {
  purchase: PurchasePowerRequest | null;
  holding: HoldingRequest | null;
  fx: { amount: number; from: QACurrency; to: QACurrency } | null;
  lastMonetaryResult: { amount: number; currency: QACurrency } | null;
}

export function createQAMemory(): QAMemory {
  return { purchase: null, holding: null, fx: null, lastMonetaryResult: null };
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

type QACurrency = "ILS" | "USD" | "EUR" | "GBP";

const NUM = "([\\d][\\d,]*(?:\\.\\d+)?)";
const UNIT = "(אלף|מיליון|מיליארד|thousand|million|billion|[kKmM])?";
const PCT = "(\\d+(?:\\.\\d+)?)\\s*%";
const CCY_WORD = "(שקלים|שקל|ש[\"״']?ח|₪|ILS|NIS|דולרים|דולר|\\$|USD|dollars?|יורו|€|EUR|euros?|פאונד|£|GBP|pounds?)";
const AMOUNT_RE = `(?!\\d[\\d,]*(?:\\.\\d+)?\\s*%)${NUM}\\s*${UNIT}(?:\\s*${CCY_WORD})?(?!\\s*%)`;

function parseNum(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const value = Number(raw.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function scaled(raw: string | undefined | null, unit?: string | null): number | null {
  const base = parseNum(raw);
  if (base === null) return null;
  if (!unit) return base;
  if (/אלף|thousand|^[kK]$/i.test(unit)) return base * 1_000;
  if (/מיליון|million|^[mM]$/i.test(unit)) return base * 1_000_000;
  if (/מיליארד|billion/i.test(unit)) return base * 1_000_000_000;
  return base;
}

function currencyOf(raw: string | undefined | null): QACurrency | null {
  if (!raw) return null;
  if (/שקל|ש["״']?ח|₪|\bils\b|\bnis\b/i.test(raw)) return "ILS";
  if (/דולר|\$|\busd\b|dollars?/i.test(raw)) return "USD";
  if (/יורו|€|\beur\b|euros?/i.test(raw)) return "EUR";
  if (/פאונד|£|\bgbp\b|pounds?/i.test(raw)) return "GBP";
  return null;
}

function fmt(value: number, lang: QALanguage, digits = 2): string {
  return value.toLocaleString(lang === "he" ? "he-IL" : "en-US", { maximumFractionDigits: digits });
}

const EDU: Record<QALanguage, string> = {
  he: "זהו חישוב לימודי, לא ייעוץ השקעות.",
  en: "This is an educational calculation, not investment advice.",
};

const FOLLOW_UP_START = /^(?:ומה|מה|ועם|אז|טוב|and|what|how|so|ok)/i;

function isShortFollowUp(message: string): boolean {
  const trimmed = message.trim();
  return trimmed.length <= 60 && FOLLOW_UP_START.test(trimmed);
}

function isRealAsset(asset: AssetAnalysis | null | undefined): asset is AssetAnalysis {
  return !!asset && !asset.isMock && asset.freshness !== "simulated";
}

function marketNote(lang: QALanguage, stale: boolean): string {
  if (stale) return lang === "he" ? "שים לב: הנתון עלול להיות לא עדכני." : "Note: the data may be stale.";
  return lang === "he" ? "לפי נתון השוק האחרון שזמין מהספק." : "Based on the latest market data available from the provider.";
}

function outcome(kind: string, text: string, opts?: Partial<QAOutcome>): QAOutcome {
  return {
    kind,
    text,
    clarifying: opts?.clarifying ?? false,
    assets: opts?.assets ?? [],
    holdingValuation: opts?.holdingValuation ?? null,
    purchasePower: opts?.purchasePower ?? null,
    toolResult: opts?.toolResult ?? null,
    monetaryResult: opts?.monetaryResult ?? null,
  };
}

function clarifyPlan(kind: string, text: string): QAPlan {
  return { kind, execute: async () => outcome(kind, text, { clarifying: true }) };
}

function textPlan(kind: string, text: string): QAPlan {
  return { kind, execute: async () => outcome(kind, text) };
}

// ---------------------------------------------------------------------------
// Holdings valuation (with follow-up memory)
// ---------------------------------------------------------------------------

function planHolding(message: string, memory: QAMemory): HoldingRequest | null {
  const parsed = parseHoldingRequest(message);
  if (parsed) return parsed;
  if (!memory.holding || !isShortFollowUp(message)) return null;
  // "ועם 200 מניות?" / "and 50 shares?" keep the symbol.
  const qtyOnly = message.match(new RegExp(`^[^\\d]{0,25}${NUM}\\s*(?:מניות|יחידות|shares?)\\s*\\??$`, "i"));
  if (qtyOnly && memory.holding.symbol) {
    const quantity = parseNum(qtyOnly[1]);
    if (quantity && quantity > 0) return { quantity, symbol: memory.holding.symbol };
  }
  // "ומה עם NVDA?" keep the quantity.
  const assets = extractAssets(message);
  if (assets.length === 1) {
    return { quantity: memory.holding.quantity, symbol: assets[0] };
  }
  return null;
}

function holdingPlan(request: HoldingRequest, lang: QALanguage): QAPlan {
  return {
    kind: "holding_valuation",
    async execute(load) {
      if (!request.symbol) {
        return outcome(
          "holding_valuation",
          lang === "he"
            ? "איזו מניה? ציין את הסמל, למשל: מה השווי של 100 מניות AAPL?"
            : "Which stock? Name the symbol, for example: what is the value of 100 AAPL shares?",
          { clarifying: true }
        );
      }
      const asset = await load(request.symbol);
      const valuation = valueHolding(request, asset ?? undefined);
      if (!valuation.available) {
        const text = lang === "he"
          ? `אי אפשר לחשב כרגע שווי מהימן עבור ${fmt(request.quantity, lang)} מניות ${request.symbol}, כי נתוני שוק אמיתיים אינם זמינים מהספק. לא אשתמש בנתונים מדומים לחישוב שווי. כדאי לנסות שוב מאוחר יותר.`
          : `I cannot calculate a trustworthy current value for ${fmt(request.quantity, lang)} ${request.symbol} shares because real market data is unavailable right now. I will not use simulated data for a holdings valuation. Please try again later.`;
        return outcome("holding_valuation", text, { holdingValuation: valuation });
      }
      const ccy = valuation.currency ?? "";
      const stale = asset?.freshness === "stale";
      const text = lang === "he"
        ? `${fmt(valuation.quantity, lang)} מניות ${valuation.symbol} × ${fmt(valuation.price, lang)} ${ccy} = ${fmt(valuation.total, lang)} ${ccy}. זהו שווי שוק נקודתי לפני עמלות ומסים. ${marketNote(lang, stale)} ${EDU.he}`
        : `${fmt(valuation.quantity, lang)} ${valuation.symbol} shares × ${fmt(valuation.price, lang)} ${ccy} = ${fmt(valuation.total, lang)} ${ccy}. This is a point-in-time market valuation before fees and taxes. ${marketNote(lang, stale)} ${EDU.en}`;
      return outcome("holding_valuation", text, {
        holdingValuation: valuation,
        assets: asset ? [asset] : [],
        monetaryResult: { amount: valuation.total, currency: (valuation.currency ?? "USD") as QACurrency },
        toolResult: {
          tool: "holding_value",
          values: { quantity: valuation.quantity, symbol: valuation.symbol, price: valuation.price, total: valuation.total, currency: valuation.currency },
          formula: "quantity × market price",
          assumptions: ["before fees and taxes"],
          provenanceSymbols: asset ? [asset.symbol] : [],
        },
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Buying power (with follow-up memory and FX loading)
// ---------------------------------------------------------------------------

const AMOUNT_CCY_ONLY = new RegExp(`^[^\\dA-Z]{0,25}${NUM}\\s*${UNIT}\\s*${CCY_WORD}\\s*\\??$`, "i");
const AMOUNT_ONLY = new RegExp(`^[^\\dA-Z]{0,25}${NUM}\\s*${UNIT}\\s*\\??$`, "i");

function planPurchase(message: string, memory: QAMemory): PurchasePowerRequest | null {
  const parsed = parsePurchasePowerRequest(message);
  if (parsed) return parsed;
  if (!memory.purchase || !isShortFollowUp(message)) return null;
  // "ועם 500 אלף שקל?" / "with 20,000 dollars?"
  let m = message.match(AMOUNT_CCY_ONLY);
  if (m) {
    const amount = scaled(m[1], m[2]);
    const ccy = currencyOf(m[3]);
    if (amount && ccy) return { amount, sourceCurrency: ccy, symbol: memory.purchase.symbol };
  }
  // "ועם 500 אלף?" (amount only, keep currency)
  m = message.match(AMOUNT_ONLY);
  if (m) {
    const amount = scaled(m[1], m[2]);
    if (amount) return { amount, sourceCurrency: memory.purchase.sourceCurrency, symbol: memory.purchase.symbol };
  }
  // "ומה עם QQQ?" (new symbol, keep amount and currency)
  const assets = extractAssets(message);
  if (assets.length === 1) {
    return { amount: memory.purchase.amount, sourceCurrency: memory.purchase.sourceCurrency, symbol: assets[0] };
  }
  return null;
}

function purchasePlan(request: PurchasePowerRequest, lang: QALanguage): QAPlan {
  return {
    kind: "purchase_power",
    async execute(load) {
      const asset = await load(request.symbol);
      const targetCurrency = asset?.currency ?? null;
      const pair = targetCurrency ? fxSymbolFor(request.sourceCurrency, targetCurrency) : null;
      const fx = pair?.symbol ? await load(pair.symbol) : null;
      const result = calculatePurchasePower(request, asset ?? undefined, fx ?? undefined);
      const assets = [asset, fx].filter((a): a is AssetAnalysis => !!a);
      if (!result.available) {
        const text = lang === "he"
          ? "אי אפשר לחשב כרגע כוח קנייה מהימן כי מחיר הנכס או שער המטבע העדכני אינם זמינים מהספק. לא אחליף אותם בנתונים מדומים. עמלות, מרווח המרה, מסים ותמיכה במניות חלקיות תלויים גם בברוקר."
          : "I cannot calculate reliable buying power right now because current asset-price or FX data is unavailable from the provider. I will not substitute simulated values. Fees, FX spread, taxes, and fractional-share support also depend on the broker.";
        return outcome("purchase_power", text, { purchasePower: result, assets });
      }
      const stale = assets.some((item) => item.freshness === "stale");
      const needsFx = result.fx !== null;
      const firstStep = needsFx
        ? lang === "he"
          ? `${fmt(result.amount, lang)} ${result.sourceCurrency} ÷ ${fmt(result.fxRate ?? 1, lang, 4)} = ${fmt(result.convertedBudget ?? 0, lang)} ${result.assetCurrency}`
          : `${fmt(result.amount, lang)} ${result.sourceCurrency} ÷ ${fmt(result.fxRate ?? 1, lang, 4)} = ${fmt(result.convertedBudget ?? 0, lang)} ${result.assetCurrency}`
        : `${fmt(result.amount, lang)} ${result.sourceCurrency}`;
      const text = lang === "he"
        ? `עם ${fmt(result.amount, lang)} ${result.sourceCurrency}: ${firstStep}; מחלקים במחיר מניה ${fmt(result.assetPrice ?? 0, lang)} ${result.assetCurrency}. ניתן לקנות ${fmt(result.wholeShares ?? 0, lang, 0)} מניות שלמות של ${result.symbol}, ויישארו בערך ${fmt(result.residualAssetCurrency ?? 0, lang)} ${result.assetCurrency} (${fmt(result.residualSourceCurrency ?? 0, lang)} ${result.sourceCurrency}). החישוב אינו כולל עמלות מסחר, מרווח המרה, מסים או מניות חלקיות. ${marketNote(lang, stale)} ${EDU.he}`
        : `With ${fmt(result.amount, lang)} ${result.sourceCurrency}: ${firstStep}; divided by the ${result.symbol} share price of ${fmt(result.assetPrice ?? 0, lang)} ${result.assetCurrency}. You can buy ${fmt(result.wholeShares ?? 0, lang, 0)} whole shares, leaving about ${fmt(result.residualAssetCurrency ?? 0, lang)} ${result.assetCurrency} (${fmt(result.residualSourceCurrency ?? 0, lang)} ${result.sourceCurrency}). This excludes brokerage fees, FX spread, taxes, and fractional shares. ${marketNote(lang, stale)} ${EDU.en}`;
      return outcome("purchase_power", text, { purchasePower: result, assets });
    },
  };
}

// ---------------------------------------------------------------------------
// Live currency conversion
// ---------------------------------------------------------------------------

const FX_PATTERNS: RegExp[] = [
  new RegExp(`(?:כמה זה|כמה זו|כמה הם|להמיר|המרה של|מה שווה|מה שווים)\\s*${NUM}\\s*${UNIT}\\s*${CCY_WORD}\\s*(?:ב|ל)-?\\s*${CCY_WORD}`, "i"),
  new RegExp(`(?:convert|how much is|how much are|what is)\\s*${NUM}\\s*${UNIT}\\s*${CCY_WORD}\\s*(?:to|into|in)\\s*${CCY_WORD}`, "i"),
  new RegExp(`^\\s*${NUM}\\s*${UNIT}\\s*${CCY_WORD}\\s*(?:to|into|in|ב|ל)-?\\s*${CCY_WORD}\\s*\\??$`, "i"),
];

function planFx(message: string, memory: QAMemory): { amount: number; from: QACurrency; to: QACurrency } | null {
  for (const pattern of FX_PATTERNS) {
    const m = message.match(pattern);
    if (!m) continue;
    const amount = scaled(m[1], m[2]);
    const from = currencyOf(m[3]);
    const to = currencyOf(m[4]);
    if (amount && from && to && from !== to) return { amount, from, to };
  }
  if (memory.lastMonetaryResult && isShortFollowUp(message)) {
    const targetOnly = message.match(/(?:ב|ל|to|into|in)(?:כמה\s+|\s+is\s+that\s+in\s+)?[-\s]*(שקלים|שקל|ש["״']?ח|₪|ILS|NIS|דולרים|דולר|\$|USD|dollars?|יורו|€|EUR|euros?|פאונד|£|GBP|pounds?)/i);
    const directCurrency = message.match(/(Israeli\s+shekels?|shekels?|שקלים|שקל|ש["״']?ח|₪|ILS|NIS|dollars?|דולרים|דולר|USD|euros?|יורו|EUR|pounds?|פאונד|GBP)/i);
    const normalizedTarget = /Israeli\s+shekels?|shekels?/i.test(directCurrency?.[1] ?? "") ? "ILS" : directCurrency?.[1];
    const to = currencyOf(targetOnly?.[1] ?? normalizedTarget);
    if (to && to !== memory.lastMonetaryResult.currency) {
      return { amount: memory.lastMonetaryResult.amount, from: memory.lastMonetaryResult.currency, to };
    }
  }
  if (memory.fx && isShortFollowUp(message)) {
    // "וביורו?" keep amount and source, change target.
    const toM = message.match(new RegExp(`(?:ב|ל|to|into|in)-?\\s*${CCY_WORD}\\s*\\??$`, "i"));
    const to = currencyOf(toM?.[1]);
    if (to && to !== memory.fx.from) return { amount: memory.fx.amount, from: memory.fx.from, to };
    // "ועם 2,000 דולר?" change amount and keep target.
    const a = message.match(AMOUNT_CCY_ONLY);
    if (a) {
      const amount = scaled(a[1], a[2]);
      const from = currencyOf(a[3]);
      if (amount && from) return { amount, from, to: memory.fx.to };
    }
  }
  return null;
}

async function fxRateViaUsd(load: AssetLoader, from: QACurrency, to: QACurrency): Promise<{ rate: number; assets: AssetAnalysis[] } | null> {
  const assets: AssetAnalysis[] = [];
  let inUsd = 1;
  if (from !== "USD") {
    const pairFrom = fxSymbolFor(from, "USD");
    if (!pairFrom?.symbol) return null;
    const asset = await load(pairFrom.symbol);
    if (!isRealAsset(asset) || asset.price <= 0) return null;
    assets.push(asset);
    inUsd = pairFrom.divide ? 1 / asset.price : asset.price;
  }
  let usdToTarget = 1;
  if (to !== "USD") {
    const pairTo = fxSymbolFor("USD", to);
    if (!pairTo?.symbol) return null;
    const asset = await load(pairTo.symbol);
    if (!isRealAsset(asset) || asset.price <= 0) return null;
    assets.push(asset);
    usdToTarget = pairTo.divide ? 1 / asset.price : asset.price;
  }
  return { rate: inUsd * usdToTarget, assets };
}

function fxPlan(request: { amount: number; from: QACurrency; to: QACurrency }, lang: QALanguage): QAPlan {
  return {
    kind: "fx_convert",
    async execute(load) {
      const result = await fxRateViaUsd(load, request.from, request.to);
      if (!result) {
        return outcome(
          "fx_convert",
          lang === "he"
            ? `אי אפשר להמיר כרגע ${request.from} ל-${request.to} כי שער החליפין העדכני אינו זמין מהספק. לא אשתמש בשער מדומה. כדאי לנסות שוב מאוחר יותר.`
            : `I cannot convert ${request.from} to ${request.to} right now because the current exchange rate is unavailable from the provider. I will not use a simulated rate. Please try again later.`
        );
      }
      const converted = request.amount * result.rate;
      const stale = result.assets.some((a) => a.freshness === "stale");
      const text = lang === "he"
        ? `${fmt(request.amount, lang)} ${request.from} הם בערך ${fmt(converted, lang)} ${request.to} לפי שער ${fmt(result.rate, lang, 4)}. המרה בפועל בבנק או בברוקר כוללת בדרך כלל מרווח ועמלה. ${marketNote(lang, stale)}`
        : `${fmt(request.amount, lang)} ${request.from} is about ${fmt(converted, lang)} ${request.to} at a rate of ${fmt(result.rate, lang, 4)}. An actual bank or broker conversion usually adds a spread and fee. ${marketNote(lang, stale)}`;
      return outcome("fx_convert", text, {
        assets: result.assets,
        monetaryResult: { amount: converted, currency: request.to },
        toolResult: {
          tool: "fx_convert",
          values: { amount: request.amount, from: request.from, to: request.to, rate: result.rate, converted },
          formula: "amount × verified FX rate",
          assumptions: ["provider rate; bank or broker spread excluded"],
          provenanceSymbols: result.assets.map((asset) => asset.symbol),
        },
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Pure deterministic calculations
// ---------------------------------------------------------------------------

function percentCalc(message: string, lang: QALanguage): QAPlan | null {
  // "80,000 פלוס 15%" / "80,000 plus 15%"
  let m = message.match(new RegExp(`${NUM}\\s*${UNIT}\\s*(?:פלוס|ועוד|plus)\\s*${PCT}`, "i"));
  if (m) {
    const base = scaled(m[1], m[2]);
    const pct = parseNum(m[3]);
    if (base && pct !== null) {
      const added = (base * pct) / 100;
      const total = base + added;
      return textPlan("percent_increase", lang === "he"
        ? `${fmt(base, lang)} + ${fmt(pct, lang)}% = ${fmt(added, lang)} תוספת, סה״כ ${fmt(total, lang)}.`
        : `${fmt(base, lang)} + ${fmt(pct, lang)}% = ${fmt(added, lang)} increase, total ${fmt(total, lang)}.`);
    }
  }
  // "80,000 פחות 15%" / "80,000 minus 15%" (discount)
  m = message.match(new RegExp(`${NUM}\\s*${UNIT}\\s*(?:מינוס|פחות|minus|less)\\s*${PCT}`, "i"));
  if (m) {
    const base = scaled(m[1], m[2]);
    const pct = parseNum(m[3]);
    if (base && pct !== null) {
      const removed = (base * pct) / 100;
      const total = base - removed;
      return textPlan("percent_decrease", lang === "he"
        ? `${fmt(base, lang)} - ${fmt(pct, lang)}% = ${fmt(removed, lang)} הפחתה, נשאר ${fmt(total, lang)}.`
        : `${fmt(base, lang)} - ${fmt(pct, lang)}% = ${fmt(removed, lang)} off, leaving ${fmt(total, lang)}.`);
    }
  }
  // "כמה זה 15% מ-80,000?" / "what is 15% of 80,000?"
  m = message.match(new RegExp(`${PCT}\\s*(?:מ(?:ן)?[\\s־-]*|של\\s+|of\\s+)${NUM}\\s*${UNIT}(?:\\s*${CCY_WORD})?`, "i"));
  if (m) {
    const pct = parseNum(m[1]);
    const base = scaled(m[2], m[3]);
    const ccy = currencyOf(m[4]);
    if (pct !== null && base) {
      const value = (base * pct) / 100;
      const suffix = ccy ? ` ${ccy}` : "";
      return textPlan("percent_of", lang === "he"
        ? `${fmt(pct, lang)}% מתוך ${fmt(base, lang)}${suffix} = ${fmt(value, lang)}${suffix}.`
        : `${fmt(pct, lang)}% of ${fmt(base, lang)}${suffix} = ${fmt(value, lang)}${suffix}.`);
    }
  }
  // "כמה אחוזים זה 50 מתוך 200?" / "what percent is 50 of 200?"
  m = message.match(new RegExp(`(?:כמה אחוזים?(?:\\s+זה|\\s+זו)?|what percent(?:age)?(?:\\s+is)?|how many percent)\\s*${NUM}\\s*(?:מתוך|מ-?|of|out of)\\s*${NUM}`, "i"))
    ?? message.match(new RegExp(`${NUM}\\s*(?:מתוך|מ-?)\\s*${NUM}\\s*באחוזים`, "i"));
  if (m) {
    const part = parseNum(m[1]);
    const whole = parseNum(m[2]);
    if (part !== null && whole) {
      return textPlan("part_of", lang === "he"
        ? `${fmt(part, lang)} מתוך ${fmt(whole, lang)} = ${fmt((part / whole) * 100, lang)}%.`
        : `${fmt(part, lang)} out of ${fmt(whole, lang)} = ${fmt((part / whole) * 100, lang)}%.`);
    }
  }
  return null;
}

function percentChangeCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/עלה|עלתה|ירד|ירדה|גדל|גדלה|עליות|ירידות|שינוי|rose|fell|grew|dropped|went|increased|decreased|changed/i.test(message)) return null;
  const m = message.match(new RegExp(`מ[\\s־-]*${NUM}\\s*${UNIT}\\s*ל[\\s־-]*${NUM}\\s*${UNIT}`, "i"))
    ?? message.match(new RegExp(`from\\s*${NUM}\\s*${UNIT}\\s*to\\s*${NUM}\\s*${UNIT}`, "i"));
  if (!m) return null;
  const from = scaled(m[1], m[2]);
  const to = scaled(m[3], m[4]);
  if (!from || !to || from === 0) return null;
  const changePct = ((to - from) / from) * 100;
  const dirHe = changePct >= 0 ? "עלייה" : "ירידה";
  const dirEn = changePct >= 0 ? "increase" : "decrease";
  return textPlan("percent_change", lang === "he"
    ? `מ-${fmt(from, lang)} ל-${fmt(to, lang)} זו ${dirHe} של ${fmt(Math.abs(changePct), lang)}%.`
    : `From ${fmt(from, lang)} to ${fmt(to, lang)} is a ${fmt(Math.abs(changePct), lang)}% ${dirEn}.`);
}

function recoveryCalc(message: string, lang: QALanguage): QAPlan | null {
  const down = message.match(new RegExp(`ירד(?:ה)?\\s+ב?[\\s־-]*${PCT}`, "i"))
    ?? message.match(new RegExp(`(?:down|fell|lost|drop(?:ped)?)\\s*(?:by)?\\s*${PCT}`, "i"));
  if (down && /לעלות|עלות|להתאושש|לחזור|חזרה|recover|break.?even|get back|back to/i.test(message)) {
    const pct = parseNum(down[1]);
    if (pct !== null && pct > 0 && pct < 100) {
      const needed = (pct / (100 - pct)) * 100;
      return textPlan("recovery", lang === "he"
        ? `אחרי ירידה של ${fmt(pct, lang)}% צריך עלייה של ${fmt(needed, lang)}% כדי לחזור לנקודת הפתיחה - ירידה שוחקת את הבסיס, ולכן העלייה הנדרשת גדולה יותר.`
        : `After a ${fmt(pct, lang)}% drop you need a ${fmt(needed, lang)}% gain to break even - the drop shrinks the base, so the required gain is larger.`);
    }
  }
  const up = message.match(new RegExp(`עלה(?:ה)?\\s+ב?[\\s־-]*${PCT}`, "i"))
    ?? message.match(new RegExp(`(?:up|rose|gained)\\s*(?:by)?\\s*${PCT}`, "i"));
  if (up && /לרדת|ירידה|לחזור|חזרה|back|give back/i.test(message)) {
    const pct = parseNum(up[1]);
    if (pct !== null && pct > 0) {
      const giveBack = (pct / (100 + pct)) * 100;
      return textPlan("give_back", lang === "he"
        ? `אחרי עלייה של ${fmt(pct, lang)}%, ירידה של ${fmt(giveBack, lang)}% מחזירה לנקודת הפתיחה.`
        : `After a ${fmt(pct, lang)}% gain, a ${fmt(giveBack, lang)}% drop returns you to break even.`);
    }
  }
  return null;
}

function gainLossCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/קניתי|bought/i.test(message)) return null;
  if (!/מכרתי|sold|עכשיו|והיום|היום|now|today|currently|current/i.test(message)) return null;
  const qtyM = message.match(new RegExp(`${NUM}\\s*(?:מניות|יחידות|shares?)`, "i"));
  const numbers = [...message.matchAll(new RegExp(NUM, "g"))].map((m) => parseNum(m[1])).filter((n): n is number => n !== null);
  if (numbers.length < 2) return null;
  let quantity: number | null = null;
  let buy: number | null = null;
  let sell: number | null = null;
  if (qtyM && numbers.length >= 3) {
    quantity = numbers[0];
    buy = numbers[1];
    sell = numbers[2];
  } else {
    buy = numbers[0];
    sell = numbers[1];
  }
  if (!buy || !sell || buy <= 0) return null;
  const perUnit = sell - buy;
  const pct = (perUnit / buy) * 100;
  const profitWord = perUnit >= 0 ? (lang === "he" ? "רווח" : "gain") : lang === "he" ? "הפסד" : "loss";
  const base = lang === "he"
    ? `קנייה ב-${fmt(buy, lang)} ומכירה/שווי נוכחי ${fmt(sell, lang)}: ${profitWord} של ${fmt(Math.abs(perUnit), lang)} למניה (${fmt(Math.abs(pct), lang)}%)`
    : `Bought at ${fmt(buy, lang)}, sold/now ${fmt(sell, lang)}: a ${profitWord} of ${fmt(Math.abs(perUnit), lang)} per share (${fmt(Math.abs(pct), lang)}%)`;
  if (quantity) {
    const total = perUnit * quantity;
    return textPlan("gain_loss", lang === "he"
      ? `${base}; על ${fmt(quantity, lang)} מניות: ${profitWord} כולל של ${fmt(Math.abs(total), lang)} לפני עמלות ומס. ${EDU.he}`
      : `${base}; on ${fmt(quantity, lang)} shares: a total ${profitWord} of ${fmt(Math.abs(total), lang)} before fees and taxes. ${EDU.en}`);
  }
  return textPlan("gain_loss", `${base}. ${lang === "he" ? EDU.he : EDU.en}`);
}

function cagrCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/cagr|תשואה\s+ה?שנתית|קצב\s+(?:ה)?צמיחה|annual\s+(?:return|growth)|average\s+annual/i.test(message)) return null;
  const m = message.match(new RegExp(`מ[\\s־-]*${NUM}\\s*${UNIT}\\s*ל[\\s־-]*${NUM}\\s*${UNIT}`, "i"))
    ?? message.match(new RegExp(`from\\s*${NUM}\\s*${UNIT}\\s*to\\s*${NUM}\\s*${UNIT}`, "i"))
    ?? message.match(new RegExp(`${NUM}\\s*${UNIT}\\s*(?:גדלו?|עלו?)\\s*ל[\\s־-]*${NUM}\\s*${UNIT}`, "i"));
  const y = message.match(/(\d{1,2})\s*(?:שנים|שנה|years?)/i);
  if (!m || !y) {
    if (m || y) {
      return clarifyPlan("cagr", lang === "he"
        ? "כדי לחשב תשואה שנתית ממוצעת (CAGR) צריך שלושה נתונים: ערך התחלה, ערך סוף ומספר שנים. למשל: מ-100 אלף ל-180 אלף ב-6 שנים."
        : "To compute CAGR I need three inputs: a start value, an end value, and the number of years. For example: from 100k to 180k over 6 years.");
    }
    return null;
  }
  const from = scaled(m[1], m[2]);
  const to = scaled(m[3], m[4]);
  const years = Number(y[1]);
  if (!from || !to || from <= 0 || !years) return null;
  const cagr = (Math.pow(to / from, 1 / years) - 1) * 100;
  return textPlan("cagr", lang === "he"
    ? `צמיחה מ-${fmt(from, lang)} ל-${fmt(to, lang)} ב-${years} שנים היא תשואה שנתית ממוצעת (CAGR) של ${fmt(cagr, lang)}%. זהו מדד ממוצע - התשואה בפועל משתנה משנה לשנה.`
    : `Growth from ${fmt(from, lang)} to ${fmt(to, lang)} over ${years} years is a CAGR (compound annual growth rate) of ${fmt(cagr, lang)}%. It is an average - actual yearly returns vary.`);
}

function rule72Calc(message: string, lang: QALanguage): QAPlan | null {
  if (!/הכפיל|הכפלה|מוכפל|להכפיל|double|doubling/i.test(message)) return null;
  const m = message.match(new RegExp(PCT, "i"));
  if (!m) return null;
  const rate = parseNum(m[1]);
  if (!rate || rate <= 0) return null;
  const exact = Math.log(2) / Math.log(1 + rate / 100);
  const approx = 72 / rate;
  return textPlan("rule_of_72", lang === "he"
    ? `בתשואה שנתית של ${fmt(rate, lang)}% הכסף מוכפל בערך כל ${fmt(exact, lang, 1)} שנים (כלל ה-72 נותן קירוב של ${fmt(approx, lang, 1)} שנים).`
    : `At ${fmt(rate, lang)}% a year, money doubles roughly every ${fmt(exact, lang, 1)} years (the rule of 72 gives about ${fmt(approx, lang, 1)} years).`);
}

function simpleInterestCalc(message: string, lang: QALanguage): QAPlan | null {
  const hasKeyword = /ריבית\s*פשוטה|simple\s+interest/i.test(message)
    || new RegExp(`ריבית\\s+(?:של\\s+)?${PCT}\\s+על\\s+`, "i").test(message);
  if (!hasKeyword) return null;
  const pctM = message.match(new RegExp(PCT, "i"));
  const amtM = message.match(new RegExp(AMOUNT_RE, "i"));
  const yM = message.match(/(\d{1,2})\s*(?:שנים|שנה|years?)/i);
  const rate = parseNum(pctM?.[1]);
  const principal = scaled(amtM?.[1], amtM?.[2]);
  const ccy = currencyOf(amtM?.[3]);
  if (!rate || !principal) return null;
  const years = yM ? Number(yM[1]) : 1;
  const interest = (principal * rate * years) / 100;
  const suffix = ccy ? ` ${ccy}` : "";
  const period = lang === "he" ? (years === 1 ? "לשנה" : `ל-${years} שנים`) : years === 1 ? "per year" : `over ${years} years`;
  return textPlan("simple_interest", lang === "he"
    ? `ריבית פשוטה של ${fmt(rate, lang)}% על ${fmt(principal, lang)}${suffix} = ${fmt(interest, lang)}${suffix} ${period}, ובסך הכל ${fmt(principal + interest, lang)}${suffix}. ריבית פשוטה אינה מצטברת על ריביות קודמות, בניגוד לריבית דריבית.`
    : `Simple interest of ${fmt(rate, lang)}% on ${fmt(principal, lang)}${suffix} = ${fmt(interest, lang)}${suffix} ${period}, for a total of ${fmt(principal + interest, lang)}${suffix}. Simple interest does not compound on prior interest, unlike compound interest.`);
}

function dividendYieldCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/דיבידנד|dividend/i.test(message)) return null;
  const divM = message.match(new RegExp(`(?:דיבידנד\\s+(?:שנתי\\s+)?(?:של\\s+)?|dividend\\s+of\\s+)${NUM}`, "i"));
  const priceM = message.match(new RegExp(`(?:מחיר\\s+(?:של\\s+)?|price\\s+of\\s+|at\\s+)${NUM}`, "i"));
  if (!divM || !priceM) return null;
  const dividend = parseNum(divM[1]);
  const price = parseNum(priceM[1]);
  if (!dividend || !price) return null;
  const yieldPct = (dividend / price) * 100;
  return textPlan("dividend_yield", lang === "he"
    ? `דיבידנד שנתי של ${fmt(dividend, lang)} על מחיר ${fmt(price, lang)} = תשואת דיבידנד של ${fmt(yieldPct, lang)}%. התשואה משתנה עם המחיר, והדיבידנד אינו מובטח. ${EDU.he}`
    : `An annual dividend of ${fmt(dividend, lang)} on a price of ${fmt(price, lang)} = a dividend yield of ${fmt(yieldPct, lang)}%. The yield moves with the price, and dividends are not guaranteed. ${EDU.en}`);
}

function averageCostCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/ממוצע|average|מיצוע/i.test(message)) return null;
  const pairs = [...message.matchAll(new RegExp(`${NUM}\\s*(?:מניות|יחידות|shares?)\\s*(?:ב[\\s־-]*|at\\s*|@)\\s*${NUM}`, "gi"))];
  if (pairs.length < 2) return null;
  let totalQty = 0;
  let totalCost = 0;
  for (const pair of pairs) {
    const qty = parseNum(pair[1]);
    const price = parseNum(pair[2]);
    if (!qty || !price) return null;
    totalQty += qty;
    totalCost += qty * price;
  }
  const avg = totalCost / totalQty;
  return textPlan("average_cost", lang === "he"
    ? `סה״כ ${fmt(totalQty, lang)} מניות בעלות של ${fmt(totalCost, lang)}. המחיר הממוצע למניה הוא ${fmt(avg, lang)} - זו נקודת האיזון לפני עמלות ומס.`
    : `A total of ${fmt(totalQty, lang)} shares at a cost of ${fmt(totalCost, lang)}. The average price per share is ${fmt(avg, lang)} - that is your break-even before fees and taxes.`);
}

function peCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/מכפיל\s+ה?רווח|\bp\/?e\b/i.test(message)) return null;
  const priceM = message.match(new RegExp(`(?:מחיר\\s+(?:של\\s+)?|price\\s+of\\s+|at\\s+)${NUM}`, "i"));
  const epsM = message.match(new RegExp(`(?:רווח למניה\\s+(?:של\\s+)?|eps\\s+of\\s+)${NUM}`, "i"));
  if (!priceM || !epsM) return null;
  const price = parseNum(priceM[1]);
  const eps = parseNum(epsM[1]);
  if (!price || !eps) return null;
  const pe = price / eps;
  return textPlan("pe_ratio", lang === "he"
    ? `מחיר ${fmt(price, lang)} חלקי רווח למניה ${fmt(eps, lang)} = מכפיל רווח של ${fmt(pe, lang, 1)}. המשמעות: המשקיעים משלמים ${fmt(pe, lang, 1)} על כל 1 של רווח שנתי. ההשוואה מועילה בעיקר בתוך אותו ענף.`
    : `A price of ${fmt(price, lang)} divided by EPS of ${fmt(eps, lang)} = a P/E of ${fmt(pe, lang, 1)}. Meaning: investors pay ${fmt(pe, lang, 1)} for every 1 of annual earnings. Comparisons are most useful within the same industry.`);
}

function inflationCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/אינפלציה|inflation|ערך\s+ריאלי|כוח\s+קנייה|real\s+value|purchasing\s+power/i.test(message)) return null;
  const amtM = message.match(new RegExp(AMOUNT_RE, "i"));
  const yM = message.match(/(\d{1,2})\s*(?:שנים|שנה|years?)/i);
  const pctM = message.match(new RegExp(PCT, "i"));
  const amount = scaled(amtM?.[1], amtM?.[2]);
  const years = yM ? Number(yM[1]) : null;
  const rate = parseNum(pctM?.[1]);
  if (amount && years && rate === null) {
    return clarifyPlan("inflation", lang === "he"
      ? "מה קצב האינפלציה השנתי שצריך להניח? למשל 3%."
      : "What annual inflation rate should I assume? For example 3%.");
  }
  if (!amount || !years || rate === null) return null;
  const ccy = currencyOf(amtM?.[3]);
  const suffix = ccy ? ` ${ccy}` : "";
  const realValue = amount / Math.pow(1 + rate / 100, years);
  const nominalNeeded = amount * Math.pow(1 + rate / 100, years);
  return textPlan("inflation", lang === "he"
    ? `עם אינפלציה של ${fmt(rate, lang)}% לשנה, כוח הקנייה של ${fmt(amount, lang)}${suffix} בעוד ${years} שנים יהיה שווה ל-${fmt(realValue, lang)}${suffix} בכסף של היום. כדי לשמור על אותו כוח קנייה צריך ${fmt(nominalNeeded, lang)}${suffix} נומינלית.`
    : `With ${fmt(rate, lang)}% annual inflation, the purchasing power of ${fmt(amount, lang)}${suffix} in ${years} years will equal ${fmt(realValue, lang)}${suffix} in today's money. To keep the same purchasing power you would need ${fmt(nominalNeeded, lang)}${suffix} nominally.`);
}

function feeCompareCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/דמי\s+ניהול|עמל(?:ה|ות)|fees?|expense/i.test(message)) return null;
  const pcts = [...message.matchAll(new RegExp(PCT, "gi"))].map((m) => parseNum(m[1])).filter((n): n is number => n !== null);
  if (pcts.length < 2) return null;
  const amtM = message.match(new RegExp(AMOUNT_RE, "i"));
  const yM = message.match(/(\d{1,2})\s*(?:שנים|שנה|years?)/i);
  const amount = scaled(amtM?.[1], amtM?.[2]);
  const years = yM ? Number(yM[1]) : null;
  if (!amount || !years) {
    return clarifyPlan("fee_compare", lang === "he"
      ? "כדי להשוות את ההשפעה של דמי ניהול צריך גם סכום התחלתי וגם מספר שנים. למשל: 1% מול 0.2% על 100 אלף ל-20 שנה."
      : "To compare the impact of fees I need an initial amount and a number of years. For example: 1% vs 0.2% on 100k for 20 years.");
  }
  const [highFee, lowFee] = [Math.max(pcts[0], pcts[1]), Math.min(pcts[0], pcts[1])];
  const assumedReturn = pcts.length >= 3 ? pcts[2] : 7;
  const assumption = pcts.length >= 3
    ? lang === "he" ? `בתשואה שנתית של ${fmt(assumedReturn, lang)}%` : `at ${fmt(assumedReturn, lang)}% annual return`
    : lang === "he" ? `בהנחת תשואה שנתית של ${fmt(assumedReturn, lang)}% (אפשר לציין תשואה אחרת)` : `assuming ${fmt(assumedReturn, lang)}% annual return (you can state a different one)`;
  const finalLow = amount * Math.pow(1 + (assumedReturn - lowFee) / 100, years);
  const finalHigh = amount * Math.pow(1 + (assumedReturn - highFee) / 100, years);
  const diff = finalLow - finalHigh;
  return textPlan("fee_compare", lang === "he"
    ? `${assumption}, על ${fmt(amount, lang)} ל-${years} שנים: עם דמי ניהול של ${fmt(lowFee, lang)}% הסכום הסופי הוא בערך ${fmt(finalLow, lang)}, לעומת ${fmt(finalHigh, lang)} עם ${fmt(highFee, lang)}% - פער של כ-${fmt(diff, lang)}. דמי ניהול נגרעים כל שנה ולכן ההשפעה מצטברת. ${EDU.he}`
    : `${assumption}, on ${fmt(amount, lang)} over ${years} years: with a ${fmt(lowFee, lang)}% fee the final amount is about ${fmt(finalLow, lang)}, versus ${fmt(finalHigh, lang)} with ${fmt(highFee, lang)}% - a gap of about ${fmt(diff, lang)}. Fees are deducted every year, so the impact compounds. ${EDU.en}`);
}

function allocationCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/חלוקה|לחלק|הקצאה|להקצות|split|allocat/i.test(message)) return null;
  const amtM = message.match(new RegExp(AMOUNT_RE, "i"));
  const amount = scaled(amtM?.[1], amtM?.[2]);
  const ccy = currencyOf(amtM?.[3]);
  if (!amount) return null;
  const suffix = ccy ? ` ${ccy}` : "";
  const buckets = [...message.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(מניות|אג"ח|אגח|מזומן|זהב|נדל"ן|קריפטו|stocks?|bonds?|cash|gold|crypto)/gi)];
  if (buckets.length >= 2) {
    const totalPct = buckets.reduce((sum, b) => sum + Number(b[1]), 0);
    const lines = buckets.map((b) => {
      const pct = Number(b[1]);
      return `${b[2]}: ${fmt((amount * pct) / 100, lang)}${suffix} (${fmt(pct, lang)}%)`;
    });
    const note = Math.abs(totalPct - 100) > 0.5
      ? lang === "he" ? ` שים לב: האחוזים מסתכמים ל-${fmt(totalPct, lang)}% ולא ל-100%.` : ` Note: the percentages add up to ${fmt(totalPct, lang)}%, not 100%.`
      : "";
    return textPlan("allocation", lang === "he"
      ? `חלוקה של ${fmt(amount, lang)}${suffix}: ${lines.join(", ")}.${note} ההקצאה צריכה להתאים לאופק ולסיבולת הסיכון שלך. ${EDU.he}`
      : `Splitting ${fmt(amount, lang)}${suffix}: ${lines.join(", ")}.${note} The allocation should match your horizon and risk tolerance. ${EDU.en}`);
  }
  const ratio = message.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (ratio) {
    const a = Number(ratio[1]);
    const b = Number(ratio[2]);
    if (a > 0 && b > 0 && Math.abs(a + b - 100) < 0.5) {
      return textPlan("allocation", lang === "he"
        ? `חלוקה של ${fmt(amount, lang)}${suffix} ביחס ${fmt(a, lang)}/${fmt(b, lang)}: ${fmt((amount * a) / 100, lang)}${suffix} מול ${fmt((amount * b) / 100, lang)}${suffix}. ${EDU.he}`
        : `Splitting ${fmt(amount, lang)}${suffix} at ${fmt(a, lang)}/${fmt(b, lang)}: ${fmt((amount * a) / 100, lang)}${suffix} versus ${fmt((amount * b) / 100, lang)}${suffix}. ${EDU.en}`);
    }
  }
  return null;
}

function rebalanceCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/איזון|לאזן|rebalance/i.test(message)) return null;
  const amtM = message.match(new RegExp(AMOUNT_RE, "i"));
  const amount = scaled(amtM?.[1], amtM?.[2]);
  const pcts = [...message.matchAll(new RegExp(PCT, "gi"))].map((m) => parseNum(m[1])).filter((n): n is number => n !== null);
  if (!amount || pcts.length < 2) {
    return clarifyPlan("rebalance", lang === "he"
      ? "כדי לחשב איזון צריך: שווי תיק נוכחי, האחוז הנוכחי בכל רכיב ואחוז היעד. למשל: תיק של 200 אלף, כרגע 70% מניות, יעד 60%."
      : "To compute a rebalance I need: current portfolio value, the current weight, and the target weight. For example: a 200k portfolio, now 70% stocks, target 60%.");
  }
  const ccy = currencyOf(amtM?.[3]);
  const suffix = ccy ? ` ${ccy}` : "";
  const [currentPct, targetPct] = pcts;
  const currentValue = (amount * currentPct) / 100;
  const targetValue = (amount * targetPct) / 100;
  const move = Math.abs(currentValue - targetValue);
  const direction = currentPct > targetPct
    ? lang === "he" ? "למכור מהרכיב העודף ולהעביר לרכיב השני" : "sell from the overweight part and move it to the other"
    : lang === "he" ? "לקנות עוד מהרכיב ולהעביר מהרכיב השני" : "buy more of that part and fund it from the other";
  return textPlan("rebalance", lang === "he"
    ? `בתיק של ${fmt(amount, lang)}${suffix}: ${fmt(currentPct, lang)}% הם ${fmt(currentValue, lang)}${suffix}, והיעד ${fmt(targetPct, lang)}% הוא ${fmt(targetValue, lang)}${suffix}. צריך ${direction} בסך ${fmt(move, lang)}${suffix}. לאיזון יכולות להיות השלכות מס ועמלות. ${EDU.he}`
    : `In a ${fmt(amount, lang)}${suffix} portfolio: ${fmt(currentPct, lang)}% is ${fmt(currentValue, lang)}${suffix}, and the ${fmt(targetPct, lang)}% target is ${fmt(targetValue, lang)}${suffix}. You would ${direction} worth ${fmt(move, lang)}${suffix}. Rebalancing can have tax and fee consequences. ${EDU.en}`);
}

function stockSplitCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/פיצול|split/i.test(message)) return null;
  const ratioM = message.match(/(\d+(?:\.\d+)?)\s*(?:for\s*1\b|ל[-־\s]*1\b|:1\b)/i)
    ?? message.match(/(\d+(?:\.\d+)?)\s*(?:ל[-־\s]*|to\s*|:|-for-)\s*(\d+(?:\.\d+)?)/i);
  if (!ratioM) return null;
  let multiplier: number;
  if (ratioM[2] !== undefined) {
    const a = Number(ratioM[1]);
    const b = Number(ratioM[2]);
    if (!a || !b) return null;
    multiplier = Math.max(a, b) / Math.min(a, b);
  } else {
    multiplier = Number(ratioM[1]);
  }
  if (!multiplier || multiplier <= 0) return null;
  const qtyM = message.match(new RegExp(`${NUM}\\s*(?:מניות|יחידות|shares?)`, "i"));
  const priceM = message.match(new RegExp(`(?:מחיר\\s+(?:של\\s+)?|ב|at\\s+)${NUM}`, "i"));
  if (qtyM && priceM) {
    const qty = parseNum(qtyM[1]);
    const price = parseNum(priceM[1]);
    if (qty && price) {
      const newQty = qty * multiplier;
      const newPrice = price / multiplier;
      return textPlan("stock_split", lang === "he"
        ? `בפיצול פי ${fmt(multiplier, lang, 0)}: ${fmt(qty, lang)} מניות הופכות ל-${fmt(newQty, lang)} מניות, והמחיר מתחלק ל-${fmt(newPrice, lang)}. שווי ההחזקה הכולל (${fmt(qty * price, lang)}) לא משתנה מהפיצול עצמו.`
        : `In a ${fmt(multiplier, lang, 0)}x split: ${fmt(qty, lang)} shares become ${fmt(newQty, lang)} shares, and the price divides to ${fmt(newPrice, lang)}. The total holding value (${fmt(qty * price, lang)}) does not change from the split itself.`);
    }
  }
  return textPlan("stock_split", lang === "he"
    ? `בפיצול פי ${fmt(multiplier, lang, 0)} מספר המניות מוכפל ב-${fmt(multiplier, lang, 0)} והמחיר למניה מתחלק באותו גורם - שווי ההחזקה הכולל לא משתנה.`
    : `In a ${fmt(multiplier, lang, 0)}x split the share count multiplies by ${fmt(multiplier, lang, 0)} and the per-share price divides by the same factor - total holding value does not change.`);
}

function loanCalc(message: string, lang: QALanguage): QAPlan | null {
  const isMortgage = /משכנתא|mortgage/i.test(message);
  const isLoanPayment = /הלוואה|loan/i.test(message) && /החזר|payment/i.test(message);
  if (!isMortgage && !isLoanPayment) return null;
  if (!/\d/.test(message)) return null;
  let amount: number;
  let rate: number;
  let years: number;
  if (lang === "he") {
    const hasRate = /%|אחוז|ריבית/i.test(message);
    const parsed = parseLoanQuery(message);
    amount = parsed.loanAmount;
    rate = parsed.annualRatePct;
    years = parsed.years;
    if (!hasRate || amount < 1000) {
      return clarifyPlan("loan", "כדי לחשב החזר חודשי צריך סכום הלוואה, ריבית שנתית ותקופה בשנים. למשל: משכנתא של 1.2 מיליון בריבית 4.8% ל-25 שנה.");
    }
  } else {
    const amtM = message.match(new RegExp(`${NUM}\\s*${UNIT}`, "i"));
    const rateM = message.match(new RegExp(PCT, "i"));
    const yM = message.match(/(\d{1,2})\s*years?/i);
    const a = scaled(amtM?.[1], amtM?.[2]);
    const r = parseNum(rateM?.[1]);
    const y = yM ? Number(yM[1]) : null;
    if (!a || !r || !y) {
      return clarifyPlan("loan", "To compute a monthly payment I need the loan amount, annual interest rate, and term in years. For example: a 1.2 million mortgage at 4.8% for 25 years.");
    }
    amount = a;
    rate = r;
    years = y;
  }
  const result = computeSchpitzer(amount, rate, years);
  return textPlan("loan", lang === "he"
    ? `הלוואה של ${fmt(amount, lang)} בריבית ${fmt(rate, lang)}% ל-${years} שנים (לוח שפיצר): החזר חודשי קבוע של בערך ${fmt(result.firstMonthlyPayment, lang, 0)}, סה״כ החזר ${fmt(result.totalRepayment, lang, 0)} מתוכם ${fmt(result.totalInterest, lang, 0)} ריבית. ההערכה אינה כוללת הצמדה, ביטוח או עמלות. ${EDU.he}`
    : `A loan of ${fmt(amount, lang)} at ${fmt(rate, lang)}% for ${years} years (equal-payment amortization): a fixed monthly payment of about ${fmt(result.firstMonthlyPayment, lang, 0)}, total repayment ${fmt(result.totalRepayment, lang, 0)} of which ${fmt(result.totalInterest, lang, 0)} is interest. This excludes index-linkage, insurance, and fees. ${EDU.en}`);
}

function taxCalc(message: string, lang: QALanguage): QAPlan | null {
  if (!/מס|tax/i.test(message)) return null;
  if (!/רווח|gain|profit|דיבידנד|dividend/i.test(message)) return null;
  const amtM = message.match(new RegExp(AMOUNT_RE, "i"));
  const gain = scaled(amtM?.[1], amtM?.[2]);
  if (!gain) return null;
  const rateM = message.match(new RegExp(PCT, "i"));
  const statedRate = parseNum(rateM?.[1]);
  const isIsrael = /ישראל|israel/i.test(message);
  const isUs = /ארה"ב|ארצות|usa|america|\bus\b/i.test(message);
  const ccy = currencyOf(amtM?.[3]);
  const suffix = ccy ? ` ${ccy}` : "";
  if (statedRate !== null) {
    const tax = (gain * statedRate) / 100;
    return textPlan("tax", lang === "he"
      ? `בשיעור מס של ${fmt(statedRate, lang)}% על רווח של ${fmt(gain, lang)}${suffix}: המס הוא ${fmt(tax, lang)}${suffix} ונשארים ${fmt(gain - tax, lang)}${suffix}. חבות המס בפועל תלויה בחוק, בנקודות זיכוי ובנסיבות האישיות. ${EDU.he}`
      : `At a ${fmt(statedRate, lang)}% tax rate on a gain of ${fmt(gain, lang)}${suffix}: the tax is ${fmt(tax, lang)}${suffix}, leaving ${fmt(gain - tax, lang)}${suffix}. Actual liability depends on the law, credits, and personal circumstances. ${EDU.en}`);
  }
  if (isIsrael) {
    const rate = 25;
    const tax = (gain * rate) / 100;
    return textPlan("tax", lang === "he"
      ? `בישראל, רווח הון בניירות ערך סחירים ממוסה בדרך כלל ב-25% על הרווח הריאלי: על רווח של ${fmt(gain, lang)}${suffix} המס הוא בערך ${fmt(tax, lang)}${suffix} ונשארים ${fmt(gain - tax, lang)}${suffix}. יש חריגים, פטורים ושינויי חוק, ודיבידנדים ממוסים אחרת. זו הסברה כללית, לא ייעוץ מס.`
      : `In Israel, capital gains on listed securities are generally taxed at 25% of the real gain: on a gain of ${fmt(gain, lang)}${suffix} the tax is about ${fmt(tax, lang)}${suffix}, leaving ${fmt(gain - tax, lang)}${suffix}. There are exceptions, exemptions, and law changes, and dividends are taxed differently. This is general education, not tax advice.`);
  }
  if (isUs) {
    return textPlan("tax", lang === "he"
      ? "בארה\"ב מס רווחי הון הפדרלי תלוי בתקופת ההחזקה ובהכנסה: רווח לטווח ארוך (מעל שנה) ממוסה בדרך כלל ב-0%, 15% או 20%, ולטווח קצר כהכנסה רגילה; בנוסף ייתכן מס מדינה. ציין תקופת החזקה ושיעור כדי שאחשב. זו הסברה כללית, לא ייעוץ מס."
      : "In the US, federal capital gains tax depends on holding period and income: long-term gains (over a year) are usually taxed at 0%, 15%, or 20%, short-term gains as ordinary income, plus possible state tax. Tell me the holding period and rate and I will compute it. This is general education, not tax advice.");
  }
  return clarifyPlan("tax", lang === "he"
    ? "באיזו מדינה מדובר? שיעורי המס על רווחי הון שונים בין מדינות (בישראל בדרך כלל 25% על הרווח הריאלי). אפשר גם לציין שיעור מס ואחשב מיד."
    : "Which country does this concern? Capital gains tax rates differ between countries (in Israel it is generally 25% of the real gain). You can also state a rate and I will compute it right away.");
}

function adviceBoundary(message: string, lang: QALanguage): QAPlan | null {
  if (!/כדאי\s+(לי\s+)?(לקנות|להשקיע|למכור)|האם\s+כדאי|מה\s+כדאי|מומלץ\s+לקנות|should\s+i\s+(buy|invest|sell)|is\s+it\s+(a\s+)?good\s+(idea|time)\s+to\s+(buy|invest)/i.test(message)) return null;
  return textPlan("advice_boundary", lang === "he"
    ? "אני לא יכולה לומר לך מה לקנות או למכור - זו החלטה אישית שתלויה באופק, בסיבולת הסיכון ובמצב הכלכלי שלך. אני כן יכולה לעזור לך להחליט: להסביר מושגים, לחשב תרחישים, להשוות נכסים או לבדוק כמה מניות אפשר לקנות בסכום מסוים."
    : "I cannot tell you what to buy or sell - that is a personal decision that depends on your horizon, risk tolerance, and financial situation. I can help you decide: explain concepts, compute scenarios, compare assets, or check how many shares a given amount buys.");
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export function planFinancialQA(message: string, lang: QALanguage, memory: QAMemory): QAPlan | null {
  // Market-backed answers first (they may need live data).
  const gainLoss = gainLossCalc(message, lang);
  if (gainLoss) return gainLoss;

  // Pure calculations that share phrasing with holdings ("10 shares at 100
  // and 5 at 120", "10 shares at 1000 in a 10-for-1 split") must win.
  const averageFirst = averageCostCalc(message, lang);
  if (averageFirst) return averageFirst;
  const splitFirst = stockSplitCalc(message, lang);
  if (splitFirst) return splitFirst;

  const purchase = planPurchase(message, memory);
  if (purchase) {
    memory.purchase = purchase;
    return purchasePlan(purchase, lang);
  }

  const holding = planHolding(message, memory);
  if (holding) {
    if (holding.symbol) memory.holding = holding;
    return holdingPlan(holding, lang);
  }

  const fx = planFx(message, memory);
  if (fx) {
    memory.fx = fx;
    return fxPlan(fx, lang);
  }

  // Deterministic calculations, most specific first.
  const fee = feeCompareCalc(message, lang);
  if (fee) return fee;
  const recovery = recoveryCalc(message, lang);
  if (recovery) return recovery;
  const cagr = cagrCalc(message, lang);
  if (cagr) return cagr;
  const rebalance = rebalanceCalc(message, lang);
  if (rebalance) return rebalance;
  const allocation = allocationCalc(message, lang);
  if (allocation) return allocation;
  const dividend = dividendYieldCalc(message, lang);
  if (dividend) return dividend;
  const pe = peCalc(message, lang);
  if (pe) return pe;
  const inflation = inflationCalc(message, lang);
  if (inflation) return inflation;
  const interest = simpleInterestCalc(message, lang);
  if (interest) return interest;
  const rule72 = rule72Calc(message, lang);
  if (rule72) return rule72;
  const loan = loanCalc(message, lang);
  if (loan) return loan;
  const tax = taxCalc(message, lang);
  if (tax) return tax;
  const pctChange = percentChangeCalc(message, lang);
  if (pctChange) return pctChange;
  const percent = percentCalc(message, lang);
  if (percent) return percent;
  const boundary = adviceBoundary(message, lang);
  if (boundary) return boundary;

  return null;
}
