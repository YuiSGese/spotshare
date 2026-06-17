'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-browser';

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export default function NewSpotPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/login');
      else setChecking(false);
    });
  }, [router]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.items ?? [])
        .find((item) => item.type.startsWith('image/'))
        ?.getAsFile();
      if (!file) return;
      if (file.size > MAX_FILE_SIZE) { setError('画像は2MB以下にしてください'); return; }
      setError('');
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) { setError('画像は2MB以下にしてください'); e.target.value = ''; return; }
    setError('');
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      let imageUrl: string | null = null;
      if (imageFile) {
        const filePath = `spots/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('spot-images').upload(filePath, imageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('spot-images').getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      const { error: insertError } = await supabase.from('spots').insert({
        title, description, image_url: imageUrl, user_id: session.user.id,
      });
      if (insertError) throw insertError;
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '投稿に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-600">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <span>📍</span>
            <span className="font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">SpotShare</span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">新しいスポットを投稿</h1>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              スポット名 <span className="text-fuchsia-500">*</span>
            </label>
            <input
              type="text" required value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-zinc-600"
              placeholder="例: 浅草 雷門"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              説明 <span className="text-fuchsia-500">*</span>
            </label>
            <textarea
              required rows={4} value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none placeholder:text-zinc-600"
              placeholder="このスポットの魅力を教えてください..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              写真 <span className="text-zinc-600 text-xs">（任意・2MB以下）</span>
            </label>
            {preview ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="プレビュー" className="w-full h-52 object-cover rounded-xl" />
                <button
                  type="button" onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black transition-colors text-lg leading-none"
                >×</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-violet-500 hover:bg-violet-500/5 transition-all">
                <span className="text-sm text-zinc-500">クリックして選択 または 貼り付け (Ctrl+V)</span>
                <span className="text-xs text-zinc-700 mt-1">PNG, JPG, WEBP（最大2MB）</span>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-800/50 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/" className="flex-1 text-center py-3 rounded-xl border border-zinc-700 text-sm text-zinc-400 hover:bg-zinc-800 transition-colors">
              キャンセル
            </Link>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'アップロード中...' : '投稿する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
