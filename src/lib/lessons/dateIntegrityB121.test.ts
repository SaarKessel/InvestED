import { describe, expect, it } from "vitest";
import { parseUtcDate } from "./moneyWeighted";

const years = [1900, 1999, 2000, 2024, 2025, 2100];
const cases: Array<[number, number, number]> = [];
for (const year of years) for (let month = 1; month <= 12; month++) for (const day of [0, 1, 28, 29, 30, 31, 32]) cases.push([year, month, day]);
const iso = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
const leap = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

describe("[sweep] B121 Gregorian date validity independent month-length oracle", () => {
  it.each(cases)("year %s month %s day %s", (year, month, day) => {
    const length = month === 2 ? (leap(year) ? 29 : 28) : [4, 6, 9, 11].includes(month) ? 30 : 31;
    const r = parseUtcDate(iso(year, month, day));
    if (day < 1 || day > length) expect(r).toBeNull();
    else {
      expect(r).not.toBeNull();
      const d = new Date(r!);
      expect([d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours()]).toEqual([year, month, day, 0]);
      expect(d.toISOString().slice(0, 10)).toBe(iso(year, month, day));
    }
  });
});

const malformed = ["2025-1-01", "2025-01-1", "25-01-01", "2025/01/01", "2025-00-01", "2025-13-01", "2025-01-01T00:00:00Z", " 2025-01-01", "2025-01-01 ", "not-a-date", "", "2025-01-01\n"];
describe("[sweep] B121 date-only input format remains strict", () => {
  it.each(malformed)("rejects %j", (date) => { expect(parseUtcDate(date)).toBeNull(); });
});

describe("[hand] B121 century leap-year rules", () => {
  it("divisible-by-100 years are not leap years unless divisible by 400", () => {
    expect(parseUtcDate("1900-02-29")).toBeNull();
    expect(parseUtcDate("2000-02-29")).not.toBeNull();
    expect(parseUtcDate("2100-02-29")).toBeNull();
  });
});
