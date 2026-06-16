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
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-500">データの取得に失敗しました: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="bg-indigo-600 text-white py-16 px-4 text-center">
        <h2 className="text-4xl font-extrabold mb-3">あなたのお気に入りスポットを共有しよう</h2>
        <p className="text-indigo-200 text-lg">世界中の素敵な場所を発見し、シェアするコミュニティ</p>
      </section>

      {/* Spots Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h3 className="text-xl font-semibold text-gray-700 mb-6">
          みんなのスポット <span className="text-indigo-500">({spots?.length ?? 0}件)</span>
        </h3>

        {spots && spots.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {spots.map((spot: Spot) => (
              <Link
                key={spot.id}
                href={`/spots/${spot.id}`}
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 block"
              >
                {spot.image_url ? (
                  <div className="relative h-52 w-full">
                    <Image
                      src={spot.image_url}
                      alt={spot.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="h-52 bg-indigo-100 flex items-center justify-center">
                    <span className="text-5xl">📍</span>
                  </div>
                )}
                <div className="p-5">
                  <h4 className="text-lg font-bold text-gray-800 mb-2">{spot.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-3">{spot.description}</p>
                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(spot.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🗺️</p>
            <p className="text-lg">まだスポットが登録されていません</p>
          </div>
        )}
      </section>
    </main>
  );
}
