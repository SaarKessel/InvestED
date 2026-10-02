import { describe, expect, it } from "vitest";
import { reasonText } from "./reasonText";

describe("reasonText", () => {
  it("translates known reasons to Hebrew and leaves English alone", () => {
    expect(reasonText("Need 253 observations (have 120)", "he")).toBe("נדרשות 253 תצפיות (יש 120)");
    expect(reasonText("Need 253 observations (have 120)", "en")).toBe("Need 253 observations (have 120)");
    expect(reasonText("Need at least 20 return observations (have 5)", "he")).toContain("20");
    expect(reasonText("Something new", "he")).toBe("Something new");
  });
});

describe("report-card unavailable reasons", () => {
  it.each([
    ["Zero volatility", "אין תנודתיות"],
    ["No negative periods", "לא היו תקופות עם תשואה שלילית"],
    ["No completed trades", "לא הושלמו עסקאות"],
    ["Needs a computed CAGR and a non-zero drawdown", "נדרשים שיעור צמיחה שנתי מחושב וירידה מרבית שאינה אפס"],
  ])("translates %s", (reason, expected) => {
    expect(reasonText(reason, "he")).toBe(expected);
  });
});
