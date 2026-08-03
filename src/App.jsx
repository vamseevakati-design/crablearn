import { useMemo, useState, useEffect } from "react";

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

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const previewVideoUrl = import.meta.env.VITE_PREVIEW_VIDEO_URL || "https://www.youtube-nocookie.com/embed/ysz5S6PUM-U";
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [portalScreen, setPortalScreen] = useState("home");
  const [loginMessage, setLoginMessage] = useState("Use the registered mother phone number and your password to continue.");
  const [callbackMessage, setCallbackMessage] = useState("Request a callback and we will match the learner with the right advisor.");
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const learnerName = currentUser?.name || "TANISHA";
  const isAdmin = currentUser?.role === "admin";

  function handleLogout() {
    setCurrentUser(null);
    setPortalScreen("home");
    setLoginMessage("Use the registered mother phone number and your password to continue.");
    setAuthMessage("Signed out successfully.");
  }

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

  const activeSubjects = useMemo(
    () => subjectGroups.find((group) => group.name === activeCategory)?.subjects ?? [],
    [activeCategory]
  );

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const phone = String(formData.get("phone") || "");
    const password = String(formData.get("password") || "");

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phone, password })
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        setLoginMessage(payload.message || "Login failed. Please verify your credentials.");
        return;
      }

      setLoginMessage(payload.message || "Login successful.");
      setAuthMessage("");
      setCurrentUser(payload.student);
      setPortalScreen(payload.student?.role === "admin" ? "admin-dashboard" : "dashboard");
    } catch (error) {
      setLoginMessage("Login service is unavailable. Please check the API server and try again.");
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

  return (
    <div className="site-shell">
      <div className="atmosphere" aria-hidden="true">
        <span className="orb orb-one" />
        <span className="orb orb-two" />
        <span className="orb orb-three" />
      </div>

      <header className="site-header" id="top">
        <div className="top-nav">
          <button className="brand-block" type="button" onClick={() => setPortalScreen("home")}>
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
            <a className="nav-link" href="#workflow">How it Works</a>
            <a className="nav-link" href="#about">About Us</a>
            <a className="nav-link" href="#contact">Contact Us</a>
          </nav>

          <div className="nav-actions">
            <a className="phone-link" href="tel:8004994769">800 499 4769</a>
            {currentUser ? <div className="session-pill">{isAdmin ? "Admin" : "Student"} signed in</div> : null}
            <button className="button ghost" type="button" onClick={() => setPortalScreen("login")}>Sign in</button>
            <button className="button ghost" type="button" onClick={handleLogout} disabled={!currentUser} aria-disabled={!currentUser}>Sign out</button>
            <a className="button solid" href="#contact">Request a callback</a>
          </div>
        </div>

        {authMessage ? (
          <div className="auth-feedback" role="status" aria-live="polite">{authMessage}</div>
        ) : null}

        <div className="season-banner">
          <div className="season-art">SUN</div>
          <div className="season-copy">
            <h2>Beat the Summer Slide</h2>
            <p>Join our Summer Program 2026 and help your child stay ahead, strengthen skills and gain confidence for the upcoming school year.</p>
          </div>
          <button className="button solid banner-button" type="button" onClick={() => setPortalScreen("home")}>Summer Academy 2026</button>
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
              <button className="button ghost-light" type="button" onClick={() => setPortalScreen("login")}>Student login</button>
              <button className="button ghost-light" type="button" onClick={handleLogout} disabled={!currentUser} aria-disabled={!currentUser}>Sign out</button>
            </div>
          </div>

          <div className="hero-video-card">
            <div className="video-frame">
              <button className="video-play" type="button" onClick={() => setPreviewOpen(true)} aria-label="Open class preview video">
                Play
              </button>
            </div>
            <div className="video-caption">Preview the live class experience, parent reporting, and secure dashboard workflow.</div>
          </div>
        </section>

        <section className="trust-ticker" aria-label="Trust badges">
          <div className="ticker-track">
            {[...trustBadges, ...trustBadges].map((item, index) => (
              <span className="ticker-item" key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </section>
      </header>

      <main>
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

        <section className="section portal-section" id="about">
          <div className="section-heading-row">
            <div>
              <p className="section-kicker">Student portal preview</p>
              <h2>Three core screens based on the reference flows.</h2>
            </div>
            <div className="portal-tabs">
              <button className={`portal-tab${portalScreen === "login" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("login")}>Login</button>
              <button className={`portal-tab${portalScreen === "dashboard" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("dashboard")}>Home</button>
              <button className={`portal-tab${portalScreen === "live" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("live")}>Live</button>
              {currentUser ? (
                <button className="portal-tab" type="button" onClick={handleLogout}>Sign out</button>
              ) : null}
            </div>
          </div>

          <div className="portal-layout">
            <div className="portal-phone">
              <div className="phone-browser">crablearn.app</div>

              {portalScreen === "login" ? (
                <section className="mobile-screen">
                  <div className="portal-brand-row">
                    <div className="portal-logo">CL</div>
                    <div>
                      <div className="portal-title">crablearn</div>
                      <div className="portal-subtitle">Student portal login</div>
                    </div>
                  </div>
                  <div className="login-card">
                    <div className="badge success">Secure student / admin sign in</div>
                    <h3>Welcome back</h3>
                    <p>{loginMessage}</p>
                    <form className="mobile-form" onSubmit={handleLoginSubmit}>
                      <label htmlFor="phone">Phone Number</label>
                      <input id="phone" name="phone" type="tel" placeholder="Enter registered phone number" required />
                      <label htmlFor="password">Password</label>
                      <input id="password" name="password" type="password" placeholder="Enter your password" required />
                      <button className="button portal-button blue" type="submit">Sign in</button>
                    </form>
                  </div>
                </section>
              ) : null}

              {portalScreen === "dashboard" ? (
                <section className="mobile-screen">
                  <div className="portal-topbar">
                    <span>Menu</span>
                    <div>
                      <strong>{`Hi, ${learnerName.toUpperCase()}`}</strong>
                      <small>{isAdmin ? "Admin portal" : "Student portal"}</small>
                    </div>
                    <button className="button ghost" type="button" onClick={handleLogout}>Sign out</button>
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
                <section className="mobile-screen">
                  <div className="portal-topbar centered">
                    <span>Menu</span>
                    <div>
                      <strong>Live Classes</strong>
                      <small>{`Hi, ${learnerName.toUpperCase()}`}</small>
                    </div>
                    <button className="button ghost" type="button" onClick={handleLogout}>Sign out</button>
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
                      <strong>Hi, ADMIN</strong>
                      <small>Admin portal</small>
                    </div>
                    <button className="button ghost" type="button" onClick={handleLogout}>
                      Sign out
                    </button>
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

                  <div className="bottom-nav">
                    <button className="bottom-link active" type="button">Dashboard</button>
                    <button className="bottom-link" type="button">Reports</button>
                    <button className="bottom-link" type="button" onClick={handleLogout}>Sign out</button>
                  </div>
                </section>
              ) : null}
            </div>

            <div className="portal-copy">
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
            </div>
          </div>
        </section>

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
            <input id="parentPhone" name="parentPhone" type="tel" placeholder="800 499 4769" required />
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