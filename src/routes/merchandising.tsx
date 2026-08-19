import { createFileRoute } from "@tanstack/react-router";

import { CategoryPage, categoryQuery } from "@/components/site/CategoryPage";

const INTRO = "Camisetas, pañuelos y recuerdos de las fiestas y los pueblos de Sanabria.";

export const Route = createFileRoute("/merchandising")({
  loader: ({ context }) => context.queryClient.ensureQueryData(categoryQuery("merchandising")),
  head: () => ({
    meta: [
      { title: "Merchandising de Sanabria — FiestasSanabria" },
      { name: "description", content: "Camisetas, pañuelos y recuerdos de las fiestas y los pueblos de Sanabria." },
      { property: "og:title", content: "Merchandising de Sanabria" },
      { property: "og:description", content: "Camisetas, pañuelos y recuerdos de las fiestas y los pueblos de Sanabria." },
      { property: "og:url", content: "/merchandising" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/merchandising" }],
  }),
  component: () => <CategoryPage category="merchandising" intro={INTRO} />,
});
