// File: components/layout/side-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { TrendingUp, Wallet, BarChart3, LogOut, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/sales', label: 'รายรับ', icon: TrendingUp },
  { href: '/expenses', label: 'รายจ่าย', icon: Wallet },
  { href: '/dashboard', label: 'สรุปผล', icon: BarChart3 },
];

function todayLabel() {
  return new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}

export function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [date, setDate] = useState(todayLabel());

  useEffect(() => {
    let mounted = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const meta = (data.user?.user_metadata ?? {}) as { display_name?: string };
        setName(meta.display_name?.trim() || data.user?.email?.split('@')[0] || null);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setDate(todayLabel()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const onLogout = async () => {
    await createClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  };

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col min-h-dvh bg-white border-r border-cream-200 shadow-float">
      {/* Brand header */}
      <div className="relative overflow-hidden bg-gradient-mango px-6 py-7">
        <div
          aria-hidden
          className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/10 blur-2xl"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <span className="absolute -top-1 right-4 text-4xl opacity-20 rotate-12">🍊</span>
          <span className="absolute bottom-2 right-12 text-2xl opacity-15 -rotate-6">🍓</span>
        </div>
        <div className="relative">
          <div className="text-[10px] uppercase tracking-widest font-semibold text-white/70">
            Fruit Tracker
          </div>
          <div className="mt-1 text-lg font-bold text-white leading-snug">
            {name ? `สวัสดี, ${name}` : 'ยินดีต้อนรับ'}
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <CalendarDays className="h-3.5 w-3.5" />
            {date}
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                active
                  ? 'bg-gradient-mango text-white shadow-soft'
                  : 'text-slate-600 hover:bg-cream-100 hover:text-slate-800',
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-cream-200">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}
