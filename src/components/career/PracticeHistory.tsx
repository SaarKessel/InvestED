import {useLanguage} from '@/context/languageContext';
import type {PracticeRun} from '@/lib/career/practiceRuns';
export function PracticeHistory({runs=[]}:{runs?:PracticeRun[]}){
 const {t,language}=useLanguage();
 return <details className="rounded-xl border border-slate-700 bg-[#111d30] p-4"><summary className="cursor-pointer text-sm font-semibold">{t('practice_history')} · {runs.length}</summary><p className="mt-3 text-xs">{t('practice_history_note')}</p>{runs.length===0?<p className="mt-3 text-sm">{t('practice_no_runs')}</p>:<ol className="mt-3 space-y-3">{[...runs].reverse().map(run=><li key={run.id} className="rounded border border-slate-600 p-3"><p className="text-xs">{new Date(run.finishedAt).toLocaleString(language==='he'?'he-IL':'en-US')}</p><dl className="mt-2 flex flex-wrap gap-3 text-sm">{Object.entries(run.metrics).map(([key,value])=><div key={key}><dt className="text-xs">{t(`practice_${key}`)}</dt><dd dir="ltr" className="font-mono">{value}{key==='netReturn'||key==='maxDrawdown'?'%':''}</dd></div>)}</dl></li>)}</ol>}</details>;
}
