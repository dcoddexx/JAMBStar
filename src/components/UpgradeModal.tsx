import React, { useState } from 'react'
import { usePaystackPayment } from 'react-paystack'
import { supabase } from '../lib/supabase'

export interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  user: {
    id: string
    email?: string
    full_name?: string
  } | null
  onUpgradeSuccess: () => void
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpgradeSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Paystack configuration
  const paystackPublicKey =
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY ||
    'pk_live_171d4fc8da421692b293f1b2502a324dc76a61d7'

  const paystackConfig = {
    reference: `JAMBSTAR_PRO_${user?.id ? user.id.slice(0, 8) : 'GUEST'}_${Date.now()}`,
    email: user?.email || 'candidate@jambstar.com',
    amount: 100000, // ₦1,000 in kobo
    publicKey: paystackPublicKey,
    metadata: {
      custom_fields: [
        {
          display_name: 'User ID',
          variable_name: 'user_id',
          value: user?.id || '',
        },
        {
          display_name: 'Full Name',
          variable_name: 'full_name',
          value: user?.full_name || '',
        },
        {
          display_name: 'Plan',
          variable_name: 'plan',
          value: 'pro_lifetime',
        },
      ],
    },
  }

  const initializePayment = usePaystackPayment(paystackConfig)

  const handlePaymentSuccess = async (paymentRef?: { reference: string }) => {
    if (!user?.id) {
      setErrorMessage('User session not found. Please log in first.')
      return
    }

    if (paymentRef?.reference) {
      console.info('Paystack transaction reference:', paymentRef.reference)
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Update candidate's profile tier to 'pro' in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ tier: 'pro' })
        .eq('id', user.id)

      if (error) throw error

      setSuccessMessage('🎉 Congratulations! You have unlocked JAMBStar Pro lifetime access.')
      onUpgradeSuccess()
      setTimeout(() => {
        setSuccessMessage(null)
        onClose()
      }, 1500)
    } catch (err: unknown) {
      const e = err as Error
      console.error('Failed to update tier in Supabase:', e)
      setErrorMessage(
        e.message ||
          'Payment was received, but failed to update your account status. Please contact support.'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaystackClick = () => {
    if (!user) {
      setErrorMessage('Please sign in to upgrade your candidate account.')
      return
    }

    setErrorMessage(null)

    try {
      initializePayment({
        onSuccess: (ref: any) => {
          handlePaymentSuccess(ref)
        },
        onClose: () => {
          // Candidate closed Paystack modal
        },
      })
    } catch (err: unknown) {
      const e = err as Error
      console.warn('Paystack inline initialization note:', e)
      setErrorMessage(
        'Could not initialize Paystack popup. Please check your internet connection or try again.'
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header Ribbon / Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-6 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full w-8 h-8 flex items-center justify-center transition-all cursor-pointer font-bold"
            aria-label="Close modal"
          >
            ✕
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-sm mb-3">
            <span>⭐</span>
            <span>JAMBStar Pro Access</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Unlock Full CBT Superpowers
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            Supercharge your UTME preparation with custom timers, subject sprints, and deep explanations.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Success Alert */}
          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
              <span className="text-xl">✅</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          {/* Pro Features Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Everything Included in JAMBStar Pro:
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-base font-bold">
                  ⏱️
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Custom Exam Timers (5 to 120 Minutes)
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Run quick 15-minute speed drills or realistic 2-hour full simulations anytime.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 text-base font-bold">
                  🎯
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Flexible Subject Selection (1 to 4 Subjects)
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Target individual weak subjects with single-subject drill sprints without having to take all 4.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 text-base font-bold">
                  💡
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Detailed Step-by-Step Explanations
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Access in-depth mathematical formulas, literature analyses, and syllabus rationales for every question.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-base font-bold">
                  📚
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Topic-by-Topic Practice Drills
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Master High-Yield Syllabus Topics with targeted topic drills, custom question counts, and focused practice.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Lifetime Access
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                  ₦1,000
                </span>
                <span className="text-xs text-slate-400 line-through font-mono">
                  ₦5,000
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-800">
                  80% OFF
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                One-time payment • No recurring subscriptions
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block text-2xl">🔒</span>
              <div className="text-[10px] text-slate-500 font-medium">Secured by Paystack</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handlePaystackClick}
              disabled={isProcessing}
              className="w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Activating Pro Account...</span>
                </>
              ) : (
                <>
                  <span>💳 Pay ₦1,000 with Paystack</span>
                  <span>→</span>
                </>
              )}
            </button>

            {/* Instant Activation Notice */}
            <div className="py-1 text-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                🔒 Instant Automatic Pro Activation
              </span>
            </div>

            {/* Back / Dismiss Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200 mt-1"
            >
              ← Back to Practice
            </button>
          </div>

          <p className="text-[10px] text-center text-slate-400 leading-tight">
            Secured 256-bit encryption. Instant activation upon successful payment verification.
          </p>
        </div>
      </div>
    </div>
  )
}
