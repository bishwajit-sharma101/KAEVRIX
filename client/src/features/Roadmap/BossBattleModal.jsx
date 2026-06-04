import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as sound from "../../utils/audio";

// SVG Boss Sprite Components (Premium Ethereal Dark Fantasy)
function CallbackDemonSVG({ isHurt }) {
  return (
    <svg width="140" height="140" viewBox="0 0 100 100" style={{ animation: "bossFloat 4s ease-in-out infinite", filter: isHurt ? "drop-shadow(0 0 50px #ff0000) brightness(1.5)" : "drop-shadow(0 0 35px rgba(168,85,247,0.8))" }}>
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
    <svg width="140" height="140" viewBox="0 0 100 100" style={{ animation: "bossBreathe 5s ease-in-out infinite", filter: isHurt ? "drop-shadow(0 0 50px #ff0000) brightness(1.5)" : "drop-shadow(0 0 35px rgba(200,16,46,0.7))" }}>
      <defs>
        <radialGradient id="wardenGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff"/>
          <stop offset="40%" stopColor="#c8102e"/>
          <stop offset="100%" stopColor="#1a1403" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="#c8102e" strokeWidth="0.5" strokeDasharray="2 6" style={{ animation: "spinSlow 30s linear infinite", transformOrigin: "50px 50px" }}/>
      <circle cx="50" cy="50" r="38" fill="none" stroke="#c8102e" strokeWidth="1" strokeDasharray="20 15 5 15" style={{ animation: "spinSlowReverse 25s linear infinite", transformOrigin: "50px 50px" }}/>
      <polygon points="50,15 70,50 50,85 30,50" fill="url(#wardenGlow)" style={{ animation: "pulseOpacity 3s infinite alternate" }} />
      <polygon points="50,25 60,50 50,75 40,50" fill="#fff" />
      <path d="M 50 15 C 80 0 90 40 50 50" fill="none" stroke="#c8102e" strokeWidth="1" />
      <path d="M 50 85 C 20 100 10 60 50 50" fill="none" stroke="#c8102e" strokeWidth="1" />
    </svg>
  );
}

function DOMDestroyerSVG({ isHurt }) {
  return (
    <svg width="140" height="140" viewBox="0 0 100 100" style={{ animation: "bossGlitch 2.5s steps(2) infinite", filter: isHurt ? "drop-shadow(0 0 50px #ff0000) brightness(1.5)" : "drop-shadow(0 0 40px rgba(34,197,94,0.6))" }}>
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
    <svg width="140" height="140" viewBox="0 0 100 100" style={{ animation: "bossFloat 5s ease-in-out infinite", filter: isHurt ? "drop-shadow(0 0 50px #ff0000) brightness(1.5)" : "drop-shadow(0 0 40px rgba(255,106,0,0.6))" }}>
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
    <svg width="140" height="140" viewBox="0 0 100 100" style={{ animation: "bossBreathe 3s ease-in-out infinite", filter: isHurt ? "drop-shadow(0 0 50px #ff0000) brightness(1.5)" : "drop-shadow(0 0 40px rgba(239,68,68,0.7))" }}>
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

function renderBossSprite(bossType, isHurt) {
  if (bossType === "Callback Demon") return <CallbackDemonSVG isHurt={isHurt} />;
  if (bossType === "Scope Warden") return <ScopeWardenSVG isHurt={isHurt} />;
  if (bossType === "DOM Destroyer") return <DOMDestroyerSVG isHurt={isHurt} />;
  if (bossType === "Syntax Sentinel") return <SyntaxSentinelSVG isHurt={isHurt} />;
  if (bossType === "Garbage Collector") return <GarbageCollectorSVG isHurt={isHurt} />;
  return <SyntaxSentinelSVG isHurt={isHurt} />;
}

// Helper to define RPG Script dialogues for Elden Ring / Dark Souls storytelling
const getDialogueScript = (bossType, topic) => {
  const scripts = {
    "Callback Demon": {
      greeting: `HAHAHA! Another lost scholar enters my domain. You think your little scripts can master the Erdtree of ${topic}? You'll be trapped in my callback hell forever!`,
      responses1: [
        "My closures are airtight. I'll execute you without delay!",
        "Your gargoyle wings are looking a bit deprecated. Time for garbage collection.",
        "I only seek to master this milestone. Let me pass."
      ],
      reactions1: [
        `Airtight closures? *cackles* I will overflow your call stack before your first event tick! Hahaha!`,
        `Deprecated? Deprecated?! I was here before your first npm install, child! You will burn! *howls*`,
        `Quick? Quick?! Death is instantaneous in my runtime! Prepare to be rejected! *screeches*`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Draw your blade!",
        "[Brace yourself] I will compile whatever errors you throw."
      ],
      finalThreat: `*cackles* DIE, FOOLISH TRAVELER! Let the heap overflow!`
    },
    "Scope Warden": {
      greeting: `Intruder! You dare step into the lexical scopes of the Erdtree? I am the Scope Warden. Your variables are undefined here!`,
      responses1: [
        "I will bind myself to this scope and override your status!",
        "Lexical scope? Looks like a tiny prison. I'll break it down.",
        "Please, Warden. I only seek knowledge of this milestone."
      ],
      reactions1: [
        `Bind? *guffaws* You are out of scope! I will throw a ReferenceError that tears your code apart!`,
        `A prison? *growls* This prison is your grave! Let us see if your references survive my sweep!`,
        `Knowledge is a curse for the unworthy! Your access token is REVOKED! *cackles*`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Draw your blade!",
        "[Brace yourself] I will compile whatever errors you throw."
      ],
      finalThreat: `Silence, out-of-scope worm! DIE!`
    },
    "DOM Destroyer": {
      greeting: `SKRRRZT! The DOM is mine! I have shattered the virtual tree! You think you can render anything in my domain? I will tear your nodes apart!`,
      responses1: [
        "I will append my logic to your core and force a clean re-render!",
        "Virtual tree? Looks like you have a memory leak. Let me patch you.",
        "I just want to mount my components and pass. No need to destroy."
      ],
      reactions1: [
        `Re-render?! *screeches* I will paint your screen in layout thumps! Paint flashing begins now!`,
        `Patch me? *cackles* You can't even querySelector your own soul! Prepare for detachment!`,
        `No need? Component mount? *guffaws* Everything you render is immediately unmounted and GC'd! DIE!`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Draw your blade!",
        "[Brace yourself] I will compile whatever errors you throw."
      ],
      finalThreat: `Layout thrashing starts NOW! DIE!`
    },
    "Syntax Sentinel": {
      greeting: `TICK-TOCK. I am the Syntax Sentinel. I enforce the sacred compile rules of ${topic}. Your code contains fatal compiler errors, traveler!`,
      responses1: [
        "My syntax is clean. My linters are strict. Draw your gears!",
        "Tick-tock? Your gears sound like they need some oil. Let me break them.",
        "I'll correct any errors. Just let me master this milestone."
      ],
      reactions1: [
        `Strict linters? *clanks* I will insert an unexpected token at line 1 and watch you fail! Hahaha!`,
        `Break my gears?! *screeches* I compile in assembly, worm! You compile in dust! Clank-clank!`,
        `Correct them? *guffaws* You cannot correct the fundamental flaws in your logic! Let parsing fail!`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Draw your blade!",
        "[Brace yourself] I will compile whatever errors you throw."
      ],
      finalThreat: `UNEXPECTED TOKEN DETECTED! TERMINATING VISITOR!`
    },
    "Garbage Collector": {
      greeting: `BZZZT! Scrap metal, scrap code, scrap souls! I collect the garbage of the Erdtree. And you, traveler... look like garbage! *laughs wheezily*`,
      responses1: [
        "I am a persistent reference. You cannot collect me!",
        "Look in the mirror, metal bucket. You're the one leaking memory.",
        "I am not garbage. I'm just here to study."
      ],
      reactions1: [
        `Persistent reference? *wheezes* I will nullify your parent scope and sweep you into the void!`,
        `Leaking memory?! *roars* I am memory optimization incarnate! You are just a heap allocation waiting to be freed!`,
        `Study? *guffaws* The only thing you will study is the garbage heap! Let's free your references!`
      ],
      responses2: [
        "[Draw weapon] Enough talk. Draw your blade!",
        "[Brace yourself] I will compile whatever errors you throw."
      ],
      finalThreat: `INITIATING GARBAGE SWEEP! SWEEPING YOU OUT!`
    }
  };
  
  return scripts[bossType] || scripts["Syntax Sentinel"];
};

export default function BossBattleModal({ topic, milestone, username, onClose, onVictory }) {
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState("summoning"); // summoning, intro, battle, victory, defeat
  const [bossData, setBossData] = useState(null);
  
  const [bossHP, setBossHP] = useState(100);
  const [playerHP, setPlayerHP] = useState(3);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAns, setSelectedAns] = useState(null);
  const [isAnswering, setIsAnswering] = useState(false);
  
  const [bossHurt, setBossHurt] = useState(false);
  const [playerHurt, setPlayerHurt] = useState(false);
  const [floatingDamage, setFloatingDamage] = useState(null);
  const [timer, setTimer] = useState(15);
  
  // Dialogue state variables (Story quest)
  const [dialogueStep, setDialogueStep] = useState(0);
  const [displayedBossText, setDisplayedBossText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chosenResponse, setChosenResponse] = useState(0);

  // loading screen logs
  const [summonLogs, setSummonLogs] = useState([]);
  const [loadingPct, setLoadingPct] = useState(0);

  const timerInterval = useRef(null);
  const typingTimer = useRef(null);
  const voiceAudioCtx = useRef(null);

  // Generate embers layout statically to avoid reflicking layouts
  const embers = useRef(
    Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      size: 2 + Math.random() * 4,
      color: Math.random() > 0.5 ? "#d4af37" : "#ef4444"
    }))
  ).current;

  // Synthesize voice blips with rapid formant variation ("tina mita" gibberish speech)
  const playSpeechSound = (char, bossType) => {
    try {
      if (!voiceAudioCtx.current) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        voiceAudioCtx.current = new AudioContextClass();
      }
      const ctx = voiceAudioCtx.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      let baseFreq = 120;
      let type = "triangle";
      let duration = 0.05;
      let filterFreq = 1000;
      
      if (bossType === "Callback Demon") {
        baseFreq = 80;
        type = "sawtooth";
        filterFreq = 500;
      } else if (bossType === "Scope Warden") {
        baseFreq = 180;
        type = "sine";
        filterFreq = 1500;
      } else if (bossType === "DOM Destroyer") {
        baseFreq = 130;
        type = "square";
        filterFreq = 950;
      } else if (bossType === "Syntax Sentinel") {
        baseFreq = 200;
        type = "triangle";
        filterFreq = 1800;
      } else if (bossType === "Garbage Collector") {
        baseFreq = 95;
        type = "sawtooth";
        filterFreq = 750;
      }
      
      const code = char.charCodeAt(0) || 65;
      // Synthesize consonant-vowel transitions by modifying frequency and filter envelope
      const freq = baseFreq + (code % 8) * 11;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      // Cadence pitch shifting to simulate speaking words
      if (code % 3 === 0) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.15, ctx.currentTime + duration * 0.4);
      } else {
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, ctx.currentTime + duration * 0.4);
      }
      
      filter.type = "peaking";
      filter.frequency.setValueAtTime(filterFreq, ctx.currentTime);
      filter.Q.setValueAtTime(4, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.01);
    } catch (e) {}
  };

  // Tickers typing text word-by-word/char-by-char with speaking sound effects
  const typeText = (text, onFinish) => {
    setIsTyping(true);
    setDisplayedBossText("");
    let i = 0;
    if (typingTimer.current) clearInterval(typingTimer.current);

    typingTimer.current = setInterval(() => {
      if (i < text.length) {
        const char = text[i];
        setDisplayedBossText((prev) => prev + char);
        if (char !== " " && i % 2 === 0) {
          playSpeechSound(char, bossData?.bossType || "Syntax Sentinel");
        }
        i++;
      } else {
        clearInterval(typingTimer.current);
        setIsTyping(false);
        if (onFinish) onFinish();
      }
    }, 28);
  };

  // 1. Fetch boss questions
  useEffect(() => {
    let active = true;
    const fetchBossData = async () => {
      try {
        const BACKEND_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname) ? "http://localhost:5000" : "";
        const res = await fetch(`${BACKEND_URL}/api/boss/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic, milestone })
        });
        if (!res.ok) throw new Error("Failed to generate boss questions");
        const data = await res.json();
        
        if (active) {
          setBossData(data);
          setLoading(false);
          setStage("intro");
          setDialogueStep(0);
          sound.playGlitch();
        }
      } catch (err) {
        console.error("Error loading boss:", err);
        if (active) {
          const fallback = {
            bossType: "Syntax Sentinel",
            bossIntro: "Foolish compiler! You think your code compiles here?",
            questions: [
              {
                question: "What is the result of missing a closing brace in a CSS style block?",
                options: [
                  "The browser crashes instantly",
                  "Vite builds it without issues",
                  "The rest of the code is treated as plain text css",
                  "The page becomes red automatically"
                ],
                answerIndex: 2,
                damageExplanation: "An unclosed brace prevents stylesheet parsing, causing later elements to render as plain CSS strings."
              },
              {
                question: "In React, what happens when hooks are executed conditionally or after early returns?",
                options: [
                  "React skips rendering those components",
                  "The hook order changes between renders, causing runtime errors",
                  "Performance is boosted by 50%",
                  "The component re-mounts on every state change"
                ],
                answerIndex: 1,
                damageExplanation: "React relies on the order of Hook calls to associate states. Changing order throws Hook order violation crashes."
              },
              {
                question: "Which CSS property moves animations to hardware-accelerated GPU layers to prevent thumping layout repaints?",
                options: ["display: block", "position: absolute", "transform: translate3d", "margin: auto"],
                answerIndex: 2,
                damageExplanation: "translate3d forces GPU rendering, creating a separate compositor layer and preventing layout thumping."
              },
              {
                question: "What is the primary function of Mongoose strict schema enforcement?",
                options: [
                  "To throw database validation exceptions on unmapped fields",
                  "To ignore fields not present in the model schema definition",
                  "To encrypt passwords using bcrypt automatically",
                  "To prevent socket connections from non-authenticated clients"
                ],
                answerIndex: 1,
                damageExplanation: "Strict schemas silently drop fields on document save if they aren't declared in the Mongoose schema definition."
              },
              {
                question: "Why should we avoid inline Math.random() variables in React JSX component render loops?",
                options: [
                  "It causes syntax compiling warnings",
                  "It regenerates values on every tick render, causing visual jumpiness/flickering",
                  "It locks the CPU threads",
                  "It returns float numbers instead of integers"
                ],
                answerIndex: 1,
                damageExplanation: "Recalculating random numbers on each frame tick renders elements at unstable styles, causing flashing."
              }
            ]
          };
          setBossData(fallback);
          setLoading(false);
          setStage("intro");
          setDialogueStep(0);
          sound.playGlitch();
        }
      }
    };

    fetchBossData();
    return () => { active = false; };
  }, [topic, milestone]);

  // Loading Ticker logs
  useEffect(() => {
    if (loading) {
      const logsList = [
        "✦ COMMUNING WITH THE KNOWLEDGE ARCHITECTURE...",
        "✦ RATIONING SOUL POWER FROM THE MILESTONE CORES...",
        "✦ ALLOCATING GEMMA COMPILER PARSING THREADS...",
        "✦ STABILIZING CONSOLE CONNECTION VECTOR...",
        "✦ DEFENDER CONSTRUCT DEPLOYED SUCCESSFULLY..."
      ];
      
      let logIdx = 0;
      const logInterval = setInterval(() => {
        if (logIdx < logsList.length) {
          setSummonLogs(prev => [...prev, logsList[logIdx]]);
          logIdx++;
        }
      }, 250);
      
      const pctInterval = setInterval(() => {
        setLoadingPct(prev => {
          if (prev >= 100) {
            clearInterval(pctInterval);
            return 100;
          }
          return prev + 5;
        });
      }, 70);
      
      return () => {
        clearInterval(logInterval);
        clearInterval(pctInterval);
      };
    }
  }, [loading]);

  // Dialogue Tree Hook (Triggers typing greeting and plays profile music)
  useEffect(() => {
    if (stage === "intro" && bossData && dialogueStep === 0) {
      const colors = getThemeColors();
      sound.startBackgroundMusic(colors.musicProfile);
      
      const script = getDialogueScript(bossData.bossType, topic);
      typeText(script.greeting);
    }
  }, [stage, bossData, dialogueStep]);

  // Cleanup Music & Timers on Unmount
  useEffect(() => {
    return () => {
      sound.stopBackgroundMusic();
      if (typingTimer.current) clearInterval(typingTimer.current);
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (voiceAudioCtx.current) {
        try {
          voiceAudioCtx.current.close();
        } catch(e) {}
      }
    };
  }, []);

  // 2. Battle Timer
  useEffect(() => {
    if (stage === "battle" && !isAnswering) {
      setTimer(15);
      timerInterval.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(timerInterval.current);
            handleTimeout();
            return 0;
          }
          if (t <= 4) {
            sound.playCountdownBeep(t - 1);
          } else {
            sound.playClockTick(true);
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval.current);
  }, [stage, currentIdx, isAnswering]);

  const handleTimeout = () => {
    setIsAnswering(true);
    setPlayerHurt(true);
    setPlayerHP((h) => {
      const next = h - 1;
      if (next <= 0) {
        setTimeout(() => {
          setStage("defeat");
          sound.stopBackgroundMusic();
          sound.playDefeat();
        }, 1000);
      } else {
        typeText("TIME IS UP! Face my wrath!", () => {
          setTimeout(() => {
            setPlayerHurt(false);
            setIsAnswering(false);
            if (currentIdx < bossData.questions.length - 1) {
              setCurrentIdx((idx) => idx + 1);
            } else {
              setStage("defeat");
              sound.stopBackgroundMusic();
              sound.playDefeat();
            }
          }, 1000);
        });
        sound.playIncorrect();
      }
      return next;
    });
  };

  const handleAnswerSelect = (optIdx) => {
    if (isAnswering || isTyping) return;
    setIsAnswering(true);
    clearInterval(timerInterval.current);
    setSelectedAns(optIdx);

    const question = bossData.questions[currentIdx];
    const isCorrect = optIdx === question.answerIndex;

    if (isCorrect) {
      setBossHurt(true);
      setFloatingDamage("-25 HP");
      sound.playCorrect();
      setBossHP((hp) => {
        const next = hp - 25;
        if (next <= 0) {
          setTimeout(() => {
            setStage("victory");
            sound.stopBackgroundMusic();
            sound.playVictory();
            if (onVictory) onVictory(milestone.xpReward * 2);
          }, 1200);
        } else {
          typeText("Agh! That script... it compiles!", () => {
            setTimeout(() => {
              setBossHurt(false);
              setFloatingDamage(null);
              setIsAnswering(false);
              setSelectedAns(null);
              if (currentIdx < bossData.questions.length - 1) {
                setCurrentIdx((idx) => idx + 1);
              } else {
                setStage("victory");
                sound.stopBackgroundMusic();
                sound.playVictory();
                if (onVictory) onVictory(milestone.xpReward * 2);
              }
            }, 1000);
          });
        }
        return next;
      });
    } else {
      setPlayerHurt(true);
      sound.playIncorrect();
      setPlayerHP((h) => {
        const next = h - 1;
        if (next <= 0) {
          setTimeout(() => {
            setStage("defeat");
            sound.stopBackgroundMusic();
            sound.playDefeat();
          }, 1200);
        } else {
          typeText(`INCORRECT! ${question.damageExplanation}`, () => {
            setTimeout(() => {
              setPlayerHurt(false);
              setIsAnswering(false);
              setSelectedAns(null);
              if (currentIdx < bossData.questions.length - 1) {
                setCurrentIdx((idx) => idx + 1);
              } else {
                setStage("defeat");
                sound.stopBackgroundMusic();
                sound.playDefeat();
              }
            }, 2000);
          });
        }
        return next;
      });
    }
  };

  const handleStartBattle = () => {
    sound.playWhoosh();
    setStage("battle");
  };

  const handleRetry = () => {
    sound.playClockTick();
    setBossHP(100);
    setPlayerHP(3);
    setCurrentIdx(0);
    setSelectedAns(null);
    setIsAnswering(false);
    setDialogueStep(0);
    setStage("intro");
  };

  // Dialogue Tree Choices Click Handlers
  const handleChoiceSelect = (choiceIdx) => {
    if (isTyping) return;
    sound.playClockTick();
    
    if (dialogueStep === 0) {
      setChosenResponse(choiceIdx);
      setDialogueStep(1);
      const script = getDialogueScript(bossData.bossType, topic);
      typeText(script.reactions1[choiceIdx]);
    } else if (dialogueStep === 1) {
      setDialogueStep(2);
      const script = getDialogueScript(bossData.bossType, topic);
      typeText(script.finalThreat);
    }
  };

  const getThemeColors = () => {
    const type = bossData?.bossType || "Syntax Sentinel";
    if (type === "Callback Demon") {
      return {
        primary: "#a855f7",
        secondary: "#ff007f",
        glow: "rgba(168,85,247,0.4)",
        gradient: "radial-gradient(circle at 50% 35%, #180924 0%, #040206 100%)",
        musicProfile: 7
      };
    }
    if (type === "Scope Warden") {
      return {
        primary: "#eab308",
        secondary: "#38bdf8",
        glow: "rgba(234,179,8,0.4)",
        gradient: "radial-gradient(circle at 50% 35%, #241d08 0%, #050402 100%)",
        musicProfile: 1
      };
    }
    if (type === "DOM Destroyer") {
      return {
        primary: "#22c55e",
        secondary: "#06b6d4",
        glow: "rgba(34,197,94,0.4)",
        gradient: "radial-gradient(circle at 50% 35%, #081c0b 0%, #020502 100%)",
        musicProfile: 8
      };
    }
    if (type === "Garbage Collector") {
      return {
        primary: "#ef4444",
        secondary: "#f97316",
        glow: "rgba(239,68,68,0.4)",
        gradient: "radial-gradient(circle at 50% 35%, #240808 0%, #060202 100%)",
        musicProfile: 7
      };
    }
    return {
      primary: "#ff6a00",
      secondary: "#00e5ff",
      glow: "rgba(255,106,0,0.4)",
      gradient: "radial-gradient(circle at 50% 35%, #261004 0%, #060302 100%)",
      musicProfile: 1
    };
  };

  const colors = getThemeColors();

  // Render Hearts for Player Health
  const renderHearts = () => {
    return Array.from({ length: 3 }).map((_, idx) => {
      const active = idx < playerHP;
      return (
        <svg key={idx} width="24" height="24" viewBox="0 0 16 16" style={{ marginRight: "6px", shapeRendering: "crispEdges", imageRendering: "pixelated", filter: active ? "drop-shadow(0 0 6px #ff0055)" : "none", transition: "transform 0.4s" }} className={!active ? "heart-broken" : ""}>
          <path d="M 3 3 L 5 3 L 5 5 L 3 5 Z M 11 3 L 13 3 L 13 5 L 11 5 Z M 5 2 L 11 2 L 11 3 L 5 3 Z M 2 5 L 4 5 L 4 7 L 2 7 Z M 12 5 L 14 5 L 14 7 L 12 7 Z M 1 7 L 3 7 L 3 9 L 1 9 Z M 13 7 L 15 7 L 15 9 L 13 9 Z M 2 9 L 4 9 L 4 11 L 2 11 Z M 12 9 L 14 9 L 14 11 L 12 11 Z M 3 11 L 5 11 L 5 13 L 3 13 Z M 11 11 L 13 11 L 13 13 L 11 13 Z M 5 13 L 11 13 L 11 14 L 5 14 Z" fill={active ? "#ff0055" : "#374151"} />
          <rect x="5" y="4" width="6" height="8" fill={active ? "#cc0044" : "#1f2937"} />
          <rect x="3" y="5" width="10" height="5" fill={active ? "#cc0044" : "#1f2937"} />
          {active && <rect x="5" y="4" width="2" height="2" fill="#ff6699" />}
        </svg>
      );
    });
  };

  const modalContent = (
    <div className={`er-viewport ${playerHurt ? "player-hurt" : ""}`} style={{ background: colors.gradient }}>
      {/* CSS Styling Block */}
      <style>{`
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
          position: fixed; inset: 0; z-index: 99999;
          color: #e0e0e0; font-family: 'Cormorant Garamond', serif;
          overflow-y: auto; overflow-x: hidden;
          display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
          user-select: none; background-color: #030303; padding: 12px 16px;
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

        .player-hurt { animation: screenShake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) 1; box-shadow: inset 0 0 100px rgba(200, 16, 46, 0.4); }
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

        .er-title { font-family: 'Cinzel Decorative', serif; font-size: 52px; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 20px rgba(255,255,255,0.4); text-transform: uppercase; }
        .er-subtitle-dialogue { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-style: italic; color: #cccccc; line-height: 1.4; text-shadow: 0 2px 8px rgba(0,0,0,0.9); text-align: center; max-width: 700px; margin: 0 auto; }

        .er-divider { display: flex; align-items: center; justify-content: center; margin: 20px 0; color: rgba(212, 175, 55, 0.4); font-size: 14px; width: 100%; }
        .er-divider::before, .er-divider::after { content: ""; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(200, 16, 46, 0.5), transparent); margin: 0 20px; }

        /* Premium Dark Souls Option Buttons */
        .er-option-btn-premium {
          position: relative; width: 100%; background: rgba(15, 15, 15, 0.7); backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1); color: #cccccc; font-family: 'Cormorant Garamond', serif;
          font-size: 19px; padding: 12px 20px; text-align: left; cursor: pointer; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex; align-items: center; overflow: hidden; outline: none;
        }
        .er-option-btn-premium::before {
          content: ""; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(200, 16, 46, 0.2) 0%, transparent 100%);
          opacity: 0; transition: opacity 0.3s ease;
        }
        .er-option-btn-premium:hover:not(:disabled) {
          color: #ffffff; border-color: rgba(200, 16, 46, 0.6); transform: translateX(4px); box-shadow: -4px 0 15px rgba(200, 16, 46, 0.3);
        }
        .er-option-btn-premium:hover:not(:disabled)::before { opacity: 1; }
        .er-option-premium-border {
          position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #c8102e; transform: scaleY(0); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .er-option-btn-premium:hover:not(:disabled) .er-option-premium-border { transform: scaleY(1); }
        .er-option-numeral { color: #8a0303; font-family: 'Cinzel', serif; font-weight: 700; font-size: 16px; margin-right: 14px; min-width: 30px; position: relative; z-index: 1; letter-spacing: 2px; }
        .er-option-text { position: relative; z-index: 1; line-height: 1.4; }

        .er-option-btn-premium.correct { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.6); color: #fff; box-shadow: 0 0 40px rgba(16, 185, 129, 0.25); }
        .er-option-btn-premium.correct .er-option-premium-border { background: #10b981; transform: scaleY(1); }
        .er-option-btn-premium.correct .er-option-numeral { color: #10b981; }

        .er-option-btn-premium.wrong { background: rgba(239, 68, 68, 0.2); border-color: rgba(239, 68, 68, 0.6); color: #fff; animation: optionShake 0.5s ease-out; }
        .er-option-btn-premium.wrong .er-option-premium-border { background: #ef4444; transform: scaleY(1); }
        .er-option-btn-premium.wrong .er-option-numeral { color: #ef4444; }
        @keyframes optionShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

        .er-action-btn { font-family: 'Cinzel', serif; font-size: 16px; letter-spacing: 4px; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3); background: rgba(10, 10, 10, 0.8); padding: 12px 28px; cursor: pointer; transition: all 0.3s ease; outline: none; text-shadow: 0 0 5px rgba(255,255,255,0.3); }
        .er-action-btn:hover { color: #fff; border-color: #c8102e; background: rgba(200, 16, 46, 0.2); box-shadow: 0 0 20px rgba(200, 16, 46, 0.4); transform: translateY(-2px); }

        .er-pedestal { width: 300px; height: 12px; background: radial-gradient(ellipse, rgba(255,255,255,0.25) 0%, transparent 80%); border-radius: 50%; margin: -10px auto 0; pointer-events: none; }

        .er-boss-hp-wrapper { width: 100%; max-width: 650px; margin: 20px auto; text-align: center; }
        .er-boss-hp-label { font-family: 'Cinzel', serif; font-size: 16px; letter-spacing: 4px; color: #dfd5be; margin-bottom: 6px; text-shadow: 0 2px 5px #000; font-weight: bold; }
        .er-boss-hp-track { height: 4px; background: rgba(0, 0, 0, 0.85); border-left: 2px solid #8a0303; border-right: 2px solid #8a0303; position: relative; box-shadow: 0 0 10px rgba(138,3,3,0.4); }
        .er-boss-hp-fill { height: 100%; background: #800000; box-shadow: 0 0 12px #ff0000; transition: width 0.3s cubic-bezier(0.19, 1, 0.22, 1); }

        .victory-text-glow { font-family: 'Cinzel Decorative', serif; font-size: 72px; letter-spacing: 8px; color: #ffffff; text-shadow: 0 0 40px rgba(255, 255, 255, 0.8); animation: textFadeScale 3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes textFadeScale { 0% { transform: scale(0.9) translateY(15px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }

        .defeat-screen { animation: screenFadeRed 1s ease-in forwards; }
        @keyframes screenFadeRed { 0% { background: transparent; } 100% { background: rgba(15, 2, 4, 0.98); } }
        .defeat-text-glow { font-family: 'Cinzel', serif; font-size: 80px; font-weight: 700; letter-spacing: 15px; color: #c80000; text-shadow: 0 0 40px rgba(200, 0, 0, 0.8); animation: deathStretch 5s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; }
        @keyframes deathStretch { 0% { transform: scaleX(0.8) scaleY(1); opacity: 0; letter-spacing: 4px; } 20% { opacity: 1; } 100% { transform: scaleX(1.05) scaleY(1); opacity: 1; letter-spacing: 15px; } }
      `}</style>

      {/* Ash/Embers Particles */}
      <div className="ember-field">
        {embers.map((e) => (
          <div
            key={e.id}
            className="ember"
            style={{
              left: `${e.left}%`,
              animationDelay: `${e.delay}s`,
              animationDuration: `${e.duration}s`,
              width: `${e.size}px`,
              height: `${e.size}px`,
              background: e.color,
              boxShadow: `0 0 6px ${e.color}`
            }}
          />
        ))}
      </div>

      {/* --- STAGE: SUMMONING (LOADING SCREEN) --- */}
      {loading && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 10, overflow: "hidden"
        }}>
          {/* Fog / atmosphere overlays */}
          <div style={{
            position: "absolute", inset: 0, 
            background: "radial-gradient(ellipse at 50% 120%, rgba(120, 0, 0, 0.25) 0%, transparent 60%)",
            animation: "pulseOpacity 4s ease-in-out infinite alternate", pointerEvents: "none"
          }} />
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 50% -20%, rgba(80, 0, 0, 0.15) 0%, transparent 50%)",
            pointerEvents: "none"
          }} />
          
          {/* Massive danger sigil in background */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -55%)",
            opacity: loadingPct > 30 ? 0.08 + (loadingPct / 1000) : 0, transition: "opacity 2s ease",
            pointerEvents: "none"
          }}>
            <svg width="500" height="500" viewBox="0 0 100 100" style={{ animation: "spinSlow 90s linear infinite" }}>
              <circle cx="50" cy="50" r="48" fill="none" stroke="#c8102e" strokeWidth="0.3" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#c8102e" strokeWidth="0.5" strokeDasharray="3 8" />
              <polygon points="50,5 95,75 5,75" fill="none" stroke="#c8102e" strokeWidth="0.4" />
              <polygon points="50,95 5,25 95,25" fill="none" stroke="#c8102e" strokeWidth="0.4" />
              <circle cx="50" cy="50" r="20" fill="none" stroke="#c8102e" strokeWidth="0.6" strokeDasharray="12 6" />
              <line x1="50" y1="2" x2="50" y2="98" stroke="#c8102e" strokeWidth="0.2" />
              <line x1="2" y1="50" x2="98" y2="50" stroke="#c8102e" strokeWidth="0.2" />
            </svg>
          </div>

          {/* Top warning text */}
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: "11px", letterSpacing: "8px",
            color: "#c8102e", textTransform: "uppercase", fontWeight: 700,
            marginBottom: "20px", opacity: loadingPct > 10 ? 0.8 : 0, transition: "opacity 1s ease"
          }}>
            — WARNING —
          </div>

          {/* Main massive title */}
          <div style={{
            fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(48px, 8vw, 90px)", 
            fontWeight: 900, letterSpacing: "clamp(8px, 2vw, 20px)", lineHeight: 1,
            color: "#ffffff", textTransform: "uppercase", textAlign: "center",
            textShadow: "0 0 60px rgba(200, 16, 46, 0.5), 0 0 120px rgba(200, 16, 46, 0.2), 0 4px 20px rgba(0,0,0,0.9)",
            marginBottom: "8px", animation: "pulseOpacity 3s ease-in-out infinite alternate"
          }}>
            A FOE
          </div>
          <div style={{
            fontFamily: "'Cinzel Decorative', serif", fontSize: "clamp(48px, 8vw, 90px)",
            fontWeight: 900, letterSpacing: "clamp(8px, 2vw, 20px)", lineHeight: 1,
            color: "#ffffff", textTransform: "uppercase", textAlign: "center",
            textShadow: "0 0 60px rgba(200, 16, 46, 0.5), 0 0 120px rgba(200, 16, 46, 0.2), 0 4px 20px rgba(0,0,0,0.9)",
            marginBottom: "30px"
          }}>
            APPROACHES
          </div>

          {/* Thin decorative line */}
          <div style={{
            width: "clamp(200px, 40vw, 500px)", height: "1px", marginBottom: "30px",
            background: "linear-gradient(90deg, transparent, rgba(200, 16, 46, 0.6), transparent)"
          }} />

          {/* Atmospheric flavor text */}
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontStyle: "italic",
            color: "#777", letterSpacing: "2px", marginBottom: "50px", maxWidth: "500px",
            textAlign: "center", lineHeight: 1.6,
            opacity: loadingPct > 20 ? 1 : 0, transition: "opacity 1.5s ease"
          }}>
            The air grows heavy. Something ancient stirs beneath the milestone...
          </div>

          {/* HP-bar style loading bar */}
          <div style={{ width: "clamp(280px, 50vw, 550px)", textAlign: "center" }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: "10px", letterSpacing: "5px",
              color: "#555", textTransform: "uppercase", marginBottom: "8px"
            }}>
              Manifesting Guardian
            </div>
            <div style={{
              width: "100%", height: "3px", background: "rgba(255,255,255,0.05)",
              position: "relative", overflow: "hidden"
            }}>
              <div style={{
                height: "100%", width: `${loadingPct}%`,
                background: "linear-gradient(90deg, #5a0000, #c8102e)",
                boxShadow: "0 0 15px rgba(200, 16, 46, 0.8), 0 0 30px rgba(200, 16, 46, 0.4)",
                transition: "width 0.08s linear"
              }} />
            </div>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: "28px", fontWeight: 700,
              color: "#c8102e", marginTop: "12px", letterSpacing: "4px",
              textShadow: "0 0 20px rgba(200, 16, 46, 0.5)"
            }}>
              {loadingPct}%
            </div>
          </div>
        </div>
      )}

      {/* --- STAGE: INTRO (RPG STORY DIALOGUE PHASE) --- */}
      {!loading && stage === "intro" && (
        <div style={{
          width: "100%", maxWidth: "800px", padding: "10px",
          display: "flex", flexDirection: "column", alignItems: "center",
          zIndex: 10, position: "relative", margin: "auto 0"
        }}>
          {/* Top Threat Indicator */}
          <div style={{ fontSize: "12px", color: "#ef4444", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "12px", fontWeight: "bold" }}>
            ⚔ Milestone Construct Materialized ⚔
          </div>

          {/* Boss Sprite and Altar */}
          <div style={{ height: "140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
            <div className={bossHurt ? "boss-hurt" : ""}>
              {renderBossSprite(bossData.bossType, false)}
            </div>
            <div className="er-pedestal" />
          </div>

          {/* Boss Name */}
          <h1 className="er-title" style={{ fontSize: "38px", margin: "0 0 4px 0", color: "#fff" }}>
            {bossData.bossType}
          </h1>
          <div style={{ fontSize: "14px", color: "#ffffff", fontWeight: "600", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "20px" }}>
            Guardian of "{milestone.title}"
          </div>

          <div className="er-divider" />

          {/* Boss speech subtitles with typing effect */}
          <div style={{ minHeight: "70px", marginBottom: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p className="er-subtitle-dialogue">
              "{displayedBossText}"
            </p>
          </div>

          {/* Interactive Player Choices */}
          {!isTyping && (
            <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
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
                <div style={{ display: "flex", gap: "20px", justifyContent: "center", width: "100%", marginTop: "8px" }}>
                  <button className="er-action-btn" style={{ borderColor: "#ef4444", color: "#ef4444" }} onClick={onClose}>
                    RETREAT
                  </button>
                  <button className="er-action-btn" style={{ borderColor: "#ffffff", color: "#ffffff", textShadow: "0 0 10px rgba(255,255,255,0.5)" }} onClick={handleStartBattle}>
                    ⚔ BEGIN BATTLE ⚔
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- STAGE: BATTLE (GAME PLAYING SCREEN) --- */}
      {!loading && stage === "battle" && (
        <div style={{
          width: "100%", maxWidth: "800px",
          display: "flex", flexDirection: "column", zIndex: 10,
          position: "relative", width: "100%"
        }}>
          {/* Top HUD Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            {/* Player HP */}
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
                Integrity
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                {renderHearts()}
              </div>
            </div>

            {/* Countdown timer */}
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: "38px",
              color: timer <= 4 ? "#ef4444" : "#d4af37", fontWeight: "bold",
              textShadow: timer <= 4 ? "0 0 10px rgba(239,68,68,0.5)" : "0 0 10px rgba(255,255,255,0.3)",
              animation: timer <= 4 ? "bossFloat 0.5s infinite" : "none"
            }}>
              {timer}
            </div>

            {/* Battle details */}
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>
                Quest Milestone
              </div>
              <div style={{ fontSize: "14px", color: "#fff", fontFamily: "'Cinzel', serif" }}>
                Level {milestone.level || 1}
              </div>
            </div>
          </div>

          {/* Combat arena (Middle) */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", position: "relative",
            margin: "5px 0"
          }}>
            {/* Visual slash overlay */}
            {bossHurt && <div className="slash-beam" />}
            
            {/* Floating damage numbers */}
            {floatingDamage && (
              <div className="float-dmg" style={{ top: "35%", left: "50%", transform: "translateX(-50%)" }}>
                {floatingDamage}
              </div>
            )}

            {/* Boss Sprite */}
            <div className={bossHurt ? "boss-hurt" : ""}>
              {renderBossSprite(bossData.bossType, bossHurt)}
            </div>
            <div className="er-pedestal" />
          </div>

          {/* Boss combat dialogues / Subtitle block - rendered inline, not absolute, to prevent text overlay */}
          <div style={{ minHeight: "54px", margin: "10px 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {displayedBossText && (
              <p className="er-subtitle-dialogue" style={{ fontSize: "17px", color: "#fcebd2", margin: 0 }}>
                "{displayedBossText}"
              </p>
            )}
          </div>

          {/* Boss HP Bar & Questions HUD (Bottom) */}
          <div style={{ marginTop: "10px" }}>
            {/* Boss Health Bar */}
            <div className="er-boss-hp-wrapper">
              <div className="er-boss-hp-label">{bossData.bossType.toUpperCase()}</div>
              <div className="er-boss-hp-track">
                <div className="er-boss-hp-fill" style={{ width: `${bossHP}%` }} />
              </div>
            </div>

            {/* Active Question Display */}
            {!isTyping && (
              <div style={{ marginTop: "8px" }}>
                <div style={{ fontSize: "11px", color: "#ffffff", fontWeight: "700", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px", textAlign: "center" }}>
                  CONFRONTATION {currentIdx + 1} OF {bossData.questions.length}
                </div>
                
                <h3 style={{ fontSize: "19px", fontWeight: "600", color: "#fff", lineHeight: "1.4", textAlign: "center", margin: "0 auto 20px", maxWidth: "680px" }}>
                  {bossData.questions[currentIdx].question}
                </h3>

                {/* Answers */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", maxWidth: "700px", margin: "0 auto 15px", width: "100%" }}>
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
                        className={`er-option-btn-premium ${btnClass}`}
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
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- STAGE: VICTORY (BOSS DEFEATED) --- */}
      {stage === "victory" && (
        <div style={{
          width: "100%", maxWidth: "700px", padding: "40px 20px",
          textAlign: "center", zIndex: 10, position: "relative", margin: "auto 0"
        }}>
          <h2 style={{ fontSize: "12px", letterSpacing: "5px", color: "#ffffff", fontWeight: "bold", textTransform: "uppercase", marginBottom: "20px" }}>
            ✦ Milestone Mastered ✦
          </h2>
          
          <div className="victory-text-glow" style={{ marginBottom: "12px" }}>
            FOE VANQUISHED
          </div>

          <div className="er-divider" />

          <p style={{ fontSize: "19px", color: "#dfd7c0", marginBottom: "40px", lineHeight: "1.6", maxWidth: "550px", margin: "0 auto 40px" }}>
            The guardian <strong>{bossData.bossType}</strong> has fallen. Your mastery over the milestone of <strong>"{milestone.title}"</strong> has been sealed in the Erdtree of knowledge.
          </p>

          {/* Reward HUD */}
          <div style={{
            width: "100%", maxWidth: "360px", background: "rgba(212, 175, 55, 0.05)",
            borderTop: "1px solid rgba(212, 175, 55, 0.2)",
            borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
            padding: "10px", display: "flex", justifyContent: "space-around",
            alignItems: "center", margin: "0 auto 40px"
          }}>
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Double XP Gained</div>
              <div style={{ fontSize: "32px", fontWeight: "bold", color: "#ffffff", textShadow: "0 0 10px rgba(255,255,255,0.3)" }}>
                +{milestone.xpReward * 2}
              </div>
            </div>
            <div style={{ width: "1px", height: "35px", background: "rgba(255,255,255,0.2)" }} />
            <div>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Trophy Claimed</div>
              <div style={{ fontSize: "28px" }}>🏆</div>
            </div>
          </div>

          <button className="er-action-btn" style={{ borderColor: "#ffffff", color: "#ffffff" }} onClick={onClose}>
            RETURN TO ROADMAP
          </button>
        </div>
      )}

      {/* --- STAGE: DEFEAT (PLAYER HP = 0) --- */}
      {stage === "defeat" && (
        <div className="defeat-screen" style={{
          position: "absolute", inset: 0, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", zIndex: 10, textAlign: "center", padding: "24px 16px"
        }}>
          <div className="defeat-text-glow" style={{ marginBottom: "10px" }}>
            YOU DIED
          </div>

          <div style={{ width: "200px", height: "1px", background: "rgba(200, 0, 0, 0.3)", marginBottom: "35px" }} />

          <p style={{ fontSize: "18px", color: "#a59b84", marginBottom: "40px", fontStyle: "italic", maxWidth: "450px" }}>
            Your compilation broke, traveler. Return to your study notes or reference the video libraries of this milestone before challenging the construct again.
          </p>

          <div style={{ display: "flex", gap: "20px" }}>
            <button className="er-action-btn" style={{ borderColor: "rgba(255,255,255,0.15)", color: "#a59b84" }} onClick={onClose}>
              ABANDON
            </button>
            <button className="er-action-btn" style={{ borderColor: "#c80000", color: "#c80000" }} onClick={handleRetry}>
              RETRY CONFRONTATION
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
}
