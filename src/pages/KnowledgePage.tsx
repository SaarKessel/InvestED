import { FormEvent, useCallback, useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useLanguage } from "@/context/languageContext";
import { useAuth } from "@/context/useAuth";
import { addKnowledge, deleteGap, deleteKnowledge, importFeeds, isOwner, loadOwnerData, searchKnowledge } from "@/lib/knowledge/knowledgeClient";
import { FIXED_CHECK_QUESTIONS } from "@/lib/knowledge/knowledge";
import { buildInsuranceNotes, buildRateNotes } from "@/lib/knowledge/feeds";
import { fetchBisRateHistory } from "@/lib/bisRateClient";
import { fetchInsuranceReports } from "@/lib/insuranceClient";

type Data = Awaited<ReturnType<typeof loadOwnerData>>;

/** Owner-only: feed knowledge, see what users could not get answered, check hit rate. */
export default function KnowledgePage() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [owner, setOwner] = useState<boolean | null>(null);
  const [data, setData] = useState<Data | null>(null);
  const [form, setForm] = useState({ title: "", body: "", lang: "he" as "he" | "en", source_label: "", source_url: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [check, setCheck] = useState<Array<{ q: string; hits: number }> | null>(null);

  const refresh = useCallback(async () => setData(await loadOwnerData()), []);
  useEffect(() => { if (!user) { setOwner(null); return; } void isOwner().then((o) => { setOwner(o); if (o) void refresh(); }); }, [user, refresh]);

  async function submit(e: FormEvent) {
    e.preventDefault(); setMsg(null);
    const err = await addKnowledge({ title: form.title.trim(), body: form.body.trim(), lang: form.lang, source_label: form.source_label.trim(), source_url: form.source_url.trim() || null, published_at: new Date().toISOString().slice(0, 10) });
    if (err) { setMsg(err); return; }
    setForm({ ...form, title: "", body: "" }); setMsg(t("kbo_saved")); await refresh();
  }
  async function pullFeeds() {
    setMsg(null);
    try {
      const [rate, ins] = await Promise.all([fetchBisRateHistory().catch(() => null), fetchInsuranceReports().catch(() => null)]);
      const n = await importFeeds([...(rate ? buildRateNotes(rate) : []), ...(ins ? buildInsuranceNotes(ins) : [])]);
      setMsg(`${t("kbo_feeds_done")} ${n}`); await refresh();
    } catch { setMsg(t("kbo_error")); }
  }
  async function runCheck() { setCheck(await Promise.all(FIXED_CHECK_QUESTIONS.map(async (q) => ({ q, hits: (await searchKnowledge(q)).length })))); }

  const box = "rounded-2xl border border-border/60 bg-muted/30 p-4";
  const field = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
  let body;
  if (loading || (user && owner === null)) body = <p className="text-sm text-muted-foreground" role="status">…</p>;
  else if (!user || !owner) body = <p className="text-sm text-muted-foreground">{t("kbo_denied")}</p>;
  else body = (
    <div className="space-y-6">
      <div className={`${box} grid grid-cols-2 gap-3 text-sm sm:grid-cols-4`}>
        <div><p className="text-xs text-muted-foreground">{t("kbo_stat_items")}</p><p className="font-semibold">{data?.stats.items ?? 0}</p></div>
        <div><p className="text-xs text-muted-foreground">{t("kbo_stat_up")}</p><p className="font-semibold">{data?.stats.up ?? 0}</p></div>
        <div><p className="text-xs text-muted-foreground">{t("kbo_stat_down")}</p><p className="font-semibold">{data?.stats.down ?? 0}</p></div>
        <div><p className="text-xs text-muted-foreground">{t("kbo_stat_gaps")}</p><p className="font-semibold">{data?.stats.gaps ?? 0}</p></div>
      </div>
      <form onSubmit={submit} className={`${box} space-y-3`}>
        <p className="text-sm font-semibold">{t("kbo_add")}</p>
        <input required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t("kbo_title")} className={field} />
        <textarea required maxLength={4000} rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder={t("kbo_body")} className={field} />
        <div className="grid gap-3 sm:grid-cols-3">
          <input required maxLength={200} value={form.source_label} onChange={(e) => setForm({ ...form, source_label: e.target.value })} placeholder={t("kbo_source")} className={field} />
          <input type="url" dir="ltr" value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="https://" className={field} />
          <select value={form.lang} onChange={(e) => setForm({ ...form, lang: e.target.value as "he" | "en" })} className={field}><option value="he">עברית</option><option value="en">English</option></select>
        </div>
        <button type="submit" className="h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">{t("kbo_save")}</button>
      </form>
      <div className={`${box} flex flex-wrap items-center gap-3`}>
        <button type="button" onClick={() => void pullFeeds()} className="h-10 rounded-xl border border-primary px-4 text-sm font-semibold text-primary">{t("kbo_pull")}</button>
        <button type="button" onClick={() => void runCheck()} className="h-10 rounded-xl border border-border px-4 text-sm font-semibold">{t("kbo_check")}</button>
        {msg && <span role="status" className="text-xs text-muted-foreground">{msg}</span>}
      </div>
      {check && <div className={box}><p className="mb-2 text-sm font-semibold">{t("kbo_check_title")}: {check.filter((c) => c.hits > 0).length}/{check.length}</p><ul className="space-y-1 text-xs">{check.map((c) => <li key={c.q} className="flex justify-between gap-3"><span>{c.q}</span><span>{c.hits > 0 ? "✓" : "✗"}</span></li>)}</ul></div>}
      <div className={box}>
        <p className="mb-2 text-sm font-semibold">{t("kbo_gaps")}</p>
        {!data?.gaps.length ? <p className="text-xs text-muted-foreground">{t("kbo_none")}</p> : <ul className="space-y-1 text-xs">{data.gaps.map((g) => <li key={g.id} className="flex items-center justify-between gap-3"><span>{g.question} <span className="text-muted-foreground">({g.reason})</span></span><button type="button" onClick={() => void deleteGap(g.id).then(refresh)} className="text-muted-foreground hover:text-foreground">×</button></li>)}</ul>}
      </div>
      <div className={box}>
        <p className="mb-2 text-sm font-semibold">{t("kbo_items")}</p>
        {!data?.items.length ? <p className="text-xs text-muted-foreground">{t("kbo_none")}</p> : <ul className="space-y-2 text-xs">{data.items.map((k) => <li key={k.id} className="flex items-start justify-between gap-3"><span><b>{k.title}</b> <span className="text-muted-foreground">({k.lang}, {k.kind}, {k.source_label}{k.published_at ? `, ${k.published_at}` : ""})</span></span><button type="button" onClick={() => void deleteKnowledge(k.id).then(refresh)} className="text-muted-foreground hover:text-foreground">×</button></li>)}</ul>}
      </div>
    </div>
  );
  return <Layout><section className="container max-w-3xl py-8"><h1 className="mb-5 text-2xl font-semibold">{t("kbo_title")}</h1>{body}</section></Layout>;
}
