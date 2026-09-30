import {CommitteeCases} from '@/components/career/CommitteeCases';
import {PracticeHistory} from '@/components/career/PracticeHistory';
import {archivePracticeRun} from '@/lib/career/practiceRuns';
import {SourceMarketPanel} from '@/components/career/SourceMarketPanel';
import {BoardEvidencePanel} from '@/components/career/BoardEvidencePanel';
import {useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {Layout,DisclaimerBanner} from '@/components/layout/Layout';
import {useLanguage} from '@/context/languageContext';
import {ANALYST_METRICS,AnalystConflictError,FICTIONAL_REPORT,checkMetric,newAnalystGame,readAnalystGame,readyToSubmit,saveAnalystGame,type AnalystGame} from '@/lib/career/analystGame';

export default function AnalystGamePage(){
  const {t,language}=useLanguage();
  const saved=useRef<AnalystGame|null>(readAnalystGame());
  const [game,setGame]=useState<AnalystGame>(()=>saved.current??newAnalystGame());
  const [error,setError]=useState('');
  const [focus,setFocus]=useState<'revenue'|'operatingProfit'|'sharePrice'|'dividend'>('revenue');
  const checkedCount=ANALYST_METRICS.filter(metric=>game.checked.includes(metric)&&checkMetric(metric,game.answers[metric]??'')).length;
  const values=FICTIONAL_REPORT.rows.map(row=>row[focus]);
  const scale=Math.max(...values,1);
  function persist(next:AnalystGame){try{saveAnalystGame(next,saved.current);saved.current=next;setGame(next);setError('');}catch(cause){setError(t(cause instanceof AnalystConflictError?'analyst_conflict':'analyst_save_error'));}}
  function update(next:AnalystGame){setGame(next);}
  return <Layout><section className="container max-w-[1400px] py-8 space-y-5" dir={language==='he'?'rtl':'ltr'}>
    <div className="career-desk rounded-xl border border-teal-900/60 bg-[#0b1220] p-5 text-slate-100 shadow-xl space-y-5 [&_h1]:!text-slate-100 [&_h2]:!text-slate-100 [&_h3]:!text-slate-100 [&_p]:!text-slate-100 [&_input]:!text-slate-100 [&_input]:!bg-[#111d30] [&_textarea]:!text-slate-100 [&_textarea]:!bg-[#111d30]">
    <div className="flex items-center justify-between gap-3 border-b border-teal-500/30 pb-3 text-xs font-mono text-teal-200"><span dir="ltr">ANALYST WORKSTATION</span><span>{t('game_ticker_fake')}</span></div>
    <Link to="/career-lab" className="text-sm text-teal-300 underline">{t('game_back')}</Link><h1 className="text-2xl font-bold">{t('analyst_game_title')}</h1>
    <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm">{t('analyst_game_disclaimer')}</p>
    <SourceMarketPanel/>
    <PracticeHistory runs={game.runs}/>
    <CommitteeCases role="research"/>
    <div className="flex flex-wrap gap-4 rounded-lg border border-teal-500/40 bg-[#111d30] px-3 py-2 text-xs font-mono text-teal-200"><span dir="ltr">NST-F · REPORT Y1 / Y2</span><span>{t('desk_checked')}: {checkedCount}/3</span><span>{t(game.submitted?'desk_closed':'desk_draft')}</span></div>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,1fr)]"><div className="min-w-0 space-y-4">
    <section className="rounded-xl border border-slate-700 bg-[#111d30] p-4 space-y-4"><h2 className="text-xl font-semibold">{t('analyst_report')}</h2><p>{t('analyst_report_company')}</p>
      <div className="flex flex-wrap gap-2" aria-label={t('desk_inspect_line')}>{(['revenue','operatingProfit','sharePrice','dividend'] as const).map(key=><button key={key} type="button" aria-pressed={focus===key} className={`rounded-lg border px-3 py-2 text-xs ${focus===key?'border-teal-300 bg-teal-300/10':'border-slate-600'}`} onClick={()=>setFocus(key)}>{t(`analyst_${key}`)}</button>)}</div>
      <div className="rounded-lg border border-slate-700 bg-[#07101f] p-4"><h3 className="mb-3 text-sm font-semibold">{t(`analyst_${focus}`)} · {t('desk_game_units')}</h3><div className="space-y-4">{values.map((value,index)=><div key={index} className="grid grid-cols-[3rem_1fr_4rem] items-center gap-3 text-xs"><span>{t(index===0?'analyst_year1':'analyst_year2')}</span><div className="h-7 rounded bg-slate-800"><div className={`h-full rounded ${index===0?'bg-slate-500':'bg-teal-400'}`} style={{width:`${value/scale*100}%`}}/></div><b className="text-end font-mono" dir="ltr">{value}</b></div>)}</div><p className="mt-4 text-xs text-slate-300">{t('desk_source_link')}</p></div>
      <div className="overflow-x-auto"><table className="w-full table-fixed text-xs sm:text-sm tabular-nums"><caption className="sr-only">{t('analyst_report_table')}</caption><thead><tr className="border-b"><th scope="col" className="p-2 text-start">{t('analyst_row')}</th>{FICTIONAL_REPORT.rows.map(row=><th key={row.year} scope="col" className="p-2 text-end">{t(row.year==='Year 1'?'analyst_year1':'analyst_year2')}</th>)}</tr></thead><tbody>{(['revenue','operatingProfit','sharePrice','dividend'] as const).map(key=><tr key={key} className="border-b border-border/50"><th scope="row" className="w-2/5 p-2 text-start break-words">{t(`analyst_${key}`)}</th>{FICTIONAL_REPORT.rows.map(row=><td key={row.year} dir="ltr" className="p-2 text-end">{row[key]}</td>)}</tr>)}</tbody></table></div>
      <p className="text-xs text-slate-300">{t('analyst_report_note')}</p>
    </section>
    <section className="rounded-xl border border-slate-700 bg-[#111d30] p-4 space-y-4"><h2 className="text-xl font-semibold">{t('analyst_calculate')}</h2><p className="text-sm">{t('analyst_calculate_note')}</p>
      <div className="grid gap-4 md:grid-cols-3">{ANALYST_METRICS.map(metric=><div key={metric} className="rounded-xl border border-slate-600 bg-[#0b1220] p-3 space-y-2"><label className="block font-medium text-sm">{t(`analyst_${metric}`)} (%)<input type="text" inputMode="decimal" disabled={game.submitted} value={game.answers[metric]??''} onChange={e=>update({...game,answers:{...game.answers,[metric]:e.target.value},checked:game.checked.filter(k=>k!==metric)})} className="mt-2 block w-full rounded-lg border border-border bg-background p-2"/></label><button type="button" disabled={game.submitted} className="rounded-lg border border-primary p-2 text-sm" onClick={()=>update({...game,checked:game.checked.includes(metric)?game.checked:[...game.checked,metric]})}>{t('analyst_check')}</button>{game.checked.includes(metric)&&<p role="status" className="text-sm">{checkMetric(metric,game.answers[metric]??'')?t('analyst_correct'):t('analyst_retry')}</p>}</div>)}</div>
    </section></div><aside className="min-w-0 space-y-4"><section className="rounded-xl border border-slate-700 bg-[#111d30] p-4 space-y-4"><div className="flex justify-between gap-2 text-xs font-mono text-teal-200"><span>{t('desk_board_desk')}</span><span>{checkedCount}/3</span></div>
      <fieldset className="space-y-2"><legend className="font-semibold">{t('analyst_board_choice')}</legend><div className="flex flex-wrap gap-2">{(['review','proceed'] as const).map(choice=><button key={choice} type="button" disabled={game.submitted} aria-pressed={game.boardChoice===choice} className={`rounded-lg border p-2 text-sm ${game.boardChoice===choice?'border-primary bg-primary/10':'border-border'}`} onClick={()=>update({...game,boardChoice:choice})}>{t(`analyst_board_${choice}`)}</button>)}</div></fieldset>
      {game.evidence!==undefined&&<BoardEvidencePanel role="analyst" selected={game.evidence} disabled={game.submitted} onChange={evidence=>setGame({...game,evidence,followup:'none'})} followup={game.followup} onFollowup={followup=>setGame({...game,followup})}/>}
      <label className="block font-medium">{t(game.evidence===undefined?'analyst_board_memo':'board_optional_note')}<textarea disabled={game.submitted} value={game.memo} onChange={e=>update({...game,memo:e.target.value})} className="mt-2 block min-h-16 w-full rounded-xl border border-border bg-background p-3"/></label>
      {game.submitted?<p role="status" className="rounded-lg border border-primary p-3">{t('analyst_submitted')}</p>:<div className="flex flex-wrap gap-2"><button type="button" className="rounded-lg border border-primary p-3" onClick={()=>persist(game)}>{t('career_save')}</button><button type="button" disabled={!readyToSubmit(game)} className="rounded-lg bg-teal-500 px-4 py-3 font-bold text-[#07101f] disabled:opacity-50" onClick={()=>persist({...game,submitted:true})}>{t('analyst_submit')}</button></div>}
    {game.submitted&&<button type="button" className="rounded-lg border border-teal-300 p-3 text-sm" onClick={()=>{if(window.confirm(t('practice_restart_confirm')))persist({...newAnalystGame(),runs:archivePracticeRun(game.runs,'analyst',{checked:checkedCount,evidence:game.evidence?.length??0})});}}>{t('practice_restart')}</button>}</section></aside></div>{error&&<p role="alert" className="text-rose-300">{error}</p>}</div><DisclaimerBanner/>
  </section></Layout>;
}
