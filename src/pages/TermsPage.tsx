import { Layout } from "@/components/layout/Layout";

export function TermsPage() {
  return (
    <Layout>
      <section className="container max-w-2xl py-16 md:py-24">
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">תנאי שימוש</h1>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>עדכון אחרון: 2026</p>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">1. מטרת השירות</h2>
            <p>
              InvestED היא פלטפורמה חינוכית ללימוד עולם ההשקעות. השירות אינו מהווה ייעוץ השקעות,
              ייעוץ פיננסי, ייעוץ מס או המלצה לביצוע פעולה כלשהי בניירות ערך.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">2. אין ייעוץ השקעות</h2>
            <p>
              כל תוכן במערכת — כולל ציוני סיכון, סיווגי משקיע, תיקים לדוגמה ונתוני שוק — מוצג
              לצורכי לימוד והמחשה בלבד, ואינו מהווה המלצה לבצע פעולה כלשהי. יש להתייעץ עם בעל
              רישיון מוסמך לפני קבלת החלטות השקעה.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">3. שימוש הוגן</h2>
            <p>אין להשתמש במערכת למטרות בלתי חוקיות או באופן שעלול לפגוע בפעילותה התקינה.</p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">4. הגבלת אחריות</h2>
            <p>
              השירות מסופק "כפי שהוא" (AS-IS), ללא אחריות מכל סוג. המפתח לא יישא באחריות לכל
              נזק, ישיר או עקיף, שייגרם כתוצאה משימוש במידע המוצג במערכת.
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-display text-lg font-bold text-foreground">5. שינויים בתנאים</h2>
            <p>ייתכן ותנאים אלה יעודכנו מעת לעת. המשך שימוש במערכת מהווה הסכמה לתנאים המעודכנים.</p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
