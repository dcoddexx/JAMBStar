import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export interface ExamTip {
  id: number
  category: string
  tagColor: string
  icon: string
  title: string
  description: string
  statBadge?: string
}

const EXAM_TIPS: ExamTip[] = [
  {
    id: 1,
    category: 'High-Weight Subject',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: '📖',
    title: 'English Carries the Highest Score Weight!',
    description:
      'Use of English has 60 questions while other subjects have 40 questions each. High accuracy in English provides the largest numerical boost towards hitting 300+ in your aggregate score.',
    statBadge: '60 Questions • 33% Aggregate',
  },
  {
    id: 2,
    category: 'Scoring Strategy',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: '🎯',
    title: 'Zero Negative Marking: Never Leave Blanks',
    description:
      'JAMB does NOT deduct marks for incorrect answers. If time is running out, make educated guesses on all remaining questions before the system auto-submits.',
    statBadge: 'No Negative Marking',
  },
  {
    id: 3,
    category: 'Speed Technique',
    tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '⌨️',
    title: 'Master the 8-Key CBT Navigation Keys',
    description:
      'Keyboard keys A, B, C, D select your answers; P navigates to Previous question; N moves to Next; S triggers Submit; R Returns to review. Candidates who use keys finish 18 minutes faster than mouse clickers.',
    statBadge: '18 Mins Saved on Avg.',
  },
  {
    id: 4,
    category: 'Time Management',
    tagColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '⏱️',
    title: 'Maintain a 35-Second Target Per Question',
    description:
      'You have 120 minutes for 180 questions (~40 seconds per question). By answering easy questions in 25–30 seconds, you bank a critical 15-minute buffer to double-check calculation problems.',
    statBadge: '180 Questions in 120 Mins',
  },
  {
    id: 5,
    category: 'Comprehension Tactic',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: '💡',
    title: 'Scan Passage Keywords Before Deep Reading',
    description:
      'Read the 5 comprehension questions first to pinpoint what details to look for. When you scan the text, relevant answers jump out immediately, saving valuable reading time.',
    statBadge: 'Comprehension Hack',
  },
  {
    id: 6,
    category: 'Performance Benchmark',
    tagColor: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: '🏆',
    title: '250+ Puts You in the Top 10% Nationwide',
    description:
      'Out of over 1.9 million candidates annually, fewer than 12% achieve a score of 250 or higher. Taking at least one timed mock drill every day doubles your likelihood of exceeding 280.',
    statBadge: 'Top 10% UTME Benchmark',
  },
  {
    id: 7,
    category: 'Elimination Method',
    tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    icon: '🔍',
    title: 'Cross Out 2 Distractors to Double Odds',
    description:
      'Every JAMB question typically contains 2 obvious distractors and 2 plausible options. Eliminating the 2 distractors instantly increases your probability of answering correctly from 25% to 50%.',
    statBadge: '50% Win Rate Boost',
  },
  {
    id: 8,
    category: 'Science & Math Formula',
    tagColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    icon: '⚡',
    title: 'Memorize the Core 25 UTME Physics Formulas',
    description:
      'Questions on Motion equations, Gas Laws, Heat capacity, and Ohm’s Law repeat every single year with different numerical values. Memorizing their base units guarantees quick points.',
    statBadge: 'Guaranteed High Yield',
  },
]

export interface AnimatedExamTipProps {
  currentUser?: {
    id: string
    full_name?: string
    email?: string
  } | null
  onSignOut?: () => void
}

export const AnimatedExamTip: React.FC<AnimatedExamTipProps> = ({
  currentUser,
  onSignOut,
}) => {
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [animating, setAnimating] = useState<boolean>(false)

  // Auto-cycle through tips every 6 seconds unless candidate is hovering/interacting
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      handleNext()
    }, 6000)

    return () => clearInterval(interval)
  }, [currentIndex, isPaused])

  const handleNext = () => {
    setAnimating(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % EXAM_TIPS.length)
      setAnimating(false)
    }, 150)
  }

  const handlePrev = () => {
    setAnimating(true)
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + EXAM_TIPS.length) % EXAM_TIPS.length)
      setAnimating(false)
    }, 150)
  }

  const currentTip = EXAM_TIPS[currentIndex]

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative transition-all duration-200 hover:shadow-2xl"
    >
      {/* Top Gradient Banner & Status Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 pt-5 pb-4 text-white relative">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse"></span>
            <span>
              {currentUser?.full_name ? `Tip for ${currentUser.full_name}` : 'Daily UTME Success Tip'}
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-100 font-semibold">
            {currentIndex + 1} / {EXAM_TIPS.length}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>💡</span>
            <span>Exam Mastery Fact</span>
          </h2>

          {/* Quick cycle buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrev}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              title="Previous tip"
              aria-label="Previous exam tip"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              title="Next tip"
              aria-label="Next exam tip"
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Main Tip Card Body */}
      <div className="p-6">
        <div
          className={`transition-all duration-200 ${
            animating
              ? 'opacity-0 translate-y-2'
              : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Tip Meta Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${currentTip.tagColor}`}
            >
              <span>{currentTip.icon}</span>
              <span>{currentTip.category}</span>
            </span>

            {currentTip.statBadge && (
              <span className="text-[11px] font-semibold text-slate-500 font-mono">
                {currentTip.statBadge}
              </span>
            )}
          </div>

          {/* Tip Title */}
          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
            {currentTip.title}
          </h3>

          {/* Tip Body */}
          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed min-h-[72px]">
            {currentTip.description}
          </p>
        </div>

        {/* Dots Pagination Indicator */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5">
          {EXAM_TIPS.map((tip, idx) => (
            <button
              key={tip.id}
              type="button"
              onClick={() => {
                setAnimating(true)
                setTimeout(() => {
                  setCurrentIndex(idx)
                  setAnimating(false)
                }, 150)
              }}
              className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                idx === currentIndex
                  ? 'w-6 bg-emerald-600'
                  : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              aria-label={`Jump to tip ${idx + 1}`}
            />
          ))}
        </div>

        {/* Navigation Action Buttons */}
        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>Launch Candidate Dashboard</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>

          <div className="flex items-center justify-center gap-3 pt-1 text-xs">
            <Link
              to="/dashboard?setup=true"
              className="text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2"
            >
              Start CBT Exam
            </Link>
            {onSignOut && (
              <>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-slate-400 hover:text-rose-600 font-medium cursor-pointer"
                >
                  Switch Account
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
