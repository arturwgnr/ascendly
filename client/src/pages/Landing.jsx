import { useEffect, useRef } from 'react';
import './Landing.css';

const ChevronRight = ({ size = 16 }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

const CheckBadge = ({ size = 14 }) => (
  <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

export default function Landing() {
  const navbarRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const navbar = navbarRef.current;
    const canvas = canvasRef.current;

    // Navbar scroll effect
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Reveal animations
    const revealEls = document.querySelectorAll('.landing-page .reveal');
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealObs.observe(el));

    // Hero elements visible immediately
    const heroRevealTimer = setTimeout(() => {
      document.querySelectorAll('#hero .reveal').forEach(el => el.classList.add('visible'));
    }, 100);

    // Particle canvas
    const ctx = canvas.getContext('2d');
    let W, H, rafId = null;
    const particles = [];

    const resize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const rand = (min, max) => Math.random() * (max - min) + min;
    const COUNT = Math.min(70, Math.floor(window.innerWidth / 18));
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: rand(0, 1), y: rand(0, 1),
        r: rand(0.8, 2.2),
        vx: rand(-0.06, 0.06), vy: rand(-0.04, -0.12),
        alpha: rand(0.08, 0.35),
        color: Math.random() > 0.5 ? '124,92,252' : '6,182,212',
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx / W * 100;
        p.y += p.vy / H * 100;
        if (p.y < -0.02) p.y = 1.02;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x > 1.02)  p.x = -0.02;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
      });
      rafId = requestAnimationFrame(draw);
    };

    const heroEl = document.getElementById('hero');
    const heroObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!rafId) draw(); }
      else { cancelAnimationFrame(rafId); rafId = null; }
    }, { threshold: 0 });
    heroObs.observe(heroEl);
    draw();

    // Smooth scroll for same-page anchor links
    const handleAnchorClick = (e) => {
      const href = e.currentTarget.getAttribute('href');
      if (!href || !href.startsWith('#') || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const anchors = document.querySelectorAll('.landing-page a[href^="#"]');
    anchors.forEach(a => a.addEventListener('click', handleAnchorClick));

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', resize);
      revealObs.disconnect();
      heroObs.disconnect();
      cancelAnimationFrame(rafId);
      clearTimeout(heroRevealTimer);
      anchors.forEach(a => a.removeEventListener('click', handleAnchorClick));
    };
  }, []);

  return (
    <div className="landing-page">
      {/* ── NAVBAR ── */}
      <nav ref={navbarRef}>
        <div className="container inner">
          <a href="#" className="logo">
            <span className="logo-icon">ᨒ</span>
            <span>Ascendly</span>
          </a>
          <a href="#cta" className="btn btn-primary" style={{ padding: '10px 22px', fontSize: '0.88rem' }}>
            Get Started
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="hero">
        <div className="hero-bg" />
        <canvas ref={canvasRef} id="particles" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="hero-content">
          <div className="hero-badge reveal">
            <span className="hero-badge-dot" />
            Self-improvement OS
          </div>

          <h1 className="hero-headline reveal reveal-delay-1">
            Stop guessing.<br />
            <span className="grad-text">Start growing.</span>
          </h1>

          <p className="hero-sub reveal reveal-delay-2">
            Ascendly brings your study sessions, daily habits, and goals into one place — so you can finally see the full picture of your progress.
          </p>

          <div className="hero-cta reveal reveal-delay-3">
            <a href="#cta" className="btn btn-primary">
              Start for free <ChevronRight />
            </a>
            <a href="#features" className="btn btn-ghost">See features</a>
          </div>

          <div className="hero-meta reveal reveal-delay-4">
            <span className="hero-meta-item"><CheckBadge /> Free to use</span>
            <span className="hero-meta-item"><CheckBadge /> No credit card</span>
            <span className="hero-meta-item"><CheckBadge /> Privacy first</span>
          </div>
        </div>

        <div className="scroll-hint">
          <div className="scroll-mouse" />
          <span>Scroll</span>
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section id="pain">
        <div className="container">
          <div className="reveal">
            <span className="section-label">Sound familiar?</span>
            <h2 className="section-title">The gaps nobody talks about</h2>
            <p className="section-sub">You're putting in effort. But effort without clarity is just noise.</p>
          </div>

          <div className="pain-grid">
            <div className="pain-card glass reveal reveal-delay-1">
              <div className="pain-number">01</div>
              <p className="pain-quote">You studied 2 hours but can't remember if it was enough</p>
              <span className="pain-tag">Study Awareness</span>
            </div>
            <div className="pain-card glass reveal reveal-delay-2">
              <div className="pain-number">02</div>
              <p className="pain-quote">You don't know where your time really goes</p>
              <span className="pain-tag">Time Visibility</span>
            </div>
            <div className="pain-card glass reveal reveal-delay-3">
              <div className="pain-number">03</div>
              <p className="pain-quote">Your goals exist but your days don't reflect them</p>
              <span className="pain-tag">Goal-Day Alignment</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features">
        <div className="container">
          <div className="reveal">
            <span className="section-label">What's inside</span>
            <h2 className="section-title">
              Everything you need.<br />
              <span className="grad-text">Nothing you don't.</span>
            </h2>
            <p className="section-sub">Four focused modules, one coherent system built around how you actually grow.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card glass reveal reveal-delay-1">
              <div className="feature-icon-wrap fi-study">📚</div>
              <div className="feature-name">Study Tracker</div>
              <p className="feature-desc">Log sessions with topic, duration, and difficulty. A GitHub-style heatmap shows your consistency at a glance — monthly goals keep you accountable.</p>
              <div className="feature-tag"><ChevronRight size={12} /> Heatmaps · Goals · History</div>
            </div>

            <div className="feature-card glass reveal reveal-delay-2">
              <div className="feature-icon-wrap fi-growth">🌱</div>
              <div className="feature-name">Daily Growth</div>
              <p className="feature-desc">Set daily missions aligned to your pillars. Track good and bad habits with time estimates — weekly and monthly reports show where your energy actually goes.</p>
              <div className="feature-tag" style={{ color: 'var(--green)' }}><ChevronRight size={12} /> Missions · Habits · Reports</div>
            </div>

            <div className="feature-card glass reveal reveal-delay-3">
              <div className="feature-icon-wrap fi-tasks">✅</div>
              <div className="feature-name">Task Board</div>
              <p className="feature-desc">Manage your backlog and drag tasks onto specific days. What you plan and what you do stay perfectly in sync — no automation, just clarity.</p>
              <div className="feature-tag" style={{ color: 'var(--accent)' }}><ChevronRight size={12} /> Backlog · Weekly board · Sync</div>
            </div>

            <div className="feature-card glass reveal reveal-delay-4">
              <div className="feature-icon-wrap fi-gamify">⚡</div>
              <div className="feature-name">Gamification</div>
              <p className="feature-desc">Earn XP, maintain streaks, and unlock badges as you build consistency. Subtle enough not to distract — meaningful enough to keep you coming back.</p>
              <div className="feature-tag" style={{ color: '#fbbf24' }}><ChevronRight size={12} /> XP · Streaks · Badges</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="howitworks">
        <div className="container">
          <div className="reveal">
            <span className="section-label">How it works</span>
            <h2 className="section-title">
              Three steps to<br />
              <span className="grad-text">visible progress</span>
            </h2>
            <p className="section-sub">No setup marathons. No complicated workflows. Just your day, structured.</p>
          </div>

          <div className="steps-wrapper">
            <div className="step step-1 reveal reveal-delay-1">
              <div className="step-num-wrap">📝</div>
              <div className="step-content">
                <div className="step-label">Step 01</div>
                <div className="step-title">Log your day</div>
                <p className="step-desc">Record what you studied, which habits you kept, and how your day felt. Takes under two minutes — stays with you forever.</p>
              </div>
            </div>

            <div className="step step-2 reveal reveal-delay-2">
              <div className="step-num-wrap">📊</div>
              <div className="step-content">
                <div className="step-label">Step 02</div>
                <div className="step-title">Track your habits</div>
                <p className="step-desc">See patterns emerge in your heatmap. Understand where your time goes. Watch your streaks grow and your habits solidify.</p>
              </div>
            </div>

            <div className="step step-3 reveal reveal-delay-3">
              <div className="step-num-wrap">🚀</div>
              <div className="step-content">
                <div className="step-label">Step 03</div>
                <div className="step-title">Watch your progress</div>
                <p className="step-desc">Monthly snapshots, historical comparisons, and XP milestones give you undeniable proof that you're moving forward.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── APP PREVIEW ── */}
      <section id="preview">
        <div className="container">
          <div style={{ textAlign: 'center' }} className="reveal">
            <span className="section-label">App preview</span>
            <h2 className="section-title">
              Your dashboard,<br />
              <span className="grad-text">always in context</span>
            </h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              Everything at a glance — no digging through menus to understand how you're doing.
            </p>
          </div>

          <div className="preview-wrapper reveal reveal-delay-1">
            <div className="preview-glow" />
            <div className="app-shell">

              <div className="app-titlebar">
                <div className="titlebar-dots">
                  <div className="titlebar-dot dot-red" />
                  <div className="titlebar-dot dot-yellow" />
                  <div className="titlebar-dot dot-green" />
                </div>
                <div className="titlebar-url">app.ascendly.io — Dashboard</div>
                <div style={{ width: '52px' }} />
              </div>

              <div className="app-body">
                <div className="app-sidebar">
                  <div className="sidebar-logo">ᨒ</div>
                  <div className="sidebar-icon active">⊞</div>
                  <div className="sidebar-icon">📚</div>
                  <div className="sidebar-icon">🌱</div>
                  <div className="sidebar-icon">✅</div>
                  <div className="sidebar-icon" style={{ marginTop: 'auto' }}>⚙</div>
                </div>

                <div className="app-main">
                  <div className="app-topbar">
                    <span className="topbar-left">
                      Good afternoon — today is{' '}
                      <span style={{ color: 'var(--primary2)' }}>Saturday, Apr 19</span>
                    </span>
                    <span className="topbar-date">Week 16 · Day 109 of 2026</span>
                  </div>

                  <div className="app-content">
                    <div className="widget w-heatmap">
                      <div className="widget-title">Activity — last 28 days</div>
                      <div className="heatmap-grid">
                        {['hm-2','hm-1','hm-3','hm-4','hm-2','hm-1','','hm-3','hm-4','hm-2','hm-3','hm-1','hm-4','hm-2',
                          'hm-1','hm-3','hm-2','','hm-4','hm-3','hm-2','hm-1','hm-4','hm-3','hm-2','hm-4','hm-1','hm-3']
                          .map((cls, i) => (
                            <div key={i} className={`hm-cell ${cls}`} />
                          ))}
                      </div>
                    </div>

                    <div className="widget w-xp">
                      <div className="widget-title">⚡ XP &amp; Level</div>
                      <div className="xp-level">Lv 12</div>
                      <div className="xp-label">Consistent Learner</div>
                      <div className="xp-bar-bg"><div className="xp-bar-fill" /></div>
                      <div className="xp-sub">2,340 / 3,000 XP · 🔥 14-day streak</div>
                    </div>

                    <div className="widget w-study">
                      <div className="widget-title">📚 Study</div>
                      <div className="study-big" style={{ color: 'var(--accent)' }}>21.5h</div>
                      <div className="study-sub">of 40h goal this month</div>
                      <div className="progress-bg"><div className="progress-fill" /></div>
                    </div>

                    <div className="widget w-missions">
                      <div className="widget-title">Today's Missions</div>
                      {[
                        { done: true,  label: 'Morning routine' },
                        { done: true,  label: '2h deep work session' },
                        { done: true,  label: 'Read 20 pages' },
                        { done: false, label: 'Evening review' },
                        { done: false, label: 'Log study session' },
                      ].map(({ done, label }) => (
                        <div className="mission-item" key={label}>
                          <div className={`mission-check ${done ? 'mc-done' : 'mc-todo'}`}>
                            {done ? '✓' : ''}
                          </div>
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section id="cta">
        <div className="container">
          <div className="cta-inner">
            <div className="reveal">
              <span className="section-label">Ready?</span>
              <h2 className="cta-headline">
                Your next level<br />
                <span className="grad-text">starts today.</span>
              </h2>
              <p className="cta-sub">Join Ascendly and build the life you keep planning for.</p>
            </div>
            <div className="reveal reveal-delay-1">
              <a href="/register" className="btn btn-primary" style={{ fontSize: '1.05rem', padding: '16px 36px' }}>
                Get started — it's free <ChevronRight size={18} />
              </a>
              <div className="cta-note">No credit card required · Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="container footer-inner">
          <a href="#" className="footer-brand">
            <span className="footer-brand-icon">ᨒ</span>
            <span>Ascendly</span>
          </a>
          <span className="footer-copy">© 2026 Ascendly. Built for those who choose to grow.</span>
        </div>
      </footer>
    </div>
  );
}
