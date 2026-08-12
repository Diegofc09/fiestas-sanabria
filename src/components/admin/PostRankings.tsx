import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Eye, Loader2, Minus, TrendingUp } from "lucide-react";

import { adminPostRankings, type PostRanking } from "@/lib/analytics.functions";
import { categoryLabel } from "@/lib/posts";

function growth(row: PostRanking) {
  const diff = row.views_last_30 - row.views_prev_30;
  const pct = row.views_prev_30 > 0 ? Math.round((diff / row.views_prev_30) * 100) : null;
  return { diff, pct };
}

function RankList({ rows, mode }: { rows: PostRanking[]; mode: "top" | "growth" }) {
  if (rows.length === 0) {
    return (
      <p className="mt-4 font-[family-name:var(--font-serif)] text-sm text-muted-foreground">
        Todavía no hay suficientes visitas registradas.
      </p>
    );
  }
  return (
    <ol className="mt-4 divide-y divide-rule">
      {rows.map((row, i) => {
        const { diff, pct } = growth(row);
        return (
          <li key={row.post_id} className="flex items-center gap-3 py-3">
            <span className="w-5 shrink-0 text-sm text-muted-foreground">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <Link
                to="/articulo/$slug"
                params={{ slug: row.slug }}
                className="block truncate text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                {row.title}
              </Link>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {categoryLabel(row.category)}
                {row.status === "draft" && " · Borrador"}
              </p>
            </div>
            {mode === "top" ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-foreground">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                {row.views_last_30}
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-primary">
                {diff > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                {diff > 0 ? "+" : ""}
                {diff}
                {pct !== null && diff > 0 && (
                  <span className="text-xs text-muted-foreground">({pct}%)</span>
                )}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function PostRankings() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-post-rankings"],
    queryFn: () => adminPostRankings() as Promise<PostRanking[]>,
  });

  if (isLoading) {
    return (
      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Calculando ranking de visitas…
      </div>
    );
  }

  const rows = data ?? [];
  const top = [...rows]
    .filter((r) => r.views_last_30 > 0)
    .sort((a, b) => b.views_last_30 - a.views_last_30)
    .slice(0, 5);
  const rising = [...rows]
    .filter((r) => r.views_last_30 - r.views_prev_30 > 0)
    .sort((a, b) => b.views_last_30 - b.views_prev_30 - (a.views_last_30 - a.views_prev_30))
    .slice(0, 5);

  return (
    <section className="mt-8 grid gap-6 md:grid-cols-2">
      <div className="rounded-sm border border-rule bg-paper p-5">
        <h2 className="eyebrow text-primary">Más visitados · últimos 30 días</h2>
        <RankList rows={top} mode="top" />
      </div>
      <div className="rounded-sm border border-rule bg-paper p-5">
        <h2 className="eyebrow text-primary">Mayor crecimiento · vs. 30 días previos</h2>
        <RankList rows={rising} mode="growth" />
      </div>
    </section>
  );
}
