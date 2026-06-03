import { useState, useEffect } from "react";
import * as sound from "../../utils/audio";

const TIER_COLORS = {
  "Novice": "#64748b",
  "Adept": "#3b82f6",
  "Expert": "#10b981",
  "Master": "#f59e0b",
  "Legend": "var(--neon-pink)"
};

export default function ProfilePanel({ username, selectedClass, onSurpassLimits }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cosmeticIndex, setCosmeticIndex] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
      const res = await fetch(`${BACKEND_URL}/api/profile/${username}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const level = profile ? profile.level : 1;
  const xp = profile ? profile.xp : 0;
  const xpProgress = (xp % 200) / 200 * 100;
  const skills = profile?.skills || [];
  
  const totalMatches = profile ? profile.wins + profile.losses : 0;
  const winRate = totalMatches > 0 ? Math.round((profile.wins / totalMatches) * 100) : 0;
  const watchTime = Math.floor((profile?.totalWatchTime || 0) / 60);

  if (loading) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
        <div style={{ width: "2px", height: "40px", background: "var(--neon-orange)", animation: "pulse 1s infinite" }} />
      </div>
    );
  }

  const PRESET_COSMETICS = [
    { banner: "", avatarFrame: "", profileEffect: "" },
    { banner: "https://images.unsplash.com/photo-1504333638930-c8787321efa0?w=800", avatarFrame: "inferno-aura", profileEffect: "inferno" },
    { banner: "https://images.unsplash.com/photo-1620802051772-52055660890c?w=800", avatarFrame: "kawaii-clouds", profileEffect: "magical-girl" },
    { banner: "https://images.unsplash.com/photo-1561485132-59468cd0b553?w=800", avatarFrame: "lightning-strike", profileEffect: "thunder-storm" }
  ];

  const handleCycleCosmetics = async () => {
    const nextIndex = (cosmeticIndex + 1) % PRESET_COSMETICS.length;
    const nextCosmetics = PRESET_COSMETICS[nextIndex];
    setCosmeticIndex(nextIndex);
    
    try {
      const BACKEND_URL = window.location.hostname === "localhost" ? "http://localhost:5000" : "";
      const res = await fetch(`${BACKEND_URL}/api/profile/cosmetics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, ...nextCosmetics })
      });
      if (res.ok) fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for dynamic frame styling (fallback if no complex overlay)
  const getAvatarFrameStyle = (frame) => {
    if (frame === "neon-pulse") return { border: "3px solid var(--neon-blue)", boxShadow: "0 0 15px var(--neon-blue)", animation: "pulse 2s infinite" };
    return { border: "2px solid var(--neon-orange)" }; // Default
  };

  const bannerUrl = profile?.cosmetics?.banner;
  const bannerBackground = bannerUrl 
    ? `url(${bannerUrl}) center/cover no-repeat` 
    : "linear-gradient(135deg, rgba(255,106,0,0.8) 0%, rgba(255,59,48,0.4) 100%)";

  const profileEffect = profile?.cosmetics?.profileEffect;
  const avatarFrame = profile?.cosmetics?.avatarFrame;

  return (
    <div style={{ flex: 1, overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", paddingBottom: "60px", position: "relative" }}>
      
      <style>{`
        /* ============================ */
        /* 1. THUNDER STORM            */
        /* ============================ */
        @keyframes lightningFlash {
          0%, 95%, 98% { opacity: 0; background: transparent; }
          96%, 99% { opacity: 1; background: rgba(255, 255, 255, 0.8); }
          100% { opacity: 0; }
        }
        @keyframes rainFall {
          0% { transform: translateY(-100px) rotate(15deg); }
          100% { transform: translateY(500px) rotate(15deg); }
        }
        @keyframes electricArc {
          0% { clip-path: polygon(0 0, 100% 0, 100% 10%, 0 10%); }
          25% { clip-path: polygon(0 20%, 100% 20%, 100% 30%, 0 30%); }
          50% { clip-path: polygon(0 50%, 100% 50%, 100% 60%, 0 60%); }
          75% { clip-path: polygon(0 80%, 100% 80%, 100% 90%, 0 90%); }
          100% { clip-path: polygon(0 100%, 100% 100%, 100% 90%, 0 90%); }
        }
        @keyframes electricSpin {
          0% { transform: rotate(0deg); filter: hue-rotate(0deg); }
          100% { transform: rotate(360deg); filter: hue-rotate(90deg); }
        }
        
        /* ============================ */
        /* 2. INFERNO AURA             */
        /* ============================ */
        @keyframes plasmaMorph {
          0% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; transform: rotate(0deg) scale(1); }
          34% { border-radius: 70% 30% 50% 50% / 30% 30% 70% 70%; transform: rotate(120deg) scale(1.1); }
          67% { border-radius: 100% 60% 60% 100% / 100% 100% 60% 60%; transform: rotate(240deg) scale(1.15); }
          100% { border-radius: 40% 60% 70% 30% / 40% 40% 60% 50%; transform: rotate(360deg) scale(1); }
        }
        @keyframes fireEmber {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-300px) scale(0); opacity: 0; }
        }

        /* ============================ */
        /* 3. MAGICAL GIRL (KAWAII)    */
        /* ============================ */
        @keyframes kawaiiFloat {
          0%, 100% { transform: translateY(0) scale(1) rotate(-5deg); }
          50% { transform: translateY(-15px) scale(1.1) rotate(5deg); }
        }
        @keyframes sparkleFall {
          0% { transform: translateY(-20px) scale(0); opacity: 0; }
          50% { transform: translateY(150px) scale(1); opacity: 1; }
          100% { transform: translateY(300px) scale(0); opacity: 0; }
        }
        @keyframes sunburstSpin {
          0% { transform: rotate(0deg) scale(2); }
          100% { transform: rotate(360deg) scale(2); }
        }
        @keyframes cloudBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

      {/* --- BACKGROUND PROFILE EFFECTS --- */}
      
      {/* Thunder Storm Effect */}
      {profileEffect === "thunder-storm" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "400px", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {/* Lightning Flashes */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", animation: "lightningFlash 5s infinite", mixBlendMode: "overlay" }} />
          {/* Rain */}
          {[...Array(30)].map((_, i) => (
            <div key={i} style={{ 
              position: "absolute", 
              top: "-100px",
              left: (Math.random() * 120) - 10 + "%", 
              width: "2px", 
              height: (20 + Math.random() * 30) + "px", 
              background: "rgba(255,255,255,0.4)",
              animation: "rainFall " + (0.2 + Math.random() * 0.3) + "s linear " + (Math.random()) + "s infinite"
            }} />
          ))}
        </div>
      )}

      {/* Inferno Effect */}
      {profileEffect === "inferno" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden", mixBlendMode: "screen" }}>
          {/* Intense Glow Base */}
          <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "300px", background: "linear-gradient(to top, rgba(255,60,0,0.6), transparent)" }} />
          {/* Embers */}
          {[...Array(40)].map((_, i) => (
            <div key={i} style={{ 
              position: "absolute", 
              bottom: "-20px",
              left: (Math.random() * 100) + "%", 
              width: (4 + Math.random() * 8) + "px", 
              height: (4 + Math.random() * 8) + "px", 
              background: Math.random() > 0.5 ? "#ffaa00" : "#ff3300", 
              borderRadius: "50%",
              boxShadow: "0 0 10px #ff3300",
              animation: "fireEmber " + (1 + Math.random() * 2) + "s ease-in " + (Math.random() * 2) + "s infinite"
            }} />
          ))}
        </div>
      )}

      {/* Magical Girl (Kawaii) Effect */}
      {profileEffect === "magical-girl" && (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, overflow: "hidden" }}>
          {/* Full-Body Soft Pink Ambient Glow */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(to bottom, rgba(255,182,193,0.2) 0%, rgba(255,105,180,0.05) 100%)", mixBlendMode: "overlay" }} />
          
          {/* Spinning Sunburst (Banner Area Only) */}
          <div style={{ 
            position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "400px", 
            background: "conic-gradient(from 0deg, rgba(255,182,193,0.4) 0deg 15deg, transparent 15deg 30deg, rgba(173,216,230,0.4) 30deg 45deg, transparent 45deg 60deg, rgba(255,182,193,0.4) 60deg 75deg, transparent 75deg 90deg, rgba(173,216,230,0.4) 90deg 105deg, transparent 105deg 120deg, rgba(255,182,193,0.4) 120deg 135deg, transparent 135deg 150deg, rgba(173,216,230,0.4) 150deg 165deg, transparent 165deg 180deg, rgba(255,182,193,0.4) 180deg 195deg, transparent 195deg 210deg, rgba(173,216,230,0.4) 210deg 225deg, transparent 225deg 240deg, rgba(255,182,193,0.4) 240deg 255deg, transparent 255deg 270deg, rgba(173,216,230,0.4) 270deg 285deg, transparent 285deg 300deg, rgba(255,182,193,0.4) 300deg 315deg, transparent 315deg 330deg, rgba(173,216,230,0.4) 330deg 345deg, transparent 345deg 360deg)",
            animation: "sunburstSpin 30s linear infinite", mixBlendMode: "overlay"
          }} />
          {/* Floating Hearts */}
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ 
              position: "absolute", 
              top: (Math.random() * 60) + "%", left: (Math.random() * 100) + "%", 
              fontSize: (20 + Math.random() * 40) + "px",
              opacity: 0.6,
              animation: "kawaiiFloat " + (3 + Math.random() * 3) + "s ease-in-out " + (Math.random() * 2) + "s infinite"
            }}>💖</div>
          ))}
          {/* Falling Sparkles */}
          {[...Array(20)].map((_, i) => (
            <div key={i} style={{ 
              position: "absolute", 
              top: "-20px", left: (Math.random() * 100) + "%", 
              fontSize: "16px", color: "#ffd700",
              animation: "sparkleFall " + (2 + Math.random() * 2) + "s linear " + (Math.random() * 3) + "s infinite"
            }}>✨</div>
          ))}
        </div>
      )}

      {/* 1. CUSTOMIZABLE BANNER SECTION */}
      <div style={{ 
        width: "100%", height: "240px", 
        background: bannerBackground,
        position: "relative",
        borderBottom: "1px solid rgba(255,255,255,0.1)"
      }}>
        <div style={{ position: "absolute", top: "20px", right: "30px", display: "flex", gap: "12px" }}>
          <button onClick={handleCycleCosmetics} style={{ 
            background: "rgba(59,130,246,0.5)", border: "1px solid rgba(59,130,246,0.8)", 
            color: "#fff", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", 
            fontWeight: "800", cursor: "pointer", backdropFilter: "blur(4px)"
          }}>
            DEV: CYCLE COSMETICS
          </button>
          <button style={{ 
            background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", 
            color: "#fff", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", 
            fontWeight: "800", cursor: "pointer", backdropFilter: "blur(4px)"
          }}>
            EDIT BANNER
          </button>
        </div>
      </div>

      {/* 2. PROFILE BODY (No Boxes, Pure Layout) */}
      <div style={{ padding: "0 60px", position: "relative" }}>
        
        {/* Identity Row: Overlapping Avatar & Name */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "30px", marginTop: "-70px", marginBottom: "40px" }}>
          
          {/* Avatar Container with Intense Decorations */}
          <div style={{ 
            width: "160px", height: "160px", borderRadius: "50%", 
            background: "var(--bg-dark-base)", 
            padding: "8px", position: "relative", zIndex: 10
          }}>
            
            {/* --- AVATAR EFFECTS --- */}
            
            {avatarFrame === "inferno-aura" && (
              <>
                <div style={{ position: "absolute", top: "-30px", left: "-30px", right: "-30px", bottom: "-30px", background: "linear-gradient(45deg, #ff0000, #ff7300, #fffb00)", mixBlendMode: "screen", filter: "blur(15px)", animation: "plasmaMorph 3s linear infinite", zIndex: -1 }} />
                <div style={{ position: "absolute", top: "-15px", left: "-15px", right: "-15px", bottom: "-15px", background: "linear-gradient(45deg, #ff7300, #ff0000)", mixBlendMode: "screen", filter: "blur(8px)", animation: "plasmaMorph 2s linear reverse infinite", zIndex: -1 }} />
              </>
            )}

            {avatarFrame === "lightning-strike" && (
              <>
                <div style={{ position: "absolute", top: "-15px", left: "-15px", right: "-15px", bottom: "-15px", border: "4px solid cyan", borderRadius: "50%", animation: "electricSpin 0.5s steps(4) infinite", filter: "blur(2px)", mixBlendMode: "screen" }} />
                <div style={{ position: "absolute", top: "-5px", left: "-5px", right: "-5px", bottom: "-5px", border: "2px solid white", borderRadius: "50%", animation: "electricArc 0.1s linear infinite" }} />
                <div style={{ position: "absolute", top: "-10px", left: "50%", width: "4px", height: "30px", background: "white", boxShadow: "0 0 10px cyan", transform: "translateX(-50%) rotate(45deg)", animation: "lightningFlash 1s infinite" }} />
              </>
            )}

            {avatarFrame === "kawaii-clouds" && (
              <>
                {/* Cloud Border */}
                <div style={{ position: "absolute", top: "-20px", left: "-20px", right: "-20px", bottom: "-20px", background: "white", borderRadius: "50%", filter: "drop-shadow(0 0 15px rgba(255,182,193,0.8))", animation: "cloudBounce 3s ease-in-out infinite", zIndex: -1 }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} style={{ position: "absolute", width: "60px", height: "60px", background: "white", borderRadius: "50%", top: (Math.sin(i * Math.PI / 4) * 85 + 70) + "px", left: (Math.cos(i * Math.PI / 4) * 85 + 70) + "px" }} />
                  ))}
                </div>
                {/* Cute Ribbons */}
                <div style={{ position: "absolute", top: "50%", left: "-45px", fontSize: "40px", transform: "translateY(-50%) scaleX(-1) rotate(-15deg)", animation: "kawaiiFloat 2s ease-in-out infinite" }}>🎀</div>
                <div style={{ position: "absolute", top: "50%", right: "-45px", fontSize: "40px", transform: "translateY(-50%) rotate(15deg)", animation: "kawaiiFloat 2s ease-in-out 0.5s infinite" }}>🎀</div>
                {/* Extra Sparkles */}
                <div style={{ position: "absolute", top: "-10px", left: "0px", fontSize: "20px", animation: "kawaiiFloat 1.5s ease-in-out 0.2s infinite" }}>🌸</div>
                <div style={{ position: "absolute", bottom: "-10px", right: "0px", fontSize: "20px", animation: "kawaiiFloat 1.8s ease-in-out 0.7s infinite" }}>🌸</div>
              </>
            )}

            <div style={{ 
              width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden",
              background: "var(--bg-dark-surface)", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "60px", position: "relative", zIndex: 5,
              ...(avatarFrame !== "lightning-strike" && avatarFrame !== "inferno-aura" && avatarFrame !== "kawaii-clouds" ? getAvatarFrameStyle(avatarFrame) : { border: "2px solid transparent" })
            }}>
              {profile?.avatar ? (
                profile.avatar.includes('http') ? <img src={profile.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : profile.avatar
              ) : "👤"}
            </div>
          </div>

          {/* Name & Title */}
          <div style={{ flex: 1, paddingBottom: "10px" }}>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "48px", fontWeight: "900", color: "var(--text-light)", fontFamily: "var(--font-outfit)", letterSpacing: "2px" }}>
              {username}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--neon-orange)", letterSpacing: "1px", textTransform: "uppercase" }}>Combatant Class</span>
              <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>|</span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-muted)" }}>Global Rank <strong style={{ color: "var(--text-light)" }}>{level}</strong></span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ paddingBottom: "20px", display: "flex", gap: "12px" }}>
            <button style={{ 
              background: "var(--neon-orange)", color: "#fff", border: "none", 
              padding: "12px 24px", borderRadius: "30px", fontSize: "13px", fontWeight: "800", letterSpacing: "1px",
              cursor: "pointer", transition: "transform 0.2s"
            }} onMouseOver={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseOut={e=>e.currentTarget.style.transform="scale(1)"}>
              ADD FRIEND
            </button>
            <button style={{ 
              background: "transparent", color: "var(--text-light)", border: "1px solid var(--text-muted)", 
              padding: "12px 24px", borderRadius: "30px", fontSize: "13px", fontWeight: "800", letterSpacing: "1px",
              cursor: "pointer", transition: "border-color 0.2s"
            }} onMouseOver={e=>e.currentTarget.style.borderColor="var(--text-light)"} onMouseOut={e=>e.currentTarget.style.borderColor="var(--text-muted)"}>
              MESSAGE
            </button>
          </div>
        </div>

        {/* Level Progress (No Box) */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "60px" }}>
          <div style={{ flex: 1, height: "2px", background: "rgba(128,128,128,0.2)", position: "relative" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${xpProgress}%`, background: "var(--neon-orange)", boxShadow: "0 0 10px var(--neon-orange)" }} />
          </div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "1px", fontFamily: "var(--font-gamer)" }}>
            {xp % 200} / 200 XP TO NEXT RANK
          </div>
        </div>

        {/* 3. TWO COLUMN STATS & SKILLS (NO BOXES) */}
        <div style={{ display: "flex", gap: "80px", alignItems: "flex-start", flexWrap: "wrap" }}>
          
          {/* Left Column: Stats */}
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: "40px" }}>
            <h3 style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "4px", textTransform: "uppercase", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "12px" }}>
              Combat Analytics
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
              {/* Stat */}
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Win Rate</div>
                <div style={{ fontSize: "48px", fontWeight: "900", color: "var(--text-light)", fontFamily: "var(--font-outfit)", lineHeight: 1 }}>
                  {winRate}<span style={{ fontSize: "20px", color: "var(--neon-orange)" }}>%</span>
                </div>
              </div>
              
              {/* Stat */}
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>W/L Spread</div>
                <div style={{ fontSize: "40px", fontWeight: "900", color: "var(--text-light)", fontFamily: "var(--font-outfit)", lineHeight: 1 }}>
                  {profile?.wins || 0} <span style={{ fontSize: "20px", color: "var(--text-muted)" }}>/</span> {profile?.losses || 0}
                </div>
              </div>

              {/* Stat */}
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Watch Time</div>
                <div style={{ fontSize: "40px", fontWeight: "900", color: "var(--text-light)", fontFamily: "var(--font-outfit)", lineHeight: 1 }}>
                  {watchTime} <span style={{ fontSize: "16px", color: "var(--neon-blue)", textTransform: "uppercase" }}>Minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Skills */}
          <div style={{ flex: "2 1 400px", display: "flex", flexDirection: "column", gap: "40px" }}>
            <h3 style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", fontWeight: "800", letterSpacing: "4px", textTransform: "uppercase", borderBottom: "1px solid rgba(128,128,128,0.2)", paddingBottom: "12px" }}>
              Mastery Roles
            </h3>

            {skills.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                {skills.sort((a, b) => b.xp - a.xp).map((skill, idx) => {
                  const tierColor = TIER_COLORS[skill.tier] || TIER_COLORS["Novice"];
                  return (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                      
                      {/* Name */}
                      <div style={{ flex: "0 0 140px", fontSize: "16px", fontWeight: "800", color: "var(--text-light)", letterSpacing: "1px" }}>
                        {skill.name}
                      </div>

                      {/* Tier Dot & Label */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: tierColor, boxShadow: `0 0 8px ${tierColor}` }} />
                        <span style={{ fontSize: "12px", fontWeight: "800", color: tierColor, textTransform: "uppercase", letterSpacing: "1px" }}>{skill.tier}</span>
                      </div>

                      {/* Progress Line */}
                      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ flex: 1, height: "2px", background: "rgba(128,128,128,0.2)", position: "relative" }}>
                          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: skill.tier === "Legend" ? "100%" : `${(skill.xp % 5000) / 50}%`, background: tierColor }} />
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-gamer)", width: "60px", textAlign: "right" }}>
                          {skill.xp.toLocaleString()} XP
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: "14px", color: "var(--text-muted)", fontStyle: "italic", paddingTop: "10px" }}>
                Start watching tutorials to unlock mastery roles.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
