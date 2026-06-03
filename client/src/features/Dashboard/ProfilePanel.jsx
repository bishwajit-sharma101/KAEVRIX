import { useState, useEffect } from "react";
import { CHARACTER_CLASSES, getUnlockedSkills } from "../../utils/characterClasses";
import * as sound from "../../utils/audio";

export default function ProfilePanel({ username, selectedClass, onSurpassLimits, onTestJourneyDay }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const clsDef = CHARACTER_CLASSES[selectedClass || profile?.selectedClass] || CHARACTER_CLASSES["doomscroller"];
  const level = profile ? profile.level : 1;
  const xp = profile ? profile.xp : 0;
  const xpForNextLevel = level * 200;
  const xpProgress = (xp % 200) / 200 * 100;

  return (
    <div className="glass-panel glowing-border-neon" style={{ flex: 1, padding: "25px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "25px", height: "100%" }}>
      {/* Header Row */}
      <div style={{ display: "flex", gap: "25px", alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* Avatar & Basic Info */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center", background: "var(--bg-dark-base)", padding: "20px", borderRadius: "15px", flex: 1, minWidth: "300px" }}>
          <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "var(--bg-dark-surface)", border: "3px solid var(--neon-blue)", overflow: "hidden", flexShrink: 0, boxShadow: "0 0 20px rgba(0, 242, 254, 0.3)" }}>
            <img src={profile?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${clsDef.avatarSeed}&backgroundColor=transparent`} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "var(--text-light)", margin: "0 0 5px 0", fontSize: "28px" }}>{username}</h2>
            <div style={{ color: "var(--neon-orange)", fontWeight: "bold", marginBottom: "15px", letterSpacing: "1px", display: "inline-block", padding: "4px 10px", background: "rgba(255,106,0,0.1)", borderRadius: "20px", fontSize: "14px" }}>
              {clsDef.name}
            </div>
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px", fontSize: "14px" }}>
                <span style={{ color: "var(--neon-blue)", fontWeight: "bold" }}>LEVEL {level}</span>
                <span style={{ color: "var(--text-muted)" }}>{xp % 200} / 200 XP</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                <div style={{ width: `${Math.min(100, xpProgress)}%`, height: "100%", background: "linear-gradient(90deg, var(--neon-blue), var(--neon-pink))" }} />
              </div>
              <button
                className="btn-surpass-limits"
                onClick={() => {
                  sound.playClockTick();
                  if (onSurpassLimits) onSurpassLimits();
                }}
                style={{ width: "100%" }}
              >
                ⚡ SURPASS LIMITS ⚡
              </button>

              {/* Dev Test Buttons */}
              {window.location.hostname === "localhost" && (
                <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "12px" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "6px", fontWeight: "bold", letterSpacing: "1px" }}>🛠️ DEV: TEST ANNOUNCEMENTS</div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => { sound.playClockTick(); if (onTestJourneyDay) onTestJourneyDay(1); }}
                      style={{ flex: 1, padding: "6px", background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: "4px", color: "#d4af37", fontSize: "10px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      DAY 1
                    </button>
                    <button
                      onClick={() => { sound.playClockTick(); if (onTestJourneyDay) onTestJourneyDay(2); }}
                      style={{ flex: 1, padding: "6px", background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: "4px", color: "#d4af37", fontSize: "10px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      DAY 2
                    </button>
                    <button
                      onClick={() => { sound.playClockTick(); if (onTestJourneyDay) onTestJourneyDay(3); }}
                      style={{ flex: 1, padding: "6px", background: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: "4px", color: "#d4af37", fontSize: "10px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      DAY 3
                    </button>
                    <button
                      onClick={() => { sound.playClockTick(); if (onTestJourneyDay) onTestJourneyDay(7); }}
                      style={{ flex: 1, padding: "6px", background: "rgba(212, 175, 55, 0.15)", border: "1px solid #d4af37", borderRadius: "4px", color: "#f7ebd0", fontSize: "10px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      DAY 7
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lifetime Stats */}
        <div style={{ display: "flex", gap: "15px", flex: 1, minWidth: "300px" }}>
          <div style={{ flex: 1, background: "var(--bg-dark-base)", padding: "20px", borderRadius: "15px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Win Rate</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--neon-green)" }}>
              {profile && (profile.wins + profile.losses) > 0 ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100) : 0}%
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "5px" }}>{profile?.wins || 0}W - {profile?.losses || 0}L</div>
          </div>
          
          <div style={{ flex: 1, background: "var(--bg-dark-base)", padding: "20px", borderRadius: "15px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Total Watch Time</div>
            <div style={{ fontSize: "28px", fontWeight: "bold", color: "var(--neon-blue)" }}>
              {Math.floor((profile?.totalWatchTime || 0) / 60)}<span style={{ fontSize: "16px", color: "var(--text-muted)" }}>m</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "5px" }}>{profile?.totalVideosWatched || 0} Videos</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "25px", flexWrap: "wrap" }}>
        {/* Skill Tree */}
        <div style={{ flex: 1.5, minWidth: "300px", background: "var(--bg-dark-base)", padding: "25px", borderRadius: "15px" }}>
          <h3 style={{ color: "var(--text-light)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "var(--neon-orange)" }}>⚡</span> {clsDef.name} Skill Tree
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {clsDef.skills.map(s => {
              const isUnlocked = level >= s.level;
              return (
                <div key={s.level} style={{ 
                  display: "flex", 
                  gap: "15px", 
                  alignItems: "center",
                  padding: "15px",
                  borderRadius: "10px",
                  background: isUnlocked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                  border: isUnlocked ? "1px solid rgba(255,106,0,0.3)" : "1px dashed rgba(255,255,255,0.1)",
                  opacity: isUnlocked ? 1 : 0.5
                }}>
                  <div style={{ 
                    width: "45px", 
                    height: "45px", 
                    borderRadius: "10px", 
                    background: isUnlocked ? "var(--neon-orange)" : "#333", 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center",
                    fontWeight: "bold",
                    color: "#fff",
                    flexShrink: 0,
                    boxShadow: isUnlocked ? "0 0 10px rgba(255,106,0,0.5)" : "none"
                  }}>
                    L{s.level}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "5px" }}>
                      <span style={{ fontWeight: "bold", color: "var(--text-light)", fontSize: "16px" }}>{s.name}</span>
                      {isUnlocked && <span style={{ fontSize: "11px", background: "var(--neon-green)", color: "#000", padding: "2px 6px", borderRadius: "4px", fontWeight: "bold" }}>UNLOCKED</span>}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: "1.4" }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Watch History */}
        <div style={{ flex: 1, minWidth: "250px", background: "var(--bg-dark-base)", padding: "25px", borderRadius: "15px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ color: "var(--text-light)", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ color: "var(--neon-blue)" }}>📺</span> Recent Watch History
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, overflowY: "auto", maxHeight: "500px", paddingRight: "5px" }}>
            {profile?.watchHistory?.length > 0 ? (
              profile.watchHistory.map((item, i) => (
                <div key={i} style={{ 
                  display: "flex", 
                  gap: "12px", 
                  padding: "10px", 
                  background: "rgba(255,255,255,0.03)", 
                  borderRadius: "8px",
                  alignItems: "center"
                }}>
                  <div style={{ width: "80px", height: "45px", borderRadius: "4px", overflow: "hidden", flexShrink: 0, background: "#111" }}>
                    <img src={`https://img.youtube.com/vi/${item.id}/mqdefault.jpg`} alt="thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "var(--text-light)", fontSize: "13px", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px" }}>
                      {item.title}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                      {new Date(item.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)", marginTop: "40px", fontSize: "14px" }}>
                No watch history yet. Start a match!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
