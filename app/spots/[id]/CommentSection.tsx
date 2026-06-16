'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ReactionBar from '@/components/ReactionBar';

type Comment = {
  id: string;
  content: string;
  user_email: string;
  created_at: string;
};

type Props = {
  spotId: string;
  comments: Comment[];
};

export default function CommentSection({ spotId, comments }: Props) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setIsLoggedIn(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      const { error } = await supabase.from('comments').insert({
        spot_id: spotId, user_id: session.user.id, user_email: session.user.email, content: content.trim(),
      });
      if (error) throw error;
      setContent('');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'コメントの投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">Comments</h2>
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-sm text-zinc-700">{comments.length}件</span>
      </div>

      <div className="space-y-3 mb-5">
        {comments.length === 0 ? (
          <p className="text-zinc-700 text-sm py-6 text-center">まだコメントがありません</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-violet-400">{comment.user_email}</span>
                <span className="text-xs text-zinc-700">
                  {new Date(comment.created_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.content}</p>
              <ReactionBar commentId={comment.id} />
            </div>
          ))
        )}
      </div>

      {isLoggedIn === null ? null : isLoggedIn ? (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <textarea
            value={content} onChange={(e) => setContent(e.target.value)} rows={3}
            placeholder="コメントを入力..."
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none placeholder:text-zinc-600"
          />
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <div className="flex justify-end mt-3">
            <button
              type="submit" disabled={loading || !content.trim()}
              className="text-sm px-5 py-2 rounded-full font-medium text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? '送信中...' : 'コメントする'}
            </button>
          </div>
        </form>
      ) : (
        <div className="border border-zinc-800 rounded-xl p-4 text-center text-sm text-zinc-600">
          コメントするには{' '}
          <a href="/login" className="text-violet-400 hover:text-violet-300 font-medium">ログイン</a>
          {' '}が必要です
        </div>
      )}
    </div>
  );
}
