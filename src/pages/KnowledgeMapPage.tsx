import { useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/context/languageContext";
import { allConcepts, getConcept } from "@/lib/knowledge/concepts/registry";
import { graphStats, neighbourhood, shortestPath } from "@/lib/knowledge/graph";
import { termExplanation } from "@/lib/copilot/termLinks";

/** Knowledge map: browse the stored concepts by category, open one to see its neighbours and the chain between two ideas. Reads the registry only; nothing here is generated. */
export default function KnowledgeMapPage() {
  const { language } = useLanguage();
  const he = language === "he";
  const lang = he ? "he" : "en";
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [target, setTarget] = useState<string>("");
  const stats = useMemo(() => graphStats(), []);
  const list = allConcepts().filter((c) => category === "all" || c.category === category);
  const name = (id: string) => { const c = getConcept(id); return c ? (he ? c.he : c.en) : id; };
  const info = selected ? termExplanation(selected, lang) : null;
  const near = selected ? neighbourhood(selected, 2, 12) : [];
  const path = selected && target ? shortestPath(selected, target) : null;
  return (
    <Layout>
      <section className="container max-w-4xl py-10" dir={he ? "rtl" : "ltr"}>
        <h1 className="text-3xl font-extrabold">{he ? "מפת ידע" : "Knowledge map"}</h1>
        <p className="mt-3 text-muted-foreground">{he ? `${stats.nodes} מושגים, ל-${stats.withText} מהם יש הסבר שמור. הקישורים בין המושגים נשמרים במאגר.` : `${stats.nodes} concepts, ${stats.withText} with a stored explanation. The links between them are stored in the registry.`}</p>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={he ? "קטגוריות" : "Categories"}>
          {["all", ...Object.keys(stats.byCategory)].map((c) => (
            <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className="rounded-full border px-3 py-1 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground">
              {c === "all" ? (he ? "הכול" : "All") : (he ? (CATEGORY_HE[c] ?? c) : c)} {c !== "all" && <span className="opacity-70">({stats.byCategory[c]})</span>}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <ul className="max-h-[28rem] space-y-1 overflow-auto" aria-label={he ? "מושגים" : "Concepts"}>
            {list.map((c) => (
              <li key={c.id}><button type="button" aria-pressed={selected === c.id} onClick={() => { setSelected(c.id); setTarget(""); }} className="w-full rounded-lg px-3 py-1.5 text-start text-sm hover:bg-muted aria-pressed:bg-muted aria-pressed:font-semibold">{he ? c.he : c.en}</button></li>
            ))}
          </ul>
          <div aria-live="polite" data-testid="map-detail">
            {!selected && <p className="text-sm text-muted-foreground">{he ? "בחרו מושג כדי לראות את השכנים שלו." : "Pick a concept to see its neighbours."}</p>}
            {selected && (
              <div className="space-y-4 text-sm">
                <h2 className="text-xl font-bold">{name(selected)}</h2>
                <p className="whitespace-pre-wrap break-words leading-6">{info ? info.text : (he ? "עדיין אין הסבר שמור למושג הזה." : "No stored explanation for this concept yet.")}</p>
                <div>
                  <h3 className="font-semibold">{he ? "מושגים קרובים" : "Nearby concepts"}</h3>
                  {near.length === 0 ? <p className="text-muted-foreground">{he ? "אין קישורים." : "No links."}</p> : (
                    <ul className="mt-1 flex flex-wrap gap-2">{near.map((n) => <li key={n.node.id}><button type="button" onClick={() => { setSelected(n.node.id); setTarget(""); }} className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted">{he ? n.node.he : n.node.en}{n.distance > 1 ? " ·" + n.distance : ""}</button></li>)}</ul>
                  )}
                </div>
                <label className="block"><span className="font-semibold">{he ? "מסלול אל מושג" : "Path to a concept"}</span>
                  <select value={target} onChange={(e) => setTarget(e.target.value)} className="mt-1 block w-full rounded-lg border bg-background p-2">
                    <option value="">{he ? "בחרו מושג" : "Choose a concept"}</option>
                    {allConcepts().filter((c) => c.id !== selected).map((c) => <option key={c.id} value={c.id}>{he ? c.he : c.en}</option>)}
                  </select>
                </label>
                {target && <p data-testid="map-path">{path ? path.map((p) => (he ? p.he : p.en)).join(he ? " ← " : " → ") : (he ? "אין קישור בין המושגים האלה." : "These two concepts are not linked.")}</p>}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}

const CATEGORY_HE: Record<string, string> = {
  personal: "אישי", investments: "השקעות", portfolio: "תיק", analysis: "ניתוח", finance: "פיננסים", regulation: "רגולציה", markets: "שווקים", careers: "קריירה",
};
