import { useEffect, useRef } from "react";

export default function ChatBox({ messages, chatInput, setChatInput, onSendChat, username, placeholder = "Talk strategy or trash..." }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="glass-panel chat-panel" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div ref={containerRef} className="chat-messages" style={{ flex: 1, overflowY: "auto" }}>
        {messages.map((msg) => (
          <div key={msg.id} className="chat-message">
            <div className="chat-msg-header">
              <span className={`chat-sender ${msg.sender === username ? "self" : ""} ${msg.sender === "SYSTEM" ? "system-text" : ""}`}>
                {msg.sender === "SYSTEM" ? "📢 SYSTEM" : msg.sender}
              </span>
              <span className="chat-time">{msg.timestamp}</span>
            </div>
            <div className={`chat-text ${msg.sender === "SYSTEM" ? "system-message" : ""}`}>
              {msg.message}
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={onSendChat} className="chat-input-box">
        <input
          type="text"
          className="input-field"
          placeholder={placeholder}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button type="submit" className="btn-primary" style={{ padding: "10px 15px", borderRadius: "10px" }}>
          Send
        </button>
      </form>
    </div>
  );
}
