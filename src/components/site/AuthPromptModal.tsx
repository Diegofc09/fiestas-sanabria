import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Bookmark, MessageCircle, X } from "lucide-react";

import { closeAuthPrompt, useAuthPrompt } from "@/lib/auth-prompt";

/** Aviso emergente para invitar a registrarse o iniciar sesión. */
export function AuthPromptModal() {
  const reason = useAuthPrompt();

  return (
    <AnimatePresence>
      {reason && (
        <motion.div
          key="auth-prompt"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 px-5 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Crear cuenta o iniciar sesión"
          onClick={closeAuthPrompt}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="glass-card relative w-full max-w-md rounded-3xl border border-border p-7 text-center"
          >
            <button
              type="button"
              onClick={closeAuthPrompt}
              aria-label="Cerrar"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary">
              <Bookmark className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>

            <h2 className="mt-5 text-2xl font-bold leading-tight">
              Únete a FiestasSanabria
            </h2>
            <p className="mt-3 text-[0.9375rem] font-light leading-relaxed text-muted-foreground">
              {reason}
            </p>

            <ul className="mt-5 space-y-2 text-left text-[0.875rem] text-muted-foreground">
              <li className="flex items-start gap-2">
                <Bookmark className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Tus guardados no caducan a los 14 días.
              </li>
              <li className="flex items-start gap-2">
                <MessageCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                Comenta y valora las fiestas de la comarca.
              </li>
            </ul>

            <div className="mt-7 flex flex-col gap-2.5 sm:flex-row">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                onClick={closeAuthPrompt}
                className="glow-hover inline-flex flex-1 items-center justify-center rounded-full border border-primary bg-primary/10 px-5 py-3 text-sm font-semibold text-foreground"
              >
                Registrarme
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                onClick={closeAuthPrompt}
                className="glow-hover inline-flex flex-1 items-center justify-center rounded-full border border-border/70 bg-secondary/50 px-5 py-3 text-sm font-medium text-foreground"
              >
                Iniciar sesión
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
