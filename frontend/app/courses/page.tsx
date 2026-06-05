'use client';

import { useEffect, useState } from 'react';
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

function CourseListContent() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  async function fetchCourses() {
    try {
      const data = await apiFetch('/api/courses/');
      setCourses(data);
    } catch {
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  async function handleEnroll(courseId: number) {
    setActionInProgress(courseId);
    try {
      await apiFetch(`/api/courses/${courseId}/enroll/`, { method: 'POST' });
      await fetchCourses();
    } catch {
      setError('Failed to join the course. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleLeave(courseId: number) {
    setActionInProgress(courseId);
    try {
      await apiFetch(`/api/courses/${courseId}/enroll/`, { method: 'DELETE' });
      await fetchCourses();
    } catch {
      setError('Failed to leave the course. Please try again.');
    } finally {
      setActionInProgress(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <p className="text-zinc-500">Loading courses…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Courses
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Browse and manage your courses
          </p>
        </div>
        {user?.role === 'instructor' && (
          <Link
            href="/courses/new"
            className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            + New Course
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}

      {courses.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">No courses available yet.</p>
          {user?.role === 'instructor' && (
            <Link
              href="/courses/new"
              className="mt-4 inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Create the first course
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex-1 p-6">
                <h2 className="mb-2 text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                  {course.title}
                </h2>
                <p className="mb-4 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {course.description || 'No description provided.'}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  Instructor: {course.instructor.username}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-zinc-100 p-4 dark:border-zinc-800">
                {course.is_owner ? (
                  // Instructor who owns this course
                  <Link
                    href={`/courses/${course.id}`}
                    className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    Manage
                  </Link>
                ) : course.is_enrolled ? (
                  // Enrolled student
                  <>
                    <Link
                      href={`/courses/${course.id}`}
                      className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleLeave(course.id)}
                      disabled={actionInProgress === course.id}
                      className="inline-flex items-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950"
                    >
                      {actionInProgress === course.id ? 'Leaving…' : 'Leave'}
                    </button>
                  </>
                ) : user?.role === 'instructor' ? (
                  // Instructor viewing someone else's course — can only view
                  <Link
                    href={`/courses/${course.id}`}
                    className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    View
                  </Link>
                ) : (
                  // Student not enrolled
                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={actionInProgress === course.id}
                    className="inline-flex items-center rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  >
                    {actionInProgress === course.id ? 'Joining…' : 'Join'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <RequireAuth>
      <CourseListContent />
    </RequireAuth>
  );
}
