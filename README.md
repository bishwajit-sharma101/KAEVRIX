<div align="center">

<img width="100%" src="https://github.com/user-attachments/assets/49fbb51a-d29e-4dd9-b575-30ce64309475" alt="Kaevrix Banner"/>

<br/>

# ⚔️ Kaevrix
### Educational Esports: Real-Time Competitive Learning

<p align="center">
  <strong>What if mastering a new skill felt like climbing the ranks in your favorite competitive game?</strong><br/>
  Kaevrix transforms passive video tutorials into high-stakes, synchronized multiplayer battles powered by real-time WebSockets and generative AI.
</p>

<p align="center">
  <a href="#-the-vision">Vision</a> •
  <a href="#-the-core-loop-duel-arena">Gameplay Loop</a> •
  <a href="#-pathfinder-ai-neural-roadmaps">PathFinder</a> •
  <a href="#-rpg-progression--meta-game">Progression</a> •
  <a href="#-engineering-architecture">Under the Hood</a>
</p>

<img src="https://img.shields.io/badge/STATUS-IN%20DEVELOPMENT-FF5722?style=for-the-badge&logo=github" alt="Status">
<img src="https://img.shields.io/badge/ARCHITECTURE-Socket.io%20%7C%20Real--Time-000000?style=for-the-badge&logo=socket.io" alt="Architecture">
<img src="https://img.shields.io/badge/AI_INTEGRATION-Google%20Gemini-4285F4?style=for-the-badge&logo=google" alt="AI">

</div>

---

## 🌍 The Vision

Online learning suffers from low engagement and high distraction. **Kaevrix** solves this by injecting esports-inspired psychological pressure, RPG mechanics, and cognitive gameplay into standard educational content. 

**Learn. Compete. Ascend.** Knowledge becomes power, learning becomes combat, and skill becomes social status.

<div align="center">
  <img width="100%" src="https://github.com/user-attachments/assets/0d9a6674-354e-4b81-91d7-8852ccff391a" alt="Platform Vision" />
</div>

---

## ⚔️ The Core Loop: Duel Arena

The Duel Arena is the heart of Kaevrix. This is where players queue up, sync up, and face off in real-time learning battles.

<div align="center">
  <img width="100%" src="https://github.com/user-attachments/assets/ba1cc3b2-52b9-4021-8b5d-eb6dc585a2fd" alt="Gameplay Loop Overview"/>
</div>

### 1. Target Acquisition & Matchmaking
> Search for any educational topic directly within the platform. Once a target video is selected, the engine matchmakes you with an opponent entering the same knowledge domain.

<div align="center">
  <img width="70%" src="https://github.com/user-attachments/assets/2c6c7b72-6c8b-4b86-a1eb-76853d1658bc" alt="Video Search" />
</div>
<br/>
<img width="100%" src="https://github.com/user-attachments/assets/eab456f7-b736-4aa3-8336-28fd5fe8b21b" alt="Matchmaking" />

### 2. Synchronized Watch Battles
> Both players are locked into a synchronized playback session. During the watch phase, players must maintain focus to earn tactical energy, deploy power-ups, and manage high-stakes risk/reward multipliers.

<img width="100%" src="https://github.com/user-attachments/assets/d1258fdc-4d89-4c05-9d18-1d566a9d2b74" alt="Watch Battle" />

### 3. AI-Forged Quiz Phase
> Powered by the Google Gemini API, the platform dynamically generates context-aware, multiple-choice quizzes on the fly. Compete for accuracy, speed, and combo multipliers.

<img width="100%" src="https://github.com/user-attachments/assets/73ca3aac-0a8d-4b9e-a896-d7072cc4475b" alt="Quiz Phase" />

### 4. Aftermath & Global Rankings
> Review detailed post-match analytics. Compare your solving speed, accuracy, and risk multipliers against your opponent while earning XP to climb the global leaderboards.

<img width="100%" src="https://github.com/user-attachments/assets/20c4a08c-8f68-400d-8c84-97f4f486e241" alt="Match Results" />
<img width="100%" src="https://github.com/user-attachments/assets/d136b6d6-3cc2-4a54-9f66-288778b55dd0" alt="Global Rankings" />

---

## 🎮 The Arena Dashboard & Profiles

The central hub provides players with quick access to active matchmaking queues, featured training videos, and their personal performance metrics.

### Main Arena Interface
<img width="100%" src="https://github.com/user-attachments/assets/295efa3a-85a6-4788-ba77-c4bd5c30a148" alt="Arena Dashboard" />

### Player Combat Profiles
> Track your battle history, win rates, total watch time, and current rank progression directly from your profile.
<img width="100%" src="https://github.com/user-attachments/assets/99ceadf3-5087-4204-a915-da1e86d2de82" alt="Player Profiles" />
[![Kaevrix Cosmetics System](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=https://youtu.be/sgzADaLMgT4?si=yJnInPpEUG6wlWGO )

---

## 🧭 PathFinder: AI Neural Roadmaps

Don't know where to start? The **PathFinder System** generates personalized, node-based learning roadmaps. Tell the AI your end goal and available time, and it will construct a progressively challenging path of curated content and generated notes.

<div align="center">
  <video src="https://github.com/user-attachments/assets/813f7226-f49b-482e-844a-7063a80d59a2" controls="controls" muted="muted" style="max-width:100%;"></video>
</div>

---

## 🛡️ RPG Progression & Meta-Game

Kaevrix isn't just match-by-match; it's a long-term progression ecosystem designed to build tactical identity and expertise.

### Classes & Skill Trees
Players define their legacy by choosing distinct combat subclasses (e.g., *The Speedrunner*, *The Edgelord*). Winning duels grants XP to unlock devastating abilities, passive combo enhancements, and rule-bending ultimate perks.

<img width="100%" src="https://github.com/user-attachments/assets/63897647-b125-422a-beb1-351d6700c683" alt="Character Classes" />

### 👑 Domain Bosses & Ascension
Elite players can conquer specific knowledge territories (e.g., the "JavaScript Arena"). Challengers must risk all their accumulated XP in cinematic Ascension Battles to dethrone the reigning Domain Boss and claim the territory.

<img width="100%" src="https://github.com/user-attachments/assets/afc16039-fc2a-4323-8db6-cf322667d8eb" alt="Domain Bosses" />

---

## ⚡ Engineering Architecture

Kaevrix is built on a highly optimized, low-latency infrastructure to ensure competitive integrity.

* **Socket.IO State Machine:** Manages concurrent matchmaking, complex phase transitions (Lobby $\rightarrow$ Watch $\rightarrow$ Quiz $\rightarrow$ Results), and zero-latency chat.
* **Sync Drift Tolerance:** Custom logic to handle YouTube IFrame buffering, ensuring players remain perfectly synchronized regardless of network disparities.
* **Dynamic AI Prompts:** Seamless integration with Gemini API to fetch, parse, and deploy structured JSON quiz data within a strict 5-second pre-match countdown buffer.
* **Zero-Asset Audio Engine:** Real-time synthesis of sound effects via the browser's native Web Audio API, entirely eliminating massive `.wav`/`.mp3` bundle bloat.

---

## 🛠 Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js |
| **Real-Time Systems** | Socket.IO, WebSockets, Web Audio API |
| **Database** | MongoDB, Mongoose |
| **Integrations** | Google Gemini API, YouTube IFrame API, yt-search |

---

## 📂 Project Structure

```bash
kaevrix/
├── client/        # React frontend, UI components, state management
├── server/        # Express server, Socket.IO logic, matchmaking systems
└── README.md
```

---

<div align="center">

### 👤 Author

**Bishwajit Sharma**  
*Full-Stack Developer focused on real-time systems, performance, and scalable web architecture.*

<p align="center">
  <a href="https://www.linkedin.com/in/bishwajitsharma-in/">
    <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>

  <a href="https://github.com/bishwajit-sharma101">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" />
  </a>
</p>

</div>
