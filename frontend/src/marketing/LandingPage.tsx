import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight, ArrowUpRight, BookOpen, Camera, Check, CheckCircle2,
  ChevronLeft, ChevronRight, ClipboardCheck, Code2, Download,
  FileSpreadsheet, Github, GraduationCap, Menu, ScanFace, ShieldCheck,
  Sparkles, Users, X,
} from "lucide-react";
import "./landing.css";

const REPO = "https://github.com/krishujeniya/Hajree";
const CLONE = "git clone https://github.com/krishujeniya/Hajree.git";

const appUrl = (p: string = ""): string => {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  const path = p.replace(/^\//, "");
  if (!path) return base ? `${base}/` : "/";
  return base ? `${base}/${path}` : `/${path}`;
};

const workflow = [
  {
    step: "01", title: "Set up", caption: "Build the classroom",
    description: "Administrators manage accounts, courses, and student rosters before the first lecture.",
    action: "Create a course",
    rows: ["Create course", "Assign faculty", "Enroll students"],
    icon: Users,
  },
  {
    step: "02", title: "Capture", caption: "Keep the moment",
    description: "Faculty can submit a classroom image for recognition or take attendance manually.",
    action: "Review a capture",
    rows: ["Take a photo", "Review suggestions", "Confirm attendance"],
    icon: ScanFace,
  },
  {
    step: "03", title: "Understand", caption: "See the full picture",
    description: "Students see their own standing. Faculty can inspect attendance and export registers.",
    action: "Export a register",
    rows: ["Review history", "Check standing", "Export CSV / PDF"],
    icon: FileSpreadsheet,
  },
] as const;

const roles = [
  {
    id: "admin", label: "Administration", title: "The whole institution, in view.",
    description: "Manage the people, subjects and enrollment records that give each attendance entry its context.",
    items: ["User and role administration", "Course and subject assignment", "Student roster enrollment", "AI service health diagnostics"],
    icon: Users,
    tag: "Operations",
  },
  {
    id: "faculty", label: "Faculty", title: "More time teaching. Less time taking roll.",
    description: "Create lectures, verify recognition suggestions, make manual corrections, and export the final register.",
    items: ["Image-assisted attendance capture", "Human review and manual roll call", "Course attendance overview", "PDF and CSV exports"],
    icon: Camera,
    tag: "Classroom",
  },
  {
    id: "student", label: "Students", title: "Your attendance. Never a guessing game.",
    description: "View personal attendance and lecture history, with access to self-service face profile enrollment.",
    items: ["Personal attendance standing", "Subject-wise breakdown", "Chronological lecture history", "Face profile enrollment and reset"],
    icon: GraduationCap,
    tag: "Self-service",
  },
] as const;

const faqs = [
  {
    q: "Is Hajree open source?",
    a: "Yes. Hajree is available under the MIT license. You can review the code, run it locally, and adapt it subject to the license.",
  },
  {
    q: "Does recognition mark attendance automatically?",
    a: "Hajree supports face-matching suggestions from a classroom image, with a faculty review workflow. Manual attendance is also available. Recognition can make mistakes and should not replace human verification.",
  },
  {
    q: "Is anti-spoofing enabled by default?",
    a: "No. The backend configuration currently defaults face anti-spoofing to off. Administrators should evaluate and explicitly configure it for their deployment rather than assume liveness protection is active.",
  },
  {
    q: "Can I export attendance records?",
    a: "The backend includes CSV and PDF attendance export endpoints for authorized users. The faculty interface provides reporting and export tools.",
  },
  {
    q: "How do I deploy Hajree?",
    a: "Clone the repository and run python run.py for local development, or build and deploy the included Docker configuration. Set strong production credentials and review privacy, consent, and security requirements before use with real biometric data.",
  },
] as const;

function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={"hm-brand" + (light ? " hm-brand--light" : "")}>
      <img src="/logo.svg" alt="" width="36" height="36" />
      <span>hajree<span className="hm-brand-dot">.</span></span>
    </span>
  );
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stage, setStage] = useState(0);
  const [role, setRole] = useState(0);
  const [slide, setSlide] = useState(0);
  const [copyState, setCopyState] = useState("Copy command");
  const copyTimer = useRef<number | null>(null);

  useEffect(() => {
    document.title = "Hajree | Attendance with clarity";
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", "Hajree is an open-source attendance platform with faculty-verified face recognition, manual roll call, exports, and role-based portals.");
    return () => { if (copyTimer.current !== null) window.clearTimeout(copyTimer.current); };
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const elements = document.querySelectorAll(".hm-page [data-reveal]");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("hm-is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const copyClone = async () => {
    if (!navigator.clipboard?.writeText) {
      setCopyState("Copy unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(CLONE);
      setCopyState("Copied!");
    } catch {
      setCopyState("Copy unavailable");
    }
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopyState("Copy command"), 2200);
  };

  const current = workflow[stage];
  const selectedRole = roles[role];

  return (
    <div className="hm-page">
      <a className="hm-skip" href="#main">Skip to content</a>
      <div className="hm-announcement">
        <span className="hm-announcement-dot" aria-hidden="true" />
        Built in the open, for better classroom workflows
        <a href={REPO} target="_blank" rel="noopener noreferrer">Explore the repository <ArrowUpRight size={13} aria-hidden="true" /></a>
      </div>
      <header className="hm-header">
        <div className="hm-container hm-header-inner">
          <a href={appUrl("")} aria-label="Hajree home" className="hm-brand-link"><Brand /></a>
          <button
            type="button"
            className="hm-menu-button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="hm-site-nav"
            onClick={() => setMenuOpen(!menuOpen)}
          >{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          <nav id="hm-site-nav" aria-label="Main navigation" className={"hm-nav" + (menuOpen ? " hm-nav--open" : "")}>
            <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#roles" onClick={() => setMenuOpen(false)}>For everyone</a>
            <a href="#features" onClick={() => setMenuOpen(false)}>Capabilities</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href={REPO + "/blob/main/README.md"} target="_blank" rel="noopener noreferrer">Docs <ArrowUpRight size={13} /></a>
          </nav>
          <div className="hm-header-actions">
            <a href={appUrl("login")} className="hm-signin">Sign in</a>
            <a href={appUrl("register")} className="hm-pill hm-pill--dark">Get started <ArrowUpRight size={16} /></a>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="hm-hero hm-container" aria-labelledby="hm-title">
          <div className="hm-hero-copy" data-reveal>
            <h1 id="hm-title">Attendance your faculty can verify.</h1>
            <p>Capture classroom attendance, review recognition suggestions and confirm the register. Faculty stay in control of the final record.</p>
            <div className="hm-hero-actions">
              <a href={appUrl("login")} className="hm-pill hm-pill--dark hm-pill--large">Open Hajree <ArrowUpRight size={17} /></a>
              <a href="#how-it-works" className="hm-pill hm-pill--outline hm-pill--large">See how it works <ArrowRight size={17} /></a>
            </div>
            <div className="hm-hero-footnote">
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Open source · Human-reviewed recognition · Self-hostable</span>
            </div>
          </div>
          <div className="hm-hero-art hm-hero-art--register" aria-label="Illustrative faculty attendance review">
            <div className="hm-register-preview">
              <div className="hm-register-head"><div><small>Faculty workspace · Example</small><h2>Review attendance</h2></div><span className="hm-register-state">Needs faculty confirmation</span></div>
              <div className="hm-register-meta"><span>Course attendance</span><span>Illustrative records, not live data</span></div>
              <div className="hm-register-row hm-register-row--head"><span>Student</span><span>Recognition suggestion</span><span>Faculty action</span></div>
              <div className="hm-register-row"><span>Student A</span><span>Suggested present</span><strong>Review</strong></div>
              <div className="hm-register-row"><span>Student B</span><span>Needs verification</span><strong>Review</strong></div>
              <div className="hm-register-row"><span>Student C</span><span>Manual attendance</span><strong>Review</strong></div>
              <div className="hm-register-foot"><ShieldCheck size={19} aria-hidden="true"/><span>Faculty review remains the final step before attendance is confirmed.</span></div>
            </div>
          </div>
        </section>

        <div className="hm-proof-strip">
          <div className="hm-container hm-proof-inner">
            <span>DESIGNED FOR THE COMPLETE CLASSROOM</span>
            <div><Users size={18}/> Administration</div>
            <div><Camera size={18}/> Faculty</div>
            <div><GraduationCap size={19}/> Students</div>
            <div><FileSpreadsheet size={18}/> Reporting</div>
          </div>
        </div>

        <section id="how-it-works" className="hm-section hm-container hm-workflow" aria-labelledby="hm-work-title">
          <div className="hm-section-top" data-reveal>
            <div><span className="hm-overline">01 / THE FLOW</span><h2 id="hm-work-title">From first roll call<br/>to final record.</h2></div>
            <p>A connected three-step workflow, with people in control at every decision point.</p>
          </div>
          <div className="hm-stage-layout">
            <div className="hm-stage-tabs" role="tablist" aria-label="Attendance workflow stages">
              {workflow.map((item, index) => (
                <button
                  key={item.step}
                  role="tab"
                  type="button"
                  id={"hm-stage-tab-" + index}
                  aria-selected={stage === index}
                  aria-controls="hm-stage-panel"
                  tabIndex={stage === index ? 0 : -1}
                  className={"hm-stage-tab" + (stage === index ? " hm-stage-tab--active" : "")}
                  onClick={() => setStage(index)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                      event.preventDefault();
                      const next = (index + 1) % workflow.length;
                      setStage(next);
                      document.getElementById("hm-stage-tab-" + next)?.focus();
                    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                      event.preventDefault();
                      const prev = (index - 1 + workflow.length) % workflow.length;
                      setStage(prev);
                      document.getElementById("hm-stage-tab-" + prev)?.focus();
                    }
                  }}
                >
                  <span className="hm-tab-number">{item.step}</span>
                  <span><strong>{item.title}</strong><small>{item.caption}</small></span>
                  <ArrowUpRight size={19} aria-hidden="true"/>
                </button>
              ))}
              <p className="hm-stage-footnote">No biometric result is final without appropriate verification.</p>
            </div>
            <div className="hm-stage-panel" id="hm-stage-panel" role="tabpanel" aria-labelledby={"hm-stage-tab-" + stage} key={stage}>
              <div className="hm-stage-panel-top"><span>HAJREE / WORKFLOW</span><span>STEP {current.step} OF 03</span></div>
              <div className="hm-stage-icon"><current.icon size={33} strokeWidth={1.5} /></div>
              <span className="hm-stage-kicker">{current.caption}</span>
              <h3>{current.title} with confidence.</h3>
              <p>{current.description}</p>
              <div className="hm-stage-checks">
                {current.rows.map((row, index) => <div key={row}><span className="hm-check"><Check size={14}/></span><span>{row}</span><small>0{index + 1}</small></div>)}
              </div>
              <a href={appUrl("login")} className="hm-stage-link">{current.action} <ArrowUpRight size={16}/></a>
            </div>
          </div>
        </section>

        <section id="roles" className="hm-section hm-roles-band" aria-labelledby="hm-roles-title">
          <div className="hm-container">
            <div className="hm-section-top" data-reveal><div><span className="hm-overline">02 / MADE FOR PEOPLE</span><h2 id="hm-roles-title">One platform.<br/>Three perspectives.</h2></div><p>Useful information looks different depending on who's asking. Hajree keeps each view focused on the work that matters.</p></div>
            <div className="hm-role-chips" role="tablist" aria-label="Explore user portals">
              {roles.map((item, index) => <button key={item.id} type="button" role="tab" id={"hm-role-tab-" + index} aria-controls="hm-role-panel" aria-selected={role === index} tabIndex={role === index ? 0 : -1} onClick={() => setRole(index)} onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                  event.preventDefault();
                  const next = (index + (event.key === "ArrowRight" ? 1 : roles.length - 1)) % roles.length;
                  setRole(next);
                  document.getElementById("hm-role-tab-" + next)?.focus();
                }
              }} className={"hm-role-chip" + (role === index ? " hm-role-chip--active" : "")}>{React.createElement(item.icon, { size: 17 })}{item.label}</button>)}
            </div>
            <div className="hm-role-panel" id="hm-role-panel" role="tabpanel" aria-labelledby={"hm-role-tab-" + role} key={role}>
              <div className="hm-role-copy"><span className="hm-overline">{selectedRole.tag}</span><h3>{selectedRole.title}</h3><p>{selectedRole.description}</p><a href={appUrl("login")} className="hm-pill hm-pill--dark">Explore the portal <ArrowUpRight size={16}/></a></div>
              <div className="hm-role-capabilities"><span className="hm-card-label">IN YOUR WORKSPACE</span>{selectedRole.items.map((item) => <div key={item}><span className="hm-mini-check"><Check size={15}/></span>{item}<ArrowUpRight size={15} aria-hidden="true"/></div>)}</div>
            </div>
          </div>
        </section>

        <section id="features" className="hm-section hm-container hm-features" aria-labelledby="hm-features-title">
          <div className="hm-section-top" data-reveal><div><span className="hm-overline">03 / THE TOOLKIT</span><h2 id="hm-features-title">Less admin.<br/>More awareness.</h2></div><p>Practical tools for the real tasks of attendance management—without pretending AI is infallible.</p></div>
          <div className="hm-feature-grid">
            <article className="hm-feature-card hm-feature-card--large" data-reveal><div className="hm-feature-symbol"><ScanFace size={25}/></div><div><span className="hm-overline">IMAGE-ASSISTED</span><h3>Capture a classroom.<br/>Review each match.</h3><p>Use group photo recognition as an assistive tool, with faculty confirmation and manual correction.</p></div><div className="hm-recognition-art" aria-hidden="true"><span className="hm-rec-face hm-rec-face--a"><ScanFace/></span><span className="hm-rec-line"/><span className="hm-rec-face hm-rec-face--b"><Check/></span></div></article>
            <article className="hm-feature-card hm-feature-card--dark" data-reveal><div className="hm-feature-symbol"><ClipboardCheck size={25}/></div><div><span className="hm-overline">A HUMAN ALTERNATIVE</span><h3>Manual roll call.<br/>Always available.</h3><p>Record and correct attendance without depending on the camera.</p></div><span className="hm-feature-art-word" aria-hidden="true">P / A</span></article>
            <article className="hm-feature-card" data-reveal><div className="hm-feature-symbol"><FileSpreadsheet size={25}/></div><div><span className="hm-overline">YOUR DATA, READY</span><h3>Registers that<br/>move with you.</h3><p>Review course-level attendance and export records in PDF or CSV.</p></div><div className="hm-file-icons" aria-hidden="true"><span>CSV</span><span>PDF</span></div></article>
          </div>

          <div className="hm-carousel-head"><div><span className="hm-overline">04 / FOCUS AREAS</span><h3>Explore the details.</h3></div><div className="hm-carousel-actions"><span aria-live="polite">{String(slide + 1).padStart(2, "0")} / 03</span><button type="button" aria-label="Previous capability" disabled={slide === 0} onClick={() => setSlide(slide - 1)}><ChevronLeft size={19}/></button><button type="button" aria-label="Next capability" disabled={slide === 2} onClick={() => setSlide(slide + 1)}><ChevronRight size={19}/></button></div></div>
          <div className="hm-carousel" role="region" aria-roledescription="carousel" aria-label="Capability highlights">
            <div className="hm-carousel-track" style={{ transform: "translateX(-" + (slide * 100) + "%)" }}>
              <article className="hm-carousel-slide" role="group" aria-roledescription="slide" aria-label="1 of 3"><div className="hm-slide-symbol"><ShieldCheck size={32}/></div><span>IDENTITY & ACCESS</span><h4>Role-aware by design.</h4><p>Admin, faculty and student access are separated in the API and the interface.</p></article>
              <article className="hm-carousel-slide" role="group" aria-roledescription="slide" aria-label="2 of 3"><div className="hm-slide-symbol"><BookOpen size={32}/></div><span>ACADEMIC CONTEXT</span><h4>Organized by course.</h4><p>Subjects, rosters and individual lectures provide a clear structure for attendance.</p></article>
              <article className="hm-carousel-slide" role="group" aria-roledescription="slide" aria-label="3 of 3"><div className="hm-slide-symbol"><Sparkles size={32}/></div><span>OPTIONAL CONFIGURATION</span><h4>Control the deployment.</h4><p>Self-host the open-source backend, and configure security, storage and recognition behavior.</p></article>
            </div>
          </div>
        </section>

        <section className="hm-developer" aria-labelledby="hm-dev-title">
          <div className="hm-container hm-developer-inner">
            <div data-reveal><span className="hm-overline">05 / OPEN BY DEFAULT</span><h2 id="hm-dev-title">Built to be<br/>yours to run.</h2><p>Explore the FastAPI backend, React frontend and the code behind the experience. Hajree is MIT licensed and self-hostable.</p><a href={REPO} target="_blank" rel="noopener noreferrer" className="hm-pill hm-pill--light"><Github size={17}/> View on GitHub <ArrowUpRight size={16}/></a></div>
            <div className="hm-terminal"><div className="hm-terminal-top"><span><i/><i/><i/></span><span>GET STARTED / TERMINAL</span><Code2 size={17}/></div><div className="hm-terminal-command"><span>$</span><code>{CLONE}</code></div><div className="hm-terminal-command"><span>$</span><code>cd Hajree &amp;&amp; python run.py</code></div><button type="button" onClick={copyClone} className="hm-copy"><ClipboardCheck size={16}/>{copyState}</button><p role="status" aria-live="polite" className="hm-copy-status">{copyState === "Copied!" ? "Clone command copied to clipboard." : copyState === "Copy unavailable" ? "Select the command to copy it manually." : ""}</p></div>
          </div>
        </section>

        <section id="faq" className="hm-section hm-container hm-faq" aria-labelledby="hm-faq-title">
          <div className="hm-faq-heading" data-reveal><span className="hm-overline">06 / GOOD TO KNOW</span><h2 id="hm-faq-title">Questions? <span>Answered.</span></h2><p>What you should know before using biometric attendance with real people.</p></div>
          <div className="hm-faq-items">{faqs.map(({q, a}) => <details key={q} className="hm-faq-item"><summary>{q}<span className="hm-faq-plus" aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div>
        </section>

        <section className="hm-final-cta"><div className="hm-container"><span className="hm-overline">YOUR CLASSROOM IS NEXT</span><h2>Make attendance<br/>feel effortless<span>.</span></h2><p>Start with the open-source app, then make it work for your institution.</p><div><a href={appUrl("login")} className="hm-pill hm-pill--light hm-pill--large">Open the app <ArrowUpRight size={17}/></a><a href={appUrl("register")} className="hm-pill hm-pill--on-dark hm-pill--large">Student registration <ArrowRight size={17}/></a></div></div></section>
      </main>

      <footer className="hm-footer"><div className="hm-container"><div className="hm-footer-main"><div><a href={appUrl("")} aria-label="Hajree home"><Brand light/></a><p>Clarity for every classroom.</p></div><div className="hm-footer-links"><a href="#how-it-works">How it works</a><a href="#roles">Portals</a><a href={REPO + "/blob/main/README.md"} target="_blank" rel="noopener noreferrer">Documentation</a><a href={REPO} target="_blank" rel="noopener noreferrer">Source code</a><a href={REPO + "/blob/main/LICENSE"} target="_blank" rel="noopener noreferrer">MIT license</a></div></div><div className="hm-footer-bottom"><span>© {new Date().getFullYear()} Hajree · Open source.</span><span>Designed for verified, human-centered attendance.</span></div></div></footer>
    </div>
  );
}

export default LandingPage;
