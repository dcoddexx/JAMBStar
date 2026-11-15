import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { STUDY_GUIDES, type StudyGuide, type WorkedQuestion } from "../data/studyGuides";

export const StudyGuideDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const guide = STUDY_GUIDES.find((g) => g.slug === slug);

  // Track user interactive quiz selections: { [questionId]: selectedOptionIndex }
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    window.scrollTo(0, 0);

    if (guide) {
      document.title = `${guide.title} | JAMBStar Study Guide`;

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", guide.metaDescription);
      }
    }
  }, [guide]);

  if (!guide) {
    return (
      <div className="py-16 px-4 max-w-2xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-2xl">
          📖
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Study Guide Not Found</h1>
        <p className="text-sm text-gray-600">
          The revision guide you requested does not exist or may have been relocated.
        </p>
        <Link
          to="/study-guides"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
        >
          ← Browse All Study Guides
        </Link>
      </div>
    );
  }

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const getTrackBadgeColor = (track: StudyGuide["track"]) => {
    switch (track) {
      case "Science":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Arts":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Commercial":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  // Other related guides in the same track or general
  const relatedGuides = STUDY_GUIDES.filter(
    (g) => g.slug !== guide.slug && (g.track === guide.track || g.track === "General")
  ).slice(0, 2);

  const optionLetters = ["A", "B", "C", "D"];

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
        <Link to="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link to="/study-guides" className="hover:text-emerald-600 transition-colors">
          Study Guides
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{guide.subject}</span>
      </nav>

      {/* Article Header */}
      <header className="space-y-4 border-b border-gray-200 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${getTrackBadgeColor(
              guide.track
            )}`}
          >
            {guide.track} Track
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {guide.subject}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500 font-medium">{guide.readTime}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">Updated {guide.publishedDate}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
          {guide.title}
        </h1>

        <p className="text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
          {guide.subtitle}
        </p>

        {/* Author / Editorial attribution */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200">
            JS
          </div>
          <div className="text-xs">
            <span className="block font-bold text-gray-900">{guide.author}</span>
            <span className="text-gray-500">{guide.authorRole}</span>
          </div>
        </div>
      </header>

      {/* Key Takeaways Card */}
      <section className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-6 sm:p-7 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
          <span>🎯</span>
          <span>Core Examination Objectives & Takeaways</span>
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-emerald-950">
          {guide.keyTakeaways.map((takeaway, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-bold mt-0.5">✓</span>
              <span className="leading-relaxed">{takeaway}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Table of Syllabus Coverage */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 space-y-3 shadow-2xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Official JAMB Syllabus Topics Explored:
        </h2>
        <div className="flex flex-wrap gap-2">
          {guide.syllabusTopics.map((topic, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200"
            >
              {topic}
            </span>
          ))}
        </div>
      </section>

      {/* Main Educational Content Sections */}
      <article className="prose prose-slate max-w-none space-y-8 text-sm sm:text-base text-gray-700 leading-relaxed">
        {guide.sections.map((section, idx) => (
          <section
            key={idx}
            className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-extrabold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <span>{section.heading}</span>
            </h2>
            <div className="space-y-4 text-gray-700 leading-relaxed text-sm sm:text-base">
              {section.content.map((paragraph, pIdx) => (
                <p key={pIdx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </article>

      {/* Interactive Worked UTME Questions Section */}
      <section className="space-y-6 pt-4">
        <div className="border-b border-gray-200 pb-4">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-block mb-2">
            Interactive Diagnostic Practice
          </span>
          <h2 className="text-2xl font-bold text-gray-900">
            Step-by-Step Worked Past Examination Questions
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Test your understanding right now. Click any option (A, B, C, or D) to immediately check
            your answer and reveal the examiner's step-by-step reasoning.
          </p>
        </div>

        <div className="space-y-6">
          {guide.workedQuestions.map((q: WorkedQuestion, qIndex: number) => {
            const selectedOption = selectedAnswers[q.id];
            const hasAnswered = selectedOption !== undefined;
            const isCorrect = selectedOption === q.correctOptionIndex;

            return (
              <div
                key={q.id}
                className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-2xs space-y-5"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-emerald-700 uppercase tracking-wider">
                    Question {qIndex + 1} • {q.topic}
                  </span>
                  {hasAnswered && (
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 ${
                        isCorrect
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {isCorrect ? "✓ Correct (+1 Mark)" : "✗ Incorrect"}
                    </span>
                  )}
                </div>

                {/* Question Text */}
                <p className="text-base font-semibold text-gray-900 leading-relaxed">
                  {q.question}
                </p>

                {/* Multiple Choice Options */}
                <div className="grid grid-cols-1 gap-2.5">
                  {q.options.map((option, optIdx) => {
                    const isSelected = selectedOption === optIdx;
                    const isTheCorrectOne = optIdx === q.correctOptionIndex;

                    let btnStyle = "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100";
                    if (hasAnswered) {
                      if (isTheCorrectOne) {
                        btnStyle = "bg-green-50 border-green-500 text-green-950 font-semibold ring-1 ring-green-500";
                      } else if (isSelected && !isTheCorrectOne) {
                        btnStyle = "bg-red-50 border-red-400 text-red-950 line-through ring-1 ring-red-400";
                      } else {
                        btnStyle = "bg-gray-50 border-gray-200 text-gray-400 opacity-70";
                      }
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(q.id, optIdx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${
                            hasAnswered && isTheCorrectOne
                              ? "bg-green-600 text-white"
                              : hasAnswered && isSelected && !isTheCorrectOne
                              ? "bg-red-500 text-white"
                              : "bg-white text-gray-700 border border-gray-300"
                          }`}
                        >
                          {optionLetters[optIdx]}
                        </span>
                        <span className="leading-snug pt-0.5">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Detailed Rationale / Solution */}
                {hasAnswered && (
                  <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm text-slate-800">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Examiner's Step-by-Step Rationale:</span>
                    </div>
                    <p className="leading-relaxed text-slate-700">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Next Step / Practice CBT Drill Callout */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 space-y-6">
        <div className="space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-block">
            Put Revision Into Action
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to Practice Full CBT Mocks for {guide.subject}?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Experience the real exam environment with authentic 8-key shortcuts (A, B, C, D, P, N,
            R, S), 2-hour timers, and instant diagnostics on JAMBStar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/quiz"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all text-center"
          >
            Start Free 10-Question Drill
          </Link>
          <Link
            to="/pricing"
            className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm transition-all text-center"
          >
            Upgrade to Pro (₦1,000 Lifetime)
          </Link>
        </div>
      </div>

      {/* Related Study Guides */}
      {relatedGuides.length > 0 && (
        <section className="space-y-4 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recommended Related Study Guides</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedGuides.map((rel) => (
              <Link
                key={rel.id}
                to={`/study-guides/${rel.slug}`}
                className="p-5 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:shadow-md transition-all group block"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {rel.subject}
                  </span>
                  <span className="text-[10px] text-gray-400">{rel.readTime}</span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                  {rel.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rel.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default StudyGuideDetail;
