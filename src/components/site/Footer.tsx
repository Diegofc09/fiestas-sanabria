import { Link } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/posts";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-rule bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8">
        <div>
          <p className="font-[family-name:var(--font-display)] text-3xl leading-none">TodoSanabria</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-foreground/70">
            Medio digital de anuncios, fiestas, celebraciones y acontecimientos de la comarca de Sanabria.
          </p>
        </div>

        <div>
          <p className="eyebrow text-ink-foreground/50">Secciones</p>
          <ul className="mt-4 space-y-2 text-sm">
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
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/auth" className="text-ink-foreground/80 transition-colors hover:text-ink-foreground">
                Acceso administración
              </Link>
            </li>
          </ul>
          <p className="mt-8 text-xs text-ink-foreground/50">
            © {new Date().getFullYear()} TodoSanabria
          </p>
        </div>
      </div>
    </footer>
  );
}
