import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AdBanner } from '../components/AdBanner'

export interface Question {
  id: string
  subject_id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_option: 'A' | 'B' | 'C' | 'D'
  explanation?: string | null
  exam_year?: number | null
  image_url?: string | null
}

export interface Subject {
  id: string
  name: string
  code: string
  icon?: string | null
}

interface SubjectScore {
  subjectId: string
  subjectName: string
  score: number
  total: number
}

interface QuizSubmissionResult {
  totalScore: number
  totalQuestions: number
  percentage: number
  utmeScaleScore: number
  subjectScores: SubjectScore[]
  savedToDatabase: boolean
  isGuest: boolean
  errorMessage?: string | null
}

export const Quiz: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Routing navigation state
  const stateData = location.state as
    | { selectedSubjectIds?: string[]; selectedSubjects?: Subject[] }
    | undefined

  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [activeSubjectId, setActiveSubjectId] = useState<string>('')
  const [questionsBySubject, setQuestionsBySubject] = useState<Record<string, Question[]>>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({})
  const [candidateUser, setCandidateUser] = useState<{ id: string; email?: string } | null>(null)

  // Dynamic Countdown Timer State (defaults to 7200 seconds = 2-hour UTME mock or reads examDuration from jambstar_cbt_settings)
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('jambstar_cbt_settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (typeof parsed.examDuration === 'number' && parsed.examDuration > 0) {
          return Math.round(parsed.examDuration * 60)
        }
      }
    } catch {
      // fallback
    }
    return 7200
  })

  // Confirmation Modals State
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false)
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false)

  // Submission & Scoring State
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [showResultModal, setShowResultModal] = useState<boolean>(false)
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null)
  const [reviewMode, setReviewMode] = useState<boolean>(false)
  const isSubmittingRef = useRef<boolean>(false)

  // Load questions and subjects from Supabase
  useEffect(() => {
    const initializeQuiz = async () => {
      setLoading(true)
      setError(null)

      try {
        // Check current authenticated user session
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setCandidateUser({ id: user.id, email: user.email })
        }

        let targetSubjects: Subject[] = []
        let targetSubjectIds: string[] = []

        // If subjects were passed via React Router location state from Dashboard
        if (stateData?.selectedSubjects && stateData.selectedSubjects.length > 0) {
          targetSubjects = stateData.selectedSubjects
          targetSubjectIds = stateData.selectedSubjectIds || targetSubjects.map((s) => s.id)
        } else {
          // Fallback: Fetch default subjects directly from Supabase
          const { data: subData, error: subErr } = await supabase
            .from('subjects')
            .select('id, name, code, icon, is_compulsory')
            .order('is_compulsory', { ascending: false })
            .limit(4)

          if (subErr) throw subErr

          if (subData && subData.length > 0) {
            targetSubjects = subData
            targetSubjectIds = subData.map((s) => s.id)
          } else {
            throw new Error('No subjects found in the database. Please initialize subjects first.')
          }
        }

        setSubjects(targetSubjects)

        // Fetch live questions from Supabase for the candidate's selected subjects
        const { data: questionsData, error: qErr } = await supabase
          .from('questions')
          .select('*')
          .in('subject_id', targetSubjectIds)
          .order('created_at', { ascending: true })

        if (qErr) throw qErr

        // Group questions by subject_id
        const grouped: Record<string, Question[]> = {}
        targetSubjectIds.forEach((id) => {
          grouped[id] = []
        })

        if (questionsData && questionsData.length > 0) {
          questionsData.forEach((q: Question) => {
            if (!grouped[q.subject_id]) {
              grouped[q.subject_id] = []
            }
            grouped[q.subject_id].push(q)
          })
        }

        setQuestionsBySubject(grouped)

        // Set active subject to the first subject
        if (targetSubjects.length > 0) {
          setActiveSubjectId(targetSubjects[0].id)
        }
      } catch (err: unknown) {
        const e = err as Error
        console.error('Error initializing CBT quiz:', e)
        setError(e.message || 'Failed to load quiz data from Supabase.')
      } finally {
        setLoading(false)
      }
    }

    initializeQuiz()
  }, [])

  // Active Subject & Questions
  const activeSubject = useMemo(() => {
    return subjects.find((s) => s.id === activeSubjectId) || subjects[0]
  }, [subjects, activeSubjectId])

  const activeQuestions = useMemo(() => {
    return activeSubject ? questionsBySubject[activeSubject.id] || [] : []
  }, [questionsBySubject, activeSubject])

  const currentQ = activeQuestions[currentQuestionIndex]

  const currentSubjectIndex = useMemo(() => {
    return subjects.findIndex((s) => s.id === activeSubjectId)
  }, [subjects, activeSubjectId])

  const isLastQuestionOfSubject = currentQuestionIndex >= activeQuestions.length - 1
  const isLastSubject = currentSubjectIndex >= subjects.length - 1
  const isFirstQuestionOfSubject = currentQuestionIndex === 0
  const isFirstSubject = currentSubjectIndex <= 0

  // Total summary counts across all subjects
  const totalQuestionsCount = useMemo(() => {
    return Object.values(questionsBySubject).reduce((acc, arr) => acc + arr.length, 0)
  }, [questionsBySubject])

  const answeredQuestionsCount = useMemo(() => {
    return Object.keys(selectedAnswers).length
  }, [selectedAnswers])

  const flaggedQuestionsCount = useMemo(() => {
    return Object.values(markedForReview).filter(Boolean).length
  }, [markedForReview])

  // Format seconds into clean HH:MM:SS string
  const formatTime = (seconds: number): string => {
    const clamped = Math.max(0, seconds)
    const hours = Math.floor(clamped / 3600)
    const minutes = Math.floor((clamped % 3600) / 60)
    const secs = clamped % 60
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle option selection (A, B, C, D)
  const handleSelectOption = useCallback(
    (optionKey: string) => {
      if (!currentQ || reviewMode) return
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQ.id]: optionKey,
      }))
    },
    [currentQ, reviewMode]
  )

  // Toggle question review flag
  const handleToggleReview = useCallback(() => {
    if (!currentQ) return
    setMarkedForReview((prev) => ({
      ...prev,
      [currentQ.id]: !prev[currentQ.id],
    }))
  }, [currentQ])

  // Seamless Next Navigation: switches to next subject when last question of subject is reached
  const handleNextQuestion = useCallback(() => {
    if (!isLastQuestionOfSubject) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else if (!isLastSubject && subjects[currentSubjectIndex + 1]) {
      const nextSubj = subjects[currentSubjectIndex + 1]
      setActiveSubjectId(nextSubj.id)
      setCurrentQuestionIndex(0)
    }
  }, [isLastQuestionOfSubject, isLastSubject, subjects, currentSubjectIndex])

  // Seamless Previous Navigation
  const handlePrevQuestion = useCallback(() => {
    if (!isFirstQuestionOfSubject) {
      setCurrentQuestionIndex((prev) => prev - 1)
    } else if (!isFirstSubject && subjects[currentSubjectIndex - 1]) {
      const prevSubj = subjects[currentSubjectIndex - 1]
      setActiveSubjectId(prevSubj.id)
      const prevSubjQuestions = questionsBySubject[prevSubj.id] || []
      setCurrentQuestionIndex(Math.max(0, prevSubjQuestions.length - 1))
    }
  }, [isFirstQuestionOfSubject, isFirstSubject, subjects, currentSubjectIndex, questionsBySubject])

  // Calculate score and submit to Supabase quiz_results table
  const handleFinalSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setSubmitting(true)
    setShowSubmitConfirmModal(false)

    try {
      let totalScore = 0
      let totalQuestions = 0

      const subjectScores: SubjectScore[] = subjects.map((subj) => {
        const subjQuestions = questionsBySubject[subj.id] || []
        let correctCount = 0

        subjQuestions.forEach((q) => {
          if (selectedAnswers[q.id] === q.correct_option) {
            correctCount++
          }
        })

        totalScore += correctCount
        totalQuestions += subjQuestions.length

        return {
          subjectId: subj.id,
          subjectName: subj.name,
          score: correctCount,
          total: subjQuestions.length,
        }
      })

      const percentage =
        totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0
      const utmeScaleScore =
        totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 400) : 0

      let savedToDatabase = false
      let errorMessage: string | null = null

      // Check user authentication
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Insert results into quiz_results table
        const rowsToInsert = subjectScores
          .filter((s) => s.total > 0)
          .map((s) => ({
            user_id: user.id,
            subject_id: s.subjectId,
            score: s.score,
            total_questions: s.total,
            timestamp: new Date().toISOString(),
          }))

        if (rowsToInsert.length > 0) {
          const { error: insertErr } = await supabase
            .from('quiz_results')
            .insert(rowsToInsert)

          if (insertErr) {
            console.error('Supabase insertion error:', insertErr)
            errorMessage = insertErr.message
          } else {
            savedToDatabase = true
          }
        }
      }

      setSubmissionResult({
        totalScore,
        totalQuestions,
        percentage,
        utmeScaleScore,
        subjectScores,
        savedToDatabase,
        isGuest: !user,
        errorMessage,
      })

      setShowResultModal(true)
    } catch (err: unknown) {
      const e = err as Error
      console.error('Submission error:', e)
      alert(`Submission failed: ${e.message}`)
    } finally {
      setSubmitting(false)
      isSubmittingRef.current = false
    }
  }, [subjects, questionsBySubject, selectedAnswers])

  // Countdown Timer Effect: decrements timeLeft every second when exam is active
  useEffect(() => {
    // Freeze countdown if loading, already submitted, or in review mode
    if (loading || reviewMode || submissionResult !== null) return

    if (timeLeft <= 0) {
      // Auto-submit when time expires
      if (!submitting && !submissionResult && !isSubmittingRef.current) {
        handleFinalSubmit()
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [loading, reviewMode, submissionResult, timeLeft, submitting, handleFinalSubmit])

  // Global Keydown Event Listener for JAMB 8-Key Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ensure keyboard shortcuts are ignored if reviewMode is active or loading
      if (reviewMode || loading) return

      // 2. Ensure keyboard shortcuts are ignored if user is typing inside an input field
      const target = e.target as HTMLElement | null
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      if (isTyping) return

      // 3. Ignore shortcuts if result modal or exit confirmation modal is open
      if (showResultModal || showExitConfirmModal) return

      const key = e.key.toUpperCase()

      // If submission confirmation modal is open:
      if (showSubmitConfirmModal) {
        if (key === 'ESCAPE') {
          e.preventDefault()
          setShowSubmitConfirmModal(false)
        } else if (key === 'ENTER') {
          e.preventDefault()
          handleFinalSubmit()
        }
        return
      }

      // Map keys A, B, C, D (case-insensitive) to select options for active question
      if (['A', 'B', 'C', 'D'].includes(key)) {
        e.preventDefault()
        handleSelectOption(key)
        return
      }

      // Map P to navigate to Previous question
      if (key === 'P') {
        e.preventDefault()
        handlePrevQuestion()
        return
      }

      // Map N to navigate to Next question
      if (key === 'N') {
        e.preventDefault()
        handleNextQuestion()
        return
      }

      // Map R to toggle 'Flag for Review' state
      if (key === 'R') {
        e.preventDefault()
        handleToggleReview()
        return
      }

      // Map S to trigger exam submission confirmation modal
      if (key === 'S') {
        e.preventDefault()
        setShowSubmitConfirmModal(true)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    reviewMode,
    loading,
    showResultModal,
    showExitConfirmModal,
    showSubmitConfirmModal,
    handleSelectOption,
    handlePrevQuestion,
    handleNextQuestion,
    handleToggleReview,
    handleFinalSubmit,
  ])

  // Loading State UI
  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <h2 className="mt-6 text-xl font-bold text-gray-900">
          Loading Examination Questions
        </h2>
        <p className="mt-2 text-sm text-gray-500 max-w-sm">
          Fetching verified UTME past questions and options from Supabase...
        </p>
      </div>
    )
  }

  // Error State UI
  if (error) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-red-200 text-center shadow-sm">
        <span className="text-4xl">⚠️</span>
        <h2 className="mt-3 text-xl font-bold text-gray-900">Examination Load Error</h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
          >
            Return to Dashboard
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Empty questions fallback
  const totalQuestionsLoaded = Object.values(questionsBySubject).reduce(
    (acc, arr) => acc + arr.length,
    0
  )

  if (totalQuestionsLoaded === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-gray-200 text-center shadow-sm">
        <span className="text-4xl">📝</span>
        <h2 className="mt-3 text-xl font-bold text-gray-900">No Questions Available</h2>
        <p className="mt-2 text-sm text-gray-500">
          There are currently no questions recorded in the Supabase questions table for your selected subjects.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
          >
            Select Different Subjects
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 sm:py-6 px-3 sm:px-6 max-w-6xl mx-auto flex flex-col gap-4">
      {/* Top CBT Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/jambstar_fav_icon.jpg"
            alt="JAMBStar Emblem"
            className="w-10 h-10 rounded-full object-cover border border-emerald-200 shadow-xs"
          />
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-gray-500">
              JAMB UTME CBT Simulator
            </div>
            <div className="text-sm sm:text-base font-bold text-gray-900">
              Candidate:{' '}
              <span className="font-mono text-emerald-700">
                {candidateUser?.email || 'Guest Candidate'}
              </span>
            </div>
          </div>
        </div>

        {/* Timer Box */}
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-colors ${
            reviewMode
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : timeLeft < 300
              ? 'bg-red-100 border-red-300 text-red-800 animate-pulse'
              : timeLeft < 900
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <span className="text-lg">{reviewMode ? '✓' : '⏱️'}</span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider">
              {reviewMode ? 'Status' : 'Time Remaining'}
            </div>
            <div className="font-mono text-xl sm:text-2xl font-bold leading-tight">
              {reviewMode ? 'Exam Completed' : formatTime(timeLeft)}
            </div>
          </div>
        </div>

        {/* Exit Exam Action */}
        <button
          type="button"
          onClick={() => {
            if (reviewMode) {
              navigate('/dashboard')
            } else {
              setShowExitConfirmModal(true)
            }
          }}
          className="text-xs sm:text-sm font-semibold text-gray-500 hover:text-red-700 transition-colors cursor-pointer underline sm:no-underline"
        >
          {reviewMode ? '← Back to Dashboard' : 'Exit Exam'}
        </button>
      </div>

      {/* Subject Tabs */}
      <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar border-b border-gray-200">
        {subjects.map((subj) => {
          const isActive = activeSubjectId === subj.id
          const count = questionsBySubject[subj.id]?.length || 0
          return (
            <button
              key={subj.id}
              onClick={() => {
                setActiveSubjectId(subj.id)
                setCurrentQuestionIndex(0)
              }}
              className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span>{subj.icon || '📖'}</span>
              <span>{subj.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-700 text-emerald-100' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Main Question & Question Palette Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Question Box (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-5 sm:p-7 shadow-sm flex flex-col justify-between min-h-[420px]">
          {currentQ ? (
            <div>
              {/* Question Header Bar */}
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
                <span className="text-sm font-bold text-emerald-700">
                  Question {currentQuestionIndex + 1} of {activeQuestions.length} ({activeSubject?.name})
                </span>
                {markedForReview[currentQ.id] && (
                  <span className="text-xs bg-amber-100 text-amber-800 font-medium px-2.5 py-1 rounded-full">
                    Flagged for Review
                  </span>
                )}
              </div>

              {/* Question Diagram / Image */}
              {currentQ.image_url && currentQ.image_url.trim() !== '' && (
                <img
                  src={currentQ.image_url}
                  alt={`Diagram for question ${currentQuestionIndex + 1}`}
                  className="max-w-full h-auto max-h-64 object-contain mb-4 rounded-md"
                />
              )}

              {/* Question Text */}
              <div className="text-base sm:text-lg text-gray-900 leading-relaxed font-medium">
                {currentQ.question_text}
              </div>

              {/* Option Choices */}
              <div className="mt-6 flex flex-col gap-3">
                {[
                  { key: 'A', text: currentQ.option_a },
                  { key: 'B', text: currentQ.option_b },
                  { key: 'C', text: currentQ.option_c },
                  { key: 'D', text: currentQ.option_d },
                ].map((opt) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.key
                  const isCorrectAnswer = currentQ.correct_option === opt.key

                  let optionStyle =
                    'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 text-gray-800'

                  if (reviewMode) {
                    if (isCorrectAnswer) {
                      optionStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold'
                    } else if (isSelected && !isCorrectAnswer) {
                      optionStyle = 'border-red-500 bg-red-50 text-red-950 line-through'
                    }
                  } else if (isSelected) {
                    optionStyle = 'border-emerald-600 bg-emerald-50/70 font-medium text-emerald-950'
                  }

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      disabled={reviewMode}
                      className={`flex items-start text-left p-3.5 sm:p-4 rounded-lg border-2 transition-all cursor-pointer ${optionStyle}`}
                    >
                      <span
                        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="mt-0.5 text-sm sm:text-base leading-snug">{opt.text}</span>
                    </button>
                  )
                })}
              </div>

              {/* Explanation in Review Mode */}
              {reviewMode && currentQ.explanation && (
                <div className="mt-5 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-900">
                  <strong>Explanation: </strong>
                  {currentQ.explanation}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No questions found for this subject.
            </div>
          )}

          {/* Navigation & Action Buttons */}
          <div className="mt-8 pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                disabled={isFirstQuestionOfSubject && isFirstSubject}
                onClick={handlePrevQuestion}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {isFirstQuestionOfSubject && !isFirstSubject
                  ? `← Prev Subject (${subjects[currentSubjectIndex - 1]?.code || 'Prev'})`
                  : '← Previous (P)'}
              </button>
              <button
                disabled={isLastQuestionOfSubject && isLastSubject}
                onClick={handleNextQuestion}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {isLastQuestionOfSubject && !isLastSubject
                  ? `Next Subject (${subjects[currentSubjectIndex + 1]?.code || 'Next'}) →`
                  : 'Next (N) →'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {!reviewMode && (
                <button
                  onClick={handleToggleReview}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                    currentQ && markedForReview[currentQ.id]
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {currentQ && markedForReview[currentQ.id] ? 'Unflag' : 'Mark Review (R)'}
                </button>
              )}

              {!reviewMode ? (
                <button
                  onClick={() => setShowSubmitConfirmModal(true)}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  {submitting ? 'Saving Results...' : 'Submit Exam (S)'}
                </button>
              ) : (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm cursor-pointer transition-colors"
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Question Palette & CBT 8-Key Instructions (1 col) */}
        <div className="flex flex-col gap-4">
          {/* Quick Palette */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h3 className="text-xs uppercase font-bold tracking-wider text-gray-500 mb-3">
              Question Palette ({activeSubject?.code || 'SUBJ'})
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2">
              {activeQuestions.map((q, idx) => {
                const isAnswered = !!selectedAnswers[q.id]
                const isFlagged = !!markedForReview[q.id]
                const isCurrent = idx === currentQuestionIndex

                let btnStyle = 'bg-gray-100 text-gray-700 border-gray-200'

                if (reviewMode) {
                  const isCorrect = selectedAnswers[q.id] === q.correct_option
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-600 text-white border-emerald-600'
                  } else if (isAnswered) {
                    btnStyle = 'bg-red-500 text-white border-red-500'
                  } else {
                    btnStyle = 'bg-gray-200 text-gray-400 border-gray-300'
                  }
                } else {
                  if (isAnswered) btnStyle = 'bg-emerald-600 text-white border-emerald-600'
                  if (isFlagged) btnStyle = 'bg-amber-500 text-white border-amber-500'
                }

                if (isCurrent) btnStyle += ' ring-2 ring-offset-2 ring-emerald-500'

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-lg font-bold text-xs border flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-1.5 text-[11px] text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
                <span>Flagged for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-gray-100 border border-gray-300 inline-block"></span>
                <span>Unattempted</span>
              </div>
            </div>
          </div>

          {/* AdSense Sidebar Ad Banner */}
          <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-xs">
            <AdBanner slot="1001001003" format="rectangle" label="Sponsored" />
          </div>

          {/* JAMB 8-Key CBT Reference */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs text-slate-700">
            <h4 className="font-bold text-slate-900 mb-2">JAMB 8-Key Shortcuts</h4>
            <ul className="space-y-1 font-mono text-[11px]">
              <li>
                <strong className="text-slate-900">A, B, C, D:</strong> Select option
              </li>
              <li>
                <strong className="text-slate-900">P / N:</strong> Previous / Next
              </li>
              <li>
                <strong className="text-slate-900">R:</strong> Review question
              </li>
              <li>
                <strong className="text-slate-900">S:</strong> Submit session
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Result & Submission Modal */}
      {showResultModal && submissionResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 text-3xl flex items-center justify-center mx-auto mb-4">
              🎓
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900">Exam Results</h2>
            <p className="text-xs text-gray-500 mt-1">
              JAMB UTME CBT Performance Breakdown
            </p>

            {/* Score Showcase */}
            <div className="my-6 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl">
              <div className="text-xs uppercase tracking-wider font-bold text-emerald-800">
                Estimated UTME Aggregate Score
              </div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-700 my-1 font-mono">
                {submissionResult.utmeScaleScore} <span className="text-xl text-emerald-500 font-normal">/ 400</span>
              </div>
              <div className="text-sm font-semibold text-emerald-900">
                {submissionResult.totalScore} of {submissionResult.totalQuestions} questions correct ({submissionResult.percentage}%)
              </div>
            </div>

            {/* Subject Breakdown List */}
            <div className="text-left space-y-2 mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Subject Performance
              </div>
              {submissionResult.subjectScores.map((s) => {
                const subPct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0
                return (
                  <div
                    key={s.subjectId}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs sm:text-sm"
                  >
                    <span className="font-semibold text-gray-800">{s.subjectName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-700">
                        {s.score} / {s.total}
                      </span>
                      <span className="text-gray-400 font-medium">({subPct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Database Persistence Status */}
            <div className="mb-6 p-3 rounded-lg text-xs font-medium">
              {submissionResult.savedToDatabase ? (
                <div className="text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>Successfully saved score to your Supabase candidate profile!</span>
                </div>
              ) : submissionResult.isGuest ? (
                <div className="text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                  Practice mode (Guest candidate). Sign in to permanently save your score history to Supabase.
                </div>
              ) : (
                <div className="text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                  Failed to write to database: {submissionResult.errorMessage}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowResultModal(false)
                  setReviewMode(true)
                  setCurrentQuestionIndex(0)
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Review Answers & Explanations
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Exam Confirmation Modal */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 text-2xl flex items-center justify-center mx-auto mb-4">
              ⚠️
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">
              Abandon & Exit Exam?
            </h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Are you sure you want to exit? Your examination timer is active, and any unsubmitted answers or progress in this session will be lost.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Continue Exam
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Yes, Exit Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Exam Confirmation Modal */}
      {showSubmitConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 text-2xl flex items-center justify-center mx-auto mb-4">
              📋
            </div>
            <h3 className="text-xl font-extrabold text-gray-900">
              Confirm Final Submission
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Please review your question completion summary before submitting.
            </p>

            <div className="my-5 p-4 bg-gray-50 rounded-xl border border-gray-200 text-left space-y-2 text-sm">
              <div className="flex justify-between items-center text-gray-700">
                <span>Total Questions:</span>
                <span className="font-bold text-gray-900 font-mono">{totalQuestionsCount}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700">
                <span>Answered:</span>
                <span className="font-bold font-mono">{answeredQuestionsCount}</span>
              </div>
              <div className="flex justify-between items-center text-amber-700">
                <span>Flagged for Review:</span>
                <span className="font-bold font-mono">{flaggedQuestionsCount}</span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span>Unattempted:</span>
                <span className="font-bold font-mono">
                  {Math.max(0, totalQuestionsCount - answeredQuestionsCount)}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-gray-700 font-medium">
                <span>Time Remaining:</span>
                <span className="font-mono font-bold text-emerald-800">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {totalQuestionsCount - answeredQuestionsCount > 0 && (
              <div className="mb-5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-left">
                ⚠️ You still have <strong>{totalQuestionsCount - answeredQuestionsCount}</strong> unattempted question(s). Unattempted questions will be scored as 0.
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowSubmitConfirmModal(false)}
                className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Return to Exam
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit Final (S)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Quiz
