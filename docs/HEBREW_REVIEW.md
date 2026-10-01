# Hebrew strings added or changed since the cockpit slice

For Saar's review. Each row: key, English, Hebrew. Strings generated inside code (depth lines, card text) are listed at the end.

| Key | English | Hebrew |
|---|---|---|
| `voice_no_speech` | I did not hear anything. Tap the orb and speak right away. | לא שמעתי כלום. לחצו על הכדור ודברו מיד. |
| `voice_no_mic` | No microphone was found on this device. | לא נמצא מיקרופון במכשיר הזה. |
| `voice_network` | The browser's speech service could not be reached. Check your connection and try again. | שירות הזיהוי של הדפדפן לא הגיב. בדקו חיבור ונסו שוב. |
| `voice_language` | This browser cannot recognise Hebrew speech. You can type your question instead. | הדפדפן הזה לא מזהה דיבור בעברית. אפשר להקליד את השאלה. |
| `voice_unsupported` | This browser does not support voice input. Try Chrome on Android or Safari on iPhone, or type your question. | הדפדפן הזה לא תומך בקלט קולי. נסו Chrome באנדרואיד או Safari באייפון, או הקלידו את השאלה. |
| `voice_service` | Voice input is blocked by the browser or system. On Android check Chrome's microphone permission. Type your question meanwhile. | הקלט הקולי חסום על ידי הדפדפן או המערכת. באנדרואיד בדקו הרשאת מיקרופון ב-Chrome. בינתיים אפשר להקליד. |
| `voice_service_ios` | On iPhone, voice input needs Dictation AND Siri turned on (Settings > General > Keyboard > Enable Dictation; Settings > Siri), and a normal Safari tab, not a home-screen app or another app's browser. Typing works fully. | באייפון הקלט הקולי דורש הפעלת הכתבה וגם Siri (הגדרות > כללי > מקלדת > הפעלת הכתבה; הגדרות > Siri) וטאב רגיל ב-Safari, לא אפליקציה ממסך הבית ולא דפדפן בתוך אפליקציה. הקלדה עובדת במלואה. |
| `voice_code` | Code: | קוד: |
| `movers_extreme_note` | Move of 40% or more in one day. Unusually large, so check the source: it can be a split or spin-off in the raw feed, or a real move. | שינוי של 40% ומעלה ביום. חריג מאוד, ולכן כדאי לבדוק במקור: זה יכול להיות פיצול או ספין-אוף בנתון הגולמי, או תנועה אמיתית. |
| `cockpit_title` | Your cockpit | לוח הבקרה שלך |
| `cockpit_market` | Market movers | תנועות בשוק |
| `cockpit_market_off` | Market data is unavailable right now. | נתוני שוק אינם זמינים כרגע. |
| `cockpit_loading` | Loading... | טוען... |
| `cockpit_market_note` | Read-only. Yahoo Finance, about 15 minutes delayed during market hours. | לקריאה בלבד. Yahoo Finance, בעיכוב של כ-15 דקות בשעות המסחר. |
| `cockpit_learning` | Learning | למידה |
| `cockpit_learned` | {n} lessons completed so far. | הושלמו {n} שיעורים עד כה. |
| `cockpit_learned_none` | No lessons completed yet. | עדיין לא הושלמו שיעורים. |
| `cockpit_learn_prompt` | What should I learn first about investing? | מה כדאי ללמוד קודם על השקעות? |
| `cockpit_learn_cta` | Suggest next step | הצע צעד הבא |
| `cockpit_saved` | Saved answers | תשובות שמורות |
| `cockpit_saved_none` | Nothing saved yet. Save an answer to find it here. | עוד לא נשמר דבר. שמרו תשובה כדי למצוא אותה כאן. |
| `cockpit_agents` | Agents | סוכנים |
| `compare_title` | Compared, both start at 100 | השוואה, שניהם מתחילים ב-100 |
| `compare_unavailable` | no comparison data available right now | אין כרגע נתוני השוואה זמינים |
| `compare_note` | Rebased to 100 on the first shared date, past performance only | מנורמל ל-100 בתאריך המשותף הראשון, ביצועי עבר בלבד |

## Strings written in code (not in the locale file)

- Movers: "שינוי של 40% ומעלה ביום..." is in the locale file (`movers_extreme_note`, listed above). The Corteva note lives in `src/lib/marketMovers.ts` (KNOWN_ACTIONS).
- Deep Research scope line: "היקף: נבנה רק מההסברים השמורים באתר, לא מנתונים חיים או מהרשת." (`src/lib/copilot/deepResearch.ts`)
- World Bank and FX depth lines: `src/lib/copilot/depth.ts`.
- Voice messages are in the locale file (keys starting `voice_`).
