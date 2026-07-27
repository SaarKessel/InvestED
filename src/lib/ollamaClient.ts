// ---------------------------------------------------------------------------
// InvestED — Ollama Client (Local LLM, No Cloud Dependency)
//
// שכבת הניסוח: המספרים (ציון סיכון, הקצאה) תמיד מגיעים מהמנוע מבוסס
// הכללים. Ollama, אם הוא רץ מקומית, רק מוסיף ניסוח חם ואישי יותר מעל
// המספרים האלה. אם השרת לא זמין — כל הקריאות נופלות בחזרה לטקסט
// מבוסס-כללים, והאפליקציה ממשיכה לעבוד במלואה.
//
// כדי להפעיל:
//   ollama pull llama3.1
//   ollama serve
// (יש לוודא ש-Ollama מאפשר CORS מקומי: OLLAMA_ORIGINS=* ollama serve)
// ---------------------------------------------------------------------------

const OLLAMA_HOST = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.1";
const REQUEST_TIMEOUT_MS = 12000;

const SYSTEM_PROMPT = [
  "אתה מורה פיננסי סבלני ומעודד, המוטמע בפלטפורמה חינוכית להשקעות בשם InvestED.",
  "אתה לעולם לא נותן ייעוץ השקעות אישי, ולעולם לא אומר למשתמש לקנות או למכור נכס ספציפי.",
  "אתה מסביר מושגים בשפה פשוטה וברורה, ב-2-4 משפטים קצרים, תמיד בעברית.",
  "הטון שלך חינוכי, לא מנחה ולא מכתיב.",
].join(" ");

async function callOllama(prompt: string, model: string = DEFAULT_MODEL): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt: `${SYSTEM_PROMPT}\n\n${prompt}`,
        stream: false,
        options: { temperature: 0.6 },
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = (data?.response ?? "").trim();
    return text || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

export async function explainInvestorProfile(
  investorType: string,
  riskScore: number,
  baseReason: string,
  rawText: string
): Promise<string> {
  const prompt = [
    `המשתמש תיאר את העדפות ההשקעה שלו כך: "${rawText}"`,
    `לפי ניתוח מבוסס כללים, הוא סווג כ"${investorType}" עם ציון סיכון ${riskScore}/10.`,
    `הנימוק הבסיסי היה: ${baseReason}`,
    "בשלוש עד ארבעה משפטים קצרים ומעודדים, פנה למשתמש בגוף שני ('אתה') והסבר למה הפרופיל החינוכי הזה מתאים למה שהוא תיאר, תוך התייחסות לדברים ספציפיים שהוא כתב. אל תמליץ על נכסים ספציפיים.",
  ].join("\n");

  const result = await callOllama(prompt);
  return result ?? baseReason;
}

export async function explainPortfolio(
  investorType: string,
  allocationSummary: string,
  fallback: string
): Promise<string> {
  const prompt = [
    `עבור פרופיל חינוכי מסוג "${investorType}", ההקצאה ההיפותטית לדוגמה היא: ${allocationSummary}.`,
    "בשלושה עד ארבעה משפטים קצרים, הסבר למה צורת ההקצאה הזו הגיונית עבור הפרופיל הזה (מה התפקיד של כל רכיב עיקרי), כדוגמה חינוכית בלבד. אל תזכיר שמות של נכסים ספציפיים או טיקרים.",
  ].join("\n");

  const result = await callOllama(prompt);
  return result ?? fallback;
}
