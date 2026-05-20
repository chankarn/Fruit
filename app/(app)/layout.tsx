// File: app/(app)/layout.tsx
import { BottomNav } from '@/components/layout/bottom-nav';
import { TopBar } from '@/components/layout/top-bar';
import { SideNav } from '@/components/layout/side-nav';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-cream-100 md:flex">
      {/* Desktop sidebar */}
      <SideNav />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-h-dvh md:overflow-auto">
        {/* Mobile TopBar */}
        <div className="md:hidden">
          <TopBar />
        </div>

        {/* Page content */}
        <main className="flex-1 pb-44 md:pb-10 -mt-4 md:mt-0 mx-auto w-full max-w-md md:max-w-3xl md:px-6 md:py-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
