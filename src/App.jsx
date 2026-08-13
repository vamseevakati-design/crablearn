import { useMemo, useState, useEffect, useRef } from "react";
import AccountsPage from "./AccountsPage";

const subjectGroups = [
  {
    name: "Elementary",
    subjects: ["Elementary Math", "Science", "Grammar and Writing", "Reading Comprehension"]
  },
  {
    name: "High School / Middle School",
    subjects: ["Algebra", "Biology", "Physics", "Essay Writing"]
  },
  {
    name: "Languages",
    subjects: ["English Fluency", "French", "Spanish", "IELTS Speaking"]
  },
  {
    name: "AP",
    subjects: ["AP Calculus", "AP Chemistry", "AP Statistics"]
  },
  {
    name: "IB",
    subjects: ["IB Math AA", "IB Biology", "TOK Writing"]
  },
  {
    name: "IGCSE",
    subjects: ["Extended Math", "Coordinated Science", "English First Language"]
  },
  {
    name: "SAT",
    subjects: ["Math Prep", "Reading Strategy", "Essay Review"]
  },
  {
    name: "ACT",
    subjects: ["Math", "Science Reasoning", "English"]
  }
];

const liveClasses = [
  {
    title: "Maths Class - Zoom",
    type: "General",
    platform: "Zoom",
    updated: "Updated: 2026-07-22 17:00:00"
  },
  {
    title: "Maths Class - Webex",
    type: "Exclusive",
    platform: "Webex",
    updated: "Updated: 2026-07-22 16:42:00"
  },
  {
    title: "Science Class (R-3)",
    type: "General",
    platform: "Zoom",
    updated: "Updated: 2026-07-22 15:55:00"
  }
];

const featureList = [
  "1-on-1 tutoring",
  "Managed tutoring",
  "Flexible scheduling",
  "Homework help"
];

const workItems = [
  "Professional responsive website design",
  "Mobile-friendly layout",
  "Secure student dashboard",
  "Student registration and approval workflow",
  "Protected live class access",
  "Fee management and reporting"
];

const proofStats = [
  { value: "2.5k+", label: "active students" },
  { value: "180+", label: "weekly live classes" },
  { value: "96%", label: "renewal rate" }
];

const trustBadges = ["Live mentor support", "Secure parent portal", "Weekly progress snapshots", "Fast callback response"];

const adminFeatures = [
  "Manage students and approvals",
  "Schedule classes",
  "Fee management",
  "View reports and analytics",
  "Manage callback requests",
  "System settings"
];

const adminQuickStats = [
  { value: "2.5k+", label: "Active students" },
  { value: "180+", label: "Weekly classes" }
];

const taglines = [
  "Where confidence meets expertise",
  "Unlock your child's full potential",
  "Live learning that actually works",
  "Your child's success starts here"
];

const defaultCategory = subjectGroups[0].name;

const signInProfiles = {
  student: {
    label: "Student",
    badgeText: "student / admin",
    identifierLabel: "Username or Phone Number",
    identifierPlaceholder: "Enter username or registered phone number",
    passwordPlaceholder: "Enter your password",
    extraLabel: "Class / Grade (optional)",
    extraPlaceholder: "Example: Grade 9",
    welcomeTitle: "Student sign in"
  },
  teacher: {
    label: "Teacher",
    badgeText: "teacher",
    identifierLabel: "Teacher ID or Phone Number",
    identifierPlaceholder: "Enter teacher ID or phone number",
    passwordPlaceholder: "Enter teacher password",
    extraLabel: "Subject / Department (optional)",
    extraPlaceholder: "Example: Mathematics",
    welcomeTitle: "Teacher sign in"
  },
  engineer: {
    label: "Engineer",
    badgeText: "engineer",
    identifierLabel: "Engineer Email or Username",
    identifierPlaceholder: "Enter email or username",
    passwordPlaceholder: "Enter engineer password",
    extraLabel: "Team / Project (optional)",
    extraPlaceholder: "Example: LMS Platform",
    welcomeTitle: "Engineer sign in"
  },
  accounts: {
    label: "Accounts",
    badgeText: "accounts / admin",
    identifierLabel: "Accounts Username or Phone Number",
    identifierPlaceholder: "Enter accounts username or registered phone number",
    passwordPlaceholder: "Enter accounts password",
    extraLabel: "Department / Desk (optional)",
    extraPlaceholder: "Example: Fee reports",
    welcomeTitle: "Enter your accounts credentials"
  }
};

const teacherPhoneRoleOverrides = {
  "9787001217": "teacher"
};

const signInRoutes = {
  student: "/Student portal",
  teacher: "/Teacher portal",
  engineer: "/Engineer portal",
  accounts: "/Accounts"
};

function getRoleFromPathname(pathname) {
  const normalizedPath = decodeURIComponent(String(pathname || "")).trim().toLowerCase();
  if (normalizedPath.endsWith("student portal")) {
    return "student";
  }
  if (normalizedPath.endsWith("teacher portal")) {
    return "teacher";
  }
  if (normalizedPath.endsWith("engineer portal")) {
    return "engineer";
  }
  if (normalizedPath.endsWith("accounts")) {
    return "accounts";
  }
  return null;
}

function formatPortalRoleLabel(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (!normalized) return "User";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const previewVideoUrl = import.meta.env.VITE_PREVIEW_VIDEO_URL || "https://www.youtube-nocookie.com/embed/ysz5S6PUM-U";
  const [menuOpen, setMenuOpen] = useState(false);
  const [signInMenuOpen, setSignInMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [portalScreen, setPortalScreen] = useState("home");
  const [signInRole, setSignInRole] = useState("student");
  const [routeRole, setRouteRole] = useState(() => getRoleFromPathname(window.location.pathname));
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const signInMenuRef = useRef(null);
  const showPortalSection = Boolean(routeRole); // Determine if the portal section should be shown
  const [authMode, setAuthMode] = useState("login");
  const [loginMessage, setLoginMessage] = useState("Use your username or registered phone number with password to continue.");
  const [callbackMessage, setCallbackMessage] = useState("Request a callback and we will match the learner with the right advisor.");
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminActionMessage, setAdminActionMessage] = useState("Admin actions require password verification.");
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [approvalContacts, setApprovalContacts] = useState({
    admin: {
      phone: "+919787001217",
      email: "padmaja.vamsee@gmail.com"
    },
    supervisor: {
      phone: "+919873762244",
      email: "vrvamsee@gmail.com"
    }
  });
  const [rowResetPasswords, setRowResetPasswords] = useState({});
  const [rowActionStatus, setRowActionStatus] = useState({});

  const activeSubjects = useMemo(
    () => subjectGroups.find((group) => group.name === activeCategory)?.subjects ?? [],
    [activeCategory]
  );

  const activePortalRole = routeRole || signInRole || "student";
  const activeSignInProfile = signInProfiles[activePortalRole] || signInProfiles.student;
  const currentUserRole = String(currentUser?.role || "").toLowerCase();
  const isAdmin = ["admin", "supervisor"].includes(currentUserRole);
  const learnerName = currentUser?.full_name || currentUser?.name || "Learner";
  const roleLabel = formatPortalRoleLabel(currentUserRole || activePortalRole);
  const isAccountsPortal = activePortalRole === "accounts";
  const canAccessAccountsPage = ["accounts", "admin", "supervisor"].includes(currentUserRole);

  const showAccountsDashboard = isAccountsPortal && canAccessAccountsPage && portalScreen === "accounts-dashboard";
  const showMarketingContent = portalScreen === "home" && !showPortalSection;
  const showPortalPreviewSection = showPortalSection && !showAccountsDashboard;
  const showContactSection = showMarketingContent;
  const showStudentPortalTabs = Boolean(currentUser) && !isAccountsPortal && !isAdmin;
  const showStudentSupportContent = !showAccountsDashboard;
  const isStudentLoginView = activePortalRole === "student" && portalScreen === "login";
  const isStudentWorkspaceView = activePortalRole === "student" && ["dashboard", "live"].includes(portalScreen);
  const portalPreviewLabel = isAccountsPortal ? "Accounts workspace" : `${formatPortalRoleLabel(activePortalRole)} portal`;
  const portalLoginLabel = isAccountsPortal ? "accounts / admin" : activeSignInProfile.badgeText;
  const showGlobalHomeButton = showPortalSection || portalScreen !== "home";

  const portalScreenTitle = (() => {
    if (portalScreen === "login") {
      return isAccountsPortal ? "Accounts" : `${formatPortalRoleLabel(activePortalRole)} portal`;
    }
    if (portalScreen === "accounts-dashboard") {
      return "Accounts dashboard";
    }
    if (portalScreen === "admin-dashboard") {
      return "Admin dashboard";
    }
    if (portalScreen === "live") {
      return "Live classes";
    }
    if (portalScreen === "dashboard") {
      return "Student dashboard";
    }
    return "Portal";
  })();

  const activeAuthRole = useMemo(() => {
    if (signInRole === "accounts") {
      return "accounts";
    }

    const sanitizedPhone = String(loginIdentifier || "").replace(/\D/g, "");
    return teacherPhoneRoleOverrides[sanitizedPhone] || signInRole;
  }, [loginIdentifier, signInRole]);

  useEffect(() => {
    const handlePopState = () => {
      setRouteRole(getRoleFromPathname(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (routeRole) {
      setSignInRole(routeRole);
      setPortalScreen("login");
    }
  }, [routeRole]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!previewOpen) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setPreviewOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [previewOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (signInMenuRef.current && !signInMenuRef.current.contains(event.target)) {
        setSignInMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToHomePage() {
    setPortalScreen("home");
    setRouteRole(null);
    setSignInMenuOpen(false);
    if (decodeURIComponent(window.location.pathname) !== "/") {
      window.history.pushState({}, "", "/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(event.currentTarget);
    const phone = String(formData.get("phone") || loginIdentifier || "").trim();
    const password = String(formData.get("password") || "");

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone,
          password,
          role: activeAuthRole
        })
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setAuthMessage(payload.message || "Login failed. Please check your details.");
        return;
      }

      const signedInUser = payload.student || payload.user || null;
      const signedInRole = String(signedInUser?.role || "").toLowerCase();

      setCurrentUser(signedInUser);
      setAuthMessage(payload.message || "Signed in successfully.");
      setLoginMessage(payload.message || "Signed in successfully.");
      if (activeAuthRole === "accounts") {
        setPortalScreen("accounts-dashboard");
      } else if (signedInRole === "student") {
        setPortalScreen("dashboard");
      } else if (["admin", "supervisor"].includes(signedInRole)) {
        setPortalScreen("admin-dashboard");
      }
      form.reset();
      setLoginIdentifier("");
    } catch (error) {
      setAuthMessage("Login service is unavailable. Please check the API server and try again.");
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") || "");
    const phone = String(formData.get("phone") || "");
    const password = String(formData.get("password") || "");

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fullName, phone, password, role: signInRole })
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setLoginMessage(payload.message || "Registration failed. Please verify your details.");
        return;
      }

      setLoginMessage(payload.message || "Account created. You can sign in now.");
      setAuthMode("login");
      event.currentTarget.reset();
    } catch (error) {
      setLoginMessage("Registration service is unavailable. Please check the API server and try again.");
    }
  }

  async function handleCallbackSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parentName = String(formData.get("parentName") || "");
    const parentPhone = String(formData.get("parentPhone") || "");
    const program = String(formData.get("program") || "");
    const message = String(formData.get("message") || "");

    try {
      const response = await fetch(`${apiBaseUrl}/api/callback-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          parentName,
          parentPhone,
          program,
          message
        })
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setCallbackMessage(payload.message || "Could not submit callback request right now.");
        return;
      }

      setCallbackMessage(payload.message || "Callback request saved successfully.");
      event.currentTarget.reset();
    } catch (error) {
      setCallbackMessage("Callback service is unavailable. Please check the API server and try again.");
    }
  }

  async function runAdminAction(endpoint, payload) {
    if (!currentUser) {
      setAdminActionMessage("Please sign in as admin or supervisor first.");
      return null;
    }

    if (!adminPassword) {
      setAdminActionMessage("Enter your admin/supervisor password to continue.");
      return null;
    }

    try {
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          adminIdentifier: currentUser.full_name || currentUser.phone,
          adminPassword,
          ...payload
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        setAdminActionMessage(result.message || "Admin action failed.");
        return null;
      }

      setAdminActionMessage(result.message || "Admin action completed.");
      return result;
    } catch (error) {
      setAdminActionMessage("Admin service is unavailable. Please check API and try again.");
      return null;
    }
  }

  async function handleAdminListUsers() {
    setAdminUsersLoading(true);
    const result = await runAdminAction("/api/admin/users/list", {});
    if (result?.ok && Array.isArray(result.users)) {
      setAdminUsers(result.users);
      if (result.approvalContacts?.admin || result.approvalContacts?.supervisor) {
        setApprovalContacts({
          admin: {
            phone: result.approvalContacts?.admin?.phone || "+919787001217",
            email: result.approvalContacts?.admin?.email || "padmaja.vamsee@gmail.com"
          },
          supervisor: {
            phone: result.approvalContacts?.supervisor?.phone || "+919873762244",
            email: result.approvalContacts?.supervisor?.email || "vrvamsee@gmail.com"
          }
        });
      }
      setRowActionStatus((prev) => {
        const next = {};
        for (const user of result.users) {
          if (prev[user.phone]) {
            next[user.phone] = prev[user.phone];
          }
        }
        return next;
      });
    }
    setAdminUsersLoading(false);
  }

  async function handleRowApproveUser(phone) {
    const safePhone = String(phone || "").trim();
    if (!safePhone) {
      setAdminActionMessage("Target phone is required.");
      return;
    }

    const result = await runAdminAction(`/api/admin/users/${encodeURIComponent(safePhone)}/approve`, {});
    if (result?.ok) {
      setRowActionStatus((prev) => ({
        ...prev,
        [safePhone]: { type: "success", message: "User approved successfully." }
      }));
      await handleAdminListUsers();
    } else {
      setRowActionStatus((prev) => ({
        ...prev,
        [safePhone]: { type: "error", message: "Approval failed. Check admin credentials and try again." }
      }));
    }
  }

  async function handleRowDenyUser(phone) {
    const safePhone = String(phone || "").trim();
    if (!safePhone) {
      setAdminActionMessage("Target phone is required.");
      return;
    }

    const result = await runAdminAction(`/api/admin/users/${encodeURIComponent(safePhone)}/deny`, {});
    if (result?.ok) {
      setRowActionStatus((prev) => ({
        ...prev,
        [safePhone]: { type: "success", message: "User denied successfully." }
      }));
      await handleAdminListUsers();
    } else {
      setRowActionStatus((prev) => ({
        ...prev,
        [safePhone]: { type: "error", message: "Deny action failed. Check admin credentials and try again." }
      }));
    }
  }

  async function handleRowResetPassword(phone) {
    const safePhone = String(phone || "").trim();
    const nextPassword = String(rowResetPasswords[safePhone] || "");

    if (!safePhone || !nextPassword) {
      setAdminActionMessage("Provide a new password for the selected user.");
      return;
    }

    const result = await runAdminAction(`/api/admin/users/${encodeURIComponent(safePhone)}/reset-password`, {
      newPassword: nextPassword
    });

    if (result?.ok) {
      setRowResetPasswords((prev) => ({ ...prev, [safePhone]: "" }));
      setRowActionStatus((prev) => ({
        ...prev,
        [safePhone]: { type: "success", message: "Password reset successfully." }
      }));
      await handleAdminListUsers();
    } else {
      setRowActionStatus((prev) => ({
        ...prev,
        [safePhone]: { type: "error", message: "Reset failed. Check admin credentials and try again." }
      }));
    }
  }

  async function handleAdminCreateUser(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const password = String(formData.get("password") || "");
    const role = String(formData.get("role") || "student");

    const result = await runAdminAction("/api/admin/users", {
      fullName,
      phone,
      password,
      role,
      status: "approved"
    });

    if (result?.ok) {
      event.currentTarget.reset();
      await handleAdminListUsers();
    }
  }

  async function handleAdminApproveUser(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phone = String(formData.get("phone") || "").trim();
    if (!phone) {
      setAdminActionMessage("Target phone is required.");
      return;
    }

    const result = await runAdminAction(`/api/admin/users/${encodeURIComponent(phone)}/approve`, {});
    if (result?.ok) {
      event.currentTarget.reset();
      await handleAdminListUsers();
    }
  }

  async function handleAdminResetPassword(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phone = String(formData.get("phone") || "").trim();
    const newPassword = String(formData.get("newPassword") || "");
    if (!phone || !newPassword) {
      setAdminActionMessage("Target phone and new password are required.");
      return;
    }

    const result = await runAdminAction(`/api/admin/users/${encodeURIComponent(phone)}/reset-password`, { newPassword });
    if (result?.ok) {
      event.currentTarget.reset();
      await handleAdminListUsers();
    }
  }

  function goToSignInRoute(role = "student") {
    const nextRole = signInProfiles[role] ? role : "student";
    const nextPath = signInRoutes[nextRole];
    if (decodeURIComponent(window.location.pathname) !== nextPath) {
      window.history.pushState({}, "", nextPath);
    }
    setRouteRole(nextRole);
  }

  function goToLoginPanel(role = "student") {
    const nextRole = signInProfiles[role] ? role : "student";
    setSignInRole(nextRole);
    setAuthMode("login");
    setPortalScreen("login");
    goToSignInRoute(nextRole);
    const loginSection = document.getElementById("about");
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setAuthMode("login");
    setLoginIdentifier("");
    setSignInMenuOpen(false);
    setAdminPassword("");
    setAdminActionMessage("Admin actions require password verification.");
    setAdminUsers([]);
    setRowResetPasswords({});
    setRowActionStatus({});
    setPortalScreen(showPortalSection ? "login" : "home");
    setLoginMessage("Use your username or registered phone number with password to continue.");
    setAuthMessage("Signed out successfully.");
  }

  function handleSignInRole(role) {
    const profile = signInProfiles[role] || signInProfiles.student;
    setSignInMenuOpen(false);
    setLoginMessage(`${profile.label} login selected. Use your credentials to continue.`);
    goToLoginPanel(role);
  }

  function handleSignInToggle() {
    setSignInMenuOpen((open) => !open);
  }

  return (
    <div className="site-shell">
      {showGlobalHomeButton ? (
        <button className="floating-home-button" type="button" onClick={goToHomePage}>
          Back to Home
        </button>
      ) : null}
      <div className="atmosphere" aria-hidden="true">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      <header className="site-header" id="top">
        <div className="top-nav">
          <button className="brand-block" type="button" onClick={goToHomePage}>
            <div className="brand-mark">C</div>
            <div>
              <div className="brand-title">crablearn</div>
              <div className="brand-subtitle">online Academy at its Best</div>
            </div>
          </button>

          <nav className="main-nav">
            <div className="menu-anchor">
              <button
                className="nav-link nav-button"
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
              >
                Subjects & Pricing
              </button>
              {menuOpen ? (
                <div className="mega-menu">
                  <div className="mega-menu-column">
                    {subjectGroups.map((group) => (
                      <button
                        key={group.name}
                        className={`mega-item${activeCategory === group.name ? " active" : ""}`}
                        type="button"
                        onMouseEnter={() => setActiveCategory(group.name)}
                        onFocus={() => setActiveCategory(group.name)}
                        onClick={() => setActiveCategory(group.name)}
                      >
                        <span>{group.name}</span>
                        <span>&gt;</span>
                      </button>
                    ))}
                  </div>
                  <div className="mega-menu-column detail">
                    {activeSubjects.map((subject) => (
                      <div className="subject-leaf" key={subject}>{subject}</div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            {showMarketingContent ? <a className="nav-link" href="#workflow">How it Works</a> : null}
            <a className="nav-link" href="#about">About Us</a>
            {showMarketingContent ? <a className="nav-link" href="#contact">Contact Us</a> : null}
          </nav>

          <div className="nav-actions">
            {showMarketingContent ? <a className="phone-link" href="#contact">Call us</a> : null}
            {currentUser ? <div className="session-pill">{roleLabel} signed in</div> : null}
            {!currentUser && showMarketingContent ? (
              <div className="signin-menu" data-testid="signin-menu" ref={signInMenuRef} data-open={signInMenuOpen ? "true" : "false"}>
                <button className="button ghost signin-trigger" type="button" onClick={handleSignInToggle} aria-haspopup="true" aria-expanded={signInMenuOpen} data-testid="signin-trigger">
                  <span>Sign in</span>
                  <span className="signin-trigger-caret" aria-hidden="true" />
                </button>
                <div className="signin-dropdown" role="menu" aria-label="Sign in options">
                  <button type="button" className="signin-option" role="menuitem" onClick={() => handleSignInRole("student")} data-testid="signin-option-student">student login</button>
                  <button type="button" className="signin-option" role="menuitem" onClick={() => handleSignInRole("teacher")} data-testid="signin-option-teacher">teacher login</button>
                  <button type="button" className="signin-option" role="menuitem" onClick={() => handleSignInRole("engineer")} data-testid="signin-option-engineer">engineer login</button>
                  <button type="button" className="signin-option" role="menuitem" onClick={() => handleSignInRole("accounts")} data-testid="signin-option-accounts">accounts login</button>
                </div>
              </div>
            ) : null}
            {currentUser ? <button className="button ghost" type="button" onClick={handleLogout}>Sign out</button> : null}
            {showMarketingContent ? <a className="button solid" href="#contact">Request a callback</a> : null}
          </div>
        </div>

        {authMessage ? (
          <div className="auth-feedback" role="status" aria-live="polite">{authMessage}</div>
        ) : null}

        {showMarketingContent ? (
          <>
            <div className="season-banner">
              <div className="season-art">SUN</div>
              <div className="season-copy">
                <h2>Beat the Summer Slide</h2>
                <p>Join our Summer Program 2026 and help your child stay ahead, strengthen skills and gain confidence for the upcoming school year.</p>
              </div>
              <button className="button solid banner-button" type="button" onClick={goToHomePage}>Summer Academy 2026</button>
            </div>

            <section className="hero-panel">
              <div className="hero-content">
                <p className="eyebrow">{taglines[taglineIndex]}</p>
                <h1>Secure live classes, guided fee management, and parent-first visibility.</h1>
                <ul className="hero-list">
                  {featureList.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="hero-actions">
                  <a className="button coral" href="#contact">Request a callback</a>
                </div>
              </div>

              <div className="hero-video-card">
                <div className="video-frame">
                  <button className="video-play" type="button" onClick={() => setPreviewOpen(true)} aria-label="Open class overview video">
                    Play
                  </button>
                </div>
                <div className="video-caption">Explore the live class experience, parent reporting, and secure dashboard workflow.</div>
              </div>
            </section>

            <section className="trust-ticker" aria-label="Trust badges">
              <div className="ticker-track">
                {[...trustBadges, ...trustBadges].map((item, index) => (
                  <span className="ticker-item" key={`${item}-${index}`}>{item}</span>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </header>

      <main>
        {showMarketingContent ? (
          <>
            <section className="section proof-strip">
              {proofStats.map((stat) => (
                <article className="proof-card" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </section>

            <section className="section split-section" id="workflow">
              <div>
                <p className="section-kicker">Project overview</p>
                <h2>crablearn website with secure student approval and live class access.</h2>
                <p className="section-text">
                  This app mirrors the specification: responsive marketing site, login and approval style portal, secure live class cards, fee status, and member-only dashboard behavior.
                </p>
              </div>
              <div className="work-card">
                <p className="section-kicker">Scope of work</p>
                <ul className="work-list">
                  {workItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>
          </>
        ) : null}

        {showPortalPreviewSection ? (
        <section className={`section portal-section${isStudentLoginView ? " student-portal-section" : ""}${isStudentWorkspaceView ? " student-workspace-section" : ""}`} id="about">
          <div className={`section-heading-row${isStudentWorkspaceView ? " student-workspace-heading-row" : ""}`}>
            <div>
              <p className="section-kicker">{portalPreviewLabel}</p>
              <h2>{portalScreenTitle}</h2>
            </div>
            <div className="portal-tabs">
              {!currentUser && !isAccountsPortal ? (
                <button className={`portal-tab${portalScreen === "login" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("login")}>Login</button>
              ) : null}
              {isAccountsPortal && currentUser && canAccessAccountsPage ? (
                <button className={`portal-tab${portalScreen === "accounts-dashboard" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("accounts-dashboard")}>Accounts</button>
              ) : null}
              {showStudentPortalTabs ? (
                <>
                  <button className={`portal-tab${portalScreen === "dashboard" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("dashboard")}>Home</button>
                  <button className={`portal-tab${portalScreen === "live" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("live")}>Live</button>
                </>
              ) : null}
            </div>
          </div>

          <div className={`portal-layout${isStudentLoginView ? " student-login-layout" : ""}${isStudentWorkspaceView ? " student-workspace-layout" : ""}${showStudentSupportContent ? "" : " portal-layout--single"}`}>
            <div className={`portal-phone${isStudentLoginView ? " student-login-phone" : ""}${isStudentWorkspaceView ? " student-workspace-phone" : ""}`}>
              <div className="phone-browser">{isAccountsPortal ? "crablearn.app/accounts" : "crablearn.app"}</div>

              {portalScreen === "login" ? (
                <section className="mobile-screen">
                  <div className="portal-brand-row">
                    <div className="portal-logo">CL</div>
                    <div>
                      <div className="portal-title">crablearn</div>
                      <div className="portal-subtitle">{portalLoginLabel}</div>
                    </div>
                  </div>
                  {!isAccountsPortal ? (
                    <div className="login-card login-summary-card" data-testid="auth-login-card">
                      <div className="badge success">{`Secure ${activeSignInProfile.badgeText} access`}</div>
                      <h3 data-testid="auth-login-title">{activeSignInProfile.welcomeTitle}</h3>
                      <p>{loginMessage}</p>
                    </div>
                  ) : (
                    <div className="login-card login-summary-card" data-testid="auth-login-card">
                      <h3 data-testid="auth-login-title">{activeSignInProfile.welcomeTitle}</h3>
                      <p>{loginMessage}</p>
                    </div>
                  )}
                  {isStudentLoginView ? (
                    <div className="student-login-strip" aria-label="Student portal highlights">
                      <span>Live schedule access</span>
                      <span>Fee reminders</span>
                      <span>Parent visibility</span>
                    </div>
                  ) : null}
                  <div className="login-form-panel" data-testid="auth-login-form-panel">
                    {authMode === "login" ? (
                      <form className="mobile-form" onSubmit={handleLoginSubmit}>
                        <label htmlFor="phone">{activeSignInProfile.identifierLabel}</label>
                        <input
                          id="phone"
                          name="phone"
                          type="text"
                          value={loginIdentifier}
                          onChange={(event) => setLoginIdentifier(event.target.value)}
                          placeholder={activeSignInProfile.identifierPlaceholder}
                          required
                        />
                        <label htmlFor="password">Password</label>
                        <input id="password" name="password" type="password" placeholder={activeSignInProfile.passwordPlaceholder} required />
                        <label htmlFor="authExtraInfo">{activeSignInProfile.extraLabel}</label>
                        <input id="authExtraInfo" name="authExtraInfo" type="text" placeholder={activeSignInProfile.extraPlaceholder} />
                        <button className="button portal-button blue" type="submit">Continue</button>
                        {!isAccountsPortal ? <button className="button ghost" type="button" onClick={() => setAuthMode("register")}>Create new account</button> : null}
                      </form>
                    ) : (
                      <form className="mobile-form" onSubmit={handleRegisterSubmit}>
                        <label htmlFor="fullName">Full Name</label>
                        <input id="fullName" name="fullName" type="text" placeholder="Enter your full name" required />
                        <label htmlFor="registerPhone">Phone Number</label>
                        <input id="registerPhone" name="phone" type="tel" placeholder="Enter your phone number" required />
                        <label htmlFor="registerPassword">Password</label>
                        <input id="registerPassword" name="password" type="password" placeholder="Create a password" required />
                        <label htmlFor="registerExtraInfo">{activeSignInProfile.extraLabel}</label>
                        <input id="registerExtraInfo" name="registerExtraInfo" type="text" placeholder={activeSignInProfile.extraPlaceholder} />
                        <button className="button portal-button blue" type="submit">Register</button>
                        <button className="button ghost" type="button" onClick={() => setAuthMode("login")}>Back</button>
                      </form>
                    )}
                  </div>
                </section>
              ) : null}

              {showAccountsDashboard ? (
                <section className="mobile-screen">
                  <div className="portal-topbar student-workspace-topbar">
                    <span>Menu</span>
                    <div>
                      <strong>{`Hi, ${learnerName.toUpperCase()}`}</strong>
                      <small>{currentUser?.role === "accounts" ? "Accounts portal" : `${roleLabel} portal`}</small>
                    </div>
                  </div>
                  <div className="student-workspace-hero">
                    <div>
                      <p className="section-kicker">Accounts workspace</p>
                      <h3>Welcome, {learnerName}. You are signed in as <strong>{currentUser?.role || "accounts"}</strong>.</h3>
                    </div>
                    <div className="student-workspace-mini-stats">
                      <div>
                        <strong>2025–26</strong>
                        <span>financial data</span>
                      </div>
                      <div>
                        <strong>PG</strong>
                        <span>postgres sync</span>
                      </div>
                    </div>
                  </div>
                  <article className="mobile-card class-card">
                    <div className="card-header-line">
                      <span className="badge success">Protected Access</span>
                    </div>
                    <h3>Accounts access active for {learnerName}.</h3>
                    <p>Use the Records, Analytics, Reports, and Enroll tabs below to manage student and teacher accounts.</p>
                  </article>
                </section>
              ) : null}

              {portalScreen === "dashboard" ? (
                <section className="mobile-screen student-dashboard-screen">
                  <div className="portal-topbar student-workspace-topbar">
                    <span>Menu</span>
                    <div>
                      <strong>{`Hi, ${learnerName.toUpperCase()}`}</strong>
                      <small>{isAdmin ? "Admin portal" : "Student portal"}</small>
                    </div>
                  </div>
                  <div className="student-workspace-hero">
                    <div>
                      <p className="section-kicker">Today in your portal</p>
                      <h3>Classes, fee status, and updates in one clear workspace.</h3>
                    </div>
                    <div className="student-workspace-mini-stats">
                      <div>
                        <strong>02</strong>
                        <span>classes ready</span>
                      </div>
                      <div>
                        <strong>10 Jul</strong>
                        <span>fee due date</span>
                      </div>
                    </div>
                  </div>
                  <article className="mobile-card class-card">
                    <div className="card-header-line">
                      <span className="badge success">Live Class</span>
                    </div>
                    <h3>All online classes are conducted via Zoom or Webex.</h3>
                    <p>Click below to join when your teacher starts the class.</p>
                    <button className="button portal-button green" type="button" onClick={() => setPortalScreen("live")}>Join Class</button>
                  </article>
                  <article className="mobile-card fee-card">
                    <div className="card-header-line">
                      <span className="badge gold">Tuition Fee</span>
                    </div>
                    <div className="fee-grid">
                      <div>
                        <span>MONTHLY FEE</span>
                        <strong>Rs 2,000</strong>
                      </div>
                      <div>
                        <span>VALID TILL</span>
                        <strong>10 Jul 2026</strong>
                      </div>
                    </div>
                    <button className="button portal-button red" type="button">Pay Fee Now</button>
                  </article>
                  <div className="bottom-nav">
                    <button className="bottom-link active" type="button">Home</button>
                    <button className="bottom-link" type="button">Fee</button>
                    <button className="bottom-link" type="button" onClick={() => setPortalScreen("live")}>Live</button>
                  </div>
                </section>
              ) : null}

              {portalScreen === "live" ? (
                <section className="mobile-screen student-live-screen">
                  <div className="portal-topbar centered student-workspace-topbar">
                    <span>Menu</span>
                    <div>
                      <strong>Live Classes</strong>
                      <small>{`Hi, ${learnerName.toUpperCase()}`}</small>
                    </div>
                  </div>
                  <div className="live-stack">
                    {liveClasses.map((item) => (
                      <article className="mobile-card live-card" key={item.title}>
                        <h3>{item.title}</h3>
                        <p className="live-type">{item.type}</p>
                        <p>{item.platform}</p>
                        <p>{item.updated}</p>
                        <button className="button portal-button green" type="button">Open Class</button>
                      </article>
                    ))}
                  </div>
                  <div className="bottom-nav">
                    <button className="bottom-link" type="button" onClick={() => setPortalScreen("dashboard")}>Home</button>
                    <button className="bottom-link" type="button">Fee</button>
                    <button className="bottom-link active" type="button">Live</button>
                  </div>
                </section>
              ) : null}

              {portalScreen === "admin-dashboard" ? (
                <section className="mobile-screen">
                  <div className="portal-topbar">
                    <span>Menu</span>
                    <div>
                      <strong>{`Hi, ${learnerName.toUpperCase()}`}</strong>
                      <small>{currentUser?.role === "supervisor" ? "Supervisor portal" : "Admin portal"}</small>
                    </div>
                  </div>

                  <article className="mobile-card admin-card">
                    <div className="card-header-line">
                      <span className="badge badge-admin">Admin Panel</span>
                    </div>
                    <h3>Administrator Dashboard</h3>
                    <p>Welcome to the admin control center</p>
                  </article>

                  <article className="mobile-card admin-card">
                    <h4 className="admin-heading">Admin Features</h4>
                    <ul className="admin-feature-list">
                      {adminFeatures.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </article>

                  <article className="mobile-card admin-card">
                    <h4 className="admin-heading">Quick Stats</h4>
                    <div className="admin-stat-grid">
                      {adminQuickStats.map((stat) => (
                        <div className="admin-stat-tile" key={stat.label}>
                          <div className="admin-stat-value">{stat.value}</div>
                          <div className="admin-stat-label">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="mobile-card admin-card">
                    <h4 className="admin-heading">Admin Verification</h4>
                    <p>{adminActionMessage}</p>
                    <p>{`Admin approval contact: ${approvalContacts.admin.phone} / ${approvalContacts.admin.email}`}</p>
                    <p>{`Supervisor approval contact: ${approvalContacts.supervisor.phone} / ${approvalContacts.supervisor.email}`}</p>
                    <label htmlFor="adminPassword">Admin / Supervisor Password</label>
                    <input
                      id="adminPassword"
                      name="adminPassword"
                      type="password"
                      placeholder="Enter your current password"
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                    />
                    <button className="button portal-button blue" type="button" onClick={handleAdminListUsers} disabled={adminUsersLoading}>
                      {adminUsersLoading ? "Loading users..." : "Load / Refresh Users"}
                    </button>
                  </article>

                  <article className="mobile-card admin-card">
                    <h4 className="admin-heading">User Directory</h4>
                    {adminUsers.length === 0 ? (
                      <p>No users loaded yet. Use Load / Refresh Users after entering admin password.</p>
                    ) : (
                      <div>
                        {adminUsers.map((user) => (
                          <div key={`${user.id}-${user.phone}`} className="admin-user-row">
                            <strong>{user.full_name}</strong>
                            <p>{`Phone: ${user.phone}`}</p>
                            <p>{`Email: ${user.email || "-"}`}</p>
                            <p>{`Role: ${user.role} | Status: ${user.status}`}</p>
                            <div className="admin-row-actions">
                              <button
                                className="button portal-button green"
                                type="button"
                                onClick={() => handleRowApproveUser(user.phone)}
                                disabled={user.status === "approved"}
                                aria-disabled={user.status === "approved"}
                              >
                                {user.status === "approved" ? "Approved" : "Approve"}
                              </button>
                              <button
                                className="button portal-button red"
                                type="button"
                                onClick={() => handleRowDenyUser(user.phone)}
                                disabled={user.status === "denied"}
                                aria-disabled={user.status === "denied"}
                              >
                                {user.status === "denied" ? "Denied" : "Deny"}
                              </button>
                              <input
                                type="text"
                                placeholder="New password"
                                value={rowResetPasswords[user.phone] || ""}
                                onChange={(event) => setRowResetPasswords((prev) => ({
                                  ...prev,
                                  [user.phone]: event.target.value
                                }))}
                              />
                              <button className="button portal-button red" type="button" onClick={() => handleRowResetPassword(user.phone)}>
                                Reset Password
                              </button>
                            </div>
                            {rowActionStatus[user.phone] ? (
                              <p className={`row-action-message ${rowActionStatus[user.phone].type}`}>
                                {rowActionStatus[user.phone].message}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </article>

                  <article className="mobile-card admin-card">
                    <h4 className="admin-heading">Create New User</h4>
                    <form className="mobile-form" onSubmit={handleAdminCreateUser}>
                      <label htmlFor="adminCreateName">Full Name</label>
                      <input id="adminCreateName" name="fullName" type="text" placeholder="Enter full name" required />
                      <label htmlFor="adminCreatePhone">Phone</label>
                      <input id="adminCreatePhone" name="phone" type="tel" placeholder="Enter phone number" required />
                      <label htmlFor="adminCreatePassword">Password</label>
                      <input id="adminCreatePassword" name="password" type="text" placeholder="Set temporary password" required />
                      <label htmlFor="adminCreateRole">Role</label>
                      <select id="adminCreateRole" name="role" defaultValue="student">
                        <option value="student">student</option>
                        <option value="admin">admin</option>
                        <option value="supervisor">supervisor</option>
                      </select>
                      <button className="button portal-button blue" type="submit">Create User</button>
                    </form>
                  </article>

                  <article className="mobile-card admin-card">
                    <h4 className="admin-heading">Approve User</h4>
                    <form className="mobile-form" onSubmit={handleAdminApproveUser}>
                      <label htmlFor="adminUnlockPhone">Phone</label>
                      <input id="adminUnlockPhone" name="phone" type="tel" placeholder="Enter phone to approve" required />
                      <button className="button portal-button green" type="submit">Approve</button>
                    </form>
                  </article>

                  <article className="mobile-card admin-card">
                    <h4 className="admin-heading">Reset User Password</h4>
                    <form className="mobile-form" onSubmit={handleAdminResetPassword}>
                      <label htmlFor="adminResetPhone">Phone</label>
                      <input id="adminResetPhone" name="phone" type="tel" placeholder="Enter phone" required />
                      <label htmlFor="adminResetPassword">New Password</label>
                      <input id="adminResetPassword" name="newPassword" type="text" placeholder="Enter new password" required />
                      <button className="button portal-button red" type="submit">Reset Password</button>
                    </form>
                  </article>

                  <div className="bottom-nav">
                    <button className="bottom-link active" type="button">Dashboard</button>
                    <button className="bottom-link" type="button">Reports</button>
                  </div>
                </section>
              ) : null}
            </div>

            {showStudentSupportContent ? (
            <div className={`portal-copy${isStudentLoginView ? " student-login-copy" : ""}${isStudentWorkspaceView ? " student-workspace-copy" : ""}`}>
              {activePortalRole === "student" ? (
                <>
                  <div className="copy-card">
                    <p className="section-kicker">Student portal access</p>
                    {isStudentLoginView ? (
                      <>
                        <h3 className="student-copy-title">A cleaner student workspace for classes, fees, and updates.</h3>
                        <p className="student-copy-text">Sign in once to reach your live lessons, fee status, upcoming sessions, and parent-friendly visibility from the same page.</p>
                        <div className="student-copy-stat-grid">
                          <div className="student-copy-stat">
                            <strong>1 tap</strong>
                            <span>to open class links</span>
                          </div>
                          <div className="student-copy-stat">
                            <strong>24/7</strong>
                            <span>dashboard access</span>
                          </div>
                          <div className="student-copy-stat">
                            <strong>1 place</strong>
                            <span>for student and parent updates</span>
                          </div>
                        </div>
                      </>
                    ) : isStudentWorkspaceView ? (
                      <>
                        <h3 className="student-copy-title">Your student dashboard is now easier to scan on desktop.</h3>
                        <p className="student-copy-text">The larger workspace keeps your next class, fee reminder, and live access visible without squeezing everything into a tiny phone-sized area.</p>
                        <div className="student-copy-stat-grid">
                          <div className="student-copy-stat">
                            <strong>Live now</strong>
                            <span>Open scheduled sessions faster</span>
                          </div>
                          <div className="student-copy-stat">
                            <strong>Fee ready</strong>
                            <span>See dues and validity at a glance</span>
                          </div>
                          <div className="student-copy-stat">
                            <strong>Clear view</strong>
                            <span>Desktop-friendly dashboard spacing</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <ul className="check-list">
                        <li>Sign in with your registered username or phone number</li>
                        <li>Open live classes from one student dashboard</li>
                        <li>Check fee status and upcoming class updates quickly</li>
                        <li>Use one account for both student and parent visibility</li>
                      </ul>
                    )}
                  </div>
                  <div className="copy-card">
                    <p className="section-kicker">Before class starts</p>
                    {isStudentLoginView ? (
                      <div className="student-prep-list">
                        <div className="student-prep-item">
                          <strong>01</strong>
                          <span>Keep Zoom or Webex ready before lesson time.</span>
                        </div>
                        <div className="student-prep-item">
                          <strong>02</strong>
                          <span>Use the approved phone number or username shared during registration.</span>
                        </div>
                        <div className="student-prep-item">
                          <strong>03</strong>
                          <span>Contact support quickly if your phone number or password changes.</span>
                        </div>
                        <div className="student-prep-item">
                          <strong>04</strong>
                          <span>Request a callback if you need help joining your first class.</span>
                        </div>
                      </div>
                    ) : isStudentWorkspaceView ? (
                      <div className="student-prep-list">
                        <div className="student-prep-item">
                          <strong>01</strong>
                          <span>Use Home to review your next class and fee details.</span>
                        </div>
                        <div className="student-prep-item">
                          <strong>02</strong>
                          <span>Use Live to open Zoom or Webex sessions when class starts.</span>
                        </div>
                        <div className="student-prep-item">
                          <strong>03</strong>
                          <span>Sign out from the workspace header whenever you finish.</span>
                        </div>
                        <div className="student-prep-item">
                          <strong>04</strong>
                          <span>Ask support for help if class links or account details change.</span>
                        </div>
                      </div>
                    ) : (
                      <ul className="check-list">
                        <li>Keep your Zoom or Webex app ready before lesson time</li>
                        <li>Use the approved account details shared during registration</li>
                        <li>Contact support if your password or phone number has changed</li>
                        <li>Ask for a callback if you need help joining your first class</li>
                      </ul>
                    )}
                  </div>
                </>
              ) : isAccountsPortal ? (
                <>
                  <div className="copy-card">
                    <p className="section-kicker">Eligible roles</p>
                    <ul className="check-list">
                      <li>Dedicated accounts users can open monthly financial reports</li>
                      <li>Admin and supervisor users can review the same accounts workspace</li>
                      <li>Student, teacher, and engineer roles cannot view accounts data</li>
                      <li>Workbook imports and report checks stay inside this protected route</li>
                    </ul>
                  </div>
                  <div className="copy-card">
                    <p className="section-kicker">What is inside</p>
                    <ul className="check-list">
                      <li>Month-wise student account rows</li>
                      <li>Teacher payout summaries</li>
                      <li>Fees, tutor payment, and profit totals</li>
                      <li>Excel-to-PostgreSQL import controls</li>
                    </ul>
                  </div>
                </>
              ) : (
                <>
                  <div className="copy-card">
                    <p className="section-kicker">Security features</p>
                    <ul className="check-list">
                      <li>Protected member-only pages</li>
                      <li>Secure login system</li>
                      <li>Restricted access for unapproved users</li>
                      <li>Role-based access control</li>
                    </ul>
                  </div>
                  <div className="copy-card">
                    <p className="section-kicker">Admin-ready architecture</p>
                    <ul className="check-list">
                      <li>Manage students and approvals</li>
                      <li>Schedule classes and manage sessions</li>
                      <li>Secure class joining from dashboard</li>
                      <li>Fee reminders and basic reporting</li>
                    </ul>
                  </div>
                </>
              )}
            </div>
            ) : null}
          </div>
        </section>
        ) : null}

        {showAccountsDashboard ? <AccountsPage apiBaseUrl={apiBaseUrl} currentUser={currentUser} /> : null}

        {showContactSection ? (
        <section className="section contact-section" id="contact">
          <div>
            <p className="section-kicker">Additional features</p>
            <h2>Contact flow, WhatsApp-ready lead capture, and advisor callbacks.</h2>
            <p className="section-text">Built to match the reference requirements with a simple front-end simulation for callback capture, student login, and portal switching.</p>
            <p className="callback-message">{callbackMessage}</p>
          </div>

          <form className="callback-form" onSubmit={handleCallbackSubmit}>
            <label htmlFor="parentName">Parent name</label>
            <input id="parentName" name="parentName" type="text" placeholder="Priya Sharma" required />
            <label htmlFor="parentPhone">Phone number</label>
            <input id="parentPhone" name="parentPhone" type="tel" placeholder="Enter phone number" required />
            <label htmlFor="program">Program</label>
            <select id="program" name="program" defaultValue="Summer Program 2026">
              <option>Summer Program 2026</option>
              <option>Elementary</option>
              <option>High School / Middle School</option>
              <option>Test Prep</option>
            </select>
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="4" placeholder="Tell us about your child, grade level, and goals." />
            <button className="button solid" type="submit">Request Callback</button>
          </form>
        </section>
        ) : null}
      </main>

      {previewOpen ? (
        <div className="video-modal" role="dialog" aria-modal="true" aria-label="Class preview video" onClick={() => setPreviewOpen(false)}>
          <div className="video-modal-card" onClick={(event) => event.stopPropagation()}>
            <button className="video-modal-close" type="button" onClick={() => setPreviewOpen(false)} aria-label="Close preview">
              Close
            </button>
            <iframe
              className="video-embed"
              src={previewVideoUrl}
              title="Class preview"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;