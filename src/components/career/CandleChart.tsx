import {useEffect,useRef,useState} from 'react';
import type {CandleDatum} from '@/types';
import {useLanguage} from '@/context/languageContext';
import {validCandles} from '@/lib/career/candles';
export function CandleChart({points,symbol,currency,fictional=false,onSelect,markers=[]}:{points:CandleDatum[];symbol:string;currency:string;fictional?:boolean;onSelect?:(index:number)=>void;markers?:{index:number;side:'buy'|'sell'}[]}){
 const frame=useRef<HTMLDivElement>(null);const [chartWidth,setChartWidth]=useState(760);
 useEffect(()=>{if(!frame.current)return;const observer=new ResizeObserver(entries=>setChartWidth(Math.max(240,entries[0].contentRect.width)));observer.observe(frame.current);return ()=>observer.disconnect();},[]);
 const {t}=useLanguage();const [windowSize,setWindowSize]=useState(30);const [selected,setSelected]=useState<number|null>(null);
 const bars=validCandles(points).slice(-windowSize);const offset=points.length-bars.length;
 if(!bars.length)return <p role="status" className="rounded border border-amber-400/40 p-3 text-sm">{t('game_candle_unavailable')}</p>;
 const index=Math.min(selected??bars.length-1,bars.length-1);const active=bars[index];
 const low=Math.min(...bars.map(bar=>bar.low)),high=Math.max(...bars.map(bar=>bar.high));const padding=Math.max((high-low)*.12,high*.005);const min=low-padding,max=high+padding;
 const y=(value:number)=>220-(value-min)/(max-min)*190;const plotRight=chartWidth-72;const step=(plotRight-35)/Math.max(bars.length,5);const x=(i:number)=>35+step*(i+.5);const width=Math.min(22,step*.65);const last=bars[bars.length-1];
 const pick=(i:number)=>{setSelected(i);onSelect?.(offset+i);};
 return <div ref={frame} className="min-w-0 rounded-lg border border-slate-700 bg-[#07101f] text-slate-200">
  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 p-3 text-xs"><b dir="ltr" className="font-mono">{symbol} · {fictional?t('game_candle_day'): '1D'} · {currency}</b><span className={fictional?'text-amber-200':'text-sky-200'}>{t(fictional?'game_candle_fictional':'game_candle_source')}</span><div className="flex gap-1">{[10,30,90].map(size=><button key={size} type="button" aria-label={`${t('game_candle_window')}: ${size}`} aria-pressed={windowSize===size} onClick={()=>{setWindowSize(size);setSelected(null);}} className={`rounded border px-2 py-1 ${windowSize===size?'border-teal-300 text-teal-200':'border-slate-600'}`}>{size}</button>)}</div></div>
  <div dir="ltr" className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 text-xs font-mono"><span>{active.date}</span><span>O {active.open.toFixed(2)}</span><span>H {active.high.toFixed(2)}</span><span>L {active.low.toFixed(2)}</span><span className={active.close>=active.open?'text-teal-300':'text-rose-300'}>C {active.close.toFixed(2)}</span></div>
  <p className="px-3 pb-2 text-xs text-slate-300">{t('game_candle_guide')}</p>
  <svg viewBox={`0 0 ${chartWidth} 260`} role="img" aria-label={`${t('game_candle_title')}: ${symbol}; ${bars.map(bar=>`${bar.date} O ${bar.open} H ${bar.high} L ${bar.low} C ${bar.close}`).join('; ')}`} className="h-[260px] w-full" style={{direction:'ltr'}} onPointerMove={event=>{const rect=event.currentTarget.getBoundingClientRect();pick(Math.max(0,Math.min(bars.length-1,Math.floor(((event.clientX-rect.left)/rect.width*chartWidth-35)/step))));}}>
   {[0,1,2,3,4].map(level=>{const value=min+(max-min)*level/4;return <g key={level}><line x1="30" x2={plotRight} y1={y(value)} y2={y(value)} stroke="#263449"/><text x={plotRight+8} y={y(value)+4} fill="#94a3b8" fontSize="12">{value.toFixed(2)}</text></g>;})}
   <line x1="30" x2={plotRight} y1={y(active.close)} y2={y(active.close)} stroke="#e2e8f0" opacity=".25" strokeDasharray="4 4"/>
   {bars.map((bar,i)=>{const rising=bar.close>=bar.open,color=rising?'#2dd4bf':'#fb7185';return <g key={bar.date}><line x1={x(i)} x2={x(i)} y1={y(bar.high)} y2={y(bar.low)} stroke={color} strokeWidth="1.5"/><rect x={x(i)-width/2} y={Math.min(y(bar.open),y(bar.close))} width={width} height={Math.max(1.5,Math.abs(y(bar.open)-y(bar.close)))} fill={color}/>{(i===0||i===bars.length-1||i%Math.ceil(bars.length/(chartWidth<450?2:5))===0)&&<text x={x(i)} y="246" textAnchor="middle" fill="#94a3b8" fontSize="11">{chartWidth<450&&!fictional?bar.date.slice(5):bar.date}</text>}</g>;})}
   <line x1={x(index)} x2={x(index)} y1="22" y2="225" stroke="#e2e8f0" opacity=".5" strokeDasharray="4 4"/>
   <line x1="30" x2={plotRight} y1={y(last.close)} y2={y(last.close)} stroke="#2dd4bf" opacity=".6" strokeDasharray="3 4"/>
   {markers.filter(marker=>marker.index>=offset&&marker.index<offset+bars.length).map((marker,i)=><text key={i} x={x(marker.index-offset)} y={Math.min(225,y(bars[marker.index-offset].low)+17)} textAnchor="middle" fill={marker.side==='buy'?'#2dd4bf':'#fda4af'} fontSize="14">{marker.side==='buy'?'▲':'▼'}</text>)}
  </svg>
  <div className="flex flex-wrap items-center gap-2 border-t border-slate-700 p-3 text-xs"><span>{t('game_candle_inspect')}</span><input type="range" min="0" max={bars.length-1} value={index} onChange={event=>pick(Number(event.target.value))} aria-label={t('game_candle_inspect')} aria-valuetext={`${active.date}; O ${active.open}; H ${active.high}; L ${active.low}; C ${active.close}`} className="min-w-0 flex-1 accent-teal-400"/><span dir="ltr">{active.date}</span></div>
 </div>;
}
