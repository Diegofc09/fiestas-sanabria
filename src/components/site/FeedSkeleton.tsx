/**
 * Esqueletos del feed: placeholders con brillo suave que se muestran mientras
 * se cargan las publicaciones, para que la página se sienta inmediata en móvil.
 */

function Shine() {
  return <span className="skeleton-shine" aria-hidden="true" />;
}

export function FeedCardSkeleton({ aspect = "aspect-[4/5]" }: { aspect?: string }) {
  return (
    <div className="glass-card flex h-full flex-col overflow-hidden rounded-2xl" aria-hidden="true">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <span className="skeleton h-7 w-7 shrink-0 rounded-full">
          <Shine />
        </span>
        <span className="skeleton h-3.5 w-24 rounded-full">
          <Shine />
        </span>
      </div>

      <div className={`skeleton relative w-full ${aspect}`}>
        <Shine />
      </div>

      <div className="space-y-2.5 px-4 pt-4">
        <span className="skeleton block h-4 w-11/12 rounded-full">
          <Shine />
        </span>
        <span className="skeleton block h-4 w-2/3 rounded-full">
          <Shine />
        </span>
        <span className="skeleton block h-3 w-1/2 rounded-full">
          <Shine />
        </span>
      </div>

      <div className="mt-auto flex items-center justify-between px-4 py-4">
        <div className="flex gap-2">
          <span className="skeleton h-8 w-8 rounded-full">
            <Shine />
          </span>
          <span className="skeleton h-8 w-8 rounded-full">
            <Shine />
          </span>
          <span className="skeleton h-8 w-8 rounded-full">
            <Shine />
          </span>
        </div>
        <span className="skeleton h-3 w-14 rounded-full">
          <Shine />
        </span>
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      role="status"
      aria-label="Cargando publicaciones"
    >
      {Array.from({ length: count }).map((_, i) => (
        <FeedCardSkeleton key={i} />
      ))}
    </div>
  );
}
