/** Hebrew wording for the English "unavailable" reasons the metric engines return. Unknown reasons pass through unchanged. */
const RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^Need (\d+) observations \(have (\d+)\)$/, (m) => `נדרשות ${m[1]} תצפיות (יש ${m[2]})`],
  [/^Need at least (\d+) aligned return observations \(have (\d+)\)$/, (m) => `נדרשות לפחות ${m[1]} תצפיות תשואה מיושרות (יש ${m[2]})`],
  [/^Need at least (\d+) return observations \(have (\d+)\)$/, (m) => `נדרשות לפחות ${m[1]} תצפיות תשואה (יש ${m[2]})`],
  [/^Need at least (\d+) points in each window$/, (m) => `נדרשות לפחות ${m[1]} נקודות בכל חלון`],
  [/^Need at least 2 price points$/, () => "נדרשות לפחות 2 נקודות מחיר"],
  [/^Observation spacing is irregular$/, () => "מרווחי התצפיות אינם סדירים"],
  [/^At least (\d+) return observations are needed \(have (\d+)\)$/, (m) => `נדרשות לפחות ${m[1]} תצפיות תשואה (יש ${m[2]})`],
  [/^Returns have no variance$/, () => "לתשואות אין שונות"],
  [/^At least two assets with history are needed$/, () => "נדרשים לפחות שני נכסים עם היסטוריה"],
  [/^Only (\d+) common dates across assets; at least (\d+) are needed$/, (m) => `רק ${m[1]} תאריכים משותפים בין הנכסים; נדרשים לפחות ${m[2]}`],
  [/^This strategy has fewer than two example assets$/, () => "לאסטרטגיה זו פחות משני נכסי דוגמה"],
  [/^Real price history is unavailable for (.+)$/, (m) => `היסטוריית מחירים אמיתית אינה זמינה עבור ${m[1]}`],
  [/^Observation frequency could not be determined$/, () => "לא ניתן לקבוע את תדירות התצפיות"],
  [/^Zero band width$/, () => "רוחב הרצועה אפס"],
  [/^Zero volatility$/, () => "אין תנודתיות"],
  [/^No negative periods$/, () => "לא היו תקופות עם תשואה שלילית"],
  [/^No completed trades$/, () => "לא הושלמו עסקאות"],
  [/^Needs a computed CAGR and a non-zero drawdown$/, () => "נדרשים שיעור צמיחה שנתי מחושב וירידה מרבית שאינה אפס"],
];

export function reasonText(reason: string, language: string): string {
  if (language !== "he") return reason;
  for (const [re, fn] of RULES) { const m = reason.match(re); if (m) return fn(m); }
  return reason;
}
