// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {LanguageProvider} from '@/context/languageContext';
import {PaperLedgerPanel} from './PaperLedgerPanel';
import {PAPER_LEDGER_KEY} from '@/lib/career/paperLedger';
import {getSourceQuote} from '@/lib/career/sourceQuotes';
import type {MarketAsset} from '@/types';
vi.mock('@/lib/career/sourceQuotes',()=>({getSourceQuote:vi.fn()}));
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let container:HTMLDivElement;let root:Root;
beforeEach(()=>{localStorage.clear();vi.clearAllMocks();container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const quoteAsset:MarketAsset={symbol:'AAPL',name:'Apple',price:200,changePercent:0,currency:'USD',assetType:'stock',history:[],isMock:false,dataSource:'yahoo_finance',timestamp:'2026-09-30T10:00:00.000Z',freshness:'current'} as MarketAsset;
const mocked=()=>getSourceQuote as unknown as ReturnType<typeof vi.fn>;
const text=()=>container.textContent??'';
async function flush(){await act(async()=>{await Promise.resolve();});}
for(const language of ['he','en'] as const){
 it(`${language}: records a paper order with a frozen snapshot, persists across remounts and never touches the fictional game`,async()=>{
  localStorage.setItem('invested_language_preference',language);
  mocked().mockResolvedValue({asset:quoteAsset,cached:false,fetchedAt:'2026-09-30T10:00:30.000Z'});
  act(()=>root.render(<LanguageProvider><PaperLedgerPanel/></LanguageProvider>));
  const submit=[...container.querySelectorAll('button')].find(b=>b.getAttribute('type')==='submit')!;
  await act(async()=>{submit.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
  await flush();
  const stored=JSON.parse(localStorage.getItem(PAPER_LEDGER_KEY)??'[]');
  expect(stored).toHaveLength(1);
  expect(stored[0].snapshot).toMatchObject({symbol:'AAPL',price:200,currency:'USD',sourceTimestamp:'2026-09-30T10:00:00.000Z',freshness:'current'});
  expect(text()).toContain('AAPL');
  expect(text()).toContain('200');
  // The fictional portfolio game storage is untouched.
  expect(Object.keys(localStorage).filter(k=>k.includes('portfolio'))).toEqual([]);
  // Persistence across a remount.
  act(()=>root.unmount());
  root=createRoot(container);
  act(()=>root.render(<LanguageProvider><PaperLedgerPanel/></LanguageProvider>));
  expect(text()).toContain('AAPL');
 });
 it(`${language}: an unavailable source records nothing and says so`,async()=>{
  localStorage.setItem('invested_language_preference',language);
  mocked().mockResolvedValue({asset:null,cached:false,fetchedAt:'2026-09-30T10:00:30.000Z'});
  act(()=>root.render(<LanguageProvider><PaperLedgerPanel/></LanguageProvider>));
  const submit=[...container.querySelectorAll('button')].find(b=>b.getAttribute('type')==='submit')!;
  await act(async()=>{submit.dispatchEvent(new MouseEvent('click',{bubbles:true}));});
  await flush();
  expect(localStorage.getItem(PAPER_LEDGER_KEY)).toBeNull();
  expect(text()).toContain(language==='he'?'אין תמונת מקור מאומתת':'No verified source snapshot');
 });
}
