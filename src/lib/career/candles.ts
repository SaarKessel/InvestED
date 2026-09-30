import type {CandleDatum} from '@/types';
/** Keep only genuine, coherent OHLC bars. Never derive source wicks from closes. */
export function validCandles(points:CandleDatum[]):CandleDatum[]{
  const seen=new Set<string>();
  return points.filter(point=>{
    if(point.ohlcAvailable===false||!point.date||seen.has(point.date)||![point.open,point.high,point.low,point.close].every(v=>Number.isFinite(v)&&v>0)||point.low>Math.min(point.open,point.close)||point.high<Math.max(point.open,point.close))return false;
    seen.add(point.date);return true;
  });
}
/** Invented educational OHLC, only for already-revealed fictional game days. */
export function fictionalCandles(prices:{day:number;price:number}[]):CandleDatum[]{
  return prices.map((point,index)=>{
    const open=prices[index-1]?.price??point.price;
    const spread=Math.max(1,Math.abs(point.price-open)*.2);
    return {date:String(point.day),open,high:Math.max(open,point.price)+spread,low:Math.max(.01,Math.min(open,point.price)-spread),close:point.price,price:point.price};
  });
}
