import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, BookOpen, BriefcaseBusiness, Calculator, ChevronLeft, ChevronRight, Globe, LayoutDashboard, Menu, Moon, Newspaper, Search, Settings, Sun, X, MoreHorizontal, Pin, RotateCcw } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/useAuth";
import { Logo } from "@/components/layout/Logo";
import { TickerStrip } from "@/components/layout/TickerStrip";
import { NewsPopup } from "@/components/layout/NewsPopup";
import { ChatToolPanel } from "@/components/dashboard/ChatToolPanel";
import { toolForPath } from "@/components/dashboard/chatTools";
import { Panel, StatusIndicator, type Density } from "@/components/ui/terminal";
import { CommandCenter } from "./CommandCenter";
import { TerminalDialog } from "./TerminalDialog";
import {loadSessions,saveSessions,closeSession,moveSession,type TerminalSession} from "./terminalSessions";
import { Tooltip } from "@/components/ui/interactive";

const navigation = [
  { group: ["Intelligence", "מודיעין"], items: [{path:"/", label:["InvestED+", "InvestED+"], icon:Activity}, {path:"/dashboard",label:["Portfolio intelligence","מודיעין תיק השקעות"],icon:LayoutDashboard}] },
  { group:["Markets","שווקים"], items:[{path:"/markets",label:["Markets & watchlist","שווקים ומעקב"],icon:LayoutDashboard},{path:"/research",label:["Asset research","מחקר נכסים"],icon:Activity},{path:"/news",label:["Market news","חדשות שוק"],icon:Newspaper},{path:"/strategy-lab",label:["Strategy lab","מעבדת אסטרטגיות"],icon:LayoutDashboard}] },
  { group:["Career","קריירה"], items:[{path:"/career-lab",label:["Career lab","מעבדת קריירה"],icon:BriefcaseBusiness},{path:"/simulation",label:["Simulation","סימולציה"],icon:Activity}] },
  { group:["University","אוניברסיטה"], items:[{path:"/learn",label:["Learning","למידה"],icon:BookOpen},{path:"/trivia",label:["Knowledge practice","תרגול ידע"],icon:BookOpen},{path:"/calculator",label:["Financial calculator","מחשבון פיננסי"],icon:Calculator}] },
  { group:["Personal","אישי"], items:[{path:"/start",label:["Investor profile","פרופיל משקיע"],icon:BriefcaseBusiness},{path:"/data-controls",label:["Data controls","בקרת נתונים"],icon:Settings}] },
];
function workspaceName(path:string, t:(key:string)=>string, he:boolean) { const hit=toolForPath(path); return hit?.tool ? t(hit.tool.labelKey) : he ? "מרכז מודיעין" : "Intelligence"; }

export function TerminalShell({ children }: { children: ReactNode }) {
  const {language,t}=useLanguage(); const he=language==="he"; const l=he?1:0;
  const {theme,toggleTheme}=useTheme(); const {toggleLanguage}=useLanguage(); const {user}=useAuth();
  const {pathname,state:routeState}=useLocation(); const navigate=useNavigate();
  const [compact,setCompact]=useState(false); const [mobileNav,setMobileNav]=useState(false);
  const [density,setDensity]=useState<Density>("compact");
  const [sessions,setSessions]=useState(loadSessions);
  const [activeId,setActiveId]=useState("");
  const [command,setCommand]=useState(false);
  const [editing,setEditing]=useState<string|null>(null);
  const [name,setName]=useState("");
  const [copilotWidth,setCopilotWidth]=useState(380);
  const [dock,setDock]=useState(false);
  useEffect(()=>saveSessions(sessions),[sessions]);
  useEffect(()=>{setSessions(current=>{if((pathname!=="/"&&!toolForPath(pathname))||current.tabs.some(tab=>tab.path===pathname))return current;return {...current,tabs:[...current.tabs,{id:crypto.randomUUID(),path:pathname}]};});setMobileNav(false);},[pathname]);
  const active=sessions.tabs.find(tab=>tab.id===activeId&&tab.path===pathname)??sessions.tabs.find(tab=>tab.path===pathname);
  const label=(tab:TerminalSession)=>tab.name||workspaceName(tab.path,t,he);
  const closeTab=(tab:TerminalSession)=>{const next=closeSession(sessions,tab.id);setSessions(next);if(active?.id===tab.id){const target=next.tabs.at(-1);setActiveId(target?.id??"");navigate(target?.path??"/");}};
  const focusAI=()=>{requestAnimationFrame(()=>document.querySelector<HTMLTextAreaElement>(".terminal-copilot textarea")?.focus());};
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setCommand(value=>!value);}else if((event.ctrlKey||event.metaKey)&&event.key==="/"){event.preventDefault();focusAI();}};window.addEventListener('keydown',handler);return ()=>window.removeEventListener('keydown',handler);},[]);
  const restore=()=>{const tab=sessions.closed.at(-1);if(tab){setSessions(current=>({tabs:[...current.tabs,tab],closed:current.closed.slice(0,-1)}));setActiveId(tab.id);navigate(tab.path);}};
  return <div className={`terminal-shell ${compact?"terminal-shell-compact":""} ${dock?"terminal-dock-bottom":""}`} style={{"--terminal-copilot":`${copilotWidth}px`} as CSSProperties} data-density={density} dir={he?"rtl":"ltr"}>
    <header className="terminal-topbar">
      <button type="button" className="terminal-icon terminal-mobile-menu" onClick={()=>setMobileNav(!mobileNav)} aria-expanded={mobileNav} aria-label={he?"ניווט":"Navigation"}><Menu size={18}/></button>
      <Link to="/" aria-label="InvestED+"><Logo /></Link>
      <button type="button" className="terminal-search" onClick={()=>setCommand(true)}><Search size={15}/><span>{he?"שאלו, חפשו או פתחו סביבת עבודה":"Ask, search or open a workspace"}</span><kbd>⌘ / Ctrl K</kbd></button>
      <div className="terminal-top-actions"><Tooltip label={he?"שפה":"Language"}><button className="terminal-icon" onClick={toggleLanguage} aria-label={he?t("nav_lang_en_label"):t("nav_lang_he_label")}><Globe size={16}/><span>{he?"EN":"HE"}</span></button></Tooltip><button className="terminal-icon" onClick={toggleTheme} aria-label={t("nav_switch_theme")}>{theme==="dark"?<Sun size={17}/>:<Moon size={17}/>}</button><span className="terminal-user" title={user?.email}>{user?.email?.split("@")[0]}</span></div>
    </header>
    <aside className={`terminal-navigation ${mobileNav?"is-open":""}`} aria-label={he?"ניווט ראשי":"Primary navigation"}>
      <div className="terminal-nav-caption"><span>{he?"סביבת העבודה":"WORKSTATION"}</span><button className="terminal-icon" onClick={()=>setCompact(!compact)} aria-label={he?"צמצום או הרחבת ניווט":"Collapse or expand navigation"}>{compact?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}</button></div>
      <nav>{navigation.map(group=><div key={group.group[0]} className="terminal-nav-group"><h2>{group.group[l]}</h2>{group.items.map(item=><Tooltip key={item.path} label={item.label[l]}><Link className="terminal-nav-link" to={item.path} aria-current={pathname===item.path?"page":undefined} aria-label={item.label[l]}><item.icon size={17} aria-hidden="true"/><span>{item.label[l]}</span></Link></Tooltip>)}</div>)}</nav>
      <div className="terminal-nav-foot"><label htmlFor="terminal-density">{he?"צפיפות תצוגה":"Display density"}</label><select id="terminal-density" value={density} onChange={event=>setDensity(event.target.value as Density)}><option value="comfortable">{he?"מרווחת":"Comfortable"}</option><option value="compact">{he?"קומפקטית":"Compact"}</option><option value="terminal">{he?"טרמינל":"Terminal"}</option></select></div>
    </aside>
    <div className="terminal-workspace-column">
      <div className="terminal-session-rail"><div className="terminal-session-tabs" role="tablist" aria-label={he?"סביבות עבודה":"Workspaces"}>{sessions.tabs.map(tab=><div key={tab.id} className="terminal-session" data-active={active?.id===tab.id}><button role="tab" aria-selected={active?.id===tab.id} onClick={()=>{setActiveId(tab.id);navigate(tab.path);}}>{tab.pinned&&<Pin size={11}/>} {label(tab)}</button><button className="terminal-tab-close" onClick={()=>{setEditing(tab.id);setName(tab.name??"");}} aria-label={`${he?"אפשרויות":"Options"} ${label(tab)}`}><MoreHorizontal size={14}/></button>{!tab.pinned&&<button className="terminal-tab-close" onClick={()=>closeTab(tab)} aria-label={`${he?"סגירה":"Close"} ${label(tab)}`}><X size={12}/></button>}</div>)}</div><button className="terminal-icon" disabled={!sessions.closed.length} onClick={restore} aria-label={he?"שחזור סביבת העבודה האחרונה":"Restore last workspace"}><RotateCcw size={14}/></button></div>
      <main className="terminal-workspace" aria-label={workspaceName(pathname,t,he)}>{toolForPath(pathname)?<ChatToolPanel key={`${pathname}:${(routeState as {symbol?:string}|null)?.symbol??""}`} />:<IntelligenceHome onFocusAI={focusAI}/>}</main>
    </div>
    <aside className="terminal-copilot" aria-label={he?"עוזר פיננסי":"Financial copilot"}>
      <div className="terminal-copilot-heading"><strong>INVESTED+</strong><button className="terminal-control terminal-dock-toggle" onClick={()=>setDock(value=>!value)}>{dock?(he?"לצד הכלי":"Dock beside"):(he?"מתחת לכלי":"Dock below")}</button></div><label className="terminal-resize-control">{he?"רוחב העוזר":"Copilot width"}<input aria-label={he?"רוחב העוזר":"Copilot width"} type="range" min="300" max="520" step="20" value={copilotWidth} onChange={event=>setCopilotWidth(Number(event.target.value))}/></label>
      <div className="terminal-context"><span>{he?"הקשר פעיל":"ACTIVE CONTEXT"}</span><strong>{workspaceName(pathname,t,he)}</strong><p>{he?"השיחה זמינה לצד סביבת העבודה. עיבוד השאלות הקיים נשמר.":"Conversation stays beside your workspace. Existing question processing is preserved."}</p></div>
      <div className="terminal-conversation">{children}</div>
    </aside>
    <footer className="terminal-bottom"><div className="terminal-system-note"><StatusIndicator state="recent" label={he?"מצב הנתונים מוצג בכל תוצאה":"Data status shown per result"}/><span>{he?"לימוד בלבד, לא ייעוץ השקעות":"Education only, not investment advice"}</span></div><TickerStrip /></footer>
    {command&&<CommandCenter onClose={()=>setCommand(false)} onOpen={(path,symbol)=>navigate(path,{state:symbol?{symbol}:undefined})} onAsk={focusAI}/>}
    {editing&&<TerminalDialog title={he?"אפשרויות סביבת עבודה":"Workspace options"} onClose={()=>setEditing(null)}><form className="terminal-session-options" onSubmit={event=>{event.preventDefault();setSessions(current=>({...current,tabs:current.tabs.map(tab=>tab.id===editing?{...tab,name:name.trim().slice(0,60)||undefined}:tab)}));setEditing(null);}}><label>{he?"שם":"Name"}<input value={name} maxLength={60} onChange={event=>setName(event.target.value)} placeholder={he?"שם ברירת מחדל":"Default name"}/></label><button className="terminal-control" type="submit">{he?"שמירת שם":"Save name"}</button><button type="button" className="terminal-control" onClick={()=>setSessions(current=>({...current,tabs:current.tabs.map(tab=>tab.id===editing?{...tab,pinned:!tab.pinned}:tab)}))}>{sessions.tabs.find(tab=>tab.id===editing)?.pinned?(he?"ביטול נעיצה":"Unpin"):(he?"נעיצה":"Pin")}</button><button type="button" className="terminal-control" onClick={()=>{const tab=sessions.tabs.find(tab=>tab.id===editing)!;const copy={...tab,id:crypto.randomUUID(),pinned:false};setSessions(current=>({...current,tabs:[...current.tabs,copy]}));setActiveId(copy.id);navigate(copy.path);setEditing(null);}}>{he?"שכפול קיצור דרך":"Duplicate shortcut"}</button><button type="button" className="terminal-control" onClick={()=>setSessions(current=>moveSession(current,editing,-1))}>{he?"הזזה מוקדם יותר":"Move earlier"}</button><button type="button" className="terminal-control" onClick={()=>setSessions(current=>moveSession(current,editing,1))}>{he?"הזזה מאוחר יותר":"Move later"}</button><p>{he?"נשמרים קיצורי הדרך והסדר במכשיר זה. שכפול אינו מעתיק נתונים או טפסים שלא נשמרו.":"Shortcuts and order are saved on this device. Duplicate does not copy data or unsaved forms."}</p></form></TerminalDialog>}
    <NewsPopup />
  </div>;
}
function IntelligenceHome({onFocusAI}:{onFocusAI:()=>void}) {
  const {language}=useLanguage(); const he=language==="he";
  return <div className="terminal-home"><div className="terminal-home-heading"><span className="terminal-eyebrow">INVESTED / INTELLIGENCE</span><h1>{he?"מודיעין פיננסי. סביבת עבודה אחת.":"Financial intelligence. One workspace."}</h1><p>{he?"התחילו בשאלה או פתחו כלי מחקר. הנתונים, החישובים והמקורות נשארים גלויים.":"Start with a question or open a research tool. Data, calculations and sources stay visible."}</p><button onClick={onFocusAI} className="terminal-primary">{he?"שאלו את InvestED+":"Ask InvestED+"}</button></div><Panel title={he?"פתיחת סביבת עבודה":"Open a workspace"}><div className="terminal-launch-grid">{navigation.slice(1,4).flatMap(group=>group.items).map(item=><Link key={item.path} to={item.path} className="terminal-launch"><item.icon size={20}/><strong>{item.label[he?1:0]}</strong><span>{he?"פתיחה":"Open"} →</span></Link>)}</div></Panel><Panel title={he?"בהירות לפני החלטות":"Clarity before decisions"}><p className="terminal-home-note">{he?"נתוני שוק מגיעים ממקורות חיצוניים ועשויים להתעכב. חישובים מבוססים על הנחות גלויות. סימולציות הן תרגול, לא תחזית.":"Market data comes from external sources and may be delayed. Calculations use visible assumptions. Simulations are practice, not forecasts."}</p></Panel></div>;
}
