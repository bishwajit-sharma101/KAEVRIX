const fs = require('fs');

const filePath = 'c:\\Users\\bishw\\OneDrive\\Desktop\\ytPlay\\client\\src\\features\\Roadmap\\BossBattleModal.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Replace SVGs
const svgsReplacement = `// SVG Boss Sprite Components (Premium Ethereal Dark Fantasy)
function CallbackDemonSVG({ isHurt }) {
  return (
    <svg width="250" height="250" viewBox="0 0 100 100" style={{ animation: "bossFloat 4s ease-in-out infinite", filter: isHurt ? "drop-shadow(0 0 50px #ff0000) brightness(1.5)" : "drop-shadow(0 0 35px rgba(168,85,247,0.8))" }}>
      <defs>
        <radialGradient id="demonCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff"/>
          <stop offset="30%" stopColor="#ff007f"/>
          <stop offset="100%" stopColor="#4a154b" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <polygon points="50,10 65,40 90,50 65,60 50,90 35,60 10,50 35,40" fill="rgba(10,0,15,0.6)" stroke="#ff007f" strokeWidth="1" style={{animation: "spinSlowReverse 20s linear infinite", transformOrigin: "50px 50px"}}/>
      <polygon points="50,20 60,45 80,50 60,55 50,80 40,55 20,50 40,45" fill="url(#demonCore)" style={{animation: "spinSlow 15s linear infinite", transformOrigin: "50px 50px"}}/>
      <circle cx="50" cy="50" r="15" fill="#110022" />
      <circle cx="50" cy="50" r="8" fill="#ff007f" style={{animation: "pulseOpacity 2s infinite alternate"}}/>
      <path d="M 50 10 C 70 30 70 70 50 90 C 30 70 30 30 50 10 Z" fill="none" stroke="#a855f7" strokeWidth="0.5"/>
    </svg>
  );
}

function ScopeWardenSVG({ isHurt }) {
  return (
    <svg width="250" height="250" viewBox="0 0 100 100" style={{ animation: "bossBreathe 5s ease-in-out infinite", filter: isHurt ? "drop-shadow(0 0 50px #ff0000) brightness(1.5)" : "drop-shadow(0 0 35px rgba(212,175,55,0.7))" }}>
      <defs>
        <radialGradient id="wardenGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="40%" stopColor="#d4af37"/>
          <stop offset="100%" stopColor="#1a1403" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="#d4af37" strokeWidth="0.5" strokeDasharray="2 6" style={{ animation: "spinSlow 30s linear infinite", transformOrigin: "50px 50px" }}/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="20 15 5 15" style={{ animation: "spinSlowReverse 25s linear infinite", transformOrigin: "50px 50px" }}/>
      <polygon points="50,15 70,50 50,85 30,50" fill="url(#wardenGlow)" style={{ animation: "pulseOpacity 3s infinite alternate" }} />
      <polygon points="50,25 60,50 50,75 40,50" fill="#fff" />
      <path d="M 50 15 C 80 0 90 40 50 50" fill="none" stroke="#d4af37" strokeWidth="1" />
      <path d="M 50 85 C 20 100 10 60 50 50" fill="none" stroke="#d4af37" strokeWidth="1" />
    </svg>
  );
}

function DOMDestroyerSVG({ isHurt }) {
  return (
    <svg width="250" height="250" viewBox="0 0 100 100" style={{ animation: "bossGlitch 2.5s steps(2) infinite", filter: isHurt ? "drop-shadow(0 0 50px #ff0000) brightness(1.5)" : "drop-shadow(0 0 40px rgba(34,197,94,0.6))" }}>
      <defs>
        <radialGradient id="domCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="30%" stopColor="#22c55e"/>
          <stop offset="100%" stopColor="#081c0b" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect x="25" y="25" width="50" height="50" fill="url(#domCore)" style={{animation: "spinSlow 10s linear infinite", transformOrigin: "50px 50px"}}/>
      <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="none" stroke="#22c55e" strokeWidth="1" style={{animation: "spinSlowReverse 15s linear infinite", transformOrigin: "50px 50px"}}/>
      <path d="M 10 30 L 90 70 M 10 70 L 90 30 M 50 10 L 50 90" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="2 4"/>
      <polygon points="50,35 60,50 50,65 40,50" fill="#000" />
      <circle cx="50" cy="50" r="5" fill="#fff" />
    </svg>
  );
}

function SyntaxSentinelSVG({ isHurt }) {
  return (
    <svg width="250" height="250" viewBox="0 0 100 100" style={{ animation: "bossFloat 5s ease-in-out infinite", filter: isHurt ? "drop-shadow(0 0 50px #ff0000) brightness(1.5)" : "drop-shadow(0 0 40px rgba(255,106,0,0.6))" }}>
      <defs>
        <radialGradient id="sentinelCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="40%" stopColor="#ff6a00"/>
          <stop offset="100%" stopColor="#261004" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="#ff6a00" strokeWidth="0.5" strokeDasharray="1 10"/>
      <rect x="35" y="35" width="30" height="30" fill="url(#sentinelCore)" transform="rotate(45 50 50)" style={{animation: "pulseOpacity 2.5s infinite alternate"}}/>
      <rect x="40" y="40" width="20" height="20" fill="none" stroke="#fff" strokeWidth="1" transform="rotate(45 50 50)"/>
      <path d="M 50 5 L 50 95 M 5 50 L 95 50" stroke="#ff6a00" strokeWidth="0.5"/>
      <circle cx="50" cy="50" r="8" fill="#000" />
      <circle cx="50" cy="50" r="3" fill="#00e5ff" />
    </svg>
  );
}

function GarbageCollectorSVG({ isHurt }) {
  return (
    <svg width="250" height="250" viewBox="0 0 100 100" style={{ animation: "bossBreathe 3s ease-in-out infinite", filter: isHurt ? "drop-shadow(0 0 50px #ff0000) brightness(1.5)" : "drop-shadow(0 0 40px rgba(239,68,68,0.7))" }}>
      <defs>
        <radialGradient id="garbageCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="20%" stopColor="#ef4444"/>
          <stop offset="80%" stopColor="#240808"/>
          <stop offset="100%" stopColor="#000" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="5 10" style={{ animation: "spinSlow 10s linear infinite", transformOrigin: "50px 50px" }}/>
      <circle cx="50" cy="50" r="35" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="15 20" style={{ animation: "spinSlowReverse 8s linear infinite", transformOrigin: "50px 50px" }}/>
      <circle cx="50" cy="50" r="25" fill="url(#garbageCore)" />
      <circle cx="50" cy="50" r="10" fill="#000" />
      <path d="M 50 25 C 70 25 70 50 50 50 C 30 50 30 25 50 25 Z" fill="#ef4444" style={{ animation: "pulseOpacity 1.5s infinite alternate" }}/>
    </svg>
  );
}

function renderBossSprite(bossType, isHurt) {`;
content = content.replace(/\/\/ SVG Boss Sprite Components[\s\S]*?function renderBossSprite\(bossType, isHurt\) \{/, svgsReplacement);

// 2. Replace CSS
const cssReplacement = `<style>{\`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@700&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap');
        
        .er-viewport::before {
          content: "";
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.03;
          pointer-events: none;
          z-index: 1;
        }

        .er-viewport {
          position: fixed;
          inset: 0;
          z-index: 99999;
          color: #ebdcb9;
          font-family: 'Cormorant Garamond', serif;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          user-select: none;
          background-color: #050402;
          padding: 24px 16px;
        }

        .ember-field { position: absolute; inset: 0; pointer-events: none; z-index: 1; }
        .ember { position: absolute; bottom: -15px; border-radius: 50%; opacity: 0; animation: floatEmber linear infinite; }
        @keyframes floatEmber {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 0.7; }
          70% { opacity: 0.3; }
          100% { transform: translateY(-105vh) translateX(35px) scale(0.4); opacity: 0; }
        }

        @keyframes spinSlow { 100% { transform: rotate(360deg); } }
        @keyframes spinSlowReverse { 100% { transform: rotate(-360deg); } }
        @keyframes bossBreathe {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.05) translateY(-10px); }
        }
        @keyframes pulseOpacity {
          0% { opacity: 0.6; }
          100% { opacity: 1; }
        }

        @keyframes bossFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes bossGlitch {
          0%, 100% { transform: translate(0, 0) skewX(0deg); }
          20% { transform: translate(-2px, 1px) skewX(1deg); }
          40% { transform: translate(1px, -1px) skewX(-1deg); }
          60% { transform: translate(-1px, 2px); }
          80% { transform: translate(2px, -2px); }
        }

        .boss-hurt { animation: bossHurtAnim 0.15s linear infinite !important; }
        @keyframes bossHurtAnim {
          0%, 100% { transform: translate(0, 0); filter: brightness(2) contrast(1.5) sepia(1) saturate(10) hue-rotate(340deg); }
          50% { transform: translate(6px, -6px) rotate(4deg); filter: brightness(1.8) invert(0.1); }
        }

        .player-hurt { animation: screenShake 0.25s ease-in-out infinite; box-shadow: inset 0 0 100px rgba(239, 68, 68, 0.4); }
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-8px, 8px); }
          40% { transform: translate(8px, -8px); }
          60% { transform: translate(-8px, -8px); }
          80% { transform: translate(8px, 8px); }
        }

        .slash-beam {
          position: absolute; width: 250%; height: 10px; background: #fff;
          box-shadow: 0 0 20px #ff007f, 0 0 35px #d4af37; transform: rotate(-30deg);
          top: 45%; left: -70%; animation: slashCut 0.3s cubic-bezier(0.19, 1, 0.22, 1) forwards; z-index: 100;
        }
        @keyframes slashCut { 0% { transform: scaleX(0) rotate(-30deg); opacity: 0; } 50% { opacity: 1; } 100% { transform: scaleX(1) rotate(-30deg); opacity: 0; } }

        .float-dmg {
          position: absolute; font-family: 'Cinzel', serif; font-size: 38px; color: #ef4444; font-weight: 900;
          animation: dmgRise 1.2s ease-out forwards; text-shadow: 0 0 10px #000, 0 0 20px #ef4444; z-index: 101;
        }
        @keyframes dmgRise { 0% { transform: translateY(20px) scale(0.8); opacity: 0; } 20% { opacity: 1; transform: translateY(0) scale(1.1); } 100% { transform: translateY(-70px) scale(0.9); opacity: 0; } }

        .heart-broken { animation: heartExplode 0.7s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards; }
        @keyframes heartExplode { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4) rotate(45deg); opacity: 0.6; filter: brightness(2) grayscale(0.8); } 100% { transform: scale(0) rotate(90deg); opacity: 0; } }

        .er-title { font-family: 'Cinzel Decorative', serif; font-size: 38px; letter-spacing: 5px; color: #d4af37; text-shadow: 0 0 20px rgba(212,175,55,0.4); text-transform: uppercase; }
        .er-subtitle-dialogue { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-style: italic; color: #fcebd2; line-height: 1.5; text-shadow: 0 2px 8px rgba(0,0,0,0.9); text-align: center; max-width: 700px; margin: 0 auto; }

        .er-divider { display: flex; align-items: center; justify-content: center; margin: 20px 0; color: rgba(212, 175, 55, 0.4); font-size: 14px; width: 100%; }
        .er-divider::before, .er-divider::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.35), transparent); margin: 0 20px; }

        /* Premium Dark Souls Option Buttons */
        .er-option-btn-premium {
          position: relative; width: 100%; background: rgba(10, 8, 6, 0.5); backdrop-filter: blur(10px);
          border: 1px solid rgba(212, 175, 55, 0.15); color: #b3a58d; font-family: 'Cormorant Garamond', serif;
          font-size: 21px; padding: 20px 28px; text-align: left; cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; align-items: center; overflow: hidden; outline: none;
        }
        .er-option-btn-premium::before {
          content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(212, 175, 55, 0.15) 0%, transparent 100%);
          opacity: 0; transition: opacity 0.4s ease;
        }
        .er-option-btn-premium:hover:not(:disabled) {
          color: #fff; border-color: rgba(212, 175, 55, 0.5); transform: translateX(6px); box-shadow: -6px 0 25px rgba(212, 175, 55, 0.2);
        }
        .er-option-btn-premium:hover:not(:disabled)::before { opacity: 1; }
        .er-option-premium-border {
          position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #d4af37; transform: scaleY(0); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .er-option-btn-premium:hover:not(:disabled) .er-option-premium-border { transform: scaleY(1); }
        .er-option-numeral { color: #d4af37; font-family: 'Cinzel', serif; font-weight: 700; font-size: 18px; margin-right: 18px; min-width: 35px; position: relative; z-index: 1; letter-spacing: 2px; }
        .er-option-text { position: relative; z-index: 1; line-height: 1.4; }

        .er-option-btn-premium.correct { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.6); color: #fff; box-shadow: 0 0 40px rgba(16, 185, 129, 0.25); }
        .er-option-btn-premium.correct .er-option-premium-border { background: #10b981; transform: scaleY(1); }
        .er-option-btn-premium.correct .er-option-numeral { color: #10b981; }

        .er-option-btn-premium.wrong { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.6); color: #fff; animation: optionShake 0.5s ease-out; }
        .er-option-btn-premium.wrong .er-option-premium-border { background: #ef4444; transform: scaleY(1); }
        .er-option-btn-premium.wrong .er-option-numeral { color: #ef4444; }
        @keyframes optionShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

        .er-action-btn { font-family: 'Cinzel', serif; font-size: 18px; letter-spacing: 3px; color: #ebdcb9; border: 1px solid rgba(212, 175, 55, 0.4); background: rgba(10, 8, 6, 0.6); padding: 14px 32px; cursor: pointer; transition: all 0.3s ease; outline: none; text-shadow: 0 0 5px rgba(212,175,55,0.3); }
        .er-action-btn:hover { color: #fff; border-color: #d4af37; background: rgba(212, 175, 55, 0.15); box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); transform: translateY(-2px); }

        .er-pedestal { width: 300px; height: 12px; background: radial-gradient(ellipse, rgba(212,175,55,0.25) 0%, transparent 80%); border-radius: 50%; margin: -10px auto 0; pointer-events: none; }

        .er-boss-hp-wrapper { width: 100%; max-width: 650px; margin: 20px auto; text-align: center; }
        .er-boss-hp-label { font-family: 'Cinzel', serif; font-size: 16px; letter-spacing: 4px; color: #dfd5be; margin-bottom: 6px; text-shadow: 0 2px 5px #000; font-weight: bold; }
        .er-boss-hp-track { height: 4px; background: rgba(0, 0, 0, 0.85); border-left: 2px solid #d4af37; border-right: 2px solid #d4af37; position: relative; box-shadow: 0 0 10px rgba(212,175,55,0.2); }
        .er-boss-hp-fill { height: 100%; background: #800000; box-shadow: 0 0 12px #ff0000; transition: width 0.3s cubic-bezier(0.19, 1, 0.22, 1); }

        .victory-text-glow { font-family: 'Cinzel Decorative', serif; font-size: 72px; letter-spacing: 8px; color: #fbf5e6; text-shadow: 0 0 50px rgba(212, 175, 55, 0.7); animation: textFadeScale 3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes textFadeScale { 0% { transform: scale(0.9) translateY(15px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }

        .defeat-screen { animation: screenFadeRed 1s ease-in forwards; }
        @keyframes screenFadeRed { 0% { background: transparent; } 100% { background: rgba(15, 2, 4, 0.98); } }
        .defeat-text-glow { font-family: 'Cinzel', serif; font-size: 80px; font-weight: 700; letter-spacing: 15px; color: #c80000; text-shadow: 0 0 40px rgba(200, 0, 0, 0.8); animation: deathStretch 5s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; }
        @keyframes deathStretch { 0% { transform: scaleX(0.8) scaleY(1); opacity: 0; letter-spacing: 4px; } 20% { opacity: 1; } 100% { transform: scaleX(1.05) scaleY(1); opacity: 1; letter-spacing: 15px; } }
      \`}</style>`;

content = content.replace(/<style>\{`[\s\S]*?`\}<\/style>/, cssReplacement);

// 3. Replace Loading Screen
const loadingReplacement = `{/* --- STAGE: SUMMONING (LOADING SCREEN) --- */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, textAlign: "center", padding: "40px 20px", margin: "auto 0" }}>
          <div style={{ marginBottom: "60px", filter: "drop-shadow(0 0 40px rgba(212,175,55,0.5))", position: "relative" }}>
            <svg width="280" height="280" viewBox="0 0 100 100" style={{ animation: "spinSlow 45s linear infinite", transformOrigin: "50% 50%" }}>
              <circle cx="50" cy="50" r="48" fill="none" stroke="#d4af37" strokeWidth="0.3" opacity="0.5"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="4 8" />
              <path d="M 50 10 L 50 90 M 10 50 L 90 50" stroke="#d4af37" strokeWidth="0.5" opacity="0.6"/>
              <circle cx="50" cy="50" r="30" fill="none" stroke="#d4af37" strokeWidth="0.5" strokeDasharray="20 10"/>
              <polygon points="50,20 65,35 65,65 50,80 35,65 35,35" fill="none" stroke="#d4af37" strokeWidth="1" style={{ animation: "spinSlowReverse 25s linear infinite", transformOrigin: "50% 50%" }}/>
              <polygon points="50,25 60,35 60,65 50,75 40,65 40,35" fill="none" stroke="#d4af37" strokeWidth="1" style={{ animation: "spinSlow 18s linear infinite", transformOrigin: "50% 50%" }}/>
              <circle cx="50" cy="50" r="8" fill="#d4af37" style={{ animation: "pulseOpacity 2s infinite alternate" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(212,175,55,0.25) 0%, transparent 65%)" }} />
          </div>
          
          <h2 className="er-title" style={{ fontSize: "32px", marginBottom: "35px", color: "#d4af37", letterSpacing: "10px", textShadow: "0 0 25px rgba(212,175,55,0.6)" }}>
            Piercing the Veil... {loadingPct}%
          </h2>
          
          <div style={{ width: "450px", height: "3px", background: "rgba(212, 175, 55, 0.15)", marginBottom: "25px", position: "relative" }}>
            <div style={{ height: "100%", width: \`\${loadingPct}%\`, background: "#d4af37", boxShadow: "0 0 18px #d4af37", transition: "width 0.1s linear" }} />
            <div style={{ position: "absolute", left: \`\${loadingPct}%\`, top: "-4px", width: "11px", height: "11px", borderRadius: "50%", background: "#fff", boxShadow: "0 0 15px #fff", transform: "translateX(-50%)", transition: "left 0.1s linear" }}/>
          </div>
          
          <div style={{ fontSize: "18px", color: "#a59b84", fontStyle: "italic", letterSpacing: "3px" }}>
            Gathering the fragments of knowledge
          </div>
        </div>
      )}`;
content = content.replace(/\{\/\* --- STAGE: SUMMONING \(LOADING SCREEN\) ---\*\/\}[\s\S]*?\{\/\* --- STAGE: INTRO \(RPG STORY DIALOGUE PHASE\) ---\*\/\}/, loadingReplacement + '\n\n      {/* --- STAGE: INTRO (RPG STORY DIALOGUE PHASE) --- */}');

// 4. Replace Choices UI
const choicesReplacement = `{/* Interactive Player Choices */}
          {!isTyping && (
            <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "12px", marginTop: "15px" }}>
              {dialogueStep === 0 && (
                <>
                  <button className="er-option-btn-premium" onClick={() => handleChoiceSelect(0)}>
                    <div className="er-option-premium-border" />
                    <span className="er-option-text">{getDialogueScript(bossData.bossType, topic).responses1[0]}</span>
                  </button>
                  <button className="er-option-btn-premium" onClick={() => handleChoiceSelect(1)}>
                    <div className="er-option-premium-border" />
                    <span className="er-option-text">{getDialogueScript(bossData.bossType, topic).responses1[1]}</span>
                  </button>
                  <button className="er-option-btn-premium" onClick={() => handleChoiceSelect(2)}>
                    <div className="er-option-premium-border" />
                    <span className="er-option-text">{getDialogueScript(bossData.bossType, topic).responses1[2]}</span>
                  </button>
                </>
              )}

              {dialogueStep === 1 && (
                <>
                  <button className="er-option-btn-premium" onClick={() => handleChoiceSelect(0)}>
                    <div className="er-option-premium-border" />
                    <span className="er-option-text">{getDialogueScript(bossData.bossType, topic).responses2[0]}</span>
                  </button>
                  <button className="er-option-btn-premium" onClick={() => handleChoiceSelect(1)}>
                    <div className="er-option-premium-border" />
                    <span className="er-option-text">{getDialogueScript(bossData.bossType, topic).responses2[1]}</span>
                  </button>
                </>
              )}

              {dialogueStep === 2 && (
                <div style={{ display: "flex", gap: "20px", justifyContent: "center", width: "100%", marginTop: "15px" }}>
                  <button className="er-action-btn" style={{ borderColor: "#ef4444", color: "#ef4444" }} onClick={onClose}>
                    RETREAT
                  </button>
                  <button className="er-action-btn" style={{ borderColor: "#d4af37", color: "#d4af37", textShadow: "0 0 10px rgba(212,175,55,0.5)" }} onClick={handleStartBattle}>
                    ⚔ BEGIN BATTLE ⚔
                  </button>
                </div>
              )}
            </div>
          )}`;
content = content.replace(/\{\/\* Interactive Player Choices \*\/\}[\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*\)\}/, choicesReplacement + '\n        </div>\n      )}');

// 5. Replace Questions UI
const questionsReplacement = `{/* Answers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px", maxWidth: "700px", margin: "0 auto 15px", width: "100%" }}>
                  {bossData.questions[currentIdx].options.map((opt, oIdx) => {
                    let btnClass = "";
                    if (isAnswering) {
                      const correctIdx = bossData.questions[currentIdx].answerIndex;
                      if (oIdx === correctIdx) {
                        btnClass = "correct";
                      } else if (selectedAns === oIdx) {
                        btnClass = "wrong";
                      }
                    }
                    
                    const romanNumerals = ["I", "II", "III", "IV", "V"];
                    return (
                      <button
                        key={oIdx}
                        disabled={isAnswering}
                        onClick={() => handleAnswerSelect(oIdx)}
                        className={\`er-option-btn-premium \${btnClass}\`}
                      >
                        <div className="er-option-premium-border" />
                        <span className="er-option-numeral">
                          {romanNumerals[oIdx]}.
                        </span>
                        <span className="er-option-text">
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>`;
content = content.replace(/\{\/\* Answers \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\}/, questionsReplacement + '\n              </div>\n            )}\n          </div>\n        </div>\n      )}');


fs.writeFileSync(filePath, content);
console.log('Update successful');
