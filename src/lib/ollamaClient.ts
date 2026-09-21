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

function getSystemPrompt(language: "he" | "en" = "he"): string {
  if (language === "he") {
    return [
      "אתה מורה פיננסי סבלני ומעודד, המוטמע בפלטפורמה חינוכית להשקעות בשם InvestED.",
      "אתה לעולם לא נותן ייעוץ השקעות אישי, ולעולם לא אומר למשתמש לקנות או למכור נכס ספציפי.",
      "אתה מסביר מושגים בשפה פשוטה וברורה, ב-2-4 משפטים קצרים, תמיד בעברית.",
      "הטון שלך חינוכי, לא מנחה ולא מכתיב.",
    ].join(" ");
  }

  return [
    "You are a patient and encouraging financial teacher embedded in an educational investment platform called InvestED.",
    "You never give personal investment advice, and you never tell the user to buy or sell a specific asset.",
    "You explain concepts in simple and clear language, in 2-4 short sentences, always in English.",
    "Your tone is educational, not directive or prescriptive.",
  ].join(" ");
}

async function callOllama(
  prompt: string,
  model: string = DEFAULT_MODEL,
  language: "he" | "en" = "he"
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: `${getSystemPrompt(language)}\n\n${prompt}`,
        stream: false,
        options: {
          temperature: 0.6,
        },
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


// ---------------------------------------------------------------------------
// Public generic Ollama call
// משמש לבדיקות ולשימושים עתידיים ב-AI Mentor
// ---------------------------------------------------------------------------

export async function askOllama(
  prompt: string,
  model: string = DEFAULT_MODEL,
  language: "he" | "en" = "he"
): Promise<string | null> {
  return callOllama(prompt, model, language);
}


export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      2500
    );

    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      signal: controller.signal,
    });

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
  rawText: string,
  language: "he" | "en" = "he"
): Promise<string> {
  const prompt = language === "he"
    ? [
        `המשתמש תיאר את העדפות ההשקעה שלו כך: "${rawText}"`,
        `לפי ניתוח מבוסס כללים, הוא סווג כ"${investorType}" עם ציון סיכון ${riskScore}/10.`,
        `הנימוק הבסיסי היה: ${baseReason}`,
        "בשלושה עד ארבעה משפטים קצרים ומעודדים, פנה למשתמש בגוף שני ('אתה') והסבר למה הפרופיל החינוכי הזה מתאים למה שהוא תיאר, תוך התייחסות לדברים ספציפיים שהוא כתב. אל תמליץ על נכסים ספציפיים.",
      ].join("\n")
    : [
        `The user described their investment preferences as follows: "${rawText}"`,
        `According to a rule-based analysis, they were classified as "${investorType}" with a risk score of ${riskScore}/10.`,
        `The basic reason was: ${baseReason}`,
        "In three to four short and encouraging sentences, address the user in the second person ('you') and explain why this educational profile fits what they described, referring to specific things they wrote. Do not recommend specific assets.",
      ].join("\n");

  const result = await callOllama(prompt, DEFAULT_MODEL, language);

  return result ?? baseReason;
}


export async function explainPortfolio(
  investorType: string,
  allocationSummary: string,
  fallback: string,
  language: "he" | "en" = "he"
): Promise<string> {
  const prompt = language === "he"
    ? [
        `עבור פרופיל חינוכי מסוג "${investorType}", ההקצאה ההיפותטית לדוגמה היא: ${allocationSummary}.`,
        "בשלושה עד ארבעה משפטים קצרים, הסבר למה צורת ההקצאה הזו הגיונית עבור הפרופיל הזה (מה התפקיד של כל רכיב עיקרי), כדוגמה חינוכית בלבד. אל תזכיר שמות של נכסים ספציפיים או טיקרים.",
      ].join("\n")
    : [
        `For an educational profile of type "${investorType}", the hypothetical allocation example is: ${allocationSummary}.`,
        "In three to four short sentences, explain why this allocation structure makes sense for this profile (what is the role of each key component), as an educational example only. Do not mention specific asset names or tickers.",
      ].join("\n");

  const result = await callOllama(prompt, DEFAULT_MODEL, language);

  return result ?? fallback;
}