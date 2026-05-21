import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Moon, BellOff, CheckCircle2, Volume2, ShieldCheck, Cpu, Smartphone } from 'lucide-react';
import { PrayerItem, Ringtone } from '../types';
import { startAlarmAudio, stopAudio, RINGTONES } from '../utils/audio';

interface LockScreenProps {
  prayer: PrayerItem;
  ringtoneId: string;
  snoozeDuration: number;
  onComplete: (prayerId: string, points: number) => void;
  onSnooze: (prayerId: string, minutes: number) => void;
}

export default function LockScreen({
  prayer,
  ringtoneId,
  snoozeDuration,
  onComplete,
  onSnooze
}: LockScreenProps) {
  const [typedOath, setTypedOath] = useState('');
  const [isHoldingUnlock, setIsHoldingUnlock] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(true);
  
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // The strict oath phrase required
  const REQUIRED_OATH = `I swear to Allah that I have prayed my ${prayer.name} prayer`;

  const currentRingtone = RINGTONES.find(r => r.id === ringtoneId) || RINGTONES[0];

  // Start alarm audio on mount
  useEffect(() => {
    startAlarmAudio(ringtoneId);
    setIsPlayingAudio(true);
    return () => {
      stopAudio();
    };
  }, [ringtoneId, prayer.id]);

  // Handle the press-and-hold mechanic
  useEffect(() => {
    if (isHoldingUnlock) {
      holdIntervalRef.current = setInterval(() => {
        setHoldProgress((prev) => {
          if (prev >= 100) {
            clearInterval(holdIntervalRef.current!);
            handleUnlockSuccess();
            return 100;
          }
          return prev + 5; // Takes 2 seconds to fill
        });
      }, 100);
    } else {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
      setHoldProgress(0);
    }

    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, [isHoldingUnlock]);

  const toggleMute = () => {
    if (isPlayingAudio) {
      stopAudio();
      setIsPlayingAudio(false);
    } else {
      startAlarmAudio(ringtoneId);
      setIsPlayingAudio(true);
    }
  };

  const cleanString = (str: string) => {
    return str.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  };

  const handleUnlockSuccess = () => {
    const userWords = cleanString(typedOath);
    const requiredWords = cleanString(REQUIRED_OATH);

    if (userWords !== requiredWords) {
      setErrorMessage(`Your oath text does not match. Please write exactly: "${REQUIRED_OATH}"`);
      setIsHoldingUnlock(false);
      return;
    }

    // Success! Stop audio and trigger completion
    stopAudio();
    onComplete(prayer.id, 50); // Give 50 points
  };

  const handleQuickSnooze = () => {
    stopAudio();
    onSnooze(prayer.id, snoozeDuration);
  };

  const handleFillOath = () => {
    setTypedOath(REQUIRED_OATH);
    setErrorMessage('');
  };

  return (
    <div 
      id="lockscreen-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fdfbf7]/98 text-[#5a5a40] p-4 overflow-y-auto font-sans"
    >
      <div className="absolute inset-0 bg-radial from-[#efede0]/30 via-[#fdfbf7] to-[#fdfbf7] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl relative flex flex-col items-center text-center space-y-6 bg-[#f5f2e8] border border-[#e2dec9] p-6 sm:p-10 rounded-[2.5rem] shadow-xl"
      >
        {/* Floating Alarms Status Indicator */}
        <div className="absolute top-5 right-5 flex items-center space-x-2 bg-[#efede0] px-3.5 py-1.5 rounded-full border border-[#d6d2b5]">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c2a44d]"></span>
          </span>
          <span className="text-[11px] font-sans font-bold tracking-wider text-[#5A5A40] uppercase">LOCKDOWN ZONE</span>
        </div>

        {/* Lock Icon */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="p-5 bg-white border border-[#e2dec9] rounded-full text-[#5a5a40] shadow-sm"
        >
          <ShieldAlert size={44} />
        </motion.div>

        {/* Locked Alert Description */}
        <div>
          <span className="text-xs uppercase tracking-[0.2em] font-sans font-bold text-[#8a8a6d]">Current Focus</span>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#5a5a40] mt-1 leading-tight">
            Time for <span className="italic font-light">{prayer.name}</span>
          </h1>
          <p className="text-sm text-[#8a8a6d] mt-3 max-w-sm mx-auto leading-relaxed">
            Your attention filter has restricted client applications to ensure you can fulfill your prayer vow on time.
          </p>
        </div>

        {/* Custom audio feedback */}
        <div className="flex items-center space-x-3 bg-white border border-[#e2dec9] px-4 py-2 rounded-xl text-xs">
          <Volume2 size={15} className={isPlayingAudio ? "text-[#c2a44d] animate-bounce" : "text-[#8a8a6d]"} />
          <span className="font-mono text-[#5a5a40] font-medium">Chime tone: {currentRingtone.name}</span>
          <button 
            onClick={toggleMute}
            className="text-[10px] bg-[#f5f2e8] hover:bg-[#efede0] text-[#5a5a40] border border-[#d6d2b5] px-2.5 py-1 rounded font-bold uppercase transition cursor-pointer"
          >
            {isPlayingAudio ? 'Mute' : 'Unmute'}
          </button>
        </div>

        {/* Mocking phone lockdown */}
        <div className="w-full bg-white border border-[#e2dec9] rounded-2xl p-4 text-left">
          <div className="flex items-center space-x-2 text-[#5a5a40] font-sans text-xs font-bold mb-3 border-b border-[#e2dec9] pb-2 uppercase tracking-wide">
            <Smartphone size={14} />
            <span>ATTENTION ISOLATOR (PORTABLE APPS SUSPENDED)</span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center text-[10px] text-[#8a8a6d] font-sans">
            <div className="flex flex-col items-center p-2 bg-[#fdfbf7] rounded-lg border border-[#e2dec9] opacity-50">
              <span className="text-xs">✖</span>
              <span>Instagram</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-[#fdfbf7] rounded-lg border border-[#e2dec9] opacity-50">
              <span className="text-xs">✖</span>
              <span>Facebook</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-[#fdfbf7] rounded-lg border border-[#e2dec9] opacity-50">
              <span className="text-xs">✖</span>
              <span>TikTok</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-[#fdfbf7] rounded-lg border border-[#e2dec9] opacity-50">
              <span className="text-xs">✖</span>
              <span>Twitter</span>
            </div>
          </div>
          <p className="text-[11px] text-[#8a8a6d] italic mt-2 text-center font-serif">
            "Your attention filters are locked. Social services are temporarily paused."
          </p>
        </div>

        {/* The Swear swearing oath input */}
        <div className="w-full space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#5a5a40] font-bold uppercase tracking-wider font-sans">Write Solemn Prayer Oath</span>
            <button
              onClick={handleFillOath}
              className="text-[#c2a44d] hover:text-[#5a5a40] transition text-[11px] font-sans font-bold underline"
            >
              [Auto Fill Oath]
            </button>
          </div>
          
          <div className="flex flex-col space-y-2">
            <textarea
              className="w-full min-h-[70px] bg-white border border-[#e2dec9] focus:border-[#5a5a40] focus:ring-1 focus:ring-[#5a5a40] rounded-xl p-3 text-sm text-[#5a5a40] outline-none placeholder-[#8a8a6d]/60 transition duration-150 resize-none font-serif leading-relaxed"
              placeholder={`Type word-for-word: "${REQUIRED_OATH}"`}
              value={typedOath}
              onChange={(e) => {
                setTypedOath(e.target.value);
                setErrorMessage('');
              }}
            />
            
            {errorMessage && (
              <motion.p 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-rose-600 text-left font-serif"
              >
                ⚠️ {errorMessage}
              </motion.p>
            )}
          </div>
        </div>

        {/* The unlock hold button or snooze option */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Snooze button styled border */}
          <button
            onClick={handleQuickSnooze}
            className="flex items-center justify-center space-x-2 bg-transparent border-2 border-[#5a5a40] text-[#5a5a40] hover:bg-[#5a5a40] hover:text-white font-sans font-bold py-3.5 px-4 rounded-xl transition duration-150 cursor-pointer text-sm"
          >
            <Moon size={16} />
            <span>Snooze (+{snoozeDuration}m)</span>
          </button>

          {/* Swear Confirm Button */}
          <button
            onMouseDown={() => setIsHoldingUnlock(true)}
            onMouseUp={() => setIsHoldingUnlock(false)}
            onMouseLeave={() => setIsHoldingUnlock(false)}
            onTouchStart={() => setIsHoldingUnlock(true)}
            onTouchEnd={() => setIsHoldingUnlock(false)}
            className="relative flex flex-col items-center justify-center bg-[#5a5a40] text-white hover:opacity-95 font-sans font-bold py-3.5 px-4 rounded-xl transition overflow-hidden cursor-pointer select-none text-sm"
          >
            {/* Background slider progress */}
            <div 
              className="absolute left-0 top-0 bottom-0 bg-[#454530] transition-all pointer-events-none"
              style={{ width: `${holdProgress}%` }}
            />

            <div className="relative z-10 flex items-center space-x-2">
              <ShieldCheck size={18} />
              <span>{isHoldingUnlock ? 'Verifying Oath...' : 'I HAVE PRAYED (HOLD)'}</span>
            </div>
            <span className="relative z-10 text-[10px] text-[#e2dec9] font-sans font-normal mt-0.5">
              Press & hold 2s
            </span>
          </button>
        </div>

        {/* Quick reminder message */}
        <div className="text-[11px] text-[#8a8a6d] font-serif leading-relaxed italic border-t border-[#e2dec9] pt-4 w-full">
          "Verily, the prayer is enjoined on the believers at fixed hours." — Surah An-Nisa [4:103]
        </div>
      </motion.div>
    </div>
  );
}
