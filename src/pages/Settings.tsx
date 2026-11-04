import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UserAvatar } from '../components/UserAvatar'

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
          .select('full_name, track, gender, avatar_url, role')
          .eq('id', user.id)
          .maybeSingle()

        if (error) throw error

        if (profile) {
          setFullName(profile.full_name || '')
          if (profile.track) setTrack(profile.track as AcademicTrack)
          if (profile.gender) setGender(profile.gender as Gender)
          if (profile.avatar_url) setAvatarUrl(profile.avatar_url)
          if (profile.role) setRole(profile.role)
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
    </div>
  )
}

export default Settings
