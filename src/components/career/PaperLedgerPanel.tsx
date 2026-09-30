import {useRef,useState} from 'react';
import {useLanguage} from '@/context/languageContext';
import {getSourceQuote} from '@/lib/career/sourceQuotes';
import {buildSnapshot,newOrder,notionalByCurrency,PaperLedgerConflictError,positions,readLedger,recordOrder,type PaperOrder} from '@/lib/career/paperLedger';

/** Source-based paper-order ledger. Snapshots are immutable; nothing here executes orders or touches the fictional game ledger. */
export function PaperLedgerPanel(){
  const {t,language}=useLanguage();
  const [orders,setOrders]=useState<PaperOrder[]>(()=>readLedger());
  const expected=useRef<PaperOrder[]>(orders);
  const [symbol,setSymbol]=useState('AAPL');
  const [side,setSide]=useState<'buy'|'sell'>('buy');
  const [quantity,setQuantity]=useState('1');
  const [busy,setBusy]=useState(false);
  const [status,setStatus]=useState('');
  const [conflicted,setConflicted]=useState(false);
  const locale=language==='he'?'he-IL':'en-US';
  function loadLatest(){const latest=readLedger();expected.current=latest;setOrders(latest);setConflicted(false);setStatus('');}
  async function record(event:React.FormEvent){
    event.preventDefault();
    const qty=Number(quantity);
    if(busy||!Number.isFinite(qty)||qty<=0)return;
    setBusy(true);setStatus('');setConflicted(false);
    try{
      const quote=await getSourceQuote(symbol);
      const snapshot=quote.asset?buildSnapshot(quote.asset):null;
      if(!snapshot){setStatus(t('game_paper_unavailable'));return;}
      const next=recordOrder(newOrder(side,qty,snapshot),expected.current);
      expected.current=next;setOrders(next);
    }catch(cause){if(cause instanceof PaperLedgerConflictError)setConflicted(true);else setStatus(t('game_paper_unavailable'));}
    finally{setBusy(false);}
  }
  return <section aria-label={t('game_paper_title')} className="rounded-xl border border-amber-500/60 bg-[#101a10] p-4 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{t('game_paper_title')}</h2><span className="rounded border border-amber-400 px-2 py-1 text-xs text-amber-200">{t('game_paper_badge')}</span></div>
    <p className="text-sm">{t('game_paper_note')}</p>
    <form onSubmit={event=>{void record(event);}} className="flex flex-wrap items-end gap-2">
      <label className="text-sm">{t('game_paper_symbol')}<input dir="ltr" maxLength={10} pattern="[A-Za-z0-9^.=-]{1,10}" required disabled={busy} value={symbol} onChange={event=>setSymbol(event.target.value)} className="mt-1 block w-36 rounded-lg border p-2"/></label>
      <label className="text-sm">{t('game_paper_side')}<select disabled={busy} value={side} onChange={event=>setSide(event.target.value as 'buy'|'sell')} className="mt-1 block rounded-lg border p-2"><option value="buy">{t('game_paper_buy')}</option><option value="sell">{t('game_paper_sell')}</option></select></label>
      <label className="text-sm">{t('game_paper_quantity')}<input dir="ltr" type="number" min="0.0001" step="any" required disabled={busy} value={quantity} onChange={event=>setQuantity(event.target.value)} className="mt-1 block w-28 rounded-lg border p-2"/></label>
      <button type="submit" disabled={busy} className="rounded-lg bg-amber-300 px-4 py-2 font-semibold text-[#101a10] disabled:opacity-50">{t(busy?'game_paper_recording':'game_paper_record')}</button>
    </form>
    {status&&<p role="status" className="rounded border border-amber-400/50 bg-amber-400/10 p-3 text-sm">{status}</p>}
    {conflicted&&<p role="alert" className="rounded border border-rose-400/60 bg-rose-400/10 p-3 text-sm">{t('game_paper_conflict')} <button type="button" className="underline" onClick={loadLatest}>{t('game_paper_load_latest')}</button></p>}
    <h3 className="font-semibold">{t('game_paper_positions')}</h3>
    {positions(orders).length===0?<p className="text-sm text-slate-300">{t('game_paper_empty')}</p>:
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-4">{positions(orders).map(position=><li key={`${position.currency}:${position.symbol}`} className="rounded border border-slate-600 p-3 text-sm"><b dir="ltr" className="font-mono">{position.symbol}</b><span dir="ltr" className="mt-1 block font-mono">{position.netQuantity.toLocaleString(locale,{maximumFractionDigits:4})} · {position.currency}</span></li>)}</ul>}
    {notionalByCurrency(orders).length>0&&<p className="text-xs text-slate-300">{t('game_paper_notional')}: {notionalByCurrency(orders).map(row=><span key={row.currency} dir="ltr" className="me-3 inline-block font-mono">{row.currency} +{row.bought.toLocaleString(locale,{maximumFractionDigits:2})} / -{row.sold.toLocaleString(locale,{maximumFractionDigits:2})}</span>)}</p>}
    {orders.length>0&&<div className="max-h-52 overflow-auto"><table className="w-full text-sm"><caption className="text-start text-xs pb-2">{t('game_paper_orders')}</caption><thead><tr><th className="text-start">{t('game_paper_side')}</th><th className="text-start">{t('game_paper_symbol')}</th><th className="text-end">{t('game_paper_quantity')}</th><th className="text-end">{t('game_paper_snapshot')}</th></tr></thead><tbody>{[...orders].reverse().map(order=><tr key={order.id} className="border-t border-slate-700"><td className="p-2">{t(`game_paper_${order.side}`)}</td><td dir="ltr" className="p-2 font-mono">{order.snapshot.symbol}</td><td dir="ltr" className="p-2 text-end font-mono">{order.quantity.toLocaleString(locale,{maximumFractionDigits:4})}</td><td dir="ltr" className="p-2 text-end font-mono">{order.snapshot.price.toLocaleString(locale,{maximumFractionDigits:4})} {order.snapshot.currency} · {new Date(order.snapshot.sourceTimestamp).toLocaleString(locale)} · {t(`game_source_${order.snapshot.freshness}`)}</td></tr>)}</tbody></table></div>}
    <p className="text-xs text-slate-300">{t('game_paper_snapshot_note')}</p>
  </section>;
}
