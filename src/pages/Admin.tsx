import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  track: 'Science' | 'Arts' | 'Commercial'
  role: 'student' | 'admin' | 'super_admin'
  created_at: string
}

export interface Subject {
  id: string
  name: string
  code: string
  icon?: string | null
  description?: string | null
  is_compulsory?: boolean
}

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
  created_at: string
}

export interface CBTSettings {
  examDuration: number // in minutes
  passingThreshold: number // in %
  questionsPerSubject: number
  lastUpdated?: string
}

export interface ParsedCSVQuestion {
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

export interface SupportTicketWithProfile {
  id: string
  user_id: string | null
  guest_name: string | null
  guest_email: string | null
  subject: string
  category: string
  status: 'open' | 'resolved'
  created_at: string
  updated_at: string
  candidate?: {
    full_name: string | null
    email?: string | null
    track?: string | null
    role?: string | null
  } | null
}

export interface AdminTicketMessage {
  id: string
  ticket_id: string
  sender_id: string | null
  sender_name: string | null
  message: string
  created_at: string
}

type AdminTab = 'analytics' | 'questions' | 'support' | 'users' | 'settings'

export const Admin: React.FC = () => {
  // Navigation & Authentication
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics')
  const [currentUser, setCurrentUser] = useState<{
    id: string
    email?: string
    full_name?: string | null
    role: 'student' | 'admin' | 'super_admin'
  } | null>(null)
  const [loadingUser, setLoadingUser] = useState<boolean>(true)

  // User Management State
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [totalProfilesCount, setTotalProfilesCount] = useState<number>(0)
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(true)
  const [userSearch, setUserSearch] = useState<string>('')
  const [trackFilter, setTrackFilter] = useState<string>('All')
  const [roleFilter, setRoleFilter] = useState<string>('All')
  const [quickGrantSearch, setQuickGrantSearch] = useState<string>('')
  const [profileActionMsg, setProfileActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null)
  const [deletingUser, setDeletingUser] = useState<boolean>(false)

  // Question Bank State
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [subjectQuestionCounts, setSubjectQuestionCounts] = useState<Record<string, number>>({})
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(0)
  const [loadingSubjectCounts, setLoadingSubjectCounts] = useState<boolean>(false)
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false)
  const [questionSearch, setQuestionSearch] = useState<string>('')
  const [examYearFilter, setExamYearFilter] = useState<string>('All')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const questionsPerPage = 15
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false)
  const [questionActionMsg, setQuestionActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Bulk Wipe for Subject (Super Admin Only)
  const [showBulkWipeModal, setShowBulkWipeModal] = useState<boolean>(false)
  const [wipeConfirmationInput, setWipeConfirmationInput] = useState<string>('')
  const [wipingSubject, setWipingSubject] = useState<boolean>(false)

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

  // Support Inbox State (Admin & Super Admin)
  const [supportTickets, setSupportTickets] = useState<SupportTicketWithProfile[]>([])
  const [loadingSupportTickets, setLoadingSupportTickets] = useState<boolean>(false)
  const [supportStatusFilter, setSupportStatusFilter] = useState<'open' | 'all' | 'resolved'>('open')
  const [supportCategoryFilter, setSupportCategoryFilter] = useState<string>('All')
  const [supportSearch, setSupportSearch] = useState<string>('')
  const [selectedAdminTicket, setSelectedAdminTicket] = useState<SupportTicketWithProfile | null>(null)
  const [adminTicketMessages, setAdminTicketMessages] = useState<AdminTicketMessage[]>([])
  const [loadingAdminMessages, setLoadingAdminMessages] = useState<boolean>(false)
  const [adminReplyText, setAdminReplyText] = useState<string>('')
  const [sendingAdminReply, setSendingAdminReply] = useState<boolean>(false)
  const [updatingTicketStatus, setUpdatingTicketStatus] = useState<boolean>(false)
  const [supportActionMsg, setSupportActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Global CBT Settings State (Super Admin Only)
  const [cbtSettings, setCbtSettings] = useState<CBTSettings>(() => {
    try {
      const stored = localStorage.getItem('jambstar_cbt_settings')
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          examDuration: typeof parsed.examDuration === 'number' ? parsed.examDuration : 120,
          passingThreshold: typeof parsed.passingThreshold === 'number' ? parsed.passingThreshold : 50,
          questionsPerSubject: typeof parsed.questionsPerSubject === 'number' ? parsed.questionsPerSubject : 40,
          lastUpdated: parsed.lastUpdated,
        }
      }
    } catch {
      // fallback
    }
    return {
      examDuration: 120,
      passingThreshold: 50,
      questionsPerSubject: 40,
    }
  })
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null)

  // Role Checks with normalization (handles 'super_admin', 'superadmin', 'admin' case-insensitively)
  const normalizedRole = currentUser?.role
    ? currentUser.role.toLowerCase().trim().replace(/[\s_-]/g, '')
    : null
  const isSuperAdmin = normalizedRole === 'superadmin'
  const isAdmin = normalizedRole === 'admin' || isSuperAdmin

  // ---------------------------------------------------------------------------
  // Data Fetching
  // ---------------------------------------------------------------------------

  // Fetch current user details & role from Supabase
  const fetchCurrentUser = async () => {
    setLoadingUser(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        const rawRole = profile?.role
        const clean = rawRole ? rawRole.toLowerCase().trim().replace(/[\s_-]/g, '') : ''
        const role: 'student' | 'admin' | 'super_admin' =
          clean === 'superadmin' ? 'super_admin' : clean === 'admin' ? 'admin' : 'student'

        setCurrentUser({
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || null,
          role,
        })
      }
    } catch (err) {
      console.error('Error fetching current user:', err)
    } finally {
      setLoadingUser(false)
    }
  }

  // Load Profiles with exact server-side count
  const fetchProfiles = async () => {
    setLoadingProfiles(true)
    try {
      const { data, count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      const fetched = data || []
      setProfiles(fetched)
      setTotalProfilesCount(count !== null && count !== undefined ? count : fetched.length)
    } catch (err: unknown) {
      const e = err as Error
      console.error('Error fetching profiles:', e)
    } finally {
      setLoadingProfiles(false)
    }
  }

  // Load Dynamic Exact Question Counts Per Subject (Supabase exact count query)
  const fetchExactSubjectCounts = async (subjectsList?: Subject[]) => {
    const list = subjectsList && subjectsList.length > 0 ? subjectsList : subjects
    if (!list || list.length === 0) return

    setLoadingSubjectCounts(true)
    try {
      // 1. Query exact count dynamically per subject via Supabase head query
      const countPromises = list.map(async (subj) => {
        const { count, error } = await supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', subj.id)

        if (error) {
          console.error(`Error counting questions for subject ${subj.id} (${subj.name}):`, error)
          return { id: subj.id, count: 0 }
        }
        return { id: subj.id, count: count ?? 0 }
      })

      // 2. Query exact total questions count across the entire questions table
      const totalPromise = supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })

      const [countsResults, totalRes] = await Promise.all([
        Promise.all(countPromises),
        totalPromise,
      ])

      const countsMap: Record<string, number> = {}
      countsResults.forEach(({ id, count }) => {
        countsMap[id] = count
      })
      setSubjectQuestionCounts(countsMap)

      if (totalRes.count !== null && totalRes.count !== undefined) {
        setTotalQuestionsCount(totalRes.count)
      } else {
        setTotalQuestionsCount(Object.values(countsMap).reduce((a, b) => a + b, 0))
      }
    } catch (err) {
      console.error('Error fetching exact question counts:', err)
    } finally {
      setLoadingSubjectCounts(false)
    }
  }

  // Load Subjects and calculate exact question counts immediately upon page load
  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name, code, icon, is_compulsory, description')
        .order('name', { ascending: true })

      if (error) throw error
      if (data && data.length > 0) {
        setSubjects(data)
        if (!selectedSubjectId) setSelectedSubjectId(data[0].id)
        if (!newSubjectId) setNewSubjectId(data[0].id)
        // Immediately fetch exact dynamic question counts for all subjects
        await fetchExactSubjectCounts(data)
      }
    } catch (err: unknown) {
      const e = err as Error
      console.error('Error fetching subjects:', e)
    }
  }

  // Load Detailed Questions for Selected Subject
  const fetchQuestions = async (subjectId: string) => {
    if (!subjectId) return
    setLoadingQuestions(true)
    try {
      const { data, count, error } = await supabase
        .from('questions')
        .select('*', { count: 'exact' })
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuestions(data || [])
      if (count !== null && count !== undefined) {
        setSubjectQuestionCounts((prev) => ({ ...prev, [subjectId]: count }))
      }
    } catch (err: unknown) {
      const e = err as Error
      console.error('Error fetching questions:', e)
    } finally {
      setLoadingQuestions(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Support Inbox Engine (Admin & Super Admin)
  // ---------------------------------------------------------------------------

  // Load All Support Tickets across platform with Candidate Profile Enrichment
  const fetchSupportTickets = async () => {
    setLoadingSupportTickets(true)
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const rawTickets = data || []
      const userIds = Array.from(new Set(rawTickets.map((t) => t.user_id).filter(Boolean))) as string[]

      const profileMap: Record<string, { full_name: string | null; track: string; role: string }> = {}
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, track, role')
          .in('id', userIds)

        if (profs) {
          profs.forEach((p) => {
            profileMap[p.id] = p
          })
        }
      }

      const enriched: SupportTicketWithProfile[] = rawTickets.map((t) => {
        const prof = t.user_id ? profileMap[t.user_id] : null
        return {
          ...t,
          candidate: prof
            ? {
                full_name: prof.full_name,
                email: undefined,
                track: prof.track,
                role: prof.role,
              }
            : null,
        }
      })

      setSupportTickets(enriched)

      // Keep active ticket fresh if already chosen
      if (selectedAdminTicket) {
        const updated = enriched.find((t) => t.id === selectedAdminTicket.id)
        if (updated) setSelectedAdminTicket(updated)
      } else if (enriched.length > 0) {
        handleSelectAdminTicket(enriched[0])
      }
    } catch (err: unknown) {
      const e = err as Error
      console.error('Error fetching support tickets for admin:', e)
    } finally {
      setLoadingSupportTickets(false)
    }
  }

  // Load conversation messages for selected ticket
  const fetchAdminTicketMessages = async (ticketId: string) => {
    setLoadingAdminMessages(true)
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setAdminTicketMessages(data || [])
    } catch (err) {
      console.error('Error fetching admin ticket messages:', err)
    } finally {
      setLoadingAdminMessages(false)
    }
  }

  const handleSelectAdminTicket = (ticket: SupportTicketWithProfile) => {
    setSelectedAdminTicket(ticket)
    setAdminReplyText('')
    setSupportActionMsg(null)
    fetchAdminTicketMessages(ticket.id)
  }

  // Admin reply handler
  const handleSendAdminReply = async () => {
    if (!selectedAdminTicket || !adminReplyText.trim() || !currentUser) return
    setSendingAdminReply(true)
    setSupportActionMsg(null)
    try {
      const staffLabel = currentUser.full_name || 'Staff Member'
      const roleTag = isSuperAdmin ? 'Super Admin' : 'Admin'
      const senderDisplayName = `🛡️ ${staffLabel} (${roleTag})`

      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedAdminTicket.id,
          sender_id: currentUser.id,
          sender_name: senderDisplayName,
          message: adminReplyText.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setAdminTicketMessages((prev) => [...prev, data as AdminTicketMessage])
      setAdminReplyText('')

      // Touch ticket updated_at
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedAdminTicket.id)

      setSupportActionMsg({ type: 'success', text: 'Admin reply posted to conversation thread.' })
    } catch (err: unknown) {
      const e = err as Error
      setSupportActionMsg({ type: 'error', text: `Failed to send reply: ${e.message}` })
    } finally {
      setSendingAdminReply(false)
    }
  }

  // Admin toggle ticket status (Mark as Resolved / Reopen)
  const handleToggleTicketStatus = async () => {
    if (!selectedAdminTicket) return
    const newStatus: 'open' | 'resolved' = selectedAdminTicket.status === 'open' ? 'resolved' : 'open'
    setUpdatingTicketStatus(true)
    setSupportActionMsg(null)
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedAdminTicket.id)

      if (error) throw error

      setSelectedAdminTicket((prev) => (prev ? { ...prev, status: newStatus } : null))
      setSupportTickets((prev) =>
        prev.map((t) => (t.id === selectedAdminTicket.id ? { ...t, status: newStatus } : t))
      )
      setSupportActionMsg({
        type: 'success',
        text: `Ticket successfully marked as ${newStatus === 'resolved' ? 'Resolved' : 'Open'}.`,
      })
    } catch (err: unknown) {
      const e = err as Error
      setSupportActionMsg({ type: 'error', text: `Failed to update status: ${e.message}` })
    } finally {
      setUpdatingTicketStatus(false)
    }
  }

  useEffect(() => {
    fetchCurrentUser()
    fetchProfiles()
    fetchSubjects()
    fetchSupportTickets()
  }, [])

  useEffect(() => {
    if (selectedSubjectId) {
      fetchQuestions(selectedSubjectId)
      setCurrentPage(1)
    }
  }, [selectedSubjectId])

  // ---------------------------------------------------------------------------
  // Super Admin: User Role Switcher & Account Management
  // ---------------------------------------------------------------------------

  // Update user role in profiles table
  const handleUpdateRole = async (userId: string, newRole: 'student' | 'admin' | 'super_admin') => {
    if (!isSuperAdmin) {
      setProfileActionMsg({ type: 'error', text: 'Unauthorized: Only Super Admins can modify user roles.' })
      return
    }

    // Safeguard: Prevent self-demotion
    if (userId === currentUser?.id) {
      setProfileActionMsg({ type: 'error', text: 'Safeguard active: You cannot modify or demote your own Super Admin account.' })
      return
    }

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
      setProfileActionMsg({ type: 'success', text: `User role successfully updated to "${newRole}".` })

      // Automatically re-fetch profiles from database to sync exact metric counts & state
      await fetchProfiles()
    } catch (err: unknown) {
      const e = err as Error
      setProfileActionMsg({ type: 'error', text: `Failed to update role: ${e.message}` })
    }
  }

  // Delete Candidate Account
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete || !isSuperAdmin) return

    // Safeguard: Prevent self-deletion
    if (userToDelete.id === currentUser?.id) {
      setProfileActionMsg({ type: 'error', text: 'Safeguard active: You cannot delete your own active account.' })
      setUserToDelete(null)
      return
    }

    setDeletingUser(true)
    setProfileActionMsg(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userToDelete.id)

      if (error) throw error

      setProfiles((prev) => prev.filter((p) => p.id !== userToDelete.id))
      setProfileActionMsg({
        type: 'success',
        text: `Account for "${userToDelete.full_name || userToDelete.id}" has been deleted.`,
      })
      setUserToDelete(null)

      // Automatically re-fetch profiles from database to sync exact metric counts & state
      await fetchProfiles()
    } catch (err: unknown) {
      const e = err as Error
      setProfileActionMsg({ type: 'error', text: `Failed to delete account: ${e.message}` })
    } finally {
      setDeletingUser(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Super Admin: Bulk Wipe Question Bank for Subject
  // ---------------------------------------------------------------------------
  const activeSubject = subjects.find((s) => s.id === selectedSubjectId)

  const handleBulkWipeSubjectQuestions = async () => {
    if (!isSuperAdmin) {
      setQuestionActionMsg({ type: 'error', text: 'Unauthorized: Only Super Admins can perform bulk wipe.' })
      return
    }

    if (!activeSubject) return
    if (wipeConfirmationInput.trim().toLowerCase() !== activeSubject.name.toLowerCase()) {
      setQuestionActionMsg({
        type: 'error',
        text: `Confirmation mismatch. You must type "${activeSubject.name}" exactly to confirm wipe.`,
      })
      return
    }

    setWipingSubject(true)
    setQuestionActionMsg(null)

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('subject_id', selectedSubjectId)

      if (error) throw error

      setQuestions([])
      await fetchExactSubjectCounts()
      setShowBulkWipeModal(false)
      setWipeConfirmationInput('')
      setQuestionActionMsg({
        type: 'success',
        text: `All questions for "${activeSubject.name}" have been permanently wiped.`,
      })
    } catch (err: unknown) {
      const e = err as Error
      setQuestionActionMsg({ type: 'error', text: `Failed to wipe questions: ${e.message}` })
    } finally {
      setWipingSubject(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Single Question Management (Add, Edit, Delete)
  // ---------------------------------------------------------------------------

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
        await fetchExactSubjectCounts()
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
        await fetchExactSubjectCounts()
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

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm('Are you sure you want to delete this question? This cannot be undone.')) return
    setQuestionActionMsg(null)
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error

      setQuestions((prev) => prev.filter((q) => q.id !== questionId))
      await fetchExactSubjectCounts()
      setQuestionActionMsg({ type: 'success', text: 'Question deleted successfully.' })
    } catch (err: unknown) {
      const e = err as Error
      setQuestionActionMsg({ type: 'error', text: `Failed to delete question: ${e.message}` })
    }
  }

  // ---------------------------------------------------------------------------
  // CSV Export Engine (9 Columns)
  // ---------------------------------------------------------------------------
  const handleExportCSV = () => {
    const subjName = activeSubject?.name || 'Subject'

    const headers = [
      'Subject',
      'Question Text',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Correct Option',
      'Explanation',
      'Image URL',
    ]

    const escapeCSV = (val: string | number | null | undefined): string => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = questions.map((q) => [
      escapeCSV(subjName),
      escapeCSV(q.question_text),
      escapeCSV(q.option_a),
      escapeCSV(q.option_b),
      escapeCSV(q.option_c),
      escapeCSV(q.option_d),
      escapeCSV(q.correct_option),
      escapeCSV(q.explanation || ''),
      escapeCSV(q.image_url || ''),
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute(
      'download',
      `${subjName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_questions.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // ---------------------------------------------------------------------------
  // Robust CSV Parsing & Subject Mapping Engine
  // ---------------------------------------------------------------------------
  // State-machine single-line parser respecting double quotes and escaped quotes ("")
  const parseCSVLine = (line: string): string[] => {
    const fields: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped double quote inside quoted field ("")
          current += '"'
          i++
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    fields.push(current.trim())
    return fields
  }

  const parseCSVRows = (text: string): string[][] => {
    if (!text || text.trim().length === 0) return []

    // Strip UTF-8 Byte Order Mark (BOM) if present (common in Excel exports)
    const cleanText = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

    // Universal Line Endings: handle both Windows (\r\n) and Unix (\n) line endings
    const rawLines = cleanText.split(/\r?\n/)
    const assembledLines: string[] = []
    let currentLine = ''
    let insideQuotes = false

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i]
      if (insideQuotes) {
        currentLine += '\n' + line
      } else {
        currentLine = line
      }

      // Count double quotes to check if quotes are balanced
      let quoteCount = 0
      for (let j = 0; j < currentLine.length; j++) {
        if (currentLine[j] === '"') {
          quoteCount++
        }
      }
      insideQuotes = quoteCount % 2 !== 0

      if (!insideQuotes) {
        // Clean Empty Rows: filter out completely empty or blank lines
        if (currentLine.trim().length > 0) {
          assembledLines.push(currentLine)
        }
        currentLine = ''
      }
    }

    // Capture any trailing row content
    if (currentLine.trim().length > 0) {
      assembledLines.push(currentLine)
    }

    // Parse each assembled line using the state-machine line parser
    const rows: string[][] = []
    for (const rowText of assembledLines) {
      const cols = parseCSVLine(rowText)
      // Clean Empty Rows: Ensure row has content and is not completely empty
      if (cols.length > 0 && cols.some((col) => col.trim().length > 0)) {
        rows.push(cols)
      }
    }

    return rows
  }

  const findSubjectMatch = (rawSubject: string): Subject | null => {
    if (!rawSubject || subjects.length === 0) return null
    const clean = rawSubject.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (!clean) return null

    // 1. Exact name or code match
    const exact = subjects.find(
      (s) =>
        s.name.toLowerCase().replace(/[^a-z0-9]/g, '') === clean ||
        s.code.toLowerCase().replace(/[^a-z0-9]/g, '') === clean
    )
    if (exact) return exact

    // 2. Comprehensive Nigerian UTME Subject Alias Map (handles common naming variations)
    const ALIAS_MAP: Record<string, string[]> = {
      useofenglish: ['english', 'useofeng', 'eng', 'generalenglish', 'useofenglishlanguage', 'englishlanguage', 'englang'],
      mathematics: ['maths', 'math', 'mth', 'generalmaths', 'generalmathematics', 'puremaths'],
      physics: ['phy', 'phys', 'physicsutme'],
      chemistry: ['chem', 'chm'],
      biology: ['bio', 'biol'],
      economics: ['econ', 'eco'],
      government: ['gov', 'govt'],
      literatureinenglish: ['literature', 'lit', 'litineng', 'englishlit', 'englishliterature'],
      commerce: ['comm', 'com'],
      principlesofaccounts: ['accounting', 'accounts', 'account', 'acc', 'financialaccounting', 'principlesofaccounting'],
      agriculturalscience: ['agric', 'agricscience', 'agr', 'agriculture'],
      christianreligiousknowledge: ['crk', 'crs', 'christianreligiousexamination', 'christianreligiousstudies', 'christianreligion', 'crstudies'],
    }

    for (const s of subjects) {
      const sNorm = s.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const aliases = ALIAS_MAP[sNorm] || []
      if (aliases.includes(clean)) {
        return s
      }
    }

    // 3. Contains match
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
            `Expected exactly 9 columns in CSV header, but found ${headerRow.length}. Ensure headers are: Subject, Question Text, Option A, Option B, Option C, Option D, Correct Option, Explanation, Image URL.`
          )
          setParsedQuestions([])
          setParsingCsv(false)
          return
        }

        const parsed: ParsedCSVQuestion[] = []

        for (let i = 1; i < rawRows.length; i++) {
          const r = rawRows[i]
          // Clean Empty Rows: skip rows that are completely empty
          if (r.length === 0 || r.every((c) => c.trim() === '')) continue

          // Pad row to ensure 9 columns so out-of-bounds access never returns undefined
          while (r.length < 9) {
            r.push('')
          }

          const rowNum = i + 1
          // Trim Whitespace: trim all fields and normalize correct option to uppercase
          const rawSubject = (r[0] || '').trim()
          const questionText = (r[1] || '').trim()
          const optionA = (r[2] || '').trim()
          const optionB = (r[3] || '').trim()
          const optionC = (r[4] || '').trim()
          const optionD = (r[5] || '').trim()
          const rawCorrect = (r[6] || '').trim().toUpperCase()
          const explanation = (r[7] || '').trim()
          const rawImageUrl = (r[8] || '').trim()
          const imageUrl = rawImageUrl === '' ? null : rawImageUrl

          const matchedSub = findSubjectMatch(rawSubject)

          let isValid = true
          let validationError = ''

          if (!matchedSub) {
            isValid = false
            validationError = `Subject "${rawSubject}" could not be mapped to any registered subject.`
          } else if (!questionText) {
            isValid = false
            validationError = 'Question text cannot be blank.'
          } else if (!optionA || !optionB || !optionC || !optionD) {
            isValid = false
            validationError = 'All 4 options (A, B, C, D) are required.'
          } else if (!['A', 'B', 'C', 'D'].includes(rawCorrect)) {
            isValid = false
            validationError = `Invalid correct option "${rawCorrect}". Must be A, B, C, or D.`
          }

          parsed.push({
            rowNumber: rowNum,
            rawSubject,
            subjectId: matchedSub ? matchedSub.id : null,
            subjectName: matchedSub ? matchedSub.name : 'Unknown Subject',
            questionText,
            optionA,
            optionB,
            optionC,
            optionD,
            correctOption: (['A', 'B', 'C', 'D'].includes(rawCorrect) ? rawCorrect : '') as
              | 'A'
              | 'B'
              | 'C'
              | 'D'
              | '',
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

      if (selectedSubjectId) {
        fetchQuestions(selectedSubjectId)
      }
      await fetchExactSubjectCounts()

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
    URL.revokeObjectURL(url)
  }

  // ---------------------------------------------------------------------------
  // Super Admin: Global CBT Settings Save / Reset
  // ---------------------------------------------------------------------------
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isSuperAdmin) return

    const updated: CBTSettings = {
      ...cbtSettings,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem('jambstar_cbt_settings', JSON.stringify(updated))
    setCbtSettings(updated)
    setSettingsSavedMsg('Global CBT exam configuration saved successfully! Quiz timers and rules are updated.')
    setTimeout(() => setSettingsSavedMsg(null), 4500)
  }

  const handleResetSettings = () => {
    if (!isSuperAdmin) return
    const defaults: CBTSettings = {
      examDuration: 120,
      passingThreshold: 50,
      questionsPerSubject: 40,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem('jambstar_cbt_settings', JSON.stringify(defaults))
    setCbtSettings(defaults)
    setSettingsSavedMsg('Settings reset to default JAMB UTME specifications (120 mins, 50% pass mark, 40 questions/subject).')
    setTimeout(() => setSettingsSavedMsg(null), 4500)
  }

  // ---------------------------------------------------------------------------
  // Filtered & Paginated Questions for Question Bank Tab
  // ---------------------------------------------------------------------------
  const availableYears = useMemo(() => {
    const set = new Set<string>()
    questions.forEach((q) => {
      if (q.exam_year) set.add(String(q.exam_year))
    })
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [questions])

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const qText = q.question_text.toLowerCase()
      const qExp = (q.explanation || '').toLowerCase()
      const search = questionSearch.trim().toLowerCase()

      const matchesSearch =
        search === '' || qText.includes(search) || qExp.includes(search)

      const matchesYear =
        examYearFilter === 'All' ||
        (examYearFilter === 'Unspecified' && !q.exam_year) ||
        String(q.exam_year) === examYearFilter

      return matchesSearch && matchesYear
    })
  }, [questions, questionSearch, examYearFilter])

  const totalPages = Math.max(1, Math.ceil(filteredQuestions.length / questionsPerPage))
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * questionsPerPage
    return filteredQuestions.slice(start, start + questionsPerPage)
  }, [filteredQuestions, currentPage, questionsPerPage])

  // ---------------------------------------------------------------------------
  // Filtered Users for User Management Tab
  // ---------------------------------------------------------------------------
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchesSearch =
        (p.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(userSearch.toLowerCase())
      const matchesTrack = trackFilter === 'All' || p.track === trackFilter
      const matchesRole = roleFilter === 'All' || p.role === roleFilter
      return matchesSearch && matchesTrack && matchesRole
    })
  }, [profiles, userSearch, trackFilter, roleFilter])

  // Quick grant search candidates (students only)
  const quickGrantCandidates = useMemo(() => {
    if (!quickGrantSearch.trim()) return []
    const term = quickGrantSearch.toLowerCase()
    return profiles
      .filter(
        (p) =>
          p.role === 'student' &&
          ((p.full_name || '').toLowerCase().includes(term) || p.id.toLowerCase().includes(term))
      )
      .slice(0, 5)
  }, [profiles, quickGrantSearch])

  // Computed exact metric counts distinguishing Total System Users, Candidates, and Staff/Admins
  const totalSystemUsers = totalProfilesCount || profiles.length
  const totalCandidatesCount = useMemo(() => {
    return profiles.filter((p) => p.role === 'student').length
  }, [profiles])
  const totalAdminsCount = useMemo(() => {
    return profiles.filter((p) => p.role === 'admin' || p.role === 'super_admin').length
  }, [profiles])

  const validCount = parsedQuestions.filter((q) => q.isValid).length
  const invalidCount = parsedQuestions.filter((q) => !q.isValid).length

  // Filtered support tickets for Admin Support Inbox
  const openTicketsCount = useMemo(() => {
    return supportTickets.filter((t) => t.status === 'open').length
  }, [supportTickets])

  const filteredSupportTickets = useMemo(() => {
    return supportTickets.filter((t) => {
      const matchesStatus =
        supportStatusFilter === 'all' ? true : t.status === supportStatusFilter
      const matchesCategory =
        supportCategoryFilter === 'All' ? true : t.category === supportCategoryFilter
      const q = supportSearch.toLowerCase().trim()
      const matchesSearch =
        q === '' ||
        t.subject.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.candidate?.full_name || '').toLowerCase().includes(q) ||
        (t.guest_name || '').toLowerCase().includes(q) ||
        (t.guest_email || '').toLowerCase().includes(q)

      return matchesStatus && matchesCategory && matchesSearch
    })
  }, [supportTickets, supportStatusFilter, supportCategoryFilter, supportSearch])

  const formatTicketDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      const d = new Date(dateString)
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="py-6 sm:py-8 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
      {/* ======================================================================= */}
      {/* Top Banner with RBAC Header & Role Badge                                */}
      {/* ======================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            {/* Live Role Badge */}
            {isSuperAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                👑 Super Admin
              </span>
            ) : isAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                🛡️ Admin / Moderator
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-500/20 text-gray-300 border border-gray-500/40 shadow-xs">
                Student
              </span>
            )}

            {/* Authenticated User Name/Email */}
            <span className="text-xs text-slate-300 font-medium">
              Signed in as{' '}
              <strong className="text-white">
                {currentUser?.full_name || currentUser?.email || (loadingUser ? 'Loading...' : 'Staff Member')}
              </strong>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            JAMBStar Administration Portal
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {isSuperAdmin
              ? 'Full Super Admin access enabled. Manage candidate roles, configure global CBT rules, review analytics, and curate past questions.'
              : 'Admin access active. Manage and edit UTME past question banks and view platform performance metrics.'}
          </p>
        </div>

        {/* Top Summary Metrics: Total Users, Candidates, Staff/Admins, Questions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">{totalSystemUsers}</div>
            <div className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider">Total Users</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">{totalCandidatesCount}</div>
            <div className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider">Candidates</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-teal-300">
              {totalAdminsCount}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider">Staff / Admins</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10 text-center">
            <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-300">
              {totalQuestionsCount}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-300 uppercase tracking-wider">Questions</div>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* Navigation Tabs (RBAC-Aware)                                            */}
      {/* ======================================================================= */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar gap-1">
        {/* Tab 1: Dashboard Analytics */}
        <button
          onClick={() => setActiveTab('analytics')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>📊</span>
          <span>Dashboard Analytics</span>
        </button>

        {/* Tab 2: Question Bank Editor */}
        <button
          onClick={() => setActiveTab('questions')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>📝</span>
          <span>Question Bank</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
            {totalQuestionsCount}
          </span>
        </button>

        {/* Tab 3: Support Inbox (Admin & Super Admin) */}
        <button
          onClick={() => setActiveTab('support')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'support'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>📬</span>
          <span>Support Inbox</span>
          <span
            className={`text-[11px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
              openTicketsCount > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {openTicketsCount}
          </span>
        </button>

        {/* Tab 4: User & Role Management (Super Admin Only) */}
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>👥</span>
          <span>User & Role Management</span>
          {!isSuperAdmin ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
              🔒 Super Admin
            </span>
          ) : (
            <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
              {totalSystemUsers}
            </span>
          )}
        </button>

        {/* Tab 4: Global CBT Settings (Super Admin Only) */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>⚙️</span>
          <span>Global CBT Settings</span>
          {!isSuperAdmin && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
              🔒
            </span>
          )}
        </button>
      </div>

      {/* ======================================================================= */}
      {/* SECTION 1: DASHBOARD ANALYTICS (Admin & Super Admin)                    */}
      {/* ======================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Analytics Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
                <span>Total System Users</span>
                <span className="text-lg">👥</span>
              </div>
              <div className="text-3xl font-extrabold text-gray-900 mt-2 font-mono">
                {totalSystemUsers}
              </div>
              <div className="mt-2 text-xs text-gray-500 flex gap-1.5 flex-wrap">
                <span>Candidates: <strong className="text-emerald-700">{totalCandidatesCount}</strong></span>
                <span>•</span>
                <span>Staff: <strong className="text-indigo-700">{totalAdminsCount}</strong></span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
                <span>Active Candidates</span>
                <span className="text-lg">🎓</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-700 mt-2 font-mono">
                {totalCandidatesCount}
              </div>
              <div className="mt-2 text-xs text-gray-500 flex gap-2">
                <span>Science: {profiles.filter((p) => p.role === 'student' && p.track === 'Science').length}</span>
                <span>•</span>
                <span>Arts: {profiles.filter((p) => p.role === 'student' && p.track === 'Arts').length}</span>
                <span>•</span>
                <span>Comm: {profiles.filter((p) => p.role === 'student' && p.track === 'Commercial').length}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
                <span>Administrative Staff</span>
                <span className="text-lg">🛡️</span>
              </div>
              <div className="text-3xl font-extrabold text-indigo-700 mt-2 font-mono">
                {totalAdminsCount}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {profiles.filter((p) => p.role === 'super_admin').length} Super Admin(s),{' '}
                {profiles.filter((p) => p.role === 'admin').length} Admin(s)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
                <span>Configured Exam Time</span>
                <span className="text-lg">⏱️</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-800 mt-2 font-mono">
                {cbtSettings.examDuration} <span className="text-sm font-sans font-medium text-gray-400">min</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Pass mark: {cbtSettings.passingThreshold}% • {cbtSettings.questionsPerSubject} Qs/subj
              </div>
            </div>
          </div>

          {/* Subject Readiness Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  UTME Subject Question Distribution & CBT Readiness
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Standard JAMB exam requires at least 40 questions per subject bank.
                </p>
              </div>
              {loadingSubjectCounts && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Syncing counts...</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Questions in Bank</th>
                    <th className="py-3 px-4">Readiness Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {subjects.map((s) => {
                    const count = subjectQuestionCounts[s.id] || 0
                    const isReady = count >= cbtSettings.questionsPerSubject
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                          <span>{s.icon || '📖'}</span>
                          <span>{s.name}</span>
                          {s.is_compulsory && (
                            <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                              Compulsory
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600">{s.code}</td>
                        <td className="py-3 px-4 font-mono font-bold text-gray-900">{count}</td>
                        <td className="py-3 px-4">
                          {isReady ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                              <span>✓</span>
                              <span>Ready ({count}/{cbtSettings.questionsPerSubject})</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                              <span>⚠️</span>
                              <span>Needs Questions ({count}/{cbtSettings.questionsPerSubject})</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedSubjectId(s.id)
                              setActiveTab('questions')
                            }}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                          >
                            Manage Bank →
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Track Distribution & Recent Candidates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Candidate Track Distribution</h3>
              <div className="space-y-3">
                {[
                  { name: 'Science', color: 'bg-blue-500', count: profiles.filter((p) => p.role === 'student' && p.track === 'Science').length },
                  { name: 'Arts', color: 'bg-purple-500', count: profiles.filter((p) => p.role === 'student' && p.track === 'Arts').length },
                  { name: 'Commercial', color: 'bg-amber-500', count: profiles.filter((p) => p.role === 'student' && p.track === 'Commercial').length },
                ].map((t) => {
                  const pct = totalCandidatesCount > 0 ? Math.round((t.count / totalCandidatesCount) * 100) : 0
                  return (
                    <div key={t.name}>
                      <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                        <span>{t.name}</span>
                        <span className="font-mono">{t.count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full ${t.color}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Recently Registered Candidates</h3>
              <div className="divide-y divide-gray-100 text-xs">
                {profiles.slice(0, 5).map((p) => (
                  <div key={p.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{p.full_name || 'Unnamed Candidate'}</div>
                      <div className="text-[10px] text-gray-400 font-mono truncate max-w-xs">{p.id}</div>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-500">{p.track}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* SECTION 2: QUESTION BANK EDITOR (Admin & Super Admin)                   */}
      {/* ======================================================================= */}
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

          {/* Action bar: Subject selector & Management CTAs */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              {/* Subject Selector */}
              <div className="flex items-center gap-2">
                <label htmlFor="subject-select" className="text-xs font-bold uppercase text-gray-500 whitespace-nowrap">
                  Subject:
                </label>
                <select
                  id="subject-select"
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-xs sm:text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {subjectQuestionCounts[s.id] || 0} Qs
                    </option>
                  ))}
                </select>
              </div>

              {/* Exam Year Filter */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="year-select" className="text-xs font-bold uppercase text-gray-500 whitespace-nowrap">
                  Year:
                </label>
                <select
                  id="year-select"
                  value={examYearFilter}
                  onChange={(e) => {
                    setExamYearFilter(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="All">All Years</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      UTME {yr}
                    </option>
                  ))}
                  <option value="Unspecified">Unspecified Year</option>
                </select>
              </div>
            </div>

            {/* Question Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              {/* Export to CSV Button */}
              <button
                type="button"
                onClick={handleExportCSV}
                disabled={questions.length === 0}
                className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40"
              >
                <span>📥</span>
                <span>Export to CSV</span>
              </button>

              {/* Bulk CSV Upload Button */}
              <button
                type="button"
                onClick={() => {
                  setBulkError(null)
                  setShowBulkUploadModal(true)
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>📂</span>
                <span>Bulk CSV Upload</span>
              </button>

              {/* Add Single Question Button */}
              <button
                type="button"
                onClick={handleOpenAddQuestionModal}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>＋</span>
                <span>Add Question</span>
              </button>

              {/* Bulk Wipe Button (Super Admin Only) */}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setWipeConfirmationInput('')
                    setShowBulkWipeModal(true)
                  }}
                  disabled={questions.length === 0}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-40"
                >
                  <span>🗑️</span>
                  <span>Wipe Subject Bank</span>
                </button>
              )}
            </div>
          </div>

          {/* Search bar inside Question Bank */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search questions by text or explanation keywords..."
                value={questionSearch}
                onChange={(e) => {
                  setQuestionSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {questionSearch && (
                <button
                  onClick={() => setQuestionSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500 whitespace-nowrap">
              Showing <strong className="text-gray-900">{filteredQuestions.length}</strong> of{' '}
              <strong className="text-gray-900">{questions.length}</strong> questions
            </div>
          </div>

          {/* Questions List & Pagination */}
          {loadingQuestions ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-xs text-gray-500">Fetching questions from Supabase questions table...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-xl border border-gray-200">
              <span className="text-3xl">📝</span>
              <h3 className="mt-2 text-sm font-bold text-gray-900">No matching questions found</h3>
              <p className="mt-1 text-xs text-gray-500">
                {questions.length === 0
                  ? 'Click "+ Add Question" or "📂 Bulk CSV Upload" to add past questions.'
                  : 'Try clearing your search query or changing the exam year filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedQuestions.map((q, idx) => {
                const questionNumber = (currentPage - 1) * questionsPerPage + idx + 1
                return (
                  <div key={q.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {questionNumber}
                        </span>
                        {q.exam_year && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600">
                            UTME {q.exam_year}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 font-mono">ID: {q.id.slice(0, 8)}...</span>
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

                    <p className="text-sm font-medium text-gray-900 leading-relaxed">{q.question_text}</p>

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
                )
              })}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="text-gray-500">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> (
                    {filteredQuestions.length} total questions)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      ← Previous
                    </button>
                    <span className="font-mono text-gray-700 font-bold px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* SECTION 3: SUPPORT INBOX & CANDIDATE INQUIRIES (Admin & Super Admin)    */}
      {/* ======================================================================= */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          {/* Header & Filter Controls Bar */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span>📬</span>
                  <span>Candidate Support Inbox & Inquiries</span>
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Direct communication channels with candidates. Review inquiries, syllabus disputes, and technical support requests.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSupportTickets}
                  disabled={loadingSupportTickets}
                  className="px-3.5 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <span className={loadingSupportTickets ? 'animate-spin' : ''}>↻</span>
                  <span>Refresh Inbox</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-gray-100 items-center">
              {/* Search */}
              <div className="sm:col-span-6">
                <input
                  type="text"
                  value={supportSearch}
                  onChange={(e) => setSupportSearch(e.target.value)}
                  placeholder="Search by candidate name, guest email, subject, or ticket ID..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Status Filter */}
              <div className="sm:col-span-3">
                <select
                  value={supportStatusFilter}
                  onChange={(e) => setSupportStatusFilter(e.target.value as 'all' | 'open' | 'resolved')}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="open">Status: Open Only ({openTicketsCount})</option>
                  <option value="all">Status: All Tickets ({supportTickets.length})</option>
                  <option value="resolved">Status: Resolved Only</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="sm:col-span-3">
                <select
                  value={supportCategoryFilter}
                  onChange={(e) => setSupportCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="All">All Categories</option>
                  <option value="Technical">Technical</option>
                  <option value="Question Bank Feedback">Question Bank Feedback</option>
                  <option value="Exam Inquiry">Exam Inquiry</option>
                  <option value="Payment">Payment</option>
                  <option value="Candidate Support">Candidate Support</option>
                  <option value="General">General</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Notification Message */}
          {supportActionMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                supportActionMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{supportActionMsg.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{supportActionMsg.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setSupportActionMsg(null)}
                className="text-gray-500 hover:text-gray-700 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Tickets Interface: Split Pane */}
          {loadingSupportTickets ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-2xs">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-xs text-gray-500">Loading support inbox tickets...</p>
            </div>
          ) : filteredSupportTickets.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center mx-auto border border-emerald-100">
                📫
              </div>
              <h3 className="text-base font-bold text-gray-900">No Support Tickets Match Your Filters</h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                {supportTickets.length === 0
                  ? 'No support inquiries have been submitted yet. Candidate questions submitted via the contact form or dashboard will appear here.'
                  : 'Try clearing your search query or selecting a different status/category filter.'}
              </p>
              {(supportSearch || supportStatusFilter !== 'all' || supportCategoryFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setSupportSearch('')
                    setSupportStatusFilter('all')
                    setSupportCategoryFilter('All')
                  }}
                  className="mt-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Master Ticket List (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
                <div className="p-3.5 border-b border-gray-100 bg-gray-50/70 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Tickets ({filteredSupportTickets.length})
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {openTicketsCount} Active Open
                  </span>
                </div>

                <div className="divide-y divide-gray-100 max-h-[620px] overflow-y-auto">
                  {filteredSupportTickets.map((t) => {
                    const isSelected = selectedAdminTicket?.id === t.id
                    const isOpen = t.status === 'open'
                    const candidateName =
                      t.candidate?.full_name || t.guest_name || 'Anonymous User'

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleSelectAdminTicket(t)}
                        className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200 truncate max-w-[140px]">
                            {t.category}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider shrink-0 ${
                              isOpen
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                              }`}
                            ></span>
                            {isOpen ? 'Open' : 'Resolved'}
                          </span>
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1">
                          {t.subject}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] text-gray-500 mt-0.5">
                          <span className="font-medium text-gray-700 truncate max-w-[160px]">
                            👤 {candidateName}
                          </span>
                          {t.candidate?.track && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                              {t.candidate.track}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1 pt-1 border-t border-gray-100/60 font-mono">
                          <span>Ref: JMB-{t.id.slice(0, 8).toUpperCase()}</span>
                          <span>{formatTicketDate(t.created_at)}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right Column: Ticket Detail & Conversation Thread (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
                {selectedAdminTicket ? (
                  <>
                    {/* Ticket Header & Status Toggle */}
                    <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-gray-700 border border-gray-200">
                            {selectedAdminTicket.category}
                          </span>
                          <span className="text-[11px] font-mono text-gray-400">
                            Ref: JMB-{selectedAdminTicket.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                              selectedAdminTicket.status === 'open'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                selectedAdminTicket.status === 'open'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : 'bg-gray-400'
                              }`}
                            ></span>
                            {selectedAdminTicket.status === 'open' ? 'Open' : 'Resolved'}
                          </span>

                          <button
                            type="button"
                            onClick={handleToggleTicketStatus}
                            disabled={updatingTicketStatus}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 ${
                              selectedAdminTicket.status === 'open'
                                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                : 'bg-slate-700 hover:bg-slate-800 text-white'
                            } disabled:opacity-50`}
                          >
                            {updatingTicketStatus ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : selectedAdminTicket.status === 'open' ? (
                              <span>✓ Mark as Resolved</span>
                            ) : (
                              <span>↺ Reopen Ticket</span>
                            )}
                          </button>
                        </div>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                        {selectedAdminTicket.subject}
                      </h3>

                      {/* Candidate Meta Box */}
                      <div className="mt-3 p-3 rounded-xl bg-white border border-gray-200 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-gray-400">Sender / Candidate</div>
                          <div className="font-semibold text-gray-900 truncate">
                            {selectedAdminTicket.candidate?.full_name || selectedAdminTicket.guest_name || 'Guest'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-gray-400">Email Address</div>
                          <div className="font-semibold text-gray-700 truncate">
                            {selectedAdminTicket.guest_email || (selectedAdminTicket.user_id ? 'Authenticated Account' : 'None')}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-gray-400">Track</div>
                          <div className="font-semibold text-gray-900">
                            {selectedAdminTicket.candidate?.track || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-gray-400">Role / Status</div>
                          <div className="font-semibold capitalize text-emerald-700">
                            {selectedAdminTicket.candidate?.role || (selectedAdminTicket.user_id ? 'student' : 'Guest')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="p-4 sm:p-5 space-y-3.5 max-h-[380px] overflow-y-auto bg-slate-50/40">
                      {loadingAdminMessages ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          Loading conversation messages...
                        </div>
                      ) : adminTicketMessages.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          No messages recorded on this ticket yet.
                        </div>
                      ) : (
                        adminTicketMessages.map((msg) => {
                          const isStaff =
                            msg.sender_id === currentUser?.id ||
                            (msg.sender_name && (msg.sender_name.includes('🛡️') || msg.sender_name.includes('Admin') || msg.sender_name.includes('Moderator')))

                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${
                                isStaff ? 'items-end' : 'items-start'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1 text-[11px] text-gray-400">
                                <span className={`font-semibold ${isStaff ? 'text-emerald-700' : 'text-gray-700'}`}>
                                  {isStaff
                                    ? msg.sender_name || '🛡️ Staff Member'
                                    : msg.sender_name || selectedAdminTicket.candidate?.full_name || selectedAdminTicket.guest_name || 'Candidate'}
                                </span>
                                <span>•</span>
                                <span>{formatTicketDate(msg.created_at)}</span>
                              </div>
                              <div
                                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] sm:max-w-[78%] whitespace-pre-wrap ${
                                  isStaff
                                    ? 'bg-emerald-600 text-white rounded-br-xs shadow-xs'
                                    : 'bg-white text-gray-900 border border-gray-200 rounded-bl-xs shadow-2xs'
                                }`}
                              >
                                {msg.message}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Admin Reply Composer */}
                    <div className="p-4 border-t border-gray-100 bg-white space-y-2">
                      <label htmlFor="admin-reply-input" className="sr-only">
                        Post staff response or academic explanation
                      </label>
                      <textarea
                        id="admin-reply-input"
                        rows={3}
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder="Type official staff response or resolution notes to candidate..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-400">
                          Responses are delivered directly to the candidate's dashboard.
                        </span>
                        <button
                          type="button"
                          onClick={handleSendAdminReply}
                          disabled={sendingAdminReply || !adminReplyText.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {sendingAdminReply ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Sending Reply...</span>
                            </>
                          ) : (
                            <>
                              <span>Send Official Reply</span>
                              <span>→</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-gray-400 space-y-2">
                    <span className="text-3xl">👈</span>
                    <p className="text-xs">Select a support ticket from the list on the left to inspect the conversation and send replies.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* SECTION 4: USER & ROLE MANAGEMENT (Super Admin Only)                    */}
      {/* ======================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {!isSuperAdmin ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <span className="text-4xl">🔒</span>
              <h2 className="text-xl font-extrabold text-gray-900">
                Super Admin Access Required
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Candidate user management, role assignments, and account deletions are restricted exclusively to Super Admins.
              </p>
            </div>
          ) : (
            <>
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

              {/* Quick Admin Grant Box */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚡</span>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-950">
                    Assign Admin by User Name or ID
                  </h3>
                </div>
                <p className="text-xs text-emerald-800">
                  Quickly locate any student candidate and instantly elevate them to Admin privileges.
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type student name or ID to search..."
                    value={quickGrantSearch}
                    onChange={(e) => setQuickGrantSearch(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {quickGrantCandidates.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-2 space-y-1.5 max-h-56 overflow-y-auto">
                      {quickGrantCandidates.map((c) => (
                        <div
                          key={c.id}
                          className="p-2 rounded-lg bg-gray-50 hover:bg-emerald-50 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="font-bold text-gray-900">{c.full_name || 'Unnamed Student'}</div>
                            <div className="text-[10px] font-mono text-gray-400">ID: {c.id}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateRole(c.id, 'admin')
                              setQuickGrantSearch('')
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs"
                          >
                            Grant Admin
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Search & Filters */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="w-full sm:w-72">
                  <input
                    type="text"
                    placeholder="Search candidate by name or ID..."
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
                          <th className="py-3 px-4">Track</th>
                          <th className="py-3 px-4">Current Role</th>
                          <th className="py-3 px-4">Role Switcher</th>
                          <th className="py-3 px-4 text-right">Account Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredProfiles.map((p) => {
                          const isSelf = p.id === currentUser?.id
                          return (
                            <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                                    {(p.full_name || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                                      <span>{p.full_name || 'Unnamed Candidate'}</span>
                                      {isSelf && (
                                        <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded">
                                          You
                                        </span>
                                      )}
                                    </div>
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

                              {/* Role Switcher Dropdown */}
                              <td className="py-3.5 px-4">
                                {isSelf ? (
                                  <span className="text-xs text-gray-400 italic font-mono">
                                    Super Admin (Locked)
                                  </span>
                                ) : (
                                  <select
                                    value={p.role}
                                    onChange={(e) =>
                                      handleUpdateRole(
                                        p.id,
                                        e.target.value as 'student' | 'admin' | 'super_admin'
                                      )
                                    }
                                    className="px-2.5 py-1 text-xs border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                                  >
                                    <option value="student">Student</option>
                                    <option value="admin">Admin</option>
                                    {p.role === 'super_admin' && (
                                      <option value="super_admin">Super Admin</option>
                                    )}
                                  </select>
                                )}
                              </td>

                              {/* Delete Account */}
                              <td className="py-3.5 px-4 text-right">
                                {isSelf ? (
                                  <span className="text-xs text-gray-400 italic">Self Account</span>
                                ) : (
                                  <button
                                    onClick={() => setUserToDelete(p)}
                                    className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    Delete Account
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* SECTION 4: GLOBAL CBT SETTINGS (Super Admin Only)                       */}
      {/* ======================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {!isSuperAdmin ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <span className="text-4xl">🔒</span>
              <h2 className="text-xl font-extrabold text-gray-900">
                Super Admin Access Required
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Global examination duration, passing marks, and subject rules can only be modified by Super Admins.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 sm:p-8 max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Global CBT Examination Configuration
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Adjust default parameters for candidate mock exams. Settings are stored in system local storage and dynamically referenced by the Quiz simulator.
                </p>
              </div>

              {settingsSavedMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2">
                  <span>✓</span>
                  <span>{settingsSavedMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-5 text-xs sm:text-sm">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Exam Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    required
                    value={cbtSettings.examDuration}
                    onChange={(e) =>
                      setCbtSettings({
                        ...cbtSettings,
                        examDuration: parseInt(e.target.value, 10) || 120,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Standard JAMB UTME duration is 120 minutes (2 hours). The countdown timer on Quiz.tsx will initialize with this duration.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Passing Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={cbtSettings.passingThreshold}
                    onChange={(e) =>
                      setCbtSettings({
                        ...cbtSettings,
                        passingThreshold: parseInt(e.target.value, 10) || 50,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Minimum aggregate percentage to classify candidate result as a Pass (Default: 50%).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Target Questions Per Subject
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    required
                    value={cbtSettings.questionsPerSubject}
                    onChange={(e) =>
                      setCbtSettings({
                        ...cbtSettings,
                        questionsPerSubject: parseInt(e.target.value, 10) || 40,
                      })
                    }
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Number of questions expected for standard UTME subject testing (Default: 40 questions).
                  </p>
                </div>

                {cbtSettings.lastUpdated && (
                  <div className="text-[11px] text-gray-400 italic">
                    Last modified: {new Date(cbtSettings.lastUpdated).toLocaleString()}
                  </div>
                )}

                <div className="pt-3 flex flex-col sm:flex-row gap-3 border-t border-gray-100">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Save Configuration
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                  >
                    Reset to JAMB Defaults
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 1: SAFETY CONFIRMATION FOR ACCOUNT DELETION                       */}
      {/* ======================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 text-2xl flex items-center justify-center mx-auto mb-4">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-gray-900">Permanently Delete Candidate?</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Are you sure you want to delete the account for{' '}
              <strong className="text-gray-900">
                {userToDelete.full_name || 'this candidate'}
              </strong>{' '}
              (ID: <span className="font-mono text-gray-500">{userToDelete.id.slice(0, 8)}...</span>)?
            </p>
            <p className="text-[11px] text-red-600 mt-2 font-medium">
              This action will permanently delete their profile and associated mock exam scores.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={deletingUser}
                onClick={() => setUserToDelete(null)}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {deletingUser ? 'Deleting...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 2: BULK WIPE SUBJECT QUESTIONS (Super Admin Only)                 */}
      {/* ======================================================================= */}
      {showBulkWipeModal && activeSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 text-2xl flex items-center justify-center mx-auto mb-4">
              🗑️
            </div>
            <h3 className="text-lg font-extrabold text-gray-900">
              Bulk Wipe: {activeSubject.name}
            </h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              This will permanently delete all <strong className="text-red-700 font-mono">{questions.length}</strong> questions
              currently in the question bank for <strong>{activeSubject.name}</strong>.
            </p>

            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-left text-xs text-red-800">
              To proceed, please type <strong className="font-mono text-black">{activeSubject.name}</strong> below:
            </div>

            <input
              type="text"
              placeholder={`Type "${activeSubject.name}" to confirm`}
              value={wipeConfirmationInput}
              onChange={(e) => setWipeConfirmationInput(e.target.value)}
              className="mt-3 w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs text-center font-bold focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={wipingSubject}
                onClick={() => {
                  setShowBulkWipeModal(false)
                  setWipeConfirmationInput('')
                }}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  wipingSubject ||
                  wipeConfirmationInput.trim().toLowerCase() !== activeSubject.name.toLowerCase()
                }
                onClick={handleBulkWipeSubjectQuestions}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
              >
                {wipingSubject ? 'Wiping...' : 'Confirm Bulk Wipe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* MODAL 3: BULK CSV UPLOAD                                                */}
      {/* ======================================================================= */}
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

            {bulkError && (
              <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                <span className="text-red-500 text-base leading-none">⚠️</span>
                <div className="flex-1 font-medium">{bulkError}</div>
              </div>
            )}

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

            {parsingCsv && (
              <div className="py-6 text-center">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-xs text-gray-500 font-medium">Parsing and validating rows...</p>
              </div>
            )}

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

      {/* ======================================================================= */}
      {/* MODAL 4: ADD / EDIT SINGLE QUESTION                                    */}
      {/* ======================================================================= */}
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
                    ? editingQuestionId
                      ? 'Updating...'
                      : 'Saving to Database...'
                    : editingQuestionId
                    ? 'Update Question'
                    : 'Save Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin
