import {useState} from "react";
import {Search,ArrowUpRight} from "lucide-react";
import {CHAT_TOOLS} from "@/components/dashboard/chatTools";
import {useAuth} from "@/context/useAuth";
import {useLanguage} from "@/context/languageContext";
import {TerminalDialog} from "./TerminalDialog";
import {globalSearch} from "@/lib/search/globalSearch";
import {loadSaved} from "@/lib/copilot/savedAnswers";
export function CommandCenter({onClose,onOpen,onAsk}:{onClose:()=>void;onOpen:(path:string,symbol?:string)=>void;onAsk:(text?:string)=>void}) {
 const {user}=useAuth();const {language,t}=useLanguage();const he=language==='he';const [query,setQuery]=useState('');const [active,setActive]=useState(0);
 const items=CHAT_TOOLS.filter(tool=>[tool.path,t(tool.labelKey)].join(' ').toLowerCase().includes(query.toLowerCase())).slice(0,20);
 const found=globalSearch(query,{lang:he?'he':'en',saved:user?loadSaved(user.id):[],limit:6}).filter(hit=>!(hit.route&&items.some(tool=>tool.path===hit.route)));const symbol=query.trim().toUpperCase();const asset=/^[A-Z][A-Z0-9.^=-]{0,14}$/.test(symbol);
 const commands=[...(asset?[{label:`${he?'מחקר נכס':'Research asset'}: ${symbol}`,run:()=>onOpen('/research',symbol)}]:[]),...items.map(tool=>({label:t(tool.labelKey),run:()=>onOpen(tool.path)})),...found.map(hit=>({label:`${hit.kind==='concept'?(he?'מושג':'Concept'):hit.kind==='page'?(he?'עמוד':'Page'):(he?'שמור':'Saved')}: ${hit.label}`,run:()=>hit.route?onOpen(hit.route):onAsk(hit.ask)})),{label:he?'שאלו את InvestED+':'Ask InvestED+',run:()=>onAsk()}];
 return <TerminalDialog title={he?'מרכז פקודות':'Command center'} onClose={onClose}><div className="terminal-command-input"><Search size={18}/><input aria-label={he?'חיפוש או פקודה':'Search or command'} placeholder={he?'חפשו סביבת עבודה או הקלידו סימול נכס':'Find a workspace or type an asset symbol'} value={query} onChange={event=>{setQuery(event.target.value);setActive(0);}} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();setActive(current=>(current+1)%commands.length);}if(event.key==='ArrowUp'){event.preventDefault();setActive(current=>(current-1+commands.length)%commands.length);}if(event.key==='Enter'){event.preventDefault();commands[active]?.run();onClose();}}}/></div><p className="terminal-command-hint">{he?'פתיחת הכלים הקיימים. חיפוש תוכן ושאלות דרך העוזר.':'Open existing tools. Search content and ask questions through the copilot.'}</p><div className="terminal-command-list">{commands.map((command,index)=><button key={command.label} className="terminal-command-item" data-active={index===active} onClick={()=>{command.run();onClose();}}><span>{command.label}</span><ArrowUpRight size={15}/></button>)}</div><footer><kbd>↑ ↓</kbd> {he?'בחירה':'Select'} <kbd>Enter</kbd> {he?'פתיחה':'Open'} <kbd>Esc</kbd> {he?'סגירה':'Close'}</footer></TerminalDialog>;
}
