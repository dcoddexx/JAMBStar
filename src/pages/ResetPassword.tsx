import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingSession, setVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check if a recovery session is active or hash contains access token
    const checkRecoverySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (mounted) {
            setHasValidSession(true);
            setVerifyingSession(false);
          }
          return;
        }

        // If the URL contains an access token or error from Supabase
        const hash = window.location.hash;
        if (hash.includes("access_token") || hash.includes("type=recovery")) {
          // Give Supabase a moment to parse hash tokens into a session
          const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
              if (event === "PASSWORD_RECOVERY" || session) {
                if (mounted) {
                  setHasValidSession(true);
                  setVerifyingSession(false);
                }
              }
            }
          );

          // Timeout fallback in case auth state doesn't change
          setTimeout(() => {
            if (mounted) {
              setVerifyingSession(false);
            }
          }, 2000);

          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          if (mounted) {
            setVerifyingSession(false);
          }
        }
      } catch (err) {
        if (mounted) {
          setVerifyingSession(false);
        }
      }
    };

    checkRecoverySession();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage(
        "Password updated successfully! Redirecting you to your dashboard..."
      );

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(
        error.message || "An unexpected error occurred while updating your password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 sm:py-16 px-4 sm:px-6 max-w-md mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 sm:p-8">
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-2xl shadow-inner mb-3">
            🔑
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Enter a strong new password to regain access to your candidate account.
          </p>
        </div>

        {/* Verification Loader */}
        {verifyingSession ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-500 font-medium">
              Verifying your recovery token...
            </p>
          </div>
        ) : !hasValidSession && !window.location.hash.includes("access_token") ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
              <span className="text-amber-600 text-lg leading-none">⚠️</span>
              <div>
                <strong className="block font-semibold mb-1">
                  Recovery Session Expired or Missing
                </strong>
                <span>
                  The password reset link may have expired or was opened in an invalid session. Please request a new password recovery email.
                </span>
              </div>
            </div>

            <Link
              to="/?auth=forgot_password"
              className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl font-semibold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
            >
              Request New Reset Link
            </Link>

            <div className="text-center pt-2">
              <Link
                to="/"
                className="text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
              >
                ← Return to Home Page
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Error Message Box */}
            {errorMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
                <span className="text-red-500 text-base leading-none">⚠️</span>
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            {/* Success Message Box */}
            {successMessage && (
              <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
                <span className="text-emerald-500 text-base leading-none">✓</span>
                <div className="flex-1 font-medium">{successMessage}</div>
              </div>
            )}

            {/* Reset Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Password Match Status Indicator */}
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  {newPassword === confirmPassword ? (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <span>✓</span> Passwords match
                    </span>
                  ) : (
                    <span className="text-amber-600 font-medium flex items-center gap-1">
                      <span>•</span> Passwords do not match yet
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                className={`w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 ${
                  loading || newPassword.length < 6 || newPassword !== confirmPassword
                    ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-md hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Updating Password...</span>
                  </>
                ) : (
                  "Update Password & Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              <Link
                to="/"
                className="font-semibold text-emerald-600 hover:text-emerald-700 underline"
              >
                ← Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
