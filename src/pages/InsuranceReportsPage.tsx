import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Layout, DisclaimerBanner } from '@/components/layout/Layout';
import { useLanguage } from '@/context/languageContext';
import { fetchInsuranceReports, type InsuranceResult } from '@/lib/insuranceClient';
import { INSURANCE_DATASET, INSURANCE_LICENSE } from '@/lib/insuranceData';

const copy = {
  he: {
    tag: 'נתוני ביטוח רשמיים', title: 'ביטוח נט: דוחות חודשיים', intro: 'מבט מצומצם על מסלולי פוליסות חיסכון מתוך מאגר רשות שוק ההון באתר המידע הממשלתי. אין כאן תשואה אישית או מחיר בזמן אמת.',
    loading: 'טוען דוח רשמי...', unavailable: 'המאגר הרשמי אינו זמין כרגע. לא מוצגים נתונים חלופיים.',
    live: 'נתונים מהמאגר הרשמי', cached: 'עותק שמור מהמאגר הרשמי', month: 'חודש הדיווח', retrieved: 'נשלף',
    monthly: 'תשואה חודשית מדווחת', ytd: 'תשואה מתחילת השנה', fee: 'דמי ניהול שנתיים ממוצעים', missing: 'לא דווח',
    caveat: 'תשואות מדווחות ברוטו לפני דמי ניהול. דמי הניהול הם שדה נפרד ואין להפחית אותם ישירות מהתשואה החודשית; העלות בפוליסה האישית עשויה להיות שונה. הדוח חודשי ואינו מעודכן בזמן אמת. מוצגים עד 24 מסלולים ראשונים בדוח, לא דירוג או השוואה מלאה.',
    source: 'מקור: רשות שוק ההון, מאגר ביטוח נט באתר data.gov.il', terms: 'תנאי השימוש במידע הממשלתי', back: 'חזרה למחשבון', classification: 'סיווג',
  },
  en: {
    tag: 'Official insurance data', title: 'Insurance Net: monthly reports', intro: 'A limited view of savings-policy tracks from Israel’s Capital Market Authority dataset on the government data portal. These are not personal returns or live prices.',
    loading: 'Loading official report...', unavailable: 'The official data is unavailable right now. No substitute figures are shown.',
    live: 'From the official dataset', cached: 'Cached official data', month: 'Report month', retrieved: 'Retrieved',
    monthly: 'Reported monthly return', ytd: 'Year-to-date return', fee: 'Average annual management fee', missing: 'Not reported',
    caveat: 'Reported returns are gross, before management fees. The fee is a separate field and cannot simply be subtracted from a monthly return; your own policy may have a different cost. Reports are monthly, not real-time. Up to the first 24 tracks in the report are shown, not a ranking or a full comparison.',
    source: 'Source: Capital Market Authority, Insurance Net dataset on data.gov.il', terms: 'Government data terms of use', back: 'Back to calculator', classification: 'Category',
  },
} as const;

export default function InsuranceReportsPage() {
  const { language } = useLanguage();
  const c = copy[language];
  const [result, setResult] = useState<InsuranceResult | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { let active = true; fetchInsuranceReports().then(value => { if (active) setResult(value); }).catch(() => { if (active) setFailed(true); }); return () => { active = false; }; }, []);
  const period = result?.reportPeriod;
  const month = period ? new Intl.DateTimeFormat(language === 'he' ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(Math.floor(period / 100), period % 100 - 1, 1))) : null;
  const percent = (value: number | null) => value === null ? c.missing : `${new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', { maximumFractionDigits: 2 }).format(value)}%`;
  return <Layout><section className="container max-w-5xl py-10 md:py-16">
    <div className="mb-5 flex items-center gap-2 text-sm font-bold text-primary"><ShieldCheck aria-hidden="true" className="h-5 w-5" />{c.tag}</div>
    <h1 className="font-display text-3xl font-extrabold md:text-4xl">{c.title}</h1>
    <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">{c.intro}</p>
    {!result && !failed && <p role="status" className="mt-8 rounded-xl border border-border bg-card p-5">{c.loading}</p>}
    {(failed || result?.status === 'unavailable') && <p role="status" className="mt-8 rounded-xl border border-warning/40 bg-warning/10 p-5">{c.unavailable}</p>}
    {result && result.status !== 'unavailable' && <>
      <div className="mt-8 rounded-2xl border border-primary/20 bg-card p-5 text-sm leading-7">
        <p className="font-bold text-primary">{result.status === 'live' ? c.live : c.cached}</p>
        <p>{c.month}: <strong>{month}</strong>{result.fetchedAt && <> · {c.retrieved}: <time dateTime={result.fetchedAt}>{new Date(result.fetchedAt).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', { timeZone: 'Asia/Jerusalem' })}</time></>}</p>
        <p className="mt-2 text-muted-foreground">{c.caveat}</p>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {result.records.map(row => <article key={`${row.reportPeriod}-${row.fundId}`} className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="break-words font-bold leading-6">{row.name}</h2>
          {row.classification && <p className="mt-2 text-xs text-muted-foreground">{c.classification}: {row.classification}</p>}
          <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4 text-sm">
            {([[c.monthly, row.monthlyYield], [c.ytd, row.yearToDateYield], [c.fee, row.averageAnnualManagementFee]] as const).map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs leading-5 text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold tabular-nums" dir="ltr">{percent(value)}</dd></div>)}
          </dl>
        </article>)}
      </div>
    </>}
    <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-primary">
      <a href={INSURANCE_DATASET} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">{c.source}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
      <a href={INSURANCE_LICENSE} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4">{c.terms}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
    </div>
    <Link to="/calculator" className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">{c.back}</Link>
    <DisclaimerBanner className="mt-5" />
  </section></Layout>;
}
