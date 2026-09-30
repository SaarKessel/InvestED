import {CommitteeCases} from '@/components/career/CommitteeCases';
import {PracticeHistory} from '@/components/career/PracticeHistory';
import {archivePracticeRun} from '@/lib/career/practiceRuns';
import {SourceMarketPanel} from '@/components/career/SourceMarketPanel';
import {BoardEvidencePanel} from '@/components/career/BoardEvidencePanel';
import {useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Layout,DisclaimerBanner} from '@/components/layout/Layout';
import {useLanguage} from '@/context/languageContext';
import {ACCOUNTING_METRICS,AccountantConflictError,FICTIONAL_STATEMENTS,checkAccountingMetric,newAccountantGame,readAccountantGame,readyForBoard,saveAccountantGame,type AccountantGame} from '@/lib/career/accountantGame';

/** All statements and board choices are invented and remain device-local. */
export default function AccountantGamePage(){
  const {t,language}=useLanguage();
  const saved=useRef<AccountantGame|null>(readAccountantGame());
  const [game,setGame]=useState<AccountantGame>(()=>saved.current??newAccountantGame());
  const [error,setError]=useState('');
  const [statementIndex,setStatementIndex]=useState(0);
  const checkedCount=ACCOUNTING_METRICS.filter(metric=>game.checked.includes(metric)&&checkAccountingMetric(metric,game.answers[metric]??'')).length;
  function persist(next:AccountantGame){try{saveAccountantGame(next,saved.current);saved.current=next;setGame(next);setError('');}catch(cause){setError(t(cause instanceof AccountantConflictError?'account_conflict':'account_save_error'));}}
  const {income,balance,cashFlow}=FICTIONAL_STATEMENTS;
  const statements=[
    {title:'account_income',rows:[['account_revenue',income.revenue],['account_costOfSales',income.costOfSales],['account_operatingExpenses',income.operatingExpenses]]},
    {title:'account_balance',rows:[['account_cash',balance.cash],['account_receivables',balance.receivables],['account_inventory',balance.inventory],['account_fixedAssets',balance.fixedAssets],['account_currentLiabilities',balance.currentLiabilities],['account_longTermLiabilities',balance.longTermLiabilities],['account_equity',balance.equity]]},
    {title:'account_cashFlow',rows:[['account_operating',cashFlow.operating],['account_investing',cashFlow.investing],['account_financing',cashFlow.financing]]},
  ] as const;
  return <Layout><section className="container max-w-[1400px] py-8 space-y-5" dir={language==='he'?'rtl':'ltr'}>
    <div className="career-desk rounded-xl border border-teal-900/60 bg-[#0b1220] p-5 text-slate-100 shadow-xl space-y-5 [&_h1]:!text-slate-100 [&_h2]:!text-slate-100 [&_h3]:!text-slate-100 [&_p]:!text-slate-100 [&_input]:!text-slate-100 [&_input]:!bg-[#111d30] [&_textarea]:!text-slate-100 [&_textarea]:!bg-[#111d30]">
    <div className="flex items-center justify-between gap-3 border-b border-teal-500/30 pb-3 text-xs font-mono text-teal-200"><span dir="ltr">ACCOUNTING DESK</span><span>{t('game_ticker_fake')}</span></div>
    <Link to="/career-lab" className="text-sm text-teal-300 underline">{t('game_back')}</Link><h1 className="text-2xl font-bold">{t('account_title')}</h1>
    <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm">{t('account_disclaimer')}</p>
    <SourceMarketPanel/>
    <PracticeHistory runs={game.runs}/>
    <CommitteeCases role="reporting"/>
    <div className="flex flex-wrap gap-4 rounded-lg border border-teal-500/40 bg-[#111d30] px-3 py-2 text-xs font-mono text-teal-200"><span dir="ltr">HBR-F · FINANCIAL STATEMENTS</span><span>{t('desk_checked')}: {checkedCount}/3</span><span>{t(game.presented?'desk_closed':'desk_draft')}</span></div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,1fr)]"><div className="min-w-0 space-y-4">
    <section className="space-y-4"><h2 className="text-xl font-semibold">{t('account_report_title')}</h2><p>{t('account_company')}</p><div className="flex flex-wrap gap-2" aria-label={t('desk_statement_tabs')}>{statements.map((statement,index)=><button key={statement.title} type="button" aria-pressed={statementIndex===index} className={`rounded-lg border px-3 py-2 text-sm ${statementIndex===index?'border-teal-300 bg-teal-300/10':'border-slate-600'}`} onClick={()=>setStatementIndex(index)}>{t(statement.title)}</button>)}</div><div>{statements.filter((_,index)=>index===statementIndex).map(statement=><div className="min-w-0 rounded-xl border border-slate-700 bg-[#111d30] p-4" key={statement.title}><h3 className="mb-2 font-semibold">{t(statement.title)}</h3><table className="w-full table-fixed text-xs sm:text-sm tabular-nums"><caption className="sr-only">{t(statement.title)}</caption><tbody>{statement.rows.map(([key,value])=><tr className="border-t border-border/50" key={key}><th scope="row" className="w-2/3 p-2 text-start font-normal break-words">{t(key)}</th><td className="p-2 text-end" dir="ltr">{value}</td></tr>)}</tbody></table></div>)}</div><p className="text-xs text-slate-300">{t('account_report_note')}</p></section>
    <section className="rounded-xl border border-slate-700 bg-[#111d30] p-4 space-y-3"><h2 className="font-semibold">{t('desk_cash_bridge')}</h2><p className="text-xs">{t('desk_cash_bridge_note')}</p>{([['account_operating',cashFlow.operating],['account_investing',cashFlow.investing],['account_financing',cashFlow.financing]] as const).map(([key,value])=><div key={key} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-2 text-xs"><span>{t(key)}</span><div className="flex h-6" dir="ltr"><div className="flex w-1/2 justify-end border-e border-slate-600">{value<0&&<div className="h-full bg-rose-300" style={{width:`${Math.abs(value)/300*100}%`}}/>}</div><div className="w-1/2">{value>0&&<div className="h-full bg-teal-400" style={{width:`${value/300*100}%`}}/>}</div></div><b className="text-end font-mono" dir="ltr">{value}</b></div>)}</section>
    <section className="rounded-xl border border-slate-700 bg-[#111d30] p-4 space-y-4"><h2 className="text-xl font-semibold">{t('account_calculate')}</h2><p className="text-sm">{t('account_formulas')}</p>
      <div className="grid gap-4 md:grid-cols-3">{ACCOUNTING_METRICS.map(metric=><div key={metric} className="rounded-xl border border-slate-600 bg-[#0b1220] p-3 space-y-2"><label className="block text-sm font-medium">{t(`account_${metric}`)}<input type="text" inputMode="decimal" disabled={game.presented} value={game.answers[metric]??''} onChange={e=>setGame({...game,answers:{...game.answers,[metric]:e.target.value},checked:game.checked.filter(k=>k!==metric)})} className="mt-2 block w-full rounded-lg border border-border bg-background p-2"/></label><button type="button" disabled={game.presented} className="rounded-lg border border-primary p-2 text-sm" onClick={()=>setGame({...game,checked:game.checked.includes(metric)?game.checked:[...game.checked,metric]})}>{t('analyst_check')}</button>{game.checked.includes(metric)&&<p role="status" className="text-sm">{checkAccountingMetric(metric,game.answers[metric]??'')?t('analyst_correct'):t('analyst_retry')}</p>}</div>)}</div>
    </section></div><aside className="min-w-0 space-y-4"><section className="rounded-xl border border-slate-700 bg-[#111d30] p-4 space-y-4"><div className="flex justify-between gap-2 text-xs font-mono text-teal-200"><span>{t('desk_board_desk')}</span><span>{checkedCount}/3</span></div>
      <fieldset className="space-y-2"><legend className="font-semibold">{t('account_conclusion')}</legend><div className="flex flex-wrap gap-2">{(['cautious','confident'] as const).map(choice=><button key={choice} type="button" disabled={game.presented} aria-pressed={game.conclusion===choice} className={`rounded-lg border p-2 text-sm ${game.conclusion===choice?'border-primary bg-primary/10':'border-border'}`} onClick={()=>setGame({...game,conclusion:choice})}>{t(`account_${choice}`)}</button>)}</div></fieldset>
      {game.evidence!==undefined&&<BoardEvidencePanel role="accountant" selected={game.evidence} disabled={game.presented} onChange={evidence=>setGame({...game,evidence,followup:'none'})} followup={game.followup} onFollowup={followup=>setGame({...game,followup})}/>}
      <label className="block font-semibold">{t(game.evidence===undefined?'account_board_memo':'board_optional_note')}<textarea disabled={game.presented} value={game.boardMemo} onChange={e=>setGame({...game,boardMemo:e.target.value})} className="mt-2 block min-h-16 w-full rounded-xl border border-border bg-background p-3"/></label>
      {game.presented?<p role="status" className="rounded-lg border border-primary p-3">{t('account_presented')}</p>:<div className="flex flex-wrap gap-2"><button type="button" className="rounded-lg border border-primary p-3" onClick={()=>persist(game)}>{t('career_save')}</button><button type="button" disabled={!readyForBoard(game)} className="rounded-lg bg-teal-500 px-4 py-3 font-bold text-[#07101f] disabled:opacity-50" onClick={()=>persist({...game,presented:true})}>{t('account_present')}</button></div>}
    {game.presented&&<button type="button" className="rounded-lg border border-teal-300 p-3 text-sm" onClick={()=>{if(window.confirm(t('practice_restart_confirm')))persist({...newAccountantGame(),runs:archivePracticeRun(game.runs,'accountant',{checked:checkedCount,evidence:game.evidence?.length??0})});}}>{t('practice_restart')}</button>}</section></aside></div>{error&&<p role="alert" className="text-rose-300">{error}</p>}</div><DisclaimerBanner/>
  </section></Layout>;
}
