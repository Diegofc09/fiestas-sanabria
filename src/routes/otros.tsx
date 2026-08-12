import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage, categoryQuery } from "@/components/site/CategoryPage";

const INTRO = "Anuncios, avisos y otros asuntos de interés para los vecinos.";

export const Route = createFileRoute("/otros")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoryQuery("otros")),
  head: () => ({
    meta: [
      { title: "Otros en Sanabria — TodoSanabria" },
      { name: "description", content: "Anuncios, avisos y otros asuntos de interés para los vecinos de Sanabria." },
      { property: "og:title", content: "Otros en Sanabria" },
      { property: "og:description", content: "Anuncios, avisos y otros asuntos de interés para los vecinos de Sanabria." },
      { property: "og:url", content: "/otros" },
    ],
    links: [{ rel: "canonical", href: "/otros" }],
  }),
  component: () => <CategoryPage category="otros" intro={INTRO} />,
});
