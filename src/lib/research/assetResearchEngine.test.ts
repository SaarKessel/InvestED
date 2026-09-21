import { describe, expect, it, vi } from "vitest";
import { compareAssetResearch, researchAsset } from "./assetResearchEngine";
import type { MarketAsset } from "../../types";
const asset=(symbol="NVDA", source: MarketAsset["dataSource"]="yahoo_finance"):MarketAsset=>({symbol,name:"NVIDIA",assetType:"stock",price:120,previousClose:118,change:2,changePercent:1.69,currency:"USD",volume:10,marketStatus:"closed",history:Array.from({length:60},(_,i)=>({date:`d${i}`,open:100+i,high:101+i,low:99+i,close:100+i,price:100+i,volume:1})),dataSource:source,timestamp:"2026-09-18T20:00:00Z",freshness:source==="mock"?"simulated":"recent",isMock:source==="mock"});
describe("Asset Research Engine",()=>{
 it("resolves a company name and preserves provenance",async()=>{const fetchAsset=vi.fn(async()=>asset());const r=await researchAsset("Nvidia",{fetchAsset});expect(r?.symbol).toBe("NVDA");expect(r?.provenance).toEqual(expect.objectContaining({source:"yahoo_finance",freshness:"recent",isMock:false}));expect(fetchAsset).toHaveBeenCalledOnce();});
 it("classifies indicators and unavailable extension boundaries",async()=>{const r=await researchAsset("NVDA",{fetchAsset:async()=>asset()});expect(r?.indicators.sma50.status).toBe("available");expect(r?.fundamentals).toMatchObject({status:"unavailable",value:null});expect(r?.news).toMatchObject({status:"unavailable",value:null});});
 it("never relabels mock data",async()=>{const r=await researchAsset("NVDA",{fetchAsset:async()=>asset("NVDA","mock")});expect(r?.provenance).toMatchObject({source:"mock",freshness:"simulated",isMock:true});});
 it("reports insufficient history",async()=>{const short={...asset(),history:asset().history.slice(0,3)};const r=await researchAsset("NVDA",{fetchAsset:async()=>short});expect(r?.indicators.rsi14.status).toBe("insufficient_history");expect(r?.indicators.macd.value).toBeNull();});
 it("handles provider failure and unsupported names",async()=>{expect(await researchAsset("not a supported company",{fetchAsset:async()=>asset()})).toBeNull();expect(await researchAsset("NVDA",{fetchAsset:async()=>null})).toBeNull();});
 it("fetches each comparison asset once",async()=>{const fetchAsset=vi.fn(async(s:string)=>asset(s));const r=await compareAssetResearch(["NVDA","AAPL","NVDA"],{fetchAsset});expect(r.assets).toHaveLength(2);expect(fetchAsset).toHaveBeenCalledTimes(2);});
});
