import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ExternalLink } from 'lucide-react';
import { Layout, DisclaimerBanner } from '@/components/layout/Layout';
import { useLanguage } from '@/context/languageContext';
import { estimateFixedLoan } from '@/lib/loanEducation';
import { BIS_RATE_METHODOLOGY, BIS_RATE_SERIES, BIS_RATE_TERMS } from '@/lib/bisPolicyRate';
import { fetchBisRateHistory, type BisRateResult } from '@/lib/bisRateClient';

const BOI_LOANS = 'https://boi.org.il/information/bank-paymnts/financial-education/campaigns/boi-equator/loans/';
const BOI_RATES = 'https://www.boi.org.il/roles/statistics/boi-interest-rate-and-the-monetary-tools/boi-interest-rate-and-the-monetary-tools';

export default function LoanLearningPage() {
  const { t, language } = useLanguage();
  const [principal, setPrincipal] = useState('10000');
  const [rate, setRate] = useState('6');
  const [months, setMonths] = useState('24');
  const [bisHistory, setBisHistory] = useState<BisRateResult | null>(null);
  useEffect(() => { let active = true; fetchBisRateHistory().then(data => { if (active) setBisHistory(data); }).catch(() => { if (active) setBisHistory({status:'unavailable', points:[], latestObservation:null, fetchedAt:null, source:BIS_RATE_SERIES}); }); return () => { active = false; }; }, []);
  const estimate = principal.trim() && rate.trim() && months.trim()
    ? estimateFixedLoan(Number(principal), Number(rate), Number(months))
    : null;
  const money = (amount: number) => new Intl.NumberFormat(language === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency: 'ILS', maximumFractionDigits: 2 }).format(amount);
  const field = (id: string, label: string, value: string, set: (value: string) => void, min: string, max: string, step: string) => <label htmlFor={id} className="block text-sm font-semibold text-foreground">{label}
    <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value} onChange={event => set(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
  </label>;
  return <Layout><section className="container max-w-4xl py-10 md:py-16">
    <div className="mb-8 flex items-center gap-3 text-primary"><Calculator aria-hidden="true" className="h-6 w-6"/><span className="text-xs font-bold uppercase tracking-wide">{t('loan_tag')}</span></div>
    <h1 className="font-display text-3xl font-extrabold md:text-4xl">{t('loan_title')}</h1>
    <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{t('loan_intro')}</p>
    <div className="mt-8 rounded-3xl border border-primary/20 bg-card p-5 shadow-soft md:p-7">
      <h2 className="text-xl font-bold">{t('loan_inputs')}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        {field('loan-principal', t('loan_principal'), principal, setPrincipal, '1', '100000000', '100')}
        {field('loan-rate', t('loan_rate'), rate, setRate, '0', '100', '0.1')}
        {field('loan-months', t('loan_months'), months, setMonths, '1', '600', '1')}
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{t('loan_rate_note')}</p>
      {!estimate ? <p role="status" className="mt-6 rounded-xl border border-border bg-muted p-4 text-sm">{t('loan_invalid')}</p>
      : <div aria-live="polite" className="mt-6 grid gap-3 sm:grid-cols-3">
        {([['loan_monthly', estimate.monthlyPayment], ['loan_total', estimate.totalPaid], ['loan_interest', estimate.totalInterest]] as const).map(([key, value]) => <div className="rounded-2xl border border-border bg-background p-4" key={key}><p className="text-sm text-muted-foreground">{t(key)}</p><p className="mt-2 font-display text-xl font-bold tabular-nums" dir="ltr">{money(value)}</p></div>)}
      </div>}
      <p className="mt-5 text-sm leading-6 text-muted-foreground">{t('loan_formula')}</p>
    </div>
    <section className="mt-8 rounded-3xl border border-primary/20 bg-card p-5 shadow-soft md:p-7" aria-label={language === 'he' ? 'היסטוריית ריבית הבנק המרכזי' : 'Central bank policy rate history'}>
      <h2 className="text-xl font-bold">{language === 'he' ? 'היסטוריית ריבית בנק ישראל לפי BIS' : 'BIS history: Bank of Israel policy rate'}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{language === 'he' ? 'תיעוד היסטורי חודשי של ריבית המדיניות בסוף החודש, לא שיעור עדכני, לא הצעת הלוואה ולא ריבית לצרכן. אינו מוזן למחשבון שלמעלה.' : 'Historical month-end policy rates, not a current rate, loan offer or consumer borrowing rate. These figures do not feed the calculator above.'}</p>
      {!bisHistory && <p role="status" className="mt-5 text-sm">{language === 'he' ? 'טוען היסטוריה...' : 'Loading history...'}</p>}
      {bisHistory?.status === 'unavailable' && <p role="status" className="mt-5 text-sm">{language === 'he' ? 'היסטוריית BIS אינה זמינה כעת. לא מוצג שיעור חלופי.' : 'BIS history is unavailable. No substitute rate is shown.'}</p>}
      {bisHistory && bisHistory.status !== 'unavailable' && bisHistory.points.length > 0 && <>
        <p className="mt-5 text-sm font-bold text-primary">{language === 'he' ? 'תצפית אחרונה' : 'Last observation'}: <time dateTime={`${bisHistory.latestObservation}-01`}>{new Date(`${bisHistory.latestObservation}-01T00:00:00Z`).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', {month:'long', year:'numeric', timeZone:'UTC'})}</time> · <span dir="ltr" className="inline-block tabular-nums">{bisHistory.points.at(-1)?.rate}%</span></p>
        <p className="mt-1 text-xs text-muted-foreground">{bisHistory.status === 'cached' ? (language === 'he' ? 'עותק שמור' : 'Cached copy') : (language === 'he' ? 'נתוני BIS שנשלפו' : 'BIS data retrieved')}{bisHistory.fetchedAt ? ` · ${new Date(bisHistory.fetchedAt).toLocaleString(language === 'he' ? 'he-IL' : 'en-US', {timeZone:'Asia/Jerusalem'})}` : ''}</p>
        <div className="mt-6 overflow-x-auto" dir="ltr"><div className="flex min-w-[720px] items-end gap-2 border-b border-border pb-2" role="img" aria-label={language === 'he' ? 'תרשים היסטורי של ריבית המדיניות לפי חודש' : 'Historical monthly policy rate chart'}>
          {bisHistory.points.map((point, index) => <div key={point.month} className="group flex min-w-0 flex-1 flex-col items-center gap-1" title={`${point.month}: ${point.rate}%`}><span className="text-[10px] tabular-nums text-muted-foreground group-hover:text-foreground">{index % 3 === 0 || index === bisHistory.points.length - 1 ? `${point.rate}%` : " "}</span><div className="w-full rounded-t bg-primary/65" style={{height: `${Math.max(8, Math.min(72, point.rate * 16))}px`}} /><span className="text-[10px] tabular-nums text-muted-foreground">{index % 3 === 0 || index === bisHistory.points.length - 1 ? (point.month.slice(5) === '01' || point.month === bisHistory.points[0].month ? point.month : point.month.slice(5)) : " "}</span></div>)}
        </div></div>
      </>}
      <p className="mt-5 text-xs leading-6 text-muted-foreground">{language === 'he' ? 'מקור: BIS, סדרת ריביות מדיניות; מקור לאומי: בנק ישראל. התוויות בעברית אינן תרגום רשמי של BIS. אין חסות או המלצה מטעם BIS.' : 'Source: BIS central bank policy rates; national source: Bank of Israel. Any Hebrew labels are not an official BIS translation. No BIS endorsement or recommendation.'}</p>
      <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold text-primary"><a href={BIS_RATE_SERIES} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">BIS data</a><a href={BIS_RATE_METHODOLOGY} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{language === 'he' ? 'מתודולוגיה' : 'Methodology'}</a><a href={BIS_RATE_TERMS} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{language === 'he' ? 'תנאי שימוש' : 'Use terms'}</a></div>
    </section>
    <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5 text-sm leading-7">
      <h2 className="font-bold">{t('loan_sources')}</h2>
      <p className="mt-2 text-muted-foreground">{t('loan_sources_note')}</p>
      <div className="mt-3 flex flex-wrap gap-4">
        <a href={BOI_LOANS} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4">{t('loan_boi_compare')}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
        <a href={BOI_RATES} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4">{t('loan_boi_rates')}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
      </div>
    </div>
    <Link to="/insurance-reports" className="mt-6 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">{language === 'he' ? 'נתוני ביטוח נט הרשמיים' : 'Official Insurance Net reports'}</Link>
    <br />
    <Link to="/calculator" className="mt-6 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">{t('loan_back')}</Link>
    <DisclaimerBanner className="mt-6" />
  </section></Layout>;
}
