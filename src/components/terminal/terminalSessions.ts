export interface TerminalSession { id:string; path:string; name?:string; pinned?:boolean }
export interface SessionState { tabs:TerminalSession[]; closed:TerminalSession[] }
export const SESSION_KEY="invested-terminal-sessions-v1";
const home:TerminalSession={id:"home",path:"/",pinned:true};
export function loadSessions():SessionState {
  try { const value=JSON.parse(localStorage.getItem(SESSION_KEY)??"null");
    const valid=(tab:unknown):tab is TerminalSession=>!!tab&&typeof tab==="object"&&typeof (tab as TerminalSession).id==="string"&&typeof (tab as TerminalSession).path==="string"&&((tab as TerminalSession).path==="/"||/^\/[a-z-]+(?:\/[a-z-]+)?$/.test((tab as TerminalSession).path));
    if(Array.isArray(value?.tabs)&&value.tabs.every(valid))return {tabs:value.tabs.length?value.tabs.slice(0,30):[home],closed:Array.isArray(value.closed)?value.closed.filter(valid).slice(-10):[]};
  } catch { /* Corrupt or blocked browser storage must not prevent access. */ }
  return {tabs:[home],closed:[]};
}
export function saveSessions(state:SessionState) {try {localStorage.setItem(SESSION_KEY,JSON.stringify(state));}catch{/* Private mode or quota. */}}
export function closeSession(state:SessionState,id:string):SessionState {const tab=state.tabs.find(tab=>tab.id===id);if(!tab||tab.pinned)return state;return {tabs:state.tabs.filter(tab=>tab.id!==id),closed:[...state.closed,tab].slice(-10)};}
export function moveSession(state:SessionState,id:string,delta:number):SessionState {const tabs=[...state.tabs];const index=tabs.findIndex(tab=>tab.id===id);const target=index+delta;if(index<0||target<0||target>=tabs.length)return state;[tabs[index],tabs[target]]=[tabs[target],tabs[index]];return {...state,tabs};}
