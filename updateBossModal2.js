const fs = require('fs');

const filePath = 'c:\\Users\\bishw\\OneDrive\\Desktop\\ytPlay\\client\\src\\features\\Roadmap\\BossBattleModal.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Fix CSS styles (colors, shake animation, sizing)
content = content.replace(/\.er-viewport \{[\s\S]*?\}/, `.er-viewport {
          position: fixed; inset: 0; z-index: 99999;
          color: #e0e0e0; font-family: 'Cormorant Garamond', serif;
          overflow-y: auto; overflow-x: hidden;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
          user-select: none; background-color: #030303; padding: 12px 16px;
        }`);

content = content.replace(/\.player-hurt \{[\s\S]*?\}/, `.player-hurt { animation: screenShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) 1; box-shadow: inset 0 0 100px rgba(200, 16, 46, 0.4); }`);

content = content.replace(/\.er-title \{[\s\S]*?\}/, `.er-title { font-family: 'Cinzel Decorative', serif; font-size: 52px; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 20px rgba(255,255,255,0.4); text-transform: uppercase; }`);

content = content.replace(/\.er-subtitle-dialogue \{[\s\S]*?\}/, `.er-subtitle-dialogue { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-style: italic; color: #cccccc; line-height: 1.4; text-shadow: 0 2px 8px rgba(0,0,0,0.9); text-align: center; max-width: 700px; margin: 0 auto; }`);

content = content.replace(/\.er-divider::before, \.er-divider::after \{[\s\S]*?\}/, `.er-divider::before, .er-divider::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(200, 16, 46, 0.5), transparent); margin: 0 20px; }`);

content = content.replace(/\.er-option-btn-premium \{[\s\S]*?\}/, `.er-option-btn-premium {
          position: relative; width: 100%; background: rgba(15, 15, 15, 0.7); backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1); color: #cccccc; font-family: 'Cormorant Garamond', serif;
          font-size: 19px; padding: 12px 20px; text-align: left; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; align-items: center; overflow: hidden; outline: none;
        }`);

content = content.replace(/\.er-option-btn-premium::before \{[\s\S]*?\}/, `.er-option-btn-premium::before {
          content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(200, 16, 46, 0.2) 0%, transparent 100%);
          opacity: 0; transition: opacity 0.3s ease;
        }`);

content = content.replace(/\.er-option-btn-premium:hover:not\(:disabled\) \{[\s\S]*?\}/, `.er-option-btn-premium:hover:not(:disabled) {
          color: #ffffff; border-color: rgba(200, 16, 46, 0.6); transform: translateX(4px); box-shadow: -4px 0 15px rgba(200, 16, 46, 0.3);
        }`);

content = content.replace(/\.er-option-premium-border \{[\s\S]*?\}/, `.er-option-premium-border {
          position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #c8102e; transform: scaleY(0); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }`);

content = content.replace(/\.er-option-numeral \{[\s\S]*?\}/, `.er-option-numeral { color: #8a0303; font-family: 'Cinzel', serif; font-weight: 700; font-size: 16px; margin-right: 14px; min-width: 30px; position: relative; z-index: 1; letter-spacing: 2px; }`);

content = content.replace(/\.er-action-btn \{[\s\S]*?\}/, `.er-action-btn { font-family: 'Cinzel', serif; font-size: 16px; letter-spacing: 4px; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3); background: rgba(10, 10, 10, 0.8); padding: 12px 28px; cursor: pointer; transition: all 0.3s ease; outline: none; text-shadow: 0 0 5px rgba(255,255,255,0.3); }`);
content = content.replace(/\.er-action-btn:hover \{[\s\S]*?\}/, `.er-action-btn:hover { color: #fff; border-color: #c8102e; background: rgba(200, 16, 46, 0.2); box-shadow: 0 0 20px rgba(200, 16, 46, 0.4); transform: translateY(-2px); }`);

content = content.replace(/\.er-boss-hp-track \{[\s\S]*?\}/, `.er-boss-hp-track { height: 4px; background: rgba(0, 0, 0, 0.85); border-left: 2px solid #8a0303; border-right: 2px solid #8a0303; position: relative; box-shadow: 0 0 10px rgba(138,3,3,0.4); }`);

content = content.replace(/\.victory-text-glow \{[\s\S]*?\}/, `.victory-text-glow { font-family: 'Cinzel Decorative', serif; font-size: 72px; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 40px rgba(255, 255, 255, 0.8); animation: textFadeScale 3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }`);


// 2. Fix layout constraints in JSX (margins, SVG sizes)
// Reduce SVG sizes from 250 to 140
content = content.replace(/width="250" height="250"/g, 'width="140" height="140"');

// Fix Scope Warden colors (remove gold #d4af37, use crimson/white)
content = content.replace(/rgba\(212,175,55,0\.7\)/g, 'rgba(200,16,46,0.7)');
content = content.replace(/stopColor="#d4af37"/g, 'stopColor="#c8102e"');
content = content.replace(/stroke="#d4af37"/g, 'stroke="#c8102e"');
content = content.replace(/fill="#d4af37"/g, 'fill="#c8102e"');
content = content.replace(/boxShadow: "0 0 18px #d4af37"/g, 'boxShadow: "0 0 18px #c8102e"');
content = content.replace(/background: "#d4af37"/g, 'background: "#c8102e"');

// Replace general gold colors #d4af37 to white or crimson in inline styles
content = content.replace(/color: "#d4af37"/g, 'color: "#ffffff"');
content = content.replace(/borderColor: "#d4af37"/g, 'borderColor: "#ffffff"');
content = content.replace(/rgba\(212,175,55,/g, 'rgba(255,255,255,');

// Adjust padding and margins in battle stage
content = content.replace(/padding: "20px"/g, 'padding: "10px"');
content = content.replace(/marginBottom: "24px"/g, 'marginBottom: "12px"');
content = content.replace(/marginTop: "15px"/g, 'marginTop: "8px"');
content = content.replace(/gap: "16px"/g, 'gap: "8px"');
content = content.replace(/margin: "20px 0"/g, 'margin: "5px 0"');
content = content.replace(/height: "200px"/g, 'height: "140px"');


// 3. Fix loading screen entirely
const loadingReplacement = `{/* --- STAGE: SUMMONING (LOADING SCREEN) --- */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, textAlign: "center", padding: "40px 20px", margin: "auto 0" }}>
          
          <div style={{ position: "relative", marginBottom: "40px" }}>
             <h2 className="er-title" style={{ fontSize: "64px", margin: "0", color: "#ffffff", letterSpacing: "15px", textShadow: "0 0 30px rgba(255,255,255,0.6)", animation: "pulseOpacity 3s infinite alternate" }}>
                SUMMONING
             </h2>
             <div style={{ fontSize: "24px", color: "#c8102e", letterSpacing: "8px", marginTop: "10px", fontWeight: "bold", fontFamily: "'Cinzel', serif" }}>
                {loadingPct}%
             </div>
          </div>
          
          <div style={{ width: "500px", height: "1px", background: "rgba(255, 255, 255, 0.2)", marginBottom: "30px", position: "relative" }}>
            <div style={{ height: "100%", width: \`\${loadingPct}%\`, background: "#ffffff", boxShadow: "0 0 20px #ffffff", transition: "width 0.1s linear" }} />
          </div>
          
          <div style={{ fontSize: "18px", color: "#888888", fontStyle: "italic", letterSpacing: "3px", fontFamily: "'Cormorant Garamond', serif" }}>
            The guardian approaches from the abyss...
          </div>
        </div>
      )}`;

content = content.replace(/\{\/\* --- STAGE: SUMMONING \(LOADING SCREEN\) ---\*\/\}[\s\S]*?\{\/\* --- STAGE: INTRO \(RPG STORY DIALOGUE PHASE\) ---\*\/\}/, loadingReplacement + '\n\n      {/* --- STAGE: INTRO (RPG STORY DIALOGUE PHASE) --- */}');

fs.writeFileSync(filePath, content);
console.log("updateBossModal2.js executed successfully");
