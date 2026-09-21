export type MemoryScope="preferences"|"financial_profile"|"watchlist"|"saved_research"|"strategy_preferences"|"conversation_history"|"ai_memory";
export interface UserAccount { id:string; displayName:string; createdAt:string }
export interface MemoryRecord<T=unknown>{id:string;userId:string;scope:MemoryScope;value:T;createdAt:string;updatedAt:string}
export interface UserMemoryStore { list<T>(userId:string,scope?:MemoryScope):MemoryRecord<T>[]; put<T>(record:MemoryRecord<T>):void; remove(userId:string,id:string):void; clear(userId:string,scope?:MemoryScope):void }
const KEY="invested_user_memory_v1";
function parse(storage:Storage):MemoryRecord[]{try{const v=JSON.parse(storage.getItem(KEY)??"[]");return Array.isArray(v)?v:[]}catch{return[]}}
export function createLocalUserMemory(storage:Storage):UserMemoryStore{return{list:(userId,scope)=>parse(storage).filter(r=>r.userId===userId&&(!scope||r.scope===scope)) as MemoryRecord<T>[],put:(record)=>{const all=parse(storage).filter(r=>!(r.userId===record.userId&&r.id===record.id));storage.setItem(KEY,JSON.stringify([...all,record]))},remove:(userId,id)=>storage.setItem(KEY,JSON.stringify(parse(storage).filter(r=>!(r.userId===userId&&r.id===id)))),clear:(userId,scope)=>storage.setItem(KEY,JSON.stringify(parse(storage).filter(r=>r.userId!==userId||(scope&&r.scope!==scope))))}}
export function exportUserMemory(store:UserMemoryStore,userId:string){return JSON.stringify({version:1,userId,exportedAt:new Date().toISOString(),records:store.list(userId)},null,2)}
export function assertAuthorized(account:UserAccount|null,userId:string){if(!account||account.id!==userId)throw new Error("authorization_denied")}
