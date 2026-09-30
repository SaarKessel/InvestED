import {fetchMarketAssetBySymbol} from '@/lib/marketData';
import {computeFreshness} from '@/lib/market/freshness';
import {createTtlCache} from '@/lib/market/cache';
import type {MarketAsset} from '@/types';
const cache=createTtlCache<{asset:MarketAsset|null;fetchedAt:string}>({ttlMs:15*60*1000,maxEntries:100});
const inFlight=new Map<string,Promise<SourceQuote>>();
export interface SourceQuote {asset:MarketAsset|null;fetchedAt:string;cached:boolean;}
/** Inspection only. Never substitutes a fictional price or mutates a simulation ledger. */
export async function getSourceQuote(input:string):Promise<SourceQuote>{
  const symbol=input.trim().toUpperCase();
  if(!/^[A-Z0-9^][A-Z0-9.\-^=]{0,9}$/.test(symbol))return {asset:null,fetchedAt:new Date().toISOString(),cached:false};
  const found=cache.get(symbol);
  if(found)return {...found,asset:found.asset?{...found.asset,freshness:computeFreshness({dataSource:'yahoo_finance',timestamp:found.asset.timestamp})}:null,cached:true};
  const pending=inFlight.get(symbol);if(pending)return pending;
  const request=(async()=>{
    const value=await fetchMarketAssetBySymbol(symbol,'3mo',undefined,{provider:'yahoo_finance',allowSimulated:false});
    const asset=value&&value.dataSource==='yahoo_finance'&&value.isMock===false&&value.price>0&&value.currency&&/^[A-Z]{3}$/.test(value.currency)&&value.timestamp&&Number.isFinite(Date.parse(value.timestamp))?value:null;
    const record={asset:asset?{...asset,freshness:computeFreshness({dataSource:'yahoo_finance',timestamp:asset.timestamp})}:null,fetchedAt:new Date().toISOString()};cache.set(symbol,record);return {...record,cached:false};
  })();
  inFlight.set(symbol,request);
  try{return await request;}finally{inFlight.delete(symbol);}
}
