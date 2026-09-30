// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {MemoryRouter} from 'react-router-dom';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {LanguageProvider} from '@/context/languageContext';
import Portfolio from './PortfolioGamePage';
import Analyst from './AnalystGamePage';
import Accountant from './AccountantGamePage';
import Operations from './OperationsGamePage';
// Keep the real Layout so this catches nested main landmarks.
vi.mock('@/components/layout/Navbar',()=>({Navbar:()=>null}));
vi.mock('@/components/layout/Footer',()=>({Footer:()=>null}));
vi.mock('@/components/career/SourceMarketPanel',()=>({SourceMarketPanel:()=>null}));
vi.mock('@/components/career/CandleChart',()=>({CandleChart:()=>null}));
(globalThis as Record<string,unknown>).IS_REACT_ACT_ENVIRONMENT=true;
let container:HTMLDivElement;let root:Root;
beforeEach(()=>{localStorage.clear();container=document.createElement('div');document.body.append(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
for(const language of ['he','en'] as const)for(const [name,Page] of Object.entries({Portfolio,Analyst,Accountant,Operations}))it(`${language} ${name}: one main landmark and one page heading`,()=>{
 localStorage.setItem('invested_language_preference',language);act(()=>root.render(<MemoryRouter><LanguageProvider><Page/></LanguageProvider></MemoryRouter>));
 expect(container.querySelectorAll('main')).toHaveLength(1);expect(container.querySelectorAll('h1')).toHaveLength(1);
 expect(container.querySelector('main')?.contains(container.querySelector('h1'))).toBe(true);expect(container.querySelector('main>section')?.getAttribute('dir')).toBe(language==='he'?'rtl':'ltr');
});
