// File: app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 bg-gradient-fresh">
      {/* Floating fruit emojis (decoration) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <span className="absolute -top-4 left-6 text-6xl opacity-20 rotate-12">
          🍊
        </span>
        <span className="absolute top-1/4 -right-4 text-5xl opacity-20 -rotate-12">
          🍋
        </span>
        <span className="absolute bottom-10 left-4 text-5xl opacity-15 rotate-6">
          🥭
        </span>
        <span className="absolute bottom-1/3 right-8 text-4xl opacity-15">
          🍓
        </span>
      </div>

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="mb-8 text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-mango shadow-soft text-5xl mb-4">
            🍊
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Fruit Tracker</h1>
          <p className="mt-1 text-sm text-slate-600">
            บันทึกการขายผลไม้ ง่ายและรวดเร็ว
          </p>
        </div>
        <div className="card p-6 backdrop-blur-sm bg-white/95">{children}</div>
      </div>
    </div>
  );
}
