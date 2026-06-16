'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-xl">📍</span>
          <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            SpotShare
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-zinc-500 hidden sm:block truncate max-w-[180px]">
                {user.email}
              </span>
              <Link
                href="/spots/new"
                className="text-sm px-4 py-2 rounded-full font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all shadow-lg shadow-violet-900/30"
              >
                + 投稿する
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ログアウト
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm px-4 py-2 rounded-full font-medium bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white transition-all shadow-lg shadow-violet-900/30"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
