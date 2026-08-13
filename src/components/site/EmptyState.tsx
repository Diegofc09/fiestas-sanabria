import { Sparkles } from "lucide-react";

export function EmptyState({
  title = "Todavía no hay publicaciones",
  description = "Estamos preparando los primeros contenidos sobre fiestas, eventos y noticias de Sanabria. Vuelve pronto.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="glass-card mt-10 flex flex-col items-center justify-center rounded-2xl px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </span>
      <h2 className="mt-6 text-2xl font-bold md:text-3xl">{title}</h2>
      <p className="mt-3 max-w-md text-base font-light leading-relaxed text-muted-foreground md:text-[0.9375rem]">
        {description}
      </p>
    </div>
  );
}
