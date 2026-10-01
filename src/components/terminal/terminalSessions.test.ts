// @vitest-environment jsdom
import {beforeEach,expect,it} from "vitest";
import {loadSessions,saveSessions,closeSession,moveSession,SESSION_KEY} from "./terminalSessions";
beforeEach(()=>localStorage.clear());
it("starts with an honest home shortcut when storage is corrupt",()=>{localStorage.setItem(SESSION_KEY,'bad');expect(loadSessions().tabs[0].path).toBe('/');});
it("rejects unsafe stored paths",()=>{localStorage.setItem(SESSION_KEY,JSON.stringify({tabs:[{id:'bad',path:'https://attacker.invalid'}]}));expect(loadSessions().tabs[0].path).toBe('/');});
it("persists presentation session order, names and pins",()=>{const state={tabs:[{id:'a',path:'/research',name:'Desk',pinned:true},{id:'b',path:'/markets'}],closed:[]};saveSessions(state);expect(loadSessions()).toEqual(state);expect(moveSession(state,'b',-1).tabs[0].id).toBe('b');});
it("protects pins and stores the last closed shortcut",()=>{const state={tabs:[{id:'a',path:'/',pinned:true},{id:'b',path:'/markets'}],closed:[]};expect(closeSession(state,'a')).toBe(state);expect(closeSession(state,'b').closed[0].path).toBe('/markets');});
it("bounds restore history and handles invalid moves",()=>{const state={tabs:[{id:'a',path:'/research'}],closed:Array.from({length:10},(_,i)=>({id:String(i),path:'/markets'}))};expect(closeSession(state,'a').closed).toHaveLength(10);expect(moveSession(state,'a',-1)).toBe(state);});
