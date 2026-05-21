import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, 
  ShieldAlert, 
  Volume2, 
  Moon, 
  CheckCircle2, 
  Smartphone, 
  Flame, 
  Coins, 
  TrendingUp, 
  Calendar, 
  Award, 
  Settings, 
  Hourglass,
  CalendarDays,
  Play,
  RotateCcw
} from 'lucide-react';

import { PrayerItem, UserStats, PrayerHistoryLog, PrayerId } from './types';
import { DEFAULT_PRAYERS, PRAYER_REWARDS } from './data/prayers';
import { WALLPAPERS } from './data/wallpapers';
import { RINGTONES, testRingtone, stopAudio } from './utils/audio';

import LockScreen from './components/LockScreen';
import WallpaperStore from './components/WallpaperStore';

export default function App() {
  // --------- States ---------
  const [prayers, setPrayers] = useState<PrayerItem[]>([]);
  const [stats, setStats] = useState<UserStats>({
    points: 120, // Starter credits
    streak: 3,
    unlockedWallpapers: ['default'],
    activeWallpaperId: 'default',
    currentRingtoneId: 'celestial'
  });
  const [history, setHistory] = useState<PrayerHistoryLog[]>([]);
  
  const [time, setTime] = useState(new Date());
  const [activeAlarmPrayer, setActiveAlarmPrayer] = useState<PrayerItem | null>(null);
  const [snoozeDuration, setSnoozeDuration] = useState<number>(5); // defaults to 5 mins
  const [editingPrayerId, setEditingPrayerId] = useState<PrayerId | null>(null);
  const [editedTime, setEditedTime] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string>('');

  // Prevent double trigger during same minute
  const lastTriggeredRef = useRef<string>(''); 

  // --------- LocalStorage Loading & Saving ---------
  useEffect(() => {
    // Load prayers
    const savedPrayers = localStorage.getItem('faithlock_prayers');
    if (savedPrayers) {
      try {
        setPrayers(JSON.parse(savedPrayers));
      } catch (e) {
        setPrayers(DEFAULT_PRAYERS);
      }
    } else {
      setPrayers(DEFAULT_PRAYERS);
    }

    // Load user stats
    const savedStats = localStorage.getItem('faithlock_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        // preserve default
      }
    }

    // Load logs history
    const savedHistory = localStorage.getItem('faithlock_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        setHistory([]);
      }
    }
  }, []);

  const savePrayers = (updatedPrayers: PrayerItem[]) => {
    setPrayers(updatedPrayers);
    localStorage.setItem('faithlock_prayers', JSON.stringify(updatedPrayers));
  };

  const saveStats = (updatedStats: UserStats) => {
    setStats(updatedStats);
    localStorage.setItem('faithlock_stats', JSON.stringify(updatedStats));
  };

  const saveHistory = (updatedHistory: PrayerHistoryLog[]) => {
    setHistory(updatedHistory);
    localStorage.setItem('faithlock_history', JSON.stringify(updatedHistory));
  };

  // --------- Real-Time Time Tracker ---------
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now);

      // Extract current time in format "HH:MM"
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const timeString = `${currentHours}:${currentMinutes}`;

      // Check alarms for each prayer
      prayers.forEach((p) => {
        const triggerTime = p.status === 'snoozed' && p.snoozedUntil ? p.snoozedUntil : p.time;
        
        // Match condition
        if (triggerTime === timeString && (p.status === 'pending' || p.status === 'snoozed')) {
          const triggerKey = `${p.id}-${timeString}`;
          if (lastTriggeredRef.current !== triggerKey && !activeAlarmPrayer) {
            lastTriggeredRef.current = triggerKey;
            triggerAlarm(p);
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [prayers, activeAlarmPrayer]);

  // --------- Trigger Lockdown Alarm ---------
  const triggerAlarm = (prayer: PrayerItem) => {
    setActiveAlarmPrayer(prayer);
    showToast(`🚨 ATTENTION ISOLATOR ACTIVE: Time for ${prayer.name}!`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const getNextPrayer = () => {
    const sorted = [...prayers].sort((a, b) => a.time.localeCompare(b.time));
    const currentHours = time.getHours();
    const currentMinutes = time.getMinutes();
    const currentMinutesTotal = currentHours * 60 + currentMinutes;

    // Find first prayer that is later than now
    let next = sorted.find(p => {
      const [h, m] = p.time.split(':').map(Number);
      return (h * 60 + m) > currentMinutesTotal;
    });

    if (!next) {
      next = sorted[0];
    }
    return next;
  };

  const getCountdownString = (nextPrayer: PrayerItem | undefined) => {
    if (!nextPrayer) return '--:--';
    const [h, m] = nextPrayer.time.split(':').map(Number);
    
    let nowH = time.getHours();
    let nowM = time.getMinutes();
    let nowS = time.getSeconds();

    let targetMinutesTotal = h * 60 + m;
    let nowMinutesTotal = nowH * 60 + nowM;

    // Adjust for tomorrow
    if (targetMinutesTotal <= nowMinutesTotal) {
      targetMinutesTotal += 24 * 60;
    }

    const diffMinutes = targetMinutesTotal - nowMinutesTotal - 1;
    const diffSeconds = 60 - nowS;

    const finalH = Math.floor(diffMinutes / 60);
    const finalM = diffMinutes % 60;
    const finalS = diffSeconds === 60 ? 0 : diffSeconds;

    return `${String(finalH).padStart(2, '0')}h ${String(finalM).padStart(2, '0')}m ${String(finalS).padStart(2, '0')}s`;
  };

  // --------- Alarms / Lock callbacks ---------
  const handleAlarmComplete = (prayerId: string, pointsEarned: number) => {
    const updatedPrayers = prayers.map((p) => {
      if (p.id === prayerId) {
        return {
          ...p,
          status: 'completed' as const,
          actualPrayedTime: `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`,
          pointsReceived: pointsEarned
        };
      }
      return p;
    });
    savePrayers(updatedPrayers);

    const updatedHistory: PrayerHistoryLog[] = [
      {
        id: Math.random().toString(36).substr(2, 9),
        date: time.toISOString().split('T')[0],
        prayerId: prayerId as PrayerId,
        prayerName: prayers.find(p => p.id === prayerId)?.name || 'Prayer',
        status: 'completed',
        points: pointsEarned,
        timestamp: new Date().toISOString()
      },
      ...history
    ];
    saveHistory(updatedHistory);

    const todayStr = time.toISOString().split('T')[0];
    const finishedToday = updatedPrayers.filter(p => p.status === 'completed').length;
    
    let newStreak = stats.streak;
    let streakBonus = 0;
    
    if (finishedToday === 5) {
      newStreak += 1;
      streakBonus = PRAYER_REWARDS.streakBonus;
      showToast(`🏆 5/5 PRAYERS COMPLETED TODAY! Streak set to ${newStreak}! +${streakBonus} pts awarded.`);
    }

    const newStats: UserStats = {
      ...stats,
      points: stats.points + pointsEarned + streakBonus,
      streak: newStreak,
      lastActiveDate: todayStr
    };
    saveStats(newStats);

    setActiveAlarmPrayer(null);
    showToast(`✨ Alhamdulillah! Verified. +${pointsEarned} points scored.`);
  };

  const handleAlarmSnooze = (prayerId: string, minutes: number) => {
    const snoozeDate = new Date(time.getTime() + minutes * 60000);
    const snzH = String(snoozeDate.getHours()).padStart(2, '0');
    const snzM = String(snoozeDate.getMinutes()).padStart(2, '0');
    const snoozeUntilString = `${snzH}:${snzM}`;

    const updatedPrayers = prayers.map((p) => {
      if (p.id === prayerId) {
        return {
          ...p,
          status: 'snoozed' as const,
          snoozedUntil: snoozeUntilString
        };
      }
      return p;
    });
    savePrayers(updatedPrayers);

    const updatedHistory: PrayerHistoryLog[] = [
      {
        id: Math.random().toString(36).substr(2, 9),
        date: time.toISOString().split('T')[0],
        prayerId: prayerId as PrayerId,
        prayerName: prayers.find(p => p.id === prayerId)?.name || 'Prayer',
        status: 'snoozed',
        points: 0,
        timestamp: new Date().toISOString()
      },
      ...history
    ];
    saveHistory(updatedHistory);

    setActiveAlarmPrayer(null);
    showToast(`🌙 Alarm snoozed to ${snoozeUntilString}. We will secure focus again soon.`);
  };

  const handleUnlockWallpaper = (id: string, cost: number) => {
    if (stats.points < cost) {
      showToast('❌ Insufficient point balance for this theme wallpaper.');
      return;
    }

    const newStats: UserStats = {
      ...stats,
      points: stats.points - cost,
      unlockedWallpapers: [...stats.unlockedWallpapers, id],
      activeWallpaperId: id
    };
    saveStats(newStats);
    showToast('✨ Custom Wallpaper unlocked and activated successfully.');
  };

  const handleSelectWallpaper = (id: string) => {
    const newStats: UserStats = {
      ...stats,
      activeWallpaperId: id
    };
    saveStats(newStats);
    showToast('🎨 Switched theme background.');
  };

  const handleTestRingtone = (ringtoneId: string) => {
    testRingtone(ringtoneId);
    showToast(`🎵 Testing waves tone. Press "Snooze" or let notes finish.`);
  };

  const handleSelectRingtone = (ringtoneId: string) => {
    const newStats: UserStats = {
      ...stats,
      currentRingtoneId: ringtoneId
    };
    saveStats(newStats);
    showToast(`🔔 Ringtone configured: ${RINGTONES.find(r => r.id === ringtoneId)?.name}`);
  };

  const handleStartEditingTime = (prayer: PrayerItem) => {
    setEditingPrayerId(prayer.id);
    setEditedTime(prayer.time);
  };

  const handleSaveEditedTime = () => {
    if (!editingPrayerId || !editedTime) return;
    
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!regex.test(editedTime)) {
      showToast('❌ Invalid notation. Ensure coordinate is HH:MM.');
      return;
    }

    const updated = prayers.map(p => {
      if (p.id === editingPrayerId) {
        return {
          ...p,
          time: editedTime,
          status: 'pending' as const,
          snoozedUntil: undefined
        };
      }
      return p;
    });
    
    savePrayers(updated);
    setEditingPrayerId(null);
    showToast('✅ Saved custom prayer timing.');
  };

  const handleResetSchedule = () => {
    savePrayers(DEFAULT_PRAYERS);
    showToast('🔄 Restored default coordinates prayer times.');
  };

  const handleResetHistory = () => {
    if (window.confirm("Do you want to reset all earned reward points and schedules?")) {
      saveHistory([]);
      const defaultStats = {
        points: 120, // keep 120 starter points for quick testing
        streak: 3,
        unlockedWallpapers: ['default'],
        activeWallpaperId: 'default',
        currentRingtoneId: 'celestial'
      };
      saveStats(defaultStats);
      savePrayers(DEFAULT_PRAYERS);
      showToast('🗑️ All data logs reset.');
    }
  };

  const handleSimulateLockdown = (prayerId: PrayerId) => {
    const target = prayers.find(p => p.id === prayerId) || prayers[0];
    triggerAlarm(target);
  };

  // Get active wallpaper theme details
  const activeWP = WALLPAPERS.find(w => w.id === stats.activeWallpaperId) || WALLPAPERS[0];
  const nextPrayer = getNextPrayer();

  const formatLocalDate = () => {
    return time.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div 
      className="min-h-screen relative overflow-x-hidden flex flex-col font-sans transition-all duration-700 bg-[#fdfbf7] selection:bg-[#5a5a40] selection:text-white pb-12 text-[#5a5a40]"
      style={{
        backgroundColor: '#fdfbf7',
        backgroundImage: activeWP.id !== 'default' ? `url(${activeWP.imageSrc})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Dynamic shielding filter overlay to blend wallpapers with "Natural Tones" warm ivory tint */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          activeWP.id === 'default' ? 'bg-[#fdfbf7]' : 'bg-[#fdfbf7]/94 backdrop-blur-xs'
        }`} 
      />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto p-4 sm:p-8 flex-grow flex flex-col justify-between space-y-8 select-none">
        
        {/* HEADER AREA - Styled directly from Natural Tones template code */}
        <header className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#e2dec9]">
          <div className="flex flex-col space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
              {/* Elegant dynamic serif clock */}
              <span className="text-4xl sm:text-5xl font-bold font-serif text-[#5a5a40] tracking-tight">
                {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              <span className="text-[#8a8a6d] uppercase tracking-[0.2em] text-xs font-sans font-bold">
                {formatLocalDate()}
              </span>
            </div>
            <div className="text-xs uppercase tracking-widest font-sans font-bold text-[#8a8a6d] flex items-center gap-1.5">
              <span>● ALARM AGENT ACTIVE</span>
              <span className="text-[#c2a44d] italic">Ramadan Schedule Frame</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Elegant points pill matches JD template badge exactly */}
            <div className="bg-[#efede0] px-4 py-2.5 rounded-full flex items-center gap-2 border border-[#d6d2b5] shadow-xs">
              <div className="w-2.5 h-2.5 rounded-full bg-[#c2a44d] shadow-[0_0_8px_#c2a44d]"></div>
              <span className="text-xs font-sans font-bold text-[#5a5a40] tracking-widest uppercase">
                {stats.points} POINTS
              </span>
            </div>
            
            {/* Action resetting */}
            <button
              onClick={handleResetHistory}
              title="Reset points data & history logs"
              className="p-2.5 border border-[#e2dec9] hover:bg-[#efede0] hover:text-[#5a5a40] text-[#8a8a6d] rounded-full transition-all duration-200 cursor-pointer"
            >
              <RotateCcw size={14} />
            </button>

            {/* Initials badge from template */}
            <div className="w-10 h-10 rounded-full bg-[#5a5a40] flex items-center justify-center text-white font-sans text-sm font-bold shadow-xs">
              JD
            </div>
          </div>
        </header>

        {/* TOAST SYSTEM ANNOUNCEMENTS */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-[#5a5a40] text-white text-xs font-bold font-sans uppercase tracking-widest px-4 py-3 rounded-2xl shadow-sm text-center mx-auto max-w-xl flex items-center justify-center space-x-2"
            >
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* COMPREHENSIVE TWO-COLUMN BODY CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CONTENT COLUMN: Main focus, stats list, and active schedules */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* CORE CURRENT FOCUS BENTO AREA - Replaces previous clock and displays like current area */}
            <div className="bg-[#f5f2e8] rounded-[2.5rem] p-6 sm:p-10 border border-[#e2dec9] flex flex-col justify-between min-h-[350px] shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] text-[#5a5a40] pointer-events-none">
                <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>

              <div>
                <h2 className="text-[#8a8a6d] uppercase tracking-[0.2em] text-xs font-sans font-bold mb-2">Current Active Focus</h2>
                
                <h1 className="text-4xl sm:text-5xl text-[#5a5a40] leading-tight font-serif mt-1">
                  Time for <br />
                  <span className="italic font-light text-[#8a8a6d]">
                    {nextPrayer ? `${nextPrayer.name} Prayer` : 'Reflection Block'}
                  </span>
                </h1>

                <p className="text-[#5a5a40] mt-4 max-w-md font-sans text-xs leading-relaxed font-medium opacity-90">
                  Device isolation is on standby. All target application coordinates pause when the alarm ticks until your prayer oath is recorded.
                </p>
              </div>

              {/* Lockdown action buttons directly mapped to Design style */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button 
                  onClick={() => nextPrayer && handleSimulateLockdown(nextPrayer.id)}
                  className="flex-1 bg-[#5a5a40] text-white py-4 px-6 rounded-2xl font-sans font-bold text-sm tracking-widest uppercase hover:opacity-90 active:scale-98 transition cursor-pointer"
                >
                  TRIGGER PRAYER LOCKDOWN
                </button>
                <button 
                  onClick={() => nextPrayer && handleAlarmComplete(nextPrayer.id, 50)}
                  className="px-6 border-2 border-[#5a5a40] text-[#5a5a40] py-4 rounded-2xl font-sans font-bold text-xs uppercase tracking-widest hover:bg-[#5a5a40] hover:text-white transition-all cursor-pointer"
                >
                  SNOOZE / SKIP
                </button>
              </div>
            </div>

            {/* THREE COLUMN STATS CARD GRID */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-[#e2dec9] flex flex-col items-center justify-center gap-1 text-center shadow-xs">
                <span className="text-[#8a8a6d] text-[10px] sm:text-xs font-sans uppercase font-bold tracking-wider">DAILY STREAK</span>
                <span className="text-xl sm:text-2xl font-bold font-serif text-[#5a5a40]">{stats.streak} Days</span>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-[#e2dec9] flex flex-col items-center justify-center gap-1 text-center shadow-xs">
                <span className="text-[#8a8a6d] text-[10px] sm:text-xs font-sans uppercase font-bold tracking-wider">TOTAL SCORE</span>
                <span className="text-xl sm:text-2xl font-bold font-serif text-[#5a5a40]">{stats.points} pts</span>
              </div>
              <div className="bg-white rounded-3xl p-5 border border-[#e2dec9] flex flex-col items-center justify-center gap-1 text-center shadow-xs">
                <span className="text-[#8a8a6d] text-[10px] sm:text-xs font-sans uppercase font-bold tracking-wider">NEXT ALARM</span>
                <span className="text-xl sm:text-2xl font-bold font-serif text-[#5a5a40]">{nextPrayer?.time || 'Pending'}</span>
              </div>
            </div>

            {/* FOCUS PRAYER TIMELINE AGENDA */}
            <div className="bg-white border border-[#e2dec9] rounded-[2.5rem] p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e2dec9] mb-5">
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#5a5a40] flex items-center space-x-2">
                    <CalendarDays className="text-[#8a8a6d]" size={18} />
                    <span>Focus Prayer Agenda</span>
                  </h3>
                  <p className="text-xs text-[#8a8a6d] mt-1 font-sans">
                    Timing list of five mandatory daily prayers and custom snooze offsets.
                  </p>
                </div>
                <div>
                  <button 
                    onClick={handleResetSchedule}
                    className="text-[10px] font-sans font-bold uppercase tracking-widest bg-[#f5f2e8] hover:bg-[#efede0] text-[#5a5a40] border border-[#d6d2b5] px-3.5 py-2 rounded-lg transition text-slate-300 font-medium cursor-pointer"
                  >
                    Restore default timings
                  </button>
                </div>
              </div>

              {/* TIMELINE LIST */}
              <div className="space-y-4">
                {prayers.map((prayer) => {
                  const isNext = nextPrayer?.id === prayer.id;
                  const isEditing = editingPrayerId === prayer.id;

                  return (
                    <div 
                      key={prayer.id}
                      className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
                        isNext 
                          ? 'bg-[#efede0]/50 border-[#5a5a40] shadow-xs' 
                          : prayer.status === 'completed'
                            ? 'bg-transparent border-[#e2dec9] opacity-70'
                            : 'bg-transparent border-[#e2dec9] hover:bg-[#efede0]/20'
                      }`}
                    >
                      {isNext && (
                        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#5a5a40]" />
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center space-x-3.5">
                          {prayer.status === 'completed' ? (
                            <div className="p-2.5 bg-white border border-[#d6d2b5] text-[#5a5a40] rounded-xl">
                              <CheckCircle2 size={16} />
                            </div>
                          ) : prayer.status === 'snoozed' ? (
                            <div className="p-2.5 bg-white border border-[#e2dec9] text-[#c2a44d] rounded-xl animate-pulse">
                              <Moon size={16} />
                            </div>
                          ) : (
                            <div className={`p-2.5 rounded-xl border ${
                              isNext 
                                ? 'bg-white border-[#5a5a40] text-[#5a5a40]' 
                                : 'bg-white border-[#e2dec9] text-[#8a8a6d]'
                            }`}>
                              <Clock size={16} />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-bold font-serif text-[#5a5a40]">{prayer.name}</span>
                              {isNext && (
                                <span className="bg-[#5a5a40] text-white text-[9px] font-sans font-black tracking-widest px-2 py-0.5 rounded uppercase">UPCOMING</span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#8a8a6d] mt-1 font-sans">
                              {prayer.status === 'completed' ? (
                                <span className="text-[#5a5a40] font-medium">Completed on time at {prayer.actualPrayedTime}</span>
                              ) : prayer.status === 'snoozed' ? (
                                <span className="text-[#c2a44d] font-semibold">Snoozed until {prayer.snoozedUntil}</span>
                              ) : (
                                <span>Waiting for alarm call</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Timing action toggling */}
                        <div className="flex items-center space-x-2.5 ml-auto sm:ml-0">
                          {isEditing ? (
                            <div className="flex items-center space-x-2 bg-[#fdfbf7] p-1 rounded-xl border border-[#e2dec9]">
                              <input 
                                type="text"
                                className="w-16 bg-white border-none rounded px-2.5 py-1 text-xs text-center text-[#5a5a40] font-mono font-bold outline-none"
                                value={editedTime}
                                onChange={(e) => setEditedTime(e.target.value)}
                              />
                              <button 
                                onClick={handleSaveEditedTime}
                                className="bg-[#5a5a40] text-white text-xs font-bold px-2 rounded cursor-pointer leading-6"
                              >
                                Okay
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2.5">
                              {/* Alarm Dial time display click-to-edit */}
                              <button 
                                onClick={() => handleStartEditingTime(prayer)}
                                className="font-mono text-xs text-[#5a5a40] font-extrabold bg-[#efede0]/60 border border-[#d6d2b5] hover:border-[#8a8a6d] px-3 py-1.5 rounded-xl transition"
                                title="Click to edit timing coordinates"
                              >
                                {prayer.time}
                              </button>
                              
                              {/* Lockdown triggers */}
                              {prayer.status !== 'completed' && (
                                <div className="flex items-center space-x-1.5">
                                  <button
                                    onClick={() => handleSimulateLockdown(prayer.id)}
                                    className="text-[10px] bg-transparent border border-[#5a5a40] hover:bg-[#5a5a40] hover:text-white text-[#5a5a40] px-2.5 py-1.5 rounded-xl transition font-sans font-extrabold tracking-wider uppercase cursor-pointer"
                                    title="Verify the lockscreen overlay flow"
                                  >
                                    Test Alarm
                                  </button>

                                  <button
                                    onClick={() => handleAlarmComplete(prayer.id, 50)}
                                    className="text-[10px] bg-[#5a5a40] hover:opacity-90 text-white px-2.5 py-1.5 rounded-xl transition font-sans font-extrabold tracking-wider uppercase cursor-pointer"
                                  >
                                    Complete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

          </div>

          {/* RIGHT PANELS COLUMN: Audio customizer, snooze limits, history logs */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* TONES CUSTOMIZER CARD */}
            <div className="bg-[#f5f2e8] border border-[#e2dec9] rounded-[2.5rem] p-6 sm:p-8 shadow-xs">
              <h3 className="text-lg font-bold font-serif text-[#5a5a40] flex items-center space-x-2 pb-4 border-b border-[#e2dec9]">
                <Settings className="text-[#8a8a6d]" size={16} />
                <span>Custom Ringtone & Reminders</span>
              </h3>

              <div className="space-y-5 pt-5">
                {/* Tone Tracks List */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#8a8a6d] font-sans tracking-widest uppercase block">SELECT CUSTOM ADHAN RING CHIME</label>
                  <div className="space-y-3">
                    {RINGTONES.map((tone) => {
                      const isSelected = stats.currentRingtoneId === tone.id;
                      return (
                        <div 
                          key={tone.id}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border transition ${
                            isSelected 
                              ? 'bg-white border-[#5a5a40]/60 shadow-xs' 
                              : 'bg-transparent border-[#e2dec9] hover:border-[#8a8a6d]/60'
                          }`}
                        >
                          <div className="flex-1 pr-2">
                            <h4 className="text-xs font-bold text-[#5a5a40] flex items-center space-x-1.5">
                              <span className="font-serif">{tone.name}</span>
                              {isSelected && <span className="text-[9px] bg-[#efede0] text-[#5a5a40] border border-[#d6d2b5] px-1.5 py-0.2 rounded font-sans font-extrabold tracking-wide">ACTIVE</span>}
                            </h4>
                            <p className="text-[10px] text-[#8a8a6d] mt-1 leading-relaxed">{tone.description}</p>
                          </div>
                          
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleTestRingtone(tone.id)}
                              className="p-1.5 bg-white hover:bg-[#efede0] text-[#5a5a40] rounded-xl border border-[#e2dec9] cursor-pointer"
                              title="Listen preview notes"
                            >
                              <Play size={10} />
                            </button>
                            <button
                              onClick={() => handleSelectRingtone(tone.id)}
                              disabled={isSelected}
                              className={`text-[9px] font-bold font-sans uppercase tracking-widest px-2.5 py-1.5 rounded-xl transition cursor-pointer ${
                                isSelected 
                                  ? 'bg-[#efede0] text-[#8a8a6d] cursor-default' 
                                  : 'bg-[#5a5a40] text-white hover:opacity-90'
                              }`}
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Remind Later Limits selector */}
                <div className="space-y-3 pt-3 border-t border-[#e2dec9]">
                  <label className="text-[10px] font-bold text-[#8a8a6d] font-sans tracking-widest uppercase block flex justify-between">
                    <span>REMIND ME LATER SNOOZE LIMIT</span>
                    <span className="text-[#5a5a40] font-extrabold font-mono">{snoozeDuration} Minutes</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[2, 5, 10, 15].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => {
                          setSnoozeDuration(mins);
                          showToast(`Snooze interval set to ${mins} minutes`);
                        }}
                        className={`py-2 text-[10px] font-sans font-bold tracking-wider rounded-xl transition cursor-pointer border ${
                          snoozeDuration === mins 
                            ? 'bg-[#5a5a40] text-white border-[#5a5a40]' 
                            : 'bg-white border-[#e2dec9] text-[#8a8a6d] hover:border-[#8a8a6d]/60'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* AUDIT ACTIONS TRAIL */}
            <div className="bg-[#f5f2e8] border border-[#e2dec9] rounded-[2.5rem] p-6 shadow-xs">
              <h3 className="text-base font-bold font-serif text-[#5a5a40] flex items-center space-x-2 pb-3 border-b border-[#e2dec9]">
                <Award className="text-[#8a8a6d]" size={16} />
                <span>Device Audit Logging Trail</span>
              </h3>

              <ul className="space-y-3 pt-4 max-h-[160px] overflow-y-auto pr-1">
                {history.length === 0 ? (
                  <li className="text-[#8a8a6d] text-xs italic text-center py-4 font-serif">
                    Your completed prayers and snooze vow histories display here.
                  </li>
                ) : (
                  history.slice(0, 10).map((log) => (
                    <li 
                      key={log.id}
                      className="flex items-center justify-between text-xs py-2 border-b border-[#e2dec9]/60"
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${log.status === 'completed' ? 'bg-[#c2a44d]' : 'bg-[#8a8a6d]'}`}></span>
                        <span className="text-[#5a5a40] font-serif font-bold">
                          {log.prayerName} — {log.status === 'completed' ? 'Prayed' : 'Snoozed'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px] font-mono">
                        <span className="text-[#8a8a6d]">
                          {new Date(log.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {log.points > 0 && (
                          <span className="text-[#5a5a40] font-sans font-bold bg-[#efede0] px-1.5 py-0.5 rounded border border-[#d6d2b5]">+{log.points} pts</span>
                        )}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

          </div>

        </div>

        {/* REWARDS WALLPAPER SHOP SECTION */}
        <section className="w-full mt-8">
          <WallpaperStore
            stats={stats}
            onSelectWallpaper={handleSelectWallpaper}
            onUnlockWallpaper={handleUnlockWallpaper}
          />
        </section>

        {/* BOTTOM TIP BLOCK & DEDICATED CREDIT FOOTER */}
        <footer className="pt-8 border-t border-[#e2dec9] text-center text-xs space-y-3.5">
          <div className="bg-[#efede0]/60 p-4 rounded-2xl border border-[#d6d2b5] max-w-xl mx-auto">
            <p className="text-[11px] font-sans leading-relaxed text-[#5a5a40] font-medium">
              <span className="font-extrabold uppercase tracking-widest text-[#c2a44d] mr-1.5">Tip:</span> 
              Completing daily streaks increases the high-score point multiplier, accelerating wallpaper unlocks in the shop!
            </p>
          </div>
          
          <div className="text-[11px] font-sans uppercase tracking-[0.3em] font-bold text-[#8a8a6d]/80 py-2">
            Dedicated to Mindfulness & Spiritual Punctuality
          </div>
        </footer>

      </div>

      {/* FULL-SCREEN UN-DISMISSIBLE ALARM LOCK OVERLAY */}
      <AnimatePresence>
        {activeAlarmPrayer && (
          <LockScreen
            prayer={activeAlarmPrayer}
            ringtoneId={stats.currentRingtoneId}
            snoozeDuration={snoozeDuration}
            onComplete={handleAlarmComplete}
            onSnooze={handleAlarmSnooze}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
