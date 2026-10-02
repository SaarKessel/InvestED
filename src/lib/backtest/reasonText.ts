/** Hebrew wording for the English "unavailable" reasons the metric engines return. Unknown reasons pass through unchanged. */
const RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Need (\d+) observations \(have (\d+)\)$/, (m) => `נדרשות ${m[1]} תצפיות (יש ${m[2]})`],
  [/^Need at least (\d+) aligned return observations \(have (\d+)\)$/, (m) => `נדרשות לפחות ${m[1]} תצפיות תשואה מיושרות (יש ${m[2]})`],
  [/^Need at least (\d+) return observations \(have (\d+)\)$/, (m) => `נדרשות לפחות ${m[1]} תצפיות תשואה (יש ${m[2]})`],
  [/^Need at least (\d+) points in each window$/, (m) => `נדרשות לפחות ${m[1]} נקודות בכל חלון`],
  [/^Need at least 2 price points$/, () => "נדרשות לפחות 2 נקודות מחיר"],
  [/^Observation spacing is irregular$/, () => "מרווחי התצפיות אינם סדירים"],
  [/^Zero band width$/, () => "רוחב הרצועה אפס"],
];

export function reasonText(reason: string, language: string): string {
  if (language !== "he") return reason;
  for (const [re, fn] of RULES) { const m = reason.match(re); if (m) return fn(m); }
  return reason;
}
