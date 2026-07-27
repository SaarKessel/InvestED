import { motion } from "framer-motion";
import { PieChart as PieChartIcon, AlertTriangle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip } from "recharts";
import type { AnalysisResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/primitives";
import { BrokerComparisonTable } from "./BrokerComparisonTable";

export function PortfolioCard({ result }: { result: AnalysisResult }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <PieChartIcon className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wide">תיק לימודי לדוגמה</span>
          </div>
          <CardTitle className="text-xl">כך יכולה להיראות הקצאת נכסים חינוכית</CardTitle>
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-xs text-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            זוהי דוגמה היפותטית להמחשה בלבד — לא המלצת השקעה.
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid items-center gap-6 md:grid-cols-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={result.allocation}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={2}
                  >
                    {result.allocation.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <RTooltip
                    formatter={(value: number, name: string) => [`${value}%`, name]}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5">
              {result.allocation.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t border-border pt-5">
            <h4 className="mb-1.5 text-sm font-bold">למה התיק הזה?</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.aiNarration.portfolioSummary}</p>
          </div>

          <BrokerComparisonTable />
        </CardContent>
      </Card>
    </motion.div>
  );
}
