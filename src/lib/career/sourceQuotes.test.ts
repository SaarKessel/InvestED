import {afterEach,describe,it,expect,vi} from 'vitest';
import {getSourceQuote} from './sourceQuotes';
afterEach(()=>vi.unstubAllGlobals());
describe('Yahoo-only game inspection',()=>{
  it('never creates a mock quote on failure and caches unavailable results',async()=>{
    const fetch=vi.fn(async()=>({ok:false,status:429}));vi.stubGlobal('fetch',fetch);
    const first=await getSourceQuote('BADX');expect(first.asset).toBeNull();expect(first.cached).toBe(false);
    const second=await getSourceQuote('BADX');expect(second.asset).toBeNull();expect(second.cached).toBe(true);expect(fetch).toHaveBeenCalledOnce();
    expect(String(fetch.mock.calls[0][0])).toContain('provider=yahoo_finance');
  });
  it('rejects unbound symbols and missing source metadata',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({assets:[{symbol:'WRONG',price:10,history:[{date:'1',price:10},{date:'2',price:10}],dataSource:'yahoo_finance',currency:'USD',timestamp:'2026-09-30T00:00:00Z'}]})})));
    expect((await getSourceQuote('TESTQ')).asset).toBeNull();expect((await getSourceQuote('../secret')).asset).toBeNull();
  });
});
describe('valid source fixtures, not live market evidence',()=>{
  it('accepts exact real provenance and preserves source time/currency',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({assets:[{symbol:'FXAIX',price:100,history:[{date:'2026-09-28',price:99},{date:'2026-09-29',price:100}],dataSource:'yahoo_finance',currency:'USD',timestamp:'2026-09-29T20:00:00Z',assetType:'fund'}]})})));
    expect((await getSourceQuote('FXAIX')).asset).toMatchObject({symbol:'FXAIX',currency:'USD',price:100,dataSource:'yahoo_finance',isMock:false});
  });
  it('rejects missing currency and timestamp rather than claiming a current quote',async()=>{
    vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>({assets:[{symbol:'METALESS',price:100,history:[{date:'1',price:100},{date:'2',price:100}],dataSource:'yahoo_finance'}]})})));expect((await getSourceQuote('METALESS')).asset).toBeNull();
  });
  it('shares concurrent requests',async()=>{
    const fetch=vi.fn(async()=>({ok:false,status:503}));vi.stubGlobal('fetch',fetch);await Promise.all([getSourceQuote('DEDUP'),getSourceQuote('DEDUP')]);expect(fetch).toHaveBeenCalledOnce();
  });
});
