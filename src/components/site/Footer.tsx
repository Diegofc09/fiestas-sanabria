import { Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/posts";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl leading-none">FiestasSanabria</p>
          <p className="mt-3 max-w-xs text-[0.9375rem] leading-relaxed text-ink-foreground/75 md:text-sm">
            Medio digital de anuncios, fiestas, celebraciones y acontecimientos de la comarca de Sanabria.
          </p>
        </div>

        <div>
          <p className="eyebrow text-ink-foreground/50">Secciones</p>
          <ul className="mt-4 space-y-2 text-[0.9375rem] md:text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.path}>
                <Link
                  to={c.path}
                  className="text-ink-foreground/80 transition-colors hover:text-ink-foreground"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow text-ink-foreground/50">Redacción</p>
          <ul className="mt-4 space-y-2 text-[0.9375rem] md:text-sm">
            <li>
              <Link to="/auth" className="text-ink-foreground/80 transition-colors hover:text-ink-foreground">
                Acceso administración
              </Link>
            </li>
            <li>
              <a
                href="mailto:fiestassanabria@gmail.com"
                className="text-ink-foreground/80 transition-colors hover:text-ink-foreground"
              >
                fiestassanabria@gmail.com
              </a>
            </li>
          </ul>
          <p className="mt-8 text-[0.8125rem] text-ink-foreground/60 md:text-xs">
            © {new Date().getFullYear()} FiestasSanabria
          </p>
        </div>
      </div>
    </footer>
  );
}
