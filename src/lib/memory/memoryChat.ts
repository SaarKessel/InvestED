import type { MemoryApi } from "./memoryApi";
import type { MemoryCommand } from "./memoryCommands";

const T = {
  en: {
    off: "Memory is off, so I saved nothing. Turn it on in the sidebar under Memory, then say it again.",
    saved: (v: string) => `Saved this note: "${v}". It is stored only for you. Notes are not used to change answers yet. You can export or delete them in the sidebar under Memory.`,
    none: "I have no notes saved.",
    head: (n: number) => `Your saved notes (${n}):`,
    forget: "To delete everything, use Memory, then Delete all my memory, in the sidebar. I do not delete data from a chat message.",
    fail: "Memory is not available right now. Nothing was saved.",
    signin: "Sign in to use memory.",
  },
  he: {
    off: "הזיכרון כבוי, לכן לא שמרתי כלום. אפשר להפעיל אותו בסרגל הצד תחת זיכרון ואז לומר שוב.",
    saved: (v: string) => `שמרתי הערה: "${v}". היא נשמרת רק עבורך. ההערות עדיין לא משנות תשובות. אפשר לייצא או למחוק אותן בסרגל הצד תחת זיכרון.`,
    none: "אין לי הערות שמורות.",
    head: (n: number) => `ההערות השמורות שלך (${n}):`,
    forget: "כדי למחוק הכול: בסרגל הצד, זיכרון, ואז מחיקת כל הזיכרון שלי. אני לא מוחקת נתונים מהודעה בצ'אט.",
    fail: "הזיכרון לא זמין כרגע. לא נשמר כלום.",
    signin: "צריך להתחבר כדי להשתמש בזיכרון.",
  },
};

/** Runs one memory command and returns the reply text. Writes happen only through api.remember, which refuses without consent. */
export async function runMemoryCommand(cmd: MemoryCommand, api: MemoryApi | undefined, lang: "en" | "he"): Promise<string> {
  const s = T[lang];
  if (!api) return s.signin;
  try {
    if (cmd.kind === "forget") return s.forget;
    if (cmd.kind === "remember") return (await api.remember(cmd.value)) ? s.saved(cmd.value) : s.off;
    const data = await api.exportMemory();
    const notes = data.items.filter((i) => i.kind === "note").map((i) => String(i.value));
    if (!data.consent && notes.length === 0) return s.off;
    return notes.length ? `${s.head(notes.length)}\n${notes.map((n, i) => `${i + 1}. ${n}`).join("\n")}` : s.none;
  } catch {
    return s.fail;
  }
}
