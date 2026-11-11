import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Subject {
  id: string
  name: string
  code: string
  description?: string | null
  icon?: string | null
  is_compulsory?: boolean
}

export interface DrillConfig {
  isTopicDrill: boolean
  subjectId: string
  topicIds: string[]
  topicNames: string[]
  questionCount: number
  isUntimed: boolean
}

export interface CBTSetupModalProps {
  isOpen: boolean
  onClose: () => void
  subjects: Subject[]
  userTier: 'free' | 'pro'
  onOpenUpgradeModal: () => void
  onLaunchExam: (
    selectedSubjectIds: string[],
    durationMinutes: number,
    drillConfig?: DrillConfig
  ) => void
  initialSelectedSubjectIds?: string[]
  initialMode?: 'mock' | 'drill'
}

const PRESET_DURATIONS = [
  { minutes: 15, label: '15m Sprint', icon: '⚡' },
  { minutes: 30, label: '30m Test', icon: '⏱️' },
  { minutes: 60, label: '1 Hour', icon: '🏃' },
  { minutes: 90, label: '90m Mock', icon: '🎯' },
  { minutes: 120, label: '2h Standard', icon: '🏛️' },
]

const DRILL_QUESTION_PRESETS = [10, 20, 30, 40]
const DRILL_TIMED_PRESETS = [15, 30, 45, 60]

export const CBTSetupModal: React.FC<CBTSetupModalProps> = ({
  isOpen,
  onClose,
  subjects,
  userTier,
  onOpenUpgradeModal,
  onLaunchExam,
  initialSelectedSubjectIds = [],
  initialMode = 'mock',
}) => {
  const [activeTab, setActiveTab] = useState<'mock' | 'drill'>(initialMode)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [durationMinutes, setDurationMinutes] = useState<number>(120)
  const [lockNotice, setLockNotice] = useState<string | null>(null)

  // Topic Drill Mode State
  const [drillSubjectId, setDrillSubjectId] = useState<string>('')
  const [drillTopics, setDrillTopics] = useState<{ id: string; name: string }[]>([])
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
  const [drillQuestionCount, setDrillQuestionCount] = useState<number>(20)
  const [isUntimed, setIsUntimed] = useState<boolean>(false)
  const [drillDurationMinutes, setDrillDurationMinutes] = useState<number>(30)
  const [loadingTopics, setLoadingTopics] = useState<boolean>(false)

  const isPro = userTier === 'pro'

  const isEnglishOrCompulsory = (s?: Subject | null) => {
    if (!s || !s.name) return false
    if (s.name.trim() === 'Literature in English' || s.name.toLowerCase().includes('literature')) {
      return false
    }
    return s.name.trim() === 'Use of English' || s.name.trim().toLowerCase() === 'use of english'
  }

  // Initialize subjects and modes
  useEffect(() => {
    if (isOpen) {
      if (initialMode) {
        setActiveTab(initialMode)
      }

      if (subjects.length > 0) {
        if (!drillSubjectId) {
          setDrillSubjectId(subjects[0].id)
        }

        const englishSubject = subjects.find(isEnglishOrCompulsory)
        const englishId = englishSubject?.id

        if (initialSelectedSubjectIds.length > 0) {
          const combined = new Set(initialSelectedSubjectIds)
          if (englishId) combined.add(englishId)
          setSelectedSubjectIds(Array.from(combined).slice(0, 4))
        } else {
          const compulsoryIds = subjects.filter(isEnglishOrCompulsory).map((s) => s.id)
          const electiveIds = subjects
            .filter((s) => !isEnglishOrCompulsory(s))
            .slice(0, Math.max(0, 4 - compulsoryIds.length))
            .map((s) => s.id)
          setSelectedSubjectIds([...compulsoryIds, ...electiveIds])
        }
      }

      setDurationMinutes(userTier === 'pro' ? durationMinutes : 120)
      setLockNotice(null)
    }
  }, [isOpen, initialSelectedSubjectIds, initialMode, subjects, userTier])

  // Fetch syllabus topics dynamically when drill subject changes
  useEffect(() => {
    if (!drillSubjectId || !isOpen) return

    let isMounted = true
    const fetchTopics = async () => {
      setLoadingTopics(true)
      try {
        const { data, error } = await supabase
          .from('topics')
          .select('id, name')
          .eq('subject_id', drillSubjectId)
          .order('name', { ascending: true })

        if (!error && data && isMounted) {
          setDrillTopics(data)
          setSelectedTopicIds([]) // default to all topics
        }
      } catch (err) {
        console.error('Error fetching topics for drill:', err)
      } finally {
        if (isMounted) setLoadingTopics(false)
      }
    }

    fetchTopics()
    return () => {
      isMounted = false
    }
  }, [drillSubjectId, isOpen])

  if (!isOpen) return null

  // ---------------------------------------------------------------------------
  // Handlers for Mock Mode
  // ---------------------------------------------------------------------------
  const handleToggleSubject = (subjectId: string) => {
    const targetSubject = subjects.find((s) => s.id === subjectId)
    if (isEnglishOrCompulsory(targetSubject)) {
      setLockNotice('🔒 Use of English is compulsory for all JAMB candidates and cannot be unselected.')
      return
    }

    if (!isPro) {
      if (selectedSubjectIds.includes(subjectId)) {
        setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subjectId))
        setLockNotice(null)
      } else {
        if (selectedSubjectIds.length >= 4) {
          setLockNotice('Standard JAMB UTME format requires exactly 4 subjects. Please deselect a subject first.')
        } else {
          setSelectedSubjectIds([...selectedSubjectIds, subjectId])
          setLockNotice(null)
        }
      }
      return
    }

    setLockNotice(null)
    if (selectedSubjectIds.includes(subjectId)) {
      setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== subjectId))
    } else {
      if (selectedSubjectIds.length >= 4) {
        setLockNotice('Maximum 4 subjects allowed per CBT simulation.')
        return
      }
      setSelectedSubjectIds([...selectedSubjectIds, subjectId])
    }
  }

  const handleSelectPresetDuration = (minutes: number) => {
    if (!isPro) {
      setLockNotice(
        '🔒 Custom countdown timers (5 to 120 mins) are reserved for Pro members. Free tier is locked to 120 minutes.'
      )
      return
    }
    setLockNotice(null)
    setDurationMinutes(minutes)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPro) {
      setLockNotice(
        '🔒 Custom countdown timers are reserved for Pro members. Upgrade to unlock full timer flexibility!'
      )
      return
    }
    setLockNotice(null)
    setDurationMinutes(Number(e.target.value))
  }

  const handleStartExamClick = () => {
    if (!isPro && selectedSubjectIds.length !== 4) {
      setLockNotice('Free tier requires exactly 4 subjects. Upgrade to Pro for flexible single-subject practice!')
      return
    }

    if (selectedSubjectIds.length === 0) {
      setLockNotice('Please select at least 1 subject to start the exam.')
      return
    }

    onLaunchExam(selectedSubjectIds, isPro ? durationMinutes : 120)
  }

  // ---------------------------------------------------------------------------
  // Handlers for Topic Drill Mode
  // ---------------------------------------------------------------------------
  const handleToggleTopic = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    )
  }

  const handleSelectAllTopics = () => {
    if (selectedTopicIds.length === drillTopics.length) {
      setSelectedTopicIds([])
    } else {
      setSelectedTopicIds(drillTopics.map((t) => t.id))
    }
  }

  const handleStartDrillClick = () => {
    if (!isPro) {
      setLockNotice(
        'Topic Practice Drills are exclusive to Pro members. Upgrade to Pro for ₦1,000 to unlock targeted subject practice.'
      )
      onOpenUpgradeModal()
      return
    }

    if (!drillSubjectId) {
      setLockNotice('Please pick a target subject to start topic practice.')
      return
    }

    const chosenTopics = drillTopics.filter((t) => selectedTopicIds.includes(t.id))
    const topicNames =
      chosenTopics.length > 0 ? chosenTopics.map((t) => t.name) : ['All High-Yield Syllabus Topics']

    onLaunchExam([drillSubjectId], isUntimed ? 0 : drillDurationMinutes, {
      isTopicDrill: true,
      subjectId: drillSubjectId,
      topicIds: selectedTopicIds,
      topicNames,
      questionCount: drillQuestionCount,
      isUntimed,
    })
  }

  const activeDrillSubject = subjects.find((s) => s.id === drillSubjectId) || subjects[0]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl w-[95%] sm:w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] mx-auto">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-5 text-white shrink-0 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer font-bold"
            aria-label="Close setup modal"
          >
            ✕
          </button>

          <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-xs">
              <span>{activeTab === 'mock' ? '🎯' : '📚'}</span>
              <span>{activeTab === 'mock' ? 'CBT Pre-Exam Setup' : 'Topic Practice Drills'}</span>
            </div>

            {isPro ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-xs">
                ⭐ Pro Unlocked
              </span>
            ) : (
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-300 hover:bg-amber-400 text-slate-950 transition-colors shadow-xs cursor-pointer"
              >
                <span>🔒 Upgrade to Pro</span>
                <span>→</span>
              </button>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-2">
            {activeTab === 'mock' ? 'Configure Your CBT Simulation' : 'Master High-Yield Syllabus Topics'}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
            {activeTab === 'mock'
              ? isPro
                ? 'Customize subjects (1 to 4) and practice timer (5 to 120 mins) freely.'
                : 'Free Tier adheres strictly to standard JAMB UTME rules (4 subjects, 120 minutes).'
              : 'Drill specific syllabus topics with customized question counts and timed or untimed practice.'}
          </p>
        </div>

        {/* Practice Mode Switcher Tabs */}
        <div className="px-6 pt-4 shrink-0 bg-white">
          <div className="flex p-1 bg-slate-100 rounded-2xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('mock')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                activeTab === 'mock'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🏛️ Full UTME Mock</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 hidden sm:inline">
                Standard
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('drill')
                if (!isPro) {
                  setLockNotice(
                    'Topic Practice Drills are exclusive to Pro members. Upgrade to Pro for ₦1,000 to unlock targeted subject practice.'
                  )
                }
              }}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                activeTab === 'drill'
                  ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🎯 Topic Practice Drill</span>
              {isPro ? (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Topics
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-0.5">
                  <span>🔒</span>
                  <span>Pro</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Lock Notice Banner */}
          {lockNotice && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <span>{lockNotice}</span>
              </div>
              {!isPro && (
                <button
                  type="button"
                  onClick={onOpenUpgradeModal}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shrink-0 cursor-pointer transition-colors"
                >
                  Upgrade ⭐
                </button>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 1: STANDARD FULL UTME MOCK SETUP                              */}
          {/* ================================================================= */}
          {activeTab === 'mock' && (
            <>
              {/* 1. Subject Selection Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>1. Subject Selection</span>
                      {!isPro && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Standard JAMB Format
                        </span>
                      )}
                      {isPro && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          1 to 4 Custom
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isPro
                        ? 'Pick between 1 to 4 subjects for single-subject speed drills or combined mocks.'
                        : 'Select exactly 4 subjects (Use of English is compulsory).'}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full ${
                      selectedSubjectIds.length === 4
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedSubjectIds.length} / 4 Selected
                  </span>
                </div>

                {/* Subject Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {subjects.map((subject) => {
                    const isSelected = selectedSubjectIds.includes(subject.id)
                    const isCompulsory = isEnglishOrCompulsory(subject)

                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() => handleToggleSubject(subject.id)}
                        className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                          isCompulsory
                            ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs'
                            : isSelected
                            ? 'border-emerald-600 bg-emerald-50 shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lg">{subject.icon || '📖'}</span>
                          {isCompulsory ? (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">
                              Compulsory
                            </span>
                          ) : (
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-600 text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected ? '✓' : ''}
                            </span>
                          )}
                        </div>

                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase">
                            {subject.code}
                          </span>
                          <span className="text-xs font-bold text-slate-900 line-clamp-1">
                            {subject.name}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 2. Exam Duration & Timer Customization */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>2. Exam Duration:</span>
                      <span className="text-emerald-700 font-mono font-extrabold">
                        {isPro ? durationMinutes : 120} Minutes
                      </span>
                      <span className="text-xs text-slate-400 font-normal">
                        ({Math.floor((isPro ? durationMinutes : 120) / 60)}h{' '}
                        {(isPro ? durationMinutes : 120) % 60}m)
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isPro
                        ? 'Adjust the countdown timer to simulate sprints or endurance test conditions.'
                        : 'Fixed at 120 minutes (2 Hours) on the Free Tier.'}
                    </p>
                  </div>

                  {!isPro && (
                    <button
                      type="button"
                      onClick={onOpenUpgradeModal}
                      className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>🔒</span>
                      <span>Upgrade to Customize</span>
                    </button>
                  )}
                </div>

                {/* Quick Preset Buttons */}
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_DURATIONS.map((preset) => {
                    const isSelected = (isPro ? durationMinutes : 120) === preset.minutes
                    const isLocked = !isPro && preset.minutes !== 120

                    return (
                      <button
                        key={preset.minutes}
                        type="button"
                        onClick={() => handleSelectPresetDuration(preset.minutes)}
                        className={`py-2 px-1.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                          isLocked
                            ? 'border-slate-200 bg-slate-100 opacity-60 cursor-pointer hover:border-amber-300'
                            : isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span className="text-xs">{isLocked ? '🔒' : preset.icon}</span>
                        <span className="text-[11px] font-bold font-mono">{preset.label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Duration Range Slider */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-1">
                    <span>5 Mins (Sprint)</span>
                    <span className="font-bold text-emerald-700">
                      {isPro ? `${durationMinutes} Mins` : '120 Mins (Locked)'}
                    </span>
                    <span>120 Mins (Full)</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={isPro ? durationMinutes : 120}
                    onChange={handleSliderChange}
                    disabled={!isPro}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      isPro ? 'bg-slate-200 accent-emerald-600' : 'bg-slate-100 opacity-50 cursor-not-allowed'
                    }`}
                  />
                  {!isPro && (
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <span>🔒</span>
                      <span>Slider is locked. Pro members can set custom exam lengths down to 5 minutes.</span>
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ================================================================= */}
          {/* TAB 2: TOPIC-BY-TOPIC PRACTICE DRILL SETUP                        */}
          {/* ================================================================= */}
          {activeTab === 'drill' && (
            <div className="space-y-5">
              {!isPro && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">🔒</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Topic Practice Drills are Exclusive to Pro Members
                      </h4>
                      <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
                        Upgrade to Pro for ₦1,000 to unlock targeted subject practice, custom question counts, and untimed revision modes.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenUpgradeModal}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shrink-0 cursor-pointer transition-all shadow-xs"
                  >
                    Upgrade to Pro ⭐
                  </button>
                </div>
              )}

              {/* Step 1: Select Target Subject */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  1. Target Subject
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {subjects.map((s) => {
                    const isSelected = drillSubjectId === s.id
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setDrillSubjectId(s.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-2xs'
                            : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <span className="text-base">{s.icon || '📖'}</span>
                        <div className="truncate">
                          <span className="text-xs block truncate">{s.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono uppercase">{s.code}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 2: Choose Topics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                      2. Filter Specific Topics ({activeDrillSubject.name})
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Select individual high-yield topics or drill across the entire subject syllabus.
                    </span>
                  </div>
                  {drillTopics.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllTopics}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                    >
                      {selectedTopicIds.length === drillTopics.length ? 'Clear Selection' : 'Select All'}
                    </button>
                  )}
                </div>

                {loadingTopics ? (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span className="text-xs text-slate-500">Loading syllabus topics...</span>
                  </div>
                ) : drillTopics.length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <span>💡</span>
                    <span>All questions available for {activeDrillSubject.name} will be randomized in this session.</span>
                  </div>
                ) : (
                  <div className="max-h-44 overflow-y-auto p-2 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedTopicIds([])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        selectedTopicIds.length === 0
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      ✨ All Topics ({drillTopics.length})
                    </button>

                    {drillTopics.map((top) => {
                      const isChosen = selectedTopicIds.includes(top.id)
                      return (
                        <button
                          key={top.id}
                          type="button"
                          onClick={() => handleToggleTopic(top.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                            isChosen
                              ? 'bg-emerald-700 text-white font-bold shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-300'
                          }`}
                        >
                          <span>{isChosen ? '✓' : '•'}</span>
                          <span>{top.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Question Count */}
              <div>
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                  3. Question Count
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {DRILL_QUESTION_PRESETS.map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setDrillQuestionCount(cnt)}
                      className={`py-2 px-3 rounded-xl border text-center transition-all cursor-pointer font-mono font-bold text-xs ${
                        drillQuestionCount === cnt
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {cnt} Questions
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Practice Timer Mode (Timed vs Untimed) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                  4. Practice Timer Mode
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsUntimed(false)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      !isUntimed
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">⏱️</span>
                      <span className="text-xs font-bold">Timed Drill</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Standard countdown timer to simulate test speed conditions.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsUntimed(true)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isUntimed
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🧘</span>
                      <span className="text-xs font-bold">Untimed Study Mode</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      No countdown stress. Take your time to read and dissect question stems.
                    </span>
                  </button>
                </div>

                {!isUntimed && (
                  <div className="pt-2 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Sprint Length:</span>
                    <div className="flex gap-1.5 flex-1">
                      {DRILL_TIMED_PRESETS.map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setDrillDurationMinutes(m)}
                          className={`py-1 px-3 rounded-lg text-xs font-mono font-semibold border cursor-pointer ${
                            drillDurationMinutes === m
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            ← Return to Dashboard
          </button>

          {activeTab === 'mock' ? (
            <button
              type="button"
              onClick={handleStartExamClick}
              disabled={isPro ? selectedSubjectIds.length === 0 : selectedSubjectIds.length !== 4}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${
                (isPro ? selectedSubjectIds.length > 0 : selectedSubjectIds.length === 4)
                  ? 'text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-md hover:shadow-lg cursor-pointer'
                  : 'text-slate-400 bg-slate-200 cursor-not-allowed shadow-none'
              }`}
            >
              <span>🚀 Start CBT Exam</span>
              <span
                className={`text-xs font-mono ${
                  (isPro ? selectedSubjectIds.length > 0 : selectedSubjectIds.length === 4)
                    ? 'text-emerald-200'
                    : 'text-slate-400'
                }`}
              >
                ({selectedSubjectIds.length}/4 Subs • {isPro ? durationMinutes : 120}m)
              </span>
            </button>
          ) : !isPro ? (
            <button
              type="button"
              onClick={handleStartDrillClick}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-black text-slate-950 bg-amber-400 hover:bg-amber-500 active:scale-[0.99] shadow-md hover:shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>🔒 Unlock Topic Drills (Upgrade to Pro)</span>
              <span className="text-xs font-mono text-slate-800">
                (₦1,000 Lifetime)
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartDrillClick}
              disabled={!drillSubjectId}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-md hover:shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>🎯 Start Topic Drill</span>
              <span className="text-xs font-mono text-emerald-200">
                ({activeDrillSubject.code} • {drillQuestionCount} Qs • {isUntimed ? 'Untimed' : `${drillDurationMinutes}m`})
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
