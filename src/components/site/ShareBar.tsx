import { Check, Link2, Share2 } from "lucide-react";
import { useState } from "react";

export function ShareBar({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  const url = () => `${window.location.origin}/articulo/${slug}`;

  const share = async () => {
    const shareUrl = url();
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        /* cancelado por el usuario */
      }
    }
    await copy();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* portapapeles no disponible */
    }
  };

  return (
    <div className="mt-14 flex flex-wrap items-center gap-3 border-t border-rule pt-6">
      <span className="eyebrow text-muted-foreground">Compartir</span>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium transition-all hover:bg-secondary active:scale-[0.97]"
      >
        <Share2 className="h-4 w-4" />
        Compartir
      </button>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-sm font-medium transition-all hover:bg-secondary active:scale-[0.97]"
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Enlace copiado" : "Copiar enlace"}
      </button>
    </div>
  );
}
