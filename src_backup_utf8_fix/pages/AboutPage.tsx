import { motion } from "framer-motion";
import {
  GraduationCap,
  Sparkles,
  Code2,
  LineChart,
  Palette,
  Linkedin,
  Layers,
  Cpu,
  Cloud,
  Paintbrush,
  BarChart3,
  Briefcase,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/primitives";

const PILLARS = [
  { icon: Sparkles, label: "Artificial Intelligence" },
  { icon: GraduationCap, label: "Financial Education" },
  { icon: LineChart, label: "Data Visualization" },
  { icon: Palette, label: "Product Thinking" },
  { icon: Code2, label: "Full Stack Development" },
];

const TECH_STACK = [
  {
    icon: Layers,
    title: "Frontend",
    items: ["React 18", "TypeScript", "Vite", "React Router"],
    desc: "׳׳¨׳›׳™׳˜׳§׳˜׳× ׳§׳•׳׳₪׳•׳ ׳ ׳˜׳•׳× ׳׳•׳“׳•׳׳¨׳™׳× ׳•׳˜׳™׳₪׳•׳¡׳™׳ ׳׳׳׳™׳ (Type Safety) ׳׳׳•׳¨׳ ׳›׳ ׳”׳׳₪׳׳™׳§׳¦׳™׳”.",
  },
  {
    icon: Paintbrush,
    title: "׳¢׳™׳¦׳•׳‘ ׳•-UI",
    items: ["Tailwind CSS", "Design System ׳׳•׳×׳׳ ׳׳™׳©׳™׳×", "Framer Motion", "Lucide Icons"],
    desc: "׳׳¢׳¨׳›׳× ׳¢׳™׳¦׳•׳‘ ׳¢׳§׳‘׳™׳× ׳¢׳ Design Tokens, ׳׳¦׳‘ ׳‘׳”׳™׳¨/׳›׳”׳”, ׳•׳׳ ׳™׳׳¦׳™׳•׳× ׳¢׳“׳™׳ ׳•׳× ׳©׳׳›׳•׳•׳ ׳•׳× ׳×׳©׳•׳׳× ׳׳‘ ׳‘׳׳™ ׳׳”׳¡׳™׳— ׳׳× ׳”׳“׳¢׳×.",
  },
  {
    icon: BarChart3,
    title: "׳•׳™׳–׳•׳׳׳™׳–׳¦׳™׳” ׳©׳ ׳ ׳×׳•׳ ׳™׳",
    items: ["Recharts", "׳’׳¨׳₪׳™ ׳ ׳¨׳•׳×, ׳§׳• ׳•׳׳–׳•׳¨ ׳׳™׳ ׳˜׳¨׳׳§׳˜׳™׳‘׳™׳™׳"],
    desc: "׳”׳¦׳’׳× ׳”׳§׳¦׳׳× ׳×׳™׳§, ׳׳•׳—׳•׳× ׳¡׳™׳׳•׳§׳™׳/׳©׳₪׳™׳¦׳¨ ׳•׳ ׳×׳•׳ ׳™ ׳©׳•׳§ ׳‘׳¦׳•׳¨׳” ׳‘׳¨׳•׳¨׳”, ׳ ׳’׳™׳©׳” ׳•׳׳•׳‘׳ ׳× ׳’׳ ׳׳׳™ ׳©׳׳™׳ ׳• ׳׳™׳© ׳₪׳™׳ ׳ ׳¡׳™׳.",
  },
  {
    icon: Cpu,
    title: "׳׳ ׳•׳¢ ׳ ׳™׳×׳•׳— ׳•-AI",
    items: ["׳׳ ׳•׳¢ ׳›׳׳׳™׳ ׳©׳§׳•׳£ (Rule-Based Engine)", "Ollama ג€” ׳׳•׳“׳ ׳©׳₪׳” ׳׳§׳•׳׳™", "Explainable AI"],
    desc: "׳›׳ ׳׳¡׳§׳ ׳” ׳׳‘׳•׳¡׳¡׳× ׳¢׳ ׳׳•׳’׳™׳§׳” ׳ ׳™׳×׳ ׳× ׳׳”׳¡׳‘׳¨; ׳©׳›׳‘׳× AI ׳׳§׳•׳׳™׳× ׳׳•׳¡׳™׳₪׳” ׳ ׳™׳¡׳•׳— ׳׳ ׳•׳©׳™ ׳׳¢׳ ׳”׳›׳׳׳™׳, ׳׳‘׳׳™ ׳׳₪׳’׳•׳¢ ׳‘׳©׳§׳™׳₪׳•׳×.",
  },
  {
    icon: Cloud,
    title: "׳ ׳×׳•׳ ׳™ ׳©׳•׳§ ׳•׳×׳©׳×׳™׳×",
    items: ["Yahoo Finance (׳“׳¨׳ Vercel Serverless Function)", "Vercel Deployment"],
    desc: "׳ ׳×׳•׳ ׳™ ׳©׳•׳§ ׳‘׳–׳׳ ׳׳׳× ׳ ׳©׳׳₪׳™׳ ׳“׳¨׳ ׳₪׳•׳ ׳§׳¦׳™׳™׳× ׳©׳¨׳× ׳™׳™׳¢׳•׳“׳™׳×, ׳•׳ ׳•׳₪׳׳™׳ ׳‘׳¦׳•׳¨׳” ׳—׳׳§׳” ׳׳ ׳×׳•׳ ׳™׳ ׳׳“׳•׳׳™׳ ׳׳ ׳”׳©׳™׳¨׳•׳× ׳׳™׳ ׳• ׳–׳׳™׳.",
  },
];

export function AboutPage() {
  return (
    <Layout>
      <section className="container max-w-3xl py-16 md:py-24">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            ׳׳•׳“׳•׳× ׳”׳₪׳¨׳•׳™׳§׳˜ ׳•׳”׳™׳•׳¦׳¨
          </span>

          <h1 className="mt-5 font-display text-3xl font-extrabold md:text-4xl">׳׳•׳“׳•׳× InvestED</h1>

          <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-muted-foreground">
            <p>
              <b className="text-foreground">InvestED</b> ׳”׳•׳ ׳׳•׳¦׳¨ FinTech ׳¢׳¦׳׳׳™ ׳©׳ ׳•׳¦׳¨, ׳¢׳•׳¦׳‘ ׳•׳₪׳•׳×׳— ׳‘׳©׳׳׳•׳×׳• ׳¢׳ ׳™׳“׳™{" "}
              <b className="text-foreground">׳¡׳¢׳¨ ׳§׳¡׳</b> ג€” ׳‘׳•׳’׳¨ MBA ׳•׳×׳•׳׳¨ ׳¨׳׳©׳•׳ (BA) ׳‘׳׳ ׳”׳ ׳¢׳¡׳§׳™׳, ׳¢׳ ׳ ׳™׳¡׳™׳•׳ ׳׳¢׳©׳™
              ׳‘׳×׳¢׳©׳™׳™׳× ׳”׳‘׳ ׳§׳׳•׳× ׳׳×׳•׳ ׳©׳ ׳×׳™׳™׳ ׳‘׳‘׳ ׳§ ׳”׳₪׳•׳¢׳׳™׳, ׳׳¦׳“ ׳¢׳ ׳™׳™׳ ׳¢׳׳•׳§ ׳•׳׳×׳׳©׳ ׳‘׳¢׳•׳׳ ׳”׳”׳©׳§׳¢׳•׳×, ׳”׳˜׳›׳ ׳•׳׳•׳’׳™׳” ׳•-FinTech.
            </p>
            <p>
              ׳”׳₪׳¨׳•׳™׳§׳˜ ׳”׳–׳” ׳”׳•׳, ׳‘׳׳™׳“׳” ׳¨׳‘׳”, <b className="text-foreground">׳›׳¨׳˜׳™׳¡ ׳”׳‘׳™׳§׳•׳¨ ׳©׳׳™</b>: ׳”׳•׳ ׳ ׳•׳׳“ ׳׳×׳•׳ ׳×׳₪׳™׳¡׳”
              ׳‘׳¨׳•׳¨׳” ׳©׳¢׳•׳׳ ׳”׳”׳©׳§׳¢׳•׳× ׳¨׳¦׳•׳£ ׳׳•׳ ׳—׳™׳ ׳•׳׳•׳©׳’׳™׳ ׳©׳׳¨׳×׳™׳¢׳™׳ ׳׳ ׳©׳™׳ ׳¨׳‘׳™׳ ׳׳׳”׳×׳—׳™׳ ׳׳׳׳•׳“ ׳¢׳׳™׳•, ׳•׳׳×׳•׳ ׳¨׳¦׳•׳ ׳׳׳™׳×׳™
              ׳׳”׳•׳›׳™׳— ג€” ׳׳ ׳¨׳§ ׳׳¡׳₪׳¨ ג€” ׳׳™׳ ׳׳©׳׳‘׳™׳ ׳™׳“׳¢ ׳₪׳™׳ ׳ ׳¡׳™ ׳׳׳™׳×׳™ ׳¢׳ ׳™׳›׳•׳׳•׳× ׳₪׳™׳×׳•׳— Full Stack ׳•׳˜׳›׳ ׳•׳׳•׳’׳™׳•׳× AI
              ׳׳×׳§׳“׳׳•׳×, ׳›׳“׳™ ׳׳”׳₪׳•׳ ׳×׳—׳•׳ ׳׳•׳¨׳›׳‘ ׳׳—׳•׳•׳™׳” ׳₪׳©׳•׳˜׳”, ׳•׳™׳–׳•׳׳׳™׳× ׳•׳׳™׳ ׳˜׳¨׳׳§׳˜׳™׳‘׳™׳×.
            </p>
            <p>
              ׳׳¢׳‘׳¨ ׳׳”׳™׳‘׳˜ ׳”׳˜׳›׳ ׳™, ׳”׳₪׳¨׳•׳™׳§׳˜ ׳׳©׳§׳£ ׳’׳™׳©׳× <b className="text-foreground">Product Thinking</b> ׳׳§׳¦׳” ׳׳§׳¦׳”:
              ׳׳”׳’׳“׳¨׳× ׳”׳‘׳¢׳™׳” (׳ ׳’׳™׳©׳•׳× ׳™׳“׳¢ ׳₪׳™׳ ׳ ׳¡׳™), ׳“׳¨׳ ׳”׳‘׳ ׳× ׳”׳׳©׳×׳׳© ׳•׳”׳¦׳¨׳›׳™׳ ׳©׳׳•, ׳•׳¢׳“ ׳׳‘׳—׳™׳¨׳× ׳”׳׳¨׳›׳™׳˜׳§׳˜׳•׳¨׳” ׳”׳˜׳›׳ ׳•׳׳•׳’׳™׳×
              ׳©׳×׳•׳׳›׳× ׳‘׳” ׳‘׳¦׳•׳¨׳” ׳”׳˜׳•׳‘׳” ׳‘׳™׳•׳×׳¨ ג€” ׳‘׳“׳™׳•׳§ ׳›׳₪׳™ ׳©׳׳¦׳•׳₪׳” ׳׳׳•׳¦׳¨ production ׳׳׳™׳×׳™ ׳‘׳—׳‘׳¨׳× FinTech.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://www.linkedin.com/in/saarkessel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition-colors hover:bg-accent"
            >
              <Linkedin className="h-4 w-4 text-primary" />
              ׳”׳₪׳¨׳•׳₪׳™׳ ׳”׳׳§׳¦׳•׳¢׳™ ׳©׳׳™ ׳‘-LinkedIn
            </a>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-muted-foreground">
              <Briefcase className="h-4 w-4 text-primary" />
              ׳ ׳™׳¡׳™׳•׳ ׳‘׳ ׳§׳׳™ ג€” ׳‘׳ ׳§ ׳”׳₪׳•׳¢׳׳™׳
            </span>
          </div>

          <Card className="mt-10">
            <CardContent className="pt-6">
              <p className="mb-4 text-sm font-bold">׳”׳₪׳¨׳•׳™׳§׳˜ ׳׳“׳’׳™׳ ׳©׳™׳׳•׳‘ ׳‘׳™׳:</p>
              <div className="flex flex-wrap gap-3">
                {PILLARS.map((p) => (
                  <span
                    key={p.label}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1.5 text-xs font-semibold"
                  >
                    <p.icon className="h-3.5 w-3.5 text-primary" />
                    {p.label}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-14">
            <h2 className="font-display text-2xl font-bold">׳›׳׳™׳ ׳•׳˜׳›׳ ׳•׳׳•׳’׳™׳•׳× ׳©׳‘׳”׳ ׳ ׳‘׳ ׳” ׳”׳₪׳¨׳•׳™׳§׳˜</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ׳‘׳—׳™׳¨׳× ׳¡׳˜׳׳§ ׳˜׳›׳ ׳•׳׳•׳’׳™ ׳׳•׳“׳¨׳ ׳™, ׳”׳׳©׳§׳£ ׳¡׳˜׳ ׳“׳¨׳˜׳™׳ ׳׳§׳¦׳•׳¢׳™׳™׳ ׳©׳ ׳׳•׳¦׳¨׳™ FinTech ׳׳׳™׳×׳™׳™׳.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {TECH_STACK.map((t) => (
                <div key={t.title} className="rounded-xl border border-border bg-card p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <t.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-1.5 font-display font-bold">{t.title}</h3>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{t.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm leading-relaxed">
            <b>׳”׳׳¢׳¨׳›׳× ׳׳™׳ ׳” ׳׳¢׳ ׳™׳§׳” ׳™׳™׳¢׳•׳¥ ׳”׳©׳§׳¢׳•׳×.</b> ׳›׳ ׳”׳׳™׳“׳¢ ׳׳•׳¦׳’ ׳׳¦׳•׳¨׳›׳™ ׳׳™׳׳•׳“ ׳‘׳׳‘׳“.
          </div>
        </motion.div>
      </section>
    </Layout>
  );
}

