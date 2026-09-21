import { Microscope } from "lucide-react";
import { Layout, DisclaimerBanner } from "@/components/layout/Layout";
import { AssetResearchView } from "@/components/assetResearch/AssetResearchView";
import { useLanguage } from "@/context/languageContext";
export default function AssetResearchPage() { const { t } = useLanguage(); return <Layout><section className="container max-w-6xl py-8 md:py-12"><div className="mb-8"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary"><Microscope className="h-4 w-4" />{t("research_tag")}</div><h1 className="text-3xl font-extrabold sm:text-4xl">{t("research_title")}</h1><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{t("research_subtitle")}</p></div><AssetResearchView/><DisclaimerBanner className="mt-8" /></section></Layout>; }
