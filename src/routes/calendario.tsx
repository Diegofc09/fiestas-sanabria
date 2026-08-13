import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { listPublishedPosts } from "@/lib/posts.functions";
import type { PostSummary } from "@/lib/posts";
import { CalendarView } from "@/components/site/CalendarView";

const calendarQuery = queryOptions({
  queryKey: ["posts", "calendar"],
  queryFn: () => listPublishedPosts({ data: { limit: 60 } }) as Promise<PostSummary[]>,
});

export const Route = createFileRoute("/calendario")({
  loader: ({ context }) => context.queryClient.ensureQueryData(calendarQuery),
  head: () => ({
    meta: [
      { title: "Calendario de fiestas y eventos — FiestasSanabria" },
      {
        name: "description",
        content:
          "Consulta mes a mes las fiestas, eventos y publicaciones de la comarca de Sanabria en el calendario de FiestasSanabria.",
      },
      { property: "og:title", content: "Calendario de fiestas y eventos en Sanabria" },
      {
        property: "og:description",
        content: "Fiestas, eventos y noticias de Sanabria organizados por fecha en un calendario mensual.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/calendario" },
    ],
    links: [{ rel: "canonical", href: "/calendario" }],
  }),
  component: CalendarPage,
});

function CalendarPage() {
  const { data: posts } = useSuspenseQuery(calendarQuery);

  return (
    <div className="mx-auto max-w-6xl px-5 pb-14 md:px-8">
      <header className="border-b border-rule py-10 md:py-14">
        <p className="eyebrow text-primary">Agenda</p>
        <h1 className="mt-3 text-[2.1rem] font-bold leading-[1.06] sm:text-5xl">Calendario</h1>
        <p className="mt-4 max-w-xl font-light leading-relaxed text-muted-foreground">
          Todas las fiestas, eventos y publicaciones de Sanabria organizadas por fecha. Pulsa un día
          para ver lo que hay.
        </p>
      </header>

      <div className="mt-10">
        <CalendarView posts={posts} />
      </div>
    </div>
  );
}
