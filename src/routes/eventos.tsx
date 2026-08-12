import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage, categoryQuery } from "@/components/site/CategoryPage";

const INTRO = "Conciertos, ferias, mercados y actividades culturales de la comarca.";

export const Route = createFileRoute("/eventos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoryQuery("eventos")),
  head: () => ({
    meta: [
      { title: "Eventos en Sanabria — FiestasSanabria" },
      { name: "description", content: "Conciertos, ferias, mercados y actividades culturales en Sanabria." },
      { property: "og:title", content: "Eventos en Sanabria" },
      { property: "og:description", content: "Conciertos, ferias, mercados y actividades culturales en Sanabria." },
      { property: "og:url", content: "/eventos" },
    ],
    links: [{ rel: "canonical", href: "/eventos" }],
  }),
  component: () => <CategoryPage category="eventos" intro={INTRO} />,
});
