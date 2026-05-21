// File: app/(auth)/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toAuthError } from '@/lib/errors';

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${location.origin}/sales`,
      },
    });

    if (error) {
      setError(toAuthError(error.message));
      setLoading(false);
      return;
    }

    router.push('/sales');
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <h2 className="text-xl font-bold text-slate-800">สมัครสมาชิก</h2>

      <div>
        <label className="label">ชื่อร้าน / ชื่อเล่น</label>
        <input
          type="text"
          required
          maxLength={100}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input"
          placeholder="ร้านผลไม้พี่ปุ๋ย"
        />
      </div>

      <div>
        <label className="label">อีเมล</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="label">รหัสผ่าน (อย่างน้อย 8 ตัว)</label>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 animate-slide-down">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
      </button>

      <p className="text-sm text-center text-slate-600">
        มีบัญชีแล้ว?{' '}
        <Link
          href="/login"
          className="text-mango-600 font-semibold underline underline-offset-2"
        >
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
