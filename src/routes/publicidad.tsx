import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage, categoryQuery } from "@/components/site/CategoryPage";

const INTRO = "Anuncios y promociones de negocios, bares y servicios de la comarca de Sanabria.";

export const Route = createFileRoute("/publicidad")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoryQuery("publicidad")),
  head: () => ({
    meta: [
      { title: "Publicidad en Sanabria — FiestasSanabria" },
      { name: "description", content: "Anuncios y promociones de negocios, bares y servicios de la comarca de Sanabria." },
      { property: "og:title", content: "Publicidad en Sanabria" },
      { property: "og:description", content: "Anuncios y promociones de negocios, bares y servicios de la comarca de Sanabria." },
      { property: "og:url", content: "/publicidad" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/publicidad" }],
  }),
  component: () => <CategoryPage category="publicidad" intro={INTRO} />,
});
