import { describe, expect, it } from "vitest";
import { normalizeInsuranceRecord } from "./insuranceData";
const base = { FUND_ID: 1, FUND_NAME: "  Fund  ", FUND_CLASSIFICATION: "  Class  ", REPORT_PERIOD: 202610 };
const values: unknown[] = [null, undefined, "", 0, "0", 1.25, "-2.5", 10000, -10000, 10001, Infinity, NaN, "not numeric"];
const rows = ["MONTHLY_YIELD", "YEAR_TO_DATE_YIELD", "AVG_ANNUAL_MANAGEMENT_FEE"].flatMap((field) => values.map((value) => [field, value] as const));
describe("[sweep] B184 insurance report nullable percentage normalization limits", () => {
  it.each(rows)("field %s value %s", (field, value) => {
    const input = { ...base, [field]: value };
    const result = normalizeInsuranceRecord(input)!;
    const mapped = field === "MONTHLY_YIELD" ? "monthlyYield" : field === "YEAR_TO_DATE_YIELD" ? "yearToDateYield" : "averageAnnualManagementFee";
    const expected = value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 10000 ? null : Number(value);
    expect(result[mapped]).toBe(expected);
    expect(result.name).toBe("Fund");
    expect(result.classification).toBe("Class");
    expect(result.fundId).toBe(1);
    expect(result.reportPeriod).toBe(202610);
  });
});
describe("[hand] B184 report identities and reporting months must be valid", () => {
  it("rejects malformed identity and impossible month fields", () => {
    for (const FUND_ID of [0, -1, 1.5, Infinity, "bad"]) expect(normalizeInsuranceRecord({ ...base, FUND_ID })).toBeNull();
    for (const REPORT_PERIOD of [199812, 202600, 202613, 210101, 202610.5]) expect(normalizeInsuranceRecord({ ...base, REPORT_PERIOD })).toBeNull();
    expect(normalizeInsuranceRecord({ ...base, FUND_NAME: "  " })).toBeNull();
    expect(normalizeInsuranceRecord(null)).toBeNull();
  });
});
