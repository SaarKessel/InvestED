import { Link } from "react-router-dom";
import { Calculator, FlaskConical, Microscope, MessageSquare, UserRound, GraduationCap } from "lucide-react";
import { useLanguage } from "@/context/languageContext";
const items = [
 { href:"/chat", key:"hub_copilot", icon:MessageSquare }, { href:"/research", key:"hub_research", icon:Microscope },
 { href:"/strategy-lab", key:"hub_strategies", icon:FlaskConical }, { href:"/calculator", key:"hub_calculator", icon:Calculator },
 { href:"#profile", key:"hub_profile", icon:UserRound }, { href:"#learning", key:"hub_learning", icon:GraduationCap },
];
export function DashboardProductNav(){ const {t}=useLanguage(); return <nav aria-label={t("hub_nav_label")} className="dashboard-command-grid mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{items.map(({href,key,icon:Icon})=>href.startsWith("/")?<Link key={key} to={href} className="dashboard-command-tile group relative flex min-h-24 flex-col items-start justify-center gap-3 overflow-hidden rounded-2xl border border-primary/20 bg-card px-4 py-3 text-start text-xs font-bold transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"><Icon className="h-5 w-5 text-primary" aria-hidden="true"/></span>{t(key)}</Link>:<a key={key} href={href} className="dashboard-command-tile group relative flex min-h-24 flex-col items-start justify-center gap-3 overflow-hidden rounded-2xl border border-primary/20 bg-card px-4 py-3 text-start text-xs font-bold transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"><Icon className="h-5 w-5 text-primary" aria-hidden="true"/></span>{t(key)}</a>)}</nav> }
export function DashboardUnavailableModules(){ const {t}=useLanguage(); return <section className="grid gap-4 md:grid-cols-3" aria-label={t("hub_future_modules")}>
 {(["hub_watchlist","hub_news","hub_alerts"] as const).map(key=><div key={key} className="rounded-2xl border border-dashed border-border bg-muted/30 p-5"><h3 className="font-bold">{t(key)}</h3><p className="mt-2 text-sm text-muted-foreground">{t("hub_not_configured")}</p></div>)}
 </section> }
