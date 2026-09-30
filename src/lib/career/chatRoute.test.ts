import {expect,it} from 'vitest';
import {isCareerLaunchRequest} from './chatRoute';
it('routes only explicit analyst case launch, not broad financial questions',()=>{
  expect(isCareerLaunchRequest('Put me in an investment analyst simulation')).toBe(true);
  expect(isCareerLaunchRequest('Start a research case')).toBe(true);
  expect(isCareerLaunchRequest('תני לי מעבדת קריירה')).toBe(true);
  expect(isCareerLaunchRequest('מה זה מחקר מניות?')).toBe(false);
  expect(isCareerLaunchRequest('Should I buy AAPL?')).toBe(false);
});
