import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-5">
      <div className="max-w-md text-center">
        <p className="eyebrow text-primary">Error 404</p>
        <h1 className="mt-3 text-4xl">Esta página no existe</h1>
        <p className="mt-3 font-[family-name:var(--font-serif)] text-muted-foreground">
          La publicación que buscas no está disponible o ha sido movida.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:opacity-95 active:scale-[0.98]"
        >
          Volver a la portada
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-5">
      <div className="max-w-md text-center">
        <h1 className="text-2xl">No hemos podido cargar esta página</h1>
        <p className="mt-3 font-[family-name:var(--font-serif)] text-muted-foreground">
          Ha ocurrido un problema. Puedes intentarlo de nuevo o volver a la portada.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="rounded-sm border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Ir a la portada
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FiestasSanabria — Fiestas, eventos y noticias de la comarca" },
      {
        name: "description",
        content:
          "Portada de FiestasSanabria: últimas publicaciones sobre fiestas, eventos, noticias y anuncios de la comarca de Sanabria.",
      },
      { property: "og:site_name", content: "FiestasSanabria" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "es_ES" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#f7f4ee" },
      { property: "og:title", content: "FiestasSanabria — Fiestas, eventos y noticias de la comarca" },
      { name: "twitter:title", content: "FiestasSanabria — Fiestas, eventos y noticias de la comarca" },
      { property: "og:description", content: "Portada de FiestasSanabria: últimas publicaciones sobre fiestas, eventos, noticias y anuncios de la comarca de Sanabria." },
      { name: "twitter:description", content: "Portada de FiestasSanabria: últimas publicaciones sobre fiestas, eventos, noticias y anuncios de la comarca de Sanabria." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6952ddbf12f618fb85421582e85672d1/id-preview-3b309694--0f141a7c-5b49-416e-93fa-825e2d52c267.lovable.app-1786540333382.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6952ddbf12f618fb85421582e85672d1/id-preview-3b309694--0f141a7c-5b49-416e-93fa-825e2d52c267.lovable.app-1786540333382.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Inter:wght@400;500;600&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "NewsMediaOrganization",
          name: "FiestasSanabria",
          description:
            "Medio digital de anuncios, fiestas, celebraciones y noticias de la comarca de Sanabria.",
          areaServed: "Sanabria, Zamora, España",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") {
        queryClient.invalidateQueries();
        const saved = sessionStorage.getItem("fs_redirect");
        if (saved?.startsWith("/") && !saved.startsWith("//")) {
          sessionStorage.removeItem("fs_redirect");
          void router.navigate({ to: saved, replace: true });
        }
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
