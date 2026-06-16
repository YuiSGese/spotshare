'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const EMOJIS = ['👍', '❤️', '😆', '😮', '😢', '😡'];

type Reaction = { id: string; emoji: string; user_id: string };
type Props = { spotId?: string; commentId?: string };

export default function ReactionBar({ spotId, commentId }: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [myReactionId, setMyReactionId] = useState<string | null>(null);
  const [myEmoji, setMyEmoji] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUserId(session?.user?.id ?? null));
  }, []);

  useEffect(() => { fetchReactions(); }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [spotId, commentId]);

  useEffect(() => {
    if (!userId) { setMyReactionId(null); setMyEmoji(null); return; }
    const mine = reactions.find((r) => r.user_id === userId);
    setMyReactionId(mine?.id ?? null);
    setMyEmoji(mine?.emoji ?? null);
  }, [reactions, userId]);

  const fetchReactions = async () => {
    const query = supabase.from('reactions').select('id, emoji, user_id');
    if (spotId) query.eq('spot_id', spotId);
    else if (commentId) query.eq('comment_id', commentId);
    const { data } = await query;
    if (data) setReactions(data);
  };

  const handleClick = async (emoji: string) => {
    if (!userId || loading) return;
    setLoading(true);
    try {
      if (myEmoji === emoji) {
        await supabase.from('reactions').delete().eq('id', myReactionId!);
      } else if (myReactionId) {
        await supabase.from('reactions').update({ emoji }).eq('id', myReactionId);
      } else {
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

  const counts = EMOJIS.reduce<Record<string, number>>((acc, e) => {
    acc[e] = reactions.filter((r) => r.emoji === e).length;
    return acc;
  }, {});

  const hasAny = reactions.length > 0;

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {EMOJIS.map((emoji) => {
        const count = counts[emoji];
        const isActive = myEmoji === emoji;
        // ログイン中は全emoji表示、未ログインはreactionがあるものだけ表示
        if (!userId && count === 0) return null;
        return (
          <button
            key={emoji}
            onClick={() => handleClick(emoji)}
            disabled={!userId || loading}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all
              ${isActive
                ? 'bg-violet-500/20 border-violet-500/60 text-violet-300'
                : count > 0
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-violet-500/50 hover:bg-violet-500/10'
                  : 'bg-zinc-800/50 border-zinc-800 text-zinc-600 hover:border-violet-500/50 hover:bg-violet-500/10'
              } disabled:cursor-default`}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-xs">{count}</span>}
          </button>
        );
      })}
      {!hasAny && userId && <span className="text-xs text-zinc-700 self-center ml-1">リアクションを追加</span>}
    </div>
  );
}
