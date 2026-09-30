import {CommitteeCases} from '@/components/career/CommitteeCases';
import {PracticeHistory} from '@/components/career/PracticeHistory';
import {archivePracticeRun} from '@/lib/career/practiceRuns';
import {CandleChart} from '@/components/career/CandleChart';
import {fictionalCandles} from '@/lib/career/candles';
import {SourceMarketPanel} from '@/components/career/SourceMarketPanel';
import {ClientInbox} from '@/components/career/ClientInbox';
import { useRef,useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout,DisclaimerBanner } from '@/components/layout/Layout';
import { useLanguage } from '@/context/languageContext';
import {INSTRUMENTS,instrumentPrice,holding,type Instrument,CLIENT_PROFILES,portfolioClients,portfolioResult,GAME_DAYS,GAME_TARGET,GameConflictError,GameActionError,newPortfolioGame,playPortfolioGame,portfolioValue,readPortfolioGame,savePortfolioGame,type GameAction,type PortfolioGame} from '@/lib/career/portfolioGame';

/** Device-local fictional game plus isolated, read-only sourced market inspection. */
export default function PortfolioGamePage(){
  const {t,language}=useLanguage();
  const saved=useRef<PortfolioGame|null>(readPortfolioGame());
  const [game,setGame]=useState<PortfolioGame>(()=>saved.current??newPortfolioGame());
  const [quantity,setQuantity]=useState(1);
  const [instrument,setInstrument]=useState<Instrument>('NST-F');
  const [error,setError]=useState('');
  const [showNews,setShowNews]=useState(false);
  const [selectedDay,setSelectedDay]=useState<number|null>(null);
  const result=game.settled?portfolioResult(game):null;
  const finished=game.day===GAME_DAYS.length-1;
  const price=instrumentPrice(game,instrument);
  const position=holding(game,instrument);
  const value=portfolioValue(game);
  const previousPrice=game.day>0?instrumentPrice(game,instrument,game.day-1):price;
  const priceChange=price-previousPrice;
  const priceChangePercent=priceChange/previousPrice*100;
  const inspectedDay=Math.min(selectedDay??game.day,game.day);
  const inspectedTrades=game.trades.filter(trade=>trade.day===inspectedDay&&(trade.instrument??'NST-F')===instrument);
  const positionWeight=value===0?0:position.shares*price/value*100;
  const prices=GAME_DAYS.slice(0,game.day+1).map((_,i)=>({day:i+1,price:instrumentPrice(game,instrument,i)}));
  const clientStatuses=portfolioClients(game);
  const goalProgress=Math.min(100,Math.round(value/GAME_TARGET*100));
  const quickAmounts=[1,5,10].filter(q=>q<=Math.floor(game.cash/price)||q<=position.shares);
  function persist(next:PortfolioGame){
    try {savePortfolioGame(next,saved.current);saved.current=next;setGame(next);setError('');return true;}
    catch(cause){setError(t(cause instanceof GameConflictError?'game_conflict':'game_save_error'));return false;}
  }
  function act(action:GameAction){try{const next=playPortfolioGame(game,action);if(persist(next)&&action.type==='next')setShowNews(true);}catch(cause){setError(t(cause instanceof GameActionError?'game_action_error':'game_save_error'));}}
  return <Layout><section className="container max-w-[1500px] py-7 space-y-5" dir={language==='he'?'rtl':'ltr'}>
    <div className="career-desk rounded-xl border border-teal-900/60 bg-[#0b1220] p-5 text-slate-100 shadow-xl [&_h1]:!text-slate-100 [&_h2]:!text-slate-100 [&_h3]:!text-slate-100 [&_p]:!text-slate-100 [&_input]:!text-slate-100 [&_input]:!bg-[#111d30] [&_input]:!border-slate-600">
    <div><Link to="/career-lab" className="text-sm text-teal-300 underline">{t('game_back')}</Link><h1 className="mt-3 text-3xl font-bold">{t('game_title')}</h1><p className="mt-2 text-slate-300">{t('game_intro')}</p></div>
    <p className="rounded-xl border border-amber-400/50 bg-amber-400/10 p-4 text-sm">{t('game_disclaimer')}</p>
    <div className="flex items-center gap-3 overflow-hidden rounded-lg border border-teal-500/40 bg-[#111d30] px-3 py-2 text-xs font-mono text-teal-200" aria-label={t('game_ticker')}><b className="shrink-0 rounded border border-teal-400 px-2 py-1">{t('game_ticker_fake')}</b><div className="flex min-w-0 flex-wrap gap-x-5 gap-y-1"><span dir="ltr">{instrument} {price.toFixed(2)} {priceChange>0?'▲':priceChange<0?'▼':'●'} {game.day+1}/{GAME_DAYS.length}</span><span dir="ltr">CASH {game.cash.toFixed(2)}</span><span dir="ltr">POSITION {position.shares}</span><span dir="ltr">NAV {value.toFixed(2)}</span></div></div>
    <SourceMarketPanel/>
    <PracticeHistory runs={game.runs}/>
    <CommitteeCases role="investment"/>
    <section className="rounded-xl border border-slate-700 bg-[#111d30] p-3 space-y-3"><div className="flex flex-wrap gap-2">{(['base','stress'] as const).map(scenario=><button key={scenario} type="button" disabled={!!game.settled||game.day>0||Object.values(game.clientPlans??{}).some(plans=>plans?.some(plan=>plan!=='none'))||game.trades.length>0||game.replies.some(reply=>reply!=='none')||Object.values(game.clientReplies??{}).some(replies=>replies?.some(reply=>reply!=='none'))} aria-pressed={(game.scenario??'base')===scenario} className="rounded border border-slate-500 px-3 py-2 text-sm disabled:opacity-50" onClick={()=>act({type:'scenario',scenario})}>{t(`game_scenario_${scenario}`)}</button>)}</div><p className="text-xs">{t('game_scenario_note')}</p><div className="grid grid-cols-3 gap-2">{INSTRUMENTS.map(id=><button key={id} type="button" aria-pressed={instrument===id} className={`rounded-lg border p-3 text-start ${instrument===id?'border-teal-300 bg-teal-300/10':'border-slate-600'}`} onClick={()=>setInstrument(id)}><b className="block font-mono text-xs" dir="ltr">{id} · {instrumentPrice(game,id).toFixed(2)}</b><span className="block mt-1 text-xs">{t(`game_instrument_${id}`)}</span><span className="block mt-1 text-xs">{t('game_shares')}: {holding(game,id).shares}</span></button>)}</div></section>
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label={t('game_dashboard')}>
      {([['game_day',`${game.day+1}/${GAME_DAYS.length}`],['game_value',`${value.toFixed(2)} ${t('game_units')}`],['game_clients',String(clientStatuses.filter(client=>client.active).length)],['game_fee',`${game.feeEarned.toFixed(2)} ${t('game_units')}`]] as const).map(([key,v])=><div key={key} className="rounded-xl border border-slate-700 bg-[#111d30] p-4"><p className="text-xs text-slate-300">{t(key)}</p><p className="font-semibold tabular-nums" dir="ltr">{v}</p></div>)}
    </section>
    <div className="rounded-xl border border-slate-700 bg-[#111d30] p-3"><div className="flex justify-between gap-2 text-xs"><span>{t('game_target')}: <b dir="ltr">{GAME_TARGET}</b></span><span dir="ltr">{goalProgress}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-700" role="progressbar" aria-label={t('game_target')} aria-valuenow={goalProgress} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-teal-400" style={{width:`${goalProgress}%`}}/></div><p className="mt-2 text-xs text-slate-300">{t('game_target_note')}</p></div>
    {result&&<section className="rounded-xl border border-teal-400/50 bg-[#07101f] p-5 space-y-4" aria-label={t('game_result_title')}><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-2xl font-bold">{t('game_result_title')}</h2><b className="text-xs text-amber-200">{t('game_ticker_fake')}</b></div><p className="text-sm">{t('game_settled_note')}</p><dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">{([['game_result_net',result.netChange.toFixed(2)],['game_result_return',`${result.netReturn.toFixed(2)}%`],['game_result_gross',result.grossChange.toFixed(2)],['game_result_fee',result.managerFee.toFixed(2)],['game_result_cash',result.finalValue.toFixed(2)],['game_result_drawdown',`${result.maxDrawdown.toFixed(2)}%`],['game_result_retained',`${result.retained}/3`],['game_target',String(GAME_TARGET)]] as const).map(([key,value])=><div key={key} className="rounded-lg border border-slate-600 bg-[#111d30] p-3"><dt className="text-xs">{t(key)}</dt><dd className="mt-1 font-mono text-lg" dir="ltr">{value}</dd></div>)}</dl><p className="text-sm">{t(result.targetReached?'game_reached':'game_missed')} {t(result.retained===3?'game_result_clients_all':'game_result_clients_lost')}</p><h3 className="font-semibold">{t('game_debrief')}</h3><ul className="list-disc space-y-2 ps-5 text-sm"><li>{t(result.managerFee>0?'game_debrief_fee':'game_debrief_no_fee')}</li><li>{t(result.guarantees>0?'game_debrief_guarantee':result.unanswered>0?'game_debrief_silence':'game_debrief_honest')}</li><li>{t('game_debrief_drawdown')}</li></ul><p className="text-xs text-slate-300">{t('game_result_local')}</p></section>}
    {showNews&&<div role="status" className="rounded-xl border border-amber-400 bg-amber-400/10 p-4"><b>{t('game_news_alert')}</b>: {t(game.scenario==='stress'?`game_stress_news_${game.day}`:`game_news_${GAME_DAYS[game.day].news}`)} <button className="ms-2 underline" type="button" onClick={()=>setShowNews(false)}>{t('game_dismiss')}</button></div>}
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
      <section className="min-w-0 space-y-4 rounded-xl border border-slate-700 bg-[#111d30] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">{t('game_chart')}</h2><span dir="ltr" className={`rounded border px-3 py-1 font-mono text-sm ${priceChange<0?'border-rose-400/50 text-rose-200':'border-teal-400/50 text-teal-200'}`}>{instrument} · {priceChange>=0?'+':''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)</span></div><p className="text-sm text-slate-300">{t('game_chart_note')}</p>
        <CandleChart points={fictionalCandles(prices)} symbol={instrument} currency={t('game_units')} fictional onSelect={setSelectedDay} markers={game.trades.filter(trade=>(trade.instrument??'NST-F')===instrument).map(trade=>({index:trade.day,side:trade.side}))}/>
        <div className="flex flex-wrap gap-2" aria-label={t('game_inspect_day')}>{prices.map(p=><button key={p.day} type="button" aria-pressed={inspectedDay===p.day-1} onClick={()=>setSelectedDay(p.day-1)} className={`rounded border px-3 py-2 text-xs ${inspectedDay===p.day-1?'border-teal-300 bg-teal-300/10':'border-slate-600'}`}>{t('game_day')} {p.day}</button>)}</div>
        <div className="rounded-lg border border-slate-600 bg-[#07101f] p-3 text-sm" role="status"><span>{t('game_day')} {inspectedDay+1}: </span><b dir="ltr">{instrumentPrice(game,instrument,inspectedDay)} {t('game_units')}</b><p className="mt-1 text-xs">{t(game.scenario==='stress'?`game_stress_news_${inspectedDay}`:`game_news_${GAME_DAYS[inspectedDay].news}`)}</p><p className="mt-1 text-xs">{t('game_trades')}: {inspectedTrades.length===0?t('game_no_orders'):inspectedTrades.map(trade=>`${t(`game_${trade.side}`)} ${trade.quantity} @ ${trade.price}`).join(' · ')}</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[270px] text-sm tabular-nums"><caption className="sr-only">{t('game_prices')}</caption><thead><tr><th className="text-start">{t('game_day')}</th><th className="text-end">{t('game_price')}</th></tr></thead><tbody>{prices.map(p=><tr className="border-t" key={p.day}><th scope="row" className="text-start p-2">{p.day}</th><td dir="ltr" className="text-end p-2">{p.price} {t('game_units')}</td></tr>)}</tbody></table></div>
        <p>{t('game_price_now')}: <b dir="ltr">{price} {t('game_units')}</b></p>
        <div className="grid grid-cols-2 gap-2 text-sm"><p>{t('game_cash')}: <span dir="ltr">{game.cash.toFixed(2)}</span></p><p>{t('game_shares')}: <span dir="ltr">{position.shares}</span></p></div>
        <div className="flex flex-wrap gap-2" aria-label={t('game_quick_quantities')}>{quickAmounts.map(q=><button type="button" key={q} aria-pressed={quantity===q} className={`rounded border px-3 py-1 font-mono text-sm ${quantity===q?'border-teal-300 bg-teal-300/10':'border-slate-600'}`} disabled={!!game.settled} onClick={()=>setQuantity(q)}>{q}</button>)}</div>
        <div className="flex flex-wrap items-end gap-2"><label className="text-sm">{t('game_quantity')}<input disabled={!!game.settled} type="number" min="1" step="1" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} className="mt-1 block w-24 rounded-lg border border-border bg-background p-2"/></label><button type="button" className="rounded-lg bg-teal-500 px-4 py-2 font-bold text-[#07101f]" disabled={!!game.settled} onClick={()=>act({type:'buy',quantity,instrument})}>{t('game_buy')}</button><button type="button" className="rounded-lg border border-rose-400 px-4 py-2 font-bold text-rose-200" disabled={!!game.settled} onClick={()=>act({type:'sell',quantity,instrument})}>{t('game_sell')}</button></div>
        <div className="rounded-lg border border-slate-600 p-3"><div className="flex justify-between gap-2 text-xs"><span>{t('game_exposure')}</span><span dir="ltr">{positionWeight.toFixed(1)}%</span></div><div className="mt-2 h-2 rounded-full bg-slate-700" role="progressbar" aria-label={t('game_exposure')} aria-valuenow={Math.round(positionWeight)} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-amber-300" style={{width:`${positionWeight}%`}}/></div><p className="mt-2 text-xs">{t('game_selected_exposure_note')}</p></div>
        <p className="text-xs text-slate-300">{t('game_fee_rule')}</p>
        <h3 className="font-semibold">{t('game_trades')}</h3><ol className="list-decimal ps-5 text-sm">{game.trades.map((trade,i)=><li key={i}>{trade.instrument??'NST-F'} {t(`game_${trade.side}`)} {trade.quantity} @ {trade.price} {t('game_units')}; {t('game_fee')}: {trade.fee.toFixed(2)}</li>)}</ol>
      </section>
      <aside className="space-y-4"><section className="rounded-xl border border-slate-700 bg-[#111d30] p-4 space-y-3"><h2 className="text-xl font-semibold">{t('game_news')}</h2><p className="text-sm">{t(game.scenario==='stress'?`game_stress_news_${game.day}`:`game_news_${GAME_DAYS[game.day].news}`)}</p><p className="text-xs text-slate-300">{t('game_news_note')}</p></section>
        <ClientInbox game={game} onAction={act}/>
        <section className="rounded-xl border border-slate-700 bg-[#111d30] p-4 space-y-3"><h2 className="text-xl font-semibold">{t('game_client_book')}</h2><p className="text-xs">{t('game_client_rules')}</p>{clientStatuses.map(client=><article key={client.id} className={`rounded-lg border p-3 ${client.active?'border-slate-600':'border-rose-400/60 bg-rose-400/5'}`}><div className="flex justify-between gap-2"><h3 className="font-semibold">{t(`game_client_${client.id}`)}</h3><span className={client.active?'text-teal-200':'text-rose-200'}>{t(client.active?'game_client_active':'game_client_left')}</span></div><p className="mt-1 text-xs">{t('game_loss_tolerance')}: {CLIENT_PROFILES.find(profile=>profile.id===client.id)!.lossTolerance}%</p><div className="mt-2 flex items-center gap-2"><span className="text-xs">{t('game_trust')}</span><meter min={0} max={100} low={31} high={70} optimum={100} value={client.trust} aria-label={`${t(`game_client_${client.id}`)}: ${t('game_trust')}`} className="w-full"/><span className="text-xs tabular-nums" dir="ltr">{client.trust}/100</span></div>{!client.active&&<p className="mt-2 text-xs">{t('game_day')} {client.leftDay!+1}: {t(`game_left_${client.reason}`)}</p>}</article>)}</section>
        {game.departures.length>0&&<p role="status" className="rounded-xl border border-warning/40 p-3 text-sm">{t('game_departed')}</p>}
        {finished?(game.settled?<p role="status" className="rounded-xl border border-slate-700 p-3 text-sm">{t('game_settled')}</p>:<div className="space-y-2"><p className="text-sm">{t('game_settle_preview')}</p><button type="button" className="w-full rounded-lg bg-teal-500 px-4 py-3 font-semibold text-[#07101f]" onClick={()=>act({type:'settle'})}>{t('game_settle')}</button></div>):<button type="button" className="w-full rounded-lg bg-teal-500 px-4 py-3 font-semibold text-[#07101f]" onClick={()=>act({type:'next'})}>{t('game_next')}</button>}
        <button type="button" className="rounded-lg border border-border p-2 text-sm" onClick={()=>{if(window.confirm(t(result?'practice_restart_confirm':'game_restart_confirm'))) {if(persist({...newPortfolioGame(),runs:result?archivePracticeRun(game.runs,'portfolio',{netReturn:result.netReturn,maxDrawdown:result.maxDrawdown,retained:result.retained}):game.runs})){setShowNews(false);setSelectedDay(null);setQuantity(1);setInstrument('NST-F');}}}}>{t(result?'practice_restart':'game_restart')}</button>
      </aside>
    </div>{error&&<p role="alert" className="text-rose-300">{error}</p>}
    </div><DisclaimerBanner/>
  </section></Layout>;
}
