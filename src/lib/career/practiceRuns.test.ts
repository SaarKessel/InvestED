import {isPortfolioGame,newPortfolioGame} from './portfolioGame';
import {isAnalystGame,newAnalystGame} from './analystGame';
import {isAccountantGame,newAccountantGame} from './accountantGame';
import {describe,it,expect} from 'vitest';
import {archivePracticeRun,validPracticeRuns} from './practiceRuns';
describe('local practice history',()=>{
 it('keeps last 20 summaries with immutable prior records',()=>{let runs=archivePracticeRun(undefined,'analyst',{checked:3,evidence:2});const prior=runs;for(let i=0;i<22;i++)runs=archivePracticeRun(runs,'analyst',{checked:3});expect(runs).toHaveLength(20);expect(prior).toHaveLength(1);expect(validPracticeRuns(runs,'analyst')).toBe(true);});
 it('validates history through each game storage contract',()=>{const runs=archivePracticeRun(undefined,'portfolio',{netReturn:18});expect(isPortfolioGame({...newPortfolioGame(),runs})).toBe(true);expect(isAnalystGame({...newAnalystGame(),runs})).toBe(false);expect(isAccountantGame({...newAccountantGame(),runs})).toBe(false);});
 it('rejects wrong roles, duplicate ids, invalid times and non-finite results',()=>{const runs=archivePracticeRun(undefined,'portfolio',{netReturn:18,retained:3});expect(validPracticeRuns(runs,'analyst')).toBe(false);expect(validPracticeRuns([...runs,...runs],'portfolio')).toBe(false);expect(validPracticeRuns([{...runs[0],metrics:{netReturn:Infinity}}],'portfolio')).toBe(false);expect(validPracticeRuns([{...runs[0],finishedAt:'bad'}],'portfolio')).toBe(false);});
});
