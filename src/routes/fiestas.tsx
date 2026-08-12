import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage, categoryQuery } from "@/components/site/CategoryPage";

const INTRO = "Fiestas patronales, verbenas y romerías de los pueblos de Sanabria.";

export const Route = createFileRoute("/fiestas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoryQuery("fiestas")),
  head: () => ({
    meta: [
      { title: "Fiestas en Sanabria — Fiestas Sanabria" },
      { name: "description", content: "Fiestas patronales, verbenas y romerías de los pueblos de la comarca de Sanabria." },
      { property: "og:title", content: "Fiestas en Sanabria" },
      { property: "og:description", content: "Fiestas patronales, verbenas y romerías de los pueblos de la comarca de Sanabria." },
      { property: "og:url", content: "/fiestas" },
    ],
    links: [{ rel: "canonical", href: "/fiestas" }],
  }),
  component: () => <CategoryPage category="fiestas" intro={INTRO} />,
});
