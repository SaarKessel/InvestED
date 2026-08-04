import type {
  ParsedStockScenario,
  StockContributionPlan,
  StockSimulationMode,
} from "@/types/stockSimulation";

interface AssetAlias {
  symbol: string;
  label: string;
  aliases: string[];
}

const ASSET_ALIASES: AssetAlias[] = [
  {
    symbol: "AAPL",
    label: "Apple",
   aliases: ["apple", "aapl", "אפל"],
  },
  {
    symbol: "VOO",
    label: "Vanguard S&P 500 ETF",
    aliases: [
      "voo",
      "s&p500",
      "s&p 500",
      "s and p 500",
      "s&p",
      "סנופי",
       "סנופי 500",
    ],
  },
  {
    symbol: "SPY",
    label: "SPDR S&P 500 ETF",
    aliases: ["spy"],
  },
  {
    symbol: "QQQ",
    label: "Invesco QQQ ETF",
    aliases: [
      "qqq",
      "nasdaq",
      "מדד",
    ],
  },
];

const DEFAULT_YEARS = 10;

function extractYears(text: string): number | null {
  const match = text.match(
    /(\d+)\s*(?:שנים|שנה|year|years|ש׳)/i
  );

  if (!match) return null;

  const years = Number(match[1]);

  if (!Number.isFinite(years)) {
    return null;
  }

  return Math.min(Math.max(years, 1), 60);
}

function findAsset(text: string): {
  symbol: string | null;
  label: string | null;
} {
  const normalized = text.toLowerCase();

  for (const asset of ASSET_ALIASES) {
    if (
      asset.aliases.some((alias) =>
        normalized.includes(alias.toLowerCase())
      )
    ) {
      return {
        symbol: asset.symbol,
        label: asset.label,
      };
    }
  }

  const tickerMatch = text.match(/\b[A-Z]{2,5}\b/);

  if (tickerMatch) {
    return {
      symbol: tickerMatch[0],
      label: tickerMatch[0],
    };
  }

  return {
    symbol: null,
    label: null,
  };
}

function parseAmount(
  value: string,
  unit?: string
): number {
  let amount = Number(value.replace(/,/g, ""));

  if (!Number.isFinite(amount)) {
    return 0;
  }

  if (unit) {
    const normalized = unit.toLowerCase();

    if (
      normalized.includes("מיליון") ||
      normalized.includes("million")
    ) {
      amount *= 1_000_000;
    }

    if (
      normalized.includes("אלף") ||
      normalized.includes("k")
    ) {
      amount *= 1_000;
    }
  }

  return amount;
}

function extractContribution(
  text: string
): StockContributionPlan {

  const monthlyShares = text.match(
  /(\d+)\s*(?:מניות|shares)/i
);

const monthly =
  /(?:כל חודש|בחודש|לחודש|monthly)/i.test(text);


  if (monthly && monthlyShares) {
    return {
      cadence: "monthly_shares",
      monthlyShares: Number(monthlyShares[1]),
    };
  }


  const amounts = [
  ...text.matchAll(
    /(\d[\d,]*)\s*(אלף|k|מיליון)?/gi
  ),
];

  const values = amounts
    .map((match) =>
      parseAmount(match[1], match[2])
    )
    .filter((x) => x > 0);


  const amount = values[0] ?? 0;


  if (monthly && amount > 0) {
    return {
      cadence: "monthly_cash",
      monthlyContribution: amount,
    };
  }


  return {
    cadence: "one_time",
    initialInvestment:
      amount || undefined,
  };
}

function detectMode(
  text: string
): StockSimulationMode {

  const historicalWords =
    /(?:לפני|בעבר|הייתי משקיע|אם הייתי קונה|historical|backtest)/i;


  return historicalWords.test(text)
    ? "historical"
    : "projection";
}


function extractStartDate(
  text: string,
  now: Date
): string | null {

  const yearMatch = text.match(
    /(20\d{2})/
  );


  if (yearMatch) {
    return `${yearMatch[1]}-01-01`;
  }


  const yearsAgo =
  text.match(
    /לפני\s+(\d+)\s+שנים?/i
  );

  if (yearsAgo) {
    const date = new Date(now);
    date.setFullYear(
      date.getFullYear() -
      Number(yearsAgo[1])
    );

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  }


  return null;
}


export function parseStockScenario(
  rawText: string,
  now: Date = new Date()
): ParsedStockScenario {

  const text = rawText.trim();


  const asset =
    findAsset(text);


  const years =
    extractYears(text) ?? DEFAULT_YEARS;


  const contribution =
    extractContribution(text);


  const mode =
    detectMode(text);


  const ambiguities: string[] = [];


  if (!asset.symbol) {
  ambiguities.push(
    "לא זוהה נכס או סימול מסחר."
  );
}


if (!extractYears(text)) {
  ambiguities.push(
    "לא זוהה אופק זמן תקין."
  );
}


if (
  contribution.cadence === "one_time" &&
  !contribution.initialInvestment
) {
  ambiguities.push(
    "לא זוהה סכום השקעה."
  );
}


if (
  text.toLowerCase().includes("s&p") &&
  asset.symbol === "VOO"
) {
  ambiguities.push(
    "S&P 500 זוהה באמצעות VOO כפרוקסי"
  );
}
  return {
    rawText,
    symbol: asset.symbol,
    assetLabel: asset.label,
    mode,
    contribution,
    years,
    startDate:
      mode === "historical"
        ? extractStartDate(text, now)
        : null,
    ambiguities,
  };
} 

