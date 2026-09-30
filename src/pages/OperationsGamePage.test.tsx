// @vitest-environment jsdom
import {act,type ReactNode} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {LanguageProvider} from '@/context/languageContext';
import en from '@/locales/en.json';
import he from '@/locales/he.json';
import {OPERATIONS,OPERATIONS_KEY,REQUIRED_EVIDENCE,chooseOperationEvidence,closeOperations,decideOperation,newOperationsGame,readOperationsGame,resolveOperation} from '@/lib/career/operationsGame';
import OperationsGamePage from './OperationsGamePage';
vi.mock('@/components/layout/Layout',()=>({Layout:({children}:{children:ReactNode})=><>{children}</>,DisclaimerBanner:()=>null}));
vi.mock('@/components/career/SourceMarketPanel',()=>({SourceMarketPanel:()=>null}));
vi.mock('@/components/career/PracticeHistory',()=>({PracticeHistory:()=>null}));
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let container:HTMLDivElement;let root:Root;
beforeEach(()=>{localStorage.clear();container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();vi.restoreAllMocks();});
const render=()=>act(()=>root.render(<MemoryRouter><LanguageProvider><OperationsGamePage/></LanguageProvider></MemoryRouter>));
const click=(text:string)=>{const button=[...container.querySelectorAll('button')].find(b=>b.textContent?.trim()===text);expect(button).toBeDefined();act(()=>button!.click());};
const select=(id:string)=>act(()=>[...container.querySelectorAll('button')].find(b=>b.textContent?.includes(id))!.click());
describe('operations evidence controls',()=>{
 for(const language of ['he','en'] as const){
  it(`${language}: evidence rejection, visible packet and original discrepancy`,()=>{
   localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;render();select('F-202');click(locale.ops_decision_hold);click(locale.ops_evidence_marketQuote);
   expect(container.textContent).toContain(locale.ops_evidence_rejected);expect(container.querySelector(`dl[aria-label="${locale.ops_packet_numbers}"]`)).toBeNull();
   click(locale.ops_evidence_cashExplanation);expect(container.querySelector(`dl[aria-label="${locale.ops_packet_numbers}"]`)?.textContent).toContain(locale.ops_packet_documentedFee);
   click(locale.ops_resolve);expect(readOperationsGame()?.resolved).toContain('F-202');expect(container.querySelector('table')?.textContent).toContain('490');expect(container.textContent).toContain(locale.ops_resolution_cash);
  });
  it(`${language}: newer NAV decision survives explicit conflict recovery`,()=>{
   localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;render();click(locale.ops_decision_match);
   const newer=decideOperation(readOperationsGame()!,'F-201','hold');localStorage.setItem(OPERATIONS_KEY,JSON.stringify(newer));click(locale.ops_evidence_books);
   expect(container.querySelector('[role="alert"]')?.textContent).toBe(locale.ops_conflict);expect(readOperationsGame()).toEqual(newer);
   const spy=vi.spyOn(Storage.prototype,'setItem');click(locale.ops_load_latest);expect(spy).not.toHaveBeenCalled();click(locale.ops_evidence_books);click(locale.ops_resolve);expect(readOperationsGame()?.decisions['F-201']).toBe('hold');
  });
 }
 it('locks closed controls and labels legacy classification-only completion',()=>{
  localStorage.setItem('invested_language_preference','en');localStorage.setItem(OPERATIONS_KEY,JSON.stringify({decisions:Object.fromEntries(OPERATIONS.slice(0,6).map(row=>[row.id,row.expected])),checked:OPERATIONS.slice(0,6).map(row=>row.id),closed:true}));render();
  expect(container.textContent).toContain(en.ops_legacy_closed);expect([...container.querySelectorAll('button')].find(b=>b.textContent===en.ops_decision_match)?.disabled).toBe(true);expect(container.textContent).not.toContain(en.ops_evidence_title);
 });
 it('shows blocked-save error without marking a record reviewed',()=>{
  localStorage.setItem('invested_language_preference','en');render();vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Quota');});click(en.ops_decision_match);expect(container.querySelector('[role="alert"]')?.textContent).toBe(en.ops_save_error);expect(readOperationsGame()).toBeNull();expect(container.textContent).not.toContain(en.ops_evidence_title);
 });
 it('preserves evidence-completed closure on remount',()=>{
  localStorage.setItem('invested_language_preference','en');let game=newOperationsGame();for(const row of OPERATIONS){game=decideOperation(game,row.id,row.expected);game=chooseOperationEvidence(game,row.id,REQUIRED_EVIDENCE[row.id]);game=resolveOperation(game,row.id);}localStorage.setItem(OPERATIONS_KEY,JSON.stringify(closeOperations(game)));render();expect(container.textContent).toContain(en.ops_closed);expect(readOperationsGame()?.resolved).toHaveLength(7);
 });
});

describe('operations focus and accessible structure',()=>{
 for(const language of ['he','en'] as const){
  it(`${language}: skip link and queue controls identify the active inspection`,()=>{
   localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;render();
   const skip=container.querySelector<HTMLAnchorElement>('a[href^="#"]')!;act(()=>skip.click());
   expect(document.activeElement?.textContent).toContain(locale.ops_inspect);
   const queue=container.querySelector(`[role="group"][aria-label="${locale.ops_queue}"]`)!;
   expect(queue.querySelectorAll('button')).toHaveLength(OPERATIONS.length);
   expect(queue.querySelector('[aria-pressed="true"]')?.getAttribute('aria-controls')).toBe(document.activeElement?.id);
   expect(container.querySelectorAll('thead th[scope="col"]')).toHaveLength(3);
   expect(container.querySelectorAll('tbody th[scope="row"]')).toHaveLength(2);
  });
  it(`${language}: successful resolution moves focus off the removed button`,()=>{
   localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;render();
   click(locale.ops_decision_match);click(locale.ops_evidence_books);
   const resolve=[...container.querySelectorAll('button')].find(b=>b.textContent===locale.ops_resolve)!;resolve.focus();click(locale.ops_resolve);
   expect(document.activeElement?.textContent).toBe(locale.ops_resolution_matched);
   expect(document.activeElement?.getAttribute('role')).toBe('status');
  });
 }
 it('conflict recovery moves focus to the current record without changing storage',()=>{
  localStorage.setItem('invested_language_preference','en');render();
  const newer=decideOperation(newOperationsGame(),'F-201','hold');localStorage.setItem(OPERATIONS_KEY,JSON.stringify(newer));click(en.ops_decision_match);
  click(en.ops_load_latest);expect(document.activeElement?.textContent).toContain(en.ops_inspect);expect(readOperationsGame()).toEqual(newer);
 });
});

for(const language of ['en','he'] as const)it(`${language}: combined break requires both supporting corrections`,()=>{
 localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;render();select('S-104');click(locale.ops_decision_hold);click(locale.ops_evidence_manualEdit);expect(container.textContent).toContain(locale.ops_evidence_rejected);click(locale.ops_evidence_combinedApproval);
 const packet=container.querySelector(`dl[aria-label="${locale.ops_packet_numbers}"]`)!;expect(packet.textContent).toContain('585');expect(packet.textContent).toContain('15');click(locale.ops_resolve);expect(readOperationsGame()?.resolved).toContain('S-104');expect(container.textContent).toContain(locale.ops_resolution_combined);expect(container.querySelector('table')?.textContent).toContain('585');
});
it('renders only the original records for an existing six-case closed run',()=>{
 localStorage.setItem('invested_language_preference','en');const original=OPERATIONS.slice(0,6);localStorage.setItem(OPERATIONS_KEY,JSON.stringify({decisions:Object.fromEntries(original.map(row=>[row.id,row.expected])),checked:original.map(row=>row.id),closed:true}));render();expect(container.textContent).not.toContain('S-104');expect(container.textContent).toContain(en.ops_legacy_closed);
});

for(const language of ['en','he'] as const){
 it(`${language}: loading an older exercise keeps a selected queue record and stable focus`,()=>{
  localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;render();select('S-104');
  const older={decisions:{},checked:[],closed:false,evidence:{},resolved:[]};localStorage.setItem(OPERATIONS_KEY,JSON.stringify(older));click(locale.ops_decision_hold);expect(container.textContent).toContain(locale.ops_conflict);
  click(locale.ops_load_latest);expect(container.textContent).not.toContain('S-104');expect(document.activeElement?.textContent).toContain('F-203');
  const queue=container.querySelector(`[role="group"][aria-label="${locale.ops_queue}"]`)!;expect(queue.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);expect(queue.querySelector('[aria-pressed="true"]')?.textContent).toContain('F-203');expect(readOperationsGame()).toEqual(older);
 });
 it(`${language}: blocked evidence save leaves classification and focus unchanged`,()=>{
  localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;render();select('S-104');click(locale.ops_decision_hold);const earlier=readOperationsGame();
  const evidence=[...container.querySelectorAll('button')].find(b=>b.textContent===locale.ops_evidence_combinedApproval)!;evidence.focus();vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Quota');});click(locale.ops_evidence_combinedApproval);
  expect(document.activeElement).toBe(evidence);expect(evidence.getAttribute('aria-pressed')).toBe('false');expect(container.querySelector('[role="alert"]')?.textContent).toBe(locale.ops_save_error);expect(readOperationsGame()).toEqual(earlier);
 });
}
it('a closed original evidence run reloads without reopening and restarts into seven records',()=>{
 localStorage.setItem('invested_language_preference','en');let old:import('@/lib/career/operationsGame').OperationsGame={decisions:{},checked:[],closed:false,evidence:{},resolved:[]};for(const row of OPERATIONS.slice(0,6)){old=decideOperation(old,row.id,row.expected);old=chooseOperationEvidence(old,row.id,REQUIRED_EVIDENCE[row.id]);old=resolveOperation(old,row.id);}localStorage.setItem(OPERATIONS_KEY,JSON.stringify(closeOperations(old)));render();expect(container.textContent).toContain(en.ops_closed);expect(container.textContent).not.toContain('S-104');
 vi.spyOn(window,'confirm').mockReturnValue(true);click(en.practice_restart);expect(container.textContent).toContain('S-104');expect(readOperationsGame()?.caseVersion).toBe(2);expect(readOperationsGame()?.runs?.[0].metrics.resolved).toBe(6);
});

for(const language of ['en','he'] as const)it(`${language}: closing and restart keep focus on the resulting view`,()=>{
 localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;let game=newOperationsGame();for(const row of OPERATIONS){game=decideOperation(game,row.id,row.expected);game=chooseOperationEvidence(game,row.id,REQUIRED_EVIDENCE[row.id]);game=resolveOperation(game,row.id);}localStorage.setItem(OPERATIONS_KEY,JSON.stringify(game));render();
 const close=[...container.querySelectorAll('button')].find(b=>b.textContent===locale.ops_close)!;close.focus();click(locale.ops_close);expect(document.activeElement?.textContent).toBe(locale.ops_closed);vi.spyOn(window,'confirm').mockReturnValue(true);click(locale.practice_restart);expect(document.activeElement?.textContent).toContain('S-101');expect(readOperationsGame()?.runs?.[0].metrics.resolved).toBe(7);
});
