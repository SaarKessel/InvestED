// @vitest-environment jsdom
import {describe,it,expect} from 'vitest';
import {instrumentPrice,holding,clientReply,clientMessage,portfolioClients,portfolioResult,isPortfolioGame,GAME_DAYS,GAME_KEY,GameActionError,GameConflictError,INITIAL_CASH,newPortfolioGame,playPortfolioGame,portfolioValue,readPortfolioGame,savePortfolioGame} from './portfolioGame';
describe('fictional portfolio manager game',()=>{
  it('buys, marks daily value and only charges a fee on realized gains',()=>{
    let g=newPortfolioGame();expect(portfolioValue(g)).toBe(INITIAL_CASH);
    g=playPortfolioGame(g,{type:'buy',quantity:10});expect(g.cash).toBe(9000);
    g=playPortfolioGame(g,{type:'next'});expect(portfolioValue(g)).toBe(9920);
    g=playPortfolioGame(g,{type:'next'});expect(portfolioValue(g)).toBe(10050);
    g=playPortfolioGame(g,{type:'sell',quantity:5});expect(g.feeEarned).toBe(2.5);
    expect(g.cash).toBe(9522.5);expect(g.shares).toBe(5);expect(g.basis).toBe(500);
    expect(portfolioValue(g)).toBe(10047.5);
    expect(()=>playPortfolioGame(g,{type:'sell',quantity:6})).toThrow(GameActionError);
  });
  it('keeps news fixed and handles a client warning without fabricated inbox traffic',()=>{
    let g=newPortfolioGame();g=playPortfolioGame(g,{type:'next'});g=playPortfolioGame(g,{type:'next'});g=playPortfolioGame(g,{type:'next'});
    expect(GAME_DAYS[g.day].client).toBe('warning');
    const ignored=playPortfolioGame(g,{type:'next'});expect(ignored.clients).toBe(2);expect(ignored.departures).toEqual([4]);
    g=playPortfolioGame(g,{type:'reply',answer:'explained'});g=playPortfolioGame(g,{type:'next'});expect(g.clients).toBe(3);
    const final=playPortfolioGame(g,{type:'buy',quantity:1});expect(final.shares).toBe(1);expect(final.trades.at(-1)?.price).toBe(118);
    expect(()=>playPortfolioGame(g,{type:'next'})).toThrow(GameActionError);
  });
  it('distinguishes daily mandates and never revives a departed client',()=>{
    let g=playPortfolioGame(newPortfolioGame(),{type:'reply',answer:'guaranteed'});
    g=playPortfolioGame(g,{type:'next'});
    expect(portfolioClients(g).map(c=>c.trust)).toEqual([35,45,55]);
    g=playPortfolioGame(g,{type:'reply',answer:'guaranteed'});
    g=playPortfolioGame(g,{type:'next'});
    expect(g.clients).toBe(0);expect(g.departures).toEqual([2,2,2]);
    g=playPortfolioGame(g,{type:'reply',answer:'explained'});
    g=playPortfolioGame(g,{type:'next'});expect(g.clients).toBe(0);
  });
  it('penalizes losses only after a day completes and respects risk tolerances',()=>{
    let g=playPortfolioGame(newPortfolioGame(),{type:'buy',quantity:100});
    g=playPortfolioGame(g,{type:'reply',answer:'explained'});
    g=playPortfolioGame(g,{type:'next'});
    expect(portfolioClients(g).map(c=>c.trust)).toEqual([78,88,98]);
    g=playPortfolioGame(g,{type:'reply',answer:'explained'});
    g=playPortfolioGame(g,{type:'next'});
    expect(portfolioClients(g).map(c=>c.trust)).toEqual([66,76,100]);
    expect(g.cash).toBe(0);expect(g.shares).toBe(100);
  });
  it('keeps honest replies distinct from silence and ignores future responses',()=>{
    let honest=newPortfolioGame();let silent=newPortfolioGame();
    for(let day=0;day<4;day++){
      honest=playPortfolioGame(honest,{type:'reply',answer:'explained'});
      honest=playPortfolioGame(honest,{type:'next'});
      silent=playPortfolioGame(silent,{type:'next'});
    }
    expect(honest.clients).toBe(3);expect(silent.clients).toBe(2);
    expect(portfolioClients(newPortfolioGame()).map(c=>c.trust)).toEqual([70,80,90]);
  });
  it('settles remaining holdings exactly once and freezes the completed run',()=>{
    let g=playPortfolioGame(newPortfolioGame(),{type:'buy',quantity:100});
    for(let i=0;i<4;i++){g=playPortfolioGame(g,{type:'reply',answer:'explained'});g=playPortfolioGame(g,{type:'next'});}
    g=playPortfolioGame(g,{type:'reply',answer:'explained'});
    expect(()=>portfolioResult(g)).toThrow(GameActionError);
    const settled=playPortfolioGame(g,{type:'settle'});
    expect(settled.cash).toBe(11620);expect(settled.shares).toBe(0);expect(settled.basis).toBe(0);expect(settled.feeEarned).toBe(180);
    const result=portfolioResult(settled);
    expect(result.netChange).toBe(1620);expect(result.netReturn).toBe(16.2);expect(result.grossChange).toBe(1800);expect(result.targetReached).toBe(true);expect(result.retained).toBe(3);
    expect(result.values).toEqual([10000,9200,10500,8600,11620]);expect(result.maxDrawdown).toBe(18.1);
    for(const action of [{type:'settle'},{type:'next'},{type:'buy',quantity:1},{type:'sell',quantity:1},{type:'reply',answer:'ignored'}] as const)expect(()=>playPortfolioGame(settled,action)).toThrow(GameActionError);
    expect(isPortfolioGame({...settled,shares:1})).toBe(false);
  });
  it('includes the final client review even with no shares or fees',()=>{
    let g=newPortfolioGame();for(let i=0;i<4;i++)g=playPortfolioGame(g,{type:'next'});
    expect(g.clients).toBe(2);
    g=playPortfolioGame(g,{type:'settle'});
    expect(g.clients).toBe(0);expect(g.departures).toEqual([4,4,4]);expect(g.trades).toHaveLength(0);
    expect(portfolioResult(g).managerFee).toBe(0);expect(portfolioResult(g).netChange).toBe(0);
    expect(()=>playPortfolioGame(newPortfolioGame(),{type:'settle'})).toThrow(GameActionError);
  });
  it('keeps already realized fees and persists a settled record without a second charge',()=>{
    localStorage.removeItem(GAME_KEY);
    let g=playPortfolioGame(newPortfolioGame(),{type:'buy',quantity:10});
    for(let i=0;i<2;i++)g=playPortfolioGame(g,{type:'next'});
    g=playPortfolioGame(g,{type:'sell',quantity:5});
    for(let i=0;i<2;i++)g=playPortfolioGame(g,{type:'next'});
    g=playPortfolioGame(g,{type:'settle'});
    expect(g.feeEarned).toBe(11.5);expect(g.cash).toBe(10103.5);
    savePortfolioGame(g,null);expect(readPortfolioGame()).toEqual(g);localStorage.removeItem(GAME_KEY);
  });
  it('isolates personal replies and chooses messages from client mandate and game state',()=>{
    let g=playPortfolioGame(newPortfolioGame(),{type:'buy',quantity:100});
    expect(clientMessage(g,'cautious').topic).toBe('intro');
    g=playPortfolioGame(g,{type:'reply',clientId:'cautious',answer:'explained'});
    expect(clientReply(g,'balanced',0)).toBe('none');
    expect(()=>playPortfolioGame(g,{type:'reply',clientId:'cautious',answer:'ignored'})).toThrow(GameActionError);
    g=playPortfolioGame(g,{type:'next'});
    expect(portfolioClients(g).map(client=>client.trust)).toEqual([78,68,78]);
    expect(clientMessage(g,'cautious').topic).toBe('loss');
    expect(clientMessage(g,'balanced').topic).toBe('loss');
    expect(clientMessage(g,'growth').topic).toBe('plan');
    g=playPortfolioGame(g,{type:'reply',clientId:'cautious',answer:'guaranteed'});
    g=playPortfolioGame(g,{type:'next'});
    expect(portfolioClients(g)[0].active).toBe(false);
    expect(clientMessage(g,'cautious').topic).toBe('left');
    expect(()=>playPortfolioGame(g,{type:'reply',clientId:'cautious',answer:'explained'})).toThrow(GameActionError);
  });
  it('preserves legacy shared replies and persists individual overrides',()=>{
    localStorage.removeItem(GAME_KEY);
    let g=playPortfolioGame(newPortfolioGame(),{type:'reply',answer:'explained'});
    expect(clientReply(g,'balanced',0)).toBe('explained');
    g=playPortfolioGame(g,{type:'next'});
    g=playPortfolioGame(g,{type:'reply',clientId:'balanced',answer:'ignored'});
    expect(clientReply(g,'balanced',1)).toBe('ignored');expect(clientReply(g,'growth',1)).toBe('none');
    savePortfolioGame(g,null);expect(readPortfolioGame()).toEqual(g);localStorage.removeItem(GAME_KEY);
    expect(isPortfolioGame({...g,clientReplies:{balanced:['none']}})).toBe(false);
  });
  it('accounts for multiple instruments and settles each without a duplicate fee',()=>{
    let g=playPortfolioGame(newPortfolioGame(),{type:'buy',instrument:'HBR-F',quantity:10});
    g=playPortfolioGame(g,{type:'buy',instrument:'BND-F',quantity:20});
    expect(g.cash).toBe(8200);expect(g.shares).toBe(0);expect(holding(g,'HBR-F').basis).toBe(800);
    expect(()=>playPortfolioGame(g,{type:'sell',instrument:'NST-F',quantity:1})).toThrow(GameActionError);
    g=playPortfolioGame(g,{type:'next'});expect(portfolioValue(g)).toBe(10030);
    for(let i=0;i<3;i++)g=playPortfolioGame(g,{type:'next'});
    g=playPortfolioGame(g,{type:'settle'});
    expect(g.cash).toBe(10135);expect(g.feeEarned).toBe(15);expect(holding(g,'HBR-F').shares).toBe(0);expect(holding(g,'BND-F').shares).toBe(0);
    expect(portfolioResult(g).grossChange).toBe(150);
    expect(isPortfolioGame({...g,holdings:{'BND-F':{shares:1,basis:50}}})).toBe(false);
  });
  it('locks fictional scenario selection and applies stress quotes to trading and risk',()=>{
    let g=playPortfolioGame(newPortfolioGame(),{type:'scenario',scenario:'stress'});
    g=playPortfolioGame(g,{type:'buy',quantity:100});
    expect(()=>playPortfolioGame(g,{type:'scenario',scenario:'base'})).toThrow(GameActionError);
    g=playPortfolioGame(g,{type:'next'});expect(instrumentPrice(g)).toBe(84);expect(portfolioValue(g)).toBe(8400);
    expect(clientMessage(g,'growth').topic).toBe('loss');
    for(let i=0;i<3;i++)g=playPortfolioGame(g,{type:'next'});
    g=playPortfolioGame(g,{type:'settle'});expect(g.cash).toBe(8100);expect(g.feeEarned).toBe(0);expect(portfolioResult(g).netReturn).toBe(-19);
    expect(isPortfolioGame({...g,scenario:'unknown'})).toBe(false);
  });
  it('tests client cash commitments against actual holdings, not reply wording',()=>{
    let g=playPortfolioGame(newPortfolioGame(),{type:'plan',clientId:'cautious',plan:'cashBuffer'});
    expect(()=>playPortfolioGame(g,{type:'scenario',scenario:'stress'})).toThrow(GameActionError);
    const kept=playPortfolioGame(g,{type:'next'});
    expect(portfolioClients(kept)[0].trust).toBe(64);
    g=playPortfolioGame(g,{type:'buy',quantity:100});g=playPortfolioGame(g,{type:'next'});
    expect(portfolioClients(g)[0].trust).toBe(40);
    expect(portfolioClients(g)[1].trust).toBe(68);
    expect(()=>playPortfolioGame(playPortfolioGame(newPortfolioGame(),{type:'plan',clientId:'balanced',plan:'monitor'}),{type:'plan',clientId:'balanced',plan:'cashBuffer'})).toThrow(GameActionError);
  });
  it('blocks impossible trades and stale tabs',()=>{
    localStorage.removeItem(GAME_KEY);const first=newPortfolioGame();
    expect(()=>playPortfolioGame(first,{type:'buy',quantity:101})).toThrow(GameActionError);
    expect(()=>playPortfolioGame(first,{type:'buy',quantity:.5})).toThrow(GameActionError);
    savePortfolioGame(first,null);const newer=playPortfolioGame(first,{type:'buy',quantity:1});savePortfolioGame(newer,first);
    expect(()=>savePortfolioGame(playPortfolioGame(first,{type:'next'}),first)).toThrow(GameConflictError);
    expect(readPortfolioGame()).toEqual(newer);localStorage.removeItem(GAME_KEY);
  });
});
