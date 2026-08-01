import { motion } from "framer-motion";
import {
  GraduationCap,
  Sparkles,
  Code2,
  LineChart,
  Palette,
  Linkedin,
  Layers,
  Cpu,
  Cloud,
  Paintbrush,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/primitives";

const PILLARS = [
  { icon: Sparkles, label: "Artificial Intelligence" },
  { icon: GraduationCap, label: "Financial Education" },
  { icon: LineChart, label: "Data Visualization" },
  { icon: Palette, label: "Product Thinking" },
  { icon: Code2, label: "Full Stack Development" },
];

const TECH_STACK = [
  {
    icon: Layers,
    title: "Frontend",
    items: ["React 18", "TypeScript", "Vite", "React Router"],
    desc: "ארכיטקטת קומפוננטות מודולרית וטיפוסים מלאים (Type Safety) לאורך כל האפליקציה.",
  },
  {
    icon: Paintbrush,
    title: "עיצוב ו-UI",
    items: ["Tailwind CSS", "Design System מותאם אישית", "Framer Motion", "Lucide Icons"],
    desc: "מערכת עיצוב עקבית עם Design Tokens, מצב בהיר/כהה, ואנימציות עדינות שמכוונות תשומת לב בלי להסיח את הדעת.",
  },
  {
    icon: BarChart3,
    title: "ויזואליזציה של נתונים",
    items: ["Recharts", "גרפי נרות, קו ואזור אינטראקטיביים"],
    desc: "הצגת הקצאת תיק, לוחות סילוקין/שפיצר ונתוני שוק בצורה ברורה, נגישה ומובנת גם למי שאינו איש פיננסים.",
  },
  {
    icon: Cpu,
    title: "מנוע ניתוח ו-AI",
    items: ["מנוע כללים שקוף (Rule-Based Engine)", "Ollama — מודל שפה מקומי", "Explainable AI"],
    desc: "כל מסקנה מבוססת על לוגיקה ניתנת להסבר; שכבת AI מקומית מוסיפה ניסוח אנושי מעל הכללים, מבלי לפגוע בשקיפות.",
  },
  {
    icon: Cloud,
    title: "נתוני שוק ותשתית",
    items: ["Yahoo Finance (דרך Vercel Serverless Function)", "Vercel Deployment"],
    desc: "נתוני שוק בזמן אמת נשלפים דרך פונקציית שרת ייעודית, ונופלים בצורה חלקה לנתונים מדומים אם השירות אינו זמין.",
  },
];

export function AboutPage() {
  return (
    <Layout>
      <section className="container max-w-3xl py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            אודות הפרויקט והיוצר
          </span>

          <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">אודות InvestED</h1>

          <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <b className="text-foreground">InvestED</b> הוא מוצר FinTech עצמאי שנוצר, עוצב ופותח בשלמותו על ידי{" "}
              <b className="text-foreground">סער קסל</b> — בוגר MBA ותואר ראשון (BA) במנהל עסקים, עם ניסיון מעשי
              בתעשיית הבנקאות מתוך שנתיים בבנק הפועלים, לצד עניין עמוק ומתמשך בעולם ההשקעות, הטכנולוגיה ו-FinTech.
            </p>
            <p>
              הפרויקט הזה הוא, במידה רבה, <b className="text-foreground">כרטיס הביקור שלי</b>: הוא נולד מתוך תפיסה
              ברורה שעולם ההשקעות רצוף מונחים ומושגים שמרתיעים אנשים רבים מלהתחיל ללמוד עליו, ומתוך רצון אמיתי
              להוכיח — לא רק לספר — איך משלבים ידע פיננסי אמיתי עם יכולות פיתוח Full Stack וטכנולוגיות AI
              מתקדמות, כדי להפוך תחום מורכב לחוויה פשוטה, ויזואלית ואינטראקטיבית.
            </p>
            <p>
              מעבר להיבט הטכני, הפרויקט משקף גישת <b className="text-foreground">Product Thinking</b> מקצה לקצה:
              מהגדרת הבעיה (נגישות ידע פיננסי), דרך הבנת המשתמש והצרכים שלו, ועד לבחירת הארכיטקטורה הטכנולוגית
              שתומכת בה בצורה הטובה ביותר — בדיוק כפי שמצופה ממוצר production אמיתי בחברת FinTech.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://www.linkedin.com/in/saarkessel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
            >
              <Linkedin className="h-4 w-4 text-primary" />
              הפרופיל המקצועי שלי ב-LinkedIn
            </a>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground">
              <Briefcase className="h-4 w-4 text-primary" />
              ניסיון בנקאי — בנק הפועלים
            </span>
          </div>

          <Card className="mt-10">
            <CardContent className="pt-6">
              <p className="mb-4 text-sm font-bold">הפרויקט מדגים שילוב בין:</p>
              <div className="flex flex-wrap gap-3">
                {PILLARS.map((p) => (
                  <span
                    key={p.label}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-semibold"
                  >
                    <p.icon className="h-3.5 w-3.5 text-primary" />
                    {p.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-14">
            <h2 className="font-display text-2xl font-bold">כלים וטכנולוגיות שבהם נבנה הפרויקט</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              בחירת סטאק טכנולוגי מודרני, המשקף סטנדרטים מקצועיים של מוצרי FinTech אמיתיים.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {TECH_STACK.map((t) => (
                <div key={t.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 font-display font-bold">{t.title}</h3>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm leading-relaxed">
            <b>המערכת אינה מעניקה ייעוץ השקעות.</b> כל המידע מוצג לצורכי לימוד בלבד.
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}
