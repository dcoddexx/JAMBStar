import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { AdBanner } from "../components/AdBanner";

type AuthMode = "signin" | "signup";
type AcademicTrack = "Science" | "Arts" | "Commercial";

interface ActiveUser {
  id: string;
  email?: string;
  full_name?: string;
  track?: string;
  role?: string;
}

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentUser, setCurrentUser] = useState<ActiveUser | null>(null);
  const [checkingSession, setCheckingSession] = useState<boolean>(true);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [track, setTrack] = useState<AcademicTrack>("Science");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Real-time password criteria for registration
  const passwordCriteria = [
    {
      id: "length",
      label: "At least 8 characters",
      isValid: password.length >= 8,
    },
    {
      id: "uppercase",
      label: "One uppercase letter",
      isValid: /[A-Z]/.test(password),
    },
    {
      id: "number",
      label: "One number",
      isValid: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: "One special character",
      isValid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const isPasswordValid = passwordCriteria.every(
    (criterion) => criterion.isValid,
  );

  // Sync mode with URL search parameters (e.g., /?auth=signup from route guards)
  useEffect(() => {
    const authParam = searchParams.get("auth");
    if (authParam === "signup") {
      setMode("signup");
      setErrorMessage(null);
    } else if (authParam === "signin") {
      setMode("signin");
      setErrorMessage(null);
    }
  }, [searchParams]);

  // Check active Supabase session
  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, track, role")
            .eq("id", session.user.id)
            .maybeSingle();

          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            full_name:
              profile?.full_name ||
              session.user.user_metadata?.full_name ||
              "Candidate",
            track:
              profile?.track || session.user.user_metadata?.track || "Science",
            role: profile?.role || "student",
          });
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        setCheckingSession(false);
      }
    };

    checkActiveSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, track, role")
          .eq("id", session.user.id)
          .maybeSingle();

        setCurrentUser({
          id: session.user.id,
          email: session.user.email,
          full_name:
            profile?.full_name ||
            session.user.user_metadata?.full_name ||
            "Candidate",
          track:
            profile?.track || session.user.user_metadata?.track || "Science",
          role: profile?.role || "student",
        });
      } else {
        setCurrentUser(null);
      }
      setCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please provide both an email address and a password.");
      return;
    }

    if (mode === "signup" && !isPasswordValid) {
      setErrorMessage(
        "Please ensure your password meets all required security criteria.",
      );
      return;
    }

    if (mode === "signin" && password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (
            error.message.toLowerCase().includes("invalid login credentials")
          ) {
            setErrorMessage(
              "Invalid email or password. Please verify your credentials.",
            );
          } else {
            setErrorMessage(error.message);
          }
          return;
        }

        if (data.user) {
          navigate("/dashboard");
        }
      } else {
        // Registration mode
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || "Student Candidate",
              track,
            },
          },
        });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        if (data.session) {
          // Automatic login upon registration
          navigate("/dashboard");
        } else if (data.user) {
          setSuccessMessage(
            "Registration successful! Please check your email to verify your account, or sign in.",
          );
          setMode("signin");
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6 sm:py-12 px-3 sm:px-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Hero & Value Proposition */}
        <div className="lg:col-span-7 text-center lg:text-left space-y-6">
          <div className="flex justify-center lg:justify-start">
            <img
              src="/jambstar_full_logo.jpg"
              alt="JAMBStar UTME Simulator"
              className="h-40 sm:h-45 lg:h-50 w-auto object-contain rounded-xl"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 text-xs sm:text-sm font-semibold tracking-wide text-emerald-700 bg-emerald-100 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            JAMB UTME CBT Preparation Platform
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Master Your JAMB Exam with{" "}
            <span className="text-emerald-600">JAMBStar</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
            Practice thousands of past questions in real CBT exam conditions.
            Build exam speed, master high-yield topics, and achieve 300+ in your
            UTME.
          </p>

          {/* Quick Stats or Key Features */}
          <div className="pt-2 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto lg:mx-0">
            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                10k+
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Verified Questions
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                8-Key
              </div>
              <div className="text-xs text-gray-500 font-medium">
                JAMB CBT Simulation
              </div>
            </div>
            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-2xs">
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                3 Tracks
              </div>
              <div className="text-xs text-gray-500 font-medium">
                Science/Arts/Comm
              </div>
            </div>
          </div>

          {/* Prominent 10-Question Demo Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/quiz?demo=true")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all duration-150 cursor-pointer group"
            >
              <span>⚡ Try 10-Question Demo</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
            <span className="text-xs text-gray-500 font-medium text-center sm:text-left">
              Free instant preview • No account required
            </span>
          </div>
        </div>

        {/* Right Column: Conditionally render Welcome Back component OR Login/Signup Form */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          {checkingSession ? (
            /* Loading Skeleton while session resolves */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center animate-pulse">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mx-auto mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
              <div className="h-12 bg-gray-200 rounded-xl w-full"></div>
            </div>
          ) : currentUser ? (
            /* ================================================================= */
            /* WELCOME BACK COMPONENT (Rendered for active Supabase sessions)    */
            /* ================================================================= */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sm:p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-emerald-500 to-teal-500"></div>

              {/* Avatar circle */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-100 to-teal-50 border-2 border-emerald-500/20 text-emerald-700 font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                {(currentUser.full_name || currentUser.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              {/* Status pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Candidate Session
              </div>

              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Welcome Back, {currentUser.full_name || "Candidate"}!
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 mt-1 font-mono truncate max-w-xs mx-auto">
                {currentUser.email}
              </p>

              {currentUser.track && (
                <div className="mt-3 flex justify-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                    Track: {currentUser.track}
                  </span>
                  {currentUser.role && currentUser.role !== "student" && (
                    <span className="text-xs px-2.5 py-1 rounded-md bg-purple-100 text-purple-700 font-bold uppercase tracking-wider border border-purple-200">
                      {currentUser.role}
                    </span>
                  )}
                </div>
              )}

              <p className="text-xs sm:text-sm text-gray-600 mt-4 leading-relaxed">
                You are currently signed in. Ready to continue your UTME CBT
                mock drills and track your scores?
              </p>

              {/* Prominent CTA */}
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <span>Continue to Dashboard</span>
                  <span className="group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </button>

                <div className="flex items-center justify-center gap-4 pt-2 text-xs">
                  <Link
                    to="/quiz"
                    className="text-emerald-600 hover:text-emerald-700 font-semibold underline"
                  >
                    Direct to CBT Exam
                  </Link>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-red-500 hover:text-red-700 font-medium cursor-pointer"
                  >
                    Switch Account (Sign Out)
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ================================================================= */
            /* LOGIN / REGISTRATION FORM CARD (Rendered when unauthenticated)    */
            /* ================================================================= */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8">
              {/* Highlight Banner if redirected from a protected route */}
              {searchParams.get("auth") === "signup" && (
                <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-200">
                  <span className="text-amber-600 text-base leading-none">🔒</span>
                  <div className="flex-1">
                    <strong className="block font-bold">Candidate Account Required</strong>
                    <span className="text-amber-800">
                      Sign in or create a free account to access your Dashboard, full mock drills, and score history.
                    </span>
                  </div>
                </div>
              )}

              {/* Mode Switcher Tabs */}
              <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    mode === "signin"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                    mode === "signup"
                      ? "bg-white text-gray-900 shadow-xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-900">
                  {mode === "signin"
                    ? "Welcome Back, Candidate"
                    : "Create Student Account"}
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {mode === "signin"
                    ? "Sign in to access your test history, analytics, and timed CBT mocks."
                    : "Register your candidate profile and start your prep today."}
                </p>
              </div>

              {/* Error Message Box */}
              {errorMessage && (
                <div className="mb-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                  <span className="text-red-500 text-base leading-none">
                    ⚠️
                  </span>
                  <div className="flex-1 font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Success Message Box */}
              {successMessage && (
                <div className="mb-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
                  <span className="text-emerald-500 text-base leading-none">
                    ✓
                  </span>
                  <div className="flex-1 font-medium">{successMessage}</div>
                </div>
              )}

              {/* Auth Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {mode === "signup" && (
                  <>
                    <div>
                      <label
                        htmlFor="full-name"
                        className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        id="full-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Chinelo Okonkwo"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {/* Academic Track Picker */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                        Academic Track
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(
                          ["Science", "Arts", "Commercial"] as AcademicTrack[]
                        ).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTrack(t)}
                            className={`py-2 px-1 text-xs font-semibold rounded-lg border text-center transition-all ${
                              track === t
                                ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-bold"
                                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Real-time Dynamic Password Validation Checklist (Registration only) */}
                  {mode === "signup" && (
                    <div className="mt-2.5 p-3 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                        Password Requirements
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {passwordCriteria.map((c) => (
                          <div
                            key={c.id}
                            className={`flex items-center gap-2 transition-colors duration-200 ${
                              c.isValid
                                ? "text-emerald-700 font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 transition-colors duration-200 ${
                                c.isValid
                                  ? "bg-emerald-500 text-white font-bold"
                                  : "bg-gray-200 text-transparent border border-gray-300"
                              }`}
                            >
                              ✓
                            </span>
                            <span>{c.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (mode === "signup" && !isPasswordValid)}
                  className={`w-full mt-2 py-3 px-4 rounded-lg font-semibold text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 ${
                    loading || (mode === "signup" && !isPasswordValid)
                      ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                  }`}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      <span>Processing...</span>
                    </>
                  ) : mode === "signin" ? (
                    "Sign In to Dashboard"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>

              {/* Footer switcher */}
              <div className="mt-5 text-center text-xs text-gray-500">
                {mode === "signin" ? (
                  <>
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
                    >
                      Register here
                    </button>
                  </>
                ) : (
                  <>
                    Already registered?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
                    >
                      Sign in here
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AdSense Monetization Banner */}
      <div className="mt-10 sm:mt-14 w-full max-w-4xl mx-auto">
        <AdBanner slot="1001001001" format="horizontal" />
      </div>

      {/* Feature Highlights Grid */}
      <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
        <div className="p-5 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-4">
            📚
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Curated Past Questions
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Access thousands of verified JAMB past questions with in-depth
            step-by-step explanations.
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-4">
            ⏱️
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Real CBT Simulation
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Experience the standard UTME 8-key CBT environment with live timer
            and subject switching.
          </p>
        </div>

        <div className="p-5 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-lg mb-4">
            📊
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Instant Analytics
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Identify your weak topics immediately with automated score
            breakdowns and timing stats.
          </p>
        </div>
      </div>

      {/* Google AdSense Crawler Compliance & Legal Navigation Section */}
      <div className="mt-16 pt-8 border-t border-gray-200 w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-800">JAMBStar Preparatory Portal</span>
          <span>•</span>
          <span>Independent UTME Simulation</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium text-gray-600">
          <Link to="/privacy" className="hover:text-emerald-600 transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-emerald-600 transition-colors">
            Terms of Service
          </Link>
          <Link to="/contact" className="hover:text-emerald-600 transition-colors">
            Contact & About Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Landing;
