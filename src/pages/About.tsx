import React, { useEffect } from "react";
import { Link } from "react-router-dom";

export const About: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "About Us | JAMBStar UTME Preparatory Platform";

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Learn about JAMBStar, our academic mission to empower Nigerian students to achieve 300+ in the UTME, our 8-key CBT simulator, and our independent question verification process."
      );
    }
  }, []);

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">About Us</span>
      </nav>

      {/* Header Banner */}
      <div className="border-b border-gray-200 pb-6 space-y-3">
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
          Our Educational Mission
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
          About JAMBStar
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Empowering Nigerian university aspirants with authentic CBT simulation, deep syllabus mastery,
          and transparent, affordable academic tools to score 300+ in the UTME.
        </p>
      </div>

      <div className="space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
        {/* Mission & Vision */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
            <span>🚀</span>
            <span>Why We Built JAMBStar</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Democratizing High-Scoring UTME Preparation Across Nigeria
          </h2>
          <p>
            Every year, more than 1.8 million Nigerian candidates register for the Unified Tertiary
            Matriculation Examination (UTME) conducted by JAMB. Yet, fewer than 25% score 200 or above,
            and only a fraction reach the 280–320+ thresholds required for fiercely competitive courses
            such as Medicine & Surgery, Law, Nursing, Software Engineering, and Pharmacy.
          </p>
          <p>
            The root cause is rarely lack of ambition. Most candidates struggle because traditional
            printed past questions fail to simulate the high-pressure 2-hour computerized test
            environment. Furthermore, answer keys in printed booklets often contain misprints, outdated
            syllabi, and zero pedagogical explanation of <em>why</em> an answer is correct.
          </p>
          <p>
            <strong>JAMBStar was founded to solve this dilemma.</strong> We combine high-yield past
            question analysis with an authentic, browser-based CBT simulator that mirrors the exact
            computer test center environment, enabling students to eliminate exam anxiety and build
            lightning-fast speed.
          </p>
        </section>

        {/* 3 Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
              ⌨️
            </div>
            <h3 className="font-bold text-gray-900 text-base">Authentic 8-Key CBT</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Full support for official 8-key shortcuts (A, B, C, D, P, N, R, S) so candidates learn
              mouse-free keyboard navigation before walking into the accredited CBT center.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              📚
            </div>
            <h3 className="font-bold text-gray-900 text-base">Verified Explanations</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Every past question is verified by seasoned subject teachers, complete with formulas,
              grammatical rules, and step-by-step working.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg">
              ₦
            </div>
            <h3 className="font-bold text-gray-900 text-base">Affordable & Fair</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              No recurring subscriptions or hidden recurring fees. A single, transparent ₦1,000 fee
              grants lifetime access for the candidate's entire preparatory cycle.
            </p>
          </div>
        </div>

        {/* Question Curation & Quality Assurance */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
            <span>🔬</span>
            <span>Pedagogy & Accuracy</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            How Our Question Bank Is Curated and Verified
          </h2>
          <p>
            Our repository contains over 25,000 past UTME and model mock examination questions spanning
            science, arts, commercial, and social science subjects. Each question passes through a
            three-stage verification pipeline:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
            <li>
              <strong>Curriculum Alignment:</strong> Verification that questions match the latest NERDC
              and official JAMB examination syllabus guidelines, excluding obsolete or discontinued
              topics.
            </li>
            <li>
              <strong>Dual-Teacher Cross-Check:</strong> Senior educators independently solve each question,
              drafting clear, step-by-step rationales that explain why the correct option is right and
              why common distractor options are incorrect.
            </li>
            <li>
              <strong>Student Feedback Loop:</strong> Our live platform includes an active feedback
              channel where candidates and teachers can report typographical ambiguities, which are
              investigated and resolved by our academic board within 24 hours.
            </li>
          </ol>
        </section>

        {/* Independent Entity Disclaimer */}
        <section className="bg-amber-50/40 border border-amber-200 rounded-2xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
            <span>⚖️</span>
            <span>Independent Educational Service Disclaimer</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Fair Use Notice & Relationship to the Joint Admissions and Matriculation Board
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            <strong>JAMBStar is an independent educational preparatory platform.</strong> We are not
            affiliated with, endorsed by, sponsored by, or operated by the <strong>Joint Admissions and
            Matriculation Board (JAMB)</strong> or any governmental testing agency.
          </p>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
            The terms "JAMB," "UTME," and related examination titles are registered trademarks of the
            Joint Admissions and Matriculation Board. Their use on this website is strictly for
            descriptive, educational reference, and study preparation under the fair use doctrine of
            Nigerian and international intellectual property law.
          </p>
        </section>

        {/* Team & Contact Channels */}
        <section className="bg-slate-900 text-white p-6 sm:p-8 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <span>🏢</span>
            <span>Operational Base & Academic Editorial Team</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            JAMBStar Educational Technologies
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            JAMBStar is developed and maintained by a team of Nigerian educators, software engineers,
            and psychometric testing enthusiasts based in Lagos, Nigeria. Our editorial board includes
            experienced tutors with over 15 years of secondary and tertiary preparatory experience.
          </p>
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
            <div>
              <span className="block font-bold text-slate-100 uppercase tracking-wider text-[10px]">
                Support & Candidate Helpdesk:
              </span>
              <a href="mailto:support@jambstar.com" className="text-emerald-400 underline font-mono">
                support@jambstar.com
              </a>
            </div>
            <div>
              <span className="block font-bold text-slate-100 uppercase tracking-wider text-[10px]">
                Academic & Question Feedback:
              </span>
              <a href="mailto:academic@jambstar.com" className="text-emerald-400 underline font-mono">
                academic@jambstar.com
              </a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8 sm:p-10 text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Start Your Journey Toward a 300+ JAMB Score Today
          </h2>
          <p className="text-emerald-100 text-sm max-w-xl mx-auto">
            Take our free 10-question evaluation drill or read through our comprehensive study guides.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/quiz"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition-colors shadow-xs"
            >
              Take Free 10-Question Demo
            </Link>
            <Link
              to="/study-guides"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700/60 border border-emerald-300/40 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
            >
              Explore Study Guides
            </Link>
            <Link
              to="/pricing"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-900/60 border border-emerald-400/40 text-emerald-100 font-bold text-sm hover:bg-emerald-900 transition-colors"
            >
              View Pro Pricing (₦1,000)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
