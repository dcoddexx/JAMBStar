import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Link,
  Navigate,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import Admin from "./pages/Admin";

interface AuthUser {
  id: string;
  email?: string;
}

// -----------------------------------------------------------------------------
// ProtectedRoute: Redirects unauthenticated users to landing ('/')
// -----------------------------------------------------------------------------
interface ProtectedRouteProps {
  children: React.ReactNode;
  user: AuthUser | null;
  loading: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  user,
  loading,
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
    return <Navigate to="/" replace />;
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

  if (role === "student" || (role !== "admin" && role !== "super_admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// -----------------------------------------------------------------------------
// Main App Component
// -----------------------------------------------------------------------------
const App: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<"student" | "admin" | "super_admin" | null>(
    null,
  );
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Query role from profiles table
  const fetchUserRole = async (
    userId: string,
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
          error.message,
        );
        return "student";
      }

      return (data?.role as "student" | "admin" | "super_admin") || "student";
    } catch {
      return "student";
    }
  };

  // Subscribe to Supabase Auth State Changes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email });
          const userRole = await fetchUserRole(session.user.id);
          setRole(userRole);
        } else {
          setUser(null);
          setRole(null);
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
        const userRole = await fetchUserRole(session.user.id);
        setRole(userRole);
      } else {
        setUser(null);
        setRole(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setMobileMenuOpen(false);
  };

  // Navigation Links:
  // - If unauthenticated: ONLY show 'Home'
  // - If authenticated: show 'Home', 'Dashboard', 'CBT Quiz'
  // - If admin/super_admin: also show 'Admin Portal'
  const navLinks = [
    { name: "Home", path: "/" },
    ...(user
      ? [
          { name: "Dashboard", path: "/dashboard" },
          { name: "CBT Quiz", path: "/quiz" },
        ]
      : []),
    ...(role === "admin" || role === "super_admin"
      ? [{ name: "Admin Portal", path: "/admin" }]
      : []),
  ];

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Brand / Logo */}
              <Link to="/" className="flex items-center group py-1">
                <img
                  src="/jambstar_full_logo.jpg"
                  alt="JAMBStar UTME Simulator"
                  className="h-35 sm:h-40 w-auto object-contain transition-transform group-hover:scale-102"
                />
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden sm:flex items-center gap-1 sm:gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.path === "/"}
                    className={({ isActive }) =>
                      `px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`
                    }
                  >
                    {link.name}
                  </NavLink>
                ))}
              </nav>

              {/* Action Buttons & Auth Profile Indicator */}
              <div className="flex items-center gap-2 sm:gap-3">
                {user ? (
                  <div className="hidden md:flex items-center gap-2">
                    {role && role !== "student" && (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                        {role}
                      </span>
                    )}
                    <span
                      className="text-xs font-medium text-slate-600 max-w-[140px] truncate"
                      title={user.email}
                    >
                      {user.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/"
                    className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors duration-150"
                  >
                    Candidate Sign In
                  </Link>
                )}

                {/* Mobile hamburger button */}
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  className="sm:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  aria-expanded={mobileMenuOpen}
                  aria-label="Toggle navigation menu"
                >
                  <span className="sr-only">Open main menu</span>
                  {mobileMenuOpen ? (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === "/"}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}

              <div className="pt-2 border-t border-slate-100 mt-2">
                {user ? (
                  <div className="space-y-2">
                    <div className="text-xs text-slate-500 px-3">
                      Signed in as{" "}
                      <strong className="text-slate-800">{user.email}</strong>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm"
                  >
                    Candidate Sign In
                  </Link>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <Routes>
            <Route path="/" element={<Landing />} />

            {/* Candidate Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute user={user} loading={authLoading}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute user={user} loading={authLoading}>
                  <Quiz />
                </ProtectedRoute>
              }
            />

            {/* Admin-Only Protected Route */}
            <Route
              path="/admin"
              element={
                <AdminRoute user={user} role={role} loading={authLoading}>
                  <Admin />
                </AdminRoute>
              }
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Responsive Footer */}
        <footer className="border-t border-slate-200 bg-white py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">JAMBStar</span>
              <span>•</span>
              <span>JAMB UTME CBT Preparation System</span>
            </div>
            <p>
              © {new Date().getFullYear()} JAMBStar. Built for Nigerian UTME
              candidates.
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
