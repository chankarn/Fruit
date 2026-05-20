// File: components/layout/top-bar.tsx
'use client';

import { LogOut, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function todayLabel() {
  return new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  });
}

export function TopBar() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [date, setDate] = useState(todayLabel());

  useEffect(() => {
    let mounted = true;
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (!mounted) return;
        const meta = (data.user?.user_metadata ?? {}) as {
          display_name?: string;
        };
        setName(
          meta.display_name?.trim() || data.user?.email?.split('@')[0] || null,
        );
      });
    return () => {
      mounted = false;
    };
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
    <div className="relative overflow-hidden rounded-b-[2.5rem] bg-gradient-mango shadow-soft">
      {/* Decorative fruit */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="absolute -top-2 right-6 text-5xl opacity-25 rotate-12">
          🍊
        </span>
        <span className="absolute top-6 right-20 text-3xl opacity-25 -rotate-6">
          🍓
        </span>
        <span className="absolute -bottom-2 left-10 text-4xl opacity-20 rotate-12">
          🥭
        </span>
        <span className="absolute top-3 left-1/3 text-2xl opacity-20">
          🍋
        </span>
      </div>

      <div className="relative px-5 pt-6 pb-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-widest font-semibold text-white/80">
              Fruit Tracker
            </div>
            <h1 className="mt-0.5 text-xl font-bold text-white leading-snug truncate">
              {name ? `สวัสดี, ${name}` : 'ยินดีต้อนรับ'}
            </h1>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <CalendarDays className="h-3.5 w-3.5" />
              {date}
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="btn-icon shrink-0 bg-white/20 text-white backdrop-blur hover:bg-white/30"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
