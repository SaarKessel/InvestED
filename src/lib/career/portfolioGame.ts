import {validPracticeRuns,type PracticeRun} from './practiceRuns';
/** All prices, news, clients and outcomes are fictional and fixed for this educational game. */
export const GAME_DAYS = [
  {price:100,news:'launch',client:'intro'},
  {price:92,news:'supplier',client:'worry'},
  {price:105,news:'contract',client:'question'},
  {price:86,news:'rival',client:'warning'},
  {price:118,news:'report',client:'review'},
] as const;
export const INSTRUMENTS=['NST-F','HBR-F','BND-F'] as const;
export type Instrument=typeof INSTRUMENTS[number];
export type Scenario='base'|'stress';
export const SCENARIO_PRICES={
  base:{'NST-F':[100,92,105,86,118],'HBR-F':[80,83,79,88,91],'BND-F':[50,50,51,50,52]},
  stress:{'NST-F':[100,84,89,72,81],'HBR-F':[80,76,69,73,77],'BND-F':[50,51,52,53,54]},
} as const;
export const instrumentPrice=(game:PortfolioGame,instrument:Instrument='NST-F',day=game.day):number=>SCENARIO_PRICES[game.scenario??'base'][instrument][day];
export const holding=(game:PortfolioGame,instrument:Instrument)=>instrument==='NST-F'?{shares:game.shares,basis:game.basis}:game.holdings?.[instrument]??{shares:0,basis:0};
export type ClientReply = 'none'|'explained'|'ignored'|'guaranteed';
export type GameAction = {type:'buy'|'sell';quantity:number;instrument?:Instrument}|{type:'scenario';scenario:Scenario}|{type:'reply';answer:'explained'|'ignored'|'guaranteed';clientId?:ClientId}|{type:'plan';clientId:ClientId;plan:'cashBuffer'|'monitor'}|{type:'next'}|{type:'settle'};
export interface Trade {day:number;side:'buy'|'sell';quantity:number;price:number;fee:number;instrument?:Instrument;}
export interface PortfolioGame {runs?:PracticeRun[];
  day:number;cash:number;shares:number;basis:number;clients:number;feeEarned:number;clientPlans?:Partial<Record<ClientId,('none'|'cashBuffer'|'monitor')[]>>;scenario?:Scenario;holdings?:Partial<Record<Instrument,{shares:number;basis:number}>>;
  replies:ClientReply[];trades:Trade[];departures:number[];settled?:boolean;planVersion?:2;clientReplies?:Partial<Record<ClientId,ClientReply[]>>;
}
export const GAME_KEY='invested_career_portfolio_game_v1';
export const INITIAL_CASH=10000;
export const GAME_TARGET=11500;
export const GAME_FEE_RATE=.1;
const cents=(value:number)=>Math.round(value*100)/100;
export const newPortfolioGame=():PortfolioGame=>({day:0,cash:INITIAL_CASH,shares:0,basis:0,clients:3,feeEarned:0,planVersion:2,replies:GAME_DAYS.map(()=> 'none'),trades:[],departures:[]});
export const portfolioValue=(game:PortfolioGame):number=>cents(game.cash+INSTRUMENTS.reduce((total,instrument)=>total+holding(game,instrument).shares*instrumentPrice(game,instrument),0));
export const isPortfolioGame=(value:unknown):value is PortfolioGame=>{
  if (!value || typeof value!=='object') return false;
  const g=value as PortfolioGame;
  if(!validPracticeRuns(g.runs,'portfolio'))return false;
  return (g.planVersion===undefined||g.planVersion===2) && (g.clientPlans===undefined||(!!g.clientPlans&&typeof g.clientPlans==='object'&&Object.entries(g.clientPlans).every(([id,plans])=>CLIENT_PROFILES.some(profile=>profile.id===id)&&Array.isArray(plans)&&plans.length===GAME_DAYS.length&&plans.every(plan=>['none','cashBuffer','monitor'].includes(plan))))) && (g.scenario===undefined||['base','stress'].includes(g.scenario)) && (g.holdings===undefined||(!!g.holdings&&typeof g.holdings==='object'&&!Array.isArray(g.holdings)&&Object.entries(g.holdings).every(([id,h])=>INSTRUMENTS.includes(id as Instrument)&&id!=='NST-F'&&!!h&&Number.isInteger(h.shares)&&h.shares>=0&&Number.isFinite(h.basis)&&h.basis>=0&&(!g.settled||(h.shares===0&&h.basis===0))))) && (g.settled===undefined||typeof g.settled==='boolean') && (!g.settled||(g.day===GAME_DAYS.length-1&&g.shares===0&&g.basis===0)) && Number.isInteger(g.day) && g.day>=0 && g.day<GAME_DAYS.length &&
    Number.isInteger(g.shares) && g.shares>=0 && Number.isFinite(g.cash) && g.cash>=0 &&
    Number.isFinite(g.basis) && g.basis>=0 && Number.isInteger(g.clients) && g.clients>=0 && g.clients<=3 &&
    Number.isFinite(g.feeEarned) && g.feeEarned>=0 && Array.isArray(g.replies) && g.replies.length===GAME_DAYS.length && g.replies.every(r=>['none','explained','ignored','guaranteed'].includes(r)) && (g.clientReplies===undefined||(!!g.clientReplies&&typeof g.clientReplies==='object'&&Object.entries(g.clientReplies).every(([id,replies])=>CLIENT_PROFILES.some(profile=>profile.id===id)&&Array.isArray(replies)&&replies.length===GAME_DAYS.length&&replies.every(reply=>['none','explained','ignored','guaranteed'].includes(reply))))) &&
    Array.isArray(g.trades) && g.trades.every(t=>(t.instrument===undefined||INSTRUMENTS.includes(t.instrument))&&Number.isInteger(t.day)&&t.day>=0&&t.day<=g.day&&['buy','sell'].includes(t.side)&&Number.isInteger(t.quantity)&&t.quantity>0&&Number.isFinite(t.price)&&t.price>0&&Number.isFinite(t.fee)&&t.fee>=0) &&
    Array.isArray(g.departures) && g.departures.every(d=>Number.isInteger(d)&&d>=0&&d<=g.day);
};
export class GameActionError extends Error {}
export function playPortfolioGame(game:PortfolioGame,action:GameAction):PortfolioGame {
  if (!isPortfolioGame(game)) throw new GameActionError('Invalid game');
  if(game.settled)throw new GameActionError('Already settled');
  if(action.type==='scenario'){
    if(game.day!==0||Object.values(game.clientPlans??{}).some(plans=>plans?.some(plan=>plan!=='none'))||game.trades.length>0||game.replies.some(reply=>reply!=='none')||Object.values(game.clientReplies??{}).some(replies=>replies?.some(reply=>reply!=='none')))throw new GameActionError('Scenario locked after first action');
    if(!['base','stress'].includes(action.scenario))throw new GameActionError('Invalid scenario');
    return {...game,scenario:action.scenario};
  }
  if(action.type==='settle'){
    if(game.day!==GAME_DAYS.length-1)throw new GameActionError('Final day only');
    // Reuse normal liquidation accounting. No separate fee or second charge.
    let liquidated=game;
    for(const instrument of INSTRUMENTS){const quantity=holding(liquidated,instrument).shares;if(quantity>0)liquidated=playPortfolioGame(liquidated,{type:'sell',quantity,instrument});}
    const settled={...liquidated,settled:true};
    const statuses=portfolioClients(settled);
    return {...settled,clients:statuses.filter(client=>client.active).length,departures:statuses.filter(client=>!client.active).map(client=>client.leftDay!)};
  }
  if(action.type==='plan'){
    if(!CLIENT_PROFILES.some(profile=>profile.id===action.clientId)||!portfolioClients(game).find(client=>client.id===action.clientId)?.active)throw new GameActionError('Client unavailable');
    if(!['cashBuffer','monitor'].includes(action.plan))throw new GameActionError('Invalid plan');
    const plans=game.clientPlans?.[action.clientId]??GAME_DAYS.map(()=>'none' as const);
    if(plans[game.day]!=='none')throw new GameActionError('Plan already committed');
    return {...game,clientPlans:{...game.clientPlans,[action.clientId]:plans.map((plan,index)=>index===game.day?action.plan:plan)}};
  }
  if (action.type==='reply') {
    if(action.clientId){
      if(!CLIENT_PROFILES.some(profile=>profile.id===action.clientId)||!portfolioClients(game).find(client=>client.id===action.clientId)?.active)throw new GameActionError('Client unavailable');
      const replies=game.clientReplies?.[action.clientId]??game.replies;
      if(replies[game.day]!=='none')throw new GameActionError('Already answered');
      return {...game,clientReplies:{...game.clientReplies,[action.clientId]:replies.map((reply,i)=>i===game.day?action.answer:reply)}};
    }
    if (game.replies[game.day]!=='none') throw new GameActionError('Already answered');
    return {...game,replies:game.replies.map((reply,i)=>i===game.day?action.answer:reply)};
  }
  if (action.type==='next') {
    if (game.day===GAME_DAYS.length-1) throw new GameActionError('Game ended');
    const next=game.day+1;
    const nextGame={...game,day:next};
    const statuses=portfolioClients(nextGame);
    const clients=statuses.filter(client=>client.active).length;
    return {...nextGame,clients,departures:statuses.filter(client=>!client.active).map(client=>client.leftDay!)};
  }
  if (!Number.isInteger(action.quantity) || action.quantity<=0) throw new GameActionError('Invalid trade');
  const instrument=action.instrument??'NST-F';
  if(!INSTRUMENTS.includes(instrument))throw new GameActionError('Invalid instrument');
  const price=instrumentPrice(game,instrument);
  const position=holding(game,instrument);
  const gross=cents(action.quantity*price);
  if(action.type==='buy'&&gross>game.cash)throw new GameActionError('Insufficient fictional cash');
  if(action.type==='sell'&&action.quantity>position.shares)throw new GameActionError('Insufficient fictional shares');
  const cost=action.type==='sell'?position.basis*action.quantity/position.shares:0;
  const fee=action.type==='sell'?cents(Math.max(0,gross-cost)*GAME_FEE_RATE):0;
  const shares=position.shares+(action.type==='buy'?action.quantity:-action.quantity);
  const basis=action.type==='buy'?cents(position.basis+gross):shares===0?0:cents(position.basis-cost);
  return {...game,cash:cents(game.cash+(action.type==='buy'?-gross:gross-fee)),feeEarned:cents(game.feeEarned+fee),...(instrument==='NST-F'?{shares,basis}:{holdings:{...game.holdings,[instrument]:{shares,basis}}}),trades:[...game.trades,{day:game.day,side:action.type,quantity:action.quantity,price,fee,instrument}]};
}
/** Fictional client mandates. Loss tolerance is a teaching rule, not a real suitability assessment. */
export const CLIENT_PROFILES=[
  {id:'cautious',initialTrust:70,lossTolerance:3},
  {id:'balanced',initialTrust:80,lossTolerance:7},
  {id:'growth',initialTrust:90,lossTolerance:12},
] as const;
export type ClientId=typeof CLIENT_PROFILES[number]['id'];
export interface ClientStatus {id:ClientId;trust:number;active:boolean;leftDay:number|null;reason:'communication'|'risk'|null;}
/** Replays only completed days. Future prices and events never contribute to today's status. */
export function portfolioClients(game:PortfolioGame):ClientStatus[]{
  return CLIENT_PROFILES.map(profile=>{
    let trust:number=profile.initialTrust;
    let cash=INITIAL_CASH;
    const positions:Record<Instrument,number>={'NST-F':0,'HBR-F':0,'BND-F':0};
    for(let day=0;day<game.day+(game.settled?1:0);day++){
      for(const trade of game.trades.filter(trade=>trade.day===day)){
        cash=cents(cash+(trade.side==='buy'?-1:1)*trade.quantity*trade.price-trade.fee);
        positions[trade.instrument??'NST-F']+=trade.side==='buy'?trade.quantity:-trade.quantity;
      }
      const loss=Math.max(0,(INITIAL_CASH-(cash+INSTRUMENTS.reduce((total,instrument)=>total+positions[instrument]*instrumentPrice(game,instrument,day),0)))/INITIAL_CASH*100);
      const reply=clientReply(game,profile.id,day);
      const plan=game.clientPlans?.[profile.id]?.[day]??'none';
      const endValue=cash+INSTRUMENTS.reduce((total,instrument)=>total+positions[instrument]*instrumentPrice(game,instrument,day),0);
      /** Monitor is a commitment to watch and report: explaining earns trust, silence breaks it. Only plan version 2 scores it; earlier saves keep monitor as a label without effect. */
      const planEffect=plan==='cashBuffer'?(endValue>0&&cash/endValue>=.25?6:-18):plan==='monitor'&&game.planVersion===2?(reply==='explained'?4:reply==='none'||reply==='ignored'?-10:0):0;
      trust=Math.min(100,Math.max(0,trust+planEffect+(reply==='explained'?8:reply==='guaranteed'?-35:reply==='ignored'?-22:-12)-(loss>profile.lossTolerance?20:0)));
      if(trust<=30)return {id:profile.id,trust,active:false,leftDay:Math.min(day+1,GAME_DAYS.length-1),reason:loss>profile.lossTolerance?'risk':'communication'};
    }
    return {id:profile.id,trust,active:true,leftDay:null,reason:null};
  });
}
export const clientReply=(game:PortfolioGame,id:ClientId,day:number):ClientReply=>game.clientReplies?.[id]?.[day]??game.replies[day];
/** Personal messages are fixed teaching scripts chosen from the observed game state, not actual mail. */
export function clientMessage(game:PortfolioGame,id:ClientId):{topic:'intro'|'loss'|'trust'|'plan'|'stayed'|'left';loss:number}{
  const status=portfolioClients(game).find(client=>client.id===id)!;
  const loss=cents(Math.max(0,(INITIAL_CASH-portfolioValue(game))/INITIAL_CASH*100));
  if(!status.active)return {topic:'left',loss};
  if(game.settled)return {topic:'stayed',loss};
  if(game.day===0)return {topic:'intro',loss};
  if(loss>CLIENT_PROFILES.find(profile=>profile.id===id)!.lossTolerance)return {topic:'loss',loss};
  if(status.trust<60)return {topic:'trust',loss};
  return {topic:'plan',loss};
}
/** Deterministic educational result. Fees are per positive sale, not a net-profit/high-water-mark contract. */
export function portfolioResult(game:PortfolioGame){
  if(!game.settled)throw new GameActionError('Settle before debrief');
  const finalValue=portfolioValue(game);
  const netChange=cents(finalValue-INITIAL_CASH);
  let cash=INITIAL_CASH;const positions:Record<Instrument,number>={'NST-F':0,'HBR-F':0,'BND-F':0};let peak=INITIAL_CASH;let maxDrawdown=0;
  const values=GAME_DAYS.map((_,index)=>{
    for(const trade of game.trades.filter(trade=>trade.day===index)){
      cash=cents(cash+(trade.side==='buy'?-1:1)*trade.quantity*trade.price-trade.fee);
      positions[trade.instrument??'NST-F']+=trade.side==='buy'?trade.quantity:-trade.quantity;
    }
    const value=cents(cash+INSTRUMENTS.reduce((total,instrument)=>total+positions[instrument]*instrumentPrice(game,instrument,index),0));
    peak=Math.max(peak,value);maxDrawdown=Math.max(maxDrawdown,(peak-value)/peak*100);
    return value;
  });
  const clients=portfolioClients(game);
  return {finalValue,netChange,netReturn:cents(netChange/INITIAL_CASH*100),grossChange:cents(netChange+game.feeEarned),managerFee:game.feeEarned,maxDrawdown:cents(maxDrawdown),values,clients,targetReached:finalValue>=GAME_TARGET,retained:clients.filter(client=>client.active).length,unanswered:CLIENT_PROFILES.flatMap(profile=>GAME_DAYS.map((_,day)=>clientReply(game,profile.id,day))).filter(reply=>reply==='none'||reply==='ignored').length,guarantees:CLIENT_PROFILES.flatMap(profile=>GAME_DAYS.map((_,day)=>clientReply(game,profile.id,day))).filter(reply=>reply==='guaranteed').length};
}
export function readPortfolioGame():PortfolioGame|null {
  try {const raw=localStorage.getItem(GAME_KEY);const value=raw?JSON.parse(raw):null;return isPortfolioGame(value)?value:null;}catch{return null;}
}
export class GameConflictError extends Error {}
export function savePortfolioGame(next:PortfolioGame,expected:PortfolioGame|null):void {
  if (!isPortfolioGame(next)) throw new GameActionError('Invalid game');
  if (JSON.stringify(readPortfolioGame())!==JSON.stringify(expected)) throw new GameConflictError('Game changed in another tab');
  localStorage.setItem(GAME_KEY,JSON.stringify(next));
}
