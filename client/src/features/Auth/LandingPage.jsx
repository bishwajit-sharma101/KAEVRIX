import { useEffect } from "react";
import Lenis from '@studio-freight/lenis';
import { motion, useScroll, useTransform } from "framer-motion";
import { BrainCircuit, Play, Swords, History, Zap } from 'lucide-react';
import * as sound from "../../utils/audio";

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

  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 1000]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -800]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 360]);

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
      overflowX: "hidden",
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

        /* Responsive Utilities */
        @media (max-width: 1024px) {
          .responsive-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding: 0 32px !important;
          }
          .responsive-grid-3 {
            grid-template-columns: 1fr !important;
          }
          .responsive-grid-3 > div {
            border-right: none !important;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            text-align: center;
          }
          .hide-mobile {
            display: none !important;
          }
          .responsive-hero-text {
            font-size: 14vw !important;
          }
          .responsive-h2 {
            font-size: 40px !important;
          }
          .responsive-h3 {
            font-size: 36px !important;
          }
          .responsive-number {
            font-size: 80px !important;
          }
          .responsive-pad {
            padding: 80px 0 !important;
          }
          .responsive-btn-group {
            flex-direction: column;
            width: 100%;
            gap: 16px !important;
          }
          .responsive-btn-group button {
            width: 100%;
          }
          .header-nav {
            padding: 0 24px !important;
          }
          .header-buttons {
            gap: 12px !important;
          }
          .grid-lines {
            display: none !important; 
          }
          .responsive-card {
            padding: 24px !important;
          }
        }
      `}</style>

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, pointerEvents: "none" }}>
        <motion.div style={{ position: "absolute", top: "0%", left: "10%", width: "60vw", height: "60vw", background: "radial-gradient(circle, rgba(255,106,0,0.12) 0%, transparent 70%)", filter: "blur(120px)", y: y1 }} />
        <motion.div style={{ position: "absolute", bottom: "10%", right: "10%", width: "50vw", height: "50vw", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", filter: "blur(120px)", y: y2 }} />
        <motion.div className="hide-mobile" style={{ position: "absolute", top: "40%", right: "20%", width: "300px", height: "300px", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "40px", rotate: rotate1, y: y2 }} />
        <motion.div className="hide-mobile" style={{ position: "absolute", top: "70%", left: "15%", width: "400px", height: "400px", border: "1px dashed rgba(255,106,0,0.1)", borderRadius: "50%", rotate: rotate1, y: y1 }} />
      </div>

      <div className="grid-lines">
        <div className="grid-line" />
        <div className="grid-line" />
        <div className="grid-line" />
        <div className="grid-line" />
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
        
        <nav className="hide-mobile" style={{ display: "flex", gap: "48px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.6)" }}>
          <span style={{ cursor: "pointer" }} onClick={() => handleNavClick("#truth")}>The Truth</span>
          <span style={{ cursor: "pointer" }} onClick={() => handleNavClick("#features")}>How It Works</span>
        </nav>

        <div className="header-buttons" style={{ display: "flex", alignItems: "center", gap: "24px" }}>
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
            
            <div style={{ height: "calc(100vh - 100px)", display: "flex", alignItems: "flex-end", paddingBottom: "80px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ padding: "0 32px" }}>
                 <motion.h1 
                   initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} 
                   className="serif responsive-hero-text" 
                   style={{ fontSize: "8vw", fontWeight: "400", margin: 0, lineHeight: "1.1", letterSpacing: "-0.02em" }}
                 >
                   Stop Watching.<br/>
                   <i style={{ color: "#ff6a00" }}>Start Playing.</i>
                 </motion.h1>
              </div>
            </div>
            
            <div className="responsive-grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ padding: "60px 32px", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="serif responsive-number" style={{ fontSize: "120px", color: "#ff6a00", lineHeight: "1", marginBottom: "20px" }}>0</div>
                <div style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.5)" }}>Ads & Distractions</div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.4 }} style={{ padding: "60px 32px", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="serif responsive-number" style={{ fontSize: "120px", color: "#ff6a00", lineHeight: "1", marginBottom: "20px" }}>30s</div>
                <div style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.5)" }}>Roadmap Generation</div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ padding: "60px 32px" }}>
                <div className="serif responsive-number" style={{ fontSize: "120px", color: "#ff6a00", lineHeight: "1", marginBottom: "20px" }}>100<span style={{ fontSize: "0.5em" }}>%</span></div>
                <div style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.5)" }}>Focus & Retention</div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 2. The Hook */}
        <section id="truth" className="responsive-pad" style={{ padding: "180px 0", background: "rgba(5,5,5,0.7)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="grid-container" style={{ textAlign: "center", padding: "0 32px" }}>
             <motion.h2 
               initial={{ filter: "blur(24px)", opacity: 0, scale: 0.95 }}
               whileInView={{ filter: "blur(0px)", opacity: 1, scale: 1 }}
               transition={{ duration: 1.2, ease: "easeOut" }}
               viewport={{ once: false, margin: "-10%" }}
               className="serif responsive-h2"
               style={{ fontSize: "80px", lineHeight: "1.1", maxWidth: "1000px", margin: "0 auto", color: "#ff6a00" }}
             >
               Watching 4-hour tutorials is a scam. Your brain is literally AFK.
             </motion.h2>
             <motion.p
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.3 }}
               style={{ fontSize: "20px", color: "rgba(255,255,255,0.6)", marginTop: "40px", maxWidth: "800px", margin: "40px auto 0", fontWeight: "300", lineHeight: "1.6" }}
             >
               Stop pretending to learn. Kaevrix hijacks your screen, interrupts your streams, and forces you to actually write code and answer questions while you watch.
             </motion.p>
          </div>
        </section>

        {/* 3. Feature 1: The Map */}
        <section id="features" className="responsive-pad" style={{ padding: "160px 0" }}>
          <div className="grid-container responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", padding: "0 80px", alignItems: "center" }}>
             <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", marginBottom: "32px" }}>
                  <BrainCircuit size={32} />
                </div>
                <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "4px", color: "#10b981", marginBottom: "16px" }}>01 // The Map</div>
                <h3 className="serif responsive-h3" style={{ fontSize: "56px", fontWeight: "400", margin: "0 0 24px 0", lineHeight: "1.1" }}>Drop a topic.<br/>Get a skill tree.</h3>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  You want to learn React? Don't blindly search YouTube. Tell our Pathfinder AI what you want, and it instantly builds a bespoke, milestone-driven curriculum out of the best videos on the web in 30 seconds flat.
                </p>
             </motion.div>
             <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="responsive-card" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(12px)" }}>
                 <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                   <div style={{ height: "40px", width: "40%", background: "rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                   <div style={{ height: "8px", width: "100%", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }} />
                   <div style={{ height: "8px", width: "80%", background: "rgba(255,255,255,0.1)", borderRadius: "4px" }} />
                   <div style={{ display: "flex", gap: "16px", marginTop: "24px" }}>
                     <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", fontWeight: "bold" }}>1</div>
                     <div style={{ flex: 1, background: "rgba(16,185,129,0.1)", borderRadius: "12px", padding: "16px" }}>
                       <div style={{ height: "12px", width: "60%", background: "#10b981", borderRadius: "6px" }} />
                     </div>
                   </div>
                 </div>
             </motion.div>
          </div>
        </section>

        {/* 4. The Stacked Pages (Engine & Arena) */}
        <div style={{ position: "relative" }}>
          <section style={{ 
            position: "sticky", top: 0, minHeight: "100vh", 
            background: "#080808", borderTop: "1px solid rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center"
          }} className="responsive-stack-pad">
            <div className="grid-container responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", padding: "0 80px", width: "100%", alignItems: "center" }}>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="responsive-card" style={{ background: "rgba(255,106,0,0.05)", border: "1px solid rgba(255,106,0,0.2)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(12px)" }}>
                 <div style={{ aspectRatio: "16/9", background: "#000", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                   <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,106,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6a00" }}>
                     <Play size={40} fill="currentColor" />
                   </div>
                 </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(255,106,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff6a00", marginBottom: "32px" }}>
                  <Zap size={32} />
                </div>
                <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "4px", color: "#ff6a00", marginBottom: "16px" }}>02 // The Engine</div>
                <h3 className="serif responsive-h3" style={{ fontSize: "56px", fontWeight: "400", margin: "0 0 24px 0", lineHeight: "1.1" }}>Learn by doing.<br/>Literally.</h3>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  We embed your YouTube video safely without ads. Then, we periodically freeze the video and hit you with high-stakes quizzes based on what you just watched. Answer correctly, or you don't proceed. It's called Active Retrieval, and it forces retention.
                </p>
              </motion.div>
            </div>
          </section>

          <section style={{ 
            position: "sticky", top: 0, minHeight: "100vh", 
            background: "#0c0c0c", borderTop: "1px solid rgba(139,92,246,0.3)",
            display: "flex", alignItems: "center", boxShadow: "0 -40px 80px rgba(0,0,0,0.9)"
          }} className="responsive-stack-pad">
            <div className="grid-container responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", padding: "0 80px", width: "100%", alignItems: "center" }}>
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6", marginBottom: "32px" }}>
                  <Swords size={32} />
                </div>
                <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "4px", color: "#8b5cf6", marginBottom: "16px" }}>03 // The Arena</div>
                <h3 className="serif responsive-h3" style={{ fontSize: "56px", fontWeight: "400", margin: "0 0 24px 0", lineHeight: "1.1" }}>Touch grass?<br/>Nah, touch the Arena.</h3>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  Every minute you study earns you energy. Take that energy into the PvP Arena and duel your friends in real-time. Cast disruption abilities against opponents and assert dominance with actual knowledge.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="responsive-card" style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(12px)", height: "300px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                 <div style={{ width: "30%", height: "60%", background: "rgba(255,255,255,0.05)", borderRadius: "12px 12px 0 0" }} />
                 <div style={{ width: "30%", height: "100%", background: "linear-gradient(180deg, #8b5cf6 0%, rgba(139,92,246,0.2) 100%)", borderRadius: "12px 12px 0 0", position: "relative" }}>
                    <div style={{ position: "absolute", top: "-40px", width: "100%", textAlign: "center", fontWeight: "bold", color: "#8b5cf6", fontSize: "20px" }}>YOU</div>
                 </div>
                 <div style={{ width: "30%", height: "40%", background: "rgba(255,255,255,0.05)", borderRadius: "12px 12px 0 0" }} />
              </motion.div>
            </div>
          </section>
        </div>

        {/* 5. Feature 4: The Archive */}
        <section className="responsive-pad" style={{ padding: "160px 0", background: "#050505", borderTop: "1px solid rgba(255,255,255,0.05)", position: "relative", zIndex: 20 }}>
          <div className="grid-container responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", padding: "0 80px", alignItems: "center" }}>
             <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="responsive-card" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "24px", padding: "40px", backdropFilter: "blur(12px)" }}>
                 <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                   <div style={{ height: "24px", width: "40%", background: "rgba(255,255,255,0.2)", borderRadius: "4px" }} />
                   <div style={{ height: "1px", width: "100%", background: "rgba(255,255,255,0.1)", margin: "8px 0" }} />
                   <div style={{ height: "12px", width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
                   <div style={{ height: "12px", width: "90%", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
                   <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                     <div style={{ padding: "8px 16px", background: "rgba(255,255,255,0.1)", borderRadius: "100px", fontSize: "12px" }}>.PDF Generated</div>
                   </div>
                 </div>
             </motion.div>
             <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", marginBottom: "32px" }}>
                  <History size={32} />
                </div>
                <div style={{ fontSize: "14px", textTransform: "uppercase", letterSpacing: "4px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>04 // The Archive</div>
                <h3 className="serif responsive-h3" style={{ fontSize: "56px", fontWeight: "400", margin: "0 0 24px 0", lineHeight: "1.1" }}>Download<br/>your brain.</h3>
                <p style={{ fontSize: "18px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>
                  Every victory, every lesson, meticulously documented. Our AI perfectly parses transcripts and formats everything you've learned into high-fidelity markdown notes and PDFs. You literally build your own textbook as you play.
                </p>
             </motion.div>
          </div>
        </section>

        {/* 6. CTA Footer */}
        <section className="responsive-pad" style={{ padding: "0", position: "relative", zIndex: 20, background: "#050505" }}>
          <div className="grid-container" style={{ textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "160px 32px" }}>
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
