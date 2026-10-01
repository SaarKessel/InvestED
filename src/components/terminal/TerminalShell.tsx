import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, BookOpen, BriefcaseBusiness, Calculator, ChevronLeft, ChevronRight, Globe, LayoutDashboard, Menu, Moon, Newspaper, Search, Settings, Sun, X } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/useAuth";
import { Logo } from "@/components/layout/Logo";
import { TickerStrip } from "@/components/layout/TickerStrip";
import { NewsPopup } from "@/components/layout/NewsPopup";
import { ChatToolPanel } from "@/components/dashboard/ChatToolPanel";
import { toolForPath } from "@/components/dashboard/chatTools";
import { Panel, StatusIndicator, type Density } from "@/components/ui/terminal";
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
  const {pathname}=useLocation(); const navigate=useNavigate();
  const [compact,setCompact]=useState(false); const [mobileNav,setMobileNav]=useState(false);
  const [density,setDensity]=useState<Density>("compact");
  const [tabs,setTabs]=useState<string[]>(["/"]);
  useEffect(()=>{setTabs(current=>current.includes(pathname)?current:[...current,pathname]);setMobileNav(false);},[pathname]);
  const closeTab=(path:string)=>{const next=tabs.filter(item=>item!==path);setTabs(next.length?next:["/"]);if(pathname===path)navigate(next.at(-1)??"/");};
  const focusAI=()=>document.querySelector<HTMLTextAreaElement>(".terminal-copilot textarea")?.focus();
  return <div className={`terminal-shell ${compact?"terminal-shell-compact":""}`} data-density={density} dir={he?"rtl":"ltr"}>
    <header className="terminal-topbar">
      <button type="button" className="terminal-icon terminal-mobile-menu" onClick={()=>setMobileNav(!mobileNav)} aria-expanded={mobileNav} aria-label={he?"ניווט":"Navigation"}><Menu size={18}/></button>
      <Link to="/" aria-label="InvestED+"><Logo /></Link>
      <button type="button" className="terminal-search" onClick={focusAI}><Search size={15}/><span>{he?"שאלו, חפשו או פתחו סביבת עבודה":"Ask, search or open a workspace"}</span><kbd>/</kbd></button>
      <div className="terminal-top-actions"><Tooltip label={he?"שפה":"Language"}><button className="terminal-icon" onClick={toggleLanguage} aria-label={he?t("nav_lang_en_label"):t("nav_lang_he_label")}><Globe size={16}/><span>{he?"EN":"HE"}</span></button></Tooltip><button className="terminal-icon" onClick={toggleTheme} aria-label={t("nav_switch_theme")}>{theme==="dark"?<Sun size={17}/>:<Moon size={17}/>}</button><span className="terminal-user" title={user?.email}>{user?.email?.split("@")[0]}</span></div>
    </header>
    <aside className={`terminal-navigation ${mobileNav?"is-open":""}`} aria-label={he?"ניווט ראשי":"Primary navigation"}>
      <div className="terminal-nav-caption"><span>{he?"סביבת העבודה":"WORKSTATION"}</span><button className="terminal-icon" onClick={()=>setCompact(!compact)} aria-label={he?"צמצום או הרחבת ניווט":"Collapse or expand navigation"}>{compact?<ChevronRight size={16}/>:<ChevronLeft size={16}/>}</button></div>
      <nav>{navigation.map(group=><div key={group.group[0]} className="terminal-nav-group"><h2>{group.group[l]}</h2>{group.items.map(item=><Tooltip key={item.path} label={item.label[l]}><Link className="terminal-nav-link" to={item.path} aria-current={pathname===item.path?"page":undefined} aria-label={item.label[l]}><item.icon size={17} aria-hidden="true"/><span>{item.label[l]}</span></Link></Tooltip>)}</div>)}</nav>
      <div className="terminal-nav-foot"><label htmlFor="terminal-density">{he?"צפיפות תצוגה":"Display density"}</label><select id="terminal-density" value={density} onChange={event=>setDensity(event.target.value as Density)}><option value="comfortable">{he?"מרווחת":"Comfortable"}</option><option value="compact">{he?"קומפקטית":"Compact"}</option><option value="terminal">{he?"טרמינל":"Terminal"}</option></select></div>
    </aside>
    <div className="terminal-workspace-column">
      <div className="terminal-session-tabs" role="tablist" aria-label={he?"סביבות עבודה":"Workspaces"}>{tabs.map(path=><div key={path} className="terminal-session" data-active={pathname===path}><button role="tab" aria-selected={pathname===path} onClick={()=>navigate(path)}>{workspaceName(path,t,he)}</button>{path!=="/"&&<button className="terminal-tab-close" onClick={()=>closeTab(path)} aria-label={`${he?"סגירה":"Close"} ${workspaceName(path,t,he)}`}><X size={12}/></button>}</div>)}</div>
      <main className="terminal-workspace" aria-label={workspaceName(pathname,t,he)}>{toolForPath(pathname)?<ChatToolPanel />:<IntelligenceHome onFocusAI={focusAI}/>}</main>
    </div>
    <aside className="terminal-copilot" aria-label={he?"עוזר פיננסי":"Financial copilot"}>
      <div className="terminal-copilot-heading"><strong>INVESTED+</strong><span>{he?"עוזר פיננסי":"FINANCIAL COPILOT"}</span></div>
      <div className="terminal-context"><span>{he?"הקשר פעיל":"ACTIVE CONTEXT"}</span><strong>{workspaceName(pathname,t,he)}</strong><p>{he?"השיחה זמינה לצד סביבת העבודה. עיבוד השאלות הקיים נשמר.":"Conversation stays beside your workspace. Existing question processing is preserved."}</p></div>
      <div className="terminal-conversation">{children}</div>
    </aside>
    <footer className="terminal-bottom"><div className="terminal-system-note"><StatusIndicator state="recent" label={he?"מצב הנתונים מוצג בכל תוצאה":"Data status shown per result"}/><span>{he?"לימוד בלבד, לא ייעוץ השקעות":"Education only, not investment advice"}</span></div><TickerStrip /></footer>
    <NewsPopup />
  </div>;
}
function IntelligenceHome({onFocusAI}:{onFocusAI:()=>void}) {
  const {language}=useLanguage(); const he=language==="he";
  return <div className="terminal-home"><div className="terminal-home-heading"><span className="terminal-eyebrow">INVESTED / INTELLIGENCE</span><h1>{he?"מודיעין פיננסי. סביבת עבודה אחת.":"Financial intelligence. One workspace."}</h1><p>{he?"התחילו בשאלה או פתחו כלי מחקר. הנתונים, החישובים והמקורות נשארים גלויים.":"Start with a question or open a research tool. Data, calculations and sources stay visible."}</p><button onClick={onFocusAI} className="terminal-primary">{he?"שאלו את InvestED+":"Ask InvestED+"}</button></div><Panel title={he?"פתיחת סביבת עבודה":"Open a workspace"}><div className="terminal-launch-grid">{navigation.slice(1,4).flatMap(group=>group.items).map(item=><Link key={item.path} to={item.path} className="terminal-launch"><item.icon size={20}/><strong>{item.label[he?1:0]}</strong><span>{he?"פתיחה":"Open"} →</span></Link>)}</div></Panel><Panel title={he?"בהירות לפני החלטות":"Clarity before decisions"}><p className="terminal-home-note">{he?"נתוני שוק מגיעים ממקורות חיצוניים ועשויים להתעכב. חישובים מבוססים על הנחות גלויות. סימולציות הן תרגול, לא תחזית.":"Market data comes from external sources and may be delayed. Calculations use visible assumptions. Simulations are practice, not forecasts."}</p></Panel></div>;
}
