import React, { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { supabase } from "../lib/supabase";

export interface NavbarUser {
  id: string;
  email?: string;
}

export interface NavbarProps {
  user?: NavbarUser | null;
  role?: "student" | "admin" | "super_admin" | null;
  onSignOut?: () => Promise<void> | void;
}

// -----------------------------------------------------------------------------
// Role Normalization Helpers: handle 'admin', 'super_admin', 'superadmin' case-insensitively
// -----------------------------------------------------------------------------
export const normalizeRole = (
  rawRole: string | null | undefined
): "student" | "admin" | "super_admin" => {
  if (!rawRole) return "student";
  const clean = rawRole.toLowerCase().trim().replace(/[\s_-]/g, "");
  if (clean === "superadmin") return "super_admin";
  if (clean === "admin") return "admin";
  return "student";
};

export const isUserAdmin = (rawRole: string | null | undefined): boolean => {
  if (!rawRole) return false;
  const clean = rawRole.toLowerCase().trim().replace(/[\s_-]/g, "");
  return clean === "admin" || clean === "superadmin";
};

export const Navbar: React.FC<NavbarProps> = ({
  user: propUser,
  role: propRole,
  onSignOut: propOnSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [internalUser, setInternalUser] = useState<NavbarUser | null>(null);
  const [internalRole, setInternalRole] = useState<
    "student" | "admin" | "super_admin" | null
  >(null);

  // If props are passed, use them; otherwise manage internal state
  const isControlled = propUser !== undefined;
  const currentUser = isControlled ? propUser : internalUser;
  const currentRole = isControlled ? propRole : internalRole;

  // Clean non-recursive profile query by specific user ID
  const fetchProfileRole = async (
    userId: string
  ): Promise<"student" | "admin" | "super_admin"> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Could not fetch user role, defaulting to student:", error.message);
        return "student";
      }

      return normalizeRole(data?.role);
    } catch {
      return "student";
    }
  };

  useEffect(() => {
    if (isControlled) return;

    let isMounted = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && isMounted) {
        setInternalUser({ id: session.user.id, email: session.user.email });
        const fetchedRole = await fetchProfileRole(session.user.id);
        if (isMounted) setInternalRole(fetchedRole);
      } else if (isMounted) {
        setInternalUser(null);
        setInternalRole(null);
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && isMounted) {
        setInternalUser({ id: session.user.id, email: session.user.email });
        const fetchedRole = await fetchProfileRole(session.user.id);
        if (isMounted) setInternalRole(fetchedRole);
      } else if (isMounted) {
        setInternalUser(null);
        setInternalRole(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isControlled]);

  const handleSignOut = async () => {
    if (propOnSignOut) {
      await propOnSignOut();
    } else {
      await supabase.auth.signOut();
      setInternalUser(null);
      setInternalRole(null);
    }
    setMobileMenuOpen(false);
  };

  const hasAdminAccess = isUserAdmin(currentRole);

  const navLinks = [
    { name: "Home", path: "/" },
    ...(currentUser
      ? [
          { name: "Dashboard", path: "/dashboard" },
          { name: "CBT Quiz", path: "/quiz" },
        ]
      : []),
    ...(hasAdminAccess ? [{ name: "Admin Portal", path: "/admin" }] : []),
    { name: "Contact", path: "/contact" },
  ];

  return (
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
            {currentUser ? (
              <div className="hidden md:flex items-center gap-2">
                {hasAdminAccess && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200">
                    {normalizeRole(currentRole) === "super_admin"
                      ? "Super Admin"
                      : "Admin"}
                  </span>
                )}
                <span
                  className="text-xs font-medium text-slate-600 max-w-[140px] truncate"
                  title={currentUser.email}
                >
                  {currentUser.email}
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
            {currentUser ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-500 px-3 flex items-center justify-between">
                  <span className="truncate max-w-[180px]">
                    Signed in as{" "}
                    <strong className="text-slate-800">{currentUser.email}</strong>
                  </span>
                  {hasAdminAccess && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                      {normalizeRole(currentRole) === "super_admin"
                        ? "Super Admin"
                        : "Admin"}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
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

          {/* Quick Legal & AdSense Compliance Links (Mobile) */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-3 text-xs text-slate-500">
            <Link
              to="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-emerald-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <Link
              to="/terms"
              onClick={() => setMobileMenuOpen(false)}
              className="hover:text-emerald-600 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
