import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { UpgradeModal } from "../components/UpgradeModal";

interface AuthUser {
  id: string;
  email?: string;
  full_name?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

export const Pricing: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isPro, setIsPro] = useState<boolean>(false);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    window.scrollTo(0, 0);

    const checkSessionAndTier = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, tier, is_pro")
            .eq("id", session.user.id)
            .maybeSingle();

          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            full_name: profile?.full_name || session.user.user_metadata?.full_name || "Candidate",
          });

          const proStatus = profile?.tier === "pro" || profile?.is_pro === true;
          setIsPro(proStatus);
        } else {
          setCurrentUser(null);
          setIsPro(false);
        }
      } catch (err) {
        console.warn("Pricing session lookup note:", err);
      } finally {
        setLoadingUser(false);
      }
    };

    checkSessionAndTier();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, full_name, tier, is_pro")
          .eq("id", session.user.id)
          .maybeSingle();

        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          full_name: profile?.full_name || session.user.user_metadata?.full_name || "Candidate",
        });

        setIsPro(profile?.tier === "pro" || profile?.is_pro === true);
      } else {
        setCurrentUser(null);
        setIsPro(false);
      }
      setLoadingUser(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleProAction = () => {
    if (!currentUser) {
      navigate("/?auth=signup");
      return;
    }
    if (isPro) {
      navigate("/dashboard");
      return;
    }
    setShowUpgradeModal(true);
  };

  const handleFreeAction = () => {
    if (currentUser) {
      navigate("/dashboard");
    } else {
      navigate("/?auth=signup");
    }
  };

  const faqs: FaqItem[] = [
    {
      question: "How do I pay for JAMBStar Pro?",
      answer:
        "Payment is processed securely via Paystack, Nigeria's premier payment gateway. You can pay using your debit card (Mastercard, Visa, Verve), Direct Bank Transfer, or USSD. Upon payment verification, your Pro account is activated instantly and automatically without any manual delay.",
    },
    {
      question: "Are there any hidden charges or recurring monthly fees?",
      answer:
        "No. JAMBStar Pro is a single, transparent, one-time payment of ₦1,000 that provides lifetime access for your UTME preparation. There are zero hidden fees, zero renewal charges, and zero recurring deductions.",
    },
    {
      question: "Can I practice on both my smartphone and computer/laptop?",
      answer:
        "Yes! JAMBStar is fully cloud-synced and responsive across all devices. You can practice on your Android or iPhone mobile browser while on the move, or practice on your laptop/desktop computer to experience our authentic JAMB 8-key keyboard simulation (A, B, C, D, P, N, S, R).",
    },
    {
      question: "How does the JAMBStar Pro affiliate referral program work?",
      answer:
        "Every candidate who upgrades to JAMBStar Pro qualifies for an invitation to our affiliate program. Once invited, you can generate your unique referral link on your Monetization dashboard, share it with tutorial groups, classmates, or on social media, and earn ₦250 per Pro referral. As you hit referral milestones, your rate automatically unlocks up to ₦300 (at 5 referrals) and ₦400 (at 10 referrals). You can request direct payouts to any verified Nigerian bank account once your balance reaches just ₦500 (2 referrals).",
    },
    {
      question: "What should I do if my payment goes through but Pro does not activate immediately?",
      answer:
        "Our system uses automated server-side webhooks and atomic database verification for instant activation. In the rare event of a network glitch from your bank, you can simply refresh your dashboard or open a support ticket under the Payment category. Our administrative team will verify your Paystack reference number within minutes.",
    },
  ];

  return (
    <div className="py-6 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Pricing</span>
      </nav>

      {/* Hero Header Section */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide text-emerald-800 bg-emerald-100 border border-emerald-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Transparent & Affordable UTME Preparation</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-tight">
          Simple, Affordable Pricing for Your{" "}
          <span className="text-emerald-600">UTME Success</span>
        </h1>

        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Start practicing for free today, or unlock full exam mastery with JAMBStar Pro for a single ₦1,000 payment.
        </p>

        {/* Feature Reassurance Pills */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold text-gray-600">
          <span className="px-3 py-1 rounded-full bg-white border border-gray-200 shadow-2xs">
            ✓ One-Time ₦1,000 Payment
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-gray-200 shadow-2xs">
            ✓ No Monthly Subscriptions
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-gray-200 shadow-2xs">
            ✓ Instant Paystack Activation
          </span>
          <span className="px-3 py-1 rounded-full bg-white border border-gray-200 shadow-2xs">
            ✓ Mobile & Desktop Synced
          </span>
        </div>
      </div>

      {/* Side-by-Side Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
        {/* CARD 1: JAMBStar Free Tier */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                Starter Tier
              </span>
              <span className="text-xs font-medium text-gray-500">Standard Practice</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-gray-900">JAMBStar Free</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Ideal for testing the CBT simulator, practicing standard 4-subject mocks, and familiarizing with the 8-key interface.
              </p>
            </div>

            <div className="flex items-baseline gap-2 pt-2 border-t border-gray-100">
              <span className="text-4xl sm:text-5xl font-black text-gray-900 font-mono">₦0</span>
              <span className="text-sm font-semibold text-gray-500">/ Forever Free</span>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Included in Free Plan:
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-sm shrink-0">✓</span>
                  <span>Full registration & personalized student profile</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-sm shrink-0">✓</span>
                  <span>Standard 4-subject CBT mock simulations (fixed 120-minute official format)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-sm shrink-0">✓</span>
                  <span>Authentic JAMB 8-key keyboard shortcuts (A, B, C, D, P, N, S, R)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-sm shrink-0">✓</span>
                  <span>Real-time score calculator & accuracy percentage</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-sm shrink-0">✓</span>
                  <span>Practice test history & recent result summary</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-sm shrink-0">✓</span>
                  <span>Free guest 10-question demo without registration</span>
                </li>
                <li className="flex items-start gap-2.5 text-gray-400">
                  <span className="font-bold text-sm shrink-0">✕</span>
                  <span>Custom exam timers (fixed at standard 120 mins)</span>
                </li>
                <li className="flex items-start gap-2.5 text-gray-400">
                  <span className="font-bold text-sm shrink-0">✕</span>
                  <span>Single-subject or weak-topic drill sprints</span>
                </li>
                <li className="flex items-start gap-2.5 text-gray-400">
                  <span className="font-bold text-sm shrink-0">✕</span>
                  <span>Step-by-step mathematical & literature explanations</span>
                </li>
                <li className="flex items-start gap-2.5 text-gray-400">
                  <span className="font-bold text-sm shrink-0">✕</span>
                  <span>Affiliate monetization program eligibility</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleFreeAction}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-gray-800 bg-gray-100 hover:bg-gray-200 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{currentUser ? "Go to Dashboard" : "Start Practicing Free"}</span>
              <span>→</span>
            </button>
            <p className="text-[11px] text-center text-gray-400 mt-2">No credit card or payment required.</p>
          </div>
        </div>

        {/* CARD 2: JAMBStar Pro Tier (Highlighted Most Popular) */}
        <div className="bg-gradient-to-b from-white via-emerald-50/30 to-white rounded-3xl border-2 border-emerald-500 shadow-xl p-6 sm:p-8 flex flex-col justify-between space-y-6 relative overflow-hidden">
          {/* Top Decorative Highlight Ribbon */}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-600 to-teal-600 text-white text-[11px] font-black uppercase tracking-wider py-1.5 px-6 rounded-bl-2xl shadow-xs">
            ⭐ Most Popular Plan
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                PRO CBT SUPERPOWERS
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-slate-950">
                80% OFF
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900">JAMBStar Pro</h2>
              <p className="text-xs sm:text-sm text-emerald-950 font-medium mt-1">
                Everything you need to master your speed, tackle weak topics, and score 300+ in your UTME.
              </p>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Lifetime Pro Access
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">₦1,000</span>
                  <span className="text-sm text-slate-400 line-through font-mono">₦5,000</span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium mt-1">
                  Single one-time payment • No recurring fees
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl">🔒</span>
                <div className="text-[10px] text-slate-500 font-medium mt-0.5">Secured by Paystack</div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Everything Included in JAMBStar Pro:
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-gray-800">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
                  <span>
                    <strong>Custom Exam Timers (5 to 120 Mins):</strong> Run targeted 15-minute speed drills or full 2-hour official mocks anytime.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
                  <span>
                    <strong>Flexible Subject Sprints (1 to 4 Subjects):</strong> Isolate and drill weak subjects without having to take all 4 subjects.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
                  <span>
                    <strong>Detailed Step-by-Step Explanations:</strong> Comprehensive formulas, syllabus rationales, and literature breakdowns for every question.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
                  <span>
                    <strong>Topic-by-Topic Practice Drills:</strong> Master High-Yield Syllabus Topics with targeted drills and custom question counts.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
                  <span>
                    <strong>Authentic JAMB 8-Key CBT Simulator:</strong> Realistic exam environment with A, B, C, D, P, N, S, R keyboard controls.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
                  <span>
                    <strong>In-Depth Performance & Speed Analytics:</strong> Detailed tracking of accuracy, time spent per subject, and historical progress.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
                  <span>
                    <strong>JAMBStar Affiliate Program Qualification:</strong> Earn ₦250–₦400 cash reward for every Pro referral with bank payouts from ₦500.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-600 font-bold text-base shrink-0">✓</span>
                  <span>
                    <strong>Priority Candidate Support:</strong> Dedicated assistance for technical inquiries and question feedback.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-emerald-200">
            {isPro ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2">
                  <span>✓</span>
                  <span>You are on the JAMBStar Pro Plan</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3.5 px-6 rounded-xl font-black text-sm sm:text-base text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Go to Pro Dashboard</span>
                  <span>→</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleProAction}
                disabled={loadingUser}
                className="w-full py-4 px-6 rounded-xl font-black text-sm sm:text-base text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>
                  {currentUser ? "Upgrade to JAMBStar Pro (₦1,000)" : "Get Started & Go Pro (₦1,000)"}
                </span>
                <span>→</span>
              </button>
            )}
            <p className="text-[11px] text-center text-emerald-800 font-medium mt-2">
              Instant automated activation via Paystack. No waiting.
            </p>
          </div>
        </div>
      </div>

      {/* Affiliate & Referral Earnings Highlight Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 max-w-5xl mx-auto relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950">
            <span>💰</span>
            <span>Earn While You Prepare</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            JAMBStar Pro Affiliate & Referral Program
          </h2>

          <p className="text-emerald-100 text-xs sm:text-base max-w-3xl leading-relaxed">
            Every JAMBStar Pro subscriber qualifies for an invitation to our referral program. Share your personal referral link and earn ₦250 per Pro referral (unlocking ₦300 at 5 referrals and ₦400 at 10 referrals), with direct bank withdrawals starting from just ₦500.
          </p>
        </div>

        {/* 4 Quick Stat Callouts */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 relative z-10 pt-2">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 space-y-1">
            <div className="text-xs uppercase font-bold text-emerald-200">Base Commission</div>
            <div className="text-xl sm:text-2xl font-black font-mono">₦250 / Ref</div>
            <div className="text-[11px] text-emerald-100">Every Pro upgrade</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 space-y-1">
            <div className="text-xs uppercase font-bold text-emerald-200">Milestone Tiers</div>
            <div className="text-xl sm:text-2xl font-black font-mono">Up to ₦400</div>
            <div className="text-[11px] text-emerald-100">At 5 & 10 referrals</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 space-y-1">
            <div className="text-xs uppercase font-bold text-emerald-200">Minimum Payout</div>
            <div className="text-xl sm:text-2xl font-black font-mono">₦500</div>
            <div className="text-[11px] text-emerald-100">Just 2 Pro referrals</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/20 space-y-1">
            <div className="text-xs uppercase font-bold text-emerald-200">Bank Transfers</div>
            <div className="text-xl sm:text-2xl font-black font-mono">Direct NUBAN</div>
            <div className="text-[11px] text-emerald-100">Any Nigerian bank</div>
          </div>
        </div>

        <div className="pt-2 relative z-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleProAction}
            className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white text-emerald-800 hover:bg-emerald-50 shadow-md transition-all cursor-pointer"
          >
            {isPro ? "Open Affiliate Center in Dashboard →" : "Unlock Pro & Join Affiliate Program →"}
          </button>
        </div>
      </div>

      {/* Pricing & Payment FAQ Section */}
      <div className="max-w-4xl mx-auto space-y-6 pt-4">
        <div className="text-center space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
            Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Everything You Need to Know About JAMBStar Pricing
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Have questions before upgrading? Here are answers to our most common pricing and payment inquiries.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={faq.question}
                className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-gray-900">{faq.question}</span>
                  <span
                    className={`w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 bg-emerald-100 text-emerald-700" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Closing Motivational CTA Box */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs p-8 sm:p-12 text-center space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2 max-w-xl mx-auto">
          <h3 className="text-2xl sm:text-3xl font-black text-gray-900">
            Ready to Score 300+ in Your UTME?
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
            Over 10,000 verified questions, topic drills, and authentic CBT simulations are waiting for you. Get started right now.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleFreeAction}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            {currentUser ? "Go to Dashboard" : "Start Practicing Free"}
          </button>
          <button
            type="button"
            onClick={handleProAction}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            {isPro ? "Open Pro Dashboard →" : "Upgrade to Pro for ₦1,000 →"}
          </button>
        </div>
      </div>

      {/* Pro Upgrade Paystack Modal (In-Place Checkout for logged in candidates) */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        user={currentUser}
        reasonMessage={null}
        onUpgradeSuccess={() => {
          setIsPro(true);
          setShowUpgradeModal(false);
        }}
      />
    </div>
  );
};

export default Pricing;
