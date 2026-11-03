import React, { useState, useEffect, useMemo } from 'react'
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

export interface QuizResultHistory {
  id: string
  user_id: string
  subject_id: string
  score: number
  total_questions: number
  timestamp: string
  subjects?: {
    name: string
    code: string
    icon?: string | null
  } | null
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<{
    id: string
    email?: string
    full_name?: string
  } | null>(null)

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [quizHistory, setQuizHistory] = useState<QuizResultHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(true)

  // Fetch subjects for CBT selection
  const fetchSubjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchErr } = await supabase
        .from('subjects')
        .select('*')
        .order('is_compulsory', { ascending: false })
        .order('name', { ascending: true })

      if (fetchErr) throw fetchErr

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
      setError(
        e.message ||
          'Failed to load subjects from the database. Check your connection or Supabase settings.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Fetch candidate authentication and performance history
  const fetchCandidateDataAndHistory = async () => {
    setLoadingHistory(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Enforce strict protection: guest candidates are redirected to landing with signup highlight
        navigate('/?auth=signup')
        return
      }

      // Read profile for greeting
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, track')
        .eq('id', user.id)
        .maybeSingle()

      setCurrentUser({
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || 'Candidate',
      })

      // Query public.quiz_results for the active user:
      // .from('quiz_results').select('*, subjects(name, code, icon)').eq('user_id', user.id).order('timestamp', { ascending: false })
      const { data, error: histErr } = await supabase
        .from('quiz_results')
        .select('*, subjects(name, code, icon)')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })

      if (histErr) {
        console.error('Error fetching quiz history:', histErr)
      } else {
        setQuizHistory((data as unknown as QuizResultHistory[]) || [])
      }
    } catch (err) {
      console.error('Error loading candidate history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
    fetchCandidateDataAndHistory()
  }, [])

  // Performance Metric Summaries
  const totalTestsCompleted = quizHistory.length

  const { totalScoreSum, totalQuestionsSum } = useMemo(() => {
    let scoreSum = 0
    let questionsSum = 0
    quizHistory.forEach((item) => {
      scoreSum += item.score
      questionsSum += item.total_questions
    })
    return { totalScoreSum: scoreSum, totalQuestionsSum: questionsSum }
  }, [quizHistory])

  // Aggregate percentage score
  const averageScorePercentage = useMemo(() => {
    if (totalQuestionsSum === 0) return 0
    return Math.round((totalScoreSum / totalQuestionsSum) * 100)
  }, [totalScoreSum, totalQuestionsSum])

  // Calculated estimated UTME aggregate score based on past performance (out of 400)
  const utme400Estimate = useMemo(() => {
    if (totalQuestionsSum === 0) return 0
    return Math.round((totalScoreSum / totalQuestionsSum) * 400)
  }, [totalScoreSum, totalQuestionsSum])

  // Performance badge helper: Distinction, Pass, Needs Review
  const getPerformanceBadge = (score: number, total: number) => {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    if (pct >= 75) {
      return {
        label: 'Distinction',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotClass: 'bg-emerald-500',
      }
    }
    if (pct >= 50) {
      return {
        label: 'Pass',
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
        dotClass: 'bg-blue-500',
      }
    }
    return {
      label: 'Needs Review',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      dotClass: 'bg-amber-500',
    }
  }

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

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
    <div className="py-6 sm:py-10 px-4 max-w-5xl mx-auto space-y-8">
      {/* Candidate Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Candidate Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome, {currentUser?.full_name || 'Candidate'}!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 font-mono">
            {currentUser?.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStartExam}
            disabled={selectedSubjects.length !== 4 || loading}
            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
              selectedSubjects.length === 4 && !loading
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Launch CBT Exam →
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. PERFORMANCE ANALYTICS HEADER                                           */}
      {/* ========================================================================= */}
      <div>
        <div className="mb-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">
            Performance Analytics
          </h2>
          <p className="text-xs text-gray-500">
            Real-time aggregate performance tracking across your completed mock drills.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Tests Completed */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center shrink-0 border border-emerald-100">
              🎓
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-gray-500">
                Total Tests Completed
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono mt-0.5">
                {totalTestsCompleted}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {totalTestsCompleted === 1
                  ? '1 drill attempt saved'
                  : `${totalTestsCompleted} drill attempts saved`}
              </div>
            </div>
          </div>

          {/* Average Score (%) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 text-2xl flex items-center justify-center shrink-0 border border-blue-100">
              📈
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-gray-500">
                Average Score (%)
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 font-mono mt-0.5">
                {averageScorePercentage}%
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {totalQuestionsSum > 0
                  ? `${totalScoreSum} / ${totalQuestionsSum} correct overall`
                  : 'No drills taken yet'}
              </div>
            </div>
          </div>

          {/* UTME 400-Point Estimate */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 text-2xl flex items-center justify-center shrink-0 border border-purple-100">
              🎯
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold tracking-wider text-gray-500">
                UTME 400-Point Estimate
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 font-mono mt-0.5">
                {utme400Estimate} <span className="text-xs font-normal text-gray-400">/ 400</span>
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Calculated JAMB projection
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RECENT TEST ATTEMPTS SECTION                                          */}
      {/* ========================================================================= */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Recent Test Attempts
            </h2>
            <p className="text-xs text-gray-500">
              Detailed performance history and grading for past CBT drills.
            </p>
          </div>
          {quizHistory.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full border border-gray-200">
              {quizHistory.length} Recorded
            </span>
          )}
        </div>

        {loadingHistory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-gray-200 bg-white animate-pulse h-32"
              >
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        ) : quizHistory.length === 0 ? (
          /* Clean Empty State Card */
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-gray-300 shadow-2xs">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs border border-emerald-100">
              📊
            </div>
            <h3 className="text-base font-bold text-gray-900">No Exam Attempts Yet</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
              Select 4 subjects below and click <strong>'Launch CBT Exam'</strong> to take your first mock drill. Your test history, subject breakdown, and UTME 400-point projections will be recorded here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizHistory.slice(0, 6).map((attempt) => {
              const pct =
                attempt.total_questions > 0
                  ? Math.round((attempt.score / attempt.total_questions) * 100)
                  : 0
              const badge = getPerformanceBadge(attempt.score, attempt.total_questions)
              const subjectName = attempt.subjects?.name || 'Subject Drill'
              const subjectIcon = attempt.subjects?.icon || '📖'
              const subjectCode = attempt.subjects?.code || 'UTME'

              return (
                <div
                  key={attempt.id}
                  className="p-4 rounded-xl border border-gray-200 bg-white shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{subjectIcon}</span>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            {subjectCode}
                          </span>
                          <h4
                            className="text-sm font-bold text-gray-900 line-clamp-1"
                            title={subjectName}
                          >
                            {subjectName}
                          </h4>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0 ${badge.badgeClass}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`}></span>
                        {badge.label}
                      </span>
                    </div>

                    <div className="my-3 flex items-baseline justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-xs text-slate-500 font-medium">Score:</span>
                      <div className="text-right">
                        <span className="font-mono text-base font-extrabold text-emerald-700">
                          {attempt.score} / {attempt.total_questions}
                        </span>
                        <span className="text-xs font-bold text-slate-700 ml-1.5">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-gray-400 flex items-center justify-between pt-2 border-t border-gray-100">
                    <span>Date:</span>
                    <span className="font-medium text-gray-600">
                      {formatDate(attempt.timestamp)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SUBJECT SELECTION GRID SECTION                                         */}
      {/* ========================================================================= */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Subject Selection
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-gray-600">
              Choose exactly 4 subjects for your next UTME simulation exam.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold bg-gray-100 text-gray-800">
              Selected:{' '}
              <strong className="ml-1 text-emerald-600">
                {selectedSubjects.length} / 4
              </strong>
            </span>
          </div>
        </div>

        {/* Notice Bar */}
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3">
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
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
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
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg cursor-pointer"
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

        {/* Action Footer */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
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

      {/* Monetization AdBanner */}
      <div className="pt-2">
        <AdBanner slot="1001001002" format="horizontal" />
      </div>
    </div>
  )
}

export default Dashboard
