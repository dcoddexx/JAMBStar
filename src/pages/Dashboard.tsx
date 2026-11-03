import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AdBanner } from '../components/AdBanner'

export interface Subject {
  id: string
  name: string
  code: string
  description?: string | null
  icon?: string | null
  is_compulsory?: boolean
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('subjects')
        .select('*')
        .order('is_compulsory', { ascending: false })
        .order('name', { ascending: true })

      if (fetchErr) {
        throw fetchErr
      }

      if (data && data.length > 0) {
        setSubjects(data)
        // Automatically preselect compulsory subject(s) + other subjects up to 4
        const compulsoryIds = data.filter((s) => s.is_compulsory).map((s) => s.id)
        const electiveIds = data
          .filter((s) => !s.is_compulsory)
          .slice(0, Math.max(0, 4 - compulsoryIds.length))
          .map((s) => s.id)

        setSelectedSubjects([...compulsoryIds, ...electiveIds])
      } else {
        setSubjects([])
      }
    } catch (err: unknown) {
      const e = err as Error
      console.error('Failed to fetch subjects from Supabase:', e)
      setError(e.message || 'Failed to load subjects from the database. Check your connection or Supabase settings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  const toggleSubject = (id: string, compulsory?: boolean) => {
    if (compulsory) return
    if (selectedSubjects.includes(id)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== id))
    } else {
      if (selectedSubjects.length < 4) {
        setSelectedSubjects([...selectedSubjects, id])
      }
    }
  }

  const handleStartExam = () => {
    const chosenSubjects = subjects.filter((s) => selectedSubjects.includes(s.id))
    navigate('/quiz', {
      state: {
        selectedSubjectIds: selectedSubjects,
        selectedSubjects: chosenSubjects,
      },
    })
  }

  return (
    <div className="py-6 sm:py-10 px-4 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Subject Selection
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Choose exactly 4 subjects for your UTME simulation exam.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-gray-100 text-gray-800">
            Selected: <strong className="ml-1 text-emerald-600">{selectedSubjects.length} / 4</strong>
          </span>
          <button
            onClick={handleStartExam}
            disabled={selectedSubjects.length !== 4 || loading}
            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
              selectedSubjects.length === 4 && !loading
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Launch CBT Exam →
          </button>
        </div>
      </div>

      {/* Notice Bar */}
      <div className="my-6 p-4 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-3">
        <span className="text-blue-500 text-xl leading-none">ℹ️</span>
        <div className="text-xs sm:text-sm text-blue-800">
          <strong>JAMB Requirement:</strong> Use of English is compulsory for all candidates. Select 3 additional relevant subjects based on your desired course of study.
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={fetchSubjects}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse flex flex-col justify-between h-32"
            >
              <div className="flex justify-between items-start">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-3 bg-gray-200 rounded"></div>
                <div className="w-28 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        /* Empty State */
        <div className="p-8 text-center bg-white rounded-xl border border-gray-200">
          <span className="text-4xl">📚</span>
          <h3 className="mt-3 text-lg font-bold text-gray-900">No Subjects Found</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            The subjects table in your Supabase database is currently empty. Run the schema seed script in Supabase to populate UTME subjects.
          </p>
          <button
            onClick={fetchSubjects}
            className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg"
          >
            Refresh Subjects
          </button>
        </div>
      ) : (
        /* Live Subject Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subjects.map((subject) => {
            const isSelected = selectedSubjects.includes(subject.id)
            const isAtLimit = selectedSubjects.length >= 4 && !isSelected

            return (
              <div
                key={subject.id}
                onClick={() => toggleSubject(subject.id, subject.is_compulsory)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                  subject.is_compulsory
                    ? 'border-emerald-500 bg-emerald-50/50 cursor-default'
                    : isSelected
                    ? 'border-emerald-600 bg-emerald-50 cursor-pointer shadow-sm'
                    : isAtLimit
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{subject.icon || '📖'}</span>
                  {subject.is_compulsory ? (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-800">
                      Compulsory
                    </span>
                  ) : (
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {subject.code}
                  </span>
                  <h3 className="text-base font-semibold text-gray-900 mt-0.5">
                    {subject.name}
                  </h3>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Monetization AdBanner */}
      <div className="mt-8">
        <AdBanner slot="1001001002" format="horizontal" />
      </div>

      {/* Action Footer */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
        <Link
          to="/"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Return to Landing
        </Link>
        <button
          onClick={handleStartExam}
          disabled={selectedSubjects.length !== 4 || loading}
          className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            selectedSubjects.length === 4 && !loading
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Proceed to CBT ({selectedSubjects.length}/4 Selected)
        </button>
      </div>
    </div>
  )
}

export default Dashboard
