import { useMemo, useState, useEffect, useRef } from "react";
import AccountsPage from "./AccountsPage";
import ErrorBoundary from "./ErrorBoundary";
import JunnuRoom from "./JunnuRoom";
import NotificationInbox from "./NotificationInbox";

const subjectGroups = [
  {
    name: "School Boards",
    subjects: ["CBSE Class 10th", "CBSE Class 12th", "State Board", "LKG to 5th"]
  },
  {
    name: "Competitive Exams",
    subjects: ["IIT JEE", "IIT JEE Notes", "NEET", "NEET Notes", "Olympiad", "Test Series"]
  },
  {
    name: "School Preparation",
    subjects: ["Class 6th", "Class 7th", "Class 8th", "Class 9th", "Class 11th"]
  },
  {
    name: "Government Exams",
    subjects: ["UPSC", "Railway Exams", "SSC Exams", "Banking (IBPS/PO)", "Other Govt Exams"]
  },
  {
    name: "Special Programs",
    subjects: ["Live One to One", "Home Tuition", "Practice Quiz"]
  },
  {
    name: "Academics",
    subjects: ["Computer Science", "CS Study Notes"]
  }
];

const featureList = [
  "Personalized one-on-one academic tutoring",
  "Home tuition or live online classes",
  "Expert and verified educators",
  "CBSE, ICSE, and State Boards"
];

const workItems = [
  "Personalized learning with real-time feedback",
  "Fewer distractions than a crowded classroom",
  "Faster academic growth and confidence",
  "Flexible scheduling and 1-to-1 doubt clearing",
  "Learning plan crafted for each student",
  "Qualified educators at home in one click"
];

const proofStats = [
  { value: "1-on-1", label: "live learning" },
  { value: "LKG–12", label: "home tuition" },
  { value: "JEE / NEET", label: "exam tracks" }
];

const trustBadges = [
  "Verified educators",
  "Home tuition or live online",
  "Money-back after first tutorial",
  "CBSE, ICSE, State Boards"
];

const focusCards = [
  { icon: "🎯", title: "Personalised Focus", text: "Every class is tailored to your learning speed & needs.", cta: "1-on-1 Classes →" },
  { icon: "🧠", title: "Concept Clarity", text: "Understand topics deeply with 1-on-1 expert guidance.", cta: "Clear My Doubts →" },
  { icon: "⚡", title: "Fast Progress", text: "Track improvement and get instant feedback.", cta: "Prep for Exams →" },
  { icon: "📚", title: "Exam Ready", text: "Stay ahead with board-specific and competitive prep.", cta: "Boost My Skills →" }
];

const programCards = [
  { title: "Classes LKG - 3", text: "Specially crafted early learning program for young minds", cta: "Book a Free Demo", href: "#contact" },
  { title: "Classes 4 - 12", text: "Book educator for any Board class", cta: "Explore More", href: "#contact" },
  { title: "IIT-JEE", text: "You can select and book your personal educator for JEE Exam", cta: "Explore JEE", href: "#contact" },
  { title: "NEET", text: "You can select and book your personal educator for NEET Exam", cta: "Explore NEET", href: "#contact" },
  { title: "Govt Job Exams", text: "You can select and book your personal educator for SSC, RRB, Banking, and other Govt Job Exams", cta: "Explore More Exams", href: "#contact" },
  { title: "UPSC", text: "Book your personal educator to succeed in your dream IAS and other UPSC exams", cta: "Explore UPSC", href: "#contact" },
  { title: "Defence Exams", text: "Book your personal educator for NDA, CDS, and other Defence Exams.", cta: "Explore More Exams", href: "#contact" },
  { title: "Sainik School", text: "Book your personal educator for Sainik School Entrance Exams.", cta: "Book Now", href: "#contact" }
];

const excellenceCards = [
  { title: "Our Educational Excellence in Personalized Learning", text: "Discover our commitment to top-notch solutions for learners and educators." },
  { title: "Building Bridges Through Personalized Learning", text: "Empowering students from all backgrounds with one-on-one guidance, Crab Learn connects knowledge, confidence, and academic growth, right from the comfort of your home." },
  { title: "Innovating Home Tuition for Tomorrow", text: "From Class 1 to 12, our expert tutors use modern teaching tools, custom learning plans, and real-time feedback to make learning personal, effective, and future-ready." },
  { title: "Navigating the Future of Education", text: "We are leading the way in shaping personalized education." }
];

const easySteps = [
  { title: "Find your perfect Educator match", text: "Search profiles of educators across all subjects. Everything from grades, prices, reviews, and more—checked and verified for your peace of mind." },
  { title: "Meet your perfect educator", text: "Shortlist your perfect match, then connect via the Crab Learn site. Booking is simple, secure, and convenient—online or in person!" },
  { title: "Know you’re safeguarded", text: "You’re backed by Crab Learn’s money-back guarantee and platform protections. We focus on your safety, so you can focus on learning!" }
];

const advantages = [
  { title: "Conceptual clarity through visualisation", text: "Visual explanations and 1-on-1 doubt clearing until the topic sticks." },
  { title: "Verified and High-Quality Teachers", text: "Screened educators for school boards and competitive tracks." },
  { title: "Wide Range of Subjects and Levels", text: "LKG to Class 12, JEE, NEET, Olympiad, and selected government exams." }
];

const benefits = [
  { title: "Easy to Use", text: "Easy-to-use platform with a simple and intuitive interface." },
  { title: "Intuitive to Operate", text: "Simple and intuitive interface for parents, students, and teachers." },
  { title: "Flexible to Administer", text: "Flexible admin tools for approvals, live links, and fee tracking." },
  { title: "Friendly to Manage", text: "User-friendly management system with weekly reports." },
  { title: "Powerful to Scale", text: "Scalable platform for growth — from one child to a full class roster." },
  { title: "Affordable to Own", text: "Affordable pricing for 1-on-1 plans without unused batch fees." }
];

const howSteps = [
  { n: "01", title: "Expert Tutor Selection", text: "We match you with 2–3 vetted tutors for trial sessions." },
  { n: "02", title: "Personalized Teaching Plan", text: "Includes structured modules, performance tracking dashboards, and smart suggestions." },
  { n: "03", title: "Continuous Improvement", text: "Weekly progress reports, parent–tutor feedback reviews, and live chat support." },
  { n: "04", title: "Celebrate Milestones", text: "Report cards, confidence check-ins, and customized awards help maintain high motivation." }
];

const faqs = [
  { q: "How does Crab Learn connect educators and learners for tutoring?", a: "Share the class, board, and home-or-online preference. We shortlist verified educators for a trial, then you book the match that fits." },
  { q: "Can students choose their preferred educators for home tuition?", a: "Yes. After a trial you can continue with that educator or ask us to suggest another." },
  { q: "What types of tuition classes are available on Crab Learn?", a: "Home tuition, live 1-on-1 online classes, board exam prep, JEE, NEET, Olympiad, and selected government-exam tracks." },
  { q: "How can educators join Crab Learn and offer tutoring services?", a: "Use teacher login after approval, or send a callback request as Become educator and our team will follow up." },
  { q: "What should I do if I encounter technical issues or need help finding home tutors?", a: "Use Book an educator on this page or Sign in if you already have an account. We call back with options." },
  { q: "Is Crab Learn safe for children?", a: "Yes. Live class links open only after approved login. Unapproved accounts cannot join sessions." },
  { q: "What boards do you support?", a: "CBSE, ICSE, and state boards from LKG to Class 12, plus foundation and competitive streams." },
  { q: "Can I choose between online and home tuition?", a: "Yes. Pick home tuition or live online 1-on-1 when you request a callback." },
  { q: "How do I track my child’s performance?", a: "The student portal shows class links, fee status, and weekly progress. Parents can share the same account visibility." }
];

const adminFeatures = [
  "Manage students and approvals",
  "Schedule classes",
  "Fee management",
  "View reports and analytics",
  "Manage callback requests",
  "Map students with educators",
  "Schedule 1 to 1 and many to many calls",
  "System settings"
];

const adminQuickStats = [
  { value: "2.5k+", label: "Active students" },
  { value: "180+", label: "Weekly classes" }
];

const taglines = [
  "Your Personalized Home Tuition Hub",
  "The Best Platform For Students",
  "Book an Educator for home tuition",
  "One-on-One Live Learning"
];

const defaultCategory = subjectGroups[0].name;

const syllabusLinks = [
  "CBSE Syllabus (1st to 12th)",
  "CBSE (LKG to 5th)",
  "Class 6th to 9th and 11th",
  "CBSE Board Exams (10th & 12th)",
  "Prepare for your exam with us"
];

const moreLinks = [
  { label: "Featured courses", href: "#featured" },
  { label: "How it works", href: "#workflow" },
  { label: "Benefits", href: "#benefits" },
  { label: "Practice Quiz", href: "#practice-quiz" },
  { label: "Explore Home Tuition", href: "#about" },
  { label: "Live one to one Classes", href: "#courses" },
  { label: "Become Educator", href: "#become-educator" },
  { label: "Book Educator", href: "#book-educator" }
];

const educatorSteps = [
  { n: "1", icon: "+", title: "Step 1: Register", text: "The first step to joining is signing up with your Google account or manually filling out the registration form." },
  { n: "2", icon: "☰", title: "Step 2: Complete Your Profile", text: "Fill in your personal details, teaching qualifications, and previous experience." },
  { n: "3", icon: "▶", title: "Step 3: Submit a Demo Video", text: "Upload a short video showcasing your teaching skills and subject expertise." },
  { n: "4", icon: "✓", title: "Step 4: Verification", text: "Our team will review your profile, experience, and demo video for approval." },
  { n: "5", icon: "▣", title: "Step 5: Access Your Dashboard", text: "Once approved, you will get access to your dashboard to start your teaching journey with us as an educator on Crab Learn." },
  { n: "6", icon: "★", title: "Step 6: Start Earning", text: "Once approved, start teaching and earning on Crab Learn." }
];

const educatorWhyCards = [
  { icon: "◷", title: "Flexible Opportunities", text: "Work on your own schedule. Teach full-time or part-time while making a meaningful impact." },
  { icon: "↑", title: "Seamless Content Upload", text: "Use our user-friendly dashboard to upload quality educational content for students worldwide." },
  { icon: "👍", title: "Earnings Based on Quality", text: "High-quality content approval processes will reward your passion and recognition." },
  { icon: "💡", title: "Innovative Teaching Tools", text: "Access advanced features to enhance your teaching methods and engage students more effectively." },
  { icon: "👥", title: "Collaborative Community", text: "Join a vibrant community of educators, sharing ideas, best practices, and tools for success." },
  { icon: "✦", title: "Recognition & Growth", text: "Achieve recognition for your efforts and grow your reputation as an expert educator." }
];

const educatorJobBenefits = [
  "Verified Leads for Home Tutor Jobs",
  "Flexible Part-Time / Full-Time Tutor Jobs",
  "Find Jobs Based on Your Location",
  "Recruitment Assistance",
  "No Registration / Hidden Charges",
  "Get Competitive Pay"
];

const educatorAuthPoints = [
  "Sign up with your email or Google account.",
  "Complete your profile with necessary details.",
  "Verify your email and start tutoring!"
];

const studentJoinPoints = [
  "Sign up with your email and login anytime as student.",
  "Prepare your learning profile with preferred list of topics.",
  "Select and connect with your chosen world class expert.",
  "Unlock your full potential with world-class one-to-one learning session."
];

const studentTutorCards = [
  { icon: "◎", title: "Smart one-one learning", text: "Custom content, focused sessions, and flexible scheduling with your educator." },
  { icon: "⚖", title: "Affordability", text: "Affordable 1-on-1 tutoring sessions without unused batch fees." },
  { icon: "▣", title: "Management system", text: "Track sessions, progress, and class links from one student dashboard." },
  { icon: "🎓", title: "Experienced Tutors", text: "Verified educators for Maths, Science, Coding, boards, and competitive prep." }
];

const studentAdvantages = [
  { icon: "⚖", title: "Affordability" },
  { icon: "🎓", title: "Experienced Tutors" },
  { icon: "▣", title: "Management system" },
  { icon: "✎", title: "Personalized Learning" },
  { icon: "◷", title: "Flexibility of Time" },
  { icon: "⌂", title: "Convenience and Comfort" },
  { icon: "◉", title: "Identity, Privacy & Systems" },
  { icon: "⇄", title: "Two way communication" },
  { icon: "♥", title: "Student-Centric Focus" }
];

const heroPages = [
  {
    theme: "quiz",
    title: "Ready to Test Your Brain?",
    kicker: "Master Every CBSE Subject with Fun Quizzes!",
    linkLabel: "Start Your Quiz Now",
    ctaLabel: "Start Quiz",
    chips: ["CBSE", "Quiz", "Fun", "Boards"]
  },
  {
    theme: "educator",
    title: "Become an Educator",
    kicker: "Share knowledge with students at home or live 1-on-1.",
    linkLabel: "Join Crab Learn",
    ctaLabel: "Become Educator",
    chips: ["Teach", "Home", "Online", "Earn"]
  },
  {
    theme: "book",
    title: "Educators on Call",
    kicker: "Are you looking for an educator? Find educators on demand.",
    linkLabel: "Book Your Educator Now",
    ctaLabel: "Book Educator",
    chips: ["1:1", "CBSE", "ICSE", "Boards"]
  }
];

const featuredCourseCards = [
  { title: "Learn Anywhere", text: "Study on the go with our mobile-friendly platform." },
  { title: "Master Your Concepts", text: "Interactive lessons that boost clarity and retention." },
  { title: "Track Your Progress", text: "Weekly reports and parent-visible improvement." }
];

const quizPoints = [
  "Offers a wide range of courses, quizzes, and interactive content for learners of all levels",
  "Focuses on enhancing academic knowledge, professional skills, and personal growth.",
  "Connects you with like-minded individuals and experts, fostering collaboration and knowledge sharing."
];

const trendCards = [
  { title: "Cutting-Edge Personalization", text: "Adaptive systems adjust pace according to each student’s grasp—part of global AI/ML tutoring trends." },
  { title: "Time & Cost-Efficient", text: "No travel time, flexible slots, and bite-size modules make learning efficient and cost-effective." },
  { title: "Trends-Driven Approach", text: "Leading the wave in micro-learning, AI-integrated tutoring, and gamified lessons." },
  { title: "One-on-One, Real Results", text: "Comfortable, distraction-free home environment improves learning focus. Custom attention, academic confidence, and faster concept mastery." }
];

const featuredIn = ["Skill India", "NAPS", "iStart", "Patrika", "Times of India"];

const class12Subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "Business Studies", "Accountancy", "Political Science", "Economics"];
const class11Subjects = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "Business Studies", "Accountancy", "Political Science", "Economics"];
const class10Subjects = ["Mathematics", "Science", "Social Science", "English", "Hindi"];
const cbseClasses = ["CBSE Class - 1", "CBSE Class - 2", "CBSE Class - 3", "CBSE Class - 4", "CBSE Class - 5", "CBSE Class - 6", "CBSE Class - 7", "CBSE Class - 8", "CBSE Class - 9", "CBSE Class - 10", "CBSE Class - 11", "CBSE Class - 12"];
const coursePacks = [
  "Class 12 PCM",
  "Class 12 PCB",
  "Class 12 Commerce",
  "Class 11 PCM",
  "Class 11 PCB Foundation Course",
  "Class 11 Complete Course",
  "Class 10 Complete Course",
  "Class 9 Complete Course",
  "Class 8 Complete Course",
  "Class 7 Complete Course",
  "Class 6 Complete Course"
];
const stateBoards = [
  "Andhra Pradesh Board (BSEAP)",
  "Arunachal Pradesh Board (DSEAP)",
  "Assam Board (SEBA)",
  "Bihar Board (BSEB)",
  "Chhattisgarh Board (CGBSE)",
  "Goa Board (GBSHSE)",
  "Gujarat Board (GSEB)",
  "Haryana Board (BSEH)",
  "Himachal Pradesh (HPBOSE)",
  "Jharkhand Board (JAC)",
  "Karnataka Board (KSEAB)",
  "Kerala Board (KBPE)",
  "Madhya Pradesh Board (MPBSE)",
  "Maharashtra State Board (MSBSHSE)",
  "Manipur Board (BSEM)",
  "Meghalaya Board (MBOSE)",
  "Mizoram Board (MBSE)",
  "Nagaland Board (NBSE)",
  "Punjab Board (PSEB)",
  "Rajasthan Board (RBSE)",
  "Tamil Nadu Board (TNBS)",
  "Telangana Board (BSE Telangana)",
  "Tripura Board (TBSE)",
  "Uttar Pradesh Board (UPMSP)",
  "Uttarakhand Board (UBSE)",
  "West Bengal Board (WBBSE)",
  "Odisha Board (BSE Odisha)"
];
const cbseSamplePapers = [
  "CBSE Sample Papers For Class-8",
  "CBSE Sample Papers For Class-9",
  "CBSE Sample Papers For Class-10",
  "CBSE Sample Papers For Class-11",
  "CBSE Sample Papers For Class-12"
];
const icseSamplePapers = [
  "ICSE Sample Papers For Class-8",
  "ICSE Sample Papers For Class-9",
  "ICSE Sample Papers For Class-10",
  "ICSE Sample Papers For Class-11",
  "ICSE Sample Papers For Class-12"
];
const studyMaterial = [
  "Roman Numerals",
  "CBSE",
  "Math Formulas",
  "CBSE Sample Papers",
  "CBSE Sample Question Papers",
  "CBSE Previous Year Questions",
  "CBSE Previous Year Question Papers",
  "ICSE Sample Papers",
  "ICSE Previous Year Questions",
  "ICSE Previous Year Question Papers"
];
const mathsFormulas = [
  "Maths Formula For Class 6",
  "Maths Formula For Class 7",
  "Maths Formula For Class 8",
  "Maths Formula For Class 9",
  "Maths Formula For Class 10",
  "Maths Formula For Class 11",
  "Maths Formula For Class 12"
];
const previousYearPapers = [
  "ICSE Previous Year Question Papers",
  "ICSE Previous Year Question Papers For Class-10",
  "ISC Previous Year Question Papers For Class-12",
  "CBSE Previous Year Question Papers",
  "CBSE Previous Year Question Papers For Class-10",
  "CBSE Previous Year Question Papers For Class-12"
];

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

const countryCodes = [
  { value: "+91", label: "IN +91" },
  { value: "+1", label: "US +1" },
  { value: "+44", label: "UK +44" },
  { value: "+61", label: "AU +61" },
  { value: "+971", label: "AE +971" }
];

function addCountryCode(identifier, countryCode) {
  const value = String(identifier || "").trim();
  if (!value || value.includes("@") || /[a-z]/i.test(value)) return value;
  const digits = value.replace(/\D/g, "");
  return digits ? `${countryCode || "+91"}${digits}` : value;
}

function CountryPhoneField({ id, label, name, value, defaultValue, onChange, placeholder }) {
  return (
    <>
      <label htmlFor={id}>{label}<span>*</span></label>
      <div className="country-phone-field">
        <select name="countryCode" defaultValue="+91" aria-label="Country code">
          {countryCodes.map((country) => <option key={country.value} value={country.value}>{country.label}</option>)}
        </select>
        <input id={id} name={name} type="text" value={value} defaultValue={value === undefined ? defaultValue : undefined} onChange={onChange} placeholder={placeholder} required />
      </div>
    </>
  );
}

const signInRoutes = {
  student: "/Student portal",
  teacher: "/Teacher portal",
  engineer: "/Engineer portal",
  accounts: "/Accounts"
};

const PORTAL_SESSION_KEY = "crablearn-portal-session";

function readPortalSession() {
  try {
    const stored = window.sessionStorage.getItem(PORTAL_SESSION_KEY);
    const session = stored ? JSON.parse(stored) : null;
    return session?.user && session?.password ? session : null;
  } catch (_error) {
    return null;
  }
}

function isEducatorJoinPath(pathname) {
  const normalizedPath = decodeURIComponent(String(pathname || "")).trim().toLowerCase().replace(/\/+$/, "");
  return normalizedPath.endsWith("become educator") || normalizedPath.endsWith("become-educator");
}

function isStudentJoinPath(pathname) {
  const normalizedPath = decodeURIComponent(String(pathname || "")).trim().toLowerCase().replace(/\/+$/, "");
  return normalizedPath.endsWith("join student") || normalizedPath.endsWith("join-student");
}

function isQuizPath(pathname) {
  const normalizedPath = decodeURIComponent(String(pathname || "")).trim().toLowerCase().replace(/\/+$/, "");
  return normalizedPath.endsWith("practice quiz") || normalizedPath.endsWith("practice-quiz");
}

function isBookEducatorPath(pathname) {
  const normalizedPath = decodeURIComponent(String(pathname || "")).trim().toLowerCase().replace(/\/+$/, "");
  return normalizedPath.endsWith("book educator") || normalizedPath.endsWith("book-educator");
}

function isEducatorAuthPath(pathname) {
  const normalizedPath = decodeURIComponent(String(pathname || "")).trim().toLowerCase().replace(/\/+$/, "");
  return normalizedPath.endsWith("educator login") || normalizedPath.endsWith("educator-login");
}

function getPublicScreenFromPath(pathname) {
  if (isEducatorJoinPath(pathname)) {
    return "become-educator";
  }
  if (isEducatorAuthPath(pathname)) {
    return "educator-login";
  }
  if (isStudentJoinPath(pathname)) {
    return "join-student";
  }
  if (isQuizPath(pathname)) {
    return "practice-quiz";
  }
  if (isBookEducatorPath(pathname)) {
    return "book-educator";
  }
  if (getRoleFromPathname(pathname)) {
    return "login";
  }
  return "home";
}

function getRoleFromPathname(pathname) {
  if (isEducatorJoinPath(pathname) || isEducatorAuthPath(pathname) || isStudentJoinPath(pathname) || isQuizPath(pathname) || isBookEducatorPath(pathname)) {
    return null;
  }
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

function RoleArtEducator() {
  return (
    <svg className="role-art" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="62" r="46" fill="#f5c518" />
      <circle cx="60" cy="42" r="14" fill="#c4a574" />
      <path d="M42 48c4-16 32-16 36 0 1 6-6 10-18 10s-19-4-18-10z" fill="#5b3a2a" />
      <path d="M38 78c4-16 40-16 44 0v18H38z" fill="#7dd3fc" />
      <path d="M36 86h48v22c0 6-8 10-24 10s-24-4-24-10z" fill="#ea580c" />
      <rect x="68" y="70" width="22" height="16" rx="3" fill="#38bdf8" />
    </svg>
  );
}

function RoleArtStudent() {
  return (
    <svg className="role-art" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="62" r="46" fill="#fde68a" />
      <rect x="22" y="86" width="76" height="10" rx="2" fill="#a8a29e" />
      <rect x="28" y="78" width="40" height="10" rx="2" fill="#7c3aed" />
      <circle cx="58" cy="44" r="13" fill="#e8b896" />
      <path d="M44 50c3-12 26-12 30 2-8 6-22 6-30-2z" fill="#1c1917" />
      <path d="M42 70c6-12 32-12 38 2v16H42z" fill="#ef4444" />
      <path d="M40 82h44v14H40z" fill="#ea580c" />
      <rect x="70" y="64" width="22" height="14" rx="2" fill="#111827" />
    </svg>
  );
}

function formatPortalRoleLabel(role) {
  const normalized = String(role || "").trim().toLowerCase();
  if (!normalized) return "User";
  if (normalized === "teacher") return "Educator";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function isPrivilegedAccount(role) {
  return ["admin", "supervisor"].includes(String(role || "").trim().toLowerCase());
}

function canViewAccounts(role) {
  return ["accounts", "admin", "supervisor"].includes(String(role || "").trim().toLowerCase());
}

function formatClassWhen(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value || "");
  }
  return date.toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });
}

function classJoinState(session, now = Date.now(), role = "") {
  const status = String(session?.status || "scheduled").toLowerCase();
  const actor = String(role || "").toLowerCase();
  const canHost = ["teacher", "admin", "supervisor"].includes(actor);
  if (status === "cancelled") {
    return { key: "cancelled", label: "Cancelled", canJoin: false };
  }
  const start = new Date(session?.starts_at).getTime();
  const durationMin = Math.max(15, Number(session?.duration_min) || 45);
  const endAt = Number.isFinite(start) ? start + durationMin * 60 * 1000 : null;
  const started = Boolean(session?.started_at) || status === "live" || status === "done";
  const windowOver = endAt !== null && now > endAt;
  if (status === "done" || (started && windowOver)) {
    return { key: "ended", label: "Completed", canJoin: false };
  }
  if (!Number.isFinite(start)) {
    return { key: "live", label: "Join", canJoin: true };
  }
  const openAt = start - 15 * 60 * 1000;
  if (now < openAt) {
    return { key: "upcoming", label: "Upcoming", canJoin: canHost, joinLabel: "Start early" };
  }
  if (now <= endAt) {
    return { key: "live", label: "Join", canJoin: true };
  }
  return { key: "expired", label: "Expired", canJoin: false };
}

const MEET_PRODUCT = "Junnu";

function SessionJoinControls({ session, onJoin, joinLabel = "Join", role = "", now = Date.now() }) {
  const state = classJoinState(session, now, role);
  return (
    <span className="session-join-row">
      <span className={`session-state session-state--${state.key}`}>{state.key === "live" ? "Live" : state.label}</span>
      {state.canJoin ? (
        <button
          className="button portal-button green"
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onJoin(session);
          }}
        >
          {state.joinLabel || joinLabel}
        </button>
      ) : null}
      <button
        className="button portal-button blue"
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          downloadCalendarEvent(session);
        }}
      >
        Calendar
      </button>
    </span>
  );
}

function junnuRoomId(session) {
  return `${MEET_PRODUCT}-${session?.meeting_id || session?.id}`;
}

function downloadCalendarEvent(session) {
  const start = new Date(session.starts_at);
  const end = new Date(start.getTime() + Number(session.duration_min || 45) * 60000);
  const stamp = (date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `UID:junnu-${session.meeting_id || session.id}@crablearn`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${String(session.title || session.subject || "Junnu class").replace(/[,;]/g, " ")}`,
    `DESCRIPTION:Join Junnu: ${session.join_url || ""}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([content], { type: "text/calendar" }));
  link.download = "junnu-meeting.ics";
  link.click();
  URL.revokeObjectURL(link.href);
}

function toMeetingStartIso(localValue) {
  const raw = String(localValue || "").trim();
  if (!raw) {
    return null;
  }
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw) ? `${raw}:00` : raw;
  const date = new Date(withSeconds);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const initialPortalSession = readPortalSession();
  const [openNav, setOpenNav] = useState(null);
  const [signInMenuOpen, setSignInMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(defaultCategory);
  const [portalScreen, setPortalScreen] = useState(() => getPublicScreenFromPath(window.location.pathname));
  const [signInRole, setSignInRole] = useState("student");
  const [routeRole, setRouteRole] = useState(() => getRoleFromPathname(window.location.pathname));
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const signInMenuRef = useRef(null);
  const showPortalSection = Boolean(routeRole); // Determine if the portal section should be shown
  const [authMode, setAuthMode] = useState("login");
  const [loginMessage, setLoginMessage] = useState("Use your username or registered phone number with password to continue.");
  const [callbackMessage, setCallbackMessage] = useState("Request a callback and we will match the learner with the right advisor.");
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [homeSlide, setHomeSlide] = useState(0);
  const [homeSlidePaused, setHomeSlidePaused] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [passwordRequestId, setPasswordRequestId] = useState("");
  const whyViewportRef = useRef(null);
  const sessionPasswordRef = useRef(initialPortalSession?.password || "");
  const [currentUser, setCurrentUser] = useState(initialPortalSession?.user || null);
  const [mappedRoster, setMappedRoster] = useState(initialPortalSession?.assignments || []);
  const [classPack, setClassPack] = useState(initialPortalSession?.classes || { month_label: "", eligible: 0, pending: 0, sessions: [] });
  const classHistory = classPack.history || [];
  const historyMonths = [...new Set(classHistory.map((session) => session.month_key).filter(Boolean))];
  const [historyMonth, setHistoryMonth] = useState("");
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetingKind, setMeetingKind] = useState("o2o");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingStart, setMeetingStart] = useState("");
  const [meetingDuration, setMeetingDuration] = useState("45");
  const [meetingRecurrence, setMeetingRecurrence] = useState("none");
  const [meetingOccurrences, setMeetingOccurrences] = useState("4");
  const [meetingStudentId, setMeetingStudentId] = useState("");
  const [meetingTeacherId, setMeetingTeacherId] = useState("");
  const [meetingStudentIds, setMeetingStudentIds] = useState([]);
  const [meetingTeacherIds, setMeetingTeacherIds] = useState([]);
  const [meetingMessage, setMeetingMessage] = useState("Pick 1 to 1 or many to many, then save the call.");
  const [mapStudentId, setMapStudentId] = useState("");
  const [mapTeacherId, setMapTeacherId] = useState("");
  const [assignmentMessage, setAssignmentMessage] = useState("Load users, then map a student with an educator.");
  const [authMessage, setAuthMessage] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminActionMessage, setAdminActionMessage] = useState("Admin actions require password verification.");
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [passwordChangeRequests, setPasswordChangeRequests] = useState([]);
  const [auditFilter, setAuditFilter] = useState("all");
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
  const directoryStudents = adminUsers.filter((user) => String(user.role || "").toLowerCase() === "student" && String(user.status || "").toLowerCase() === "approved");
  const directoryTeachers = adminUsers.filter((user) => String(user.role || "").toLowerCase() === "teacher" && String(user.status || "").toLowerCase() === "approved");
  const pendingEducators = adminUsers.filter((user) => String(user.role || "").toLowerCase() === "teacher" && String(user.status || "").toLowerCase() === "pending");
  const pendingStudents = adminUsers.filter((user) => String(user.role || "").toLowerCase() === "student" && String(user.status || "").toLowerCase() === "pending");
  const pendingPasswordRequests = passwordChangeRequests.filter((request) => String(request.status || "").toLowerCase() === "pending");
  const educatorStudents = mappedRoster
    .map((item) => item.student)
    .filter((person, index, list) => person && list.findIndex((row) => Number(row.id) === Number(person.id)) === index);
  const learnerTeachers = mappedRoster
    .map((item) => item.teacher)
    .filter((person, index, list) => person && list.findIndex((row) => Number(row.id) === Number(person.id)) === index);
  const studentMappings = new Map();
  const teacherMappings = new Map();
  mappedRoster.forEach((item) => {
    if (item.student && item.teacher) {
      studentMappings.set(Number(item.student_id), [...(studentMappings.get(Number(item.student_id)) || []), item.teacher]);
      teacherMappings.set(Number(item.teacher_id), [...(teacherMappings.get(Number(item.teacher_id)) || []), item.student]);
    }
  });

  const activeSubjects = useMemo(
    () => subjectGroups.find((group) => group.name === activeCategory)?.subjects ?? [],
    [activeCategory]
  );

  const activePortalRole = routeRole || signInRole || "student";
  const activeSignInProfile = signInProfiles[activePortalRole] || signInProfiles.student;
  const currentUserRole = String(currentUser?.role || "").toLowerCase();
  const [nowTick, setNowTick] = useState(() => Date.now());
  const isAdmin = isPrivilegedAccount(currentUserRole);
  const canScheduleClasses = ["student", "teacher"].includes(currentUserRole) || isAdmin;
  const learnerName = currentUser?.full_name || currentUser?.name || "Learner";
  const roleLabel = formatPortalRoleLabel(currentUserRole || activePortalRole);
  const isAccountsPortal = activePortalRole === "accounts";
  const canAccessAccountsPage = canViewAccounts(currentUserRole);
  const accountsAccessDenied = Boolean(currentUser) && isAccountsPortal && !canAccessAccountsPage;
  const showAccountsDashboard = isAccountsPortal && canAccessAccountsPage && portalScreen === "accounts-dashboard";
  const showMarketingContent = portalScreen === "home" && !showPortalSection;
  const showEducatorJoin = portalScreen === "become-educator" && !showPortalSection;
  const showStudentJoin = portalScreen === "join-student" && !showPortalSection;
  const showQuizPage = portalScreen === "practice-quiz" && !showPortalSection;
  const showBookEducator = portalScreen === "book-educator" && !showPortalSection;
  const showEducatorAuth = portalScreen === "educator-login" && !showPortalSection;
  const showPublicPage = showMarketingContent || showEducatorJoin || showEducatorAuth || showStudentJoin || showQuizPage || showBookEducator;
  const showPortalPreviewSection = showPortalSection && !showAccountsDashboard;
  const showStudentPortalTabs = Boolean(currentUser) && ["student", "teacher"].includes(activePortalRole) && (currentUserRole === activePortalRole || isAdmin);
  const showPrivilegedWorkspaceTabs = Boolean(currentUser) && isAdmin;
  const showStudentSupportContent = !showAccountsDashboard && !isAdmin && portalScreen === "login";
  const isStudentLoginView = activePortalRole === "student" && portalScreen === "login";
  const isStudentWorkspaceView = ["student", "teacher"].includes(activePortalRole) && ["dashboard", "live", "schedule", "history"].includes(portalScreen);
  const isEducatorWorkspace = Boolean(currentUser) && activePortalRole === "teacher" && isStudentWorkspaceView;
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
    if (portalScreen === "meet") {
      return "Live call";
    }
    if (portalScreen === "live") {
      return "Join class";
    }
    if (portalScreen === "schedule") {
      return "Schedule class";
    }
    if (portalScreen === "history") {
      return "Scheduled history";
    }
    if (portalScreen === "dashboard") {
      return "Classes";
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
    if (!currentUser || !sessionPasswordRef.current) {
      return;
    }
    window.sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify({
      user: currentUser,
      password: sessionPasswordRef.current,
      assignments: mappedRoster,
      classes: classPack
    }));
  }, [currentUser, mappedRoster, classPack]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const publicScreen = getPublicScreenFromPath(path);
      if (publicScreen !== "home") {
        setRouteRole(null);
        setPortalScreen(publicScreen);
        return;
      }
      setRouteRole(getRoleFromPathname(path));
      const nextRole = getRoleFromPathname(path);
      if (!nextRole) {
        setPortalScreen("home");
        return;
      }
      setPortalScreen("login");
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!routeRole) {
      return;
    }
    setSignInRole(routeRole);
    if (!currentUser) {
      setPortalScreen("login");
      return;
    }
    setPortalScreen((current) => {
      if (["meet", "dashboard", "live", "schedule", "admin-dashboard", "accounts-dashboard"].includes(current)) {
        return current;
      }
      if (routeRole === "accounts") {
        return "accounts-dashboard";
      }
      return "dashboard";
    });
  }, [routeRole, currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % taglines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showMarketingContent || homeSlidePaused) {
      return undefined;
    }
    const interval = setInterval(() => {
      goToHeroPage(homeSlide + 1);
    }, 5500);
    return () => clearInterval(interval);
  }, [showMarketingContent, homeSlidePaused, homeSlide]);

  useEffect(() => {
    if (!signInMenuOpen) {
      return undefined;
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSignInMenuOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [signInMenuOpen]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (historyMonths.length && !historyMonths.includes(historyMonth)) {
      setHistoryMonth(historyMonths[0]);
    }
  }, [historyMonth, historyMonths.join(",")]);

  useEffect(() => {
    if (portalScreen !== "meet" || !activeMeeting) {
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.querySelector(".meet-room")?.scrollIntoView({ block: "start" });
  }, [portalScreen, activeMeeting]);

  function goToHeroPage(index) {
    const next = ((index % heroPages.length) + heroPages.length) % heroPages.length;
    setHomeSlide(next);
  }

  function handleHomeHashNav(event, id) {
    if (id === "become-educator") {
      event.preventDefault();
      goToEducatorJoin();
      return;
    }
    if (id === "practice-quiz") {
      event.preventDefault();
      goToQuizPage();
      return;
    }
    if (id === "book-educator" || id === "contact") {
      event.preventDefault();
      if (showMarketingContent && id === "contact") {
        setOpenNav(null);
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      goToBookEducator();
      return;
    }
    if (!showMarketingContent) {
      return;
    }
    event.preventDefault();
    setOpenNav(null);
    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadMyClasses(identifier, password) {
    try {
      const response = await fetch(`${apiBaseUrl}/api/classes/mine`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ identifier, password })
      });
      const payload = await response.json();
      if (payload?.ok && payload.classes) {
        setClassPack(payload.classes);
      }
    } catch (_error) {
      // Keep the class list from login when the refresh call is unavailable.
    }
  }

  function joinScheduledClass(session) {
    if (!session) {
      return;
    }
    const status = String(session.status || "scheduled").toLowerCase();
    if (status === "cancelled" || status === "done") {
      return;
    }
    const startedSession = {
      ...session,
      platform: MEET_PRODUCT,
      started_at: session.started_at || new Date().toISOString(),
      status: status === "done" ? "done" : "live"
    };
    setActiveMeeting(startedSession);
    setPortalScreen("meet");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    const identifier = currentUser?.phone || currentUser?.full_name || "";
    const password = sessionPasswordRef.current;
    fetch(`${apiBaseUrl}/api/classes/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier,
        password,
        roomId: junnuRoomId(session)
      })
    }).catch(() => {});
  }

  async function leaveMeeting() {
    setActiveMeeting(null);
    setPortalScreen("dashboard");
    if (currentUser && sessionPasswordRef.current) {
      loadMyClasses(currentUser.phone || currentUser.full_name, sessionPasswordRef.current);
    }
  }

  function sessionPeopleLabel(session) {
    if (session?.kind === "m2m") {
      const names = [
        ...(session.teachers || []).map((person) => person.full_name),
        ...(session.students || []).map((person) => person.full_name)
      ].filter(Boolean);
      return names.join(", ") || "Group call";
    }
    if (activePortalRole === "teacher") {
      return session?.student?.full_name || "";
    }
    return session?.teacher?.full_name || "";
  }

  function meetingDisplayTitle(session) {
    const subject = String(session?.subject || "").trim();
    if (subject && !/^(1\s*to\s*1\s*class|class)$/i.test(subject)) {
      return subject;
    }
    const participant = sessionPeopleLabel(session);
    return participant ? `Private lesson with ${participant}` : session?.kind === "m2m" ? "Group class" : "Private lesson";
  }

  function goToHomePage() {
    setPortalScreen("home");
    setRouteRole(null);
    setSignInMenuOpen(false);
    setHomeSlide(0);
    if (decodeURIComponent(window.location.pathname) !== "/") {
      window.history.pushState({}, "", "/");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(event.currentTarget);
    const phone = addCountryCode(String(formData.get("phone") || loginIdentifier || "").trim(), String(formData.get("countryCode") || "+91"));
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
      sessionPasswordRef.current = password;
      if (isPrivilegedAccount(signedInRole)) {
        setAdminPassword(password);
      }
      setMappedRoster(Array.isArray(payload.assignments) ? payload.assignments : []);
      setClassPack(payload.classes || { month_label: "", eligible: 0, pending: 0, sessions: [] });
      loadMyClasses(phone, password);
      setAuthMessage(payload.message || "Signed in successfully.");
      setLoginMessage(payload.message || "Signed in successfully.");
      const privileged = isPrivilegedAccount(signedInRole);
      if (privileged) {
        if (activeAuthRole === "accounts") {
          goToSignInRoute("accounts");
          setPortalScreen("accounts-dashboard");
        } else if (["student", "teacher"].includes(activeAuthRole)) {
          goToSignInRoute(activeAuthRole);
          setPortalScreen("dashboard");
        } else {
          goToSignInRoute("student");
          setPortalScreen("admin-dashboard");
        }
      } else if (activeAuthRole === "accounts") {
        if (!canViewAccounts(signedInRole)) {
          setCurrentUser(null);
          setAuthMessage("Accounts is only available to supervisor and accounts users.");
          setLoginMessage("Students and educators cannot open the accounts workspace.");
          return;
        }
        goToSignInRoute("accounts");
        setPortalScreen("accounts-dashboard");
      } else if (activeAuthRole === "teacher") {
        goToSignInRoute("teacher");
        setPortalScreen("dashboard");
      } else if (activeAuthRole === "student" || signedInRole === "student") {
        goToSignInRoute("student");
        setPortalScreen("dashboard");
      } else {
        goToSignInRoute(signedInRole);
        setPortalScreen("login");
      }
      form.reset();
      setLoginIdentifier("");
    } catch (error) {
      setAuthMessage("Login service is unavailable. Please check the API server and try again.");
    }
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = addCountryCode(String(formData.get("identifier") || "").trim(), String(formData.get("countryCode") || "+91"));
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    try {
      const endpoint = passwordRequestId ? "/api/auth/change-password/complete" : "/api/auth/change-password";
      const body = passwordRequestId
        ? { requestId: passwordRequestId, otp: currentPassword, newPassword }
        : { identifier, newPassword };
      const response = await fetch(`${apiBaseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      setLoginMessage(payload.message || (response.ok ? "Password changed." : "Could not change password."));
      if (response.ok && payload.ok) {
        if (payload.requestId) {
          setPasswordRequestId(String(payload.requestId));
          setAuthMode("change-password");
        } else {
          setPasswordRequestId("");
          setAuthMode("login");
        }
      }
    } catch (_error) {
      setLoginMessage("Password service is unavailable. Please try again.");
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fullName = String(formData.get("fullName") || "");
    const phone = addCountryCode(String(formData.get("phone") || ""), String(formData.get("countryCode") || "+91"));
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
      if (Array.isArray(result.assignments)) {
        setMappedRoster(result.assignments);
      }
      setPasswordChangeRequests(Array.isArray(result.passwordChangeRequests) ? result.passwordChangeRequests : []);
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

  useEffect(() => {
    if (!currentUser || !isAdmin) {
      return;
    }
    if (portalScreen === "admin-dashboard" || portalScreen === "schedule") {
      handleAdminListUsers();
    }
  }, [portalScreen, currentUser?.id, isAdmin]);

  async function handleMapAssignment(event) {
    event.preventDefault();
    if (!mapStudentId || !mapTeacherId) {
      setAssignmentMessage("Choose one student and one educator to map.");
      return;
    }
    const result = await runAdminAction("/api/admin/assignments", {
      studentId: Number(mapStudentId),
      teacherId: Number(mapTeacherId)
    });
    if (result?.ok) {
      setAssignmentMessage(result.message || "Student mapped with educator.");
      if (Array.isArray(result.assignments)) {
        setMappedRoster(result.assignments);
      }
      setMapStudentId("");
      setMapTeacherId("");
    } else {
      setAssignmentMessage("Could not save the mapping. Check supervisor password and try again.");
    }
  }

  async function handleRemoveAssignment(assignmentId) {
    const result = await runAdminAction(`/api/admin/assignments/${encodeURIComponent(assignmentId)}/remove`, {});
    if (result?.ok) {
      setAssignmentMessage(result.message || "Mapping removed.");
      if (Array.isArray(result.assignments)) {
        setMappedRoster(result.assignments);
      }
    }
  }

  function toggleMeetingPerson(list, setter, id) {
    const value = Number(id);
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function handleScheduleMeeting(event) {
    event.preventDefault();
    if (!sessionPasswordRef.current || !currentUser) {
      setMeetingMessage("Sign in again to schedule a call.");
      return;
    }
    const startsAt = toMeetingStartIso(meetingStart);
    if (!startsAt) {
      setMeetingMessage("Choose a valid start date and time.");
      return;
    }
    const isGroup = meetingKind === "m2m";
    const studentIds = (currentUserRole === "student" ? [Number(currentUser.id)] : (isGroup ? meetingStudentIds : [Number(meetingStudentId)]))
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    const teacherIds = (
      currentUserRole === "student"
        ? [Number(meetingTeacherId)]
        : isGroup
        ? (isAdmin ? meetingTeacherIds : [currentUser.id, ...meetingTeacherIds])
        : [isAdmin ? Number(meetingTeacherId) : currentUser.id]
    )
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (!studentIds.length) {
      setMeetingMessage("Select at least one student.");
      return;
    }
    if (!teacherIds.length) {
      setMeetingMessage(isAdmin ? "Select an educator for this class." : "Your educator account is required to schedule.");
      return;
    }
    try {
      const response = await fetch(`${apiBaseUrl}/api/meetings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: currentUser.phone || currentUser.full_name,
          password: sessionPasswordRef.current,
          title: meetingTitle,
          kind: meetingKind,
          startsAt,
          durationMin: Number(meetingDuration),
          recurrence: meetingRecurrence,
          occurrences: Number(meetingOccurrences),
          platform: MEET_PRODUCT,
          studentIds,
          teacherIds
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setMeetingMessage(payload.message || "Could not schedule the call.");
        return;
      }
      setMeetingMessage(payload.message || "Call scheduled.");
      if (payload.classes) {
        setClassPack(payload.classes);
      }
      setMeetingTitle("");
      setMeetingStart("");
      setMeetingStudentId("");
      setMeetingTeacherId("");
      setMeetingStudentIds([]);
      setMeetingTeacherIds([]);
      setMeetingRecurrence("none");
    } catch (_error) {
      setMeetingMessage("Meeting service is unavailable. Restart the API and try again.");
    }
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

  async function handleReviewPasswordRequest(requestId, decision) {
    const result = await runAdminAction(`/api/admin/password-change-requests/${encodeURIComponent(requestId)}/${decision}`, {});
    if (result?.ok) {
      await handleAdminListUsers();
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
    if (!currentUser) {
      setPortalScreen("login");
    }
  }

  function openWorkspace(role) {
    if (role === "accounts") {
      if (!canViewAccounts(currentUser?.role)) {
        setAuthMessage("Students and educators cannot open the accounts workspace.");
        return;
      }
      goToSignInRoute("accounts");
      setPortalScreen("accounts-dashboard");
      return;
    }
    if (role === "admin") {
      goToSignInRoute(activePortalRole === "teacher" ? "teacher" : "student");
      setPortalScreen("admin-dashboard");
      return;
    }
    goToSignInRoute(role);
    setPortalScreen("dashboard");
  }

  function goToLoginPanel(role = "student", mode = "login") {
    const nextRole = signInProfiles[role] ? role : "student";
    setSignInRole(nextRole);
    setAuthMode(mode);
    setPortalScreen("login");
    goToSignInRoute(nextRole);
    const loginSection = document.getElementById("portal") || document.getElementById("contact");
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function shiftEducatorWhy(direction) {
    const viewport = whyViewportRef.current;
    if (!viewport) {
      return;
    }
    const card = viewport.querySelector(".why-card");
    const amount = card ? card.getBoundingClientRect().width + 16 : viewport.clientWidth * 0.4;
    viewport.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  function goToPublicScreen(screen, path) {
    setSignInMenuOpen(false);
    setOpenNav(null);
    setRouteRole(null);
    setPortalScreen(screen);
    if (decodeURIComponent(window.location.pathname) !== path) {
      window.history.pushState({}, "", path);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToEducatorAuth(mode = "login") {
    setSignInRole("teacher");
    setAuthMode(mode);
    if (mode === "login") setPasswordRequestId("");
    setShowAuthPassword(false);
    goToPublicScreen("educator-login", "/educator-login");
  }

  function goToEducatorJoin() {
    goToPublicScreen("become-educator", "/become-educator");
  }

  function goToQuizPage() {
    goToPublicScreen("practice-quiz", "/practice-quiz");
  }

  function goToBookEducator() {
    goToPublicScreen("book-educator", "/book-educator");
  }

  function goToStudentJoin() {
    setSignInRole("student");
    setAuthMode("login");
    setPasswordRequestId("");
    setShowAuthPassword(false);
    goToPublicScreen("join-student", "/join-student");
  }

  function handleHeroCta(theme) {
    if (theme === "quiz") {
      goToQuizPage();
      return;
    }
    if (theme === "educator") {
      goToEducatorJoin();
      return;
    }
    goToBookEducator();
  }

  function handleLogout() {
    window.sessionStorage.removeItem(PORTAL_SESSION_KEY);
    setCurrentUser(null);
    sessionPasswordRef.current = "";
    setMappedRoster([]);
    setClassPack({ month_label: "", eligible: 0, pending: 0, sessions: [] });
    setActiveMeeting(null);
    setMeetingKind("o2o");
    setMeetingTitle("");
    setMeetingStart("");
    setMeetingStudentId("");
    setMeetingTeacherId("");
    setMeetingStudentIds([]);
    setMeetingTeacherIds([]);
    setMeetingRecurrence("none");
    setMapStudentId("");
    setMapTeacherId("");
    setAssignmentMessage("Load users, then map a student with an educator.");
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

  function renderScheduleForm() {
    const studentOptions = currentUserRole === "teacher" ? educatorStudents : directoryStudents;
    const teacherOptions = currentUserRole === "student" ? learnerTeachers : directoryTeachers;
    return (
      <form className="mobile-form schedule-form" onSubmit={handleScheduleMeeting}>
        {currentUserRole !== "student" ? (
          <>
            <label htmlFor="scheduleMeetingKind">Call type</label>
            <select id="scheduleMeetingKind" value={meetingKind} onChange={(event) => setMeetingKind(event.target.value)}>
              <option value="o2o">1 to 1</option>
              <option value="m2m">Many to many</option>
            </select>
          </>
        ) : null}
        <label htmlFor="scheduleMeetingTitle">Title</label>
        <input id="scheduleMeetingTitle" value={meetingTitle} onChange={(event) => setMeetingTitle(event.target.value)} placeholder="Maths doubt session" />
        <label htmlFor="scheduleMeetingStart">Start</label>
        <input id="scheduleMeetingStart" type="datetime-local" value={meetingStart} onChange={(event) => setMeetingStart(event.target.value)} required />
        <label htmlFor="scheduleMeetingDuration">Minutes</label>
        <input id="scheduleMeetingDuration" type="number" min="15" step="15" value={meetingDuration} onChange={(event) => setMeetingDuration(event.target.value)} />
        <label htmlFor="scheduleMeetingRecurrence">Repeat</label>
        <select id="scheduleMeetingRecurrence" value={meetingRecurrence} onChange={(event) => setMeetingRecurrence(event.target.value)}>
          <option value="none">Does not repeat</option>
          <option value="weekly">Weekly</option>
        </select>
        {meetingRecurrence === "weekly" ? <><label htmlFor="scheduleMeetingOccurrences">Occurrences</label><input id="scheduleMeetingOccurrences" type="number" min="2" max="52" value={meetingOccurrences} onChange={(event) => setMeetingOccurrences(event.target.value)} /></> : null}
        {currentUserRole === "student" ? (
          <>
            <label htmlFor="scheduleMeetingTeacher">Educator</label>
            <select id="scheduleMeetingTeacher" value={meetingTeacherId} onChange={(event) => setMeetingTeacherId(event.target.value)} required>
              <option value="">{teacherOptions.length ? "Select your educator" : "No educator mapped"}</option>
              {teacherOptions.map((user) => <option key={user.id} value={user.id}>{user.full_name}</option>)}
            </select>
          </>
        ) : meetingKind === "o2o" ? (
          <>
            <label htmlFor="scheduleMeetingStudent">Student</label>
            <select id="scheduleMeetingStudent" value={meetingStudentId} onChange={(event) => setMeetingStudentId(event.target.value)} required>
              <option value="">{studentOptions.length ? "Select student" : "No students available"}</option>
              {studentOptions.map((user) => (
                <option key={user.id} value={user.id}>{user.full_name}</option>
              ))}
            </select>
            {isAdmin ? (
              <>
                <label htmlFor="scheduleMeetingTeacher">Educator</label>
                <select id="scheduleMeetingTeacher" value={meetingTeacherId} onChange={(event) => setMeetingTeacherId(event.target.value)} required={Boolean(directoryTeachers.length)}>
                  <option value="">{directoryTeachers.length ? "Select educator" : "No approved educators loaded"}</option>
                  {directoryTeachers.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name}</option>
                  ))}
                </select>
                {!directoryTeachers.length ? <p className="schedule-empty">Load or refresh approved users before choosing an educator.</p> : null}
              </>
            ) : null}
          </>
        ) : (
          <>
            <fieldset className="meeting-pick">
              <legend>Students</legend>
              {studentOptions.length ? studentOptions.map((user) => (
                <label key={user.id}>
                  <input type="checkbox" checked={meetingStudentIds.includes(Number(user.id))} onChange={() => toggleMeetingPerson(meetingStudentIds, setMeetingStudentIds, user.id)} />
                  {user.full_name}
                </label>
              )) : <p>No students available to pick.</p>}
            </fieldset>
            {isAdmin ? (
              <fieldset className="meeting-pick">
                <legend>Educators</legend>
                {directoryTeachers.map((user) => (
                  <label key={user.id}>
                    <input type="checkbox" checked={meetingTeacherIds.includes(Number(user.id))} onChange={() => toggleMeetingPerson(meetingTeacherIds, setMeetingTeacherIds, user.id)} />
                    {user.full_name}
                  </label>
                ))}
              </fieldset>
            ) : null}
          </>
        )}
        {currentUserRole === "student" && !teacherOptions.length ? (
          <p className="schedule-empty">Ask your educator to map your account before scheduling.</p>
        ) : currentUserRole !== "student" && !studentOptions.length ? (
          <p className="schedule-empty">Map a student with this educator first, then return here to set the class time.</p>
        ) : null}
        <button className="button portal-button blue" type="submit" disabled={currentUserRole === "student" ? !teacherOptions.length : !studentOptions.length}>Save class</button>
      </form>
    );
  }

  return (
    <div className={`site-shell page-fit${showPublicPage ? " page-fit--home" : " page-fit--app"}`}>
      {showGlobalHomeButton && !isEducatorWorkspace ? (
        <button className="floating-home-button" type="button" onClick={goToHomePage}>
          Back to Home
        </button>
      ) : null}

      {!isEducatorWorkspace ? <header className="site-header" id="top">
        <div className="top-nav">
          <button className="brand-block" type="button" onClick={goToHomePage}>
            <span className="brand-word">crab</span>
            <span className="brand-word brand-word--glow">learn.in</span>
          </button>

          <nav className="main-nav">
            {showPublicPage ? (
              showEducatorJoin || showEducatorAuth || showStudentJoin || showQuizPage || showBookEducator ? (
                <button className="nav-link nav-button" type="button" onClick={goToHomePage}>Home</button>
              ) : (
                <a className="nav-link" href="#top" onClick={(event) => handleHomeHashNav(event, "top")}>Home</a>
              )
            ) : null}
            <a className="nav-link" href="#about" onClick={(event) => handleHomeHashNav(event, "about")}>About</a>
            {showMarketingContent ? (
            <div className="menu-anchor">
              <button
                className="nav-link nav-button"
                type="button"
                  onClick={() => setOpenNav((v) => (v === "courses" ? null : "courses"))}
              >
                  All Courses <span className="nav-chevron" aria-hidden="true" />
              </button>
                {openNav === "courses" ? (
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
                        <a className="subject-leaf" href="#courses" key={subject} onClick={(event) => handleHomeHashNav(event, "courses")}>{subject}</a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            ) : null}
            {showMarketingContent ? (
              <div className="menu-anchor">
                <button className="nav-link nav-button" type="button" onClick={() => setOpenNav((v) => (v === "syllabus" ? null : "syllabus"))}>
                  Syllabus <span className="nav-chevron" aria-hidden="true" />
                </button>
                {openNav === "syllabus" ? (
                  <div className="simple-menu">
                    {syllabusLinks.map((item) => (
                      <a key={item} href="#syllabus" onClick={(event) => handleHomeHashNav(event, "syllabus")}>{item}</a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            {showMarketingContent ? <a className="nav-link" href="#contact" onClick={(event) => handleHomeHashNav(event, "contact")}>Contact</a> : null}
            {showMarketingContent && currentUser && ["student", "teacher"].includes(currentUserRole) ? (
              <button className="nav-link nav-button portal-return-link" type="button" onClick={() => openWorkspace(currentUserRole)}>
                {`Return to ${formatPortalRoleLabel(currentUserRole)} portal`}
              </button>
            ) : null}
            {showMarketingContent ? (
              <div className="menu-anchor">
                <button className="nav-link nav-button" type="button" onClick={() => setOpenNav((v) => (v === "more" ? null : "more"))}>
                  More <span className="nav-chevron" aria-hidden="true" />
                </button>
                {openNav === "more" ? (
                  <div className="simple-menu">
                    {moreLinks.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={(event) => {
                          if (item.label === "Become Educator") {
                            event.preventDefault();
                            goToEducatorJoin();
                            return;
                          }
                          if (item.label === "Practice Quiz") {
                            event.preventDefault();
                            goToQuizPage();
                            return;
                          }
                          if (item.label === "Book Educator") {
                            event.preventDefault();
                            goToBookEducator();
                            return;
                          }
                          handleHomeHashNav(event, item.href.replace("#", ""));
                        }}
                      >{item.label}</a>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </nav>

          <div className="nav-actions">
            {showMarketingContent ? (
              <a className="nav-search" href="#contact" aria-label="Search programs" onClick={(event) => handleHomeHashNav(event, "contact")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </a>
            ) : null}
            {currentUser ? <div className="session-pill">{roleLabel} signed in</div> : null}
            {currentUser ? <NotificationInbox subscriber={currentUser} /> : null}
            {!currentUser && showPublicPage ? (
              <button className="login-register-btn" type="button" onClick={handleSignInToggle} aria-haspopup="dialog" aria-expanded={signInMenuOpen} data-testid="signin-trigger">
                Login/Register
                </button>
            ) : null}
            {currentUser ? <button className="login-register-btn" type="button" onClick={handleLogout}>Sign out</button> : null}
          </div>
        </div>

        {authMessage ? (
          <div className="auth-feedback" role="status" aria-live="polite">{authMessage}</div>
        ) : null}

      </header> : null}

      {signInMenuOpen ? (
        <div className="role-modal-backdrop" onClick={() => setSignInMenuOpen(false)}>
          <div
            className="role-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-modal-title"
            data-testid="signin-menu"
            ref={signInMenuRef}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="role-modal-close" type="button" onClick={() => setSignInMenuOpen(false)} aria-label="Close">×</button>
            <h2 id="role-modal-title">Select Your Position!</h2>
            <div className="role-modal-cards">
              <button className="role-card" type="button" onClick={() => goToEducatorAuth("login")} data-testid="signin-option-teacher">
                <RoleArtEducator />
                <span>Educator</span>
              </button>
              <button className="role-card" type="button" onClick={goToStudentJoin} data-testid="signin-option-student">
                <RoleArtStudent />
                <span>Student</span>
              </button>
              </div>
            <div className="role-modal-staff">
              <button type="button" className="signin-option" onClick={() => handleSignInRole("engineer")} data-testid="signin-option-engineer">engineer login</button>
              <button type="button" className="signin-option" onClick={() => handleSignInRole("accounts")} data-testid="signin-option-accounts">accounts login</button>
            </div>
          </div>
        </div>
      ) : null}

      {showMarketingContent ? (
        <div
          className="home-deck"
          onFocusCapture={(event) => {
            if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) {
              setHomeSlidePaused(true);
            }
          }}
          onBlurCapture={(event) => {
            const next = event.relatedTarget;
            if (!next || !["INPUT", "TEXTAREA", "SELECT"].includes(next.tagName)) {
              setHomeSlidePaused(false);
            }
          }}
        >
            <section className="promo-hero" aria-label="Featured pages">
              <button className="home-slide-arrow home-slide-arrow--prev" type="button" onClick={() => goToHeroPage(homeSlide - 1)} aria-label="Previous page">‹</button>
              <button className="home-slide-arrow home-slide-arrow--next" type="button" onClick={() => goToHeroPage(homeSlide + 1)} aria-label="Next page">›</button>
              <div className="promo-viewport">
                <div className="promo-track" style={{ transform: `translateX(-${homeSlide * (100 / heroPages.length)}%)` }}>
                  {heroPages.map((page) => (
                    <article className="promo-page promo-page--book" key={page.theme} aria-label={page.title}>
                      <div className="promo-visual" aria-hidden="true">
                        <div className="promo-blob">
                          {page.chips.map((chip) => (
                            <span className="promo-chip" key={chip}>{chip}</span>
                          ))}
                        </div>
                      </div>
                      <div className="promo-copy promo-copy--center">
                        <h1>{page.title}</h1>
                        <p className="promo-kicker">{page.kicker}</p>
                        <button className="promo-link" type="button" onClick={() => handleHeroCta(page.theme)}>
                          {page.linkLabel}
                        </button>
                        <button
                          className="button coral"
                          type="button"
                          onClick={() => handleHeroCta(page.theme)}
                        >
                          {page.ctaLabel}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              <div className="promo-dots" role="tablist" aria-label="Hero pages">
                {heroPages.map((page, index) => (
                  <button
                    key={page.title}
                    className={index === homeSlide ? "active" : ""}
                    type="button"
                    role="tab"
                    aria-selected={index === homeSlide}
                    aria-label={page.title}
                    onClick={() => goToHeroPage(index)}
                  />
                ))}
              </div>
            </section>

            <p className="home-intro">
              Crab Learn is a leading home tuition and online education platform in India, offering personalized one-on-one academic tutoring either at home or online, delivered by expert and verified educators.
            </p>
            <p className="home-intro">
              With experienced tutors, customized lesson plans, and coverage across major Indian boards (CBSE, ICSE, State Boards), we help students excel academically through both in-home and virtual classes on this Student Learning Platform.
            </p>
            <p className="home-intro">
              Whether you're a student seeking private guidance or a teacher eager to share knowledge, we’ve got you covered!
            </p>
            <p className="home-hub-line">crablearn.in — Your Personalized Home Tuition Hub</p>

            <section className="trust-ticker" aria-label="Trust badges">
              <div className="ticker-track">
                {[...trustBadges, ...trustBadges].map((item, index) => (
                  <span className="ticker-item" key={`${item}-${index}`}>{item}</span>
                ))}
              </div>
            </section>

            <section className="section proof-strip">
              {proofStats.map((stat) => (
                <article className="proof-card" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </section>

            <section className="section split-section" id="about">
              <div>
                <p className="section-kicker">Crab Learn – Personalized Home Tutoring</p>
                <h2>The Best Platform For Students</h2>
                <p className="section-text">
                  Crab Learn is designed to support students by bringing high-quality education directly to their homes. We believe every learner deserves personalized attention, and that’s why we offer expert home tutoring tailored to each child’s pace and style.
                </p>
                <p className="section-text">
                  As the Best Platform For Students, our mission is to make learning simple, engaging, and result-oriented. Parents and learners call us the Best Learning Platform because we focus on real improvement—strong basics, better scores, and growing confidence.
                </p>
                <p className="section-kicker">Expert Home Tutors for CBSE Classes</p>
                <p className="section-text">
                  Our highly qualified Home Tutors for CBSE classes understand the curriculum well and help students stay prepared for school exams, competitive goals, and future studies. We provide flexible scheduling, one-to-one interaction, doubt-clearing sessions, and a learning plan crafted for each student’s needs.
                </p>
                <p className="section-text">
                  At Crab Learn, education isn’t just about marks—it’s about progress, curiosity, and academic success. We are here to guide students step-by-step, making sure they enjoy learning and achieve their full potential.
                </p>
              </div>
              <div className="work-card">
                <p className="section-kicker">Why Crab Learn Home Tuition Works Better</p>
                <p className="section-text">
                  Crab Learn Home tuition provides personalized learning, real-time feedback, and fewer distractions, leading to faster academic growth and confidence.
                </p>
                <ul className="work-list">
                  {workItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="section">
              <p className="section-kicker">Our Educational Excellence in Personalized Learning</p>
              <h2>Discover our commitment to top-notch solutions for learners and educators.</h2>
              <div className="program-grid">
                {excellenceCards.map((card) => (
                  <article className="program-card" key={card.title}>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="section" id="courses">
              <p className="section-kicker">One-on-One Live Learning —</p>
              <h2>Made for Every Student</h2>
              <p className="section-text">Boost understanding, confidence, and performance with personalised 1-on-1 sessions.</p>
              <div className="focus-grid">
                {focusCards.map((card) => (
                  <article className="focus-card" key={card.title}>
                    <span className="focus-icon" aria-hidden="true">{card.icon}</span>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                    <a className="text-link" href="#contact" onClick={(event) => handleHomeHashNav(event, "contact")}>{card.cta}</a>
                  </article>
                ))}
              </div>
              <p className="section-kicker" style={{ marginTop: "2rem" }}>Achieve Your Goals</p>
              <h2>Book certified and selected educators with crablearn.in</h2>
              <div className="program-grid program-grid--wide">
                {programCards.map((card) => (
                  <article className="program-card" key={card.title}>
                    <p className="section-kicker">crablearn.in</p>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                    <a className="button ghost" href={card.href} onClick={(event) => handleHomeHashNav(event, "contact")}>{card.cta}</a>
                  </article>
                ))}
              </div>
            </section>

            <section className="section join-band">
              <div>
                <p className="section-kicker">Join Us As</p>
                <h2>Book Educator or Become Educator</h2>
              </div>
              <div className="hero-actions">
                <a className="button coral" href="#book-educator" onClick={(event) => handleHomeHashNav(event, "book-educator")}>Book Educator</a>
                <button className="button solid" type="button" onClick={goToEducatorJoin}>Become Educator</button>
              </div>
            </section>

            <section id="featured" aria-label="Featured">
              <section className="section">
                <p className="section-kicker">Featured Crab Learn Courses</p>
                <h2>Learn Anywhere. Master Your Concepts. Track Your Progress.</h2>
                <div className="focus-grid focus-grid-3">
                  {featuredCourseCards.map((card) => (
                    <article className="focus-card" key={card.title}>
                      <h3>{card.title}</h3>
                      <p>{card.text}</p>
                    </article>
                  ))}
                </div>
              </section>
              <section className="section">
                <p className="section-kicker">Crab Learn Online Quiz</p>
                <h2>Ace the Quiz: Test Your Knowledge Online!</h2>
                <ul className="work-list">
                  {quizPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button className="button coral" type="button" onClick={goToQuizPage}>Online Quiz</button>
              </section>
              <section className="section">
                <p className="section-kicker">Instant Learning Resources</p>
                <h2>Download the Crab Learn app now</h2>
                <p className="section-text">Get the Crab Learn App Now</p>
                <div className="store-row">
                  <span className="store-badge">GET IT ON Google Play</span>
                  <span className="store-badge">GET IT ON App Store</span>
                </div>
                <div className="focus-grid">
                  {trendCards.map((card) => (
                    <article className="focus-card" key={card.title}>
                      <h3>{card.title}</h3>
                      <p>{card.text}</p>
                    </article>
                  ))}
                </div>
              </section>
            </section>

            <section className="section" id="syllabus" aria-label="Syllabus and study material">
              <p className="section-kicker">Study material</p>
              <h2>Syllabus, sample papers, formulas, and state boards</h2>
              <div className="resource-grid">
                <div>
                  <p className="section-kicker">Syllabus</p>
                  {cbseClasses.map((item) => (
                    <span className="resource-item" key={`page-syl-${item}`}>{item}</span>
                  ))}
                </div>
                <div>
                  <p className="section-kicker">CBSE Sample Papers</p>
                  {cbseSamplePapers.map((item) => (
                    <span className="resource-item" key={item}>{item}</span>
                  ))}
                  <p className="section-kicker">ICSE Sample Papers</p>
                  {icseSamplePapers.map((item) => (
                    <span className="resource-item" key={item}>{item}</span>
                  ))}
                </div>
                <div>
                  <p className="section-kicker">Formula</p>
                  {mathsFormulas.map((item) => (
                    <span className="resource-item" key={item}>{item}</span>
                  ))}
                  <p className="section-kicker">Study material</p>
                  {studyMaterial.map((item) => (
                    <span className="resource-item" key={item}>{item}</span>
                  ))}
                </div>
                <div>
                  <p className="section-kicker">Previous Year Question Papers</p>
                  {previousYearPapers.map((item) => (
                    <span className="resource-item" key={item}>{item}</span>
                  ))}
                  <p className="section-kicker">Courses</p>
                  {coursePacks.map((item) => (
                    <span className="resource-item" key={`page-${item}`}>{item}</span>
                  ))}
                </div>
                <div>
                  <p className="section-kicker">State Board</p>
                  {stateBoards.map((item) => (
                    <span className="resource-item" key={item}>{item}</span>
                  ))}
                </div>
                <div>
                  <p className="section-kicker">Exam Preparation For Class 12</p>
                  {class12Subjects.map((item) => (
                    <span className="resource-item" key={`page-c12-${item}`}>{item}</span>
                  ))}
                  <p className="section-kicker">Exam Preparation For Class 11</p>
                  {class11Subjects.map((item) => (
                    <span className="resource-item" key={`page-c11-${item}`}>{item}</span>
                  ))}
                  <p className="section-kicker">Exam Preparation For Class 10</p>
                  {class10Subjects.map((item) => (
                    <span className="resource-item" key={`page-c10-${item}`}>{item}</span>
                  ))}
                </div>
              </div>
            </section>

            <section id="workflow" aria-label="How it works">
            <section className="section">
              <p className="section-kicker">Discover the Crab Learn advantage</p>
              <h2>Learning has never been this easy!</h2>
              <div className="focus-grid focus-grid-3">
                {advantages.map((card) => (
                  <article className="focus-card" key={card.title}>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                ))}
              </div>
              <div className="how-grid" style={{ marginTop: "1.4rem" }}>
                {easySteps.map((step) => (
                  <article className="how-card" key={step.title}>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="section">
              <p className="section-kicker">How Crab Learn Work ?</p>
              <h2>From matching an educator to celebrating milestones.</h2>
              <div className="how-grid">
                {howSteps.map((step) => (
                  <article className="how-card" key={step.n}>
                    <span className="how-n">{step.n}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                ))}
              </div>
            </section>
            </section>

            <section id="benefits" aria-label="Benefits">
            <section className="section">
              <p className="section-kicker">Benefits at a glance</p>
              <h2>All that crablearn.in can help you with.</h2>
              <div className="focus-grid">
                {benefits.map((card) => (
                  <article className="focus-card" key={card.title}>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                ))}
              </div>
              <article className="program-card guarantee-card">
                <h3>Money-back guaranteed</h3>
                <p>Our money-back guarantee eliminates any risk of starting with Crab Learn. If you are not satisfied after the first tutorial, we will provide you with a full refund.</p>
              </article>
              <p className="section-kicker" style={{ marginTop: "0.6rem" }}>Featured In</p>
              <div className="trust-ticker" aria-label="Featured in">
                <div className="ticker-track">
                  {[...featuredIn, ...featuredIn].map((item, index) => (
                    <span className="ticker-item" key={`${item}-${index}`}>{item}</span>
                  ))}
                </div>
              </div>
            </section>

            <section className="section faq-section">
              <p className="section-kicker">Frequently Asked Questions</p>
              <h2>Questions families ask before booking.</h2>
              <div className="faq-list">
                {faqs.map((item) => (
                  <details className="faq-item" key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
            </section>

        <section className="section contact-section" id="contact">
          <div>
            <p className="section-kicker">Book an Educator</p>
            <h2>Tell us the class, board, and whether you prefer home tuition or live online.</h2>
            <p className="section-text">Crab Learn revolutionizes the way students access education by bringing qualified educators directly to their homes with just one click.</p>
            <p className="callback-message">{callbackMessage}</p>
          </div>

          <form className="callback-form" onSubmit={handleCallbackSubmit}>
            <label htmlFor="parentName">Parent name</label>
            <input id="parentName" name="parentName" type="text" placeholder="Priya Sharma" required />
            <label htmlFor="parentPhone">Phone number</label>
            <input id="parentPhone" name="parentPhone" type="tel" placeholder="Enter phone number" required />
            <label htmlFor="program">Program</label>
            <select id="program" name="program" defaultValue="Home Tuition 1-on-1">
              <option>Home Tuition 1-on-1</option>
              <option>Live online 1-on-1</option>
              <option>Classes LKG–3</option>
              <option>Classes 4–12</option>
              <option>IIT-JEE</option>
              <option>NEET</option>
              <option>Government exams</option>
              <option>UPSC</option>
              <option>Defence exams</option>
              <option>Become educator</option>
            </select>
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" rows="4" placeholder="Tell us about your child, grade level, and goals." />
            <button className="button solid" type="submit">Book a callback</button>
          </form>
        </section>
          <footer className="site-footer">
            <div>
              <strong>crablearn.in</strong>
              <p>© Copyright crablearn.in 2026. All Rights Reserved.</p>
            </div>
            <div>
              <button type="button" onClick={goToBookEducator}>Book educator</button>
              <button type="button" onClick={goToEducatorJoin}>Become educator</button>
              <span>Privacy Policy</span>
              <span>Terms of Use</span>
            </div>
          </footer>
        </div>
      ) : null}

      {showEducatorJoin ? (
        <div className="home-deck educator-page">
          <section className="book-hero">
            <div className="promo-visual" aria-hidden="true">
              <div className="promo-blob">
                <span className="promo-chip">Teach</span>
                <span className="promo-chip">Home</span>
                <span className="promo-chip">Online</span>
                <span className="promo-chip">Earn</span>
              </div>
            </div>
            <div className="promo-copy promo-copy--center">
              <h1>Become an Educator</h1>
              <p className="promo-kicker">Share knowledge with students at home or live 1-on-1.</p>
              <p className="promo-link">Join Crab Learn</p>
              <button className="button coral" type="button" onClick={() => goToEducatorAuth("register")}>Become Educator</button>
            </div>
          </section>

          <section className="section educator-steps">
            <h2>Follow These Simple Steps</h2>
            <div className="step-grid">
              {educatorSteps.map((step) => (
                <article className="step-card" key={step.n}>
                  <span className="step-icon" aria-hidden="true">{step.icon}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section educator-why">
            <h2>Why Choose Crab Learn?</h2>
            <p className="section-text educator-why-intro">
              At Crab Learn, we’re committed to empowering educators by providing unparalleled flexibility and tools to grow their teaching career.
            </p>
            <div className="why-carousel">
              <button className="why-arrow why-arrow--prev" type="button" onClick={() => shiftEducatorWhy(-1)} aria-label="Previous">‹</button>
              <div className="why-viewport" ref={whyViewportRef}>
                {educatorWhyCards.map((card) => (
                  <article className="why-card" key={card.title}>
                    <span className="why-icon" aria-hidden="true">{card.icon}</span>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                ))}
              </div>
              <button className="why-arrow why-arrow--next" type="button" onClick={() => shiftEducatorWhy(1)} aria-label="Next">›</button>
            </div>
          </section>

          <section className="section">
            <p className="section-kicker">How Crab Learn Works for Tutors</p>
            <h2>Home tutoring jobs with flexible opportunities</h2>
            <p className="section-text">
              Crab Learn is a leading platform that connects home tutors with students and parents across cities. We provide home tutoring jobs with flexible job opportunities tailored to their expertise and preferences. Our platform empowers educators to shape their careers while making a meaningful impact on students' learning journeys. Join Crab Learn to discover rewarding teaching jobs and unlock your full potential as an academic instructor.
            </p>
          </section>

          <section className="section">
            <p className="section-kicker">Benefits of Becoming a Crab Learn Tutor</p>
            <h2>Join a community of experienced and professional tutors</h2>
            <ul className="work-list">
              {educatorJobBenefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="section-kicker" style={{ marginTop: "1.4rem" }}>crablearn.in</p>
            <h2>Download the tutors app now</h2>
            <div className="store-row">
              <span className="store-badge">GET IT ON Google Play</span>
              <span className="store-badge">GET IT ON App Store</span>
            </div>
            <button className="button coral" type="button" onClick={() => goToEducatorAuth("register")}>Start Now</button>
          </section>
        </div>
      ) : null}

      {showEducatorAuth ? (
        <div className="home-deck educator-auth-page">
          <section className="edu-auth-shell">
            <div className="edu-auth-info">
              <h1>Join Crab Learn</h1>
              <p>Empower students with your expertise.</p>
              <ul>
                {educatorAuthPoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="edu-auth-form">
              {authMode === "change-password" ? (
                <>
                  <h2>Change educator password</h2>
                  <p className="edu-legal">{passwordRequestId ? "Enter the one-time password sent to you to finish updating your password." : "Choose a new password, then submit your account identifier for OTP verification."}</p>
                  <form className="edu-underline-form" onSubmit={handleChangePassword}>
                    <CountryPhoneField id="educatorChangeId" name="identifier" label="Username or phone" defaultValue={loginIdentifier} placeholder="Mobile number or username" />
                    {passwordRequestId ? <><label htmlFor="educatorCurrentPassword">One-time password<span>*</span></label><input id="educatorCurrentPassword" name="currentPassword" type="text" inputMode="numeric" autoComplete="one-time-code" required /></> : null}
                    <label htmlFor="educatorNewPassword">New password<span>*</span></label>
                    <input id="educatorNewPassword" name="newPassword" type="password" minLength="6" required />
                    <button className="button coral student-login-btn" type="submit">{passwordRequestId ? "Update password" : "Send OTP"}</button>
                  </form>
                  <p className="student-switch"><button type="button" onClick={() => setAuthMode("login")}>Back to log in</button></p>
                </>
              ) : authMode === "login" ? (
                <>
                  <h2>Log in as an Educator</h2>
                  <button
                    className="edu-google-btn"
                    type="button"
                    onClick={() => setLoginMessage("Use your username, email, or mobile number with password to continue.")}
                  >
                    Continue with Google
                  </button>
                  <p className="edu-or">or</p>
                  <form className="edu-underline-form" onSubmit={handleLoginSubmit}>
                    <label htmlFor="educatorAuthId">Username<span>*</span></label>
                    <CountryPhoneField id="educatorAuthId" name="phone" label="Username or phone" value={loginIdentifier} onChange={(event) => setLoginIdentifier(event.target.value)} placeholder="Email, username, or mobile number" />
                    <label htmlFor="educatorAuthPassword">Password<span>*</span></label>
                    <div className="edu-password-row">
                      <input
                        id="educatorAuthPassword"
                        name="password"
                        type={showAuthPassword ? "text" : "password"}
                        placeholder="Your password"
                        required
                      />
                      <button className="edu-eye" type="button" onClick={() => setShowAuthPassword((open) => !open)} aria-label="Show password">
                        {showAuthPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <label className="edu-remember">
                      <input type="checkbox" name="rememberMe" />
                      Remember me
                    </label>
                    <button className="button coral student-login-btn" type="submit">Log in</button>
                  </form>
                  <p className="edu-legal">By clicking Continue or Sign up, you agree to Crab Learn Terms of Use and Privacy Policy.</p>
                  <button className="edu-link" type="button" onClick={() => { setPasswordRequestId(""); setAuthMode("change-password"); }}>Forgot Password?</button>
                  <button className="edu-link" type="button" onClick={() => { setPasswordRequestId(""); setAuthMode("change-password"); }}>Change password</button>
                  <p className="student-switch">Don't have an account? <button type="button" onClick={() => setAuthMode("register")}>Sign up</button></p>
                </>
              ) : (
                <>
                  <h2>Sign up as an Educator</h2>
                  <button
                    className="edu-google-btn"
                    type="button"
                    onClick={() => setLoginMessage("Use the form below to create your educator account.")}
                  >
                    Continue with Google
                  </button>
                  <p className="edu-or">or</p>
                  <form className="edu-underline-form" onSubmit={handleRegisterSubmit}>
                    <label htmlFor="educatorAuthName">Full name<span>*</span></label>
                    <input id="educatorAuthName" name="fullName" type="text" placeholder="Your full name" required />
                    <CountryPhoneField id="educatorAuthRegId" name="phone" label="Username or phone" placeholder="Email, username, or mobile number" />
                    <label htmlFor="educatorAuthRegPassword">Password<span>*</span></label>
                    <div className="edu-password-row">
                      <input
                        id="educatorAuthRegPassword"
                        name="password"
                        type={showAuthPassword ? "text" : "password"}
                        placeholder="Create a password"
                        required
                      />
                      <button className="edu-eye" type="button" onClick={() => setShowAuthPassword((open) => !open)} aria-label="Show password">
                        {showAuthPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <button className="button coral student-login-btn" type="submit">Sign up</button>
                  </form>
                  <p className="edu-legal">By clicking Continue or Sign up, you agree to Crab Learn Terms of Use and Privacy Policy.</p>
                  <p className="student-switch">Already have an account? <button type="button" onClick={() => setAuthMode("login")}>Log in</button></p>
                </>
              )}
              {loginMessage ? <p className="student-join-note">{loginMessage}</p> : null}
              {authMessage ? <p className="student-join-note">{authMessage}</p> : null}
            </div>
          </section>
        </div>
      ) : null}

      {showQuizPage ? (
        <div className="home-deck quiz-page">
          <section className="book-hero">
            <div className="promo-visual" aria-hidden="true">
              <div className="promo-blob">
                <span className="promo-chip">CBSE</span>
                <span className="promo-chip">Quiz</span>
                <span className="promo-chip">Fun</span>
                <span className="promo-chip">Boards</span>
              </div>
            </div>
            <div className="promo-copy promo-copy--center">
              <h1>Ready to Test Your Brain?</h1>
              <p className="promo-kicker">Master Every CBSE Subject with Fun Quizzes!</p>
              <p className="promo-link">Start Your Quiz Now</p>
              <button className="button coral" type="button" onClick={goToStudentJoin}>Start Quiz</button>
            </div>
          </section>
          <section className="section">
            <p className="section-kicker">Crab Learn Online Quiz</p>
            <h2>Ace the Quiz: Test Your Knowledge Online!</h2>
            <ul className="work-list">
              {quizPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="section-kicker" style={{ marginTop: "1.2rem" }}>Practice Quiz</p>
            <div className="resource-grid">
              {cbseClasses.map((item) => (
                <span className="resource-item" key={`quiz-page-${item}`}>{item.replace("CBSE Class - ", "CBSE Class-")} Quiz</span>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {showBookEducator ? (
        <div className="home-deck book-page">
          <section className="book-hero">
            <div className="promo-visual" aria-hidden="true">
              <div className="promo-blob">
                <span className="promo-chip">1:1</span>
                <span className="promo-chip">CBSE</span>
                <span className="promo-chip">ICSE</span>
                <span className="promo-chip">Boards</span>
              </div>
            </div>
            <div className="promo-copy promo-copy--center">
              <h1>Educators on Call</h1>
              <p className="promo-kicker">Are you looking for an educator? Find educators on demand.</p>
              <p className="promo-link">Book Your Educator Now</p>
              <a className="button coral" href="#book-form">Book Educator</a>
            </div>
          </section>
          <section className="section contact-section" id="book-form">
            <div>
              <p className="section-kicker">Book an Educator</p>
              <h2>Find your perfect tutor today.</h2>
              <p className="section-text">Expert guidance tailored to your learning needs — verified educators, 1-on-1 sessions, and a money-back guarantee after the first tutorial.</p>
              <p className="callback-message">{callbackMessage}</p>
            </div>
            <form className="callback-form" onSubmit={handleCallbackSubmit}>
              <label htmlFor="bookParentName">Parent name</label>
              <input id="bookParentName" name="parentName" type="text" placeholder="Priya Sharma" required />
              <label htmlFor="bookParentPhone">Phone number</label>
              <input id="bookParentPhone" name="parentPhone" type="tel" placeholder="Enter phone number" required />
              <label htmlFor="bookProgram">Program</label>
              <select id="bookProgram" name="program" defaultValue="Home Tuition 1-on-1">
                <option>Home Tuition 1-on-1</option>
                <option>Live online 1-on-1</option>
                <option>Classes LKG–3</option>
                <option>Classes 4–12</option>
                <option>IIT-JEE</option>
                <option>NEET</option>
                <option>Government exams</option>
                <option>UPSC</option>
                <option>Defence exams</option>
              </select>
              <label htmlFor="bookMessage">Message</label>
              <textarea id="bookMessage" name="message" rows="4" placeholder="Tell us about your child, grade level, and goals." />
              <button className="button solid" type="submit">Book a callback</button>
            </form>
          </section>
        </div>
      ) : null}

      {showStudentJoin ? (
        <div className="home-deck educator-auth-page student-page">
          <section className="edu-auth-shell">
            <div className="edu-auth-info">
              <h1>Join Crab Learn</h1>
              <p>You are one step away from a world-class 1-on-1 learning experience.</p>
              <ul>
                {studentJoinPoints.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="edu-auth-form">
              {authMode === "change-password" ? (
                <>
                  <h2>Change student password</h2>
                  <p className="edu-legal">{passwordRequestId ? "Enter the one-time password sent to you to finish updating your password." : "Choose a new password, then submit your account identifier for OTP verification."}</p>
                  <form className="edu-underline-form" onSubmit={handleChangePassword}>
                    <CountryPhoneField id="studentChangeId" name="identifier" label="Username or phone" defaultValue={loginIdentifier} placeholder="Mobile number or username" />
                    {passwordRequestId ? <><label htmlFor="studentCurrentPassword">One-time password<span>*</span></label><input id="studentCurrentPassword" name="currentPassword" type="text" inputMode="numeric" autoComplete="one-time-code" required /></> : null}
                    <label htmlFor="studentNewPassword">New password<span>*</span></label>
                    <input id="studentNewPassword" name="newPassword" type="password" minLength="6" required />
                    <button className="button coral student-login-btn" type="submit">{passwordRequestId ? "Update password" : "Send OTP"}</button>
                  </form>
                  <p className="student-switch"><button type="button" onClick={() => setAuthMode("login")}>Back to log in</button></p>
                </>
              ) : authMode === "login" ? (
                <>
                  <h2>Log in as a Student</h2>
                  <button
                    className="edu-google-btn"
                    type="button"
                    onClick={() => setLoginMessage("Use your username, email, or mobile number with password to continue.")}
                  >
                    Continue with Google
                  </button>
                  <p className="edu-or">or</p>
                  <form className="edu-underline-form" onSubmit={handleLoginSubmit}>
                    <label htmlFor="studentAuthId">Username<span>*</span></label>
                    <CountryPhoneField id="studentAuthId" name="phone" label="Username or phone" value={loginIdentifier} onChange={(event) => setLoginIdentifier(event.target.value)} placeholder="Email, username, or mobile number" />
                    <label htmlFor="studentAuthPassword">Password<span>*</span></label>
                    <div className="edu-password-row">
                      <input
                        id="studentAuthPassword"
                        name="password"
                        type={showAuthPassword ? "text" : "password"}
                        placeholder="Your password"
                        required
                      />
                      <button className="edu-eye" type="button" onClick={() => setShowAuthPassword((open) => !open)} aria-label="Show password">
                        {showAuthPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <label className="edu-remember">
                      <input type="checkbox" name="rememberMe" />
                      Remember me
                    </label>
                    <button className="button coral student-login-btn" type="submit">Log in</button>
                  </form>
                  <p className="edu-legal">By clicking Continue or Sign up, you agree to Crab Learn Terms of Use and Privacy Policy.</p>
                  <button className="edu-link" type="button" onClick={() => { setPasswordRequestId(""); setAuthMode("change-password"); }}>Forgot Password?</button>
                  <button className="edu-link" type="button" onClick={() => { setPasswordRequestId(""); setAuthMode("change-password"); }}>Change password</button>
                  <p className="student-switch">Don't have an account? <button type="button" onClick={() => setAuthMode("register")}>Sign up</button></p>
                </>
              ) : (
                <>
                  <h2>Sign up as a Student</h2>
                  <button
                    className="edu-google-btn"
                    type="button"
                    onClick={() => setLoginMessage("Use the form below to create your student account.")}
                  >
                    Continue with Google
                  </button>
                  <p className="edu-or">or</p>
                  <form className="edu-underline-form" onSubmit={handleRegisterSubmit}>
                    <label htmlFor="studentAuthName">Full name<span>*</span></label>
                    <input id="studentAuthName" name="fullName" type="text" placeholder="Your full name" required />
                    <CountryPhoneField id="studentAuthRegId" name="phone" label="Username or phone" placeholder="Email, username, or mobile number" />
                    <label htmlFor="studentAuthRegPassword">Password<span>*</span></label>
                    <div className="edu-password-row">
                      <input
                        id="studentAuthRegPassword"
                        name="password"
                        type={showAuthPassword ? "text" : "password"}
                        placeholder="Create a password"
                        required
                      />
                      <button className="edu-eye" type="button" onClick={() => setShowAuthPassword((open) => !open)} aria-label="Show password">
                        {showAuthPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <button className="button coral student-login-btn" type="submit">Sign up</button>
                  </form>
                  <p className="edu-legal">By clicking Continue or Sign up, you agree to Crab Learn Terms of Use and Privacy Policy.</p>
                  <p className="student-switch">Already have an account? <button type="button" onClick={() => setAuthMode("login")}>Log in</button></p>
                </>
              )}
              {loginMessage ? <p className="student-join-note">{loginMessage}</p> : null}
              {authMessage ? <p className="student-join-note">{authMessage}</p> : null}
            </div>
          </section>

          <section className="section student-tutors">
            <h2>Find Expert Tutors for Academic Excellence</h2>
            <p className="section-text">
              Crab Learn helps students improve grades and find tutors for Maths, Science, Coding, boards, and competitive exams through personalized 1-on-1 sessions.
            </p>
            <h3>Experienced Tutors for Personalized Learning</h3>
            <p className="section-text">Find the right tutor in minutes and start learning at your pace.</p>
            <div className="student-tutor-grid">
              {studentTutorCards.map((card) => (
                <article className="student-tutor-card" key={card.title}>
                  <span className="student-icon" aria-hidden="true">{card.icon}</span>
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="section student-advantage">
            <h2>The One-To-One Advantage</h2>
            <p className="section-text">Join hand-picked tutors for focused, student-centric learning.</p>
            <div className="advantage-grid">
              {studentAdvantages.map((item) => (
                <article className="advantage-chip" key={item.title}>
                  <span className="student-icon" aria-hidden="true">{item.icon}</span>
                  <h3>{item.title}</h3>
                </article>
              ))}
            </div>
          </section>
        </div>
        ) : null}

      <main>
        {activeMeeting ? (
          <section className="meet-room meet-room--overlay">
            <ErrorBoundary onReset={leaveMeeting}>
              <div className={`meet-focus${activeMeeting.kind === "m2m" ? " meet-focus--group" : ""}`}>
                <JunnuRoom
                  apiBaseUrl={apiBaseUrl}
                  roomId={junnuRoomId(activeMeeting)}
                  displayName={learnerName}
                  identifier={currentUser?.phone || currentUser?.full_name || ""}
                  password={sessionPasswordRef.current || ""}
                  title={meetingDisplayTitle(activeMeeting)}
                  waitingFor={activeMeeting.kind === "m2m" ? "other participants" : sessionPeopleLabel(activeMeeting)}
                  userRole={currentUser?.role}
                  onLeave={leaveMeeting}
                />
              </div>
            </ErrorBoundary>
          </section>
        ) : (
          <>
        {showPrivilegedWorkspaceTabs ? (
          <div className="workspace-switcher" role="navigation" aria-label="Supervisor workspaces">
            <button className={`portal-tab${activePortalRole === "student" && portalScreen !== "admin-dashboard" ? " active" : ""}`} type="button" onClick={() => openWorkspace("student")}>Student</button>
            <button className={`portal-tab${activePortalRole === "teacher" && portalScreen !== "admin-dashboard" ? " active" : ""}`} type="button" onClick={() => openWorkspace("teacher")}>Educator</button>
            <button className={`portal-tab${isAccountsPortal ? " active" : ""}`} type="button" onClick={() => openWorkspace("accounts")}>Accounts</button>
            <button className={`portal-tab${portalScreen === "admin-dashboard" ? " active" : ""}`} type="button" onClick={() => openWorkspace("admin")}>Admin</button>
          </div>
        ) : null}
        {portalScreen === "schedule" && currentUser && canScheduleClasses ? (
          <section className="schedule-desk">
            <div className="meet-room-bar">
              <div>
                <p className="section-kicker">Schedule</p>
                <h3>Set a Junnu class</h3>
                <p>Pick the student, start time, and length. The class then appears on Classes and Join.</p>
              </div>
              <button className="button portal-button" type="button" onClick={() => setPortalScreen("dashboard")}>Back to classes</button>
            </div>
            <article className="mobile-card class-card schedule-card">
              <p>{meetingMessage}</p>
              {renderScheduleForm()}
            </article>
            {(classPack.sessions || []).filter((item) => item.meeting_id).length ? (
              <article className="mobile-card class-card">
                <h4>Saved calls</h4>
                <ul className="roster-list">
                  {classPack.sessions.filter((item) => item.meeting_id).map((item) => (
                    <li key={item.id}>
                      <strong>{item.mode_label}: {item.subject}</strong>
                      <span>{formatClassWhen(item.starts_at)}</span>
                      <span>{sessionPeopleLabel(item)}</span>
                      <SessionJoinControls session={item} onJoin={joinScheduledClass} role={currentUserRole} now={nowTick} />
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </section>
        ) : showPortalPreviewSection ? (
        <section className={`section portal-section${isStudentLoginView ? " student-portal-section" : ""}${activePortalRole === "teacher" && portalScreen === "login" ? " educator-portal-section" : ""}${activePortalRole === "teacher" && isStudentWorkspaceView ? " educator-workspace-section" : ""}${isStudentWorkspaceView ? " student-workspace-section" : ""}`} id="portal">
          {isEducatorWorkspace || (isStudentWorkspaceView && activePortalRole === "student") ? (
            <div className="educator-workspace-toolbar">
              <button className="educator-workspace-brand" type="button" onClick={goToHomePage}>crablearn.in</button>
              <a href="#about" onClick={(event) => handleHomeHashNav(event, "about")}>About</a>
              <div className="educator-workspace-account">
                <span>{isEducatorWorkspace ? "Educator signed in" : "Student signed in"}</span>
                <strong>{`Welcome back, ${learnerName}.`}</strong>
                <button type="button" onClick={handleLogout}>Sign out</button>
              </div>
            </div>
          ) : null}
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
                  <button className={`portal-tab${portalScreen === "dashboard" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("dashboard")}>Classes</button>
                  <button className={`portal-tab${portalScreen === "live" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("live")}>Join</button>
                  {canScheduleClasses ? (
                    <button className={`portal-tab${portalScreen === "schedule" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("schedule")}>Schedule</button>
                  ) : null}
                  <button className={`portal-tab${portalScreen === "history" ? " active" : ""}`} type="button" onClick={() => setPortalScreen("history")}>History</button>
                </>
              ) : null}
            </div>
          </div>

          <div className={`portal-layout${isStudentLoginView ? " student-login-layout" : ""}${isStudentWorkspaceView ? " student-workspace-layout" : ""}${showStudentSupportContent ? "" : " portal-layout--single"}`}>
            <div className={`portal-phone${isStudentLoginView ? " student-login-phone" : ""}${isStudentWorkspaceView ? " student-workspace-phone" : ""}`}>
              <div className="phone-browser">{isAccountsPortal ? "crablearn.app/accounts" : "crablearn.app"}</div>

              {accountsAccessDenied ? (
                <section className="mobile-screen">
                  <article className="mobile-card">
                    <h3>Accounts access denied</h3>
                    <p>Student and educator accounts cannot open the accounts workspace. Sign in as supervisor to review fees, payouts, and reports.</p>
                  </article>
                </section>
              ) : null}

              {portalScreen === "login" && !accountsAccessDenied ? (
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
                      <small>{activePortalRole === "teacher" ? "Educator" : "Student"} · {classPack.month_label || "This month"}</small>
                    </div>
                  </div>
                  <div className="student-workspace-hero">
                    <div>
                      <p className="section-kicker">This month</p>
                      <h3>See scheduled classes and join when it is time.</h3>
                    </div>
                    <div className="student-workspace-mini-stats">
                      <div>
                        <strong>{Number(classPack.pending) || 0}</strong>
                        <span>pending</span>
                      </div>
                      <div>
                        <strong>{Number(classPack.eligible) || 0}</strong>
                        <span>eligible</span>
                      </div>
                    </div>
                  </div>
                  <article className="mobile-card class-card">
                    <div className="card-header-line">
                      <span className="badge success">Scheduled classes</span>
                    </div>
                    {!classPack.sessions?.length ? (
                      <p>No classes are scheduled yet. {Number(classPack.pending) || 0} pending of {Number(classPack.eligible) || 0} eligible this month.</p>
                    ) : (
                      <ul className="roster-list">
                        {classPack.sessions.map((session) => (
                          <li key={session.id}>
                            <strong>{session.subject || session.mode_label || "Junnu class"}</strong>
                            <span>{session.mode_label || "1 to 1"} · {formatClassWhen(session.starts_at)} · {session.platform}</span>
                            <span>{sessionPeopleLabel(session)}</span>
                            <SessionJoinControls session={session} onJoin={joinScheduledClass} role={currentUserRole} now={nowTick} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                  {canScheduleClasses ? (
                    <article className="mobile-card class-card">
                      <div className="card-header-line">
                        <span className="badge gold">Schedule Junnu</span>
                      </div>
                      <p>{meetingMessage}</p>
                      <button className="button portal-button blue" type="button" onClick={() => setPortalScreen("schedule")}>
                        Open schedule page
                      </button>
                    </article>
                  ) : null}
                  <div className="bottom-nav">
                    <button className="bottom-link active" type="button">Classes</button>
                    <button className="bottom-link" type="button" onClick={() => setPortalScreen("live")}>Join</button>
                    {canScheduleClasses ? (
                      <button className="bottom-link" type="button" onClick={() => setPortalScreen("schedule")}>Schedule</button>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {portalScreen === "live" ? (
                <section className="mobile-screen student-live-screen">
                  <div className="portal-topbar centered student-workspace-topbar">
                    <span>Menu</span>
                    <div>
                      <strong>Join class</strong>
                      <small>{classPack.month_label || "This month"} · {Number(classPack.pending) || 0} pending</small>
                    </div>
                  </div>
                  <div className="live-stack">
                    {!classPack.sessions?.length ? (
                      <article className="mobile-card live-card">
                        <h3>No class to join</h3>
                        <p>{Number(classPack.pending) || 0} pending of {Number(classPack.eligible) || 0} eligible this month.</p>
                      </article>
                    ) : (
                      classPack.sessions.map((session) => (
                        <article className="mobile-card live-card" key={session.id}>
                          <h3>{session.subject}</h3>
                          <p className="live-type">{session.mode_label || "1 to 1"} · {session.platform}</p>
                          <p>{formatClassWhen(session.starts_at)}</p>
                          <p>{sessionPeopleLabel(session)}</p>
                          <SessionJoinControls session={session} onJoin={joinScheduledClass} joinLabel="Join class" role={currentUserRole} now={nowTick} />
                        </article>
                      ))
                    )}
                  </div>
                  <div className="bottom-nav">
                    <button className="bottom-link" type="button" onClick={() => setPortalScreen("dashboard")}>Classes</button>
                    <button className="bottom-link active" type="button">Join</button>
                    {canScheduleClasses ? (
                      <button className="bottom-link" type="button" onClick={() => setPortalScreen("schedule")}>Schedule</button>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {portalScreen === "history" ? (
                <section className="mobile-screen scheduled-history-screen">
                  <div className="portal-topbar centered student-workspace-topbar">
                    <span>Menu</span>
                    <div>
                      <strong>Scheduled history</strong>
                      <small>Previous months</small>
                    </div>
                  </div>
                  <article className="mobile-card class-card">
                    <div className="card-header-line">
                      <span className="badge">Previous month</span>
                    </div>
                    {historyMonths.length ? (
                      <>
                        <label htmlFor="historyMonth">Choose a month</label>
                        <select id="historyMonth" value={historyMonth} onChange={(event) => setHistoryMonth(event.target.value)}>
                          {historyMonths.map((month) => (
                            <option key={month} value={month}>
                              {new Date(`${month}-01T00:00:00`).toLocaleString("en-IN", { month: "long", year: "numeric" })}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : <p>No scheduled history is available.</p>}
                  </article>
                  {historyMonth ? (
                    <article className="mobile-card class-card">
                      <h3>{new Date(`${historyMonth}-01T00:00:00`).toLocaleString("en-IN", { month: "long", year: "numeric" })} classes</h3>
                      <ul className="roster-list">
                        {classHistory.filter((session) => session.month_key === historyMonth).map((session) => (
                          <li key={session.id}>
                            <strong>{session.subject || session.mode_label || "Junnu class"}</strong>
                            <span>{session.mode_label || "1 to 1"} · {formatClassWhen(session.starts_at)} · {session.platform}</span>
                            <span>{sessionPeopleLabel(session)}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ) : null}
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
                    <div className="audit-header">
                      <div>
                        <span className="audit-eyebrow">Supervisor review desk</span>
                        <h4 className="admin-heading">Audit approvals</h4>
                        <p className="audit-intro">Validate new accounts and password requests before access changes are applied.</p>
                      </div>
                      <span className="audit-total">{pendingEducators.length + pendingStudents.length} open</span>
                    </div>
                    <div className="audit-summary-grid">
                      <button className={`audit-summary audit-summary--pink${auditFilter === "educators" ? " is-selected" : ""}`} type="button" onClick={() => setAuditFilter("educators")}>
                        <strong>{pendingEducators.length}</strong><span>New educators</span>
                      </button>
                      <button className={`audit-summary audit-summary--orange${auditFilter === "students" ? " is-selected" : ""}`} type="button" onClick={() => setAuditFilter("students")}>
                        <strong>{pendingStudents.length}</strong><span>New students</span>
                      </button>
                    </div>
                    <div className="audit-filter-row" role="tablist" aria-label="Audit request filters">
                      {[["all", "All requests"], ["educators", "Educators"], ["students", "Students"]].map(([value, label]) => (
                        <button key={value} className={`audit-filter${auditFilter === value ? " active" : ""}`} type="button" onClick={() => setAuditFilter(value)}>{label}</button>
                      ))}
                    </div>
                    <div className="audit-request-list">
                      {auditFilter !== "passwords" && (auditFilter === "all" || auditFilter === "educators") ? pendingEducators.map((user) => (
                        <div className="audit-request audit-request--educator" key={`educator-${user.id}`}>
                          <div className="audit-request-icon">ED</div>
                          <div className="audit-request-body"><strong>{user.full_name}</strong><span>Educator account · {user.phone}</span><small>Requested {new Date(user.created_at).toLocaleString()}</small></div>
                          <div className="audit-request-actions"><button className="button portal-button green" type="button" onClick={() => handleRowApproveUser(user.phone)}>Approve</button><button className="button portal-button red" type="button" onClick={() => handleRowDenyUser(user.phone)}>Decline</button></div>
                        </div>
                      )) : null}
                      {(auditFilter === "all" || auditFilter === "students") ? pendingStudents.map((user) => (
                        <div className="audit-request audit-request--student" key={`student-${user.id}`}>
                          <div className="audit-request-icon">ST</div>
                          <div className="audit-request-body"><strong>{user.full_name}</strong><span>Student account · {user.phone}</span><small>Requested {new Date(user.created_at).toLocaleString()}</small></div>
                          <div className="audit-request-actions"><button className="button portal-button green" type="button" onClick={() => handleRowApproveUser(user.phone)}>Approve</button><button className="button portal-button red" type="button" onClick={() => handleRowDenyUser(user.phone)}>Decline</button></div>
                        </div>
                      )) : null}
                      {((auditFilter === "educators" && !pendingEducators.length) || (auditFilter === "students" && !pendingStudents.length) || (auditFilter === "all" && !pendingEducators.length && !pendingStudents.length)) ? <p className="audit-empty">Everything is reviewed. New account requests will appear here after the next refresh.</p> : null}
                    </div>
                    <button className="button portal-button blue audit-refresh" type="button" onClick={handleAdminListUsers} disabled={adminUsersLoading}>Refresh audit queue</button>
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
                    <h4 className="admin-heading">Map Student with Educator</h4>
                    <p>{assignmentMessage}</p>
                    <form className="mobile-form" onSubmit={handleMapAssignment}>
                      <label htmlFor="mapStudentId">Student</label>
                      <select id="mapStudentId" value={mapStudentId} onChange={(event) => setMapStudentId(event.target.value)} required>
                        <option value="">Select student</option>
                        {directoryStudents.map((user) => (
                          <option key={user.id} value={user.id}>{`${user.full_name} (${user.phone})`}</option>
                        ))}
                      </select>
                      <label htmlFor="mapTeacherId">Educator</label>
                      <select id="mapTeacherId" value={mapTeacherId} onChange={(event) => setMapTeacherId(event.target.value)} required>
                        <option value="">Select educator</option>
                        {directoryTeachers.map((user) => (
                          <option key={user.id} value={user.id}>{`${user.full_name} (${user.phone})`}</option>
                        ))}
                      </select>
                      <button className="button portal-button blue" type="submit">Save mapping</button>
                    </form>
                    {mappedRoster.length === 0 ? (
                      <p>No mappings yet. Load users first if the lists above are empty.</p>
                    ) : (
                      <div>
                        {mappedRoster.map((item) => (
                          <div className="admin-user-row" key={item.id}>
                            <strong>{item.student?.full_name} → {item.teacher?.full_name}</strong>
                            <p>{`Student: ${item.student?.phone || "-"}`}</p>
                            <p>{`Educator: ${item.teacher?.phone || "-"}`}</p>
                            <button className="button portal-button red" type="button" onClick={() => handleRemoveAssignment(item.id)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {adminUsers.length ? (
                      <div className="admin-mapping-summary">
                        <h5>Student to educator view</h5>
                        {directoryStudents.map((student) => (
                          <p key={`student-map-${student.id}`}>
                            <strong>{student.full_name}</strong>: {studentMappings.get(Number(student.id))?.map((teacher) => teacher.full_name).join(", ") || "Not mapped"}
                          </p>
                        ))}
                        <h5>Educator to student view</h5>
                        {directoryTeachers.map((teacher) => (
                          <p key={`teacher-map-${teacher.id}`}>
                            <strong>{teacher.full_name}</strong>: {teacherMappings.get(Number(teacher.id))?.map((student) => student.full_name).join(", ") || "No students mapped"}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </article>

                  <article className="mobile-card admin-card">
                    <h4 className="admin-heading">Schedule Junnu</h4>
                    <p>{meetingMessage}</p>
                    <button className="button portal-button blue" type="button" onClick={() => setPortalScreen("schedule")}>
                      Open schedule page
                    </button>
                    {(classPack.sessions || []).filter((item) => item.meeting_id).length ? (
                      <div>
                        {classPack.sessions.filter((item) => item.meeting_id).map((item) => (
                          <div className="admin-user-row" key={item.id}>
                            <strong>{item.mode_label}: {item.subject}</strong>
                            <p>{formatClassWhen(item.starts_at)}</p>
                            <p>{sessionPeopleLabel(item)}</p>
                            <SessionJoinControls session={item} onJoin={joinScheduledClass} role={currentUserRole} now={nowTick} />
                          </div>
                        ))}
                      </div>
                    ) : null}
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
                        <option value="teacher">educator</option>
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
                      <li>Supervisor can open Student, Educator, and Accounts from one sign-in</li>
                      <li>Student and educator accounts cannot view accounts data</li>
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
          </>
        )}
      </main>
    </div>
  );
}

export default App;