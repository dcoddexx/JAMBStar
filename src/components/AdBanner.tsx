import React, { useEffect, useRef } from 'react'

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>
  }
}

export interface AdBannerProps {
  slot?: string
  client?: string
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical'
  responsive?: boolean
  className?: string
  style?: React.CSSProperties
  label?: string
}

export const AdBanner: React.FC<AdBannerProps> = ({
  slot = '0000000000',
  client = import.meta.env.VITE_ADSENSE_CLIENT_ID || 'ca-pub-0000000000000000',
  format = 'auto',
  responsive = true,
  className = '',
  style = {},
  label = 'Advertisement',
}) => {
  const adRef = useRef<HTMLModElement | null>(null)
  const isPushed = useRef<boolean>(false)

  useEffect(() => {
    // Guard against duplicate injection on re-renders and client-side routing
    if (isPushed.current) return
    if (!adRef.current) return

    // Guard: Check if the element already has been marked by AdSense
    const status = adRef.current.getAttribute('data-adsbygoogle-status')
    if (status) return

    try {
      if (typeof window !== 'undefined') {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        isPushed.current = true
      }
    } catch (err) {
      // In development or if ad blocker is active, gracefully log without crashing
      console.warn('[AdSense] Ad push prevented or failed:', err)
    }
  }, [])

  return (
    <div className={`w-full overflow-hidden text-center my-3 sm:my-4 ${className}`}>
      {label && (
        <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">
          {label}
        </span>
      )}
      <div className="bg-slate-50/50 rounded-lg border border-slate-100 flex items-center justify-center min-h-[90px] overflow-hidden">
        <ins
          ref={adRef}
          className="adsbygoogle block w-full"
          style={{ display: 'block', minHeight: '90px', ...style }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </div>
  )
}

export default AdBanner
