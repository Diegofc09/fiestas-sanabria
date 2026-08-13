import { Link } from "@tanstack/react-router";
import { Menu, Search, X, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { CATEGORIES } from "@/lib/posts";
import { setSearchOpen, setSearchQuery, useSearchQuery } from "@/lib/search-store";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Inicio", path: "/" },
  ...CATEGORIES.map((c) => ({ label: c.label, path: c.path })),
  { label: "Calendario", path: "/calendario" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const query = useSearchQuery();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-rule/70 bg-background/80 shadow-editorial backdrop-blur-xl"
          : "border-transparent bg-background/40 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 md:flex-row md:items-center md:gap-6 md:px-8 md:py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:shrink-0">
          <Link to="/" className="group flex min-w-0 flex-col" onClick={() => setOpen(false)}>
            <span
              className={cn(
                "text-glow-violet truncate font-[family-name:var(--font-display)] font-bold leading-none tracking-tight transition-all duration-300",
                scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl",
              )}
            >
              Fiestas<span className="text-neon-cyan">Sanabria</span>
            </span>
            <span className="eyebrow mt-1 text-muted-foreground transition-colors group-hover:text-neon-cyan">
              Fiestas · Eventos · Comarca
            </span>
          </Link>

          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="glow-hover -mr-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/70 bg-secondary/50 text-foreground active:scale-95 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <label className="neon-border glow-hover flex min-w-0 flex-1 items-center gap-2.5 rounded-full bg-background/60 px-4 py-2.5 backdrop-blur-md">
            <Search className="h-4 w-4 shrink-0 text-neon-cyan" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Buscar fiestas, eventos, publicidad..."
              aria-label="Buscar publicaciones"
              className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none md:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Limpiar búsqueda"
                className="shrink-0 text-muted-foreground transition-colors hover:text-neon-pink"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>

          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="glow-hover hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border/70 bg-secondary/40 text-foreground active:scale-95 md:inline-flex"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            key="nav-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-rule/60 bg-ink/95 backdrop-blur-xl"
          >
            <ul className="mx-auto max-w-6xl px-5 py-2 md:px-8 md:py-4">
              {NAV.map((item, i) => (
                <motion.li
                  key={item.path}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.24 }}
                  className="border-b border-border/50 last:border-0"
                >
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: item.path === "/" }}
                    className="block py-4 font-[family-name:var(--font-display)] text-xl text-foreground transition-colors hover:text-neon-cyan"
                    activeProps={{ className: "text-neon-violet" }}
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
              <li className="flex flex-wrap items-center gap-2 pt-4 pb-2">
                <Link
                  to="/guardados"
                  onClick={() => setOpen(false)}
                  className="glow-hover inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground"
                >
                  <Bookmark className="h-4 w-4 text-neon-violet" />
                  Mis guardados
                </Link>
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="glow-hover inline-flex items-center gap-2 rounded-full border border-border/70 bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground"
                >
                  <UserRound className="h-4 w-4 text-neon-pink" />
                  Acceso / Perfil
                </Link>
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
