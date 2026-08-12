import { Newspaper } from "lucide-react";

export function EmptyState({
  title = "Todavía no hay publicaciones",
  description = "Estamos preparando los primeros contenidos sobre fiestas, eventos y noticias de Sanabria. Vuelve pronto.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-sm border border-dashed border-rule bg-paper px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
        <Newspaper className="h-6 w-6" />
      </span>
      <h2 className="mt-6 text-2xl md:text-3xl">{title}</h2>
      <p className="mt-3 max-w-md font-[family-name:var(--font-serif)] text-base md:text-[0.9375rem] leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
