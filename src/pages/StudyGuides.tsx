import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { STUDY_GUIDES, type StudyGuide } from "../data/studyGuides";

export const StudyGuides: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<string>("All");

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "JAMB UTME Study Guides & Worked Past Solutions | JAMBStar";
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Comprehensive, high-yield study guides and step-by-step worked solutions for Nigerian UTME candidates. Master English, Mathematics, Physics, Chemistry, Biology, and more."
      );
    }
  }, []);

  const tracks = ["All", "General", "Science", "Arts", "Commercial"];

  const filteredGuides = useMemo(() => {
    return STUDY_GUIDES.filter((guide: StudyGuide) => {
      const matchesTrack = selectedTrack === "All" || guide.track === selectedTrack;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesTrack;

      const matchesSearch =
        guide.title.toLowerCase().includes(q) ||
        guide.subject.toLowerCase().includes(q) ||
        guide.excerpt.toLowerCase().includes(q) ||
        guide.syllabusTopics.some((t) => t.toLowerCase().includes(q));

      return matchesTrack && matchesSearch;
    });
  }, [searchQuery, selectedTrack]);

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

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500">
        <Link to="/" className="hover:text-emerald-600 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Study Guides</span>
      </nav>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Curriculum-Aligned Academic Resources
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
          JAMB UTME Study Guides & Worked Past Solutions
        </h1>
        <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
          Comprehensive, syllabus-aligned revision notes, shortcut strategies, and step-by-step
          solved UTME questions prepared by senior Nigerian examiners to help you achieve 300+.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, subject, or formula (e.g., calculus, genetics, lexis)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm placeholder-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Track Filters */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto">
            {tracks.map((track) => {
              const isSelected = selectedTrack === track;
              const count =
                track === "All"
                  ? STUDY_GUIDES.length
                  : STUDY_GUIDES.filter((g) => g.track === track).length;

              return (
                <button
                  key={track}
                  type="button"
                  onClick={() => setSelectedTrack(track)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{track}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-emerald-700 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active filter / result count display */}
        <div className="text-xs text-gray-500 flex items-center justify-between pt-2 border-t border-gray-100">
          <span>
            Showing <strong className="text-gray-800">{filteredGuides.length}</strong> study guide{filteredGuides.length === 1 ? "" : "s"}
            {selectedTrack !== "All" && ` in ${selectedTrack}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          {(selectedTrack !== "All" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedTrack("All");
                setSearchQuery("");
              }}
              className="text-emerald-600 hover:underline font-medium cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Study Guides Grid */}
      {filteredGuides.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredGuides.map((guide) => (
            <article
              key={guide.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md transition-all flex flex-col overflow-hidden group"
            >
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getTrackBadgeColor(
                          guide.track
                        )}`}
                      >
                        {guide.track}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                        {guide.subject}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">
                      {guide.readTime}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors leading-snug">
                      <Link to={`/study-guides/${guide.slug}`}>
                        {guide.title}
                      </Link>
                    </h2>
                    <p className="mt-2 text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {guide.excerpt}
                    </p>
                  </div>

                  {/* Syllabus chips */}
                  <div className="pt-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
                      Key Syllabus Topics:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {guide.syllabusTopics.slice(0, 3).map((topic, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-gray-50 text-gray-600 text-[10px] border border-gray-200"
                        >
                          {topic}
                        </span>
                      ))}
                      {guide.syllabusTopics.length > 3 && (
                        <span className="px-1.5 py-0.5 text-gray-400 text-[10px]">
                          +{guide.syllabusTopics.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {guide.workedQuestions.length} Worked Solutions
                  </span>

                  <Link
                    to={`/study-guides/${guide.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 group-hover:translate-x-1 transition-all"
                  >
                    Read Guide
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-xl">
            🔍
          </div>
          <h3 className="text-base font-bold text-gray-900">No study guides found</h3>
          <p className="text-xs text-gray-500">
            No revision articles matched your search query "{searchQuery}" in the {selectedTrack} track.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedTrack("All");
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* CBT Mock Practice Callout */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-8 sm:p-10 text-white shadow-lg space-y-6">
        <div className="max-w-2xl space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 inline-block">
            Authentic JAMB CBT Simulator
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Apply What You Learned in a Timed CBT Mock Drill
          </h2>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Practice over 25,000+ verified UTME past questions with authentic 8-key keyboard shortcuts
            (A, B, C, D, P, N, R, S), 2-hour timers, and instant diagnostics.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/quiz"
            className="px-6 py-3 rounded-xl bg-white text-emerald-800 font-bold text-sm hover:bg-emerald-50 transition-all text-center shadow-xs"
          >
            Try Free 10-Question Demo
          </Link>
          <Link
            to="/pricing"
            className="px-6 py-3 rounded-xl bg-emerald-600/40 border border-emerald-300/40 text-white font-bold text-sm hover:bg-emerald-600/60 transition-all text-center"
          >
            Unlock Unlimited Pro Practice (₦1,000)
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudyGuides;
