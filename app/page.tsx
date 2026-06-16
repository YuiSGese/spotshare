import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';

export const dynamic = 'force-dynamic';

type Spot = {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  created_at: string;
};

export default async function Home() {
  const { data: spots, error } = await supabase
    .from('spots')
    .select('id, title, description, image_url, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-red-400">データの取得に失敗しました: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4 text-center">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-700/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-fuchsia-700/15 rounded-full blur-2xl" />
        </div>
        <p className="text-xs font-semibold tracking-widest text-violet-400 uppercase mb-4">Discover & Share</p>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
          あなたの特別な場所を<br />
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            世界とシェアしよう
          </span>
        </h2>
        <p className="text-zinc-400 text-lg max-w-md mx-auto">
          世界中の素敵なスポットを発見し、コミュニティとつながる
        </p>
      </section>

      {/* Spots Grid */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <h3 className="text-sm font-semibold tracking-widest text-zinc-500 uppercase">Spots</h3>
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-sm text-zinc-600">{spots?.length ?? 0}件</span>
        </div>

        {spots && spots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {spots.map((spot: Spot) => (
              <Link
                key={spot.id}
                href={`/spots/${spot.id}`}
                className="group block bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-900/20 transition-all duration-300"
              >
                {spot.image_url ? (
                  <div className="relative h-52 w-full overflow-hidden">
                    <Image
                      src={spot.image_url}
                      alt={spot.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent" />
                  </div>
                ) : (
                  <div className="h-52 bg-zinc-800 flex items-center justify-center">
                    <span className="text-5xl opacity-30">📍</span>
                  </div>
                )}
                <div className="p-5">
                  <h4 className="text-base font-bold text-white mb-1.5 group-hover:text-violet-300 transition-colors">
                    {spot.title}
                  </h4>
                  <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">{spot.description}</p>
                  <p className="text-xs text-zinc-700 mt-3">
                    {new Date(spot.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-zinc-700">
            <p className="text-5xl mb-4 opacity-30">🗺️</p>
            <p className="text-lg">まだスポットがありません</p>
          </div>
        )}
      </section>
    </main>
  );
}
