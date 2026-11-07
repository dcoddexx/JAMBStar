import { supabase } from '../lib/supabase'

export interface Question {
  id: string
  subject_id: string
  topic_id?: string | null
  subtopic_id?: string | null
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
  description?: string | null
  is_compulsory?: boolean
}

export const CBT_SESSION_STORAGE_KEY = 'jambstar_active_cbt_session'

export interface StoredCBTSession {
  savedAtTimestamp: number
  timeRemainingSeconds: number
  userAnswers: Record<string, string>
  markedForReview: Record<string, boolean>
  questionsBySubject: Record<string, Question[]>
  subjects: Subject[]
  activeSubjectId: string
  activeSubjectIndex: number
  activeQuestionIndex: number
  isTopicDrill: boolean
  isUntimed: boolean
  elapsedTime: number
  isDemoMode: boolean
  candidateUserId: string | null
}

/**
 * Fisher-Yates (Knuth) Array Shuffle Algorithm
 * Produces an unbiased, uniform random permutation of array elements in O(n) time.
 * Prevents candidates from memorizing question sequences across subsequent retakes.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Subject identification check for Use of English (ENG).
 * Strict string match excluding Literature in English.
 */
export function isEnglishSubject(subj?: Subject | null): boolean {
  if (!subj || !subj.name) return false
  const name = subj.name.trim().toLowerCase()
  const code = (subj.code || '').trim().toUpperCase()

  if (name === 'literature in english' || name.includes('literature')) {
    return false
  }

  return name === 'use of english' || code === 'ENG' || name.includes('english')
}

/**
 * Official JAMB UTME Subject-Aware Question Limits:
 * - Use of English (ENG): strictly 60 questions
 * - Other Subjects (BIO, CHM, PHY, MTH, etc.): strictly 40 questions each
 * - Topic Practice Drills: candidate-selected preset (10, 20, 30, or 40 questions)
 */
export function getSubjectQuestionCap(
  subject: Subject,
  isTopicDrill: boolean,
  drillPresetCount?: number
): number {
  if (isTopicDrill) {
    return drillPresetCount && drillPresetCount > 0 ? drillPresetCount : 20
  }
  return isEnglishSubject(subject) ? 60 : 40
}

/**
 * Fetch Questions Per Subject from Supabase
 * Fixes the Supabase 1,000-row PostgREST truncation limit by querying each subject independently
 * using .eq('subject_id', subject.id) rather than a global unbounded .in query.
 */
export async function fetchQuestionsForSubject(
  subjectId: string,
  options?: {
    isTopicDrill?: boolean
    drillTopicIds?: string[]
  }
): Promise<Question[]> {
  let query = supabase
    .from('questions')
    .select('*')
    .eq('subject_id', subjectId)

  if (options?.isTopicDrill && options.drillTopicIds && options.drillTopicIds.length > 0) {
    query = query.in('topic_id', options.drillTopicIds)
  }

  const { data, error } = await query.order('created_at', { ascending: true })

  if (error) {
    console.error(`Error querying questions for subject ${subjectId}:`, error)
    throw error
  }

  return (data as Question[]) || []
}

/**
 * Load, randomize, and cap questions for all selected exam subjects.
 * Strictly complies with official JAMB UTME quotas (ENG: 60, Others: 40).
 */
export async function loadExamQuestions(
  targetSubjects: Subject[],
  options: {
    isTopicDrill?: boolean
    drillTopicIds?: string[]
    drillQuestionCount?: number
    isDemoMode?: boolean
  }
): Promise<{
  subjects: Subject[]
  questionsBySubject: Record<string, Question[]>
}> {
  const isTopicDrill = Boolean(options.isTopicDrill)
  const isDemo = Boolean(options.isDemoMode)

  // 1. Fetch questions per subject in parallel using dedicated .eq queries
  const perSubjectResults = await Promise.all(
    targetSubjects.map(async (subj) => {
      const rawQuestions = await fetchQuestionsForSubject(subj.id, {
        isTopicDrill,
        drillTopicIds: options.drillTopicIds,
      })
      return {
        subject: subj,
        rawQuestions,
      }
    })
  )

  const grouped: Record<string, Question[]> = {}

  if (isDemo) {
    // Demo Mode: Randomly select 10 questions across all available subjects
    const allQuestions: Question[] = []
    perSubjectResults.forEach((r) => {
      allQuestions.push(...r.rawQuestions)
    })

    const shuffledDemo = shuffleArray(allQuestions).slice(0, 10)
    const activeSubjIds = new Set(shuffledDemo.map((q) => q.subject_id))
    const filteredSubjects = targetSubjects.filter((s) => activeSubjIds.has(s.id))

    filteredSubjects.forEach((s) => {
      grouped[s.id] = []
    })

    shuffledDemo.forEach((q) => {
      if (!grouped[q.subject_id]) grouped[q.subject_id] = []
      grouped[q.subject_id].push(q)
    })

    return {
      subjects: filteredSubjects.length > 0 ? filteredSubjects : targetSubjects,
      questionsBySubject: grouped,
    }
  }

  // Real Mock Exam or Topic Drill Mode
  perSubjectResults.forEach(({ subject, rawQuestions }) => {
    if (rawQuestions.length === 0) {
      grouped[subject.id] = []
      return
    }

    // Determine subject question cap
    const cap = getSubjectQuestionCap(
      subject,
      isTopicDrill,
      options.drillQuestionCount
    )

    // Thoroughly shuffle the subject's full question bank before slicing to the official limit
    const shuffled = shuffleArray(rawQuestions)
    grouped[subject.id] = shuffled.slice(0, cap)
  })

  return {
    subjects: targetSubjects,
    questionsBySubject: grouped,
  }
}

/**
 * CBT LocalStorage Session Persistence Helpers
 */

export function getStoredCBTSession(): {
  session: StoredCBTSession
  restoredTimeLeft: number
  restoredElapsedTime: number
} | null {
  try {
    const raw = localStorage.getItem(CBT_SESSION_STORAGE_KEY)
    if (!raw) return null

    const session = JSON.parse(raw) as StoredCBTSession
    if (!session || !session.savedAtTimestamp) {
      localStorage.removeItem(CBT_SESSION_STORAGE_KEY)
      return null
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Date.now() - session.savedAtTimestamp) / 1000)
    )

    if (session.isUntimed) {
      const restoredElapsedTime = (session.elapsedTime || 0) + elapsedSeconds
      return {
        session,
        restoredTimeLeft: 0,
        restoredElapsedTime,
      }
    }

    // Timed session: deduct elapsed seconds
    const restoredTimeLeft = session.timeRemainingSeconds - elapsedSeconds

    if (restoredTimeLeft <= 0) {
      // Session has expired while candidate was away
      localStorage.removeItem(CBT_SESSION_STORAGE_KEY)
      return null
    }

    return {
      session,
      restoredTimeLeft,
      restoredElapsedTime: (session.elapsedTime || 0) + elapsedSeconds,
    }
  } catch (err) {
    console.warn('Error reading stored CBT session from localStorage:', err)
    localStorage.removeItem(CBT_SESSION_STORAGE_KEY)
    return null
  }
}

export function saveCBTSession(session: StoredCBTSession): void {
  try {
    localStorage.setItem(CBT_SESSION_STORAGE_KEY, JSON.stringify(session))
  } catch (err) {
    console.warn('Error saving CBT session to localStorage:', err)
  }
}

export function clearCBTSession(): void {
  try {
    localStorage.removeItem(CBT_SESSION_STORAGE_KEY)
  } catch {
    // Ignore storage clear errors
  }
}
