/** First n characters by code point, so a cut never leaves half of an emoji (a lone surrogate). */
export function safeSlice(text: string, n: number): string {
  if (text.length <= n) return text;
  return Array.from(text).slice(0, n).join("");
}
