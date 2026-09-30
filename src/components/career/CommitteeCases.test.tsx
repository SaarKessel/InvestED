// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {LanguageProvider} from '@/context/languageContext';
import en from '@/locales/en.json';
import he from '@/locales/he.json';
import {CommitteeCases} from './CommitteeCases';
import {committeeKey,COMMITTEE_CASES,readCommitteeState,type CommitteeRole} from '@/lib/career/committeeCases';
(globalThis as typeof globalThis & {IS_REACT_ACT_ENVIRONMENT:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let container:HTMLDivElement;let root:Root;
beforeEach(()=>{localStorage.clear();container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();vi.restoreAllMocks();});
const render=(role:CommitteeRole)=>act(()=>root.render(<LanguageProvider><CommitteeCases role={role}/></LanguageProvider>));
const click=(text:string)=>{const button=[...container.querySelectorAll('button')].find(b=>b.textContent?.trim()===text);expect(button).toBeDefined();act(()=>button!.click());};
describe('shared committee practice controls',()=>{
 for(const language of ['he','en'] as const)for(const role of ['investment','research','reporting'] as const)it(`${language} ${role}: one case visible, choices stay independent and reload`,()=>{
  localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;render(role);
  expect(container.querySelectorAll('section')).toHaveLength(1);
  const cases=COMMITTEE_CASES[role];const second=cases[1];const third=cases[2];
  click(`2. ${locale[`committee_case_${second.id}`]}`);expect(container.querySelector('h3')?.textContent).toBe(locale[`committee_case_${second.id}`]);
  click(locale.committee_defer);expect(readCommitteeState(role)?.decisions[second.id]).toBe('defer');
  click(`3. ${locale[`committee_case_${third.id}`]}`);click(locale.committee_approve);
  expect(container.textContent).toContain('2/4');expect(container.textContent).toContain(locale.committee_correct);
  act(()=>root.unmount());root=createRoot(container);render(role);
  expect(container.textContent).toContain('2/4');expect(readCommitteeState(role)?.decisions).toEqual({[second.id]:'defer',[third.id]:'approve'});
 });
 it('shows no false save after blocked storage',()=>{
  localStorage.setItem('invested_language_preference','en');render('research');vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Quota');});
  click(en.committee_review);expect(container.querySelector('[role="alert"]')?.textContent).toBe(en.committee_save_error);expect(container.textContent).toContain('0/4');expect(readCommitteeState('research')).toBeNull();
 });
 it('loads newer choices without writing and then resumes from that snapshot',()=>{
  localStorage.setItem('invested_language_preference','en');render('research');const newer={decisions:{fundRisk:'defer' as const}};localStorage.setItem(committeeKey('research'),JSON.stringify(newer));
  click(en.committee_review);expect(container.querySelector('[role="alert"]')?.textContent).toBe(en.committee_conflict);expect(readCommitteeState('research')).toEqual(newer);
  const spy=vi.spyOn(Storage.prototype,'setItem');click(en.committee_load_latest);expect(spy).not.toHaveBeenCalled();expect(container.querySelector('[role="alert"]')).toBeNull();expect(container.textContent).toContain('1/4');
  click(en.committee_review);expect(readCommitteeState('research')?.decisions).toEqual({fundRisk:'defer',fundFees:'review'});
 });
});

it('restores focus to the selected case after the recovery button disappears',()=>{
 localStorage.setItem('invested_language_preference','en');render('research');
 localStorage.setItem(committeeKey('research'),JSON.stringify({decisions:{fundRisk:'defer'}}));click(en.committee_review);
 const recovery=[...container.querySelectorAll('button')].find(b=>b.textContent===en.committee_load_latest)!;recovery.focus();click(en.committee_load_latest);
 expect(document.activeElement?.getAttribute('aria-pressed')).toBe('true');
 const panel=document.getElementById(document.activeElement!.getAttribute('aria-controls')!);
 expect(panel?.querySelector('h3')?.textContent).toBe(en.committee_case_fundFees);
});

for(const language of ['he','en'] as const)for(const role of ['investment','research','reporting'] as const)it(`${language} ${role}: fourth case has independent feedback and stored choices`,()=>{
 localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;render(role);
 const row=COMMITTEE_CASES[role][3];click(`4. ${locale[`committee_case_${row.id}`]}`);expect(container.querySelectorAll('section')).toHaveLength(1);
 click(locale[`committee_${row.correct}`]);expect(container.textContent).toContain(locale[`committee_reason_${row.reason}`]);expect(container.textContent).toContain('1/4');expect(readCommitteeState(role)?.decisions[row.id]).toBe(row.correct);
});

for(const language of ['en','he'] as const)it(`${language}: blocked new-case decision keeps focus, choices and completion count unchanged`,()=>{
 localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;render('reporting');click(`4. ${locale.committee_case_accrualBridge}`);
 const button=[...container.querySelectorAll('button')].find(b=>b.textContent===locale.committee_approve)!;button.focus();vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Quota');});click(locale.committee_approve);
 expect(document.activeElement).toBe(button);expect(button.getAttribute('aria-pressed')).toBe('false');expect(container.textContent).toContain('0/4');expect(container.querySelector('[role="alert"]')?.textContent).toBe(locale.committee_save_error);expect(readCommitteeState('reporting')).toBeNull();
});
