import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
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
    supabase
      .from('comments')
      .select('id, content, user_email, created_at')
      .eq('spot_id', id)
      .order('created_at', { ascending: true }),
  ]);

  if (spotResult.error || !spotResult.data) notFound();

  const spot = spotResult.data;
  const comments = commentsResult.data ?? [];

  // サーバー側でログイン中ユーザーのメールを取得
  const cookieStore = await cookies();
  const supabaseServer = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    }
  );
  const { data: { session } } = await supabaseServer.auth.getSession();
  const currentUserEmail = session?.user?.email ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* 戻るボタン */}
        <Link href="/" className="inline-flex items-center text-sm text-indigo-600 hover:underline mb-6">
          ← スポット一覧に戻る
        </Link>

        {/* スポット詳細 */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {spot.image_url ? (
            <div className="relative h-72 w-full">
              <Image
                src={spot.image_url}
                alt={spot.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
              />
            </div>
          ) : (
            <div className="h-72 bg-indigo-100 flex items-center justify-center">
              <span className="text-6xl">📍</span>
            </div>
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-3">{spot.title}</h1>
            <p className="text-gray-600 leading-relaxed">{spot.description}</p>
            <p className="text-xs text-gray-400 mt-4">
              {new Date(spot.created_at).toLocaleDateString('ja-JP')}
            </p>
            <ReactionBar spotId={spot.id} />
          </div>
        </div>

        {/* コメントセクション */}
        <CommentSection
          spotId={spot.id}
          comments={comments}
          currentUserEmail={currentUserEmail}
        />
      </div>
    </div>
  );
}
