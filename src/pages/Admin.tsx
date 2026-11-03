import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  track: 'Science' | 'Arts' | 'Commercial'
  role: 'student' | 'admin' | 'super_admin'
  created_at: string
}

interface Subject {
  id: string
  name: string
  code: string
  icon?: string | null
}

interface Question {
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
  created_at: string
}

interface ParsedCSVQuestion {
  rowNumber: number
  rawSubject: string
  subjectId: string | null
  subjectName: string
  questionText: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: 'A' | 'B' | 'C' | 'D' | ''
  explanation: string
  imageUrl: string | null
  isValid: boolean
  validationError?: string
}

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'questions'>('users')

  // User Management State
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(true)
  const [userSearch, setUserSearch] = useState<string>('')
  const [trackFilter, setTrackFilter] = useState<string>('All')
  const [roleFilter, setRoleFilter] = useState<string>('All')
  const [profileActionMsg, setProfileActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Question Bank State
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false)
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false)
  const [questionActionMsg, setQuestionActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Single Question Form Fields (Add & Edit)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [newSubjectId, setNewSubjectId] = useState<string>('')
  const [newQuestionText, setNewQuestionText] = useState<string>('')
  const [newOptionA, setNewOptionA] = useState<string>('')
  const [newOptionB, setNewOptionB] = useState<string>('')
  const [newOptionC, setNewOptionC] = useState<string>('')
  const [newOptionD, setNewOptionD] = useState<string>('')
  const [newCorrectOption, setNewCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [newExplanation, setNewExplanation] = useState<string>('')
  const [newExamYear, setNewExamYear] = useState<string>('2024')
  const [newImageUrl, setNewImageUrl] = useState<string>('')
  const [submittingQuestion, setSubmittingQuestion] = useState<boolean>(false)

  // Bulk CSV Upload State
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false)
  const [csvFileName, setCsvFileName] = useState<string>('')
  const [parsedQuestions, setParsedQuestions] = useState<ParsedCSVQuestion[]>([])
  const [parsingCsv, setParsingCsv] = useState<boolean>(false)
  const [uploadingCsv, setUploadingCsv] = useState<boolean>(false)
  const [bulkError, setBulkError] = useState<string | null>(null)

  // Load Profiles
  const fetchProfiles = async () => {
    setLoadingProfiles(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (err: unknown) {
      const e = err as Error
      console.error('Error fetching profiles:', e)
    } finally {
      setLoadingProfiles(false)
    }
  }

  // Load Subjects
  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, code, icon')
        .order('name', { ascending: true })

      if (error) throw error
      if (data && data.length > 0) {
        setSubjects(data)
        if (!selectedSubjectId) setSelectedSubjectId(data[0].id)
        if (!newSubjectId) setNewSubjectId(data[0].id)
      }
    } catch (err: unknown) {
      const e = err as Error
      console.error('Error fetching subjects:', e)
    }
  }

  // Load Questions for Selected Subject
  const fetchQuestions = async (subjectId: string) => {
    if (!subjectId) return
    setLoadingQuestions(true)
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestions(data || [])
    } catch (err: unknown) {
      const e = err as Error
      console.error('Error fetching questions:', e)
    } finally {
      setLoadingQuestions(false)
    }
  }

  useEffect(() => {
    fetchProfiles()
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (selectedSubjectId) {
      fetchQuestions(selectedSubjectId)
    }
  }, [selectedSubjectId])

  // Change User Role
  const handleUpdateRole = async (userId: string, newRole: 'student' | 'admin') => {
    setProfileActionMsg(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      setProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      )
      setProfileActionMsg({ type: 'success', text: `User role successfully updated to ${newRole}.` })
    } catch (err: unknown) {
      const e = err as Error
      setProfileActionMsg({ type: 'error', text: `Failed to update role: ${e.message}` })
    }
  }

  // Open modal for Adding a new question
  const handleOpenAddQuestionModal = () => {
    setEditingQuestionId(null)
    setNewQuestionText('')
    setNewOptionA('')
    setNewOptionB('')
    setNewOptionC('')
    setNewOptionD('')
    setNewExplanation('')
    setNewExamYear('2024')
    setNewImageUrl('')
    if (selectedSubjectId) {
      setNewSubjectId(selectedSubjectId)
    }
    setShowAddQuestionModal(true)
  }

  // Open modal for Editing an existing question
  const handleOpenEditQuestionModal = (q: Question) => {
    setEditingQuestionId(q.id)
    setNewSubjectId(q.subject_id)
    setNewQuestionText(q.question_text)
    setNewOptionA(q.option_a)
    setNewOptionB(q.option_b)
    setNewOptionC(q.option_c)
    setNewOptionD(q.option_d)
    setNewCorrectOption(q.correct_option)
    setNewExplanation(q.explanation || '')
    setNewExamYear(q.exam_year ? String(q.exam_year) : '')
    setNewImageUrl(q.image_url || '')
    setShowAddQuestionModal(true)
  }

  // Submit Single Question (Create or Update)
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    setQuestionActionMsg(null)

    if (!newSubjectId || !newQuestionText.trim() || !newOptionA || !newOptionB || !newOptionC || !newOptionD) {
      setQuestionActionMsg({ type: 'error', text: 'Please fill in all required question and option fields.' })
      return
    }

    setSubmittingQuestion(true)
    try {
      const questionPayload = {
        subject_id: newSubjectId,
        question_text: newQuestionText.trim(),
        option_a: newOptionA.trim(),
        option_b: newOptionB.trim(),
        option_c: newOptionC.trim(),
        option_d: newOptionD.trim(),
        correct_option: newCorrectOption,
        explanation: newExplanation.trim() || null,
        exam_year: newExamYear ? parseInt(newExamYear, 10) : null,
        image_url: newImageUrl.trim() || null,
      }

      if (editingQuestionId) {
        const { data, error } = await supabase
          .from('questions')
          .update(questionPayload)
          .eq('id', editingQuestionId)
          .select()
          .single()

        if (error) throw error

        if (data) {
          setQuestions((prev) =>
            prev.map((q) => (q.id === editingQuestionId ? (data as Question) : q))
          )
        }
        setQuestionActionMsg({ type: 'success', text: 'Question updated successfully!' })
      } else {
        const { data, error } = await supabase
          .from('questions')
          .insert(questionPayload)
          .select()
          .single()

        if (error) throw error

        if (data && data.subject_id === selectedSubjectId) {
          setQuestions((prev) => [data as Question, ...prev])
        }

        setQuestionActionMsg({ type: 'success', text: 'New question successfully added to question bank!' })
      }

      // Reset form
      setEditingQuestionId(null)
      setNewQuestionText('')
      setNewOptionA('')
      setNewOptionB('')
      setNewOptionC('')
      setNewOptionD('')
      setNewExplanation('')
      setNewImageUrl('')
      setShowAddQuestionModal(false)
    } catch (err: unknown) {
      const e = err as Error
      setQuestionActionMsg({ type: 'error', text: `Error saving question: ${e.message}` })
    } finally {
      setSubmittingQuestion(false)
    }
  }

  // Delete Question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return
    setQuestionActionMsg(null)
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      setQuestions((prev) => prev.filter((q) => q.id !== questionId))
      setQuestionActionMsg({ type: 'success', text: 'Question deleted successfully.' })
    } catch (err: unknown) {
      const e = err as Error
      setQuestionActionMsg({ type: 'error', text: `Failed to delete question: ${e.message}` })
    }
  }

  // ---------------------------------------------------------------------------
  // Robust CSV Parsing & Subject Mapping Engine
  // ---------------------------------------------------------------------------
  const parseCSVRows = (text: string): string[][] => {
    const rows: string[][] = []
    let row: string[] = []
    let entry = ''
    let inQuotes = false

    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const nextChar = text[i + 1]

      if (char === '"' || char === "'") {
        if (inQuotes && nextChar === char) {
          entry += char
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        row.push(entry.trim())
        entry = ''
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++
        }
        row.push(entry.trim())
        if (row.some((cell) => cell.length > 0)) {
          rows.push(row)
        }
        row = []
        entry = ''
      } else {
        entry += char
      }
    }
    if (entry.length > 0 || row.length > 0) {
      row.push(entry.trim())
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row)
      }
    }
    return rows
  }

  const findSubjectMatch = (rawSubject: string): Subject | null => {
    if (!rawSubject || subjects.length === 0) return null
    const clean = rawSubject.toLowerCase().replace(/[^a-z0-9]/g, '')
    // 1. Exact name or code match
    const exact = subjects.find(
      (s) =>
        s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean ||
        s.code.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
    )
    if (exact) return exact

    // 2. Contains match
    const contains = subjects.find((s) => {
      const sClean = s.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      return sClean.includes(clean) || clean.includes(sClean)
    })
    return contains || null
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFileName(file.name)
    setBulkError(null)
    setParsingCsv(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const rawRows = parseCSVRows(text)

        if (rawRows.length < 2) {
          setBulkError('The uploaded CSV file is empty or missing data rows.')
          setParsedQuestions([])
          setParsingCsv(false)
          return
        }

        const headerRow = rawRows[0]
        if (headerRow.length !== 9) {
          setBulkError(
            `Invalid CSV format: Expected exactly 9 columns, but found ${headerRow.length}. The 9 required columns are: Subject, Question Text, Option A, Option B, Option C, Option D, Correct Option, Explanation, Image URL.`
          )
          setParsedQuestions([])
          setParsingCsv(false)
          return
        }

        const ninthHeader = headerRow[8].trim()
        const ninthHeaderClean = ninthHeader.toLowerCase().replace(/[^a-z0-9]/g, '')
        if (ninthHeaderClean !== 'imageurl' && ninthHeaderClean !== 'image') {
          setBulkError(
            `Invalid 9th column header: Expected 'Image URL', but found '${ninthHeader}'.`
          )
          setParsedQuestions([])
          setParsingCsv(false)
          return
        }

        // Map column indices based on header row
        const header = headerRow.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''))

        let subjIdx = header.findIndex((h) => h.includes('subj') || h.includes('course'))
        let qTextIdx = header.findIndex((h) => h.includes('quest') || h.includes('prompt'))
        let optAIdx = header.findIndex((h) => h === 'optiona' || h === 'opta' || h === 'a')
        let optBIdx = header.findIndex((h) => h === 'optionb' || h === 'optb' || h === 'b')
        let optCIdx = header.findIndex((h) => h === 'optionc' || h === 'optc' || h === 'c')
        let optDIdx = header.findIndex((h) => h === 'optiond' || h === 'optd' || h === 'd')
        let corrIdx = header.findIndex((h) => h.includes('correct') || h.includes('ans'))
        let expIdx = header.findIndex((h) => h.includes('expl') || h.includes('solut'))
        let imgIdx = header.findIndex((h) => h.includes('image') || h.includes('diagram') || h.includes('pic'))

        // Fallback default index positions if headers are standard:
        if (subjIdx === -1) subjIdx = 0
        if (qTextIdx === -1) qTextIdx = 1
        if (optAIdx === -1) optAIdx = 2
        if (optBIdx === -1) optBIdx = 3
        if (optCIdx === -1) optCIdx = 4
        if (optDIdx === -1) optDIdx = 5
        if (corrIdx === -1) corrIdx = 6
        if (expIdx === -1) expIdx = 7
        if (imgIdx === -1) imgIdx = 8

        const parsed: ParsedCSVQuestion[] = []

        // Process data rows (skip header)
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i]
          if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue

          let isValid = true
          let validationError = ''

          if (row.length !== 9) {
            isValid = false
            validationError = `Expected exactly 9 columns, but row has ${row.length}.`
          }

          const rawSubject = row[subjIdx] || ''
          const questionText = row[qTextIdx] || ''
          const optionA = row[optAIdx] || ''
          const optionB = row[optBIdx] || ''
          const optionC = row[optCIdx] || ''
          const optionD = row[optDIdx] || ''
          const rawCorrect = (row[corrIdx] || '').toUpperCase().trim()
          const explanation = row[expIdx] || ''
          const rawImageUrl = row[imgIdx] ? row[imgIdx].trim() : ''
          const imageUrl = rawImageUrl !== '' ? rawImageUrl : null

          const matchedSubject = findSubjectMatch(rawSubject)

          if (isValid) {
            if (!matchedSubject) {
              isValid = false
              validationError = `Unknown Subject "${rawSubject}". Could not map to subjects table.`
            } else if (!questionText.trim()) {
              isValid = false
              validationError = 'Question text is empty.'
            } else if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
              isValid = false
              validationError = 'Options A, B, C, and D must all be non-empty.'
            } else if (!['A', 'B', 'C', 'D'].includes(rawCorrect)) {
              isValid = false
              validationError = `Invalid correct option "${rawCorrect}". Must be A, B, C, or D.`
            }
          }

          parsed.push({
            rowNumber: i + 1,
            rawSubject,
            subjectId: matchedSubject?.id || null,
            subjectName: matchedSubject?.name || 'Unmapped',
            questionText,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption: (['A', 'B', 'C', 'D'].includes(rawCorrect) ? rawCorrect : '') as 'A' | 'B' | 'C' | 'D' | '',
            explanation,
            imageUrl,
            isValid,
            validationError,
          })
        }

        setParsedQuestions(parsed)
      } catch (err: unknown) {
        const e = err as Error
        setBulkError(`Failed to parse CSV file: ${e.message}`)
      } finally {
        setParsingCsv(false)
      }
    }
    reader.readAsText(file)
  }

  // Batch insert valid questions into Supabase
  const handleBatchInsertQuestions = async () => {
    const validQuestions = parsedQuestions.filter((q) => q.isValid && q.subjectId)
    if (validQuestions.length === 0) {
      setBulkError('No valid questions available to import.')
      return
    }

    setUploadingCsv(true)
    setBulkError(null)

    try {
      const rowsToInsert = validQuestions.map((q) => ({
        subject_id: q.subjectId!,
        question_text: q.questionText.trim(),
        option_a: q.optionA.trim(),
        option_b: q.optionB.trim(),
        option_c: q.optionC.trim(),
        option_d: q.optionD.trim(),
        correct_option: q.correctOption as 'A' | 'B' | 'C' | 'D',
        explanation: q.explanation.trim() || null,
        image_url: q.imageUrl ? q.imageUrl.trim() || null : null,
      }))

      const { error: insertErr } = await supabase.from('questions').insert(rowsToInsert)

      if (insertErr) throw insertErr

      setQuestionActionMsg({
        type: 'success',
        text: `Batch upload successful! Added ${rowsToInsert.length} questions to the database.`,
      })

      // Refresh current question bank view
      if (selectedSubjectId) {
        fetchQuestions(selectedSubjectId)
      }

      // Reset modal state
      setShowBulkUploadModal(false)
      setParsedQuestions([])
      setCsvFileName('')
    } catch (err: unknown) {
      const e = err as Error
      setBulkError(`Database error during batch insert: ${e.message}`)
    } finally {
      setUploadingCsv(false)
    }
  }

  // Generate & Download sample CSV template
  const handleDownloadTemplate = () => {
    const sample =
      'Subject,Question Text,Option A,Option B,Option C,Option D,Correct Option,Explanation,Image URL\n' +
      'Use of English,"Which word has the same vowel sound as ""feet""?",Beat,Bit,Bet,Bait,A,"The letters ee in feet represent the long /i:/ vowel sound, identical to ea in beat.",\n' +
      'Mathematics,"Solve for x: 3x - 7 = 14.",5,7,9,11,B,"Add 7: 3x = 21, then divide by 3: x = 7.",\n' +
      'Physics,"What is the SI unit of electrical resistance?",Watt,Volt,Ohm,Ampere,C,"Resistance is measured in Ohms (Ω).",https://images.unsplash.com/photo-1632571401005-458e9d244591\n' +
      'Chemistry,"What is the chemical formula for ordinary table salt?",HCl,NaCl,NaOH,KCl,B,"Sodium chloride is NaCl.",\n'

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'jambstar_questions_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtered Profiles for User Management
  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      (p.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(userSearch.toLowerCase())
    const matchesTrack = trackFilter === 'All' || p.track === trackFilter
    const matchesRole = roleFilter === 'All' || p.role === roleFilter
    return matchesSearch && matchesTrack && matchesRole
  })

  const validCount = parsedQuestions.filter((q) => q.isValid).length
  const invalidCount = parsedQuestions.filter((q) => !q.isValid).length

  return (
    <div className="py-6 sm:py-8 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Super Admin & Moderator Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            JAMBStar Administration Portal
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-2xl">
            Manage student candidate records, promote moderators, and curate UTME past questions with live Row-Level Security.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{profiles.length}</div>
            <div className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider">Candidates</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-teal-400">
              {profiles.filter((p) => p.role === 'admin' || p.role === 'super_admin').length}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider">Admins</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{subjects.length}</div>
            <div className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider">Subjects</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-6 text-sm sm:text-base font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>👥</span>
          <span>User Management</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {profiles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`py-3 px-6 text-sm sm:text-base font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>📝</span>
          <span>Question Bank Editor</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {questions.length} in view
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: USER MANAGEMENT                                                */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {profileActionMsg && (
            <div
              className={`p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between border ${
                profileActionMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <span>{profileActionMsg.text}</span>
              <button
                onClick={() => setProfileActionMsg(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search candidates by name..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-gray-500">Track:</span>
                <select
                  value={trackFilter}
                  onChange={(e) => setTrackFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All">All Tracks</option>
                  <option value="Science">Science</option>
                  <option value="Arts">Arts</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold text-gray-500">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All">All Roles</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <button
                onClick={fetchProfiles}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          {/* User Table (Desktop) & Cards (Mobile) */}
          {loadingProfiles ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-xs text-gray-500">Loading candidate profiles from Supabase...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
              <span className="text-3xl">🔍</span>
              <h3 className="mt-2 text-sm font-bold text-gray-900">No candidates match the filter</h3>
              <p className="mt-1 text-xs text-gray-500">Try clearing your search query or selecting a different track.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Candidate Profile</th>
                      <th className="py-3 px-4">Academic Track</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Registered On</th>
                      <th className="py-3 px-4 text-right">Role Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProfiles.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                              {(p.full_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{p.full_name || 'Unnamed Candidate'}</div>
                              <div className="text-[11px] font-mono text-gray-400 truncate max-w-[180px] sm:max-w-none">
                                ID: {p.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              p.track === 'Science'
                                ? 'bg-blue-100 text-blue-700'
                                : p.track === 'Arts'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.track}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              p.role === 'super_admin'
                                ? 'bg-indigo-100 text-indigo-700'
                                : p.role === 'admin'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {p.role}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-gray-500 text-xs">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {p.role === 'student' ? (
                            <button
                              onClick={() => handleUpdateRole(p.id, 'admin')}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Promote to Admin
                            </button>
                          ) : p.role === 'admin' ? (
                            <button
                              onClick={() => handleUpdateRole(p.id, 'student')}
                              className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Demote to Student
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Protected</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: QUESTION BANK EDITOR (With Bulk CSV Upload)                    */}
      {/* ========================================================================= */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {questionActionMsg && (
            <div
              className={`p-4 rounded-xl text-xs sm:text-sm flex items-center justify-between border ${
                questionActionMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              <span>{questionActionMsg.text}</span>
              <button
                onClick={() => setQuestionActionMsg(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Action bar: Subject selector & Action CTAs */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="subject-select" className="text-xs font-bold uppercase text-gray-500 whitespace-nowrap">
                Select Subject:
              </label>
              <select
                id="subject-select"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Bulk CSV Upload Button */}
              <button
                onClick={() => {
                  setBulkError(null)
                  setShowBulkUploadModal(true)
                }}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>📂</span>
                <span>Bulk CSV Upload</span>
              </button>

              {/* Add Single Question Button */}
              <button
                onClick={handleOpenAddQuestionModal}
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>＋</span>
                <span>Add Single Question</span>
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* BULK CSV UPLOAD MODAL COMPONENT                                       */}
          {/* ===================================================================== */}
          {showBulkUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 my-8 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-lg">
                      📂
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Bulk CSV Question Bank Importer</h3>
                      <p className="text-xs text-gray-500">
                        Upload multiple UTME questions at once and map them automatically to registered subjects.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!uploadingCsv) setShowBulkUploadModal(false)
                    }}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Error Banner inside modal */}
                {bulkError && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                    <span className="text-red-500 text-base leading-none">⚠️</span>
                    <div className="flex-1 font-medium">{bulkError}</div>
                  </div>
                )}

                {/* File Upload & Template Download Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="text-xs font-semibold text-slate-700">Required CSV Column Format (9 Columns):</div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Subject, Question Text, Option A, Option B, Option C, Option D, Correct Option, Explanation, Image URL
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="w-full sm:w-auto px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📥</span>
                    <span>Download Template</span>
                  </button>
                </div>

                {/* Drag-and-drop / File Input Zone */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all">
                  <input
                    type="file"
                    id="csv-file-input"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingCsv}
                  />
                  <label
                    htmlFor="csv-file-input"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <span className="text-3xl">📄</span>
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">
                      {csvFileName ? `Selected: ${csvFileName}` : 'Click here or drag a .csv file to parse questions'}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Supports comma-separated values with quoted strings
                    </span>
                  </label>
                </div>

                {/* Parsing Spinner */}
                {parsingCsv && (
                  <div className="py-6 text-center">
                    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-xs text-gray-500 font-medium">Parsing and validating rows...</p>
                  </div>
                )}

                {/* Parsed Preview Table */}
                {parsedQuestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-700">Parsed Questions:</span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          {validCount} Valid
                        </span>
                        {invalidCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            {invalidCount} Invalid
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 text-xs">
                      {parsedQuestions.map((q) => (
                        <div
                          key={q.rowNumber}
                          className={`p-3 flex items-start justify-between gap-3 ${
                            q.isValid ? 'bg-white' : 'bg-red-50/50'
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-gray-400">Row {q.rowNumber}</span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  q.subjectId ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {q.subjectName} ({q.rawSubject})
                              </span>
                              {q.correctOption && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700">
                                  Correct: {q.correctOption}
                                </span>
                              )}
                            </div>

                            <p className="font-medium text-gray-900 line-clamp-2">{q.questionText}</p>

                            {q.imageUrl && (
                              <div className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                                <span>🖼️ Diagram:</span>
                                <span className="font-mono text-gray-600 truncate max-w-sm">{q.imageUrl}</span>
                              </div>
                            )}

                            <div className="text-[11px] text-gray-500 truncate">
                              A: {q.optionA} | B: {q.optionB} | C: {q.optionC} | D: {q.optionD}
                            </div>

                            {!q.isValid && (
                              <div className="text-red-600 font-medium text-[11px] flex items-center gap-1">
                                <span>⚠️</span>
                                <span>{q.validationError}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Footer Actions */}
                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {validCount > 0 ? (
                      <span>
                        Ready to insert <strong className="text-emerald-700">{validCount}</strong> verified questions.
                      </span>
                    ) : (
                      <span>Select a valid CSV file to preview.</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      disabled={uploadingCsv}
                      onClick={() => setShowBulkUploadModal(false)}
                      className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs sm:text-sm font-semibold cursor-pointer disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={validCount === 0 || uploadingCsv}
                      onClick={handleBatchInsertQuestions}
                      className="flex-1 sm:flex-none px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {uploadingCsv ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Inserting Questions...</span>
                        </>
                      ) : (
                        `Confirm & Import ${validCount} Questions`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Single Question Modal */}
          {showAddQuestionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 my-8">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {editingQuestionId ? 'Edit UTME Question' : 'Add New UTME Question'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {editingQuestionId
                        ? 'Update question stem, diagram, choices, or explanation.'
                        : 'Provide verified past question stem, options, diagram, and explanation.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddQuestionModal(false)}
                    className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveQuestion} className="mt-4 space-y-4 text-xs sm:text-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Target Subject</label>
                      <select
                        value={newSubjectId}
                        onChange={(e) => setNewSubjectId(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Year (Optional)</label>
                      <input
                        type="number"
                        placeholder="e.g. 2024"
                        value={newExamYear}
                        onChange={(e) => setNewExamYear(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Question Text</label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Type the full question prompt or problem statement here..."
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Question Diagram / Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://example.com/diagram.png (leave blank if question has no diagram)"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {newImageUrl.trim() && (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
                        <img
                          src={newImageUrl.trim()}
                          alt="Diagram Preview"
                          className="h-16 w-auto max-w-[120px] object-contain rounded border border-gray-200 bg-white"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                        <span className="text-[11px] text-gray-500 truncate">
                          Diagram preview. Ensure image is publicly accessible.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Options A through D */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Option A</label>
                      <input
                        type="text"
                        required
                        placeholder="First choice"
                        value={newOptionA}
                        onChange={(e) => setNewOptionA(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Option B</label>
                      <input
                        type="text"
                        required
                        placeholder="Second choice"
                        value={newOptionB}
                        onChange={(e) => setNewOptionB(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Option C</label>
                      <input
                        type="text"
                        required
                        placeholder="Third choice"
                        value={newOptionC}
                        onChange={(e) => setNewOptionC(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Option D</label>
                      <input
                        type="text"
                        required
                        placeholder="Fourth choice"
                        value={newOptionD}
                        onChange={(e) => setNewOptionD(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Correct Option Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Correct Option</label>
                    <div className="flex gap-4">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                        <label key={opt} className="inline-flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="correct_option"
                            value={opt}
                            checked={newCorrectOption === opt}
                            onChange={() => setNewCorrectOption(opt)}
                            className="text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-bold text-gray-800">Option {opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Detailed Explanation (Shown to students in review mode)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Explain the solution step-by-step..."
                      value={newExplanation}
                      onChange={(e) => setNewExplanation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowAddQuestionModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs sm:text-sm font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingQuestion}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {submittingQuestion
                        ? (editingQuestionId ? 'Updating...' : 'Saving to Database...')
                        : (editingQuestionId ? 'Update Question' : 'Save Question')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Questions List for Current Subject */}
          {loadingQuestions ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-xs text-gray-500">Fetching questions from Supabase questions table...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
              <span className="text-3xl">📝</span>
              <h3 className="mt-2 text-sm font-bold text-gray-900">No questions found for this subject</h3>
              <p className="mt-1 text-xs text-gray-500">
                Click "+ Add Single Question" or "📂 Bulk CSV Upload" to add past questions to this subject bank.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      {q.exam_year && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600">
                          UTME {q.exam_year}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditQuestionModal(q)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold px-2 py-1 rounded hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {q.image_url && (
                    <div className="my-2">
                      <img
                        src={q.image_url}
                        alt="Question diagram"
                        className="max-h-48 max-w-full object-contain rounded-md border border-gray-200 bg-white"
                      />
                    </div>
                  )}

                  <p className="text-sm font-medium text-gray-900">{q.question_text}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { key: 'A', text: q.option_a },
                      { key: 'B', text: q.option_b },
                      { key: 'C', text: q.option_c },
                      { key: 'D', text: q.option_d },
                    ].map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                          opt.key === q.correct_option
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            opt.key === q.correct_option
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                        {opt.key === q.correct_option && (
                          <span className="ml-auto text-[10px] uppercase font-bold text-emerald-600">
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Admin
