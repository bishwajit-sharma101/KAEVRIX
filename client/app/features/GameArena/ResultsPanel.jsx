import * as sound from "../../utils/audio";

export default function ResultsPanel({ gameResults, username, xpGained, leveledUp, onPlayAgain }) {
  const isDraw = gameResults.draw;
  const isMeWinner = gameResults.winner && gameResults.winner.username === username;

  const handleActionClick = () => {
    sound.playClockTick();
    onPlayAgain();
  };

  return (
    <div className="results-container glass-panel glowing-border-neon">
      {isDraw ? (
        <div className="podium-badge draw">
          <span className="podium-medal">🤝</span>
          <h1 className="results-header-text draw">DRAW MATCH!</h1>
          <div className="podium-desc">Perfect sync. Points split down the middle!</div>
        </div>
      ) : isMeWinner ? (
        <div className="podium-badge victory animate-bounce-subtle">
          <span className="podium-medal">🏆</span>
          <h1 className="results-header-text victory">VICTORY</h1>
          <div className="level-up-alert">YOU ARE THE ARENA CHAMPION!</div>
        </div>
      ) : (
        <div className="podium-badge defeat">
          <span className="podium-medal">💀</span>
          <h1 className="results-header-text defeat">DEFEAT</h1>
          <div className="podium-desc" style={{ color: "var(--text-muted)", marginBottom: "15px" }}>
            Systems overloaded. Better watch closer next time!
          </div>
        </div>
      )}

      {/* XP Award Grid */}
      <div className="results-xp-award">
        ⭐ +{xpGained} XP GAINED
        {leveledUp && <span className="level-up-toast animate-pulse"> (LEVEL UP!)</span>}
      </div>

      {/* Stats Comparison Grid */}
      <div className="stats-comp-grid">
        {gameResults.players.map((p) => {
          const isMe = p.username === username;
          const isWinner = gameResults.winner && gameResults.winner.username === p.username;
          return (
            <div key={p.username} className={`stat-comp-card ${isWinner ? "winner-card" : ""}`}>
              <h3 className="stat-card-title">
                {p.username} {isMe ? "(You)" : ""} {isWinner ? "👑" : ""}
              </h3>
              
              <div className="stat-card-row">
                <span className="stat-row-label">Correct Answers</span>
                <span className="stat-row-val" style={{ color: p.correctCount >= 3 ? "var(--neon-green)" : "var(--neon-pink)" }}>
                  {p.correctCount} / 5
                </span>
              </div>

              <div className="stat-card-row">
                <span className="stat-row-label">Watch Progress</span>
                <span className="stat-row-val" style={{ color: p.watchProgress < 100 ? "var(--neon-pink)" : "var(--neon-green)" }}>
                  {p.watchProgress}%
                </span>
              </div>

              <div className="stat-card-row">
                <span className="stat-row-label">Speedrun Mult.</span>
                <span className="stat-row-val" style={{ color: p.multiplier > 1.0 ? "var(--neon-gold)" : "var(--text-muted)" }}>
                  {p.multiplier ? p.multiplier.toFixed(1) : "1.0"}x
                </span>
              </div>

              <div className="stat-card-row">
                <span className="stat-row-label">Base Score</span>
                <span className="stat-row-val">{p.correctCount * 100} pts</span>
              </div>

              <div className="stat-card-row">
                <span className="stat-row-label">Total Points</span>
                <span className="stat-row-val highlight">{p.score}</span>
              </div>

              <div className="stat-card-row">
                <span className="stat-row-label">Solving Speed</span>
                <span className="stat-row-val">{p.submitTimeSec}s</span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
        <button className="btn-primary" onClick={handleActionClick}>
          PLAY AGAIN ⚔️
        </button>
        <button className="btn-secondary" onClick={handleActionClick}>
          RETURN TO DASHBOARD
        </button>
      </div>
    </div>
  );
}
