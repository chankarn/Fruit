// File: components/layout/bottom-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, Wallet, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/sales', label: 'รายรับ', icon: TrendingUp },
  { href: '/expenses', label: 'รายจ่าย', icon: Wallet },
  { href: '/dashboard', label: 'สรุปผล', icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 pointer-events-none px-4 pb-4"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto mx-auto max-w-md rounded-full bg-white/95 backdrop-blur-md shadow-float ring-1 ring-cream-200">
        <div className="grid grid-cols-3 p-1.5">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-full py-2 text-xs font-semibold transition-all duration-200',
                  active
                    ? 'bg-gradient-mango text-white shadow-soft'
                    : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
