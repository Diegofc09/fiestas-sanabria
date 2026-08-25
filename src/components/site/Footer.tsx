import { Link, useLocation } from "@tanstack/react-router";
import { Instagram } from "lucide-react";
import { CATEGORIES } from "@/lib/posts";
import { useSearchQuery } from "@/lib/search-store";
import { hasCategoryContent, useActiveCategories } from "@/hooks/useActiveCategories";
import { cn } from "@/lib/utils";


export function Footer() {
  const query = useSearchQuery();
  const isHome = useLocation({ select: (l) => l.pathname === "/" });
  const activeCategories = useActiveCategories();

  const hideSections = isHome && !query;

  return (
    <footer className="mt-20 border-t border-rule/60 bg-ink/80 text-ink-foreground backdrop-blur-xl">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">

        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl font-bold leading-none">
            Fiestas<span className="text-primary">Sanabria</span>
          </p>
          <p className="mt-3 max-w-xs text-[0.9375rem] font-light leading-relaxed text-ink-foreground/70 md:text-sm">
            Plataforma de descubrimiento de fiestas, mercados, música y eventos de la comarca de
            Sanabria.
          </p>
        </div>

        <div className={cn(hideSections && "hidden")}>

          <p className="eyebrow text-primary/80">Secciones</p>
          <ul className="mt-4 space-y-2 text-[0.9375rem] font-light md:text-sm">
            {CATEGORIES.filter((c) => hasCategoryContent(activeCategories, c.value)).map((c) => (

              <li key={c.path}>
                <Link
                  to={c.path}
                  className="text-ink-foreground/80 transition-colors hover:text-primary"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-primary/80">Redacción</p>
          <ul className="mt-4 space-y-2 text-[0.9375rem] font-light md:text-sm">
            <li>
              <Link
                to="/auth"
                search={{ redirect: "/admin" }}
                className="text-ink-foreground/80 transition-colors hover:text-primary"
              >
                Acceso administración
              </Link>
            </li>
            <li>
              <a
                href="mailto:fiestassanabria@gmail.com"
                className="text-ink-foreground/80 transition-colors hover:text-primary"
              >
                fiestassanabria@gmail.com
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/fiestassanabria?igsh=dzQ1dTFuYmVkcjQ4&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-ink-foreground/80 transition-colors hover:text-primary"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
                @fiestassanabria
              </a>
            </li>

          </ul>
          <p className="mt-8 text-[0.8125rem] text-ink-foreground/55 md:text-xs">
            © {new Date().getFullYear()} FiestasSanabria
          </p>
        </div>
      </div>
    </footer>
  );
}
