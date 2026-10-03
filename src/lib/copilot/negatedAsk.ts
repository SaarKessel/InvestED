/** "don't tell me X", "never convert Y", "I don't want to know", "אל תגיד לי", "לא רוצה לראות": the user asks for the opposite, so no desk should answer. */
const NEG = "(?:do not|don'?t|dont|never|no need to|not want to|won'?t)";
const EN = new RegExp(`\\b${NEG}\\s+(?:(?:want to|need to)\\s+)?(?:tell|show|give|convert|exchange|calculate|compute|list|display|explain|check|look up|pull|fetch)\\b|\\b(?:do not|don'?t|dont)\\s+(?:want|need) to\\s+(?:know|hear|see|find out)\\b`, "i");
const HE = /(?<![\u0590-\u05ff])(?:אל|לא)\s+(?:ת\S+|רוצה|צריך|צריכה|מתכוון|מתכוונת)(?![\u0590-\u05ff])/;
export function isNegatedAsk(text: string): boolean { return EN.test(text) || HE.test(text); }
