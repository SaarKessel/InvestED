/** "don't tell me X", "never convert Y", "אל תגיד לי", "לא רוצה לראות": the user asks for the opposite, so no desk should answer. */
const EN = /\b(?:do not|don'?t|dont|never|no need to|not want to|won'?t)\s+(?:want to\s+|need to\s+)?(?:tell|show|give|convert|exchange|calculate|list|display|explain|check|look up|pull|fetch)\b/i;
const HE = /(?<![\u0590-\u05ff])(?:אל|לא)\s+(?:ת\S+|רוצה|צריך|צריכה|מתכוון|מתכוונת)(?![\u0590-\u05ff])/;
export function isNegatedAsk(text: string): boolean { return EN.test(text) || HE.test(text); }
