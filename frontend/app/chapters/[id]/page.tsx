'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Value } from 'platejs';
import { apiFetch } from '@/lib/api';
import { RequireAuth } from '@/context/AuthContext';
import PlateEditor from '@/components/PlateEditor';

interface Chapter {
  id: number;
  course: number;
  title: string;
  content: Value;
  is_public: boolean;
  order: number;
}

function ChapterReadContent() {
  const { id } = useParams<{ id: string }>();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [courseId, setCourseId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data: Chapter = await apiFetch(`/api/chapters/${id}/`);
        setChapter(data);
        setCourseId(data.course);
      } catch (err) {
        if (err instanceof Response && err.status === 403) {
          setDenied(true);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-zinc-500">Loading chapter…</p>
      </div>
    );
  }

  if (denied || !chapter) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Access Denied
          </p>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            This chapter is private or you are not enrolled in the course.
          </p>
          {courseId ? (
            <Link
              href={`/courses/${courseId}`}
              className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Back to Course
            </Link>
          ) : (
            <Link
              href="/courses"
              className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Browse Courses
            </Link>
          )}
        </div>
      </div>
    );
  }

  const content: Value = Array.isArray(chapter.content) && chapter.content.length > 0
    ? chapter.content
    : [{ type: 'p', children: [{ text: '' }] }];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href={`/courses/${chapter.course}`}
        className="mb-6 inline-flex items-center text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        &larr; Back to Course
      </Link>

      <div className="mb-8">
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Chapter {chapter.order}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {chapter.title}
        </h1>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <PlateEditor key={id} readOnly value={content} />
      </div>
    </div>
  );
}

export default function ChapterPage() {
  return (
    <RequireAuth>
      <ChapterReadContent />
    </RequireAuth>
  );
}
