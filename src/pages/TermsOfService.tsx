import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export const TermsOfService: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Terms of Service</span>
      </nav>

      {/* Header Banner */}
      <div className="border-b border-gray-200 pb-6">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-3">
          User Agreement
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Last Updated: November 3, 2026 • Effective Date: January 1, 2026
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-6 text-sm text-gray-700 leading-relaxed">
        {/* Section 1 */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>1.</span>
            <span>Acceptance of Terms</span>
          </h2>
          <p>
            These Terms of Service ("Terms") govern your access to and use of the <strong>JAMBStar</strong> platform, website, CBT practice engines, question banks, and analytical tools (collectively, the "Platform"), operated by <strong>JAMBStar Educational Technologies</strong> ("we," "our," or "us").
          </p>
          <p>
            By accessing or using the Platform—whether as a registered candidate or an unauthenticated guest user—you agree to be bound by these Terms and our Privacy Policy. If you do not agree to all terms and conditions, you must immediately cease accessing or using JAMBStar.
          </p>
        </section>

        {/* Section 2: Important Disclaimer Regarding JAMB */}
        <section className="bg-white p-6 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>2.</span>
            <span>Educational Fair Use & Independent Entity Disclaimer</span>
          </h2>
          <p>
            <strong>JAMBStar is an independent educational preparatory service.</strong> We are NOT affiliated with, authorized by, sponsored by, or endorsed by the <strong>Joint Admissions and Matriculation Board (JAMB)</strong> or any governmental testing authority.
          </p>
          <p>
            The terms "JAMB," "UTME," and related examination titles are registered trademarks and property of the Joint Admissions and Matriculation Board. Their use on this website is solely for descriptive, educational reference and study preparation under fair use doctrine. Our mock examination questions, simulated interfaces, and explanations are designed independently for student preparation and diagnostic assessment.
          </p>
        </section>

        {/* Section 3: Intellectual Property Protection */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>3.</span>
            <span>Intellectual Property & Content Ownership</span>
          </h2>
          <p>
            All original software code, user interface designs, custom question explanations, graphic diagrams, diagnostic scoring algorithms, and proprietary brand assets on JAMBStar are protected by copyright, trademark, and intellectual property laws of the Federal Republic of Nigeria and international treaties.
          </p>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
            <h3 className="font-semibold text-gray-900 text-xs uppercase tracking-wider">
              Strictly Prohibited Activities:
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 text-xs">
              <li>Using automated crawlers, scrapers, bots, or extraction scripts to harvest questions, answer keys, or explanations.</li>
              <li>Reproducing, redistributing, publishing, or selling JAMBStar question banks or diagnostic software.</li>
              <li>Attempting to decompile, reverse-engineer, or disassemble any part of the CBT simulator engine.</li>
              <li>Framing or mirroring any part of the Platform on third-party commercial portals without written consent.</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Guest Usage Limits */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>4.</span>
            <span>Guest Usage Limits & Evaluation Access</span>
          </h2>
          <p>
            To allow new candidates to experience the platform, JAMBStar provides an unauthenticated guest demo drill limited to ten (10) practice questions.
          </p>
          <p>
            Guests are granted a limited, revocable, non-exclusive license to take the 10-question evaluation preview. Full UTME simulations (180 questions across four selected subjects, 2-hour countdown timers, and saved analytical history) require the creation of a verified candidate account. Circumventing guest limits via browser automation or session spoofing constitutes a breach of these Terms.
          </p>
        </section>

        {/* Section 5: Candidate Account Rules */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>5.</span>
            <span>Candidate Account Rules & Academic Integrity</span>
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-gray-700">
            <li>
              <strong>Account Security:</strong> You are responsible for safeguarding your login credentials. You agree to notify us immediately of any unauthorized access to your account.
            </li>
            <li>
              <strong>Individual Use:</strong> Each candidate account is strictly for individual personal study. Sharing credentials across study groups, coaching centers, or commercial entities without an institutional license is strictly prohibited.
            </li>
            <li>
              <strong>Accurate Information:</strong> You agree to provide true and accurate information during registration (such as valid email and educational track).
            </li>
            <li>
              <strong>Academic Honesty:</strong> Candidates must not attempt to manipulate quiz scores, upload corrupted or malicious content, or interfere with database integrity.
            </li>
          </ul>
        </section>

        {/* Section 6: Disclaimer of Warranties & Limitation of Liability */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>6.</span>
            <span>Disclaimer of Warranties & Limitation of Liability</span>
          </h2>
          <p>
            The Platform is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis without warranties of any kind, whether express or implied.
          </p>
          <p>
            While we strive for 100% curriculum accuracy and maximum uptime, we do not warrant that question banks will be error-free or that practice test scores on JAMBStar guarantee specific grades in the official UTME conducted by JAMB. To the maximum extent permitted by applicable law, JAMBStar shall not be liable for any indirect, incidental, special, consequential, or punitive damages.
          </p>
        </section>

        {/* Section 7: Account Suspension & Termination */}
        <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>7.</span>
            <span>Suspension & Termination</span>
          </h2>
          <p>
            We reserve the right to suspend, disable, or terminate any candidate or administrative account without prior notice if we determine that you have violated these Terms, engaged in fraudulent activity, or compromised the security of the Platform.
          </p>
        </section>

        {/* Section 8: Governing Law */}
        <section className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>8.</span>
            <span>Governing Law & Contact</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm">
            These Terms shall be governed by and construed in accordance with the laws of the <strong>Federal Republic of Nigeria</strong>. Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts of Nigeria.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-300 space-y-1">
            <p><strong>Legal & Compliance Department</strong></p>
            <p>Email: <a href="mailto:legal@jambstar.com" className="text-emerald-400 underline">legal@jambstar.com</a></p>
            <p>Support: <a href="mailto:support@jambstar.com" className="text-emerald-400 underline">support@jambstar.com</a></p>
            <p>JAMBStar Educational Technologies • Lagos, Nigeria</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
