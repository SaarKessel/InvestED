// @vitest-environment jsdom
import {beforeEach,it,expect} from 'vitest';
import {buildSnapshot,isPaperOrder,newOrder,notionalByCurrency,PAPER_LEDGER_KEY,PAPER_LEDGER_LIMIT,PaperLedgerConflictError,positions,readLedger,recordOrder} from './paperLedger';
import type {MarketAsset} from '@/types';

const asset=(over:Partial<MarketAsset>={}):MarketAsset=>({symbol:'AAPL',name:'Apple',price:200,currency:'USD',assetType:'stock',history:[],isMock:false,dataSource:'yahoo_finance',timestamp:'2026-09-30T10:00:00.000Z',freshness:'current',...over} as MarketAsset);
const snap=()=>buildSnapshot(asset(),new Date('2026-09-30T10:00:30.000Z'))!;

beforeEach(()=>localStorage.clear());

it('freezes only real Yahoo snapshots; mocked, foreign or malformed assets are rejected',()=>{
  expect(snap().symbol).toBe('AAPL');
  expect(buildSnapshot(asset({isMock:true}))).toBeNull();
  expect(buildSnapshot(asset({dataSource:'alpha_vantage'} as Partial<MarketAsset>))).toBeNull();
  expect(buildSnapshot(asset({price:-1}))).toBeNull();
  expect(buildSnapshot(asset({currency:'usd'}))).toBeNull();
  expect(buildSnapshot(asset({timestamp:'not-a-date'}))).toBeNull();
});

it('records guarded appends, survives reload, caps the ledger and keeps snapshots immutable',()=>{
  const first=newOrder('buy',2,snap());
  const after=recordOrder(first,[]);
  expect(after).toHaveLength(1);
  expect(readLedger().map(o=>o.id)).toEqual([first.id]);
  // Mutating the source asset after recording must not change the stored snapshot.
  const stolen=buildSnapshot(asset(),new Date('2026-09-30T10:00:30.000Z'))!;
  stolen.price=0.01;
  expect(readLedger()[0].snapshot.price).toBe(200);
  let expected=after;
  for(let i=0;i<PAPER_LEDGER_LIMIT+5;i++)expected=recordOrder(newOrder('buy',1,snap()),expected);
  expect(readLedger()).toHaveLength(PAPER_LEDGER_LIMIT);
});

it('rejects a stale-tab append and never drops the newer orders',()=>{
  const base=recordOrder(newOrder('buy',1,snap()),[]);
  const newer=recordOrder(newOrder('sell',1,snap()),base);
  expect(()=>recordOrder(newOrder('buy',5,snap()),base)).toThrow(PaperLedgerConflictError);
  expect(readLedger()).toEqual(newer);
});

it('groups net positions and notionals per symbol and currency without conversion',()=>{
  const ils=buildSnapshot(asset({symbol:'TEVA.TA',currency:'ILS',price:40}),new Date('2026-09-30T10:01:00.000Z'))!;
  const orders=[newOrder('buy',2,snap()),newOrder('sell',1,snap()),newOrder('buy',10,ils)];
  expect(positions(orders)).toEqual([{symbol:'AAPL',currency:'USD',netQuantity:1},{symbol:'TEVA.TA',currency:'ILS',netQuantity:10}]);
  expect(notionalByCurrency(orders)).toEqual([{currency:'USD',bought:400,sold:200},{currency:'ILS',bought:400,sold:0}]);
});

it('treats corrupt or oversized storage as empty and validates stored orders',()=>{
  localStorage.setItem(PAPER_LEDGER_KEY,'{broken');
  expect(readLedger()).toEqual([]);
  localStorage.setItem(PAPER_LEDGER_KEY,JSON.stringify([{id:'x',side:'buy'}]));
  expect(readLedger()).toEqual([]);
  const good=newOrder('buy',1,snap());
  expect(isPaperOrder(good)).toBe(true);
  expect(isPaperOrder({...good,quantity:0})).toBe(false);
});
