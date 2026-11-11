import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { UserAvatar } from "./UserAvatar";

export interface NavbarUser {
  id: string;
  email?: string;
  full_name?: string | null;
  avatar_url?: string | null;
  gender?: "male" | "female" | string | null;
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
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState<boolean>(false);
  const avatarDropdownRef = useRef<HTMLDivElement>(null);

  const [internalUser, setInternalUser] = useState<NavbarUser | null>(null);
  const [internalRole, setInternalRole] = useState<
    "student" | "admin" | "super_admin" | null
  >(null);
  const [profileDetails, setProfileDetails] = useState<{
    full_name: string | null;
    avatar_url: string | null;
    gender: "male" | "female";
    last_read_notices?: string | null;
  } | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [hasUnreadNotices, setHasUnreadNotices] = useState<boolean>(false);

  // Clear notice board badge and sync with database
  const handleClearNotices = async () => {
    setHasUnreadNotices(false);
    setAvatarDropdownOpen(false);
    setMobileMenuOpen(false);
    window.dispatchEvent(new Event("notices_read"));

    try {
      const targetUserId = currentUser?.id || (await supabase.auth.getUser()).data.user?.id;
      if (targetUserId) {
        await supabase
          .from("profiles")
          .update({ last_read_notices: new Date().toISOString() })
          .eq("id", targetUserId);
      }
    } catch (err) {
      console.warn("Could not update last_read_notices in navbar:", err);
    }
  };

  // Compare created_at of latest notice against candidate's last_read_notices timestamp
  const checkUnreadNotices = async (userId: string, userLastRead?: string | null) => {
    if (!userId) return;

    // If candidate is actively viewing the notices tab, don't show unread indicator
    const params = new URLSearchParams(window.location.search);
    if (window.location.pathname === "/dashboard" && params.get("tab") === "notices") {
      setHasUnreadNotices(false);
      return;
    }

    try {
      let lastRead = userLastRead;
      if (lastRead === undefined) {
        const { data: p } = await supabase
          .from("profiles")
          .select("last_read_notices")
          .eq("id", userId)
          .maybeSingle();
        lastRead = p?.last_read_notices || null;
      }

      const { data: latestNotice } = await supabase
        .from("notices")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestNotice) {
        if (!lastRead) {
          setHasUnreadNotices(true);
        } else {
          const noticeTime = new Date(latestNotice.created_at).getTime();
          const readTime = new Date(lastRead).getTime();
          setHasUnreadNotices(noticeTime > readTime);
        }
      } else {
        setHasUnreadNotices(false);
      }
    } catch (e) {
      console.warn("Could not check unread notices in navbar:", e);
    }
  };

  // If props are passed, use them; otherwise manage internal state
  const isControlled = propUser !== undefined;
  const currentUser = isControlled ? propUser : internalUser;
  const currentRole = isControlled ? propRole : internalRole;

  // Exact unread message count for active user (support tickets)
  const fetchUnreadCount = async (userId: string) => {
    if (!userId) return;
    try {
      const { count, error } = await supabase
        .from("ticket_messages")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false)
        .neq("sender_id", userId);

      if (!error && typeof count === "number") {
        setUnreadCount(count);
      }
    } catch (e) {
      console.warn("Could not fetch unread message count:", e);
    }
  };

  // Clean non-recursive profile query by specific user ID
  const fetchProfileDetails = async (
    userId: string
  ): Promise<{
    role: "student" | "admin" | "super_admin";
    full_name: string | null;
    avatar_url: string | null;
    gender: "male" | "female";
    last_read_notices: string | null;
  }> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role, full_name, avatar_url, gender, last_read_notices")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.warn("Could not fetch user profile details:", error.message);
        return {
          role: "student",
          full_name: null,
          avatar_url: null,
          gender: "male",
          last_read_notices: null,
        };
      }

      return {
        role: normalizeRole(data?.role),
        full_name: data?.full_name || null,
        avatar_url: data?.avatar_url || null,
        gender: data?.gender === "female" ? "female" : "male",
        last_read_notices: data?.last_read_notices || null,
      };
    } catch {
      return {
        role: "student",
        full_name: null,
        avatar_url: null,
        gender: "male",
        last_read_notices: null,
      };
    }
  };

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && isMounted) {
        setInternalUser({ id: session.user.id, email: session.user.email });
        fetchUnreadCount(session.user.id);
        const details = await fetchProfileDetails(session.user.id);
        if (isMounted) {
          setInternalRole(details.role);
          setProfileDetails({
            full_name: details.full_name,
            avatar_url: details.avatar_url,
            gender: details.gender,
          });
          checkUnreadNotices(session.user.id, details.last_read_notices);
        }
      } else if (isMounted) {
        setInternalUser(null);
        setInternalRole(null);
        setProfileDetails(null);
        setUnreadCount(0);
        setHasUnreadNotices(false);
      }
    };

    syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user && isMounted) {
        setInternalUser({ id: session.user.id, email: session.user.email });
        fetchUnreadCount(session.user.id);
        const details = await fetchProfileDetails(session.user.id);
        if (isMounted) {
          setInternalRole(details.role);
          setProfileDetails({
            full_name: details.full_name,
            avatar_url: details.avatar_url,
            gender: details.gender,
          });
          checkUnreadNotices(session.user.id, details.last_read_notices);
        }
      } else if (isMounted) {
        setInternalUser(null);
        setInternalRole(null);
        setProfileDetails(null);
        setUnreadCount(0);
        setHasUnreadNotices(false);
      }
    });

    // Re-fetch profile & unread count on window focus
    const handleFocus = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user && isMounted) {
        fetchUnreadCount(session.user.id);
        const details = await fetchProfileDetails(session.user.id);
        if (isMounted) {
          setProfileDetails({
            full_name: details.full_name,
            avatar_url: details.avatar_url,
            gender: details.gender,
          });
          checkUnreadNotices(session.user.id, details.last_read_notices);
        }
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("focus", handleFocus);
    };
  }, [isControlled]);

  // Dedicated real-time listener for incoming messages to refresh unread count & notices
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`schema-db-changes-navbar-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ticket_messages",
        },
        () => {
          fetchUnreadCount(currentUser.id);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notices",
        },
        () => {
          setHasUnreadNotices(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  // Click outside listener for avatar dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        avatarDropdownRef.current &&
        !avatarDropdownRef.current.contains(event.target as Node)
      ) {
        setAvatarDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen for global notices_read sync event (e.g. from Dashboard notices tab)
  useEffect(() => {
    const handleNoticesRead = () => {
      setHasUnreadNotices(false);
    };
    window.addEventListener("notices_read", handleNoticesRead);
    return () => {
      window.removeEventListener("notices_read", handleNoticesRead);
    };
  }, []);

  // Clear unread indicator whenever candidate lands on or views /dashboard?tab=notices
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (location.pathname === "/dashboard" && params.get("tab") === "notices") {
      setHasUnreadNotices(false);
      handleClearNotices();
    }
  }, [location.pathname, location.search]);

  const handleSignOut = async () => {
    if (propOnSignOut) {
      await propOnSignOut();
    } else {
      await supabase.auth.signOut();
      setInternalUser(null);
      setInternalRole(null);
      setProfileDetails(null);
    }
    setAvatarDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const hasAdminAccess = isUserAdmin(currentRole);

  // Standard dashboard link is replaced by the dynamic User Avatar on the right
  const navLinks = [
    { name: "Home", path: "/" },
    ...(currentUser ? [{ name: "CBT Quiz", path: "/dashboard?setup=true" }] : []),
    ...(hasAdminAccess ? [{ name: "Admin Portal", path: "/admin" }] : []),
    { name: "Contact", path: "/contact" },
  ];

  const resolvedAvatarUrl = profileDetails?.avatar_url || currentUser?.avatar_url || null;
  const resolvedGender = profileDetails?.gender || currentUser?.gender || "male";
  const resolvedName = profileDetails?.full_name || currentUser?.full_name || null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <Link to="/" className="flex items-center group py-0.5 h-14 overflow-hidden">
            <img
              src="/jambstar_full_logo.jpg"
              alt="JAMBStar UTME Simulator"
              className="h-11 sm:h-13 w-auto object-contain mix-blend-multiply transition-transform group-hover:scale-102"
            />
          </Link>

          {/* Desktop Navigation Links (Home, CBT Quiz, Admin Portal, Contact) */}
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

          {/* Right Header: Dynamic User Avatar & Account Dropdown or Sign In CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentUser ? (
              <div className="relative" ref={avatarDropdownRef}>
                <button
                  type="button"
                  onClick={() => setAvatarDropdownOpen((prev) => !prev)}
                  className="relative flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs group"
                  aria-expanded={avatarDropdownOpen}
                  aria-label="User account menu"
                >
                  <div className="relative">
                    <UserAvatar
                      avatarUrl={resolvedAvatarUrl}
                      gender={resolvedGender}
                      name={resolvedName || currentUser.email}
                      size="sm"
                    />
                    {(unreadCount > 0 || hasUnreadNotices) && (
                      <span
                        className={`absolute -top-1.5 -right-1.5 flex items-center justify-center ${
                          unreadCount > 0 ? "min-w-[18px] h-[18px] px-1 text-[10px] font-black" : "w-3 h-3"
                        } text-white bg-rose-600 rounded-full border-2 border-white shadow-xs`}
                        title={
                          unreadCount > 0
                            ? `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`
                            : "New announcement posted"
                        }
                      >
                        {unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : ""}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:inline text-xs font-semibold text-slate-700 max-w-[120px] truncate group-hover:text-emerald-700 transition-colors">
                    {resolvedName || currentUser.email?.split("@")[0] || "Account"}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                      avatarDropdownOpen ? "rotate-180 text-emerald-600" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Avatar Dropdown Menu: Dashboard, Settings, Admin (if admin), Logout */}
                {avatarDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {/* Candidate Identity Header */}
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                      <UserAvatar
                        avatarUrl={resolvedAvatarUrl}
                        gender={resolvedGender}
                        name={resolvedName || currentUser.email}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {resolvedName || "Student Candidate"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate" title={currentUser.email}>
                          {currentUser.email}
                        </p>
                        <div className="mt-1">
                          {hasAdminAccess ? (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                              {normalizeRole(currentRole) === "super_admin" ? "Super Admin" : "Admin"}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Candidate
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Items */}
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setAvatarDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <span className="text-sm">📊</span>
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        to="/dashboard?tab=notices"
                        onClick={handleClearNotices}
                        className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm">📢</span>
                          <span>Notices & Updates</span>
                        </div>
                        {hasUnreadNotices && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-2xs" title="New notice posted" />
                        )}
                      </Link>

                      <Link
                        to="/dashboard?tab=messages"
                        onClick={() => setAvatarDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm">💬</span>
                          <span>Messages & Support</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-600 text-white shadow-2xs">
                            {unreadCount}
                          </span>
                        )}
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setAvatarDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        <span className="text-sm">⚙️</span>
                        <span>Settings</span>
                      </Link>

                      {hasAdminAccess && (
                        <Link
                          to="/admin"
                          onClick={() => setAvatarDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <span className="text-sm">🛡️</span>
                          <span>Admin Portal</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                      >
                        <span className="text-sm">🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/"
                className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors duration-150"
              >
                Candidate Sign In
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2 shadow-lg">
          {currentUser && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3 mb-2">
              <UserAvatar
                avatarUrl={resolvedAvatarUrl}
                gender={resolvedGender}
                name={resolvedName || currentUser.email}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {resolvedName || "Student Candidate"}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email}</p>
              </div>
            </div>
          )}

          {/* Nav links */}
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          {currentUser && (
            <>
              <NavLink
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                📊 Dashboard
              </NavLink>

              <NavLink
                to="/dashboard?tab=notices"
                onClick={handleClearNotices}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <span>📢 Notices & Updates</span>
                {hasUnreadNotices && (
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-2xs" />
                )}
              </NavLink>

              <NavLink
                to="/dashboard?tab=messages"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <span>💬 Messages & Support</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-600 text-white shadow-xs">
                    {unreadCount}
                  </span>
                )}
              </NavLink>

              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                ⚙️ Settings
              </NavLink>
            </>
          )}

          <div className="pt-2 border-t border-slate-100 mt-2">
            {currentUser ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
              >
                🚪 Logout
              </button>
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

          {/* Quick Legal Links */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3 text-xs text-slate-500">
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
