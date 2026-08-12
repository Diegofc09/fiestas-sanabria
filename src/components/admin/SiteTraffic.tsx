import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, TrendingUp } from "lucide-react";

import { adminSiteViewDaily, type DailyViews } from "@/lib/analytics.functions";

const RANGES = [7, 30, 90] as const;

function labelDay(day: string): string {
  const date = new Date(`${day}T12:00:00`);
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

/** Visitas diarias al sitio: contadores y gráfico de líneas con puntos por día. */
export function SiteTraffic() {
  const [days, setDays] = useState<number>(30);

  const { data, isLoading } = useQuery({
    queryKey: ["site-views-daily", days],
    queryFn: () => adminSiteViewDaily({ data: { days } }) as Promise<DailyViews[]>,
    staleTime: 60_000,
  });

  const rows = data ?? [];
  const chart = rows.map((row) => ({ ...row, label: labelDay(row.day) }));
  const today = rows.at(-1)?.views ?? 0;
  const yesterday = rows.at(-2)?.views ?? 0;
  const total = rows.reduce((sum, row) => sum + row.views, 0);
  const average = rows.length ? Math.round((total / rows.length) * 10) / 10 : 0;
  const diff = today - yesterday;

  return (
    <section className="mt-12 rounded-sm border border-rule bg-paper p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-primary">Analíticas</p>
          <h2 className="mt-1 text-xl md:text-2xl">Visitas diarias a la web</h2>
        </div>
        <div className="flex gap-1.5">
          {RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDays(range)}
              className={
                days === range
                  ? "h-9 rounded-sm bg-primary px-3 text-[0.8125rem] font-medium text-primary-foreground"
                  : "h-9 rounded-sm border border-input px-3 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              }
            >
              {range} días
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric label="Hoy" value={today} />
        <Metric
          label="Ayer"
          value={yesterday}
          hint={
            diff === 0
              ? "igual que ayer"
              : `${diff > 0 ? "+" : ""}${diff} respecto a ayer`
          }
        />
        <Metric label="Media diaria" value={average} />
        <Metric label={`Total ${days} días`} value={total} />
      </div>

      <div className="mt-6 h-[280px] w-full">
        {isLoading ? (
          <div className="flex h-full items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando visitas…
          </div>
        ) : total === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
            <TrendingUp className="h-5 w-5" />
            <p className="text-[0.9375rem]">
              Todavía no hay visitas registradas en este periodo.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ top: 10, right: 12, bottom: 0, left: -18 }}>
              <CartesianGrid stroke="var(--rule)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                stroke="var(--rule)"
                interval="preserveStartEnd"
                minTickGap={18}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                stroke="var(--rule)"
              />
              <Tooltip
                contentStyle={{
                  background: "var(--background)",
                  border: "1px solid var(--rule)",
                  borderRadius: 4,
                  fontSize: 13,
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                formatter={(value: number) => [`${value} visitas`, ""]}
              />
              <Line
                type="monotone"
                dataKey="views"
                name="Visitas"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="rounded-sm border border-rule bg-background p-3">
      <p className="text-[0.8125rem] text-muted-foreground">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-2xl">{value}</p>
      {hint && <p className="mt-0.5 text-[0.75rem] text-muted-foreground">{hint}</p>}
    </div>
  );
}
