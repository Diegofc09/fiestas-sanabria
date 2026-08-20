import { Link, useLocation } from "@tanstack/react-router";
import { Bookmark, Instagram, Menu, Search, X, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { CATEGORIES } from "@/lib/posts";
import { setSearchOpen, setSearchQuery, useSearchQuery } from "@/lib/search-store";
import { hasCategoryContent, useActiveCategories } from "@/hooks/useActiveCategories";
import { ThemeToggle } from "./ThemeToggle";
import logoAsset from "@/assets/wolf-mark.png.asset.json";
import { cn } from "@/lib/utils";


export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const query = useSearchQuery();
  const isHome = useLocation({ select: (l) => l.pathname === "/" });
  const activeCategories = useActiveCategories();

  // Las secciones sin contenido se ocultan hasta que se publique algo en ellas.
  const NAV = [
    { label: "Inicio", path: "/" },
    ...CATEGORIES.filter((c) => hasCategoryContent(activeCategories, c.value)).map((c) => ({
      label: c.label,
      path: c.path,
    })),
    { label: "Calendario", path: "/calendario" },
  ];


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
          ? "border-border bg-background/90 shadow-editorial backdrop-blur-xl"
          : "border-transparent bg-background/70 backdrop-blur-md",
      )}
    >

      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-3 md:flex-row md:items-center md:gap-6 md:px-8 md:py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:flex md:shrink-0">
          <Link
            to="/"
            className={cn(
              "group min-w-0 items-center gap-3",
              isHome && !query ? "hidden" : "flex",
            )}
            onClick={() => setOpen(false)}
          >
            <img
              src={logoAsset.url}
              alt="FiestasSanabria"
              className={cn(
                "w-auto shrink-0 transition-all duration-300 dark:invert",
                scrolled ? "h-10 md:h-12" : "h-12 md:h-14",
              )}
            />
            <span className="flex min-w-0 flex-col">
              <span
                className={cn(
                  "truncate font-[family-name:var(--font-display)] font-bold leading-none tracking-tight transition-all duration-300",
                  scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl",
                )}
              >
                Fiestas<span className="text-primary">Sanabria</span>
              </span>
              <span className="eyebrow mt-1 text-muted-foreground transition-colors group-hover:text-primary">
                Fiestas · Eventos · Comarca
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="glow-hover -mr-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <label
            className={cn(
              "neon-border glow-hover min-w-0 flex-1 items-center gap-2.5 rounded-full bg-card px-4 py-2.5",
              isHome && !query ? "hidden" : "flex",
            )}
          >
            <Search className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Buscar fiestas, eventos, publicidad, noticias, merchandising…"
              aria-label="Buscar publicaciones"
              className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground placeholder:text-muted-foreground focus:outline-none md:text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Limpiar búsqueda"
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </label>

          <Link
            to="/perfil"
            aria-label="Mi perfil"
            className="glow-hover hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 md:inline-flex"
          >
            <UserRound className="h-[18px] w-[18px]" />
          </Link>

          <ThemeToggle className="hidden md:inline-flex" />

          <button
            type="button"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="glow-hover hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground active:scale-95 md:inline-flex"
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
            className="overflow-hidden border-t border-border bg-card"
          >
            <ul className="mx-auto max-w-6xl px-5 py-2 md:px-8 md:py-4">
              {NAV.map((item, i) => (
                <motion.li
                  key={item.path}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.24 }}
                  className="border-b border-border/60 last:border-0"
                >
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: item.path === "/" }}
                    className="block py-4 font-[family-name:var(--font-display)] text-xl text-foreground transition-colors hover:text-primary"
                    activeProps={{ className: "text-primary" }}
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
              <li className="flex flex-wrap items-center gap-2 pt-4 pb-2">
                <Link
                  to="/perfil"
                  onClick={() => setOpen(false)}
                  className="glow-hover inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground"
                >
                  <UserRound className="h-4 w-4 text-primary" />
                  Mi perfil
                </Link>
                <Link
                  to="/guardados"
                  onClick={() => setOpen(false)}
                  className="glow-hover inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground"
                >
                  <Bookmark className="h-4 w-4 text-primary" />
                  Mis guardados
                </Link>
                <a
                  href="https://www.instagram.com/fiestassanabria?igsh=dzQ1dTFuYmVkcjQ4&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="glow-hover inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground"
                >
                  <Instagram className="h-4 w-4 text-primary" />
                  Instagram
                </a>
                <Link
                  to="/auth"
                  search={{ redirect: "/admin" }}
                  onClick={() => setOpen(false)}
                  className="glow-hover inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-foreground"
                >
                  Acceso
                </Link>

              </li>

            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
