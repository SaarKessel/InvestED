import { describe, expect, it } from 'vitest';
import { parseBisMonthlyRates } from './bisPolicyRate';
const wrap = (attrs: string, obs: string) => `<message:StructureSpecificData><data:Series ${attrs}>${obs}</data:Series></message:StructureSpecificData>`;
describe('BIS monthly Israel policy rate parser', () => {
  it('parses and sorts dated months, keeping the rate distinct from loan quotes', () => {
    expect(parseBisMonthlyRates(wrap('FREQ="M" REF_AREA="IL"', '<Obs TIME_PERIOD="2026-07" OBS_VALUE="3.5"/><Obs TIME_PERIOD="2026-06" OBS_VALUE="3.75"/>'))).toEqual([{month:'2026-06',rate:3.75},{month:'2026-07',rate:3.5}]);
  });
  it('rejects other countries/frequencies and invalid points', () => {
    expect(parseBisMonthlyRates(wrap('FREQ="M" REF_AREA="US"','<Obs TIME_PERIOD="2026-07" OBS_VALUE="3.5"/>'))).toEqual([]);
    expect(parseBisMonthlyRates(wrap('FREQ="D" REF_AREA="IL"','<Obs TIME_PERIOD="2026-07" OBS_VALUE="3.5"/>'))).toEqual([]);
    expect(parseBisMonthlyRates(wrap('FREQ="M" REF_AREA="IL"','<Obs TIME_PERIOD="2026-13" OBS_VALUE="3.5"/><Obs TIME_PERIOD="2026-07" OBS_VALUE="Infinity"/>'))).toEqual([]);
  });
});
