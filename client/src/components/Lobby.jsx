
import * as sound from "../utils/audio";

export default function Lobby({
  room,
  socket,
  avatar,
  username,
  level,
  getRankTitle,
  opponent,
  chatMessages,
  chatInput,
  setChatInput,
  onSendChat,
  onReadyToPlay,
  onForfeit
}) {
  const isMeReady = room?.players.find((p) => p.username.toLowerCase() === username.toLowerCase())?.ready;
  const isOpponentReady = room?.players.find((p) => p.username.toLowerCase() !== username.toLowerCase())?.ready;

  const handleReadyClick = () => {
    sound.playClockTick();
    onReadyToPlay();
  };

  return (
    <div className="matchmaking-container lobby-container">
      <h2 className="hero-title" style={{ color: "var(--neon-green)" }}>DUEL READY!</h2>
      <p className="hero-subtitle">You have matched for: <span style={{ color: "var(--text-light)", fontWeight: "bold" }}>{room?.video.title}</span></p>
      
      <div className="vs-container">
        <div className={`vs-player-card ${isMeReady ? "ready-card-glow" : "not-ready-card"}`}>
          <div className="vs-player-avatar" style={{overflow: 'hidden', border: '3px solid var(--neon-blue)'}}>
            {avatar && avatar.includes('http') ? <img src={avatar} alt="avatar" style={{width: '100%', height: '100%', objectFit: 'cover'}}/> : avatar}
          </div>
          <div className="vs-player-name">{username}</div>
          <div className="profile-level-badge">LVL {level} - {getRankTitle(level)}</div>
          <div className={`ready-tag ${isMeReady ? "ready" : "waiting"}`}>
            {isMeReady ? "✓ READY" : "⏳ WAITING"}
          </div>
        </div>
        
        <div className="vs-middle">VS</div>
        
        <div className={`vs-player-card ${isOpponentReady ? "ready-card-glow-pink" : "not-ready-card"}`}>
          <div className="vs-player-avatar vs-opponent-avatar">{opponent?.isBot ? "🤖" : "👤"}</div>
          <div className="vs-player-name">{opponent?.username}</div>
          <div className="profile-level-badge">LVL {opponent?.level || 1} - {getRankTitle(opponent?.level || 1)}</div>
          <div className={`ready-tag ${isOpponentReady ? "ready" : "waiting"}`}>
            {isOpponentReady ? "✓ READY" : "⏳ WAITING"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", marginTop: "10px", marginBottom: "30px" }}>
        <button
          className={`btn-primary ${isMeReady || room?.generatingQuiz ? "btn-disabled" : ""}`}
          disabled={isMeReady || room?.generatingQuiz}
          onClick={handleReadyClick}
        >
          {room?.generatingQuiz ? "🧠 AI GENERATING QUIZ..." : (isMeReady ? "✓ READY LOCKED" : "⚔️ CHOOSE READY")}
        </button>
        <button className="btn-secondary" onClick={onForfeit}>
          FORFEIT
        </button>
      </div>

    </div>
  );
}
