import {afterEach,describe,expect,it,vi} from 'vitest';
import handler from '../../api/market-quote';
import {ProviderRateLimitError} from './market/errors';
const spies=vi.hoisted(()=>({yahoo:vi.fn(),alpha:vi.fn()}));
vi.mock('./market/providers/yahooFinance.js',()=>({createYahooFinanceProvider:spies.yahoo}));
vi.mock('./market/providers/alphaVantage.js',()=>({createAlphaVantageProvider:spies.alpha}));
function provider(source:'yahoo_finance'|'alpha_vantage',price:number){return {id:source,getQuote:vi.fn(async(symbol:string)=>({symbol,name:symbol,assetType:'fund',price,previousClose:price,change:0,changePercent:0,currency:'USD',volume:null,marketStatus:'unknown',dataSource:source,timestamp:new Date().toISOString()})),getHistory:vi.fn(async()=>[{date:'2026-09-28',price},{date:'2026-09-29',price}])};}
async function request(query:Record<string,string>){let body={} as {assets:{dataSource:string;symbol:string;price:number;isMock:boolean}[]};const headers:Record<string,string>={};let status=0;await handler({query},{setHeader:(k,v)=>{headers[k]=v;},status:c=>{status=c;return {json:b=>{body=b as typeof body;}};}});return {body,status,headers};}
afterEach(()=>vi.unstubAllEnvs());
describe('scoped existing market endpoint',()=>{
  it('keeps default Alpha cache out of Yahoo-only mutual fund lookup',async()=>{
    vi.stubEnv('ALPHA_VANTAGE_API_KEY','test-only');const yahoo=provider('yahoo_finance',101);const alpha=provider('alpha_vantage',202);spies.yahoo.mockReturnValue(yahoo);spies.alpha.mockReturnValue(alpha);
    expect((await request({symbols:'FXAIX'})).body.assets[0].dataSource).toBe('alpha_vantage');
    const sourced=await request({symbols:'FXAIX',provider:'yahoo_finance'});expect(sourced.body.assets[0]).toMatchObject({symbol:'FXAIX',price:101,dataSource:'yahoo_finance',isMock:false});expect(sourced.headers['Cache-Control']).toContain('900');
    await request({symbols:'FXAIX',provider:'yahoo_finance'});expect(yahoo.getQuote).toHaveBeenCalledOnce();
  });
  it('shares concurrent source requests in the same warm instance',async()=>{
    const yahoo=provider('yahoo_finance',101);spies.yahoo.mockReturnValue(yahoo);await Promise.all([request({symbols:'SHARED',provider:'yahoo_finance'}),request({symbols:'SHARED',provider:'yahoo_finance'})]);expect(yahoo.getQuote).toHaveBeenCalledOnce();
  });
  it('stops the Yahoo batch and subsequent warm requests on rate limit',async()=>{
    const yahoo=provider('yahoo_finance',101);yahoo.getQuote.mockRejectedValue(new ProviderRateLimitError('429'));spies.yahoo.mockReturnValue(yahoo);
    const response=await request({symbols:'LIMIT1,LIMIT2',provider:'yahoo_finance'});expect(response.body.assets.every(asset=>asset.price===null)).toBe(true);
    await request({symbols:'LIMIT3',provider:'yahoo_finance'});expect(yahoo.getQuote).toHaveBeenCalledOnce();
  });
  it('rejects unsupported provider without calling providers',async()=>{
    spies.yahoo.mockClear();expect((await request({symbols:'AAPL',provider:'invented'})).status).toBe(400);expect(spies.yahoo).not.toHaveBeenCalled();
  });
});
