import { useEffect, useRef } from "react";
import Lenis from '@studio-freight/lenis';
import { motion, useScroll, useTransform } from "framer-motion";
import { BrainCircuit, Play, Users, History, Zap, Shield, Infinity } from 'lucide-react';
import * as sound from "../../utils/audio";

const SkillTree3D = () => {
  const nodes = [
    { title: "Full-Stack Web Dev", z: 0, x: 0, y: 0, color: "#eab308", scale: 1.1 },
    { title: "HTML & CSS", z: 120, x: -140, y: -120, color: "#3b82f6", scale: 0.8 },
    { title: "JavaScript ES6+", z: 80, x: -80, y: -50, color: "#facc15", scale: 0.9 },
    { title: "React Ecosystem", z: -140, x: 160, y: -90, color: "#06b6d4", scale: 0.9 },
    { title: "Node.js & Express", z: -160, x: 80, y: 60, color: "#10b981", scale: 0.9 },
    { title: "PostgreSQL DB", z: 0, x: 180, y: 100, color: "#6366f1", scale: 0.85 },
    { title: "Auth & Security", z: 100, x: 120, y: -40, color: "#8b5cf6", scale: 0.8 },
    { title: "Docker & CI/CD", z: -100, x: -160, y: 60, color: "#ec4899", scale: 0.85 },
    { title: "WebSockets", z: 140, x: -50, y: 130, color: "#f43f5e", scale: 0.8 },
    { title: "System Architecture", z: -80, x: 0, y: -160, color: "#ff6a00", scale: 0.9 },
  ];

  return (
    <div style={{ width: "100%", height: "400px", perspective: "1000px", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* The Central Rotating Axis */}
      <motion.div
        style={{ width: "2px", height: "2px", position: "relative", transformStyle: "preserve-3d" }}
        animate={{ rotateY: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
      >
        {/* XY Plane SVG Connections */}
        <svg style={{ position: "absolute", top: "50%", left: "50%", overflow: "visible", transform: "translate(-50%, -50%) translateZ(0px)", width: "2px", height: "2px" }}>
          {nodes.map((node, i) => {
             if (node.x === 0 && node.y === 0) return null;
             return (
               <line key={`line-${i}`} x1="0" y1="0" x2={node.x} y2={node.y} stroke={`${node.color}50`} strokeWidth="1" strokeDasharray="4 4" />
             );
          })}
        </svg>

        {/* Z-Axis Glow Pillars */}
        {nodes.map((node, i) => {
          if (node.z === 0) return null;
          return (
            <div
              key={`pillar-${i}`}
              style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: "2px",
                height: `${Math.abs(node.z)}px`,
                background: `linear-gradient(to ${node.z > 0 ? 'top' : 'bottom'}, ${node.color}a0, transparent)`,
                transform: `translate(-50%, -50%) translate3d(${node.x}px, ${node.y}px, ${node.z / 2}px) rotateX(90deg)`,
                transformOrigin: "center center",
              }}
            />
          );
        })}
        
        {nodes.map((node, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: `translate(-50%, -50%) translate3d(${node.x}px, ${node.y}px, ${node.z}px) scale(${node.scale})`,
              transformStyle: "preserve-3d"
            }}
          >
             {/* The Billboarding Node (rotates inverse to parent so it always faces camera) */}
             <motion.div
               animate={{ rotateY: -360 }}
               transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
               style={{
                 background: `rgba(255,255,255,0.02)`,
                 border: `1px solid ${node.color}50`,
                 padding: "16px 24px",
                 borderRadius: "16px",
                 backdropFilter: "blur(12px)",
                 color: "#fff",
                 fontSize: "14px",
                 fontWeight: "600",
                 boxShadow: `inset 0 0 20px ${node.color}20, 0 0 30px ${node.color}20`,
                 whiteSpace: "nowrap",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center",
                 position: "relative"
               }}
             >
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: node.color, position: "absolute", top: "-6px", right: "-6px", boxShadow: `0 0 15px ${node.color}, 0 0 30px ${node.color}` }} />
                {node.title}
             </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};



export default function LandingPage({
  onStartSignUp,
  onStartSignIn,
  isMusicMuted,
  setIsMusicMuted,
  cycleMusic
}) {
  
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // Global Parallax Void
  const { scrollYProgress: globalScroll } = useScroll();
  const y1 = useTransform(globalScroll, [0, 1], [0, 1500]);
  const y2 = useTransform(globalScroll, [0, 1], [0, -1200]);
  const rotate1 = useTransform(globalScroll, [0, 1], [0, 360]);

  // Section 2: Pathfinder
  const pathfinderRef = useRef(null);
  const { scrollYProgress: pathfinderScroll } = useScroll({ target: pathfinderRef, offset: ["start 95%", "start 20%"] });
  const pfTextX = useTransform(pathfinderScroll, [0, 1], [-200, 0]);
  const pfCardX = useTransform(pathfinderScroll, [0, 1], [200, 0]);
  const pfOpacity = useTransform(pathfinderScroll, [0, 1], [0, 1]);

  // Section 3: Arena
  const arenaRef = useRef(null);
  const { scrollYProgress: arenaScroll } = useScroll({ target: arenaRef, offset: ["start 95%", "start 20%"] });
  const arTextY = useTransform(arenaScroll, [0, 1], [150, 0]);
  const arCardScale = useTransform(arenaScroll, [0, 1], [0.6, 1]);
  const arOpacity = useTransform(arenaScroll, [0, 1], [0, 1]);

  // Section 6: Chronos
  const chronosRef = useRef(null);
  const { scrollYProgress: chronosScroll } = useScroll({ target: chronosRef, offset: ["start 95%", "start 20%"] });
  const chTextX = useTransform(chronosScroll, [0, 1], [200, 0]);
  const chCardX = useTransform(chronosScroll, [0, 1], [-200, 0]);
  const chOpacity = useTransform(chronosScroll, [0, 1], [0, 1]);

  // Section 7: Profile
  const profileRef = useRef(null);
  const { scrollYProgress: profileScroll } = useScroll({ target: profileRef, offset: ["start 95%", "start 20%"] });
  const prTextY = useTransform(profileScroll, [0, 1], [-150, 0]);
  const prCardRotate = useTransform(profileScroll, [0, 1], [-30, 0]);
  const prOpacity = useTransform(profileScroll, [0, 1], [0, 1]);

  // NEW: Horizontal Text Track (Added dwell time)
  const horizontalRef = useRef(null);
  const { scrollYProgress: horizontalScroll } = useScroll({ target: horizontalRef, offset: ["start start", "end end"] });
  // [0, 0.1] = Stay on Slide 1 briefly. 
  // [0.1, 0.6] = Transition to Slide 2. 
  // [0.6, 1.0] = Stay locked on Slide 2 so the user can read it.
  const textXTransform = useTransform(horizontalScroll, [0, 0.1, 0.6, 1], ["0%", "0%", "-50%", "-50%"]);

  // Synthesis Section
  const synthesisRef = useRef(null);
  const { scrollYProgress: synScroll } = useScroll({ target: synthesisRef, offset: ["start 95%", "start 60%"] });
  const synScale = useTransform(synScroll, [0, 1], [0.8, 1]);
  const synOpacity = useTransform(synScroll, [0, 1], [0, 1]);

  const handleNavClick = (selector) => {
    sound.playClockTick();
    const el = document.querySelector(selector);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{
      width: "100%",
      background: "#050505", 
      color: "#ffffff",
      position: "relative",
      fontFamily: "'Outfit', sans-serif"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800;900&family=Playfair+Display:ital,wght@0,400;0,600;0,800;1,400&display=swap');
        
        body { margin: 0; background: #050505; }

        .grid-container { max-width: 1400px; margin: 0 auto; position: relative; width: 100%; }

        .grid-lines {
          position: fixed;
          top: 0; bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 1400px;
          display: flex;
          justify-content: space-between;
          pointer-events: none;
          z-index: 1;
        }
        .grid-line {
          width: 1px;
          height: 100vh;
          background: rgba(255, 255, 255, 0.04);
        }

        .serif { font-family: 'Playfair Display', serif; }

        .editorial-btn {
          background: transparent; color: #ffffff;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 16px 32px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px; font-weight: 600;
          letter-spacing: 2px; text-transform: uppercase;
          cursor: pointer; transition: all 0.3s ease;
          position: relative; overflow: hidden;
          white-space: nowrap;
        }
        .editorial-btn::before {
          content: ''; position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: #ffffff;
          transform: translateY(100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: -1;
        }
        .editorial-btn:hover::before { transform: translateY(0); }
        .editorial-btn:hover { color: #000000; border-color: #ffffff; }

        .editorial-btn-primary {
          background: #ff6a00; border-color: #ff6a00; color: #000;
        }
        .editorial-btn-primary::before { background: #e65c00; }
        .editorial-btn-primary:hover { color: #ffffff; border-color: #e65c00; }

        .horizontal-text-slide {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          padding: 0 40px;
          box-sizing: border-box;
          text-align: center;
        }

        /* Responsive Utilities */
        @media (max-width: 1024px) {
          .responsive-grid-2 { grid-template-columns: 1fr !important; gap: 40px !important; padding: 0 32px !important; }
          .hide-mobile { display: none !important; }
          .responsive-hero-text { font-size: 16vw !important; }
          .responsive-h2 { font-size: 44px !important; }
          .responsive-h3 { font-size: 36px !important; }
          .responsive-pad { padding: 80px 0 !important; }
          .responsive-btn-group { flex-direction: column; width: 100%; gap: 16px !important; }
          .responsive-btn-group button { width: 100%; }
          .header-nav { padding: 0 24px !important; }
          .grid-lines { display: none !important; }
          .responsive-card { padding: 24px !important; }
          .horizontal-text-slide { padding: 0 24px; }
          .massive-horizontal-text { font-size: 14vw !important; }
        }
      `}</style>

      {/* Parallax Background Void Elements */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
        <motion.div style={{ position: "absolute", top: "0%", left: "10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(255,106,0,0.08) 0%, transparent 70%)", filter: "blur(120px)", y: y1 }} />
        <motion.div style={{ position: "absolute", bottom: "10%", right: "10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(120px)", y: y2 }} />
        <motion.div className="hide-mobile" style={{ position: "absolute", top: "20%", right: "20%", width: "400px", height: "400px", border: "1px solid rgba(255,255,255,0.02)", borderRadius: "60px", rotate: rotate1, y: y2 }} />
      </div>

      <div className="grid-lines">
        <div className="grid-line" /><div className="grid-line" /><div className="grid-line" /><div className="grid-line" />
      </div>

      <header className="header-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "100px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 60px", zIndex: 1000,
        background: "linear-gradient(180deg, rgba(5,5,5,0.9) 0%, rgba(5,5,5,0) 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <img src="/logo.png" alt="Kaevrix" style={{ width: "32px", height: "32px", filter: "brightness(0) invert(1)" }} />
          <span className="hide-mobile" style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "2px" }}>KAEVRIX</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <button onClick={cycleMusic} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: "18px" }}>
            {isMusicMuted ? "🔇" : "🔊"}
          </button>
          <span className="hide-mobile" style={{ cursor: "pointer", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", textTransform: "uppercase" }} onClick={onStartSignIn}>Sign In</span>
          <button className="editorial-btn editorial-btn-primary" onClick={onStartSignUp}>Initialize</button>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 10 }}>

        {/* 1. Hero */}
        <section style={{ display: "flex", flexDirection: "column" }}>
          <div className="grid-container" style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "100px" }}>
            <div style={{ minHeight: "calc(100vh - 100px)", display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: "80px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ padding: "0 32px" }}>
                 <motion.h1 
                   initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} 
                   className="serif responsive-hero-text" 
                   style={{ fontSize: "9vw", fontWeight: "400", margin: 0, lineHeight: "1.1", letterSpacing: "-0.02em" }}
                 >
                   Stop Watching.<br/>
                   <i style={{ color: "#ff6a00" }}>Start Playing.</i>
                 </motion.h1>
                 
                 <motion.p 
                    initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }}
                    style={{ fontSize: "20px", color: "rgba(255,255,255,0.6)", marginTop: "40px", maxWidth: "800px", lineHeight: "1.6", fontWeight: "300" }}
                 >
                   Kaevrix turns education into an RPG, uniting AI skill trees, YouTube tutorials, and active-retrieval into a single closed loop where your study hours become undeniable proof of mastery. Keep scrolling down to journey through the ecosystem.
                 </motion.p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Pathfinder */}
        <section ref={pathfinderRef} className="responsive-pad" style={{ padding: "160px 0", overflow: "hidden" }}>
          <div className="grid-container responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", padding: "0 80px", alignItems: "center" }}>
             <motion.div style={{ x: pfTextX, opacity: pfOpacity }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", marginBottom: "32px" }}>
                  <BrainCircuit size={32} />
                </div>
                <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "4px", color: "#10b981", marginBottom: "16px" }}>01 // The Setup</div>
                <h3 className="serif responsive-h3" style={{ fontSize: "56px", fontWeight: "400", margin: "0 0 24px 0", lineHeight: "1.1" }}>Unlock your<br/>Skill Tree.</h3>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "16px" }}>
                  Don't blindly search YouTube and end up watching 3 hours of "Top 10 Productivity Hacks" instead of actually studying.
                </p>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  Tell Pathfinder what you want to learn—whether it's Calculus, Python, or History. Our AI instantly builds a bespoke roadmap out of the best tutorials on the internet. We give you a clear path from total beginner to advanced boss.
                </p>
             </motion.div>
             <motion.div style={{ x: pfCardX, opacity: pfOpacity }} className="responsive-card">
                <SkillTree3D />
             </motion.div>
          </div>
        </section>

        {/* 3. Arena */}
        <section ref={arenaRef} className="responsive-pad" style={{ padding: "160px 0", borderTop: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
          <div className="grid-container responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", padding: "0 80px", alignItems: "center" }}>
             <motion.div style={{ scale: arCardScale, opacity: arOpacity }} className="responsive-card">
                 <div style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(12px)" }}>
                   <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                     <div style={{ fontSize: "12px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>Today's Priorities</div>
                     <div style={{ padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", borderLeft: "4px solid #3b82f6", display: "flex", alignItems: "center", gap: "16px" }}>
                       <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #3b82f6" }} />
                       <span style={{ color: "#fff" }}>Master Thermodynamics</span>
                     </div>
                     <div style={{ padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px", borderLeft: "4px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: "16px", opacity: 0.5 }}>
                       <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.2)" }} />
                       <span>Review Calculus Cheatsheet</span>
                     </div>
                   </div>
                 </div>
             </motion.div>
             <motion.div style={{ y: arTextY, opacity: arOpacity }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(59,130,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b82f6", marginBottom: "32px" }}>
                  <Zap size={32} />
                </div>
                <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "4px", color: "#3b82f6", marginBottom: "16px" }}>02 // The Dashboard</div>
                <h3 className="serif responsive-h3" style={{ fontSize: "56px", fontWeight: "400", margin: "0 0 24px 0", lineHeight: "1.1" }}>Your Daily<br/>Quests.</h3>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  Looking at a 50-hour roadmap is terrifying. Every day, Arena gives you a clean execution dashboard showing exactly what video, cheatsheet, or resource you need to focus on next. Just click play and start your daily quest.
                </p>
             </motion.div>
          </div>
        </section>

        {/* 4 & 5. The Stacked Pages (Sanctum & Gathering) */}
        <div style={{ position: "relative" }}>
          
          <section style={{ 
            position: "sticky", top: 0, minHeight: "100vh", 
            background: "#080808", borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center"
          }}>
            <div className="grid-container responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", padding: "0 80px", width: "100%", alignItems: "center" }}>
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(255,106,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6a00", marginBottom: "32px" }}>
                  <Shield size={32} />
                </div>
                <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "4px", color: "#ff6a00", marginBottom: "16px" }}>03 // The Combat</div>
                <h3 className="serif responsive-h3" style={{ fontSize: "56px", fontWeight: "400", margin: "0 0 24px 0", lineHeight: "1.1" }}>The illusion of<br/>passive watching.</h3>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "16px" }}>
                  Watching a tutorial and feeling like a genius, only to completely blank out when it's time to take the test, is a universal tragedy.
                </p>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  In Sanctum, we embed your video safely. Watch it, generate AI notes, and vibe to focus music. But when the video ends, the real work begins. We hit you with high-stakes quizzes and conceptual questions you must write out by hand. We verify your capability, not your watch-time.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="responsive-card" style={{ background: "rgba(255,106,0,0.05)", border: "1px solid rgba(255,106,0,0.2)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(12px)" }}>
                 <div style={{ aspectRatio: "16/9", background: "#000", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", borderBottom: "4px solid #ff6a00" }}>
                   <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,106,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6a00" }}>
                     <Play size={40} fill="currentColor" style={{ marginLeft: "6px" }} />
                   </div>
                   <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,106,0,0.2)", color: "#ff6a00", padding: "4px 12px", borderRadius: "100px", fontSize: "12px", fontWeight: "bold" }}>ASSESSMENT PENDING</div>
                 </div>
              </motion.div>
            </div>
          </section>

          <section style={{ 
            position: "sticky", top: 0, minHeight: "100vh", 
            background: "#0c0c0c", borderTop: "1px solid rgba(139,92,246,0.3)",
            display: "flex", alignItems: "center", boxShadow: "0 -40px 80px rgba(0,0,0,0.9)"
          }}>
            <div className="grid-container responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", padding: "0 80px", width: "100%", alignItems: "center" }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="responsive-card" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(12px)", height: "300px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "16px" }}>
                 <Users size={48} color="#8b5cf6" />
                 <div style={{ fontSize: "20px", fontWeight: "bold", color: "#fff" }}>Lobby: Ancient History</div>
                 <div style={{ display: "flex", gap: "8px" }}>
                   {[1,2,3,4,5].map(i => <div key={i} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(139,92,246,0.2)", border: "1px solid #8b5cf6" }} />)}
                 </div>
                 <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "16px" }}>WAITING FOR AI CHALLENGE...</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6", marginBottom: "32px" }}>
                  <Users size={32} />
                </div>
                <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "4px", color: "#8b5cf6", marginBottom: "16px" }}>04 // The Multiplayer</div>
                <h3 className="serif responsive-h3" style={{ fontSize: "56px", fontWeight: "400", margin: "0 0 24px 0", lineHeight: "1.1" }}>LFG: Looking<br/>for Group.</h3>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "16px" }}>
                  Studying alone in a dark room at 3 AM is a guaranteed way to question your life choices and quit.
                </p>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  So we put you in a shared virtual room with 8 other people studying the exact same topic. Watch your own video, learn independently, but team up to answer group challenges when the AI drops them. It's a raid party, but for Neuroscience.
                </p>
              </motion.div>
            </div>
          </section>
        </div>

        {/* 6. Chronos */}
        <section ref={chronosRef} className="responsive-pad" style={{ padding: "160px 0", background: "#050505", borderTop: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 20, overflow: "hidden" }}>
          <div className="grid-container responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", padding: "0 80px", alignItems: "center" }}>
             <motion.div style={{ x: chTextX, opacity: chOpacity }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", marginBottom: "32px" }}>
                  <History size={32} />
                </div>
                <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "4px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>05 // The Accountability</div>
                <h3 className="serif responsive-h3" style={{ fontSize: "56px", fontWeight: "400", margin: "0 0 24px 0", lineHeight: "1.1" }}>Stats that<br/>actually matter.</h3>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  Most platforms tell you how many videos you watched. We track your momentum. Chronos calculates your study velocity, tracks your streaks, and estimates completion dates. And history perfectly parses everything you've learned into beautifully formatted PDFs. Build your own textbook as you play.
                </p>
             </motion.div>
             <motion.div style={{ x: chCardX, opacity: chOpacity }} className="responsive-card">
               <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(12px)" }}>
                 <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                   <div style={{ height: "24px", width: "40%", background: "rgba(255,255,255,0.2)", borderRadius: "4px" }} />
                   <div style={{ height: "1px", width: "100%", background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
                   <div style={{ height: "12px", width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
                   <div style={{ height: "12px", width: "90%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
                   <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                     <div style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", borderRadius: "100px", fontSize: "12px" }}>.PDF GENERATED</div>
                   </div>
                 </div>
               </div>
             </motion.div>
          </div>
        </section>

        {/* 7. Profile */}
        <section ref={profileRef} className="responsive-pad" style={{ padding: "160px 0", borderTop: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 20, overflow: "hidden" }}>
          <div className="grid-container responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", padding: "0 80px", alignItems: "center" }}>
             <motion.div style={{ rotate: prCardRotate, opacity: prOpacity, transformOrigin: "bottom left" }} className="responsive-card">
                 <div style={{ background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(12px)", position: "relative", overflow: "hidden" }}>
                   <div style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", background: "radial-gradient(circle, rgba(234,179,8,0.1) 0%, transparent 50%)", animation: "spin 10s linear infinite" }} />
                   <div style={{ position: "relative", zIndex: 1, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                     <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#111", border: "2px solid #eab308", display: "flex", alignItems: "center", justifyContent: "center" }}>
                       <img src="/logo.png" alt="Avatar" style={{ width: "40px", height: "40px", filter: "brightness(0) invert(1)" }} />
                     </div>
                     <div>
                       <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fff" }}>Lvl 42 Historian</div>
                       <div style={{ fontSize: "14px", color: "#eab308", marginTop: "4px" }}>Legendary Aura Unlocked</div>
                     </div>
                   </div>
                 </div>
             </motion.div>
             <motion.div style={{ y: prTextY, opacity: prOpacity }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(234,179,8,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#eab308", marginBottom: "32px" }}>
                  <Shield size={32} />
                </div>
                <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "4px", color: "#eab308", marginBottom: "16px" }}>06 // The Reward</div>
                <h3 className="serif responsive-h3" style={{ fontSize: "56px", fontWeight: "400", margin: "0 0 24px 0", lineHeight: "1.1" }}>Level up in<br/>real life.</h3>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "16px" }}>
                  Your resume says you know Calculus, but your Kaevrix profile proves it.
                </p>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  Every quiz passed and hour studied earns you XP. Your skill levels rise automatically based on actual proof of work, showing everyone exactly what you've learned and how long you've spent. And yes, if you grind enough, you unlock exclusive visual auras and profile cosmetics that can ONLY be earned by studying. Flex your brain.
                </p>
             </motion.div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* NEW: Horizontal Scroll Track (Only 2 slides, massive text) */}
        {/* ============================================================== */}
        <section ref={horizontalRef} style={{ height: "300vh", position: "relative", zIndex: 20 }}>
          <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", display: "flex", alignItems: "center" }}>
            <motion.div style={{ x: textXTransform, display: "flex", width: "200vw", height: "100%" }}>
              
              {/* Slide 1 */}
              <div className="horizontal-text-slide" style={{ background: "#050505" }}>
                 <h2 className="serif massive-horizontal-text" style={{ fontSize: "8vw", lineHeight: "1.1", margin: 0, fontWeight: 400 }}>
                   They built systems<br/><span style={{ color: "rgba(255,255,255,0.2)" }}>for consumption.</span>
                 </h2>
              </div>

              {/* Slide 2 */}
              <div className="horizontal-text-slide" style={{ background: "#050505" }}>
                 <h2 className="serif massive-horizontal-text" style={{ fontSize: "8vw", lineHeight: "1.1", margin: 0, fontWeight: 400 }}>
                   We built an ecosystem<br/><span style={{ color: "#ff6a00" }}>for capability.</span>
                 </h2>
              </div>

            </motion.div>
          </div>
        </section>
        {/* ============================================================== */}

        {/* 8. The Synthesis (Scroll-Linked Scale) */}
        <section id="truth" ref={synthesisRef} className="responsive-pad" style={{ padding: "180px 0", background: "rgba(5,5,5,1)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 20 }}>
          <div className="grid-container" style={{ textAlign: "center", padding: "0 32px" }}>
             <motion.div style={{ scale: synScale, opacity: synOpacity, display: "flex", justifyContent: "center", marginBottom: "40px" }}>
               <Infinity size={64} color="#ff6a00" />
             </motion.div>
             <motion.h2 
               style={{ scale: synScale, opacity: synOpacity, fontSize: "80px", lineHeight: "1.1", maxWidth: "1000px", margin: "0 auto", color: "#ffffff" }}
               className="serif responsive-h2"
             >
               The Closed Loop Ecosystem.
             </motion.h2>
             <motion.p
               style={{ opacity: synOpacity, fontSize: "20px", color: "rgba(255,255,255,0.6)", marginTop: "40px", maxWidth: "800px", margin: "40px auto 0", fontWeight: "300", lineHeight: "1.6" }}
             >
               This isn't just a roadmap generator, or a note-taking app, or a Pomodoro timer. It's a living ecosystem where every feature feeds another. The AI gives you direction. Sanctum forces retention. Chronos tracks momentum. And your Profile builds an undeniable public identity of mastery. Welcome to the endgame of learning.
             </motion.p>
          </div>
        </section>

        {/* 9. CTA Footer */}
        <section className="responsive-pad" style={{ padding: "0", position: "relative", zIndex: 20, background: "#050505" }}>
          <div className="grid-container" style={{ textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "160px 32px" }}>
            <motion.h2 
              initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} 
              className="serif responsive-h2" 
              style={{ fontSize: "100px", fontWeight: "400", margin: "0 0 48px 0", letterSpacing: "-0.02em" }}
            >
              Initiate Your<br/>Sequence.
            </motion.h2>
            <motion.div className="responsive-btn-group" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ display: "flex", gap: "24px", justifyContent: "center" }}>
              <button className="editorial-btn editorial-btn-primary" onClick={onStartSignUp}>Begin Onboarding</button>
              <button className="editorial-btn" onClick={onStartSignIn}>Access Profile</button>
            </motion.div>
          </div>

          <div className="grid-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "40px 32px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.3)", flexWrap: "wrap", gap: "16px" }}>
            <span>© 2026 KAEVRIX CORP.</span>
            <span>SYSTEMS ONLINE</span>
          </div>
        </section>

      </main>
    </div>
  );
}
