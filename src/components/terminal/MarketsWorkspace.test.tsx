// @vitest-environment jsdom
import {act} from "react";
import {createRoot,type Root} from "react-dom/client";
import {MemoryRouter} from "react-router-dom";
import {afterEach,beforeEach,expect,it,vi} from "vitest";
import {LanguageProvider} from "@/context/languageContext";
import MarketsWorkspace from "./MarketsWorkspace";
import {fetchMarketAssetBySymbol} from "@/lib/marketData";
vi.mock("@/lib/marketData",()=>({fetchMarketAssetBySymbol:vi.fn(async()=>null)}));
vi.mock("@/lib/marketMovers",()=>({fetchMarketMovers:vi.fn(async()=>({available:false,gainers:[],losers:[],fetchedAt:"2026-10-01",coverage:null,watchlistSize:null}))}));
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let root:Root;let el:HTMLDivElement;
beforeEach(()=>{localStorage.clear();localStorage.setItem('invested_language_preference','en');el=document.createElement('div');document.body.append(el);root=createRoot(el);vi.clearAllMocks();});
afterEach(()=>{act(()=>root.unmount());el.remove();});
async function mount(){await act(async()=>root.render(<LanguageProvider><MemoryRouter><MarketsWorkspace/></MemoryRouter></LanguageProvider>));}
it('never requests simulated fallback for the watchlist',async()=>{await mount();expect(fetchMarketAssetBySymbol).toHaveBeenCalledWith('NVDA','3mo',undefined,{allowSimulated:false});});
it('shows unavailable data rather than invented prices',async()=>{await mount();expect(el.textContent).toContain('Data unavailable');expect(el.textContent).not.toContain('183.42');expect(el.querySelectorAll('tbody tr')).toHaveLength(3);});
it('removes a symbol and persists only the local list',async()=>{await mount();await act(async()=>el.querySelector<HTMLButtonElement>('button[aria-label="Remove NVDA"]')!.click());expect(localStorage.getItem('invested-terminal-watchlist')).not.toContain('NVDA');expect(el.querySelectorAll('tbody tr')).toHaveLength(2);});
it('offers an actionable empty state',async()=>{localStorage.setItem('invested-terminal-watchlist','[]');await mount();expect(el.textContent).toContain('Add an asset to begin');expect(el.querySelector('input')).not.toBeNull();});
