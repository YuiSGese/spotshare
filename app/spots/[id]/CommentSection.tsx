'use client';

import { useState } from 'react';
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
  currentUserEmail: string | null;
};

export default function CommentSection({ spotId, comments, currentUserEmail }: Props) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { error } = await supabase.from('comments').insert({
        spot_id: spotId,
        user_id: session.user.id,
        user_email: session.user.email,
        content: content.trim(),
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
    <div className="mt-10">
      <h2 className="text-lg font-bold text-gray-800 mb-4">
        コメント <span className="text-indigo-500 font-normal text-base">({comments.length}件)</span>
      </h2>

      {/* コメント一覧 */}
      <div className="space-y-3 mb-6">
        {comments.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">まだコメントがありません。最初のコメントを書いてみましょう！</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-indigo-600">{comment.user_email}</span>
                <span className="text-xs text-gray-400">
                  {new Date(comment.created_at).toLocaleString('ja-JP', {
                    month: 'numeric', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
              <ReactionBar commentId={comment.id} />
            </div>
          ))
        )}
      </div>

      {/* コメントフォーム */}
      {currentUserEmail ? (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="コメントを入力..."
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          {error && (
            <p className="text-red-500 text-xs mt-2">{error}</p>
          )}
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '送信中...' : 'コメントする'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-500">
          コメントするには{' '}
          <a href="/login" className="text-indigo-600 hover:underline font-medium">ログイン</a>
          {' '}が必要です
        </div>
      )}
    </div>
  );
}
