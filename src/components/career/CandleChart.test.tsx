// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {LanguageProvider} from '@/context/languageContext';
import en from '@/locales/en.json';
import he from '@/locales/he.json';
import {CandleChart} from './CandleChart';
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let container:HTMLDivElement;let root:Root;
beforeEach(()=>{localStorage.clear();vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){}});container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();vi.unstubAllGlobals();});
for(const language of ['he','en'] as const)it(`${language}: keyboard inspection has date/OHLC values and named window controls`,()=>{
 localStorage.setItem('invested_language_preference',language);const locale=language==='he'?he:en;const onSelect=vi.fn();const points=[{date:'Case day 1',open:100,high:105,low:98,close:103,price:103},{date:'Case day 2',open:103,high:108,low:101,close:106,price:106}];
 act(()=>root.render(<LanguageProvider><CandleChart points={points} symbol="TEST-F" currency="game units" fictional onSelect={onSelect}/></LanguageProvider>));
 const range=container.querySelector('input')!;expect(range.getAttribute('aria-label')).toBe(locale.game_candle_inspect);expect(range.getAttribute('aria-valuetext')).toContain('Case day 2; O 103; H 108; L 101; C 106');
 const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!;act(()=>{setter.call(range,'0');range.dispatchEvent(new Event('change',{bubbles:true}));});
 expect(onSelect).toHaveBeenCalledWith(0);expect(range.getAttribute('aria-valuetext')).toContain('Case day 1; O 100');
 expect([...container.querySelectorAll('button')].map(b=>b.getAttribute('aria-label'))).toEqual([10,30,90].map(size=>`${locale.game_candle_window}: ${size}`));
});
