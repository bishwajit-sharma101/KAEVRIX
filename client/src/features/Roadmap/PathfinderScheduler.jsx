import { useState, useEffect } from "react";
import * as sound from "../../utils/audio";

export default function PathfinderScheduler({ 
  roadmap, 
  username, 
  isDarkMode, 
  onSelectMilestone,
  onTriggerSearch,
  onStartSoloStudy
}) {
  const scheduleKey = `kaevrix_roadmap_schedule_${username}`;
  const todayProgressKey = `kaevrix_today_progress_${username}`;

  // 1. Core States
  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem(scheduleKey);
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });

  const [completedToday, setCompletedToday] = useState(0);
  const [completedThisWeek, setCompletedThisWeek] = useState(0);
  const [completedThisMonth, setCompletedThisMonth] = useState(0);
  
  const [chartView, setChartView] = useState("daily"); // "daily" | "weekly" | "monthly"
  const [showSettings, setShowSettings] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);

  // YYYY-MM-DD helper
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const todayDateStr = getTodayDateString();

  // 2. Subtopic stats computation helper
  const getSubtopicStats = () => {
    let total = 0;
    let completed = 0;
    const allLevels = ["level1", "level2", "level3"];
    
    for (const lk of allLevels) {
      const milestones = roadmap?.[lk]?.milestones || [];
      for (const m of milestones) {
        if (m.isEncrypted || !m.keyPoints || m.keyPoints.length === 0) {
          total += 4;
          if (m.status === "completed") completed += 4;
        } else {
          total += m.keyPoints.length;
          if (m.status === "completed") {
            completed += m.keyPoints.length;
          } else if (m.status === "locked") {
            completed += 0;
          } else {
            completed += (m.subtopicIndex || 0);
          }
        }
      }
    }
    return { total, completed };
  };

  const getCompletedSubtopicsList = () => {
    const list = [];
    const allLevels = ["level1", "level2", "level3"];
    if (!roadmap) return list;
    for (const lk of allLevels) {
      const milestones = roadmap[lk]?.milestones || [];
      for (const m of milestones) {
        if (m.isEncrypted) continue;
        const keyPoints = m.keyPoints || [];
        const completedCount = m.status === "completed" 
          ? keyPoints.length 
          : (m.status === "unlocked" || m.status === "revision" ? (m.subtopicIndex || 0) : 0);
        
        for (let i = 0; i < completedCount; i++) {
          list.push({
            milestone: m,
            text: keyPoints[i]
          });
        }
      }
    }
    return list;
  };

  const { total: totalSubtopics, completed: completedSubtopics } = getSubtopicStats();

  // Helper: compute elapsed days since start of plan for a specific date string
  const getElapsedDaysForDate = (dateStr) => {
    if (!schedule) return 0;
    return Math.max(0, Math.floor((new Date(dateStr) - new Date(schedule.startDate)) / (1000 * 60 * 60 * 24)) + schedule.missedDaysOffset);
  };

  // Helper: list all dates after startDateStr up to endDateStr
  const getDatesAfter = (startDateStr, endDateStr) => {
    const dates = [];
    let current = new Date(startDateStr);
    current.setDate(current.getDate() + 1); // start from day after
    const end = new Date(endDateStr);
    
    let count = 0;
    while (current < end && count < 100) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const dd = String(current.getDate()).padStart(2, "0");
      dates.push(`${yyyy}-${mm}-${dd}`);
      current.setDate(current.getDate() + 1);
      count++;
    }
    return dates;
  };

  // Adaptive Quota Projections (Stable start-of-period math) - Declared above useEffect so it can be referenced
  const elapsedDays = schedule
    ? Math.max(0, Math.floor((new Date(todayDateStr) - new Date(schedule.startDate)) / (1000 * 60 * 60 * 24)) + schedule.missedDaysOffset)
    : 0;
  const remainingDays = schedule
    ? Math.max(1, schedule.durationDays - elapsedDays)
    : 1;

  const completedBeforeToday = Math.max(0, completedSubtopics - completedToday);
  const remainingSubtopicsStartOfToday = Math.max(0, totalSubtopics - completedBeforeToday);
  const dailyTarget = remainingSubtopicsStartOfToday > 0 ? Math.ceil(remainingSubtopicsStartOfToday / remainingDays) : 0;

  const completedBeforeThisWeek = Math.max(0, completedSubtopics - completedThisWeek);
  const remainingSubtopicsStartOfThisWeek = Math.max(0, totalSubtopics - completedBeforeThisWeek);
  const remainingWeeks = Math.max(1, remainingDays / 7);
  const weeklyTarget = remainingSubtopicsStartOfThisWeek > 0 ? Math.ceil(remainingSubtopicsStartOfThisWeek / remainingWeeks) : 0;

  const completedBeforeThisMonth = Math.max(0, completedSubtopics - completedThisMonth);
  const remainingSubtopicsStartOfThisMonth = Math.max(0, totalSubtopics - completedBeforeThisMonth);
  const remainingMonths = Math.max(1, remainingDays / 30);
  const monthlyTarget = remainingSubtopicsStartOfThisMonth > 0 ? Math.ceil(remainingSubtopicsStartOfThisMonth / remainingMonths) : 0;

  // 3. Initialize schedule
  useEffect(() => {
    if (!schedule && roadmap) {
      const newSchedule = {
        startDate: todayDateStr,
        durationDays: 30,
        missedDaysOffset: 0,
        lastUpdatedDate: todayDateStr,
        streak: 0,
        completedYesterday: false
      };
      localStorage.setItem(scheduleKey, JSON.stringify(newSchedule));
      setSchedule(newSchedule);
    }
  }, [schedule, roadmap, todayDateStr, scheduleKey]);

  // 4. Sync engine for all trackers (Daily, Weekly, Monthly)
  useEffect(() => {
    if (!schedule) return;

    // Daily progress sync
    let todayProg = localStorage.getItem(todayProgressKey);
    let todayObj = todayProg ? JSON.parse(todayProg) : null;

    if (!todayObj || todayObj.date !== todayDateStr) {
      // Check rollover streak
      let newStreak = schedule.streak;
      const historyKey = `kaevrix_daily_progress_history_${username}`;
      let dailyHistory = {};
      try {
        dailyHistory = JSON.parse(localStorage.getItem(historyKey) || "{}");
      } catch (e) {}

      if (todayObj) {
        const prevRemainingDays = Math.max(1, schedule.durationDays - getElapsedDaysForDate(todayObj.date));
        const prevRemainingSubtopics = totalSubtopics - (completedSubtopics - todayObj.completedToday);
        const prevDailyTarget = todayObj.target || Math.ceil(prevRemainingSubtopics / prevRemainingDays) || 1;
        
        if (todayObj.completedToday >= prevDailyTarget) {
          newStreak += 1;
        } else {
          newStreak = 0;
        }

        // Save todayObj to history
        dailyHistory[todayObj.date] = {
          completed: todayObj.completedToday,
          target: prevDailyTarget
        };

        // Backfill missed days
        const gapDates = getDatesAfter(todayObj.date, todayDateStr);
        let tempRemainingDays = prevRemainingDays - 1;
        const remainingSubtopicsAtRollover = Math.max(0, totalSubtopics - completedSubtopics);

        for (const gd of gapDates) {
          tempRemainingDays = Math.max(1, tempRemainingDays);
          const gdTarget = Math.ceil(remainingSubtopicsAtRollover / tempRemainingDays) || 1;
          dailyHistory[gd] = {
            completed: 0,
            target: gdTarget
          };
          tempRemainingDays--;
          newStreak = 0; // reset streak if gap days exist
        }

        localStorage.setItem(historyKey, JSON.stringify(dailyHistory));
      }

      todayObj = {
        date: todayDateStr,
        completedToday: 0,
        lastTotal: completedSubtopics,
        target: dailyTarget
      };

      setSchedule(prev => {
        const next = { ...prev, lastUpdatedDate: todayDateStr, streak: newStreak };
        localStorage.setItem(scheduleKey, JSON.stringify(next));
        return next;
      });
    } else {
      if (completedSubtopics > todayObj.lastTotal) {
        todayObj.completedToday += (completedSubtopics - todayObj.lastTotal);
        todayObj.lastTotal = completedSubtopics;
      } else {
        todayObj.lastTotal = completedSubtopics;
      }
      todayObj.target = dailyTarget; // keep target updated
    }
    localStorage.setItem(todayProgressKey, JSON.stringify(todayObj));
    setCompletedToday(todayObj.completedToday);

    // Weekly progress sync
    const weekStartDateKey = `kaevrix_week_start_${username}`;
    let weekStart = localStorage.getItem(weekStartDateKey) || todayDateStr;
    const daysSinceWeekStart = Math.floor((new Date(todayDateStr) - new Date(weekStart)) / (1000 * 60 * 60 * 24));
    
    let weeklyProg = localStorage.getItem(`kaevrix_weekly_progress_${username}`);
    let weeklyObj = weeklyProg ? JSON.parse(weeklyProg) : null;

    if (!weeklyObj || daysSinceWeekStart >= 7 || weeklyObj.weekStartDate !== weekStart) {
      weekStart = todayDateStr;
      localStorage.setItem(weekStartDateKey, weekStart);
      weeklyObj = {
        weekStartDate: weekStart,
        completedThisWeek: 0,
        lastTotal: completedSubtopics
      };
    } else {
      if (completedSubtopics > weeklyObj.lastTotal) {
        weeklyObj.completedThisWeek += (completedSubtopics - weeklyObj.lastTotal);
        weeklyObj.lastTotal = completedSubtopics;
      } else {
        weeklyObj.lastTotal = completedSubtopics;
      }
    }
    localStorage.setItem(`kaevrix_weekly_progress_${username}`, JSON.stringify(weeklyObj));
    setCompletedThisWeek(weeklyObj.completedThisWeek);

    // Monthly progress sync
    const monthStartDateKey = `kaevrix_month_start_${username}`;
    let monthStart = localStorage.getItem(monthStartDateKey) || todayDateStr;
    const daysSinceMonthStart = Math.floor((new Date(todayDateStr) - new Date(monthStart)) / (1000 * 60 * 60 * 24));
    
    let monthlyProg = localStorage.getItem(`kaevrix_monthly_progress_${username}`);
    let monthlyObj = monthlyProg ? JSON.parse(monthlyProg) : null;

    if (!monthlyObj || daysSinceMonthStart >= 30 || monthlyObj.monthStartDate !== monthStart) {
      monthStart = todayDateStr;
      localStorage.setItem(monthStartDateKey, monthStart);
      monthlyObj = {
        monthStartDate: monthStart,
        completedThisMonth: 0,
        lastTotal: completedSubtopics
      };
    } else {
      if (completedSubtopics > monthlyObj.lastTotal) {
        monthlyObj.completedThisMonth += (completedSubtopics - monthlyObj.lastTotal);
        monthlyObj.lastTotal = completedSubtopics;
      } else {
        monthlyObj.lastTotal = completedSubtopics;
      }
    }
    localStorage.setItem(`kaevrix_monthly_progress_${username}`, JSON.stringify(monthlyObj));
    setCompletedThisMonth(monthlyObj.completedThisMonth);

  }, [completedSubtopics, todayDateStr, schedule, totalSubtopics, scheduleKey, todayProgressKey, username, dailyTarget]);


  // Sync daily target completions to history
  useEffect(() => {
    if (!schedule) return;
    if (completedToday >= dailyTarget && dailyTarget > 0) {
      const completedDatesKey = `kaevrix_completed_dates_${username}`;
      const saved = localStorage.getItem(completedDatesKey);
      let dates = [];
      if (saved) {
        try { dates = JSON.parse(saved); } catch { dates = []; }
      }
      if (!dates.includes(todayDateStr)) {
        dates.push(todayDateStr);
        localStorage.setItem(completedDatesKey, JSON.stringify(dates));
      }
    }
  }, [completedToday, dailyTarget, todayDateStr, username, schedule]);

  if (!roadmap) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        textAlign: "center",
        width: "100%",
        maxWidth: "700px",
        margin: "0 auto"
      }}>
        {/* Top Pill Tag */}
        <div style={{
          background: "rgba(255, 106, 0, 0.07)",
          border: "1px solid rgba(255, 106, 0, 0.35)",
          padding: "6px 16px",
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "24px"
        }}>
          <span style={{ fontSize: "12px" }}>⏱️</span>
          <span style={{
            fontFamily: "var(--font-gamer), 'Orbitron', monospace",
            fontSize: "11px",
            fontWeight: "900",
            letterSpacing: "1.5px",
            color: "#ff6a00",
            textTransform: "uppercase"
          }}>CHRONOS REACTOR</span>
        </div>

        {/* Big Premium Gaming Text Title */}
        <h2 style={{
          fontFamily: "var(--font-gamer), 'Orbitron', monospace",
          fontSize: "56px",
          fontWeight: "900",
          lineHeight: "1.05",
          letterSpacing: "3px",
          margin: "0 0 24px 0",
          textTransform: "uppercase",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <span style={{ color: isDarkMode ? "#ffffff" : "#0f172a", marginBottom: "4px" }}>CHRONOS</span>
          <span style={{
            background: "linear-gradient(to right, #ff6a00, #ffb300)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>TIMELINE</span>
        </h2>

        {/* Description Subtext */}
        <p style={{
          fontFamily: "var(--font-sans), system-ui, sans-serif",
          fontSize: "14.5px",
          color: isDarkMode ? "rgba(255, 255, 255, 0.55)" : "var(--text-muted)",
          lineHeight: "1.65",
          maxWidth: "520px",
          margin: "0 0 24px 0",
          fontWeight: "400"
        }}>
          Sync your study schedule and calibrate tracking directives. Set daily target metrics, monitor your progress velocity, and unlock chronological XP streaks.
        </p>

        {/* Small Specs Row */}
        <div style={{
          fontFamily: "var(--font-gamer), 'Orbitron', monospace",
          fontSize: "10.5px",
          fontWeight: "900",
          color: isDarkMode ? "rgba(255, 255, 255, 0.35)" : "var(--text-muted)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "40px"
        }}>
          <span>DAILY TARGETS</span>
          <span>•</span>
          <span>VELOCITY MATRIX</span>
          <span>•</span>
          <span>XP BOOSTERS</span>
        </div>

        {/* Outline Glow Button */}
        <button
          onClick={() => {
            sound.playClockTick();
            if (onSelectMilestone) onSelectMilestone(null);
          }}
          style={{
            position: "relative",
            padding: "16px 44px",
            fontSize: "14px",
            fontWeight: "900",
            fontFamily: "var(--font-gamer), 'Orbitron', monospace",
            color: "#ff6a00",
            background: isDarkMode ? "rgba(255, 106, 0, 0.02)" : "rgba(255, 106, 0, 0.05)",
            border: "2px solid #ff6a00",
            borderRadius: "15px",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(255, 106, 0, 0.25), inset 0 0 10px rgba(255, 106, 0, 0.1)",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 0 35px rgba(255, 106, 0, 0.65), inset 0 0 15px rgba(255, 106, 0, 0.25)";
            e.currentTarget.style.background = "rgba(255, 106, 0, 0.08)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 106, 0, 0.25), inset 0 0 10px rgba(255, 106, 0, 0.1)";
            e.currentTarget.style.background = isDarkMode ? "rgba(255, 106, 0, 0.02)" : "rgba(255, 106, 0, 0.05)";
          }}
        >
          Initialize Chronos &nbsp;→
        </button>
      </div>
    );
  }

  if (!schedule) return null;

  const getCompletedDates = () => {
    const completedDatesKey = `kaevrix_completed_dates_${username}`;
    const saved = localStorage.getItem(completedDatesKey);
    let dates = [];
    if (saved) {
      try { dates = JSON.parse(saved); } catch { dates = []; }
    }
    // If empty but streak > 0, backfill dates to match streak
    if (dates.length === 0 && schedule && schedule.streak > 0) {
      const d = new Date();
      for (let i = 0; i < schedule.streak; i++) {
        const pastDate = new Date(d);
        pastDate.setDate(d.getDate() - i);
        const yyyy = pastDate.getFullYear();
        const mm = String(pastDate.getMonth() + 1).padStart(2, "0");
        const dd = String(pastDate.getDate()).padStart(2, "0");
        dates.push(`${yyyy}-${mm}-${dd}`);
      }
      localStorage.setItem(completedDatesKey, JSON.stringify(dates));
    }
    return dates;
  };

  // Generate projections for chart outlines (stable math projections)
  const getChartData = () => {
    if (chartView === "daily") {
      const data = [];
      const start = new Date(schedule.startDate);
      const maxWeeks = Math.max(1, Math.ceil(schedule.durationDays / 7));
      const currentWeekIdx = Math.floor(elapsedDays / 7);
      const w = Math.min(Math.max(0, selectedWeek !== null ? selectedWeek : currentWeekIdx), maxWeeks - 1);

      const remainingDaysFromTomorrow = Math.max(1, schedule.durationDays - (elapsedDays + 1));
      
      const histKey = `kaevrix_daily_progress_history_${username}`;
      let dailyHistory = {};
      try { dailyHistory = JSON.parse(localStorage.getItem(histKey) || "{}"); } catch (e) {}
      
      const studyHistKey = `kaevrix_study_history_${username}`;
      let studyHistoryList = [];
      try { studyHistoryList = JSON.parse(localStorage.getItem(studyHistKey) || "[]"); } catch (e) {}

      const remainingSubtopicsAfterToday = Math.max(0, totalSubtopics - completedBeforeToday - Math.max(completedToday, dailyTarget));
      
      let tempRemaining = remainingSubtopicsAfterToday;
      let tempDays = remainingDaysFromTomorrow;

      for (let d = 0; d < 7; d++) {
        const dayNum = w * 7 + d + 1;
        const checkDate = new Date(start);
        checkDate.setDate(start.getDate() + (w * 7) + d);
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;

        if (dateStr === todayDateStr) {
          data.push({
            label: "Today",
            target: dailyTarget,
            completed: completedToday,
            isCurrent: true,
            dayNum
          });
        } else if (checkDate < new Date(todayDateStr)) {
          const record = dailyHistory[dateStr];
          let completedVal = 0;
          if (record) {
            completedVal = record.completed;
          } else {
            completedVal = studyHistoryList.filter(h => {
              const hDate = new Date(h.timestamp);
              const hDateStr = `${hDate.getFullYear()}-${String(hDate.getMonth() + 1).padStart(2, "0")}-${String(hDate.getDate()).padStart(2, "0")}`;
              return hDateStr === dateStr;
            }).length;
          }
          const targetVal = record ? record.target : (Math.ceil(totalSubtopics / schedule.durationDays) || 1);
          data.push({
            label: `Day ${dayNum}`,
            target: targetVal,
            completed: completedVal,
            isCurrent: false,
            dayNum
          });
        } else {
          const targetVal = tempDays > 0 ? Math.ceil(tempRemaining / tempDays) : 0;
          data.push({
            label: `Day ${dayNum}`,
            target: targetVal,
            completed: 0,
            isCurrent: false,
            dayNum
          });
          tempRemaining = Math.max(0, tempRemaining - targetVal);
          tempDays = Math.max(0, tempDays - 1);
        }
      }
      return data;
    } else if (chartView === "weekly") {
      const datesList = getCompletedDates();
      const data = [];
      const start = new Date(schedule.startDate);
      const maxWeeks = Math.max(1, Math.ceil(schedule.durationDays / 7));
      
      for (let w = 0; w < maxWeeks; w++) {
        let completedDaysInWeek = 0;
        for (let d = 0; d < 7; d++) {
          const checkDate = new Date(start);
          checkDate.setDate(start.getDate() + (w * 7) + d);
          const yyyy = checkDate.getFullYear();
          const mm = String(checkDate.getMonth() + 1).padStart(2, "0");
          const dd = String(checkDate.getDate()).padStart(2, "0");
          const dateStr = `${yyyy}-${mm}-${dd}`;
          
          if (dateStr === todayDateStr) {
            if (completedToday >= dailyTarget && dailyTarget > 0) {
              completedDaysInWeek++;
            }
          } else if (datesList.includes(dateStr)) {
            completedDaysInWeek++;
          }
        }
        
        const isCurrentWeek = Math.floor(elapsedDays / 7) === w;
        data.push({
          label: isCurrentWeek ? "This Week" : `Week ${w + 1}`,
          target: 7,
          completed: completedDaysInWeek,
          isCurrent: isCurrentWeek
        });
      }
      return data;
    } else {
      const datesList = getCompletedDates();
      const data = [];
      const start = new Date(schedule.startDate);
      const maxMonths = Math.max(1, Math.ceil(schedule.durationDays / 30));
      
      for (let m = 0; m < maxMonths; m++) {
        let completedWeeksInMonth = 0;
        for (let w = 0; w < 4; w++) {
          let completedDaysInWeek = 0;
          const weekOffset = m * 28 + w * 7;
          
          for (let d = 0; d < 7; d++) {
            const checkDate = new Date(start);
            checkDate.setDate(start.getDate() + weekOffset + d);
            const yyyy = checkDate.getFullYear();
            const mm = String(checkDate.getMonth() + 1).padStart(2, "0");
            const dd = String(checkDate.getDate()).padStart(2, "0");
            const dateStr = `${yyyy}-${mm}-${dd}`;
            
            if (dateStr === todayDateStr) {
              if (completedToday >= dailyTarget && dailyTarget > 0) {
                completedDaysInWeek++;
              }
            } else if (datesList.includes(dateStr)) {
              completedDaysInWeek++;
            }
          }
          
          if (completedDaysInWeek >= 4) {
            completedWeeksInMonth++;
          }
        }
        
        const isCurrentMonth = Math.floor(elapsedDays / 28) === m;
        data.push({
          label: m === 0 ? "This Month" : `Month ${m + 1}`,
          target: 4,
          completed: completedWeeksInMonth,
          isCurrent: isCurrentMonth
        });
      }
      return data;
    }
  };

  const chartData = getChartData();
  const maxVal = Math.max(1, ...chartData.map(d => Math.max(d.target, d.completed)));

  // Pace health checks
  const elapsedPercentage = Math.min(1, elapsedDays / schedule.durationDays);
  const completedPercentage = Math.min(1, completedSubtopics / totalSubtopics);
  const targetSubtopicsSoFar = Math.round(totalSubtopics * (elapsedDays / schedule.durationDays));

  let velocityStatus = "TRACK";
  if (completedSubtopics > targetSubtopicsSoFar) {
    velocityStatus = "AHEAD";
  } else if (completedSubtopics < targetSubtopicsSoFar) {
    velocityStatus = "BEHIND";
  }

  // Configurations
  const handleDurationChange = (days) => {
    sound.playClockTick();
    setSelectedWeek(null);
    setSchedule(prev => {
      const next = { ...prev, durationDays: days };
      localStorage.setItem(scheduleKey, JSON.stringify(next));
      return next;
    });
  };

  const handleSimulateMissedDay = () => {
    sound.playClockTick();
    setSchedule(prev => {
      const next = { ...prev, missedDaysOffset: prev.missedDaysOffset + 1 };
      localStorage.setItem(scheduleKey, JSON.stringify(next));
      return next;
    });
  };

  const handleResetTimeline = () => {
    sound.playClockTick();
    setSelectedWeek(null);
    setSchedule(prev => {
      const next = {
        ...prev,
        startDate: todayDateStr,
        missedDaysOffset: 0,
        streak: 0
      };
      localStorage.setItem(scheduleKey, JSON.stringify(next));
      return next;
    });

    const progress = {
      date: todayDateStr,
      completedToday: 0,
      lastTotal: completedSubtopics
    };
    localStorage.setItem(todayProgressKey, JSON.stringify(progress));
    setCompletedToday(0);

    // Clear progress and completed dates history
    localStorage.removeItem(`kaevrix_daily_progress_history_${username}`);
    localStorage.removeItem(`kaevrix_completed_dates_${username}`);
  };

  // Subtopic Tasks Checklist (Bounties)
  const getIncompleteSubtopicsList = () => {
    const list = [];
    const allLevels = ["level1", "level2", "level3"];
    for (const lk of allLevels) {
      const milestones = roadmap?.[lk]?.milestones || [];
      for (const m of milestones) {
        if (m.status === "completed") continue;
        if (m.isEncrypted) {
          list.push({
            milestone: m,
            subtopicIndex: 0,
            text: "Unlock prior levels in Pathfinder to decrypt next nodes",
            isEncrypted: true
          });
          continue;
        }
        const startIdx = m.status === "locked" ? 0 : (m.subtopicIndex || 0);
        const keyPoints = m.keyPoints || [];
        for (let i = startIdx; i < keyPoints.length; i++) {
          list.push({
            milestone: m,
            subtopicIndex: i,
            text: keyPoints[i],
            isEncrypted: false
          });
        }
      }
    }
    return list;
  };

  const allIncompleteTasks = getIncompleteSubtopicsList();
  const todaysTasks = allIncompleteTasks.slice(0, Math.max(2, dailyTarget));
  const remainingTodayTarget = Math.max(0, dailyTarget - completedToday);

  // Filter completed tasks out of the active list
  const pendingTasks = allIncompleteTasks.slice(0, remainingTodayTarget);
  const nextOverdriveTask = remainingTodayTarget === 0 && allIncompleteTasks.length > 0 ? allIncompleteTasks[0] : null;

  // Retrieve details for completed today log drawer
  const allCompletedSubtopics = getCompletedSubtopicsList();
  const completedTodayTasks = allCompletedSubtopics.slice(-completedToday);

  const getCatDialogue = () => {
    if (completedSubtopics === totalSubtopics) {
      return "Purrrr! 🌟 We have achieved absolute mastery over this universe! Meow!";
    }
    const target = chartView === "daily" ? dailyTarget : chartView === "weekly" ? weeklyTarget : monthlyTarget;
    const completed = chartView === "daily" ? completedToday : chartView === "weekly" ? completedThisWeek : completedThisMonth;
    if (completed >= target && target > 0) {
      return "Purr... Objective cleared! 🐟 Time for a cat nap... Or smash more subtopics to Limit Break!";
    }
    switch (velocityStatus) {
      case "AHEAD":
        return "Meow! We are faster than light! 🚀 The timeline charts look beautiful!";
      case "BEHIND":
        return `Hisss! 🙀 We are lagging behind our schedule! Workload increased to ${dailyTarget} topics/day. Let's study and fill the bar!`;
      default:
        return "Purr... Focus, human! 🧭 Just complete today's quota to keep the streak alive!";
    }
  };

  // Telemetry and Core Reactor State Declarations
  const remainingSubtopics = Math.max(0, totalSubtopics - completedSubtopics);
  const elapsedDaysVal = Math.max(1, elapsedDays);
  const targetRate = elapsedDaysVal > 0 ? (totalSubtopics / schedule.durationDays) : 0;
  const actualRate = elapsedDaysVal > 0 ? (completedSubtopics / elapsedDaysVal) : 0;
  const velocityRatio = targetRate > 0 ? (actualRate / targetRate) : 0;
  const syncPercent = targetSubtopicsSoFar > 0
    ? Math.min(100, Math.round((completedSubtopics / targetSubtopicsSoFar) * 100))
    : 100;

  const estRemainingDays = actualRate > 0 ? Math.ceil(remainingSubtopics / actualRate) : remainingDays;

  // Streak booster multiplier
  const xpBoost = schedule.streak > 0 ? `x${(1 + schedule.streak * 0.1).toFixed(1)}` : "x1.0";

  // Core Reactor States
  let coreColor = "#ff6a00";
  let coreBg = "radial-gradient(circle, rgba(255,106,0,0.15) 0%, rgba(255,106,0,0.02) 70%)";
  let coreText = "OFFLINE";
  let coreSubtitle = "0 Directives Met";

  if (completedToday > 0) {
    if (completedToday < dailyTarget) {
      coreColor = "#10b981";
      coreBg = "radial-gradient(circle, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.02) 70%)";
      coreText = "SYNCHRONIZING";
      coreSubtitle = `${completedToday} / ${dailyTarget} met`;
    } else if (completedToday === dailyTarget) {
      coreColor = "#059669";
      coreBg = "radial-gradient(circle, rgba(5,150,105,0.2) 0%, rgba(5,150,105,0.02) 70%)";
      coreText = "SYNCHRONIZED";
      coreSubtitle = "Target Cleared";
    } else {
      coreColor = "#8b5cf6";
      coreBg = "radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.02) 70%)";
      coreText = "LIMIT BREAK";
      coreSubtitle = `+${completedToday - dailyTarget} Overdrive`;
    }
  } else if (velocityStatus === "BEHIND") {
    coreColor = "#ef4444";
    coreBg = "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.02) 70%)";
    coreText = "DE-SYNCHRONIZED";
    coreSubtitle = "Behind Schedule";
  }

  // Readout card display variables
  let daysToFinishText = `${remainingDays} Days`;
  let daysToFinishSubtext = "Expected study days to complete entire path.";
  let daysToFinishColor = "var(--text-light)";
  let daysToFinishBorder = "#60a5fa";

  if (velocityStatus === "BEHIND") {
    const projectedDays = actualRate > 0 ? Math.ceil(remainingSubtopics / actualRate) : "∞";
    daysToFinishText = `${remainingDays} Days`;
    daysToFinishSubtext = `⚠️ Lagging! At current speed, it will take ${projectedDays} days. Quota increased.`;
    daysToFinishColor = "#ef4444";
    daysToFinishBorder = "#ef4444";
  } else {
    const projectedDays = actualRate > 0 ? Math.ceil(remainingSubtopics / actualRate) : remainingDays;
    if (projectedDays < remainingDays) {
      daysToFinishText = `${projectedDays} Days`;
      daysToFinishSubtext = `🚀 On pace to finish ${remainingDays - projectedDays} days early!`;
      daysToFinishColor = "var(--neon-green)";
      daysToFinishBorder = "#10b981";
    } else {
      daysToFinishText = `${remainingDays} Days`;
      daysToFinishSubtext = "On track to complete within your study plan limit.";
      daysToFinishColor = "var(--text-light)";
      daysToFinishBorder = "#60a5fa";
    }
  }

  const speedBorderColor = velocityStatus === "BEHIND" ? "#ef4444" : "#ff6a00";
  const goalMatchBorder = velocityStatus === "BEHIND" ? "#ef4444" : "#10b981";
  const goalMatchText = velocityStatus === "BEHIND" ? "#ef4444" : "var(--neon-green)";
  const goalMatchSubtext = velocityStatus === "BEHIND" ? "⚠️ Lagging timeline" : "🚀 Synchronization stable";
  const syncLevelText = `${syncPercent}% ${velocityStatus === "BEHIND" ? "LAGGING" : "SECURE"}`;
  const syncLevelColor = velocityStatus === "BEHIND" ? "#ef4444" : "var(--neon-green)";

  const baselineTarget = Math.ceil(totalSubtopics / schedule.durationDays) || 1;
  let quotaSubtext = `🎯 Baseline quota of ${baselineTarget} topics/day is sufficient.`;
  let quotaColor = "#ffb300";
  if (dailyTarget > baselineTarget) {
    quotaSubtext = `⚡ Increased from baseline of ${baselineTarget}/day to catch up.`;
    quotaColor = "#ef4444";
  } else if (dailyTarget < baselineTarget) {
    quotaSubtext = `🍀 Decreased from baseline of ${baselineTarget}/day due to fast progress!`;
    quotaColor = "#10b981";
  }

  const maxWeeks = Math.max(1, Math.ceil(schedule.durationDays / 7));
  const currentWeekIdx = Math.floor(elapsedDays / 7);
  const activeWeek = selectedWeek !== null ? selectedWeek : Math.min(Math.max(0, currentWeekIdx), maxWeeks - 1);

  return (
    <div style={{
      background: "transparent",
      border: "none",
      boxShadow: "none",
      padding: "0px",
      marginBottom: "24px",
      fontFamily: "var(--font-gamer)",
      color: "var(--text-light)"
    }}>
      
      {/* 1. Header Toolbar: Toggle Buttons + Streak */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
        
        {/* Toggle between Daily / Weekly / Monthly charts */}
        <div style={{ display: "flex", gap: "6px", background: isDarkMode ? "rgba(255,255,255,0.02)" : "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
          {[
            { id: "daily", label: "Daily (7 Days)" },
            { id: "weekly", label: "Weekly (4 Weeks)" },
            { id: "monthly", label: "Monthly (3 Months)" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { sound.playClockTick(); setChartView(tab.id); }}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                background: chartView === tab.id 
                  ? (isDarkMode ? "rgba(255,255,255,0.08)" : "#ffffff") 
                  : "transparent",
                color: chartView === tab.id ? "var(--text-light)" : "var(--text-muted)",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: chartView === tab.id && !isDarkMode ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                fontFamily: "var(--font-gamer)"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Info Right Area */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {schedule.streak > 0 && (
            <div style={{
              background: "rgba(255, 106, 0, 0.08)", border: "1px solid rgba(255, 106, 0, 0.25)",
              padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: "900", color: "#ff6a00"
            }}>
              🔥 {schedule.streak}D STREAK
            </div>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: "transparent", border: "1px solid var(--glass-border)",
              borderRadius: "10px", padding: "6px 12px", color: "var(--text-muted)",
              fontSize: "11.5px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s",
              fontFamily: "var(--font-gamer)"
            }}
          >
            {showSettings ? "✕ Close" : "⚙️ Settings"}
          </button>
        </div>

      </div>

      {/* 2. Settings Collapsible Panel */}
      {showSettings && (
        <div style={{ 
          marginBottom: "32px", padding: "16px 20px",
          background: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          borderLeft: "2.5px dashed #ff6a00",
          borderRadius: "4px",
          display: "flex", flexDirection: "column", gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Study Plan Length:
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { label: "1 Week", days: 7 },
                { label: "2 Weeks", days: 14 },
                { label: "1 Month", days: 30 },
                { label: "2 Months", days: 60 },
                { label: "3 Months", days: 90 },
              ].map(opt => (
                <button
                  key={opt.days}
                  onClick={() => handleDurationChange(opt.days)}
                  style={{
                    padding: "5px 10px", borderRadius: "6px",
                    border: schedule.durationDays === opt.days 
                      ? "1.5px solid #ff6a00" 
                      : "1px solid var(--glass-border)",
                    background: schedule.durationDays === opt.days 
                      ? "rgba(255, 106, 0, 0.08)" 
                      : "transparent",
                    color: schedule.durationDays === opt.days ? "#ff6a00" : "var(--text-muted)",
                    fontSize: "11px", fontWeight: "700", cursor: "pointer",
                    fontFamily: "var(--font-gamer)"
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleSimulateMissedDay} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.4)", background: "transparent", color: "#ef4444", fontSize: "11px", fontWeight: "700", cursor: "pointer", fontFamily: "var(--font-gamer)" }}>
              ⏳ Skip a Day (Test)
            </button>
            <button onClick={handleResetTimeline} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--glass-border)", background: "transparent", color: "var(--text-muted)", fontSize: "11px", fontWeight: "700", cursor: "pointer", fontFamily: "var(--font-gamer)" }}>
              🔄 Restart Study Plan
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes pulseBorder {
          0%, 100% { border-color: rgba(255, 106, 0, 0.35); box-shadow: ${isDarkMode ? "0 24px 64px rgba(0, 0, 0, 0.7), 0 0 30px rgba(255, 106, 0, 0.1)" : "0 24px 64px rgba(0,0,0,0.06)"}; }
          50% { border-color: rgba(255, 106, 0, 0.75); box-shadow: ${isDarkMode ? "0 24px 64px rgba(0, 0, 0, 0.7), 0 0 45px rgba(255, 106, 0, 0.25)" : "0 24px 64px rgba(0,0,0,0.08)"}; }
        }
        @keyframes techBlink {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.95; }
        }
        @keyframes gracePulse {
          0%, 100% { opacity: 0.85; transform: scale(1); filter: brightness(1); }
          50% { opacity: 1; transform: scale(1.03); filter: brightness(1.2); }
        }
        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spinReverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        .hud-quest-btn {
          background: rgba(255, 106, 0, 0.05);
          border: 1px solid rgba(255, 106, 0, 0.2);
          color: #ff6a00;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: var(--font-gamer);
        }
        .hud-quest-btn:hover {
          background: #ff6a00;
          color: #fff;
          box-shadow: 0 0 10px rgba(255, 106, 0, 0.4);
        }
        .hud-cell-block {
          position: relative;
          cursor: pointer;
          overflow: hidden;
        }
        .hud-cell-block:hover {
          transform: scale(1.08) translateY(-2px);
          filter: brightness(1.25);
          z-index: 10;
        }
        .hud-cell-block::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transform: skewX(-25deg);
          transition: 0.75s;
        }
        .hud-cell-block:hover::after {
          left: 150%;
        }
        .telemetry-card {
          background: transparent;
          padding: 12px 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .telemetry-card:hover {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)"};
          transform: translateX(4px);
        }
        .hud-directive-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: transparent;
          border-bottom: 1px solid var(--glass-border);
          border-left: 3.5px solid transparent;
          gap: 16px;
          flex-wrap: wrap;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hud-directive-row:hover {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.015)" : "rgba(0, 0, 0, 0.015)"};
          border-left-color: #ff6a00;
          padding-left: 28px;
        }
        .hud-panel-wrapper {
          position: relative;
          padding: 20px;
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.005)" : "rgba(0, 0, 0, 0.003)"};
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.03)"};
          border-radius: 12px;
          transition: border-color 0.3s ease;
        }
        .hud-panel-wrapper:hover {
          border-color: ${isDarkMode ? "rgba(255, 106, 0, 0.15)" : "rgba(255, 106, 0, 0.15)"};
        }
        .hud-corner-bracket {
          position: absolute;
          width: 8px;
          height: 8px;
          border-color: #ff6a00;
          border-style: solid;
          opacity: 0.35;
          pointer-events: none;
          transition: all 0.3s ease;
        }
        .hud-panel-wrapper:hover .hud-corner-bracket {
          opacity: 0.85;
          filter: drop-shadow(0 0 4px #ff6a00);
        }
        .hud-bracket-tl { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
        .hud-bracket-tr { top: -1px; right: -1px; border-width: 2px 2px 0 0; }
        .hud-bracket-bl { bottom: -1px; left: -1px; border-width: 0 0 2px 2px; }
        .hud-bracket-br { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }
        
        .pulsing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
          animation: pulseDot 2s infinite ease-in-out;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 0.4; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes redGlowPulse {
          0%, 100% { opacity: 0.85; filter: brightness(1); box-shadow: 0 0 10px rgba(239, 68, 68, 0.65), inset 0 1px 1px rgba(255,255,255,0.2); }
          50% { opacity: 1; filter: brightness(1.25); box-shadow: 0 0 20px rgba(239, 68, 68, 0.95), inset 0 1px 1px rgba(255,255,255,0.35); }
        }
      `}</style>

      {/* 3. Main Dashboard: Bar Chart (Focus) + Telemetry Stack (Sidebar) */}
      <div className="scheduler-dashboard-grid">
        
        {/* Left/Center Area: Focus Bar Chart wrapped in HUD corners panel */}
        <div className="hud-panel-wrapper" style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
          <div className="hud-corner-bracket hud-bracket-tl" />
          <div className="hud-corner-bracket hud-bracket-tr" />
          <div className="hud-corner-bracket hud-bracket-bl" />
          <div className="hud-corner-bracket hud-bracket-br" />

          {/* High-tech Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)", paddingBottom: "10px", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "10px", fontWeight: "900", color: "#ff6a00", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                📊 TIMELINE CHRONOS SYNC MATRIX
              </span>
              {chartView === "daily" && maxWeeks > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    disabled={activeWeek === 0}
                    onClick={() => {
                      sound.playClockTick();
                      setSelectedWeek(activeWeek - 1);
                    }}
                    style={{
                      background: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                      border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.12)",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      color: activeWeek === 0 ? "var(--text-muted)" : "#ff6a00",
                      cursor: activeWeek === 0 ? "default" : "pointer",
                      fontSize: "11px",
                      fontWeight: "bold",
                      opacity: activeWeek === 0 ? 0.4 : 1,
                      fontFamily: "var(--font-gamer)"
                    }}
                  >
                    ◀ Prev
                  </button>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-light)" }}>
                    Week {activeWeek + 1} of {maxWeeks}
                  </span>
                  <button
                    disabled={activeWeek >= maxWeeks - 1}
                    onClick={() => {
                      sound.playClockTick();
                      setSelectedWeek(activeWeek + 1);
                    }}
                    style={{
                      background: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
                      border: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.12)",
                      borderRadius: "6px",
                      padding: "2px 8px",
                      color: activeWeek >= maxWeeks - 1 ? "var(--text-muted)" : "#ff6a00",
                      cursor: activeWeek >= maxWeeks - 1 ? "default" : "pointer",
                      fontSize: "11px",
                      fontWeight: "bold",
                      opacity: activeWeek >= maxWeeks - 1 ? 0.4 : 1,
                      fontFamily: "var(--font-gamer)"
                    }}
                  >
                    Next ▶
                  </button>
                </div>
              )}
            </div>
            <span style={{ fontSize: "9px", color: coreColor, display: "flex", alignItems: "center", gap: "6px", fontWeight: "900", letterSpacing: "1px" }}>
              <span className="pulsing-dot" style={{ background: coreColor, boxShadow: `0 0 8px ${coreColor}` }} />
              {coreText} ({coreSubtitle})
            </span>
          </div>

          {/* Adaptive Vertical Bar Chart (Enlarged Premium Grid) */}
          <div style={{ 
            display: "flex", 
            alignItems: "flex-end", // Align columns directly to the bottom of the container
            justifyContent: "space-between", 
            minHeight: "320px", // Increased to push baseline down to align with the 4th telemetry card
            padding: "16px 10px 0px 10px", // No bottom padding so bars touch the line!
            background: isDarkMode 
              ? "repeating-linear-gradient(0deg, transparent, transparent 33px, rgba(255,255,255,0.025) 33px, rgba(255,255,255,0.025) 34px)" 
              : "repeating-linear-gradient(0deg, transparent, transparent 33px, rgba(0,0,0,0.025) 33px, rgba(0,0,0,0.025) 34px)",
            borderBottom: isDarkMode ? "1.5px solid rgba(255,255,255,0.12)" : "1.5px solid rgba(0,0,0,0.12)",
          }}>
            {chartData.map((item, idx) => {
              const target = item.target;
              const completed = item.completed;

              // Compute segmented cell elements
              const cells = [];
              const cellCount = Math.max(target, completed);
              for (let i = 0; i < cellCount; i++) {
                const isWithinTarget = i < target;
                const isCompleted = i < completed;
                const isOverdrive = i >= target;
                cells.push({ isWithinTarget, isCompleted, isOverdrive });
              }

              return (
                <div 
                  key={idx} 
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    flex: 1
                  }}
                >
                  {/* The Bar Area — each cell is a fixed 30px, bar height = cellCount * 30 + gaps */}
                  <div style={{
                    width: "48px",
                    display: "flex",
                    flexDirection: "column-reverse",
                    gap: "4px",
                    transition: "all 0.3s ease"
                  }}>
                    {cells.map((cell, cIdx) => {
                      let cellStyle = {
                        width: "100%",
                        height: "30px",
                        borderRadius: "6px",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        boxSizing: "border-box",
                        flexShrink: 0
                      };

                      if (cell.isOverdrive) {
                        const overdriveIdx = cIdx - target;
                        if (overdriveIdx >= 2) {
                          // Glowing Red (Nuclear Overdrive)
                          cellStyle = {
                            ...cellStyle,
                            background: "linear-gradient(135deg, #f87171 0%, #ef4444 100%)",
                            boxShadow: "0 0 16px rgba(239,68,68,0.75), inset 0 1px 1px rgba(255,255,255,0.3)",
                            border: "none",
                            animation: "redGlowPulse 1.5s infinite ease-in-out"
                          };
                        } else {
                          // Violet
                          cellStyle = {
                            ...cellStyle,
                            background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)",
                            boxShadow: "0 0 14px rgba(124,58,237,0.65), inset 0 1px 1px rgba(255,255,255,0.2)",
                            border: "none",
                            animation: "gracePulse 2s infinite ease-in-out"
                          };
                        }
                      } else if (cell.isCompleted) {
                        cellStyle = {
                          ...cellStyle,
                          background: "linear-gradient(135deg, #34d399 0%, #059669 100%)",
                          boxShadow: "0 0 10px rgba(5,150,105,0.45), inset 0 1px 1px rgba(255,255,255,0.2)",
                          border: "none"
                        };
                      } else {
                        cellStyle = {
                          ...cellStyle,
                          background: isDarkMode ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)",
                          border: item.isCurrent 
                            ? "2px dashed #ff6a00" 
                            : (isDarkMode ? "1.2px dashed rgba(255,255,255,0.12)" : "1.2px dashed #cbd5e1"),
                        };
                      }

                      return (
                        <div 
                          key={cIdx} 
                          className="hud-cell-block"
                          style={cellStyle}
                          title={
                            cell.isOverdrive 
                              ? "Limit Break! Overdrive Quest Completed" 
                              : cell.isCompleted 
                              ? "Completed Directive" 
                              : "Pending Daily Quota Directive"
                          }
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis Labels & Score ratios under the bottom border axis */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "8px 10px 0 10px"
          }}>
            {chartData.map((item, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  flex: 1 
                }}
              >
                {/* Score Ratio details */}
                <div style={{ fontSize: "11px", fontWeight: "800", color: item.isCurrent ? "#ff6a00" : "var(--text-light)" }}>
                  {item.completed} <span style={{ color: "var(--text-muted)", fontWeight: "500" }}>/</span> {item.target}
                </div>

                {/* Bar Labels */}
                <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "4px", fontWeight: "600" }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>

          {/* Extra High-tech coordinate label to fill the bottom layout space */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "var(--text-muted)", letterSpacing: "1px", marginTop: "8px", borderTop: isDarkMode ? "1px solid rgba(255,255,255,0.03)" : "1px solid rgba(0,0,0,0.03)", paddingTop: "8px" }}>
            <span>[SYS-COORD: LOG_GRID_A]</span>
            <span>SCALE: segments_30px</span>
            <span>LOC: c_dashboard_scheduler</span>
          </div>
        </div>

        {/* Right Sidebar: Telemetry Cards Stacked Vertically inside HUD panel */}
        <div className="hud-panel-wrapper" style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "16px",
        }}>
          <div className="hud-corner-bracket hud-bracket-tl" />
          <div className="hud-corner-bracket hud-bracket-tr" />
          <div className="hud-corner-bracket hud-bracket-bl" />
          <div className="hud-corner-bracket hud-bracket-br" />

          {/* High-tech Sidebar Header */}
          <div style={{ fontSize: "10px", fontWeight: "900", color: "#ff6a00", letterSpacing: "1.5px", borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)", paddingBottom: "10px", marginBottom: "8px", textTransform: "uppercase" }}>
            📈 SYNC READOUTS
          </div>

          <div className="telemetry-card" style={{ borderLeft: `3.5px solid ${speedBorderColor}`, borderTop: "none", borderRight: "none", borderBottom: "none" }}>
            <span style={{ fontSize: "10px", fontWeight: "850", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
              ⏱️ Study Speed
            </span>
            <span style={{ fontSize: "20px", fontWeight: "900", color: velocityStatus === "BEHIND" ? "#ef4444" : (velocityRatio > 1 ? "var(--neon-green)" : "#ff6a00") }}>
              {velocityRatio > 0 ? `${velocityRatio.toFixed(1)}x speed` : "0.0x idle"}
            </span>
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", lineHeight: "1.3" }}>
              Completions compared to schedule target baseline.
            </span>
          </div>

          <div className="telemetry-card" style={{ borderLeft: "3.5px solid #a78bfa", borderTop: "none", borderRight: "none", borderBottom: "none" }}>
            <span style={{ fontSize: "10px", fontWeight: "850", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
              ⚡ Path Subtopics
            </span>
            <span style={{ fontSize: "20px", fontWeight: "900", color: "#a78bfa" }}>
              {completedSubtopics} / {totalSubtopics}
            </span>
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", lineHeight: "1.3" }}>
              {totalSubtopics - completedSubtopics} subtopics remaining to complete entire path.
            </span>
          </div>

          <div className="telemetry-card" style={{ borderLeft: `3.5px solid ${daysToFinishBorder}`, borderTop: "none", borderRight: "none", borderBottom: "none" }}>
            <span style={{ fontSize: "10px", fontWeight: "850", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
              📅 Days to Finish
            </span>
            <span style={{ fontSize: "20px", fontWeight: "900", color: daysToFinishColor }}>
              {daysToFinishText}
            </span>
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", lineHeight: "1.3" }}>
              {daysToFinishSubtext}
            </span>
          </div>


          <div className="telemetry-card" style={{ borderLeft: "3.5px solid #a78bfa", borderTop: "none", borderRight: "none", borderBottom: "none" }}>
            <span style={{ fontSize: "10px", fontWeight: "850", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
              🔥 Streak Bonus
            </span>
            <span style={{ fontSize: "20px", fontWeight: "900", color: schedule.streak > 0 ? "#ff6a00" : "var(--text-muted)" }}>
              {xpBoost} XP
            </span>
            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", lineHeight: "1.3" }}>
              {schedule.streak > 0 ? `Active: ${schedule.streak}D streak reward active!` : "Gain streak by meeting daily targets"}
            </span>
          </div>

        </div>

      </div>

      {/* 5. TODAY'S SYSTEM DIRECTIVES SECTION (Pending Only) */}
      {pendingTasks.length > 0 && (
        <div style={{
          marginTop: "40px",
          padding: "24px 0 0 0",
          background: "transparent",
          border: "none",
        }}>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            marginBottom: "24px", 
            flexWrap: "wrap", 
            gap: "10px",
            borderBottom: isDarkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
            paddingBottom: "12px"
          }}>
            <div>
              <h3 style={{
                fontSize: "14px",
                fontWeight: "900",
                color: "#ff6a00",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                fontFamily: "var(--font-gamer)"
              }}>
                🛡️ TODAY'S STUDY QUESTS
              </h3>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0", fontWeight: "600" }}>
                Complete your daily objectives to earn maximum XP and keep your neurons synchronized.
              </p>
            </div>
            <div style={{
              background: "rgba(255, 106, 0, 0.08)",
              border: "1px solid rgba(255, 106, 0, 0.25)",
              padding: "6px 14px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "900",
              color: "#ff6a00"
            }}>
              🎯 {completedToday} / {dailyTarget} QUESTS DONE
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
            {pendingTasks.map((t, idx) => {
              const taskNum = completedToday + idx + 1;

              return (
                <div 
                  key={`${t.milestone.id}_${t.subtopicIndex}`} 
                  className="hud-directive-row"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "200px" }}>
                    <div style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px dashed var(--text-muted)",
                      background: "transparent",
                      color: "var(--text-muted)",
                      flexShrink: 0
                    }}>
                      <span style={{ fontSize: "10.5px", fontWeight: "900" }}>{taskNum}</span>
                    </div>

                    <div>
                      <div style={{
                        fontSize: "13.5px",
                        fontWeight: "700",
                        color: "var(--text-light)",
                        lineHeight: "1.4"
                      }}>
                        {t.text}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--text-muted)", marginTop: "2px", fontWeight: "600" }}>
                        📍 NODE: {t.milestone.title}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!t.isEncrypted && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="hud-quest-btn"
                        onClick={() => {
                          if (onTriggerSearch) {
                            sound.playClockTick();
                            onTriggerSearch(t.milestone.searchQuery || t.milestone.title);
                          }
                        }}
                      >
                        🎮 Find Duel
                      </button>
                      <button
                        className="hud-quest-btn"
                        style={{
                          background: "rgba(139, 92, 246, 0.05)",
                          border: "1px solid rgba(139, 92, 246, 0.2)",
                          color: "#8b5cf6"
                        }}
                        onClick={() => {
                          if (onStartSoloStudy) {
                            sound.playClockTick();
                            onStartSoloStudy(t.milestone);
                          }
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "#8b5cf6";
                          e.currentTarget.style.color = "#fff";
                          e.currentTarget.style.boxShadow = "0 0 10px rgba(139,92,246,0.4)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "rgba(139, 92, 246, 0.05)";
                          e.currentTarget.style.color = "#8b5cf6";
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      >
                        📖 Solo Study
                      </button>
                      <button
                        className="hud-quest-btn"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid var(--glass-border)",
                          color: "var(--text-light)"
                        }}
                        onClick={() => {
                          if (onSelectMilestone) {
                            onSelectMilestone(t.milestone);
                          }
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                        }}
                      >
                        👁️ Roadmap
                      </button>
                    </div>
                  )}

                  {t.isEncrypted && (
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                      🔒 Locked Module
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
