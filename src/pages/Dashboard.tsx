import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AdBanner } from '../components/AdBanner'
import { UpgradeModal } from '../components/UpgradeModal'
import { CBTSetupModal } from '../components/CBTSetupModal'
import {
  NIGERIAN_BANKS,
  resolvePaystackAccount,
  generateReferralCode,
} from '../services/monetization'

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

export interface SupportTicket {
  id: string
  user_id: string | null
  guest_name: string | null
  guest_email: string | null
  subject: string
  category: string
  status: 'open' | 'resolved'
  created_at: string
  updated_at: string
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_id: string | null
  sender_name: string | null
  message: string
  created_at: string
}

export interface Notice {
  id: string
  title: string
  content: string
  created_by: string | null
  created_at: string
}

export interface WalletData {
  id?: string
  user_id?: string
  balance: number
  total_earned: number
  total_withdrawn: number
  created_at?: string
  updated_at?: string
}

export interface PayoutData {
  id: string
  user_id: string
  amount: number
  bank_name: string
  bank_code: string
  account_number: string
  account_name: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  reference: string | null
  created_at: string
}

export interface ReferralData {
  id: string
  referrer_id: string
  referred_id: string
  reward_amount: number
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
}

type DashboardTab = 'cbt' | 'messages' | 'notices' | 'monetization'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'messages') return 'messages'
    if (tabParam === 'notices') return 'notices'
    if (tabParam === 'monetization') return 'monetization'
    return 'cbt'
  })

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

  // Monetization & Payout State
  const [monetizationStatus, setMonetizationStatus] = useState<'none' | 'invited' | 'active' | 'declined'>('none')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [bankName, setBankName] = useState<string | null>(null)
  const [bankCode, setBankCode] = useState<string | null>(null)
  const [accountNumber, setAccountNumber] = useState<string | null>(null)
  const [accountName, setAccountName] = useState<string | null>(null)
  const [bankDetailsUpdatedAt, setBankDetailsUpdatedAt] = useState<string | null>(null)

  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [payouts, setPayouts] = useState<PayoutData[]>([])
  const [referrals, setReferrals] = useState<ReferralData[]>([])
  const [loadingMonetization, setLoadingMonetization] = useState<boolean>(false)

  // Candidate Opt-In / Invitation Modal State
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false)
  const [inviteModalStep, setInviteModalStep] = useState<'invite' | 'bank_setup' | 'success'>('invite')
  const [acceptingInvite, setAcceptingInvite] = useState<boolean>(false)
  const [decliningInvite, setDecliningInvite] = useState<boolean>(false)

  // Modal Bank Setup State
  const [modalBankCode, setModalBankCode] = useState<string>('')
  const [modalBankName, setModalBankName] = useState<string>('')
  const [modalAccountNumber, setModalAccountNumber] = useState<string>('')
  const [modalAccountName, setModalAccountName] = useState<string>('')
  const [modalResolvingBank, setModalResolvingBank] = useState<boolean>(false)
  const [modalBankError, setModalBankError] = useState<string | null>(null)
  const [modalSavingBank, setModalSavingBank] = useState<boolean>(false)

  // Payout Request Modal
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false)
  const [payoutAmount, setPayoutAmount] = useState<string>('1000')
  const [requestingPayout, setRequestingPayout] = useState<boolean>(false)
  const [payoutModalError, setPayoutModalError] = useState<string | null>(null)
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<boolean>(false)

  // Candidate Support & Messaging State
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState<boolean>(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false)
  const [replyText, setReplyText] = useState<string>('')
  const [sendingReply, setSendingReply] = useState<boolean>(false)
  const [showNewTicketModal, setShowNewTicketModal] = useState<boolean>(false)
  const [newSubject, setNewSubject] = useState<string>('')
  const [newCategory, setNewCategory] = useState<string>('Technical')
  const [newMessage, setNewMessage] = useState<string>('')
  const [creatingTicket, setCreatingTicket] = useState<boolean>(false)
  const [ticketModalError, setTicketModalError] = useState<string | null>(null)
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState<string | null>(null)

  // Real-Time & Chat Filter State
  const [hasUnreadMessages, setHasUnreadMessages] = useState<boolean>(false)
  const [unreadTicketIds, setUnreadTicketIds] = useState<Set<string>>(new Set())
  const [exactUnreadCount, setExactUnreadCount] = useState<number>(0)
  const [ticketSearch, setTicketSearch] = useState<string>('')
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'all' | 'open' | 'resolved'>('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Tier and Upgrade Modal State
  const [userTier, setUserTier] = useState<'free' | 'pro'>('free')
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false)
  const [upgradeReasonMessage, setUpgradeReasonMessage] = useState<string | null>(null)

  // CBT Pre-Exam Setup Modal State
  const [showPreExamModal, setShowPreExamModal] = useState<boolean>(false)
  const [preExamInitialMode, setPreExamInitialMode] = useState<'mock' | 'drill'>('mock')
  const [paystackAlert, setPaystackAlert] = useState<string | null>(null)

  // Notice Board State & Unread Badge Tracking
  const [notices, setNotices] = useState<Notice[]>([])
  const [loadingNotices, setLoadingNotices] = useState<boolean>(false)
  const [lastReadNotices, setLastReadNotices] = useState<string | null>(null)

  // Compare created_at of latest notice against candidate's last_read_notices timestamp
  const hasUnreadNotices = useMemo(() => {
    if (activeTab === 'notices') return false
    if (notices.length === 0) return false
    if (!lastReadNotices) return true
    const latestNoticeTime = new Date(notices[0].created_at).getTime()
    const lastReadTime = new Date(lastReadNotices).getTime()
    return latestNoticeTime > lastReadTime
  }, [notices, lastReadNotices, activeTab])

  // Fetch global notices from Supabase
  const fetchNotices = async () => {
    setLoadingNotices(true)
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotices((data as Notice[]) || [])
    } catch (err) {
      console.error('Error loading notices:', err)
    } finally {
      setLoadingNotices(false)
    }
  }

  // Clear Notice Board badge when candidate clicks or views the Notices tab
  const handleSelectNoticesTab = async () => {
    setActiveTab('notices')
    setSearchParams({ tab: 'notices' })
    const nowIso = new Date().toISOString()
    setLastReadNotices(nowIso)
    window.dispatchEvent(new Event('notices_read'))

    try {
      const targetUserId = currentUser?.id || (await supabase.auth.getUser()).data.user?.id
      if (targetUserId) {
        await supabase
          .from('profiles')
          .update({ last_read_notices: nowIso })
          .eq('id', targetUserId)
      }
    } catch (err) {
      console.warn('Could not update last_read_notices in profiles:', err)
    }
  }

  // Fetch exact count of unread incoming messages for the active user
  const fetchExactUnreadCount = async (userId: string) => {
    if (!userId) return
    try {
      const { count, error } = await supabase
        .from('ticket_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', userId)

      if (!error && typeof count === 'number') {
        setExactUnreadCount(count)
        setHasUnreadMessages(count > 0)
      }
    } catch (err) {
      console.error('Error fetching exact unread count:', err)
    }
  }

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

      // Read profile for greeting, subscription tier, and monetization fields
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, track, tier, is_pro, monetization_status, referral_code, bank_name, bank_code, account_number, account_name, bank_details_updated_at, last_read_notices')
        .eq('id', user.id)
        .maybeSingle()

      const isProUser = profile?.tier === 'pro' || profile?.is_pro === true
      setUserTier(isProUser ? 'pro' : 'free')

      // Legacy Pro Backfill Check: Automatically invite existing Pro candidates on login/dashboard load
      if (isProUser && (!profile?.monetization_status || profile.monetization_status === 'none')) {
        const nowIso = new Date().toISOString()
        await supabase
          .from('profiles')
          .update({
            is_pro: true,
            monetization_status: 'invited',
            monetization_invited_at: nowIso,
          })
          .eq('id', user.id)
        setMonetizationStatus('invited')
        setShowInviteModal(true)
      } else if (profile?.monetization_status) {
        setMonetizationStatus(profile.monetization_status)
        if (profile.monetization_status === 'invited') {
          setShowInviteModal(true)
        }
      }
      if (profile?.referral_code) setReferralCode(profile.referral_code)
      if (profile?.bank_name) setBankName(profile.bank_name)
      if (profile?.bank_code) setBankCode(profile.bank_code)
      if (profile?.account_number) setAccountNumber(profile.account_number)
      if (profile?.account_name) setAccountName(profile.account_name)
      if (profile?.bank_details_updated_at) setBankDetailsUpdatedAt(profile.bank_details_updated_at)

      if (profile?.monetization_status === 'active') {
        fetchWalletAndMonetization(user.id)
      }

      if (activeTab === 'notices') {
        const nowIso = new Date().toISOString()
        setLastReadNotices(nowIso)
      } else {
        setLastReadNotices(profile?.last_read_notices || null)
      }

      setCurrentUser({
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || 'Candidate',
      })

      fetchExactUnreadCount(user.id)

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

      // Fetch user's support tickets
      fetchTickets(user.id, user.email)
    } catch (err) {
      console.error('Error loading candidate history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Fetch support tickets for current candidate
  const fetchTickets = async (userId: string, email?: string) => {
    setLoadingTickets(true)
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (email) {
        query = query.or(`user_id.eq.${userId},guest_email.eq.${email}`)
      } else {
        query = query.eq('user_id', userId)
      }

      const { data, error } = await query
      if (error) throw error
      const fetchedTickets = (data as SupportTicket[]) || []
      setTickets(fetchedTickets)

      // Keep selected ticket fresh if one is already selected
      if (selectedTicket) {
        const updated = fetchedTickets.find((t) => t.id === selectedTicket.id)
        if (updated) setSelectedTicket(updated)
      } else if (fetchedTickets.length > 0) {
        // Automatically select the first ticket
        handleSelectTicket(fetchedTickets[0])
      }
    } catch (err) {
      console.error('Error fetching support tickets:', err)
    } finally {
      setLoadingTickets(false)
    }
  }

  // Fetch conversation messages for a support ticket
  const fetchTicketMessages = async (ticketId: string) => {
    setLoadingMessages(true)
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setTicketMessages((data as TicketMessage[]) || [])
    } catch (err) {
      console.error('Error fetching ticket messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSelectTicket = async (ticket: SupportTicket) => {
    if (!ticket?.id) return
    setSelectedTicket(ticket)
    setReplyText('')
    fetchTicketMessages(ticket.id)

    // Immediately update local unread state before network response
    setUnreadTicketIds((prev) => {
      const next = new Set(prev)
      next.delete(ticket.id)
      return next
    })
    setExactUnreadCount((prev) => Math.max(0, prev - 1))

    // Mark messages on this ticket as read for candidate in Supabase
    if (currentUser?.id) {
      try {
        await supabase
          .from('ticket_messages')
          .update({ is_read: true })
          .eq('ticket_id', ticket.id)
          .neq('sender_id', currentUser.id)
          .eq('is_read', false)

        fetchExactUnreadCount(currentUser.id)
      } catch (err) {
        console.warn('Could not mark ticket messages as read:', err)
      }
    }
  }

  // Send candidate follow-up reply in conversation thread
  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim() || !currentUser) return
    setSendingReply(true)
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: currentUser.id,
          sender_name: currentUser.full_name || 'Candidate',
          message: replyText.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setTicketMessages((prev) => [...prev, data as TicketMessage])
      setReplyText('')

      // Touch ticket updated_at
      await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedTicket.id)
    } catch (err: unknown) {
      const e = err as Error
      alert(`Failed to send reply: ${e.message}`)
    } finally {
      setSendingReply(false)
    }
  }

  // Create new support ticket modal submit handler
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubject.trim() || !newMessage.trim() || !currentUser) {
      setTicketModalError('Please fill in all required fields.')
      return
    }

    setCreatingTicket(true)
    setTicketModalError(null)
    try {
      // 1. Insert support ticket
      const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert({
          user_id: currentUser.id,
          guest_name: currentUser.full_name || null,
          guest_email: currentUser.email || null,
          subject: newSubject.trim(),
          category: newCategory,
          status: 'open',
        })
        .select()
        .single()

      if (ticketErr) throw ticketErr

      // 2. Insert initial message
      const { error: msgErr } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: currentUser.id,
          sender_name: currentUser.full_name || 'Candidate',
          message: newMessage.trim(),
        })

      if (msgErr) throw msgErr

      // Refresh list, select the new ticket, and close modal
      await fetchTickets(currentUser.id, currentUser.email)
      handleSelectTicket(ticket as SupportTicket)
      setShowNewTicketModal(false)
      setNewSubject('')
      setNewCategory('Technical')
      setNewMessage('')
      setTicketSuccessMsg('Support ticket successfully submitted!')
      setTimeout(() => setTicketSuccessMsg(null), 4000)
    } catch (err: unknown) {
      const e = err as Error
      setTicketModalError(e.message || 'Failed to submit ticket. Please check connection.')
    } finally {
      setCreatingTicket(false)
    }
  }

  // Monetization & Wallet Fetcher
  const fetchWalletAndMonetization = async (userId: string) => {
    setLoadingMonetization(true)
    try {
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (walletData) {
        setWallet(walletData as WalletData)
      } else {
        setWallet({ balance: 0, total_earned: 0, total_withdrawn: 0 })
      }

      const { data: payoutData } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (payoutData) setPayouts(payoutData as PayoutData[])

      const { data: referralData } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })

      if (referralData) setReferrals(referralData as ReferralData[])
    } catch (err) {
      console.warn('Error fetching monetization details:', err)
    } finally {
      setLoadingMonetization(false)
    }
  }

  // Monetization Invite Actions
  const handleAcceptInvite = async () => {
    if (!currentUser) return
    setAcceptingInvite(true)
    try {
      const code = generateReferralCode(currentUser.full_name)
      const nowIso = new Date().toISOString()

      const { error: profErr } = await supabase
        .from('profiles')
        .update({
          monetization_status: 'active',
          referral_code: code,
          updated_at: nowIso,
        })
        .eq('id', currentUser.id)

      if (profErr) throw profErr

      setMonetizationStatus('active')
      setReferralCode(code)

      // Initialize wallet
      const { data: existingWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', currentUser.id)
        .maybeSingle()

      if (!existingWallet) {
        await supabase.from('wallets').insert({
          user_id: currentUser.id,
          balance: 0.0,
          total_earned: 0.0,
          total_withdrawn: 0.0,
        })
        setWallet({ balance: 0, total_earned: 0, total_withdrawn: 0 })
      }

      setInviteModalStep('bank_setup')
    } catch (err: unknown) {
      const e = err as Error
      alert('Could not accept invitation: ' + e.message)
    } finally {
      setAcceptingInvite(false)
    }
  }

  const handleDeclineInvite = async () => {
    if (!currentUser) return
    setDecliningInvite(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          monetization_status: 'declined',
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id)

      if (error) throw error

      setMonetizationStatus('declined')
      setShowInviteModal(false)
      setPaystackAlert('Monetization invitation declined. You can request a new invitation at any time via a support ticket.')
      setTimeout(() => setPaystackAlert(null), 7000)
    } catch (err: unknown) {
      const e = err as Error
      alert('Could not decline invitation: ' + e.message)
    } finally {
      setDecliningInvite(false)
    }
  }

  // Bank Setup in Modal
  const handleModalBankSelect = (code: string) => {
    setModalBankCode(code)
    const found = NIGERIAN_BANKS.find((b) => b.code === code)
    if (found) setModalBankName(found.name)
    setModalAccountName('')
    setModalBankError(null)
  }

  const handleModalAccountNumberChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10)
    setModalAccountNumber(cleaned)
    setModalBankError(null)

    if (cleaned.length === 10 && modalBankCode) {
      setModalResolvingBank(true)
      const res = await resolvePaystackAccount(cleaned, modalBankCode)
      setModalResolvingBank(false)
      if (res.success && res.account_name) {
        setModalAccountName(res.account_name)
        setModalBankError(null)
      } else {
        setModalAccountName('')
        setModalBankError(res.message || 'Could not verify account name.')
      }
    } else {
      setModalAccountName('')
    }
  }

  const handleModalVerify = async () => {
    if (modalAccountNumber.length !== 10) {
      setModalBankError('Account number must be 10 digits.')
      return
    }
    if (!modalBankCode) {
      setModalBankError('Please select your bank.')
      return
    }
    setModalResolvingBank(true)
    setModalBankError(null)
    const res = await resolvePaystackAccount(modalAccountNumber, modalBankCode)
    setModalResolvingBank(false)
    if (res.success && res.account_name) {
      setModalAccountName(res.account_name)
      setModalBankError(null)
    } else {
      setModalAccountName('')
      setModalBankError(res.message || 'Could not verify account name.')
    }
  }

  const handleSaveModalBank = async () => {
    if (!currentUser) return
    if (modalAccountNumber.length !== 10) {
      setModalBankError('Account number must be 10 digits.')
      return
    }
    if (!modalBankCode || !modalBankName) {
      setModalBankError('Please select your bank.')
      return
    }
    if (!modalAccountName.trim()) {
      setModalBankError('Please verify your account details with Paystack before saving.')
      return
    }

    setModalSavingBank(true)
    setModalBankError(null)
    try {
      const nowIso = new Date().toISOString()
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_name: modalBankName,
          bank_code: modalBankCode,
          account_number: modalAccountNumber,
          account_name: modalAccountName.trim(),
          bank_details_updated_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', currentUser.id)

      if (error) throw error

      setBankName(modalBankName)
      setBankCode(modalBankCode)
      setAccountNumber(modalAccountNumber)
      setAccountName(modalAccountName.trim())
      setBankDetailsUpdatedAt(nowIso)
      setInviteModalStep('success')
    } catch (err: unknown) {
      const e = err as Error
      setModalBankError(e.message || 'Failed to save bank details.')
    } finally {
      setModalSavingBank(false)
    }
  }

  const handleRequestReinvitation = async () => {
    if (!currentUser) return
    try {
      const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert({
          user_id: currentUser.id,
          subject: 'Monetization Re-invitation Request',
          category: 'Monetization Re-invitation Request',
          status: 'open',
        })
        .select()
        .single()

      if (ticketErr) throw ticketErr

      await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        sender_id: currentUser.id,
        sender_name: currentUser.full_name || 'Candidate',
        message: 'Hello Admin, I previously declined or missed my monetization invitation. I would like to request a new invitation to participate in the JAMBStar Affiliate Program and start earning referral commissions. Thank you.',
      })

      fetchTickets(currentUser.id, currentUser.email)
      setActiveTab('messages')
      setSearchParams({ tab: 'messages' })
      setPaystackAlert('Your monetization re-invitation request ticket has been submitted to administrators.')
      setTimeout(() => setPaystackAlert(null), 7000)
    } catch (err: unknown) {
      const e = err as Error
      alert('Failed to submit re-invitation request: ' + e.message)
    }
  }

  const handleSubmitPayout = async () => {
    if (!currentUser || !wallet) return
    const amt = parseFloat(payoutAmount)
    if (isNaN(amt) || amt < 1000) {
      setPayoutModalError('Minimum withdrawal amount is ₦1,000.')
      return
    }
    if (amt > wallet.balance) {
      setPayoutModalError(`Requested amount exceeds available balance (₦${wallet.balance.toLocaleString()}).`)
      return
    }
    if (!bankName || !accountNumber || !accountName || !bankCode) {
      setPayoutModalError('Please configure your verified Nigerian bank details in Settings first.')
      return
    }

    setRequestingPayout(true)
    setPayoutModalError(null)
    try {
      const nowIso = new Date().toISOString()
      const ref = `PAYOUT_${currentUser.id.slice(0, 6)}_${Date.now()}`

      const { error: payoutErr } = await supabase.from('payouts').insert({
        user_id: currentUser.id,
        amount: amt,
        bank_name: bankName,
        bank_code: bankCode,
        account_number: accountNumber,
        account_name: accountName,
        status: 'pending',
        reference: ref,
      })

      if (payoutErr) throw payoutErr

      const newBal = Math.max(0, wallet.balance - amt)
      const newWithdrawn = (wallet.total_withdrawn || 0) + amt

      const { error: wErr } = await supabase
        .from('wallets')
        .update({
          balance: newBal,
          total_withdrawn: newWithdrawn,
          updated_at: nowIso,
        })
        .eq('user_id', currentUser.id)

      if (wErr) throw wErr

      setWallet((prev) => (prev ? { ...prev, balance: newBal, total_withdrawn: newWithdrawn } : null))
      setPayoutSuccessMsg(`Withdrawal request for ₦${amt.toLocaleString()} submitted successfully. Our team will process it to your bank account.`)
      fetchWalletAndMonetization(currentUser.id)
      setTimeout(() => {
        setShowPayoutModal(false)
        setPayoutSuccessMsg(null)
      }, 3000)
    } catch (err: unknown) {
      const e = err as Error
      setPayoutModalError(e.message || 'Failed to submit withdrawal request.')
    } finally {
      setRequestingPayout(false)
    }
  }

  const handleCopyReferralLink = () => {
    if (!referralCode) return
    const url = `${window.location.origin}/?ref=${referralCode}`
    navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  useEffect(() => {
    fetchSubjects()
    fetchCandidateDataAndHistory()
    fetchNotices()
  }, [])

  // Handle ?setup=true, ?upgradeNotice=topic_drill, and ?tab= triggers from Navbar or external links
  useEffect(() => {
    if (searchParams.get('upgradeNotice') === 'topic_drill') {
      setUpgradeReasonMessage(
        'Topic Practice Drills are exclusive to Pro members. Upgrade to Pro for ₦1,000 to unlock targeted subject practice.'
      )
      setShowUpgradeModal(true)
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('upgradeNotice')
      setSearchParams(newParams, { replace: true })
    }

    if (searchParams.get('setup') === 'true') {
      setShowPreExamModal(true)
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('setup')
      setSearchParams(newParams, { replace: true })
    }

    const tabParam = searchParams.get('tab')
    if (tabParam === 'messages') {
      setActiveTab('messages')
    } else if (tabParam === 'notices') {
      setActiveTab('notices')
    }
  }, [searchParams])

  // Auto-scroll chat thread to bottom on message update
  useEffect(() => {
    if (activeTab === 'messages') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [ticketMessages, activeTab])

  // Clear unread notice badge when candidate navigates to or views the notices tab
  useEffect(() => {
    if (activeTab === 'notices') {
      const nowIso = new Date().toISOString()
      setLastReadNotices(nowIso)
      window.dispatchEvent(new Event('notices_read'))
      const markNoticesAsRead = async () => {
        try {
          const targetUserId = currentUser?.id || (await supabase.auth.getUser()).data.user?.id
          if (targetUserId) {
            await supabase
              .from('profiles')
              .update({ last_read_notices: nowIso })
              .eq('id', targetUserId)
          }
        } catch (err) {
          console.warn('Could not update last_read_notices in profiles:', err)
        }
      }
      markNoticesAsRead()
    }
  }, [activeTab, currentUser?.id])

  // Sync notice badge if read in another component (e.g. Navbar)
  useEffect(() => {
    const handleNoticesRead = () => {
      setLastReadNotices(new Date().toISOString())
    }
    window.addEventListener('notices_read', handleNoticesRead)
    return () => {
      window.removeEventListener('notices_read', handleNoticesRead)
    }
  }, [])

  // Real-time Supabase subscription for incoming messages and ticket updates
  useEffect(() => {
    if (!currentUser?.id) return

    const channel = supabase
      .channel(`schema-db-changes-dashboard-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
        },
        (payload) => {
          const newMsg = payload.new as TicketMessage
          if (!newMsg) return

          // If message is for active ticket, append live to thread
          setSelectedTicket((current) => {
            if (current && newMsg.ticket_id === current.id) {
              setTicketMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev
                return [...prev, newMsg]
              })
            }
            return current
          })

          // If message sent by staff/admin (sender_id !== currentUser.id), trigger unread badge & count
          if (newMsg.sender_id !== currentUser.id) {
            setHasUnreadMessages(true)
            setUnreadTicketIds((prev) => new Set([...prev, newMsg.ticket_id]))
            fetchExactUnreadCount(currentUser.id)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_tickets',
        },
        (payload) => {
          const updated = payload.new as SupportTicket
          if (!updated) return
          setTickets((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
          )
          setSelectedTicket((current) =>
            current && current.id === updated.id ? { ...current, ...updated } : current
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesStatus =
        ticketStatusFilter === 'all' ? true : t.status === ticketStatusFilter
      const q = ticketSearch.toLowerCase().trim()
      const matchesSearch =
        q === '' ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [tickets, ticketStatusFilter, ticketSearch])

  const openTicketsCount = useMemo(() => {
    return tickets.filter((t) => t.status === 'open').length
  }, [tickets])

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

  // Check for Paystack payment return query parameters
  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref')
    if (ref && currentUser?.id) {
      const verifyAndUpgrade = async () => {
        try {
          const nowIso = new Date().toISOString()
          const { error } = await supabase
            .from('profiles')
            .update({
              tier: 'pro',
              is_pro: true,
              monetization_status: 'invited',
              monetization_invited_at: nowIso,
              updated_at: nowIso,
            })
            .eq('id', currentUser.id)

          if (!error) {
            setUserTier('pro')
            setMonetizationStatus('invited')
            setShowInviteModal(true)
            setPaystackAlert('🎉 Congratulations! Your payment was verified and JAMBStar Pro lifetime access has been unlocked.')
            setTimeout(() => setPaystackAlert(null), 8000)
            const newParams = new URLSearchParams(searchParams)
            newParams.delete('reference')
            newParams.delete('trxref')
            setSearchParams(newParams, { replace: true })
          }
        } catch (err) {
          console.error('Error verifying redirect transaction:', err)
        }
      }
      verifyAndUpgrade()
    }
  }, [searchParams, currentUser?.id])

  // CBT Pre-Exam Launch Handlers
  const handleOpenPreExamSetup = () => {
    setPreExamInitialMode('mock')
    setShowPreExamModal(true)
  }

  const handleLaunchExamFromSetup = (
    chosenSubjectIds: string[],
    durationMinutes: number,
    drillConfig?: {
      isTopicDrill: boolean
      subjectId: string
      topicIds: string[]
      topicNames: string[]
      questionCount: number
      isUntimed: boolean
    }
  ) => {
    if (drillConfig?.isTopicDrill && userTier !== 'pro') {
      setShowPreExamModal(false)
      setUpgradeReasonMessage(
        'Topic Practice Drills are exclusive to Pro members. Upgrade to Pro for ₦1,000 to unlock targeted subject practice.'
      )
      setShowUpgradeModal(true)
      return
    }

    // Clear any previous active CBT session when launching a new exam
    try {
      localStorage.removeItem('jambstar_active_cbt_session')
    } catch {
      // ignore
    }
    const chosenSubjects = subjects.filter((s) => chosenSubjectIds.includes(s.id))
    setShowPreExamModal(false)
    navigate('/quiz', {
      state: {
        selectedSubjectIds: chosenSubjectIds,
        selectedSubjects: chosenSubjects,
        durationMinutes,
        isTopicDrill: drillConfig?.isTopicDrill || false,
        drillSubject: drillConfig ? subjects.find((s) => s.id === drillConfig.subjectId) : undefined,
        drillTopicIds: drillConfig?.topicIds || [],
        drillTopicNames: drillConfig?.topicNames || [],
        questionCount: drillConfig?.questionCount || 40,
        isUntimed: drillConfig?.isUntimed || false,
      },
    })
  }

  return (
    <div className="py-6 sm:py-10 px-4 max-w-5xl mx-auto space-y-8">
      {/* Candidate Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Candidate Dashboard
            </div>
            {userTier === 'pro' ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-2xs">
                ⭐ Pro Member
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors cursor-pointer"
              >
                <span>⭐ Upgrade to Pro</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome, {currentUser?.full_name || 'Candidate'}!
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500 font-mono">
            {currentUser?.email}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              if (userTier !== 'pro') {
                setUpgradeReasonMessage(
                  'Topic Practice Drills are exclusive to Pro members. Upgrade to Pro for ₦1,000 to unlock targeted subject practice.'
                )
                setShowUpgradeModal(true)
                return
              }
              setPreExamInitialMode('drill')
              setShowPreExamModal(true)
            }}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs ${
              !loading
                ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 hover:shadow-md cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>🎯</span>
            <span>Topic Practice Drill</span>
          </button>
          <button
            onClick={handleOpenPreExamSetup}
            disabled={loading}
            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm ${
              !loading
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Launch CBT Exam →
          </button>
        </div>
      </div>

      {/* Paystack Upgrade Alert */}
      {paystackAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🎉</span>
            <span>{paystackAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaystackAlert(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dashboard Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => {
            setActiveTab('cbt')
            setSearchParams({})
          }}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'cbt'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>🎯</span>
          <span>CBT Drills & Performance</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('messages')
            setSearchParams({ tab: 'messages' })
            if (selectedTicket) {
              setUnreadTicketIds((prev) => {
                const next = new Set(prev)
                next.delete(selectedTicket.id)
                if (next.size === 0) setHasUnreadMessages(false)
                return next
              })
            }
          }}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'messages'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="relative inline-flex items-center">
            <span>💬</span>
            {hasUnreadMessages && (
              <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </span>
          <span>Messages & Support</span>
          {exactUnreadCount > 0 ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-600 text-white shadow-xs animate-pulse">
              {exactUnreadCount}
            </span>
          ) : openTicketsCount > 0 ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-100 text-amber-800">
              {openTicketsCount}
            </span>
          ) : (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-gray-100 text-gray-600">
              0
            </span>
          )}
        </button>

        <button
          onClick={handleSelectNoticesTab}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'notices'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span className="relative inline-flex items-center">
            <span>📢</span>
            {hasUnreadNotices && (
              <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            )}
          </span>
          <span>Notices & Updates</span>
          {hasUnreadNotices ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-rose-600 text-white shadow-xs animate-pulse">
              New
            </span>
          ) : notices.length > 0 ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-100 text-emerald-800">
              {notices.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => {
            setActiveTab('monetization')
            setSearchParams({ tab: 'monetization' })
            if (currentUser?.id && monetizationStatus === 'active') {
              fetchWalletAndMonetization(currentUser.id)
            }
          }}
          className={`py-3 px-5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'monetization'
              ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <span>💼</span>
          <span>Affiliate & Earnings</span>
          {monetizationStatus === 'invited' ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-amber-400 text-slate-950 animate-pulse">
              Invite!
            </span>
          ) : monetizationStatus === 'active' && wallet ? (
            <span className="text-[11px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-100 text-emerald-800">
              ₦{wallet.balance.toLocaleString()}
            </span>
          ) : null}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CBT DRILLS & PERFORMANCE ANALYTICS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'cbt' && (
        <div className="space-y-8">

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
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                if (userTier !== 'pro') {
                  setUpgradeReasonMessage(
                    'Topic Practice Drills are exclusive to Pro members. Upgrade to Pro for ₦1,000 to unlock targeted subject practice.'
                  )
                  setShowUpgradeModal(true)
                  return
                }
                setPreExamInitialMode('drill')
                setShowPreExamModal(true)
              }}
              disabled={loading}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5 ${
                !loading
                  ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-sm cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>🎯</span>
              <span>Topic Practice Drill</span>
            </button>
            <button
              onClick={handleOpenPreExamSetup}
              disabled={loading}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                !loading
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Configure & Launch CBT Exam →
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

      {/* ========================================================================= */}
      {/* TAB 2: CANDIDATE MESSAGES & SUPPORT                                       */}
      {/* ========================================================================= */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          {/* Top Bar with 'New Support Ticket' CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>💬</span>
                <span>Support Inquiries & Conversation Threads</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Submit queries regarding past question explanations, scoring, or technical issues directly to administrators.
              </p>
            </div>
            <button
              onClick={() => {
                setTicketModalError(null)
                setShowNewTicketModal(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <span>＋</span>
              <span>New Support Ticket</span>
            </button>
          </div>

          {/* Action Success Alert Banner */}
          {ticketSuccessMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between">
              <span>✓ {ticketSuccessMsg}</span>
              <button
                onClick={() => setTicketSuccessMsg(null)}
                className="text-emerald-600 hover:text-emerald-800 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Main Tickets Interface: Split Pane / List */}
          {loadingTickets ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-2xs">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-xs text-gray-500">Loading your support tickets...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white p-10 text-center rounded-2xl border border-dashed border-gray-300 shadow-2xs space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 text-2xl flex items-center justify-center mx-auto border border-emerald-100">
                📬
              </div>
              <h3 className="text-base font-bold text-gray-900">No Support Tickets Yet</h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                Need help with a question explanation, academic track guidance, or payment verification? Click <strong>'New Support Ticket'</strong> to open a direct discussion thread with the administrative team.
              </p>
              <button
                onClick={() => {
                  setTicketModalError(null)
                  setShowNewTicketModal(true)
                }}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                <span>＋ Create Your First Ticket</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Pane: Ticket Search & Thread List (5 cols) */}
              <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
                {/* Search & Status Filters */}
                <div className="p-3.5 border-b border-gray-100 bg-gray-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Conversations ({tickets.length})
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {openTicketsCount} Active Open
                    </span>
                  </div>

                  <input
                    type="text"
                    value={ticketSearch}
                    onChange={(e) => setTicketSearch(e.target.value)}
                    placeholder="Search by subject, category, or ref..."
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />

                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {(['all', 'open', 'resolved'] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setTicketStatusFilter(st)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                          ticketStatusFilter === st
                            ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
                  {filteredTickets.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400">
                      No tickets match your search.
                    </div>
                  ) : (
                    filteredTickets.map((t) => {
                      const isSelected = selectedTicket?.id === t.id
                      const isOpen = t.status === 'open'
                      const isUnread = unreadTicketIds.has(t.id)

                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectTicket(t)}
                          className={`w-full text-left p-4 transition-colors flex flex-col gap-1.5 cursor-pointer relative ${
                            isSelected
                              ? 'bg-emerald-50/70 border-l-4 border-emerald-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                {t.category}
                              </span>
                              {isUnread && (
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" title="New unread message"></span>
                                </span>
                              )}
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
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

                          <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                            <span className="font-mono text-[10px]">Ref: JMB-{t.id.slice(0, 8).toUpperCase()}</span>
                            <span>{formatDate(t.created_at)}</span>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Right Pane: Real-Time Live Chat Thread (7 cols) */}
              <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col">
                {selectedTicket ? (
                  <>
                    {/* Live Chat Header */}
                    <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-gray-700 border border-gray-200">
                            {selectedTicket.category}
                          </span>
                          <span className="text-[11px] font-mono text-gray-400">
                            Ref: JMB-{selectedTicket.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                            selectedTicket.status === 'open'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              selectedTicket.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                            }`}
                          ></span>
                          {selectedTicket.status === 'open' ? 'Status: Open' : 'Status: Resolved'}
                        </span>
                      </div>

                      <h3 className="text-base font-extrabold text-gray-900">
                        {selectedTicket.subject}
                      </h3>
                      <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                        <span>Opened on {formatDate(selectedTicket.created_at)}</span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Live Real-Time Sync Active
                        </span>
                      </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="p-4 sm:p-5 space-y-3.5 max-h-[380px] min-h-[260px] overflow-y-auto bg-slate-50/40">
                      {loadingMessages ? (
                        <div className="py-12 text-center text-xs text-gray-400">
                          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          Loading conversation thread...
                        </div>
                      ) : ticketMessages.length === 0 ? (
                        <div className="py-12 text-center text-xs text-gray-400">
                          No messages recorded on this ticket yet.
                        </div>
                      ) : (
                        ticketMessages.map((msg) => {
                          const isCandidate = msg.sender_id === currentUser?.id
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${
                                isCandidate ? 'items-end' : 'items-start'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1 text-[11px] text-gray-400">
                                <span className={`font-semibold ${isCandidate ? 'text-gray-700' : 'text-emerald-700'}`}>
                                  {isCandidate ? 'You (Candidate)' : msg.sender_name || '🛡️ Support Staff'}
                                </span>
                                <span>•</span>
                                <span>{formatDate(msg.created_at)}</span>
                              </div>
                              <div
                                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] sm:max-w-[78%] whitespace-pre-wrap ${
                                  isCandidate
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
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Composer Box with Real-Time Send */}
                    <div className="p-4 border-t border-gray-100 bg-white space-y-2">
                      <label htmlFor="candidate-reply" className="sr-only">
                        Type your follow-up reply
                      </label>
                      <textarea
                        id="candidate-reply"
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendReply()
                          }
                        }}
                        placeholder="Type your message or follow-up question... (Press Enter to send, Shift+Enter for new line)"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                      />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-gray-400">
                          Responses appear live in real-time. Admins are notified instantly.
                        </span>
                        <button
                          type="button"
                          onClick={handleSendReply}
                          disabled={sendingReply || !replyText.trim()}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {sendingReply ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <span>Send Message</span>
                              <span>➤</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-xs text-gray-400">
                    Select a conversation from the left to view the live chat thread.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GLOBAL ANNOUNCEMENTS & NOTICES                                      */}
      {/* ========================================================================= */}
      {activeTab === 'notices' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>📢</span>
              <span>Official Announcements & Notices</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Stay up to date with official JAMB notifications, syllabus advisories, and JAMBStar platform updates.
            </p>
          </div>

          {loadingNotices ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-3 text-xs text-gray-500">Loading announcements...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 space-y-3">
              <span className="text-4xl">📢</span>
              <h3 className="text-base font-bold text-gray-900">No Announcements at this time</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Check back periodically for syllabus revisions, UTME registration updates, and mock exam schedules.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span>📢</span>
                      <span>Official Notice</span>
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      {new Date(notice.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                    {notice.title}
                  </h3>

                  <div className="text-xs sm:text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {notice.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MONETIZATION & AFFILIATE EARNINGS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'monetization' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                <span>💰</span>
                <span>Affiliate Earnings Program</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                Monetization & Payout Center
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Earn ₦200 cash reward for every candidate who upgrades to JAMBStar Pro using your unique referral code.
              </p>
            </div>

            {monetizationStatus === 'active' && (
              <button
                type="button"
                onClick={() => setShowPayoutModal(true)}
                disabled={(wallet?.balance || 0) < 1000}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                <span>💳</span>
                <span>Request Payout</span>
              </button>
            )}
          </div>

          {/* Subview A: Invitation Pending */}
          {monetizationStatus === 'invited' && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-2xl p-6 sm:p-8 text-white shadow-md space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950">
                <span>⭐</span>
                <span>You're Invited!</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black">
                Start Earning with the JAMBStar Affiliate Program
              </h3>
              <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                As a valued member, you are invited to join our affiliate program. Earn ₦200 for every candidate that joins JAMBStar Pro with your referral link. Payouts are credited directly to your verified Nigerian bank account with a minimum withdrawal threshold of ₦1,000 (5 referrals).
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setInviteModalStep('invite')
                    setShowInviteModal(true)
                  }}
                  className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-white text-emerald-800 hover:bg-emerald-50 shadow-md transition-all cursor-pointer"
                >
                  Accept Invitation & Setup Bank →
                </button>
                <button
                  type="button"
                  onClick={handleDeclineInvite}
                  disabled={decliningInvite}
                  className="px-4 py-3 rounded-xl text-xs font-semibold text-emerald-100 hover:text-white hover:bg-emerald-700/50 transition-colors cursor-pointer"
                >
                  Decline for Now
                </button>
              </div>
            </div>
          )}

          {/* Subview B: Invitation Declined */}
          {monetizationStatus === 'declined' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Affiliate Invitation Declined
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                    You previously opted out of the JAMBStar Affiliate Program. If you have changed your mind and would like to start earning ₦200 per referral, you can request a new invitation.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleRequestReinvitation}
                  className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>📨</span>
                  <span>Request New Invitation via Support Ticket</span>
                </button>
              </div>
            </div>
          )}

          {/* Subview C: None (Free user or uninvited Pro) */}
          {monetizationStatus === 'none' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
              {userTier !== 'pro' ? (
                <>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🔒</span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        Pro Affiliate Monetization Program
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                        The JAMBStar Affiliate Program is an exclusive benefit for JAMBStar Pro members. Upgrade your account to unlock lifetime Pro CBT practice, unlimited topic drills, and your personal affiliate referral code to earn ₦200 per referral.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-6 py-3 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors cursor-pointer"
                    >
                      ⭐ Upgrade to JAMBStar Pro (₦1,000)
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⏳</span>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
                        Affiliate Program Onboarding
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                        Your Pro account is eligible for monetization. If you have not yet received your invitation popup, you can submit a quick request ticket to our administrator team.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleRequestReinvitation}
                      className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span>📨</span>
                      <span>Request Monetization Invitation</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Subview D: Active Affiliate Dashboard */}
          {monetizationStatus === 'active' && (
            loadingMonetization ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-3 text-xs text-gray-500">Loading wallet and affiliate stats...</p>
              </div>
            ) : (
            <>
              {/* 4 Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-400">
                    <span>Wallet Balance</span>
                    <span className="text-lg">💵</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 font-mono">
                    ₦{(wallet?.balance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {(wallet?.balance || 0) >= 1000 ? (
                      <span className="text-emerald-700 font-bold">✓ Ready for withdrawal</span>
                    ) : (
                      <span>₦{(1000 - (wallet?.balance || 0)).toLocaleString()} to min payout</span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-400">
                    <span>Total Earned</span>
                    <span className="text-lg">📈</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 font-mono">
                    ₦{(wallet?.total_earned || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    All-time cumulative commissions
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-400">
                    <span>Total Withdrawn</span>
                    <span className="text-lg">🏦</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 font-mono">
                    ₦{(wallet?.total_withdrawn || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Successfully transferred to bank
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold uppercase text-gray-400">
                    <span>Total Referrals</span>
                    <span className="text-lg">👥</span>
                  </div>
                  <div className="text-2xl font-black text-gray-900 font-mono">
                    {referrals.length}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    Completed Pro upgrades
                  </div>
                </div>
              </div>

              {/* Referral Link & Bank Summary Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 7 cols: Referral Link & Share Tools */}
                <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span>🔗</span>
                      <span>Your Unique Referral Link</span>
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      ₦200 / referral
                    </span>
                  </div>

                  <p className="text-xs text-gray-500">
                    Share this link with classmates, tutorial groups, or on social media. When someone registers and upgrades to Pro, your wallet is credited instantly.
                  </p>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase text-gray-600">
                      Referral Link
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={referralCode ? `${window.location.origin}/?ref=${referralCode}` : 'Generating...'}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs sm:text-sm font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleCopyReferralLink}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 shadow-xs transition-colors cursor-pointer"
                      >
                        {copiedLink ? '✓ Copied' : 'Copy Link'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
                    <span className="text-gray-500">Referral Code:</span>
                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md">
                      {referralCode || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Right 5 cols: Bank Account Snapshot */}
                <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <span>🏦</span>
                      <span>Payout Account</span>
                    </h3>
                    <Link
                      to="/settings"
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      Manage in Settings →
                    </Link>
                  </div>

                  {bankName && accountNumber ? (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bank:</span>
                        <span className="font-bold text-gray-900">{bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Account:</span>
                        <span className="font-mono font-bold text-gray-900">••••{accountNumber.slice(-4)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Account Name:</span>
                        <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                          ✓ {accountName}
                        </span>
                      </div>
                      {bankDetailsUpdatedAt && (
                        <div className="flex justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-100">
                          <span>Last Updated:</span>
                          <span>{new Date(bankDetailsUpdatedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                      <div className="font-bold">No payout bank configured</div>
                      <p className="text-[11px] text-amber-800">
                        Set up your Nigerian bank details so we can credit your withdrawal requests.
                      </p>
                      <Link
                        to="/settings"
                        className="inline-block font-bold text-amber-900 underline mt-1"
                      >
                        Set Bank Details Now
                      </Link>
                    </div>
                  )}

                  <div className="text-[11px] text-gray-400">
                    Withdrawal threshold is ₦1,000. Changes to bank details in Settings are protected by a 7-day cooldown.
                  </div>
                </div>
              </div>

              {/* Payout & Referral History Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payout History */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center justify-between">
                    <span>Withdrawal History</span>
                    <span className="text-xs text-gray-400 font-normal">({payouts.length} requests)</span>
                  </h3>

                  {payouts.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                      No withdrawal requests yet. Request your first payout once your balance reaches ₦1,000.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                      {payouts.map((p) => (
                        <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-gray-900 font-mono">
                              ₦{p.amount.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-gray-500 mt-0.5">
                              {p.bank_name} ••••{p.account_number.slice(-4)}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {new Date(p.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                          <div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                p.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : p.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {p.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Referral History */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-gray-900 flex items-center justify-between">
                    <span>Recent Referrals</span>
                    <span className="text-xs text-gray-400 font-normal">({referrals.length} completed)</span>
                  </h3>

                  {referrals.length === 0 ? (
                    <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                      No referrals yet. Share your referral link to earn ₦200 per Pro upgrade!
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
                      {referrals.map((r) => (
                        <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-bold text-emerald-700 font-mono">
                              +₦{(r.reward_amount || 200).toLocaleString()}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              Candidate Pro Upgrade
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {new Date(r.created_at).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                          <div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                              {r.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NEW SUPPORT TICKET                                                 */}
      {/* ========================================================================= */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl w-[95%] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-xl border border-gray-200 mx-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <h3 className="text-base font-bold text-gray-900">
                  Open New Support Ticket
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {ticketModalError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {ticketModalError}
              </div>
            )}

            <form onSubmit={handleCreateTicket} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g., Question #12 Explanation Error in Physics"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-gray-800"
                >
                  <option value="Technical">Technical Bug / Timer Glitch</option>
                  <option value="Question Bank Feedback">Question Bank Error / Explanation Feedback</option>
                  <option value="Exam Inquiry">Exam & Subject Inquiry</option>
                  <option value="Payment">Payment & Subscription</option>
                  <option value="Candidate Support">Candidate Profile & Track Change</option>
                  <option value="Monetization Re-invitation Request">Monetization Re-invitation Request</option>
                  <option value="General">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Message Description *
                </label>
                <textarea
                  rows={4}
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Provide specific details about the issue or question..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingTicket ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Support Ticket</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CBT Pre-Exam Setup Modal */}
      <CBTSetupModal
        isOpen={showPreExamModal}
        onClose={() => setShowPreExamModal(false)}
        subjects={subjects}
        userTier={userTier}
        onOpenUpgradeModal={() => {
          setUpgradeReasonMessage(
            'Topic Practice Drills are exclusive to Pro members. Upgrade to Pro for ₦1,000 to unlock targeted subject practice.'
          )
          setShowUpgradeModal(true)
        }}
        onLaunchExam={handleLaunchExamFromSetup}
        initialSelectedSubjectIds={selectedSubjects}
        initialMode={preExamInitialMode}
      />

      {/* JAMBStar Pro Paystack Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false)
          setUpgradeReasonMessage(null)
        }}
        user={currentUser}
        reasonMessage={upgradeReasonMessage}
        onUpgradeSuccess={() => {
          setUserTier('pro')
          setShowUpgradeModal(false)
          setUpgradeReasonMessage(null)
        }}
      />

      {/* Monetization Invitation & Onboarding Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-8 space-y-6 shadow-2xl border border-gray-100 relative mx-auto">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg p-1 cursor-pointer"
            >
              ✕
            </button>

            {/* Step 1: Invitation Overview */}
            {inviteModalStep === 'invite' && (
              <div className="space-y-5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-3xl shadow-xs">
                  ⭐
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                    Official Invitation
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                    Join JAMBStar Affiliate Program
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                    Earn cash rewards while helping fellow UTME candidates prepare with JAMBStar Pro.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-left space-y-2.5 text-xs text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span><strong>Earn ₦200 per Pro referral:</strong> Instant automated wallet credits for every upgrade.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span><strong>₦1,000 Minimum Payout:</strong> Request direct withdrawal to your bank account after just 5 referrals.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span><strong>Direct Bank Transfers:</strong> Verified automatic payouts to any Nigerian commercial bank.</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleAcceptInvite}
                    disabled={acceptingInvite}
                    className="w-full py-3.5 px-6 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {acceptingInvite ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Activating Affiliate Account...</span>
                      </>
                    ) : (
                      <span>Accept Invitation & Continue →</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeclineInvite}
                    disabled={decliningInvite}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Decline for Now
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Bank Setup */}
            {inviteModalStep === 'bank_setup' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                    Step 2 of 2
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Setup Payout Bank Details
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the Nigerian bank account where your referral earnings will be transferred.
                  </p>
                </div>

                {modalBankError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{modalBankError}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs sm:text-sm">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                      Select Bank *
                    </label>
                    <select
                      value={modalBankCode}
                      onChange={(e) => handleModalBankSelect(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">Select your Nigerian Bank</option>
                      {NIGERIAN_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                      Account Number (10 Digits) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={10}
                        value={modalAccountNumber}
                        onChange={(e) => handleModalAccountNumberChange(e.target.value)}
                        placeholder="e.g. 0123456789"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {modalResolvingBank && (
                        <div className="absolute right-3 top-2.5 text-xs text-gray-400 flex items-center gap-1.5">
                          <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>Verifying...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase text-gray-700">
                        Account Name (Paystack Verified)
                      </label>
                      {modalAccountNumber.length === 10 && !modalAccountName && !modalResolvingBank && (
                        <button
                          type="button"
                          onClick={handleModalVerify}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                        >
                          Verify with Paystack
                        </button>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        modalAccountName
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                          : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                    >
                      <span>{modalAccountName || 'Account name will resolve automatically upon entering 10 digits'}</span>
                      {modalAccountName && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold uppercase tracking-wider">
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleSaveModalBank}
                    disabled={modalSavingBank || modalResolvingBank || !modalAccountName}
                    className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {modalSavingBank ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving Bank Details...</span>
                      </>
                    ) : (
                      <span>Save Bank Details & Finish</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false)
                      setPaystackAlert('Affiliate activated! You can configure your payout bank details anytime in Settings.')
                    }}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Skip for Now (Setup Later in Settings)
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success Celebration */}
            {inviteModalStep === 'success' && (
              <div className="space-y-5 text-center">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-3xl shadow-xs">
                  🎉
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                    You're Officially an Affiliate!
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Your unique referral link is ready. Start sharing to earn ₦200 per Pro upgrade.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Your Referral Code:
                  </span>
                  <div className="text-xl font-black font-mono text-gray-900">
                    {referralCode}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false)
                      setActiveTab('monetization')
                      setSearchParams({ tab: 'monetization' })
                      if (currentUser?.id) fetchWalletAndMonetization(currentUser.id)
                    }}
                    className="w-full py-3 px-6 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all cursor-pointer"
                  >
                    View Affiliate Dashboard →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-8 space-y-5 shadow-2xl border border-gray-100 relative mx-auto">
            <button
              type="button"
              onClick={() => {
                setShowPayoutModal(false)
                setPayoutModalError(null)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg p-1 cursor-pointer"
            >
              ✕
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
                Withdrawal Request
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Request Commission Payout
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Available Wallet Balance: <strong className="text-gray-900 font-mono">₦{(wallet?.balance || 0).toLocaleString()}</strong>
              </p>
            </div>

            {payoutSuccessMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <span>✓</span>
                <span>{payoutSuccessMsg}</span>
              </div>
            )}

            {payoutModalError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>{payoutModalError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
                  Withdrawal Amount (₦) *
                </label>
                <input
                  type="number"
                  min={1000}
                  max={wallet?.balance || 1000}
                  step={100}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Minimum withdrawal is ₦1,000.
                </span>
              </div>

              {/* Destination Bank Snapshot */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5 text-xs">
                <div className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Destination Bank Account
                </div>
                {bankName && accountNumber ? (
                  <>
                    <div className="font-semibold text-gray-900">{bankName}</div>
                    <div className="font-mono text-gray-600">••••{accountNumber.slice(-4)} ({accountName})</div>
                  </>
                ) : (
                  <div className="text-rose-600 font-medium">
                    No bank configured. Please configure your bank account in Settings before submitting a payout request.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPayoutModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitPayout}
                disabled={requestingPayout || !bankName || !accountNumber || (wallet?.balance || 0) < 1000}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {requestingPayout ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <span>Submit Payout Request</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monetization AdBanner */}
      <div className="pt-2">
        <AdBanner slot="1001001002" format="horizontal" />
      </div>
    </div>
  )
}

export default Dashboard
