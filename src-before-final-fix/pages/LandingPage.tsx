import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, LineChart, ShieldCheck, Sparkles, GraduationCap, PenLine } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button, Card, CardContent } from "@/components/ui/primitives";

const FEATURES = [
  {
    icon: Brain,
    title: "ניתוח מבוסס AI",
    desc: "תאר את עצמך בשפה חופשית, והמערכת תזהה את המטרות, הסיכון והאופק שלך.",
  },
  {
    icon: ShieldCheck,
    title: "Explainable AI",
    desc: "כל מסקנה מלווה בהסבר שקוף: אילו נתונים הובילו אליה, ולמה.",
  },
  {
    icon: LineChart,
    title: "נתוני שוק חיים",
    desc: "גרפים ונתוני מחיר לדוגמה על נכסים מוכרים, לצורכי לימוד בלבד.",
  },
  {
    icon: GraduationCap,
    title: "מסלול למידה אישי",
    desc: "Roadmap שלב-אחר-שלב, מהבסיס ועד אסטרטגיה מתקדמת.",
  },
];

const AUDIENCE = [
  "מתחילים לגמרי בעולם ההשקעות",
  "אנשים שרוצים להבין מושגים לפני שהם מתייעצים עם איש מקצוע",
  "סטודנטים לכלכלה, מנהל עסקים או פיננסים",
  "כל מי שרוצה ללמוד עולם מורכב בצורה פשוטה וברורה",
];

const STEPS = [
  { icon: PenLine, title: "מתארים את עצמכם", desc: "כותבים בשפה חופשית מי אתם, מה המטרות שלכם ומה מעניין אתכם." },
  { icon: Brain, title: "ה-AI מנתח", desc: "מנוע חכם מזהה אופק השקעה, רמת סיכון, ידע פיננסי ותחומי עניין." },
  { icon: Sparkles, title: "מקבלים דשבורד אישי", desc: "פרופיל משקיע, הסברים, אסטרטגיות ותיק לדוגמה — הכול מוסבר צעד-צעד." },
];

export function LandingPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-grid">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container relative flex flex-col items-center py-24 text-center md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            פלטפורמה חינוכית מבוססת AI — לא ייעוץ השקעות
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="max-w-3xl text-balance font-display text-4xl font-extrabold leading-tight tracking-tight md:text-6xl"
          >
            עולם ההשקעות,<br />
            <span className="gradient-text">בפשטות ובבהירות.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 max-w-xl text-balance text-lg text-muted-foreground"
          >
            InvestED הופך מונחים מורכבים כמו ETF, פיזור וסיכון לחוויית למידה אישית,
            אינטראקטיבית וברורה — בעברית מלאה.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <Link to="/start">
              <Button size="lg" className="gap-2">
                התחל ללמוד
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/about">
              <Button size="lg" variant="outline">
                עוד על הפרויקט
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 py-24">
        <div className="container">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">מה זה InvestED</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              שילוב של AI, עיצוב חוויית משתמש ברמה גבוהה, ותוכן פיננסי אמין — כדי שכל אחד יוכל
              להבין את עולם ההשקעות.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Card className="h-full p-1">
                  <CardContent className="pt-5">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1.5 font-display font-bold">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 bg-muted/30 py-24">
        <div className="container">
          <div className="mb-14 text-center">
            <h2 className="font-display text-3xl font-bold md:text-4xl">איך זה עובד</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">שלושה שלבים פשוטים, ותוך דקה יש לכם דשבורד לימודי אישי.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-2xl border border-border bg-card p-7 shadow-soft"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full gradient-brand font-display text-lg font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 font-display text-lg font-bold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who is it for */}
      <section className="border-t border-border/60 py-24">
        <div className="container grid items-center gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">למי זה מתאים</h2>
            <p className="mt-4 text-muted-foreground">
              InvestED נבנתה במיוחד עבור אנשים שמרגישים שעולם ההשקעות מורכב מדי, ורוצים
              נקודת התחלה ברורה ונטולת לחץ.
            </p>
            <ul className="mt-7 space-y-3">
              {AUDIENCE.map((a) => (
                <li key={a} className="flex items-start gap-3 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {a}
                </li>
              ))}
            </ul>
            <Link to="/start" className="mt-8 inline-block">
              <Button size="lg" className="gap-2">
                בואו נתחיל
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/15 to-transparent blur-2xl" />
            <Card className="p-2">
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">רמת סיכון לדוגמה</span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">6/10</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-3/5 gradient-brand rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: "מניות ארה\"ב", value: 45 },
                    { label: "אג\"ח", value: 25 },
                    { label: "בינלאומי", value: 20 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border p-3 text-center">
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                      <div className="mt-1 font-display font-bold">{item.value}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
