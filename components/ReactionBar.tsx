'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const EMOJIS = ['👍', '❤️', '😆', '😮', '😢', '😡'];

type Reaction = {
  id: string;
  emoji: string;
  user_id: string;
};

type Props = {
  spotId?: string;
  commentId?: string;
};

export default function ReactionBar({ spotId, commentId }: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [myReactionId, setMyReactionId] = useState<string | null>(null);
  const [myEmoji, setMyEmoji] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    fetchReactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotId, commentId]);

  const fetchReactions = async () => {
    const query = supabase.from('reactions').select('id, emoji, user_id');
    if (spotId) query.eq('spot_id', spotId);
    else if (commentId) query.eq('comment_id', commentId);
    const { data } = await query;
    if (!data) return;
    setReactions(data);
  };

  useEffect(() => {
    if (!userId) { setMyReactionId(null); setMyEmoji(null); return; }
    const mine = reactions.find((r) => r.user_id === userId);
    setMyReactionId(mine?.id ?? null);
    setMyEmoji(mine?.emoji ?? null);
  }, [reactions, userId]);

  const handleClick = async (emoji: string) => {
    if (!userId) return;
    if (loading) return;
    setLoading(true);

    try {
      if (myEmoji === emoji) {
        // 同じ絵文字 → 削除
        await supabase.from('reactions').delete().eq('id', myReactionId!);
      } else if (myReactionId) {
        // 別の絵文字 → 更新
        await supabase.from('reactions').update({ emoji }).eq('id', myReactionId);
      } else {
        // 新規追加
        const payload: Record<string, string> = { user_id: userId, emoji };
        if (spotId) payload.spot_id = spotId;
        else if (commentId) payload.comment_id = commentId;
        await supabase.from('reactions').insert(payload);
      }
      await fetchReactions();
    } finally {
      setLoading(false);
    }
  };

  // emoji ごとに集計
  const counts = EMOJIS.reduce<Record<string, number>>((acc, e) => {
    acc[e] = reactions.filter((r) => r.emoji === e).length;
    return acc;
  }, {});

  const hasAnyReaction = reactions.length > 0;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {EMOJIS.map((emoji) => {
        const count = counts[emoji];
        const isActive = myEmoji === emoji;
        // リアクションが1件以上あるものは常に表示、ないものはhoverで表示
        if (count === 0 && hasAnyReaction) return null;

        return (
          <button
            key={emoji}
            onClick={() => handleClick(emoji)}
            disabled={!userId || loading}
            title={userId ? undefined : 'ログインしてリアクションする'}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all
              ${isActive
                ? 'bg-indigo-100 border-indigo-400 text-indigo-700 font-semibold'
                : count > 0
                  ? 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'
                  : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-indigo-300 hover:bg-indigo-50'
              }
              disabled:cursor-default
            `}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-xs">{count}</span>}
          </button>
        );
      })}

      {/* リアクションが0件のときは全部表示 */}
      {!hasAnyReaction && userId && (
        <span className="text-xs text-gray-400 self-center ml-1">リアクションを追加</span>
      )}
    </div>
  );
}
