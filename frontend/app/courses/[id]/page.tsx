'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth, RequireAuth } from '@/context/AuthContext';

interface CourseInstructor {
  id: number;
  username: string;
  email: string;
  role: 'instructor' | 'student';
}

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: CourseInstructor;
  created_at: string;
  is_owner: boolean;
  is_enrolled: boolean;
}

interface Chapter {
  id: number;
  course: number;
  title: string;
  content: string;
  is_public: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

function CourseDetailContent() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [courseLoading, setCourseLoading] = useState(true);
  const [chaptersLoading, setChaptersLoading] = useState(true);
  const [chaptersAccessDenied, setChaptersAccessDenied] = useState(false);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    async function loadCourse() {
      try {
        const data: Course = await apiFetch(`/api/courses/${id}/`);
        setCourse(data);
      } catch {
        setError('Failed to load course. It may not exist or you may not have access.');
      } finally {
        setCourseLoading(false);
      }
    }

    async function loadChapters() {
      try {
        const data: Chapter[] = await apiFetch(`/api/courses/${id}/chapters/`);
        setChapters(data);
        setChaptersAccessDenied(false);
      } catch (err) {
        if (err instanceof Response && err.status === 403) {
          setChaptersAccessDenied(true);
        }
        // For any other error we still mark loading done
      } finally {
        setChaptersLoading(false);
      }
    }

    loadCourse();
    loadChapters();
  }, [id]);

  async function handleEnroll() {
    setEnrolling(true);
    try {
      await apiFetch(`/api/courses/${id}/enroll/`, { method: 'POST' });
      // Re-fetch both course and chapters after enrollment
      const [updatedCourse, updatedChapters] = await Promise.all([
        apiFetch(`/api/courses/${id}/`) as Promise<Course>,
        apiFetch(`/api/courses/${id}/chapters/`) as Promise<Chapter[]>,
      ]);
      setCourse(updatedCourse);
      setChapters(updatedChapters);
      setChaptersAccessDenied(false);
    } catch {
      setError('Failed to join the course. Please try again.');
    } finally {
      setEnrolling(false);
    }
  }

  if (courseLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-zinc-500">Loading course…</p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
        <Link
          href="/courses"
          className="mt-4 inline-flex items-center text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          &larr; Back to Courses
        </Link>
      </div>
    );
  }

  if (!course) return null;

  const isOwner = course.is_owner;
  const isEnrolled = course.is_enrolled;
  const notEnrolled = !isOwner && !isEnrolled;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/courses"
        className="mb-6 inline-flex items-center text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        &larr; Back to Courses
      </Link>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Course header */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              {course.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              by {course.instructor.username}
            </p>
          </div>
          {isOwner && (
            <Link
              href={`/courses/${course.id}/edit`}
              className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Edit Course
            </Link>
          )}
        </div>
        {course.description && (
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {course.description}
          </p>
        )}
      </div>

      {/* Chapters section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Chapters</h2>
          {isOwner && (
            <Link
              href={`/courses/${course.id}/chapters/new`}
              className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              + Add Chapter
            </Link>
          )}
        </div>

        {/* Not enrolled CTA */}
        {notEnrolled && (chaptersAccessDenied || !chaptersLoading) && (
          <div className="rounded-xl border border-zinc-200 bg-white py-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-4 text-zinc-600 dark:text-zinc-400">
              Join this course to access chapters
            </p>
            {user?.role === 'student' && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {enrolling ? 'Joining…' : 'Join Course'}
              </button>
            )}
          </div>
        )}

        {/* Loading chapters */}
        {chaptersLoading && !notEnrolled && (
          <p className="text-sm text-zinc-500">Loading chapters…</p>
        )}

        {/* Chapter list — for owner (instructor) */}
        {isOwner && !chaptersLoading && chapters.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No chapters yet.{' '}
              <Link
                href={`/courses/${course.id}/chapters/new`}
                className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
              >
                Add the first chapter.
              </Link>
            </p>
          </div>
        )}

        {isOwner && chapters.length > 0 && (
          <ul className="flex flex-col gap-3">
            {chapters.map((chapter) => (
              <li
                key={chapter.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400">{chapter.order}.</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {chapter.title}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      chapter.is_public
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {chapter.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
                <Link
                  href={`/chapters/${chapter.id}/edit`}
                  className="text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Chapter list — for enrolled student */}
        {isEnrolled && !isOwner && !chaptersLoading && chapters.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No chapters available yet.
            </p>
          </div>
        )}

        {isEnrolled && !isOwner && chapters.length > 0 && (
          <ul className="flex flex-col gap-3">
            {chapters.map((chapter) => (
              <li
                key={chapter.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400">{chapter.order}.</span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {chapter.title}
                  </span>
                </div>
                <Link
                  href={`/chapters/${chapter.id}`}
                  className="text-xs font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Read
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function CourseDetailPage() {
  return (
    <RequireAuth>
      <CourseDetailContent />
    </RequireAuth>
  );
}
