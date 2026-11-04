import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export const Contact: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string; full_name?: string } | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Candidate Support");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();

          setCurrentUser({
            id: user.id,
            email: user.email,
            full_name: profile?.full_name || '',
          });

          if (profile?.full_name) setFullName(profile.full_name);
          if (user.email) setEmail(user.email);
        }
      } catch (err) {
        console.warn('Could not read user for contact form prefill:', err);
      }
    };

    checkUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !email.trim() || !message.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setFormError("Please provide a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user ? user.id : null;

      let mappedCategory: 'Technical' | 'Payment' | 'Exam Inquiry' | 'General' | 'Question Bank Feedback' | 'Candidate Support' | 'Other' = 'General';
      if (category.includes('Technical') || category.includes('Bug')) {
        mappedCategory = 'Technical';
      } else if (category.includes('Feedback') || category.includes('Question Bank')) {
        mappedCategory = 'Question Bank Feedback';
      } else if (category.includes('Payment')) {
        mappedCategory = 'Payment';
      } else if (category.includes('Exam')) {
        mappedCategory = 'Exam Inquiry';
      } else if (category.includes('Support') || category.includes('Candidate')) {
        mappedCategory = 'Candidate Support';
      }

      // 1. Create support ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: userId,
          guest_name: fullName.trim(),
          guest_email: email.trim(),
          subject: `${mappedCategory}: Inquiry from ${fullName.trim()}`,
          category: mappedCategory,
          status: 'open',
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      // 2. Insert initial message into ticket_messages
      const { error: msgError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          sender_id: userId,
          sender_name: fullName.trim(),
          message: message.trim(),
        });

      if (msgError) throw msgError;

      const ticketRef = `JMB-${ticket.id.slice(0, 8).toUpperCase()}`;
      setSubmittedTicket(ticketRef);
      setMessage("");
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error submitting support ticket:', e);
      setFormError(`Failed to submit support ticket: ${e.message || 'Please check your connection and try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Contact & About Us</span>
      </nav>

      {/* Header Banner */}
      <div className="border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-3">
            Publisher Credentials & Support
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Contact Us & About JAMBStar
          </h1>
          <p className="mt-2 text-sm text-gray-600 max-w-2xl">
            We are dedicated to building Nigeria's most accurate and student-friendly UTME CBT preparation simulator. Have questions, feedback, or need academic support? Get in touch with our team.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50/80 px-3.5 py-2 rounded-xl border border-emerald-200 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Support Desk Active (Mon - Sat)</span>
        </div>
      </div>

      {/* About the Platform & Publisher Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg font-bold">
            🎯
          </div>
          <h2 className="text-base font-bold text-gray-900">Our Mission</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            JAMBStar democratizes high-stakes university admissions prep for thousands of Nigerian secondary school leavers. We combine verified past questions with high-fidelity 8-key CBT simulation to build genuine exam-day confidence.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center text-lg font-bold">
            🏢
          </div>
          <h2 className="text-base font-bold text-gray-900">Publisher Identity</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Published and operated by <strong>JAMBStar Educational Technologies</strong>, an independent educational research and software publishing organization headquartered in <strong>Lagos, Nigeria</strong>.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg font-bold">
            ⚖️
          </div>
          <h2 className="text-base font-bold text-gray-900">Academic Rigor</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Every question in our database undergoes multi-stage verification by Nigerian subject-matter educators, complete with mathematical formulas, diagrams, and syllabus citations.
          </p>
        </div>
      </div>

      {/* Main Grid: Contact Form + Publisher Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Contact Form (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Send Us a Direct Message</h2>
            <p className="mt-1 text-xs text-gray-500">
              Submit your inquiry below. Our student support desk typically responds within 24 to 48 business hours.
            </p>
          </div>

          {submittedTicket ? (
            <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-xs">
                ✓
              </div>
              <h3 className="text-base font-bold text-emerald-900">
                Message Received Successfully!
              </h3>
              <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
                Thank you for reaching out! Your support ticket has been created with reference{" "}
                <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-300 text-emerald-800">
                  {submittedTicket}
                </strong>
                . Our academic and support teams have been notified.
              </p>
              {currentUser ? (
                <div className="pt-2">
                  <Link
                    to="/dashboard?tab=messages"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition-colors"
                  >
                    <span>View in Candidate Messages</span>
                    <span>→</span>
                  </Link>
                </div>
              ) : (
                <p className="text-[11px] text-emerald-600">
                  Tip: When you register or sign in using <strong>{email}</strong>, this ticket will be visible directly in your Candidate Dashboard under Messages.
                </p>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSubmittedTicket(null)}
                  className="text-xs font-semibold text-emerald-700 underline hover:text-emerald-800 cursor-pointer"
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="full-name"
                    className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                  >
                    Your Full Name *
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Chinedu Adeleke"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                  >
                    Email Address *
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="inquiry-category"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                >
                  Inquiry Topic
                </label>
                <select
                  id="inquiry-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                >
                  <option value="Candidate Support">Candidate Account & Login Support</option>
                  <option value="Question Bank Feedback">Question Bank Error / Explanation Feedback</option>
                  <option value="CBT Technical Bug">CBT Simulator / Timer Technical Bug</option>
                  <option value="School / Tutorial Center Partnerships">School & CBT Center Institutional Inquiries</option>
                  <option value="Privacy / Compliance">Privacy Policy & Data Inquiry</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                >
                  Your Message *
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your question, inquiry, or suggestion in detail..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-y"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Transmitting message...</span>
                  </>
                ) : (
                  <span>Send Support Message</span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Direct Channels & Publisher Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>📍</span>
              <span>Publisher Credentials & Office</span>
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div>
                <span className="block font-semibold text-slate-100 uppercase tracking-wider text-[10px]">
                  Publisher Name:
                </span>
                <span>JAMBStar Educational Technologies</span>
              </div>

              <div>
                <span className="block font-semibold text-slate-100 uppercase tracking-wider text-[10px]">
                  Headquarters & Operational Base:
                </span>
                <span>Lagos State, Federal Republic of Nigeria</span>
              </div>

              <div>
                <span className="block font-semibold text-slate-100 uppercase tracking-wider text-[10px]">
                  Working Hours:
                </span>
                <span>Monday - Saturday: 8:00 AM - 6:00 PM (WAT)</span>
                <span className="block text-slate-400 text-[11px] mt-0.5">
                  Sundays: Emergency Server & CBT Maintenance Only
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <span className="block font-semibold text-slate-100 uppercase tracking-wider text-[10px]">
                Dedicated Communication Channels:
              </span>
              <p className="flex items-center gap-2">
                <span className="text-emerald-400">✉️</span>
                <span>General Support:</span>
                <a href="mailto:support@jambstar.com" className="text-emerald-300 underline font-mono">
                  support@jambstar.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-400">🛡️</span>
                <span>Data & Privacy:</span>
                <a href="mailto:privacy@jambstar.com" className="text-emerald-300 underline font-mono">
                  privacy@jambstar.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-emerald-400">⚖️</span>
                <span>Legal & Disclaimers:</span>
                <a href="mailto:legal@jambstar.com" className="text-emerald-300 underline font-mono">
                  legal@jambstar.com
                </a>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span>💡</span>
              <span>Quick Candidate Advice</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Found a typo or disagree with an explanation? Use the "Question Bank Feedback" category in the contact form with the specific Subject name, Exam Year, and Question Text so our academic review board can investigate and update the database within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions (FAQ) Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
          <p className="text-xs text-gray-500 mt-1">
            Quick answers to common questions about JAMBStar's CBT simulator.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600">
          <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <h3 className="font-bold text-gray-900 text-sm">
              Is JAMBStar officially affiliated with JAMB?
            </h3>
            <p>
              No. JAMBStar is an independent educational preparatory service. We are not owned or operated by the Joint Admissions and Matriculation Board. Our past questions and mock drills are provided for educational review and student empowerment.
            </p>
          </div>

          <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <h3 className="font-bold text-gray-900 text-sm">
              Can I use the CBT simulator on my phone?
            </h3>
            <p>
              Yes! JAMBStar is completely responsive and optimized for mobile phones, tablets, and desktop computers. You can use standard on-screen buttons on mobile or the authentic 8-key physical keyboard shortcuts (A, B, C, D, P, N, R, S) on a desktop.
            </p>
          </div>

          <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <h3 className="font-bold text-gray-900 text-sm">
              Is the 10-Question Guest Demo completely free?
            </h3>
            <p>
              Yes. Any candidate can click "Try 10-Question Demo" from the homepage to immediately practice 10 questions without creating an account or paying any fee.
            </p>
          </div>

          <div className="space-y-1.5 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <h3 className="font-bold text-gray-900 text-sm">
              How are past question explanations verified?
            </h3>
            <p>
              Our academic board verifies solutions against standard Nigerian secondary school curricula and past examiner reports, ensuring step-by-step clarity for difficult science, art, and commercial concepts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
