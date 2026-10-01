/** The chat answers in the language of the question; mixed or letterless text keeps the interface language. */
export function replyLanguageFor(message: string, interfaceLanguage: "he" | "en"): "he" | "en" {
  const hebrew = (message.match(/[\u0590-\u05FF]/g) ?? []).length;
  const latin = (message.match(/[A-Za-z]/g) ?? []).length;
  if (hebrew > 0 && latin === 0) return "he";
  if (latin > 0 && hebrew === 0) return "en";
  if (hebrew > 0 && latin > 0) {
    // Tickers and units ("TSLA", "ETF") sit inside Hebrew sentences: judge by the share of words.
    const hebrewWords = (message.match(/[\u0590-\u05FF]+/g) ?? []).length;
    const latinWords = (message.match(/[A-Za-z]{3,}/g) ?? []).length;
    if (hebrewWords > latinWords) return "he";
    if (latinWords > hebrewWords) return "en";
  }
  return interfaceLanguage;
}
