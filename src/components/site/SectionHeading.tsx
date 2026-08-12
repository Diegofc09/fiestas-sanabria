export function SectionHeading({ title, kicker }: { title: string; kicker?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="text-xl md:text-2xl">{title}</h2>
      {kicker && <span className="eyebrow text-muted-foreground">{kicker}</span>}
    </div>
  );
}
