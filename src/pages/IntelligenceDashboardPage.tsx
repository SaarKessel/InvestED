import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/context/languageContext";
import { buildDashboard } from "@/lib/intelligence/dashboard";

/** Super Intelligence dashboard: what the system has, which domains are really wired, and how recent answers on this device went. */
export default function IntelligenceDashboardPage() {
  const { language } = useLanguage();
  const he = language === "he";
  const d = buildDashboard();
  const card = "rounded-xl border p-4";
  return (
    <Layout>
      <section className="container max-w-5xl py-10" dir={he ? "rtl" : "ltr"}>
        <h1 className="text-3xl font-extrabold">{he ? "מרכז הבינה" : "Intelligence center"}</h1>
        <p className="mt-3 text-muted-foreground">{he ? "מה יש במערכת, מה באמת מחובר, ואיך נענו השאלות האחרונות במכשיר הזה." : "What the system has, what is really wired, and how recent questions on this device were answered."}</p>

        <h2 className="mt-8 text-xl font-bold">{he ? "תחומים" : "Domains"} <span className="text-sm font-normal text-muted-foreground">({d.wiredDomains}/{d.domains.length} {he ? "מחוברים" : "wired"})</span></h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2" data-testid="dash-domains">
          {d.domains.map((x) => (
            <li key={x.id} className={card}>
              <p className="font-semibold">{x.title[he ? "he" : "en"]} <span className="text-xs font-normal text-muted-foreground">· {x.status === "wired" ? (he ? "מחובר" : "wired") : (he ? "גבול בלבד, עדיין אין מנוע" : "boundary only, no engine yet")}</span></p>
              <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{x.servedBy}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-8 text-xl font-bold">{he ? "סוכני נושא" : "Topic agents"}</h2>
        <ul className="mt-3 flex flex-wrap gap-2" data-testid="dash-agents">
          {d.agents.map((a) => <li key={a.id} className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: `hsl(${a.color})` }}>{a.name[he ? "he" : "en"]}</li>)}
        </ul>

        <h2 className="mt-8 text-xl font-bold">{he ? "ידע" : "Knowledge"}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4" data-testid="dash-knowledge">
          <div className={card}><dt className="text-xs text-muted-foreground">{he ? "מושגים" : "Concepts"}</dt><dd className="text-2xl font-bold">{d.knowledge.concepts}</dd></div>
          <div className={card}><dt className="text-xs text-muted-foreground">{he ? "עם הסבר שמור" : "With stored text"}</dt><dd className="text-2xl font-bold">{d.knowledge.withText}</dd></div>
          <div className={card}><dt className="text-xs text-muted-foreground">{he ? "בלי הסבר עדיין" : "Without text yet"}</dt><dd className="text-2xl font-bold">{d.knowledge.withoutText}</dd></div>
          <div className={card}><dt className="text-xs text-muted-foreground">{he ? "קטגוריות" : "Categories"}</dt><dd className="text-2xl font-bold">{d.knowledge.categories}</dd></div>
        </dl>

        <h2 className="mt-8 text-xl font-bold">{he ? "בריאות" : "Health"}</h2>
        {d.health.count === 0 ? <p className="mt-3" data-testid="dash-health-empty">{he ? "עדיין אין נתונים במכשיר הזה." : "No data on this device yet."}</p> : (
          <div className="mt-3" data-testid="dash-health">
            <p>{he ? `${d.health.count} תשובות, ${Math.round((d.health.okRate ?? 0) * 100)}% עברו, זמן חציוני ${d.health.p50} מ״ש.` : `${d.health.count} answers, ${Math.round((d.health.okRate ?? 0) * 100)}% passed, median ${d.health.p50} ms.`}</p>
            <p className="mt-1 text-sm text-muted-foreground">{d.topRoutes.map((r) => `${r.route} (${r.count})`).join(", ")}</p>
          </div>
        )}

        <nav className="mt-8 flex flex-wrap gap-3" aria-label={he ? "קישורים" : "Links"}>
          <Link className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted" to="/knowledge-map">{he ? "מפת ידע" : "Knowledge map"}</Link>
          <Link className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted" to="/system-health">{he ? "בריאות המערכת" : "System health"}</Link>
        </nav>
      </section>
    </Layout>
  );
}
