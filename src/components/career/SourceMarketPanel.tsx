import {CandleChart} from './CandleChart';
import {useRef,useState} from 'react';
import {useLanguage} from '@/context/languageContext';
import {getSourceQuote,type SourceQuote} from '@/lib/career/sourceQuotes';
/** Read-only source desk. No connection to fictional orders or client outcomes. */
export function SourceMarketPanel(){
  const {t,language}=useLanguage();
  const [symbol,setSymbol]=useState('AAPL');
  const [result,setResult]=useState<SourceQuote|null>(null);
  const [loading,setLoading]=useState(false);
  const [queried,setQueried]=useState('');
  const lock=useRef(false);
  const asset=result?.asset;
  async function inspect(){
    if(lock.current)return;lock.current=true;setLoading(true);setResult(null);setQueried(symbol.trim().toUpperCase());
    try{setResult(await getSourceQuote(symbol));}catch{setResult({asset:null,cached:false,fetchedAt:new Date().toISOString()});}
    finally{lock.current=false;setLoading(false);}
  }
  return <section aria-label={t('game_source_title')} className="rounded-xl border border-sky-500/60 bg-[#07101f] p-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{t('game_source_title')}</h2><span className="rounded border border-sky-400 px-2 py-1 text-xs text-sky-200">Yahoo Finance · {t('game_source_readonly')}</span></div>
    <p className="text-sm">{t('game_source_note')}</p>
    <form onSubmit={event=>{event.preventDefault();void inspect();}} className="flex flex-wrap items-end gap-2"><label className="text-sm">{t('game_source_symbol')}<input dir="ltr" maxLength={10} pattern="[A-Za-z0-9^.=-]{1,10}" required disabled={loading} value={symbol} onChange={event=>{setSymbol(event.target.value);setResult(null);}} className="mt-1 block w-40 rounded-lg border p-2"/></label><button type="submit" disabled={loading} className="rounded-lg bg-sky-300 px-4 py-2 font-semibold text-[#07101f] disabled:opacity-50">{t(loading?'game_source_loading':'game_source_inspect')}</button></form>
    <p className="text-xs text-slate-300">{t('game_source_coverage')}</p>
    {result&&!asset&&<p role="status" className="rounded border border-amber-400/50 bg-amber-400/10 p-3 text-sm"><b dir="ltr">{queried}</b>: {t('game_source_unavailable')} {result.cached&&t('game_source_cached')}</p>}
    {asset&&<div role="status" className="space-y-3"><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[[t('game_source_symbol'),asset.symbol],[t('game_source_price'),`${asset.price.toLocaleString(language==='he'?'he-IL':'en-US',{maximumFractionDigits:4})} ${asset.currency}`],[t('game_source_timestamp'),new Date(asset.timestamp!).toLocaleString(language==='he'?'he-IL':'en-US')],[t('game_source_age'),t(`game_source_${asset.freshness}`)]].map(([title,value])=><div key={title} className="min-w-0 rounded border border-slate-600 p-3"><p className="text-xs">{title}</p><p dir="ltr" className="mt-1 break-words font-mono text-sm">{value}</p></div>)}</div><p className="text-sm">{asset.name} · {t(`game_source_type_${asset.assetType}`)}</p><p className="text-xs">Yahoo Finance · {t('game_source_cached')}</p><CandleChart points={asset.history} symbol={asset.symbol} currency={asset.currency!}/><div className="max-h-52 overflow-auto"><table className="w-full text-sm"><caption className="text-start text-xs pb-2">{t('game_source_history')}</caption><thead><tr><th className="text-start">{t('game_source_date')}</th><th className="text-end">{t('game_source_price')} ({asset.currency})</th></tr></thead><tbody>{asset.history.slice(-10).map(point=><tr key={point.date} className="border-t border-slate-700"><td dir="ltr" className="p-2">{point.date}</td><td dir="ltr" className="p-2 text-end">{point.price.toLocaleString(undefined,{maximumFractionDigits:4})}</td></tr>)}</tbody></table></div></div>}
  </section>;
}
