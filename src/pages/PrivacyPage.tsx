import { Layout } from "@/components/layout/Layout";

export function PrivacyPage() {
  return (
    <Layout>
      <section className="container max-w-2xl py-16 md:py-24">
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">מדיניות פרטיות</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>עדכון אחרון: 2026</p>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">איזה מידע נאסף</h2>
            <p>
              הטקסט שאתה מזין בעמוד "התחל ללמוד" מעובד ישירות בדפדפן שלך לצורך הניתוח, ואינו
              נשלח או נשמר בשרת חיצוני של InvestED.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">שימוש במודל AI מקומי</h2>
            <p>
              אם הפעלת מודל AI מקומי (Ollama) במחשב שלך, הטקסט שכתבת נשלח אך ורק לשרת המקומי
              שרץ על המחשב שלך (localhost) — לא לשירות ענן חיצוני כלשהו.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">עוגיות (Cookies)</h2>
            <p>
              המערכת שומרת ב-localStorage של הדפדפן העדפת מצב תצוגה (בהיר/כהה) בלבד. לא נעשה
              שימוש בעוגיות מעקב או פרסום.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">צד שלישי</h2>
            <p>
              במידה ותחובר לספק נתוני שוק חיצוני (למשל Yahoo Finance), ייתכן שהמידע שתבקש
              (כגון סמלי מניה) יישלח לאותו ספק בהתאם למדיניות הפרטיות שלו.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">יצירת קשר</h2>
            <p>לשאלות בנוגע למדיניות זו ניתן לפנות דרך עמוד "צור קשר".</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
