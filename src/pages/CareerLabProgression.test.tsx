// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {LanguageProvider} from '@/context/languageContext';
import CareerLabPage from './CareerLabPage';
import {CASE_KEY,CASE_ARCHIVE_KEY,newCase,saveCase,type ResearchCase} from '@/lib/career/engine';
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/layout/Footer',()=>({Footer:()=>null}));
vi.mock('@/lib/marketData',()=>({fetchMarketAssetBySymbol:vi.fn()}));
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let container:HTMLDivElement;let root:Root;
beforeEach(()=>{localStorage.clear();container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
const completedCase=(id:string):ResearchCase=>({...newCase(new Date('2026-09-29T12:00:00Z')),id,stage:'complete',completedAt:'2026-09-29T13:00:00Z',lessonAnswer:'A dated source with a currency is required.',practiceAnswer:'Compare risk with an alternative before acting.',allocationDecision:{equity:55,cash:15},evidence:{symbol:'AAPL',price:123,currency:'USD',source:'yahoo_finance',timestamp:'2026-09-28T15:00:00Z',capturedAt:'2026-09-29T12:30:00Z',freshness:'recent'},thesis:'There is a case to investigate further.',bearCase:'Competition could weaken the outlook.',risk:'Concentration in one security is a risk.',defense:'Stronger evidence is needed before deciding.',improvement:'Verify cash flows before revising the thesis.'});
const text=()=>container.textContent??'';
for(const language of ['he','en'] as const){
 it(`${language}: a completed case is archived on mount and survives starting a new case`,()=>{
  localStorage.setItem('invested_language_preference',language);
  const done=completedCase('case-'+language);
  localStorage.setItem(CASE_KEY,JSON.stringify(done));
  act(()=>root.render(<MemoryRouter><LanguageProvider><CareerLabPage/></LanguageProvider></MemoryRouter>));
  // The completed record appears in the archive immediately, including for cases finished before the archive existed.
  expect(JSON.parse(localStorage.getItem(CASE_ARCHIVE_KEY)??'[]').map((c:ResearchCase)=>c.id)).toEqual([done.id]);
  expect(text()).toContain(done.id);
  const buttons=[...container.querySelectorAll('button')];
  const restart=buttons.find(b=>b.textContent===(language==='he'?'התחלת מקרה חדש':'Start another case'));
  expect(restart).toBeTruthy();
  act(()=>restart!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  // The archived experience record is still stored and the fresh case starts at the lesson stage.
  expect(JSON.parse(localStorage.getItem(CASE_ARCHIVE_KEY)??'[]')).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem(CASE_KEY)??'{}').stage).toBe('lesson');
 });
 it(`${language}: a stale tab shows recovery and loading the newer snapshot does not write`,()=>{
  localStorage.setItem('invested_language_preference',language);
  const first=newCase(new Date('2026-09-29T12:00:00Z'));
  saveCase(first,null);
  act(()=>root.render(<MemoryRouter><LanguageProvider><CareerLabPage/></LanguageProvider></MemoryRouter>));
  // Another tab saves a newer draft.
  const newer={...first,lessonAnswer:'A dated source is required for every price.'};
  saveCase(newer,first);
  // This tab tries to save its older draft: conflict, with an explicit recovery control.
  const save=[...container.querySelectorAll('button')].find(b=>b.textContent===(language==='he'?'שמירת טיוטה':'Save draft'));
  expect(save).toBeTruthy();
  const before=localStorage.getItem(CASE_KEY);
  act(()=>save!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  expect(container.querySelector('[role="alert"]')).toBeTruthy();
  const recover=[...container.querySelectorAll('button')].find(b=>b.textContent===(language==='he'?'טעינת הגרסה החדשה שנשמרה. עריכות שלא נשמרו בטאב הזה יימחקו.':'Load the newer saved version. Unsaved edits in this tab are discarded.'));
  expect(recover).toBeTruthy();
  act(()=>recover!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  // Recovery only reads: storage still holds the other tab's version and the alert is cleared.
  expect(localStorage.getItem(CASE_KEY)).toBe(before);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(text()).toContain('A dated source is required for every price.');
 });
 it(`${language}: loading a newer completed snapshot archives it without writing`,()=>{
  localStorage.setItem('invested_language_preference',language);
  const first=newCase(new Date('2026-09-29T12:00:00Z'));
  saveCase(first,null);
  act(()=>root.render(<MemoryRouter><LanguageProvider><CareerLabPage/></LanguageProvider></MemoryRouter>));
  const done=completedCase('conflict-complete-'+language);
  saveCase(done,first);
  const save=[...container.querySelectorAll('button')].find(b=>b.textContent===(language==='he'?'שמירת טיוטה':'Save draft'))!;
  act(()=>save.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  const recover=[...container.querySelectorAll('button')].find(b=>b.textContent===(language==='he'?'טעינת הגרסה החדשה שנשמרה. עריכות שלא נשמרו בטאב הזה יימחקו.':'Load the newer saved version. Unsaved edits in this tab are discarded.'))!;
  const before=localStorage.getItem(CASE_KEY);
  act(()=>recover.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  expect(localStorage.getItem(CASE_KEY)).toBe(before);
  expect(JSON.parse(localStorage.getItem(CASE_ARCHIVE_KEY)??'[]').map((c:ResearchCase)=>c.id)).toEqual([done.id]);
  expect(text()).toContain(done.id);
 });
}
for(const language of ['he','en'] as const){
 it(`${language}: the credit track opens with its own heading and loads labeled invented evidence without any market fetch`,async()=>{
  localStorage.setItem('invested_language_preference',language);
  const {fetchMarketAssetBySymbol}=await import('@/lib/marketData');
  const draft={...newCase(new Date('2026-09-30T09:00:00Z'),'credit-analyst'),stage:'research' as const,lessonAnswer:'Verified borrower data is required.',practiceAnswer:'Judge repayment over time.',provenanceChoice:'withSource' as const};
  localStorage.setItem('invested_career_credit_v1',JSON.stringify(draft));
  act(()=>root.render(<MemoryRouter><LanguageProvider><CareerLabPage/></LanguageProvider></MemoryRouter>));
  const buttons=[...container.querySelectorAll('button')];
  const pick=buttons.find(b=>b.textContent===(language==='he'?'בנקאות · אנליסט אשראי':'Banking · Credit Analyst'));
  expect(pick).toBeTruthy();
  act(()=>pick!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  expect(text()).toContain(language==='he'?'אנליסט אשראי | מעבדת קריירה':'Credit Analyst | Career Lab');
  const load=[...container.querySelectorAll('button')].find(b=>b.textContent===(language==='he'?'טעינת תמונת הלווים הבדויה':'Load the invented borrower snapshot'));
  expect(load).toBeTruthy();
  act(()=>load!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  expect(fetchMarketAssetBySymbol).not.toHaveBeenCalled();
  expect(text()).toContain('INVENTED-BORROWER-01');
  expect(text()).toContain(language==='he'?'נתון הוראה בדוי וקבוע':'Invented fixed teaching input');
  expect(JSON.parse(localStorage.getItem('invested_career_credit_v1')??'{}').evidence?.source).toBe('invented_teaching_input');
 });
}
for(const language of ['he','en'] as const){
 it(`${language}: the pension track opens with its own heading and loads labeled invented evidence without any market fetch`,async()=>{
  localStorage.setItem('invested_language_preference',language);
  const {fetchMarketAssetBySymbol}=await import('@/lib/marketData');
  const draft={...newCase(new Date('2026-09-30T09:00:00Z'),'pension-analyst'),stage:'research' as const,lessonAnswer:'Verifiable policy data is required.',practiceAnswer:'Judge contributions over decades.',provenanceChoice:'withSource' as const};
  localStorage.setItem('invested_career_pension_v1',JSON.stringify(draft));
  act(()=>root.render(<MemoryRouter><LanguageProvider><CareerLabPage/></LanguageProvider></MemoryRouter>));
  const pick=[...container.querySelectorAll('button')].find(b=>b.textContent===(language==='he'?'ביטוח · אנליסט פנסיה':'Insurance · Pension Analyst'));
  expect(pick).toBeTruthy();
  act(()=>pick!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  expect(text()).toContain(language==='he'?'אנליסט פנסיה | מעבדת קריירה':'Pension Analyst | Career Lab');
  const load=[...container.querySelectorAll('button')].find(b=>b.textContent===(language==='he'?'טעינת תמונת הפוליסה הבדויה':'Load the invented policy snapshot'));
  expect(load).toBeTruthy();
  act(()=>load!.dispatchEvent(new MouseEvent('click',{bubbles:true})));
  expect(fetchMarketAssetBySymbol).not.toHaveBeenCalled();
  expect(text()).toContain('INVENTED-POLICY-01');
  expect(text()).toContain(language==='he'?'נתון הוראה בדוי וקבוע':'Invented fixed teaching input');
  expect(JSON.parse(localStorage.getItem('invested_career_pension_v1')??'{}').evidence?.source).toBe('invented_teaching_input');
 });
}
