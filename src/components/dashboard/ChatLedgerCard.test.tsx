import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LanguageOverride, LanguageProvider } from "@/context/languageContext";
import { ToolResultCards } from "./resultCards";
import { brierScore, calibrationBins, type Prediction } from "@/lib/predictions/ledger";
import type { LedgerResult } from "@/lib/predictions/ledgerDesk";

const p: Prediction = { id: "1", symbol: "AAPL", direction: "up", confidence: 70, horizonDays: 30, thesis: "t t t", createdAt: "", dueDate: "2026-09-19", entryDate: "2026-08-19", entryClose: 100, entrySpyClose: 500, status: "settled", hit: true, returnPct: 10, spyReturnPct: 2 };
const full: LedgerResult = { predictions: [p], settledNow: 1, brier: brierScore([p]), bins: calibrationBins([p]), today: "2026-10-02" };
const render = (data: LedgerResult, lang: "he" | "en") => renderToStaticMarkup(<LanguageProvider><LanguageOverride language={lang}><ToolResultCards message={{ ledger: data }} onAsk={() => {}} /></LanguageOverride></LanguageProvider>);

describe("ledger card", () => {
  it("shows results, Brier, the too-few warning and the disclaimer in both languages", () => {
    const en = render(full, "en");
    expect(en).toContain('data-testid="ledger-card"'); expect(en).toContain("Brier score"); expect(en).toContain("too few to judge"); expect(en).toContain("not investment advice"); expect(en).toContain("+10.0%");
    const he = render(full, "he");
    expect(he).toContain("ציון Brier"); expect(he).toContain("לא ייעוץ השקעות");
  });
  it("explains the format, sign-in and unavailable closes without inventing anything", () => {
    const base = { predictions: [], settledNow: 0, brier: null, bins: calibrationBins([]), today: "2026-10-02" };
    expect(render({ ...base, reason: "help" }, "en")).toContain("To log a call");
    expect(render({ ...base, reason: "signin" }, "en")).toContain("Sign in");
    expect(render({ ...base, reason: "closes_unavailable" }, "he")).toContain("לא שמרתי כלום");
  });
});
