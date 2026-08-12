import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage, categoryQuery } from "@/components/site/CategoryPage";

const INTRO = "Actualidad y noticias de interés de Sanabria y su entorno.";

export const Route = createFileRoute("/noticias")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoryQuery("noticias")),
  head: () => ({
    meta: [
      { title: "Noticias en Sanabria — FiestasSanabria" },
      { name: "description", content: "Actualidad y noticias de interés de Sanabria y su entorno." },
      { property: "og:title", content: "Noticias en Sanabria" },
      { property: "og:description", content: "Actualidad y noticias de interés de Sanabria y su entorno." },
      { property: "og:url", content: "/noticias" },
    ],
    links: [{ rel: "canonical", href: "/noticias" }],
  }),
  component: () => <CategoryPage category="noticias" intro={INTRO} />,
});
