'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Value } from 'platejs';
import { apiFetch } from '@/lib/api';
import { RequireAuth } from '@/context/AuthContext';
import PlateEditor from '@/components/PlateEditor';

const EMPTY_CONTENT: Value = [{ type: 'p', children: [{ text: '' }] }];

function NewChapterContent() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Value>(EMPTY_CONTENT);
  const [isPublic, setIsPublic] = useState(false);
  const [order, setOrder] = useState(1);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/api/courses/${courseId}/chapters/`, {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content,
          is_public: isPublic,
          order,
        }),
      });
      router.push(`/courses/${courseId}`);
    } catch {
      setError('Failed to create chapter. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/courses/${courseId}`}
        className="mb-6 inline-flex items-center text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        &larr; Back to Course
      </Link>

      <h1 className="mb-8 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Add Chapter
      </h1>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <label
              htmlFor="title"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-50"
              placeholder="e.g. Introduction"
              required
            />
          </div>
          <div className="w-24">
            <label
              htmlFor="order"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Order
            </label>
            <input
              id="order"
              type="number"
              min={1}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Content
          </label>
          <PlateEditor value={content} onChange={setContent} />
        </div>

        <div className="flex items-center gap-3">
          <input
            id="is_public"
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-800"
          />
          <label
            htmlFor="is_public"
            className="text-sm text-zinc-700 dark:text-zinc-300"
          >
            Public (visible without enrollment)
          </label>
        </div>

        <div className="flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? 'Creating…' : 'Create Chapter'}
          </button>
          <Link
            href={`/courses/${courseId}`}
            className="text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function NewChapterPage() {
  return (
    <RequireAuth>
      <NewChapterContent />
    </RequireAuth>
  );
}
