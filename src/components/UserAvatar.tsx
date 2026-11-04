import React, { useState } from 'react'

export interface UserAvatarProps {
  avatarUrl?: string | null
  gender?: 'male' | 'female' | string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const MaleAvatarSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Male placeholder avatar"
  >
    <rect width="100" height="100" rx="50" fill="url(#male-grad)" />
    <defs>
      <linearGradient id="male-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0f766e" />
        <stop offset="1" stopColor="#042f2e" />
      </linearGradient>
    </defs>
    {/* Body / Shoulders */}
    <path
      d="M20 90C20 73 33 62 50 62C67 62 80 73 80 90"
      fill="#14b8a6"
    />
    <path
      d="M36 62V55C36 55 42 58 50 58C58 58 64 55 64 55V62"
      fill="#fde68a"
    />
    {/* Head */}
    <circle cx="50" cy="40" r="18" fill="#fde68a" />
    {/* Short Male Hair */}
    <path
      d="M32 38C31 33 34 23 48 22C63 21 68 28 68 35C68 38 65 34 62 33C57 32 43 30 36 36C34 38 32 38 32 38Z"
      fill="#1f2937"
    />
    <path
      d="M32 38C32 38 34 46 36 47C37 47 38 42 38 39C38 36 33 37 32 38Z"
      fill="#1f2937"
    />
    {/* Eyes & Smile */}
    <circle cx="44" cy="41" r="2" fill="#1f2937" />
    <circle cx="56" cy="41" r="2" fill="#1f2937" />
    <path
      d="M45 48C47 51 53 51 55 48"
      stroke="#b45309"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Shirt collar */}
    <path
      d="M44 62L50 71L56 62"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export const FemaleAvatarSvg: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Female placeholder avatar"
  >
    <rect width="100" height="100" rx="50" fill="url(#female-grad)" />
    <defs>
      <linearGradient id="female-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#047857" />
        <stop offset="1" stopColor="#064e3b" />
      </linearGradient>
    </defs>
    {/* Hair Back */}
    <path
      d="M26 40C26 23 74 23 74 40C74 56 71 70 70 76C62 76 60 62 50 62C40 62 38 76 30 76C29 70 26 56 26 40Z"
      fill="#1e1b4b"
    />
    {/* Body / Dress */}
    <path
      d="M22 90C22 74 34 64 50 64C66 64 78 74 78 90"
      fill="#10b981"
    />
    {/* Neck */}
    <path
      d="M42 63V55C42 55 45 57 50 57C55 57 58 55 58 55V63"
      fill="#fcd34d"
    />
    {/* Head */}
    <circle cx="50" cy="40" r="17" fill="#fcd34d" />
    {/* Styled Hair Front */}
    <path
      d="M32 36C32 24 40 21 50 21C60 21 68 24 68 36C68 40 62 29 50 29C38 29 32 40 32 36Z"
      fill="#312e81"
    />
    {/* Headband / Hairband */}
    <path
      d="M33 34C37 27 63 27 67 34"
      stroke="#fbbf24"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    {/* Eyes & Smile */}
    <circle cx="44" cy="40" r="2" fill="#1f2937" />
    <circle cx="56" cy="40" r="2" fill="#1f2937" />
    {/* Eyelashes */}
    <path d="M42 38L40 37M46 38L48 37" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M54 38L52 37M58 38L60 37" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
    <path
      d="M45 47C47 50 53 50 55 47"
      stroke="#b45309"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Earrings */}
    <circle cx="32" cy="45" r="2.5" fill="#f59e0b" />
    <circle cx="68" cy="45" r="2.5" fill="#f59e0b" />
    {/* Necklace */}
    <path
      d="M44 65C47 68 53 68 56 65"
      stroke="#fbbf24"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  gender,
  name,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false)

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  }[size]

  const cleanGender = (gender || '').toLowerCase().trim()
  const isFemale = cleanGender === 'female'

  if (avatarUrl && !imgError) {
    return (
      <div
        className={`relative inline-block rounded-full overflow-hidden shrink-0 ring-2 ring-emerald-500/30 shadow-xs ${sizeClasses} ${className}`}
      >
        <img
          src={avatarUrl}
          alt={name || 'Candidate Avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={`relative inline-block rounded-full overflow-hidden shrink-0 shadow-xs ring-2 ring-emerald-500/20 ${sizeClasses} ${className}`}
      title={name ? `${name} (${isFemale ? 'Female' : 'Male'})` : undefined}
    >
      {isFemale ? <FemaleAvatarSvg /> : <MaleAvatarSvg />}
    </div>
  )
}

export default UserAvatar
