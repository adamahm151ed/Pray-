export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerItem {
  id: PrayerId;
  name: string;
  time: string; // "HH:MM"
  status: 'pending' | 'completed' | 'missed' | 'snoozed';
  snoozedUntil?: string; // "HH:MM"
  actualPrayedTime?: string;
  pointsReceived?: number;
}

export interface Wallpaper {
  id: string;
  name: string;
  cost: number;
  imageSrc: string;
  unlocked: boolean;
  themeClass: string; // CSS style overrides or wallpaper settings
  description: string;
}

export interface Ringtone {
  id: string;
  name: string;
  description: string;
  frequencies: number[]; // Frequencies to play for synthetic harmony
  tempo: number; // Duration of notes
}

export interface UserStats {
  points: number;
  streak: number; // Consecutive days with 5/5 prayers
  lastActiveDate?: string; // "YYYY-MM-DD"
  unlockedWallpapers: string[]; // List of wallpaper IDs
  activeWallpaperId?: string; // ID of selected wallpaper
  currentRingtoneId: string; // Selected alarm ringtone ID
}

export interface PrayerHistoryLog {
  id: string;
  date: string; // "YYYY-MM-DD"
  prayerId: PrayerId;
  prayerName: string;
  status: 'completed' | 'snoozed';
  points: number;
  timestamp: string; // ISO string
}
