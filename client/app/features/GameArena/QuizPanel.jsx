import ChatBox from "../Shared/ChatBox";
import * as sound from "../../utils/audio";

export default function QuizPanel({
  questions,
  currentQuestionIdx,
  setCurrentQuestionIdx,
  selectedAnswers,
  handleSelectOption,
  doubleDownQuestions,
  handleDoubleDown,
  disabledOptions,
  handleHackersClue,
  quizTimer,
  energy,
  opponentSubmitted,
  handleNextQuestion,
  chatMessages,
  chatInput,
  setChatInput,
  onSendChat,
  username
}) {
  const currentQuestion = questions[currentQuestionIdx];

  const handleOptionClick = (optIdx) => {
    sound.playClockTick();
    handleSelectOption(optIdx);
  };

  const handlePrevQuestionClick = () => {
    sound.playClockTick();
    setCurrentQuestionIdx((p) => p - 1);
  };

  const handleNextClick = () => {
    // Next sound feedback is done inside App.jsx handleNextQuestion
    handleNextQuestion();
  };

  return (
    <div className="dashboard-grid">
      <main className="dashboard-main">
        <div className="glass-panel quiz-container glowing-border-purple">
          {/* Quiz Header Info */}
          <div className="quiz-header">
            <span className="quiz-question-index">
              QUESTION {currentQuestionIdx + 1} OF {questions.length}
            </span>
            <span className={`quiz-timer ${quizTimer <= 15 ? "timer-hurry" : ""}`}>
              ⏱️ {quizTimer}s REMAINING
            </span>
          </div>

          {/* Quiz Modifiers Row */}
          <div className="quiz-powerup-row">
            <button
              className={`quiz-powerup-btn double-down-btn ${doubleDownQuestions[currentQuestionIdx] ? "active" : ""}`}
              disabled={energy < 30 && !doubleDownQuestions[currentQuestionIdx]}
              onClick={handleDoubleDown}
            >
              ⚡ DOUBLE DOWN (30% Energy)
            </button>
            <button
              className="quiz-powerup-btn clue-btn"
              disabled={energy < 60 || (disabledOptions[currentQuestionIdx] && disabledOptions[currentQuestionIdx].length > 0)}
              onClick={handleHackersClue}
            >
              💻 HACKER'S CLUE (60% Energy)
            </button>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-gamer)", fontSize: "11px", color: "var(--neon-gold)" }}>
              🔋 {energy}% battery
            </div>
          </div>

          {/* Question Text Box */}
          <div className="quiz-question-box">
            <h3 className="quiz-question-text">{currentQuestion?.question}</h3>
          </div>

          {/* Options grid */}
          <div className="quiz-options-grid">
            {currentQuestion?.options.map((option, idx) => {
              const currentDisabled = disabledOptions[currentQuestionIdx] || [];
              const isDisabled = currentDisabled.includes(idx);
              const isSelected = selectedAnswers[currentQuestionIdx] === idx;
              return (
                <button
                  key={idx}
                  disabled={isDisabled}
                  className={`quiz-option-btn ${isSelected ? "selected" : ""} ${isDisabled ? "disabled-clue" : ""}`}
                  onClick={() => handleOptionClick(idx)}
                >
                  <span className="quiz-option-letter">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          {/* Prev/Next Buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
            <button
              className="btn-secondary"
              disabled={currentQuestionIdx === 0}
              onClick={handlePrevQuestionClick}
            >
              PREVIOUS
            </button>
            
            <button
              className="btn-primary"
              disabled={selectedAnswers[currentQuestionIdx] === null}
              onClick={handleNextClick}
            >
              {currentQuestionIdx === questions.length - 1 ? "SUBMIT DUEL" : "NEXT QUESTION"}
            </button>
          </div>
        </div>
      </main>

      {/* Opponent Status & Chat Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="glass-panel opponent-quiz-monitor">
          <h4 className="panel-title">Duel status</h4>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "15px" }}>
            Answers Locked:{" "}
            <span style={{ color: "var(--text-light)", fontWeight: "bold" }}>
              {selectedAnswers.filter((a) => a !== null).length} / 5
            </span>
          </p>
          
          {opponentSubmitted ? (
            <div className="opponent-status-tag ready-tag ready">
              ✓ Opponent has submitted all answers!
            </div>
          ) : (
            <div className="opponent-status-tag ready-tag waiting animate-pulse">
              ⏳ Opponent is still answering...
            </div>
          )}
        </div>

        {/* Live Chat component */}
        <div className="glass-panel" style={{ height: "300px", padding: "15px" }}>
          <ChatBox
            messages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            onSendChat={onSendChat}
            username={username}
            placeholder="Psych them out during solving..."
          />
        </div>
      </aside>
    </div>
  );
}
