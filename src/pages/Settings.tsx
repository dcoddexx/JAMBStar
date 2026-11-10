import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UserAvatar } from '../components/UserAvatar'
import {
  NIGERIAN_BANKS,
  resolvePaystackAccount,
  checkBankDetailsCooldown
} from '../services/monetization'

type AcademicTrack = 'Science' | 'Arts' | 'Commercial'
type Gender = 'male' | 'female'

export const Settings: React.FC = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string>('')
  const [role, setRole] = useState<string>('student')
  const [fullName, setFullName] = useState<string>('')
  const [track, setTrack] = useState<AcademicTrack>('Science')
  const [gender, setGender] = useState<Gender>('male')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Monetization & Bank Details State
  const [monetizationStatus, setMonetizationStatus] = useState<'none' | 'invited' | 'active' | 'declined'>('none')
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [bankName, setBankName] = useState<string>('')
  const [bankCode, setBankCode] = useState<string>('')
  const [accountNumber, setAccountNumber] = useState<string>('')
  const [accountName, setAccountName] = useState<string>('')
  const [bankDetailsUpdatedAt, setBankDetailsUpdatedAt] = useState<string | null>(null)
  const [isEditingBank, setIsEditingBank] = useState<boolean>(false)
  const [resolvingBank, setResolvingBank] = useState<boolean>(false)
  const [bankResolveError, setBankResolveError] = useState<string | null>(null)
  const [savingBank, setSavingBank] = useState<boolean>(false)
  const [copiedCode, setCopiedCode] = useState<boolean>(false)

  // Compute 7-day bank edit cooldown
  const bankCooldown = checkBankDetailsCooldown(bankDetailsUpdatedAt)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          navigate('/?auth=signin')
          return
        }

        setUserId(user.id)
        setEmail(user.email || '')

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('full_name, track, gender, avatar_url, role, monetization_status, referral_code, bank_name, bank_code, account_number, account_name, bank_details_updated_at')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error

        if (profile) {
          setFullName(profile.full_name || '')
          if (profile.track) setTrack(profile.track as AcademicTrack)
          if (profile.gender) setGender(profile.gender as Gender)
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
          if (profile.role) setRole(profile.role)
          if (profile.monetization_status) setMonetizationStatus(profile.monetization_status)
          if (profile.referral_code) setReferralCode(profile.referral_code)
          if (profile.bank_name) setBankName(profile.bank_name)
          if (profile.bank_code) setBankCode(profile.bank_code)
          if (profile.account_number) setAccountNumber(profile.account_number)
          if (profile.account_name) setAccountName(profile.account_name)
          if (profile.bank_details_updated_at) setBankDetailsUpdatedAt(profile.bank_details_updated_at)
        }
      } catch (err: unknown) {
        const e = err as Error
        console.error('Failed to load profile:', e)
        setMessage({ type: 'error', text: e.message || 'Could not load your settings.' })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate])

  // Profile Picture Upload Handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // Validation: Image type & size (max 3MB)
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select a valid image file (PNG, JPG, WebP, GIF).' })
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image file is too large. Maximum allowed size is 3MB.' })
      return
    }

    setUploadingImage(true)
    setMessage(null)

    try {
      const fileExt = file.name.split('.').pop() || 'png'
      const cleanFileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${cleanFileName}`

      // 1. Upload to Supabase 'avatars' storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) throw uploadError

      // 2. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath)

      // 3. Update profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setMessage({
        type: 'success',
        text: 'Profile photo uploaded successfully! Your new avatar is active.',
      })
    } catch (err: unknown) {
      const e = err as Error
      console.error('Avatar upload error:', e)
      setMessage({
        type: 'error',
        text: `Failed to upload avatar: ${e.message || 'Check your internet connection or bucket settings.'}`,
      })
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Remove Avatar / Revert to default gender illustration
  const handleRemoveAvatar = async () => {
    if (!userId || !avatarUrl) return
    setUploadingImage(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      setAvatarUrl(null)
      setMessage({
        type: 'success',
        text: 'Custom photo removed. Your profile has reverted to your gender avatar.',
      })
    } catch (err: unknown) {
      const e = err as Error
      setMessage({ type: 'error', text: `Failed to remove photo: ${e.message}` })
    } finally {
      setUploadingImage(false)
    }
  }

  // Save Name, Track, and Gender
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    if (!fullName.trim()) {
      setMessage({ type: 'error', text: 'Full Name cannot be empty.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          track,
          gender,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw error

      setMessage({
        type: 'success',
        text: 'Profile settings saved successfully!',
      })
      setTimeout(() => {
        setMessage(null)
      }, 5000)
    } catch (err: unknown) {
      const e = err as Error
      console.error('Failed to update profile:', e)
      setMessage({
        type: 'error',
        text: `Failed to save changes: ${e.message || 'Please try again.'}`,
      })
    } finally {
      setSaving(false)
    }
  }

  // Bank & Monetization Handlers
  const handleStartEditBank = () => {
    if (!bankCooldown.canEdit) return
    setBankResolveError(null)
    setIsEditingBank(true)
  }

  const handleBankSelect = (code: string) => {
    setBankCode(code)
    const found = NIGERIAN_BANKS.find((b) => b.code === code)
    if (found) {
      setBankName(found.name)
    }
    setAccountName('')
    setBankResolveError(null)
  }

  const handleAccountNumberChange = async (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10)
    setAccountNumber(cleaned)
    setBankResolveError(null)

    if (cleaned.length === 10 && bankCode) {
      setResolvingBank(true)
      const res = await resolvePaystackAccount(cleaned, bankCode)
      setResolvingBank(false)
      if (res.success && res.account_name) {
        setAccountName(res.account_name)
        setBankResolveError(null)
      } else {
        setAccountName('')
        setBankResolveError(res.message || 'Could not verify account name.')
      }
    } else {
      setAccountName('')
    }
  }

  const handleManualVerify = async () => {
    if (accountNumber.length !== 10) {
      setBankResolveError('Account number must be 10 digits.')
      return
    }
    if (!bankCode) {
      setBankResolveError('Please select your bank.')
      return
    }
    setResolvingBank(true)
    setBankResolveError(null)
    const res = await resolvePaystackAccount(accountNumber, bankCode)
    setResolvingBank(false)
    if (res.success && res.account_name) {
      setAccountName(res.account_name)
      setBankResolveError(null)
    } else {
      setAccountName('')
      setBankResolveError(res.message || 'Could not verify account name.')
    }
  }

  const handleSaveBankDetails = async () => {
    if (!userId) return
    if (accountNumber.length !== 10) {
      setBankResolveError('Account number must be exactly 10 digits.')
      return
    }
    if (!bankCode || !bankName) {
      setBankResolveError('Please select your bank.')
      return
    }
    if (!accountName.trim()) {
      setBankResolveError('Please verify your account details with Paystack before saving.')
      return
    }

    setSavingBank(true)
    setBankResolveError(null)
    try {
      const nowIso = new Date().toISOString()
      const { error } = await supabase
        .from('profiles')
        .update({
          bank_name: bankName,
          bank_code: bankCode,
          account_number: accountNumber,
          account_name: accountName.trim(),
          bank_details_updated_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', userId)

      if (error) throw error

      setBankDetailsUpdatedAt(nowIso)
      setIsEditingBank(false)
      setMessage({
        type: 'success',
        text: 'Bank details saved successfully! For security, your payout details are now locked under a 7-day cooldown.',
      })
      setTimeout(() => setMessage(null), 7000)
    } catch (err: unknown) {
      const e = err as Error
      setBankResolveError(e.message || 'Failed to save bank details.')
    } finally {
      setSavingBank(false)
    }
  }

  const handleCopyReferralCode = () => {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2500)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <span className="mt-3 text-xs font-semibold text-gray-500">
          Loading your profile settings...
        </span>
      </div>
    )
  }

  return (
    <div className="py-6 sm:py-10 px-4 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/dashboard" className="hover:text-emerald-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Settings</span>
      </nav>

      {/* Header Banner */}
      <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
            <span>⚙️</span>
            <span>Candidate Account & Preferences</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Account Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Manage your personal profile, candidate track, gender, and custom avatar.
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 shadow-2xs transition-colors shrink-0"
        >
          <span>← Back to Dashboard</span>
        </Link>
      </div>

      {/* Status Alert Notification */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between shadow-2xs ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-base">{message.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-gray-500 hover:text-gray-700 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Settings Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Avatar & Quick Profile Card (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <UserAvatar
              avatarUrl={avatarUrl}
              gender={gender}
              name={fullName || email}
              size="xl"
              className="ring-4 ring-emerald-500/20"
            />
            {uploadingImage && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-gray-900">
              {fullName || 'Student Candidate'}
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">{email}</p>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                {track}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize bg-slate-100 text-slate-700">
                {gender}
              </span>
              {role !== 'student' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                  {role}
                </span>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif"
            onChange={handleImageFileChange}
            className="hidden"
          />

          <div className="w-full pt-3 border-t border-gray-100 space-y-2">
            <button
              type="button"
              disabled={uploadingImage}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>📷</span>
              <span>{uploadingImage ? 'Uploading Image...' : 'Upload Profile Photo'}</span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                disabled={uploadingImage}
                onClick={handleRemoveAvatar}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
              >
                Remove Custom Photo
              </button>
            )}

            <p className="text-[11px] text-gray-400">
              PNG, JPG, or WebP up to 3MB. If no custom image is uploaded, your avatar defaults to your gender illustration.
            </p>
          </div>
        </div>

        {/* Right Column: Profile Form (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Personal Information</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Update your identity and UTME academic stream.
              </p>
            </div>

            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-1">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-xs sm:text-sm font-mono cursor-not-allowed"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Your email is linked to your Supabase authentication and cannot be edited directly.
              </span>
            </div>

            {/* Full Name */}
            <div>
              <label
                htmlFor="full-name-input"
                className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-1"
              >
                Full Name *
              </label>
              <input
                id="full-name-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Amina Bello"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Gender Selector */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-1">
                Gender *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                    gender === 'male'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">👨</span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold">Male</div>
                      <div className="text-[10px] text-gray-500">Default male avatar</div>
                    </div>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                      gender === 'male'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {gender === 'male' ? '✓' : ''}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
                    gender === 'female'
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">👩</span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold">Female</div>
                      <div className="text-[10px] text-gray-500">Default female avatar</div>
                    </div>
                  </div>
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                      gender === 'female'
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-300'
                    }`}
                  >
                    {gender === 'female' ? '✓' : ''}
                  </span>
                </button>
              </div>
            </div>

            {/* Academic Track Picker */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-1">
                UTME Academic Track *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['Science', 'Arts', 'Commercial'] as AcademicTrack[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTrack(t)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                      track === t
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">
                        {t === 'Science' ? '🔬' : t === 'Arts' ? '📚' : '💼'}
                      </span>
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                          track === t
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : 'border-gray-300'
                        }`}
                      >
                        {track === t ? '✓' : ''}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold">{t}</div>
                    <div className="text-[10px] text-gray-500">
                      {t === 'Science'
                        ? 'Medicine, Eng, Computing'
                        : t === 'Arts'
                        ? 'Law, Mass Comm, Lit'
                        : 'Accounting, Econs, Business'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                All changes reflect across your CBT dashboard immediately.
              </span>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Profile Settings</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Monetization & Payout Details Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
              <span>💳</span>
              <span>Monetization & Payout Details</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Payout Bank Account
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Set and manage your verified Nigerian bank account for affiliate earnings and commission withdrawals.
            </p>
          </div>

          <div>
            {!isEditingBank ? (
              <button
                type="button"
                onClick={handleStartEditBank}
                disabled={!bankCooldown.canEdit}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  bankCooldown.canEdit
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-60'
                }`}
                title={
                  !bankCooldown.canEdit
                    ? `Bank details can be edited again on ${bankCooldown.unlockDate} (${bankCooldown.daysRemaining} days remaining)`
                    : 'Edit your payout bank details'
                }
              >
                <span>✏️</span>
                <span>Edit Bank Details</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingBank(false)
                    setBankResolveError(null)
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveBankDetails}
                  disabled={savingBank || resolvingBank || !accountName}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {savingBank ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Bank Details</span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 7-Day Cooldown Security Alert */}
        {!bankCooldown.canEdit && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium flex items-start gap-3">
            <span className="text-xl shrink-0">🛡️</span>
            <div>
              <div className="font-bold">Bank Details Cooldown Active</div>
              <div className="mt-0.5 text-amber-800">
                Bank details were recently updated. For security, you can edit your bank details again on {bankCooldown.unlockDate} (in {bankCooldown.daysRemaining} days).
              </div>
            </div>
          </div>
        )}

        {/* Affiliate Program Status Banner */}
        {referralCode ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Active Affiliate Referral Code
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-mono font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-emerald-200">
                  {referralCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyReferralCode}
                  className="px-3 py-1 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-200 hover:bg-emerald-300 transition-colors cursor-pointer"
                >
                  {copiedCode ? '✓ Copied' : 'Copy Code'}
                </button>
              </div>
            </div>
            <div className="text-xs text-emerald-900 sm:text-right">
              <span className="font-semibold">Earn ₦200 per Pro upgrade</span>
              <div className="text-[11px] text-emerald-700">Minimum payout: ₦1,000 (5 referrals)</div>
            </div>
          </div>
        ) : monetizationStatus === 'invited' ? (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">⭐</span>
              <div>
                <span className="font-bold">Affiliate Invitation Pending:</span> You have an active invitation to join the JAMBStar Affiliate Program.
              </div>
            </div>
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-xs"
            >
              View in Dashboard →
            </Link>
          </div>
        ) : null}

        {/* Bank Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Bank Name */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-1">
              Bank Name *
            </label>
            {isEditingBank ? (
              <select
                value={bankCode}
                onChange={(e) => handleBankSelect(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="">Select your Nigerian Bank</option>
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                disabled
                value={bankName || 'Not configured'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs sm:text-sm cursor-not-allowed"
              />
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-1">
              Account Number (10 Digits) *
            </label>
            {isEditingBank ? (
              <div className="relative">
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => handleAccountNumberChange(e.target.value)}
                  placeholder="e.g. 0123456789"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {resolvingBank && (
                  <div className="absolute right-3 top-2.5 text-xs text-gray-400 flex items-center gap-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                )}
              </div>
            ) : (
              <input
                type="text"
                disabled
                value={accountNumber ? `••••${accountNumber.slice(-4)}` : 'Not configured'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-xs sm:text-sm font-mono cursor-not-allowed"
              />
            )}
          </div>

          {/* Account Name (Verified via Paystack) */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider">
                Account Name (Paystack Verified)
              </label>
              {isEditingBank && accountNumber.length === 10 && !accountName && !resolvingBank && (
                <button
                  type="button"
                  onClick={handleManualVerify}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 underline cursor-pointer"
                >
                  Verify with Paystack
                </button>
              )}
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-center justify-between ${
                accountName
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-semibold'
                  : 'bg-gray-50 border-gray-200 text-gray-500 font-normal'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{accountName ? '✅' : 'ℹ️'}</span>
                <span>{accountName || 'Account name will resolve automatically upon entering 10 digits'}</span>
              </div>
              {accountName && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-800 font-bold uppercase tracking-wider">
                  Verified
                </span>
              )}
            </div>

            {bankResolveError && (
              <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <span>⚠️</span>
                <span>{bankResolveError}</span>
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 text-[11px] text-gray-400">
          Payouts are credited directly to your verified Nigerian bank account. Cooldown applies to all future bank detail updates.
        </div>
      </div>
    </div>
  )
}

export default Settings
