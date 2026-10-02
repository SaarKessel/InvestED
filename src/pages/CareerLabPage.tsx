import {GameFamilies} from '@/components/career/GameFamilies';
import { useEffect, useRef, useState } from 'react';
import { Layout, DisclaimerBanner } from '@/components/layout/Layout';
import { useLanguage } from '@/context/languageContext';
import { fetchMarketAssetBySymbol } from '@/lib/marketData';
import { ResearchHistoryChart } from '@/components/assetResearch/ResearchHistoryChart';
import { FICTIONAL_MANDATES, simulatedAllocation, type AllocationScenario } from '@/lib/career/allocation';
import { fictionalStress } from '@/lib/career/stress';
import { checkProvenanceChoice } from '@/lib/career/lessonCheck';
import type { MarketAsset } from '@/types';
import { advance, archiveCompletedCase, canAdvance, CaseConflictError, inventedEvidenceSnapshot, newCase, readCase, readCaseArchive, review, saveCase, skillEvidence, type AssistanceLevel, type EvidenceSnapshot, type ResearchCase } from '@/lib/career/engine';
import { CAREER_TRACKS, getTrack } from '@/lib/career/tracks';

export default function CareerLabPage() {
  const {t,language}=useLanguage();
  const [trackId,setTrackId]=useState<string>(()=>CAREER_TRACKS[0].id);
  const track=getTrack(trackId);
  /** Track-specific copy with the shared analyst wording as fallback. */
  const tk=(suffix:string)=>t(`${track.contentKey}_${suffix}`,t(`career_${suffix}`));
  const saved=useRef<ResearchCase | null>(readCase(trackId));
  const [record,setRecord]=useState<ResearchCase>(()=>saved.current??newCase(new Date(),trackId));
  const draft=useRef<ResearchCase>(record);
  const requestVersion=useRef(0);
  const [loading,setLoading]=useState(false);
  const [showQueue,setShowQueue]=useState(false);
  const [error,setError]=useState('');
  const [archive,setArchive]=useState<ResearchCase[]>(()=>readCaseArchive(trackId));
  const [conflicted,setConflicted]=useState(false);
  const archived=useRef(false);
  useEffect(()=>{ if(!archived.current && saved.current?.stage==='complete') { archived.current=true; try { setArchive(archiveCompletedCase(saved.current,trackId)); } catch { /* the saved case itself is unaffected when its archive copy fails */ } } },[trackId]);
  function selectTrack(id:string) { const track=getTrack(id); if(!track.available||id===trackId) return; const latest=readCase(id); saved.current=latest; draft.current=latest??newCase(new Date(),id); setRecord(draft.current); setTrackId(id); setArchive(readCaseArchive(id)); setError(''); setConflicted(false); if(latest?.stage==='complete'){try{setArchive(archiveCompletedCase(latest,id));}catch{/* the loaded case remains saved even if its archive copy fails */}} }
  const [marketHistory,setMarketHistory]=useState<MarketAsset['history']>([]);
  function update(patch:Partial<ResearchCase>) { const next={...draft.current,...patch,updatedAt:new Date().toISOString()};draft.current=next;setRecord(next); }
  function persist(next:ResearchCase):boolean { try { saveCase(next,saved.current,trackId);saved.current=next;draft.current=next;setRecord(next);setError('');setConflicted(false);return true; } catch (cause) {const conflict=cause instanceof CaseConflictError;setConflicted(conflict);setError(t(conflict?'career_conflict':'career_storage_error'));return false;} }
  /** Recovery only reads: the newer snapshot is shown, and the next save is a fresh guarded write. */
  function loadLatest() { const latest=readCase(trackId);saved.current=latest;draft.current=latest??newCase(new Date(),trackId);setRecord(draft.current);setError('');setConflicted(false);if(latest?.stage==='complete'){try{setArchive(archiveCompletedCase(latest,trackId));}catch{/* the loaded case remains saved even if its archive copy fails */}} }
  async function loadEvidence() {
    const caseId=draft.current.id;
    const version=++requestVersion.current;
    setLoading(true);setError('');
    try {
      const symbol=track.evidenceSymbol;
      if(!symbol){
        const snapshot=inventedEvidenceSnapshot(trackId);
        if(!snapshot || draft.current.id!==caseId || draft.current.stage!=='research'){setError(t('career_no_data'));return;}
        persist({...draft.current,evidence:snapshot,updatedAt:new Date().toISOString()});
        return;
      }
      const asset=await fetchMarketAssetBySymbol(symbol);
      if (draft.current.id!==caseId || draft.current.stage!=='research' || version!==requestVersion.current) return;
      if (!asset || asset.isMock!==false || !asset.dataSource || !['alpha_vantage','yahoo_finance'].includes(asset.dataSource) ||
        !asset.timestamp || Number.isNaN(Date.parse(asset.timestamp)) || !asset.currency || !/^[A-Z]{3}$/.test(asset.currency) ||
        !Number.isFinite(asset.price) || asset.price<=0 || !asset.freshness || !['current','recent','stale'].includes(asset.freshness)) {
        setError(t('career_no_data'));return;
      }
      // The quote may arrive after the learner edits the thesis or opens another case.
      const current=draft.current;
      if (current.id!==caseId || current.stage!=='research' || version!==requestVersion.current) return;
      const evidence:EvidenceSnapshot={symbol,price:asset.price,currency:asset.currency,
        source:asset.dataSource as EvidenceSnapshot['source'],timestamp:asset.timestamp,
        freshness:asset.freshness as EvidenceSnapshot['freshness'],capturedAt:new Date().toISOString()};
      const history=asset.history.filter(point=>point.date<=asset.timestamp!.slice(0,10) && Number.isFinite(point.close) && point.close>0);
      if (persist({...current,evidence,updatedAt:new Date().toISOString()})) setMarketHistory(history);
    } catch { if (draft.current.id===caseId && draft.current.stage==='research' && version===requestVersion.current) setError(t('career_no_data')); }
    finally { if (version===requestVersion.current) setLoading(false); }
  }
  const taskStatus=(stage:ResearchCase['stage'])=>record.stage===stage?t('career_task_active'):
    ['lesson','practice','research','defense','review','improve','complete'].indexOf(record.stage)>['lesson','practice','research','defense','review','improve','complete'].indexOf(stage)?t('career_task_done'):t('career_task_locked');
  const field=(key:'lessonAnswer'|'practiceAnswer'|'thesis'|'bearCase'|'risk'|'defense'|'improvement',label:string)=><label className="block space-y-2 font-medium"><span>{label}</span><textarea className="w-full min-h-28 rounded-xl border border-border bg-background p-3 text-foreground" value={record[key]} onChange={e=>update({[key]:e.target.value})}/></label>;
  return <Layout><section className="container max-w-7xl py-10 space-y-6" dir={language==='he'?'rtl':'ltr'}>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-primary">{t('career_workspace')}</p><h1 className="mt-2 text-3xl font-bold">{tk('heading')}</h1><p className="mt-3 max-w-3xl">{t('career_intro')}</p></div><div className="rounded-xl border border-border bg-card p-3 text-xs"><p>{t('career_role')}: {t(`${track.contentKey}_title`)}</p><p>{t('career_mode')}: {t('career_local_mode')}</p></div></div>
    <p className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">{t('career_local')}</p>
    <GameFamilies/>
    <div className="grid gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="space-y-4" aria-label={t('career_task_board')}>
        <div className="rounded-2xl border border-border bg-card p-4"><h2 className="font-bold">{t('career_tracks')}</h2><ol className="mt-3 space-y-2">{CAREER_TRACKS.map(track=><li key={track.id}>{track.available?<button type="button" aria-pressed={trackId===track.id} className={`w-full rounded-lg border p-3 text-start text-sm ${trackId===track.id?'border-primary bg-primary/10 font-bold':'border-border'}`} onClick={()=>selectTrack(track.id)}>{t(`${track.contentKey}_title`)}</button>:<p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground">{t(`${track.contentKey}_title`)} · {t('career_track_locked')}</p>}</li>)}</ol></div>
        <div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between gap-2"><h2 className="font-bold">{t('career_task_board')}</h2><button type="button" className="rounded-lg border border-border px-3 py-1 text-xs lg:hidden" aria-expanded={showQueue} onClick={()=>setShowQueue(!showQueue)}>{showQueue?t('career_hide_queue'):t('career_show_queue')}</button></div><p className="mt-1 text-xs text-muted-foreground">{t('career_task_board_note')}</p>
          <ol className={`mt-4 space-y-2 ${showQueue?'':'hidden lg:block'}`}>{(['lesson','practice','research','defense','review','improve','complete'] as const).map((s,i)=><li key={s} aria-current={record.stage===s?'step':undefined} className={`rounded-lg border p-3 text-sm ${record.stage===s?'border-primary bg-primary/10 font-bold':'border-border'}`}><span className="block">{i+1}. {tk(`stage_${s}`)}</span><span className="text-xs text-muted-foreground">{taskStatus(s)}</span></li>)}</ol><p className="mt-3 text-sm font-semibold text-primary lg:hidden">{tk(`stage_${record.stage}`)} · {t('career_task_active')}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4"><h2 className="font-bold">{t('career_work_tools')}</h2><p className="mt-1 text-xs text-muted-foreground">{t('career_work_tools_note')}</p>
          <div className="mt-3 flex flex-col gap-2"><a className="rounded-lg border border-border p-2 text-sm hover:border-primary" href="/research" target="_blank" rel="noopener noreferrer">{t('career_tool_research')}</a><a className="rounded-lg border border-border p-2 text-sm hover:border-primary" href="/calculator" target="_blank" rel="noopener noreferrer">{t('career_tool_calculator')}</a><a className="rounded-lg border border-border p-2 text-sm hover:border-primary" href="/strategy-lab" target="_blank" rel="noopener noreferrer">{t('career_tool_strategy')}</a><a className="rounded-lg border border-border p-2 text-sm hover:border-primary" href="/learn" target="_blank" rel="noopener noreferrer">{t('career_tool_university')}</a></div>
        </div>
      </aside>
      <div className="min-w-0 rounded-2xl border border-border bg-card p-5 space-y-5">

      <h2 className="text-xl font-semibold">{tk(`stage_${record.stage}`)}</h2>
      <label className="block space-y-2">{t('career_assist')} <select disabled={record.stage==='complete'} className="block rounded-lg border border-border bg-background p-2" value={record.assistance} onChange={e=>update({assistance:Number(e.target.value) as AssistanceLevel})}>{[0,1,2,3,4].map(i=><option value={i} key={i}>{t(`career_level${i}`)}</option>)}</select></label>
      <p className="text-sm text-muted-foreground">{t('career_assist_note')}</p>
      {record.stage==='lesson'&&<><div className="rounded-xl border border-border p-4 space-y-3"><h3 className="font-semibold">{t('career_source_exercise')}</h3><p>{t('career_source_prompt')}</p><div className="grid gap-2 sm:grid-cols-2">{(['withoutSource','withSource'] as const).map(choice=><button type="button" key={choice} aria-pressed={record.provenanceChoice===choice} className={`rounded-lg border p-3 text-start text-sm ${record.provenanceChoice===choice?'border-primary bg-primary/10':'border-border'}`} onClick={()=>update({provenanceChoice:choice})}>{t(`career_source_${choice}`)}</button>)}</div><p role="status" className="text-sm">{t(`career_source_${checkProvenanceChoice(record.provenanceChoice??'noChoice')}`)}</p></div>{track.allocationDesk&&<SimulationDesk t={t} allocation={record.allocationDecision} onAllocation={decision=>update({allocationDecision:decision})} />}{field('lessonAnswer',tk('lesson'))}</>}
      {record.stage==='practice'&&<>{track.allocationDesk&&<SimulationDesk t={t} allocation={record.allocationDecision} onAllocation={decision=>update({allocationDecision:decision})} />}{field('practiceAnswer',tk('practice'))}</>}
      {record.stage==='research'&&<><p>{tk('case_question')}</p><button type="button" disabled={loading} onClick={loadEvidence} className="rounded-lg border border-primary px-4 py-2 disabled:opacity-50">{loading?t('career_loading'):tk('load')}</button>
        {record.evidence&&<div className="rounded-lg border border-border p-3 text-sm" dir="ltr"><b>{t('career_evidence')}</b>: {record.evidence.symbol} {record.evidence.price} {record.evidence.currency} | {record.evidence.source} | {record.evidence.timestamp} | {record.evidence.freshness}<p>{record.evidence.source==='invented_teaching_input'?t('career_evidence_invented_note'):t('career_source_note')}</p></div>}
        {marketHistory.length>1&&record.evidence&&<ResearchHistoryChart history={marketHistory} currency={record.evidence.currency}/>}
        {record.evidence&&marketHistory.length<2&&<p className="text-sm text-muted-foreground">{t('career_chart_unavailable')}</p>}
        {field('thesis',tk('thesis'))}{field('bearCase',tk('bear'))}{field('risk',tk('risk'))}</>}
      {record.stage==='defense'&&field('defense',tk('defense'))}
      {record.stage==='review'&&<>{track.allocationDesk&&<SimulationDesk t={t} allocation={record.allocationDecision} onAllocation={decision=>update({allocationDecision:decision})} />}<ul className="list-disc ps-6">{review(record).map(k=><li key={k}>{t(`career_review_${k}`)}</li>)}</ul></>}
      {record.stage==='improve'&&<>{track.allocationDesk&&<SimulationDesk t={t} allocation={record.allocationDecision} onAllocation={decision=>update({allocationDecision:decision})} />}<ul className="list-disc ps-6">{review(record).map(k=><li key={k}>{t(`career_review_${k}`)}</li>)}</ul>{field('improvement',tk('improve'))}</>}
      {record.stage==='complete'&&<><p>{t('career_complete')}</p><p className="break-all text-sm" dir="ltr">{t('career_verification')}: {record.id}</p><p className="text-sm">{t('career_assist')}: {record.assistance}</p>
        <dl className="grid gap-3 sm:grid-cols-2">{(['startedAt','completedAt'] as const).map(k=><div key={k} className="rounded-lg border border-border p-3"><dt className="text-xs text-muted-foreground">{t(`career_${k}`)}</dt><dd dir="ltr">{record[k]}</dd></div>)}</dl>
        <h3 className="font-semibold">{t('career_evidence_summary')}</h3>
        {record.evidence&&<p className="break-all text-sm" dir="ltr">{record.evidence.symbol} {record.evidence.price} {record.evidence.currency} | {record.evidence.source} | {record.evidence.timestamp} | {record.evidence.freshness}</p>}
        <h3 className="font-semibold">{t('career_skill_practice')}</h3><ul className="list-disc ps-6">{skillEvidence(record).map(e=><li key={e.skill}>{t(`career_skill_${e.skill}`)}: {t('career_practiced')}</li>)}</ul>
        {record.allocationDecision&&<><h3 className="font-semibold">{t('career_sim_decision')}</h3><p>{t(`career_${record.allocationDecision.scenario??'base'}`)}: <span dir="ltr">{t('career_asset_equity')}: {record.allocationDecision.equity}%, {t('career_asset_cash')}: {record.allocationDecision.cash}%, {t('career_asset_bonds')}: {100-record.allocationDecision.equity-record.allocationDecision.cash}%</span></p>{review(record).filter(k=>k==='equityLimit'||k==='liquidityFloor').map(k=><p key={k}>{t(`career_review_${k}`)}</p>)}</>}
        <h3 className="font-semibold">{t('career_decision_record')}</h3>
        <p className="whitespace-pre-wrap">{record.thesis}</p><h4 className="font-semibold">{tk('bear')}</h4><p className="whitespace-pre-wrap">{record.bearCase}</p>
        <h4 className="font-semibold">{tk('risk')}</h4><p className="whitespace-pre-wrap">{record.risk}</p>
        <h4 className="font-semibold">{tk('defense')}</h4><p className="whitespace-pre-wrap">{record.defense}</p>
        <h4 className="font-semibold">{tk('improve')}</h4><p className="whitespace-pre-wrap">{record.improvement}</p>
        <h3 className="font-semibold">{t('career_archive_title')}</h3>
        <p className="text-xs text-muted-foreground">{t('career_archive_note')}</p>
        {archive.length===0?<p className="text-sm">{t('career_archive_empty')}</p>:<ol className="space-y-2">{[...archive].reverse().map(item=><li key={item.id} className="rounded-lg border border-border p-3 text-sm"><p dir="ltr">{t('career_completedAt')}: {item.completedAt}</p><p dir="ltr">{t('career_assist')}: {item.assistance} · {t('career_verification')}: {item.id}</p></li>)}</ol>}
        <button className="rounded-lg border p-3" onClick={()=>persist(newCase(new Date(),trackId))}>{t('career_new')}</button></>}
      {error&&<p role="alert" className="text-red-600">{error}</p>}
      {conflicted&&<button type="button" className="rounded-lg border border-primary px-4 py-2" onClick={loadLatest}>{t('career_load_latest')}</button>}
      {record.stage!=='complete'&&<div className="flex flex-wrap gap-3"><button type="button" className="rounded-lg border border-primary p-3" onClick={()=>persist(record)}>{t('career_save')}</button><button type="button" disabled={!canAdvance(record)} className="rounded-lg bg-primary px-5 py-3 text-white disabled:opacity-50" onClick={()=>{const next=advance(record);if(persist(next)&&next.stage==='complete'){try{setArchive(archiveCompletedCase(next,trackId));}catch{/* the completed case remains saved even if its archive copy fails */}}}}>{t('career_next')}</button>{!canAdvance(record)&&<span className="text-sm text-muted-foreground">{t('career_required')}</span>}</div>}
      </div>
    </div><DisclaimerBanner /></section></Layout>;
}

/** Fixed fictional mandate used only inside the exercise. Never label these values as market quotes. */
function SimulationDesk({t,allocation:decision,onAllocation}:{t:(key:string)=>string;allocation?:{equity:number;cash:number;scenario?:AllocationScenario}|null;onAllocation:(next:{equity:number;cash:number;scenario:AllocationScenario})=>void}) {
  const equity=decision?.equity??60;
  const cash=decision?.cash??10;
  const scenario=decision?.scenario??'base';
  const allocation=simulatedAllocation(equity,cash,scenario);
  const mandate=FICTIONAL_MANDATES[scenario];
  const shock=fictionalStress(equity,cash,scenario);
  const holdings=([{key:'equity',pct:allocation.equity},{key:'bonds',pct:allocation.bonds},{key:'cash',pct:allocation.cash}]).map(row=>({name:t(`career_asset_${row.key}`),pct:row.pct}));
  return <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-4">
    <div><h3 className="font-semibold">{t('career_sim_desk')}</h3><p className="text-sm text-muted-foreground">{t('career_sim_fictional')}</p></div>
    <fieldset><legend className="font-medium">{t('career_scenarios')}</legend><div className="mt-2 flex flex-wrap gap-2">{(['base','stress'] as const).map(next=><button type="button" key={next} aria-pressed={scenario===next} className={`rounded-lg border p-2 text-sm ${scenario===next?'border-primary bg-primary/15':'border-border'}`} onClick={()=>onAllocation({equity,cash,scenario:next})}>{t(`career_${next}`)}</button>)}</div></fieldset>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">{t('career_equity_weight')}: <b dir="ltr">{equity}%</b><input className="mt-2 w-full accent-primary" type="range" min="0" max={100-cash} step="5" value={equity} onChange={event=>onAllocation({equity:Number(event.target.value),cash,scenario})}/></label><label className="block text-sm">{t('career_cash_weight')}: <b dir="ltr">{cash}%</b><input className="mt-2 w-full accent-primary" type="range" min="0" max={100-equity} step="5" value={cash} onChange={event=>onAllocation({equity,cash:Number(event.target.value),scenario})}/></label></div>
    <p className="text-sm">{t('career_mandate')}: {t('career_max_equity')} {mandate.maximumEquity}%, {t('career_min_cash')} {mandate.minimumCash}%</p>
    <div className="space-y-2" role="img" aria-label={t('career_allocation_chart')}>
      {holdings.map(row=><div key={row.name} className="grid grid-cols-[4.5rem_minmax(0,1fr)_2.5rem] items-center gap-1 sm:grid-cols-[7rem_minmax(0,1fr)_2.5rem] sm:gap-2 text-sm"><span>{row.name}</span><div className="h-4 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{width:`${row.pct}%`}}/></div><b dir="ltr">{row.pct}%</b></div>)}
    </div>
    <div className="overflow-x-auto" tabIndex={0}><table className="w-full min-w-[230px] text-sm"><caption className="sr-only">{t('career_sim_table')}</caption><thead><tr className="border-b border-border"><th scope="col" className="p-2 text-start">{t('career_asset')}</th><th scope="col" className="p-2 text-end">{t('career_allocation')}</th></tr></thead><tbody>{holdings.map(row=><tr key={row.name} className="border-b border-border/50"><th scope="row" className="p-2 text-start">{row.name}</th><td className="p-2 text-end" dir="ltr">{row.pct}%</td></tr>)}</tbody></table></div>
    <div className="rounded-xl border border-border bg-background/70 p-3 space-y-2 text-sm"><h4 className="font-semibold">{t('career_stress_heading')}</h4><p className="text-xs text-muted-foreground">{t('career_stress_disclaimer')}</p>
      <div className="overflow-x-auto" tabIndex={0}><table className="w-full min-w-[260px] table-fixed text-xs sm:text-sm tabular-nums"><caption className="sr-only">{t('career_stress_table')}</caption><thead><tr className="border-b"><th scope="col" className="p-1 text-start">{t('career_asset')}</th><th scope="col" className="p-1 text-end">{t('career_allocation')}</th><th scope="col" className="p-1 text-end">{t('career_stress_shock')}</th><th scope="col" className="p-1 text-end">{t('career_stress_impact')}</th></tr></thead><tbody>{shock.rows.map(row=><tr key={row.asset} className="border-b border-border/50"><th scope="row" className="p-1 text-start font-normal break-words">{t(`career_asset_${row.asset}`)}</th><td dir="ltr" className="p-1 text-end">{row.weight}%</td><td dir="ltr" className="p-1 text-end">{row.shock}%</td><td dir="ltr" className="p-1 text-end">{row.contribution.toFixed(1)} {t('career_stress_pp')}</td></tr>)}</tbody><tfoot><tr className="font-semibold"><th scope="row" className="p-1 text-start">{t('career_stress_total')}</th><td/><td/><td dir="ltr" className="p-1 text-end">{shock.total.toFixed(1)} {t('career_stress_pp')}</td></tr></tfoot></table></div>
    </div>
    <p className="text-sm">{allocation.equityLimitMet?t('career_constraint_met'):t('career_constraint_exceeded')}</p><p className="text-sm">{allocation.liquidityFloorMet?t('career_liquidity_met'):t('career_liquidity_exceeded')}</p><p className="text-xs text-muted-foreground">{decision?t('career_decision_captured'):t('career_decision_required')}</p>
  </div>;
}
