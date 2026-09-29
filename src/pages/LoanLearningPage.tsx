import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, ExternalLink } from 'lucide-react';
import { Layout, DisclaimerBanner } from '@/components/layout/Layout';
import { useLanguage } from '@/context/languageContext';
import { estimateFixedLoan } from '@/lib/loanEducation';

const BOI_LOANS = 'https://boi.org.il/information/bank-paymnts/financial-education/campaigns/boi-equator/loans/';
const BOI_RATES = 'https://www.boi.org.il/roles/statistics/boi-interest-rate-and-the-monetary-tools/boi-interest-rate-and-the-monetary-tools';

export default function LoanLearningPage() {
  const { t, language } = useLanguage();
  const [principal, setPrincipal] = useState('10000');
  const [rate, setRate] = useState('6');
  const [months, setMonths] = useState('24');
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
    <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-5 text-sm leading-7">
      <h2 className="font-bold">{t('loan_sources')}</h2>
      <p className="mt-2 text-muted-foreground">{t('loan_sources_note')}</p>
      <div className="mt-3 flex flex-wrap gap-4">
        <a href={BOI_LOANS} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4">{t('loan_boi_compare')}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
        <a href={BOI_RATES} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4">{t('loan_boi_rates')}<ExternalLink className="h-4 w-4" aria-hidden="true" /></a>
      </div>
    </div>
    <Link to="/calculator" className="mt-6 inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-4">{t('loan_back')}</Link>
    <DisclaimerBanner className="mt-6" />
  </section></Layout>;
}
