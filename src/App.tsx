import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import Admin from "./pages/Admin";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import Settings from "./pages/Settings";
import Navbar, { normalizeRole, isUserAdmin } from "./components/Navbar";

export { normalizeRole, isUserAdmin };

interface AuthUser {
  id: string;
  email?: string;
}

// -----------------------------------------------------------------------------
// ProtectedRoute: Redirects unauthenticated users to landing ('/?auth=signup')
// -----------------------------------------------------------------------------
interface ProtectedRouteProps {
  children: React.ReactNode;
  user: AuthUser | null;
  loading: boolean;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  user,
  loading,
  redirectTo = "/?auth=signup",
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <span className="mt-3 text-xs font-semibold text-gray-500">
          Checking authorization...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};


// -----------------------------------------------------------------------------
// AdminRoute: Checks user role from profiles; redirects students to '/dashboard'
// -----------------------------------------------------------------------------
interface AdminRouteProps {
  children: React.ReactNode;
  user: AuthUser | null;
  role: string | null;
  loading: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({
  children,
  user,
  role,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <span className="mt-3 text-xs font-semibold text-gray-500">
          Verifying administrator permissions...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Authorize access if user has admin or super_admin role (normalized case-insensitively)
  if (!isUserAdmin(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// -----------------------------------------------------------------------------
// Main App Component
// -----------------------------------------------------------------------------
const App: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<"student" | "admin" | "super_admin" | null>(
    null,
  );
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Query role from profiles table with normalization
  const fetchUserRole = async (
    userId: string
  ): Promise<"student" | "admin" | "super_admin"> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn(
          "Could not fetch user role, defaulting to student:",
          error.message
        );
        return "student";
      }

      return normalizeRole(data?.role);
    } catch {
      return "student";
    }
  };

  // Subscribe to Supabase Auth State Changes and re-query profiles on active session
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          if (isMounted) {
            setUser({ id: session.user.id, email: session.user.email });
          }
          // Re-query profiles table directly to get latest live role on page refresh
          const userRole = await fetchUserRole(session.user.id);
          if (isMounted) {
            setRole(userRole);
          }
        } else {
          if (isMounted) {
            setUser(null);
            setRole(null);
          }
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (isMounted) {
          setUser({ id: session.user.id, email: session.user.email });
        }
        // Re-query profiles table whenever session changes
        const userRole = await fetchUserRole(session.user.id);
        if (isMounted) {
          setRole(userRole);
        }
      } else {
        if (isMounted) {
          setUser(null);
          setRole(null);
        }
      }
      if (isMounted) {
        setAuthLoading(false);
      }
    });

    // Re-check profile role when window regains focus to reflect live database updates immediately
    const handleFocus = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user && isMounted) {
        const liveRole = await fetchUserRole(session.user.id);
        setRole(liveRole);
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        {/* Navigation Bar Component */}
        <Navbar user={user} role={role} onSignOut={handleSignOut} />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <Routes>
            <Route path="/" element={<Landing />} />

            {/* Candidate Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute user={user} loading={authLoading} redirectTo="/?auth=signup">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Candidate Settings Route */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute user={user} loading={authLoading} redirectTo="/?auth=signup">
                  <Settings />
                </ProtectedRoute>
              }
            />
            {/* CBT Quiz Route: accessible to logged-in candidates and guest demo candidates */}
            <Route path="/quiz" element={<Quiz />} />

            {/* Admin-Only Protected Route */}
            <Route
              path="/admin"
              element={
                <AdminRoute user={user} role={role} loading={authLoading}>
                  <Admin />
                </AdminRoute>
              }
            />

            {/* Google AdSense Compliance & Legal Pages */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/contact" element={<Contact />} />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Responsive Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 sm:py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">JAMBStar</span>
              <span>•</span>
              <span>JAMB UTME CBT Preparation System</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 font-medium text-slate-600">
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
            <p className="text-center md:text-right text-xs text-slate-400">
              © {new Date().getFullYear()} JAMBStar. Built for Nigerian UTME candidates.
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
