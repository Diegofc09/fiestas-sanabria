import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { CATEGORIES } from "@/lib/posts";
import { cn } from "@/lib/utils";

const NAV = [{ label: "Inicio", path: "/" }, ...CATEGORIES.map((c) => ({ label: c.label, path: c.path }))];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
        "sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md transition-all duration-300",
        scrolled ? "border-rule shadow-editorial" : "border-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8 md:py-5">
        <Link to="/" className="group flex min-w-0 flex-col" onClick={() => setOpen(false)}>
          <span
            className={cn(
              "truncate font-[family-name:var(--font-display)] font-semibold leading-none transition-all duration-300",
              scrolled ? "text-xl md:text-2xl" : "text-2xl md:text-4xl",
            )}
          >
            FiestasSanabria
          </span>
          <span className="eyebrow mt-1 text-muted-foreground transition-colors group-hover:text-primary">
            Anuncios · Fiestas · Comarca
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              activeOptions={{ exact: item.path === "/" }}
              className="relative py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left bg-primary transition-transform duration-300",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </>
              )}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-secondary active:scale-95 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            key="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-rule bg-paper md:hidden"
          >
            <ul className="mx-auto max-w-6xl px-5 py-2">
              {NAV.map((item, i) => (
                <motion.li
                  key={item.path}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.24 }}
                  className="border-b border-border last:border-0"
                >
                  <Link
                    to={item.path}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact: item.path === "/" }}
                    className="block py-4 font-[family-name:var(--font-display)] text-xl text-foreground"
                    activeProps={{ className: "text-primary" }}
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
