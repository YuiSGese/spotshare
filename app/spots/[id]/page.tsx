import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CommentSection from './CommentSection';
import Header from '@/components/Header';
import ReactionBar from '@/components/ReactionBar';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SpotDetailPage({ params }: Props) {
  const { id } = await params;

  const [spotResult, commentsResult] = await Promise.all([
    supabase.from('spots').select('*').eq('id', id).single(),
    supabase.from('comments').select('id, content, user_email, created_at').eq('spot_id', id).order('created_at', { ascending: true }),
  ]);

  if (spotResult.error || !spotResult.data) notFound();

  const spot = spotResult.data;
  const comments = commentsResult.data ?? [];

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/" className="inline-flex items-center text-sm text-zinc-500 hover:text-violet-400 transition-colors mb-6">
          ← スポット一覧に戻る
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {spot.image_url ? (
            <div className="relative h-72 w-full">
              <Image src={spot.image_url} alt={spot.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/70 to-transparent" />
            </div>
          ) : (
            <div className="h-72 bg-zinc-800 flex items-center justify-center">
              <span className="text-6xl opacity-20">📍</span>
            </div>
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-3">{spot.title}</h1>
            <p className="text-zinc-400 leading-relaxed">{spot.description}</p>
            <p className="text-xs text-zinc-700 mt-4">{new Date(spot.created_at).toLocaleDateString('ja-JP')}</p>
            <ReactionBar spotId={spot.id} />
          </div>
        </div>

        <CommentSection spotId={spot.id} comments={comments} />
      </div>
    </div>
  );
}
