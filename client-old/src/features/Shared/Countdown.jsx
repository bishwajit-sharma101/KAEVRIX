export default function Countdown({ countdown, room }) {
  return (
    <div className="countdown-container">
      <div className="hero-subtitle">MATCH STARTS IN</div>
      <div className="countdown-number">{countdown}</div>
      <p className="matchmaking-video-info" style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.2)" }}>
        {room?.video.title}
      </p>
    </div>
  );
}
