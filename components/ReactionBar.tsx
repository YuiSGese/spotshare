'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

const EMOJIS = ['👍', '❤️', '😆', '😮', '😢', '😡'];

type Reaction = { id: string; emoji: string; user_id: string };
type Props = { spotId?: string; commentId?: string };

export default function ReactionBar({ spotId, commentId }: Props) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [myReaction, setMyReaction] = useState<Reaction | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    fetchReactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotId, commentId]);

  useEffect(() => {
    const mine = userId ? (reactions.find((r) => r.user_id === userId) ?? null) : null;
    setMyReaction(mine);
  }, [reactions, userId]);

  const fetchReactions = async () => {
    const query = supabase.from('reactions').select('id, emoji, user_id');
    if (spotId) query.eq('spot_id', spotId);
    else if (commentId) query.eq('comment_id', commentId);
    const { data } = await query;
    if (data) setReactions(data);
  };

  const handleEmojiClick = async (emoji: string) => {
    if (!userId || loading) return;
    setShowPicker(false);
    setLoading(true);
    try {
      if (myReaction?.emoji === emoji) {
        await supabase.from('reactions').delete().eq('id', myReaction.id);
      } else if (myReaction) {
        await supabase.from('reactions').update({ emoji }).eq('id', myReaction.id);
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

  const openPicker = () => {
    if (!userId) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowPicker(true);
  };

  const closePicker = () => {
    hideTimer.current = setTimeout(() => setShowPicker(false), 150);
  };

  // emoji ごとにカウント集計
  const counts = EMOJIS.reduce<Record<string, number>>((acc, e) => {
    acc[e] = reactions.filter((r) => r.emoji === e).length;
    return acc;
  }, {});

  const totalReactions = reactions.length;

  return (
    <div ref={containerRef} className="flex items-center gap-2 mt-3 flex-wrap">
      {/* 既存リアクションのバブル表示 */}
      {totalReactions > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {EMOJIS.filter((e) => counts[e] > 0).map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              disabled={!userId || loading}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all
                ${myReaction?.emoji === emoji
                  ? 'bg-violet-500/20 border-violet-500/60 text-violet-300'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-violet-500/50 hover:bg-violet-500/10'
                } disabled:cursor-default`}
            >
              <span>{emoji}</span>
              <span className="text-xs font-medium">{counts[emoji]}</span>
            </button>
          ))}
        </div>
      )}

      {/* リアクション追加ボタン（ホバーでピッカー表示） */}
      {userId && (
        <div className="relative" onMouseEnter={openPicker} onMouseLeave={closePicker}>
          <button
            onClick={() => setShowPicker((v) => !v)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-all
              ${myReaction
                ? 'bg-violet-500/20 border-violet-500/60 text-violet-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-violet-500/50 hover:text-zinc-200'
              } disabled:cursor-default`}
          >
            <span>{myReaction ? myReaction.emoji : '＋'}</span>
            {!myReaction && <span className="text-xs">リアクション</span>}
          </button>

          {/* ホバーピッカー */}
          {showPicker && (
            <div
              onMouseEnter={openPicker}
              onMouseLeave={closePicker}
              className="absolute bottom-full left-0 mb-2 z-50"
            >
              <div className="flex items-center gap-1 bg-zinc-800 border border-zinc-700 rounded-full px-3 py-2 shadow-xl shadow-black/50">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className={`text-xl w-9 h-9 flex items-center justify-center rounded-full transition-all hover:scale-125 hover:bg-zinc-700
                      ${myReaction?.emoji === emoji ? 'bg-violet-500/30 scale-110' : ''}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {/* ピッカーの矢印 */}
              <div className="w-3 h-3 bg-zinc-800 border-r border-b border-zinc-700 rotate-45 ml-4 -mt-1.5" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
