# InvestED

**מערכת לימודית אינטראקטיבית לעולם ההשקעות באמצעות AI.**

> ⚠️ InvestED היא פלטפורמה **חינוכית בלבד**. היא אינה מייעצת בהשקעות, אינה
> ממליצה על נכסים ואינה מחליפה יועץ השקעות מוסמך.

פותח על ידי **סער קסל** — בוגר MBA ו-BA במנהל עסקים ·
[LinkedIn](https://www.linkedin.com/in/saarkessel)

---

## ✨ מה יש באפליקציה

- **Landing Page** — הצגת המוצר, איך זה עובד, למי זה מתאים
- **זרימת קלט חופשי** — המשתמש מתאר את עצמו בשפה חופשית (גיל, מטרות, סיכון, ידע
  פיננסי, תחומי עניין), עם כפתורי הוספה מהירה מקובצים לפי נושא
- **מנוע ניתוח מבוסס כללים** (`src/lib/riskEngine.ts`, `portfolioEngine.ts`) — שקוף וניתן
  להסבר, לא "קופסה שחורה". התוצאה מוצגת **מיידית**, בלי לחכות לרשת
- **שכבת AI אופציונלית** דרך **Ollama** מקומי, לניסוח חם יותר מעל התוצאות — משודרגת
  **ברקע** אחרי שהדשבורד כבר מוצג, עם נפילה חזרה (fallback) אוטומטית אם אין שרת מקומי
- **נתוני שוק אמיתיים מ-Yahoo Finance** דרך פונקציית Vercel Serverless
  (`api/market-quote.js`), עם בחירת סמלים אוטומטית לפי תחומי העניין שזוהו בפרופיל,
  ונפילה חזרה חלקה לנתונים מדומים אם השירות לא זמין
- **גרף נרות (Candlestick)** במראה טרמינל מסחר אמיתי, לצד תצוגת קו — ניתן להחליף
- **Explainable AI** — כרטיס ייעודי שמסביר בדיוק אילו סימנים בטקסט הובילו למסקנות
- **מסלול למידה אישי דינמי** — מותאם לרמת הידע הפיננסי שצוינה (מתחיל/יש בסיס/מנוסה)
- **בוחן ידע אינטראקטיבי (Quiz)** — 5 שאלות אקראיות עם הסברים, לבדיקת הבנה מהירה
- **טבלת השוואת בתי השקעות** — עמלות, דמי ניהול וקישור ישיר להרשמה, בתוך כרטיס
  "תיק לימודי לדוגמה"
- **ErrorBoundary** גלובלי — כל שגיאת זמן-ריצה מוצגת כהודעה ידידותית ולא כדף לבן ריק
- **RTL מלא, עברית מלאה**, מצב בהיר/כהה, Micro-animations (Framer Motion),
  Skeleton loading, Tooltips, Accordion
- עמודי **About / FAQ / Privacy / Terms / Contact / 404**

---

## 🛠️ טכנולוגיות

| שכבה | טכנולוגיה |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| עיצוב | Tailwind CSS (Design System מותאם, בסגנון shadcn/ui) |
| גרפים | Recharts (כולל גרף נרות מותאם אישית) |
| אייקונים | lucide-react |
| אנימציות | Framer Motion |
| ניתוב | React Router |
| AI | Ollama (מודל שפה מקומי, ללא תלות בענן) |
| נתוני שוק | Yahoo Finance, דרך Vercel Serverless Function |
| Deployment | Vercel |

> **הערה ארכיטקטונית:** כל הלוגיקה העסקית (ניתוח פרופיל, הקצאת תיק) רצה
> בצד הלקוח (client-side) — אין צורך בשרת נפרד להרצה בסיסית
> (`npm run dev`). **חריג יחיד:** תיקיית `api/` מכילה פונקציית Vercel
> Serverless אחת (`market-quote.js`) שמשמשת כ-proxy מול Yahoo Finance,
> כי קריאה ישירה מהדפדפן ל-Yahoo נחסמת על ידי CORS. הפונקציה הזו
> פועלת אוטומטית כשהאתר רץ ב-Vercel; בהרצה מקומית רגילה עם `npm run dev`
> (Vite בלבד, בלי Vercel) היא לא זמינה, והאפליקציה נופלת אוטומטית
> לנתוני שוק מדומים כדי שהדשבורד תמיד יעבוד (ראו `src/lib/marketData.ts`).
> הקריאות ל-Ollama מתבצעות ישירות מהדפדפן אל `http://localhost:11434`.

---

## 🚀 התקנה והרצה

### דרישות מוקדמות
- **Node.js 18+** מותקן ([הורדה](https://nodejs.org))
- (אופציונלי) **Ollama** להרצת AI מקומי ([הורדה](https://ollama.com))

### שלבים

```bash
# 1. כניסה לתיקיית הפרויקט
cd InvestED

# 2. התקנת חבילות
npm install

# 3. הרצה במצב פיתוח
npm run dev
```

הדפדפן ייפתח אוטומטית בכתובת `http://localhost:5173`.

> **לגבי נתוני השוק:** בהרצה עם `npm run dev` הרגיל, פונקציית ה-API
> (`api/market-quote.js`) **לא** רצה — Vite לא מריץ Serverless Functions.
> לכן בפיתוח מקומי תראו את התג "נתונים מדומים". זה תקין. כדי לבדוק את
> החיבור האמיתי ל-Yahoo Finance כבר בשלב הפיתוח, אפשר להריץ:
> ```bash
> npm install -g vercel   # פעם אחת בלבד
> vercel dev
> ```
> זה מריץ גם את פונקציית ה-API מקומית. בפריסה בפועל ל-Vercel (`vercel --prod`)
> זה קורה אוטומטית, בלי הגדרה נוספת.

### (אופציונלי) הפעלת AI מקומי עם Ollama

```bash
ollama pull llama3.1
OLLAMA_ORIGINS=* ollama serve
```

> `OLLAMA_ORIGINS=*` חשוב כדי לאפשר לדפדפן (שרץ על `localhost:5173`) לתקשר
> עם שרת ה-Ollama (שרץ על `localhost:11434`) — אחרת הבקשה עלולה להיחסם
> ע"י מדיניות CORS. אם Ollama לא רץ, האפליקציה עדיין עובדת במלואה עם
> ניסוח מבוסס-כללים.

### בנייה לפרודקשן

```bash
npm run build
npm run preview   # לבדיקה מקומית של גרסת הפרודקשן
```

הפלט ייכתב לתיקיית `dist/`.

---

## 📁 מבנה הפרויקט

```
InvestED/
├── api/
│   └── market-quote.js      # Vercel Serverless Function — proxy ל-Yahoo Finance
├── src/
│   ├── components/
│   │   ├── ui/               # קומפוננטות בסיס (Button, Card, Accordion...)
│   │   ├── layout/            # Navbar, Footer, Logo, Layout
│   │   ├── landing/
│   │   ├── ErrorBoundary.tsx  # תופס שגיאות זמן-ריצה, מונע דף לבן ריק
│   │   └── dashboard/         # כרטיסי הדשבורד + BrokerComparisonTable, CandlestickChart, QuizCard
│   ├── pages/                  # Landing, Input, Dashboard, About, FAQ...
│   ├── lib/                     # riskEngine, portfolioEngine, ollamaClient, marketData,
│   │                             #   educationContent, strategies, brokers, quizBank, analysisService
│   ├── context/                  # AnalysisContext (state גלובלי לניתוח, לא חוסם)
│   ├── hooks/                     # useTheme
│   ├── types/                      # טיפוסי TypeScript משותפים
│   ├── App.tsx                      # ניתוב + ErrorBoundary + Providers
│   ├── main.tsx                      # נקודת כניסה
│   └── index.css                     # Design tokens, RTL, Tailwind
├── public/
│   └── favicon.svg
├── index.html
├── tailwind.config.ts
├── vite.config.ts
├── package.json
└── .env.example
```

---

## 🌐 פריסה (Deployment)

### Vercel

1. דחוף את הפרויקט ל-GitHub (או השתמש ב-`npx vercel` ישירות מהתיקייה).
2. ב-[vercel.com](https://vercel.com) → **New Project** → ייבוא הריפו (או דרך ה-CLI).
3. Vercel מזהה אוטומטית פרויקט Vite (Build command: `npm run build`,
   Output directory: `dist`) **וגם** את `api/market-quote.js` כפונקציית
   Serverless — בלי הגדרה נוספת.
4. Deploy. נתוני השוק האמיתיים מ-Yahoo Finance יעבדו אוטומטית ב-production,
   ללא צורך במפתח API או במשתני סביבה.

> שים לב: Ollama רץ מקומית על מחשב **המבקר** באתר בלבד. בסביבת Production
> (Vercel), שכבת ה-AI המקומית לרוב לא תהיה זמינה למבקרים (אלא אם הם
> מריצים Ollama על המחשב שלהם) — האפליקציה תיפול באופן חלק לניסוח
> מבוסס-כללים, בדיוק כמו כשאין Ollama מותקן.

---

## ⚠️ הבהרה חינוכית

כל תוכן במערכת — ציוני סיכון, סיווגי משקיע, תיקים לדוגמה, אסטרטגיות,
השוואות **וטבלת בתי ההשקעות** — מוצג **לצורכי לימוד בלבד** ואינו מהווה
ייעוץ השקעות, ייעוץ פיננסי או המלצה לפעולה. עמלות ודמי ניהול משתנים
לעיתים קרובות — יש לבדוק תנאים מעודכנים באתר הרשמי של כל בית השקעות.
יש להתייעץ עם בעל רישיון מוסמך לפני קבלת החלטות השקעה.

---

## 🗺️ Roadmap עתידי

- [ ] שמירת היסטוריית ניתוחים (עם הסכמת משתמש)
- [ ] תמיכה ב-i18n (אנגלית בנוסף לעברית)
- [ ] Onboarding מודרך לכרטיסי הדשבורד
- [ ] מעבר לספק נתוני שוק רשמי (עם מפתח API) כגיבוי ל-Yahoo Finance
- [ ] הרחבת מאגר השאלות בבוחן הידע
- [ ] שמירת תוצאות הבוחן והתקדמות במסלול הלמידה (localStorage)

## רישיון

הוסף רישיון (למשל MIT) לפי הצורך.
