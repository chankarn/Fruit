// File: components/layout/page-header.tsx
export function PageHeader({
  title,
  subtitle,
  emoji = '🍊',
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
}) {
  return (
    <header className="px-5 pt-6 pb-2 md:pt-2 flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-soft text-2xl">
        {emoji}
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-bold text-slate-800 leading-tight">
          {title}
        </h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </header>
  );
}
