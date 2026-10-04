import { describe, expect, it } from "vitest";
import { parseBisMonthlyRates } from "./bisPolicyRate";
const rows = [-10.01, -10, -0.25, 0, 4.5, 100, 100.01].flatMap((rate) => ["2026-01", "2026-12", "2026-00", "2026-13"].flatMap((month) => ["", "data:"].map((prefix) => [rate, month, prefix] as const)));
describe("[sweep] B185 BIS parser accepts only bounded rates and valid observation months", () => {
  it.each(rows)("rate %s month %s namespace %s", (rate, month, prefix) => {
    const xml = `<${prefix}Series FREQ="M" REF_AREA="IL"><${prefix}Obs TIME_PERIOD="${month}" OBS_VALUE="${rate}"/></${prefix}Series>`;
    expect(parseBisMonthlyRates(xml)).toEqual(rate >= -10 && rate <= 100 && /-(01|12)$/.test(month) ? [{ month, rate }] : []);
  });
});
describe("[hand] B185 BIS observations deduplicate latest values and cap to latest24 months", () => {
  it("sorts reversed source observations and keeps final duplicate value", () => {
    const points = Array.from({ length: 30 }, (_, i) => ({ month: `${2024 + Math.floor(i / 12)}-${String(i % 12 + 1).padStart(2, "0")}`, rate: i / 10 }));
    const xml = `<Series FREQ="M" REF_AREA="IL">${[...points].reverse().map((p) => `<Obs TIME_PERIOD="${p.month}" OBS_VALUE="${p.rate}"/>`).join("")}<Obs TIME_PERIOD="2026-06" OBS_VALUE="4.5"/></Series>`;
    const expected = points.slice(-24).map((p) => p.month === "2026-06" ? { ...p, rate: 4.5 } : p);
    expect(parseBisMonthlyRates(xml)).toEqual(expected);
    expect(parseBisMonthlyRates("x".repeat(200001))).toEqual([]);
  });
});
